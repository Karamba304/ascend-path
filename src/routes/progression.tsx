import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app/AppShell";
import { XpBar } from "@/components/app/XpBar";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "@/components/app/states";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getProgression } from "@/lib/api/app.functions";
import { labelFor } from "@/lib/engine/profile-manager";

export const Route = createFileRoute("/progression")({
  head: () => ({
    meta: [
      { title: "Progression — ASCEND" },
      {
        name: "description",
        content: "Ta progression dans l'application et ta progression personnelle, clairement séparées.",
      },
      { property: "og:title", content: "Progression — ASCEND" },
      { property: "og:description", content: "XP et niveaux d'un côté, capacité réelle de l'autre." },
    ],
  }),
  component: ProgressionPage,
});

function ProgressionPage() {
  const { loading, session } = useRequireAuth();
  const fetchProgression = useServerFn(getProgression);
  const query = useQuery({
    queryKey: ["progression"],
    queryFn: () => fetchProgression(),
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
        <ErrorPanel message="Progression indisponible." onRetry={() => query.refetch()} />
      </AppShell>
    );

  const data = query.data;
  const levels = [...(data.levels ?? [])].sort((a, b) => b.value - a.value);

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">Progression</h1>

      <section className="panel mt-5 animate-rise p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Progression dans l'application
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          XP et niveaux mesurent ton avancée dans ASCEND — jamais ta compétence réelle.
        </p>
        <XpBar className="mt-4" totalXp={data.profile?.total_xp ?? 0} />

        <div className="mt-5 grid grid-cols-3 gap-4 text-sm">
          <Stat label="XP totale" value={`${data.profile?.total_xp ?? 0}`} />
          <Stat label="Missions terminées" value={`${data.missionStats.done}`} />
          <Stat label="Temps réalisé" value={`${data.missionStats.minutes} min`} />
        </div>

        {(data.levelEvents ?? []).length > 0 ? (
          <div className="mt-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Niveaux atteints
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {data.levelEvents.map((event: { id: string; level: number; date: string }) => (
                <li key={event.id} className="flex justify-between border-b border-border/50 pb-1">
                  <span>Niveau {event.level}</span>
                  <span className="text-muted-foreground">{formatDate(event.date)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="panel mt-4 animate-rise p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Progression personnelle
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Estimations internes qui déterminent la difficulté de tes missions. Ce ne sont pas des
          mesures scientifiques absolues.
        </p>

        {!data.objective ? (
          <EmptyPanel title="Aucun objectif actif">
            <p>Crée un objectif pour suivre ta progression personnelle.</p>
          </EmptyPanel>
        ) : (
          <>
            <p className="mt-4 font-display text-base font-semibold">{data.objective.title}</p>
            <div className="mt-4 space-y-3">
              {levels.map((level) => (
                <div key={level.metric}>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{labelFor(level.metric)}</span>
                    <span>{level.value}/100</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${level.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Évaluations</p>
              {(data.tests ?? []).length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Aucune évaluation planifiée.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {data.tests.map((test) => (
                    <li key={test.id} className="flex justify-between border-b border-border/50 pb-1">
                      <span>{test.title}</span>
                      <span className="text-muted-foreground">
                        {test.status === "done"
                          ? `${test.result ?? "—"} ${test.unit ?? ""} · ${formatDate(test.completed_date)}`
                          : `prévue ${test.planned_date ?? "—"}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </section>

      {(data.challenges ?? []).length > 0 ? (
        <section className="panel mt-4 animate-rise p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Challenges</p>
          <ul className="mt-3 space-y-3 text-sm">
            {data.challenges.map(
              (challenge: {
                id: string;
                title: string;
                progress: number;
                target: number;
                reward_xp: number;
                status: string;
              }) => (
                <li key={challenge.id}>
                  <div className="flex justify-between">
                    <span>{challenge.title}</span>
                    <span className="text-muted-foreground">
                      {challenge.progress}/{challenge.target} · +{challenge.reward_xp} XP
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-xp"
                      style={{
                        width: `${Math.min(100, (challenge.progress / Math.max(1, challenge.target)) * 100)}%`,
                      }}
                    />
                  </div>
                </li>
              ),
            )}
          </ul>
        </section>
      ) : null}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-base font-semibold">{value}</p>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}
