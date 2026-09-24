import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app/AppShell";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "@/components/app/states";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getHistory } from "@/lib/api/app.functions";
import { DIFFICULTY_LABEL, type Difficulty } from "@/lib/domain/xp";

export const Route = createFileRoute("/historique")({
  head: () => ({
    meta: [
      { title: "Historique — ASCEND" },
      { name: "description", content: "Toutes tes missions, tes retours, ton XP et tes niveaux atteints." },
      { property: "og:title", content: "Historique — ASCEND" },
      { property: "og:description", content: "Ce que tu as fait, reporté ou supprimé, et pourquoi." },
    ],
  }),
  component: HistoryPage,
});

const STATUS_LABEL: Record<string, string> = {
  done: "Terminée",
  not_done: "Non terminée",
  deleted: "Supprimée",
};

const REASON_LABEL: Record<string, string> = {
  pas_assez_de_temps: "Pas assez de temps",
  trop_difficile: "Trop difficile",
  trop_facile: "Trop facile",
  impossible_actuellement: "Impossible actuellement",
  hors_objectif: "Hors objectif",
  autre: "Autre",
};

const FEEDBACK_LABEL: Record<string, string> = {
  trop_facile: "Trop facile",
  comme_prevu: "Comme prévu",
  trop_difficile: "Trop difficile",
};

function HistoryPage() {
  const { loading, session } = useRequireAuth();
  const fetchHistory = useServerFn(getHistory);
  const query = useQuery({
    queryKey: ["history"],
    queryFn: () => fetchHistory(),
    enabled: Boolean(session),
  });

  if (loading) return null;
  if (query.isPending)
    return (
      <AppShell>
        <LoadingPanel />
      </AppShell>
    );
  if (query.isError)
    return (
      <AppShell>
        <ErrorPanel message="Historique indisponible." onRetry={() => query.refetch()} />
      </AppShell>
    );

  const { results, levelEvents, tests } = query.data;

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">Historique</h1>

      <section className="mt-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Missions</p>
        {results.length === 0 ? (
          <EmptyPanel title="Aucune mission enregistrée">
            <p>Ton historique se remplira dès ta première mission.</p>
          </EmptyPanel>
        ) : (
          <ul className="mt-3 space-y-3">
            {results.map((entry) => {
              const mission = entry.missions as
                | { title: string; difficulty: Difficulty; duration: number; xp: number }
                | null;
              return (
                <li key={entry.id} className="panel p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-sm font-semibold">
                      {mission?.title ?? "Mission"}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {STATUS_LABEL[entry.final_status] ?? entry.final_status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {new Date(entry.completion_date).toLocaleDateString("fr-FR")}
                    {mission ? ` · ${mission.duration} min · ${DIFFICULTY_LABEL[mission.difficulty]}` : ""}
                    {entry.final_status === "done" && mission ? ` · +${mission.xp} XP` : ""}
                  </p>
                  {entry.perceived_difficulty ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ressenti : {FEEDBACK_LABEL[entry.perceived_difficulty] ?? entry.perceived_difficulty}
                    </p>
                  ) : null}
                  {entry.not_done_reason ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Raison : {REASON_LABEL[entry.not_done_reason] ?? entry.not_done_reason}
                    </p>
                  ) : null}
                  {entry.comment ? (
                    <p className="mt-1 text-xs italic text-muted-foreground">« {entry.comment} »</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {levelEvents.length > 0 ? (
        <section className="mt-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Niveaux atteints</p>
          <ul className="mt-3 space-y-1 text-sm">
            {levelEvents.map((event: { id: string; level: number; date: string }) => (
              <li key={event.id} className="flex justify-between border-b border-border/50 pb-1">
                <span>Niveau {event.level}</span>
                <span className="text-muted-foreground">
                  {new Date(event.date).toLocaleDateString("fr-FR")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tests.length > 0 ? (
        <section className="mt-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Évaluations</p>
          <ul className="mt-3 space-y-1 text-sm">
            {tests.map(
              (test: {
                id: string;
                title: string;
                result: number | null;
                unit: string | null;
                completed_date: string | null;
              }) => (
                <li key={test.id} className="flex justify-between border-b border-border/50 pb-1">
                  <span>{test.title}</span>
                  <span className="text-muted-foreground">
                    {test.result ?? "—"} {test.unit ?? ""} ·{" "}
                    {test.completed_date
                      ? new Date(test.completed_date).toLocaleDateString("fr-FR")
                      : "—"}
                  </span>
                </li>
              ),
            )}
          </ul>
        </section>
      ) : null}
    </AppShell>
  );
}
