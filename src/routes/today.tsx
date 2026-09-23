import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Flame, RefreshCw, SlidersHorizontal } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { XpBar } from "@/components/app/XpBar";
import { MissionCard, type MissionCardData } from "@/components/app/MissionCard";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "@/components/app/states";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { adaptToday, getSnapshot, regenerateToday } from "@/lib/api/app.functions";
import { labelFor } from "@/lib/engine/profile-manager";
import { resourcesFor } from "@/lib/onboarding/questions";
import type { Domain, ResourceTag } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/today")({
  head: () => ({
    meta: [
      { title: "Aujourd'hui — ASCEND" },
      { name: "description", content: "Tes missions du jour, ton temps restant et ta progression." },
      { property: "og:title", content: "Aujourd'hui — ASCEND" },
      { property: "og:description", content: "Les missions du jour, choisies pour ton objectif." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { loading, session } = useRequireAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const snapshot = useServerFn(getSnapshot);
  const regenerate = useServerFn(regenerateToday);
  const adapt = useServerFn(adaptToday);
  const [contextOpen, setContextOpen] = useState(false);

  const query = useQuery({
    queryKey: ["snapshot"],
    queryFn: () => snapshot(),
    enabled: Boolean(session),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => regenerate(),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["snapshot"] });
      toast.success(
        result.created > 0
          ? `Journée régénérée : ${result.created} mission(s).`
          : "Aucune mission pertinente à ajouter aujourd'hui.",
      );
    },
    onError: () => toast.error("Régénération impossible pour le moment."),
  });

  const adaptMutation = useMutation({
    mutationFn: (payload: { unavailable: ResourceTag[]; availableMinutesToday: number | null }) =>
      adapt({ data: payload }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["snapshot"] });
      setContextOpen(false);
      toast.success(
        result.rebuilt
          ? "Journée reconstruite avec ton nouveau contexte."
          : result.adapted > 0
            ? `${result.adapted} mission(s) adaptée(s).`
            : "Tes missions restent réalisables : rien à changer.",
      );
    },
    onError: () => toast.error("Adaptation impossible pour le moment."),
  });

  if (loading) return null;

  if (query.isPending) {
    return (
      <AppShell>
        <LoadingPanel label="Construction de ta journée…" />
      </AppShell>
    );
  }

  if (query.isError) {
    return (
      <AppShell>
        <ErrorPanel
          message="Impossible de charger ta journée. Vérifie ta connexion."
          onRetry={() => query.refetch()}
        />
      </AppShell>
    );
  }

  const data = query.data;

  if (!data.objective) {
    return (
      <AppShell>
        <EmptyPanel title="Tu n'as pas encore d'objectif actif">
          <p>Définis ton objectif pour recevoir ta première journée de missions.</p>
          <button
            onClick={() => navigate({ to: "/onboarding" })}
            className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Définir mon objectif
          </button>
        </EmptyPanel>
      </AppShell>
    );
  }

  const missions = (data.missions ?? []) as MissionCardData[];
  const pending = missions.filter((m) => m.status === "todo" || m.status === "in_progress");
  const done = missions.filter((m) => m.status === "done");
  const remainingMinutes = pending.reduce((acc, m) => acc + m.duration, 0);
  const xpToday = done.reduce((acc, m) => acc + m.xp, 0);
  const levels = [...(data.levels ?? [])].sort((a, b) => a.value - b.value);
  const personalLevel = levels.length
    ? Math.round(levels.reduce((a, l) => a + l.value, 0) / levels.length)
    : null;
  const resourceOptions = resourcesFor(data.objective.domain as Domain);

  return (
    <AppShell>
      <section className="panel animate-rise p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Bonjour</p>
            <h1 className="font-display text-2xl font-bold">{data.profile?.username ?? "toi"}</h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="size-3.5 text-warning" />
            {data.profile?.current_streak ?? 0} j · record {data.profile?.best_streak ?? 0}
          </div>
        </div>
        <XpBar className="mt-5" totalXp={data.profile?.total_xp ?? 0} />
      </section>

      <section className="panel mt-4 animate-rise p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Objectif actif</p>
        <h2 className="mt-1 font-display text-lg font-semibold">{data.objective.title}</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Stat
            label="Niveau personnel"
            value={personalLevel === null ? "à évaluer" : `${personalLevel}/100`}
            hint="ta capacité réelle"
          />
          <Stat
            label="Missions terminées"
            value={`${done.length}/${missions.length}`}
            hint="aujourd'hui"
          />
          <Stat label="XP du jour" value={`+${xpToday}`} hint="permanente" />
          <Stat
            label="Échéance"
            value={data.objective.target_date ?? "aucune"}
            hint={data.objective.target_date ? "date visée" : "libre"}
          />
        </div>
        {levels.length > 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Priorités actuelles : {levels.slice(0, 3).map((l) => labelFor(l.metric)).join(", ")}
          </p>
        ) : null}
        {data.nextTest ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" /> Prochaine évaluation :{" "}
            {data.nextTest.planned_date ?? "à planifier"}
          </p>
        ) : null}
      </section>

      <section className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">
            {remainingMinutes > 0
              ? `${remainingMinutes} min de missions restantes`
              : "Journée terminée"}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setContextOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground"
            >
              <SlidersHorizontal className="size-3.5" /> Mon contexte a changé
            </button>
            <button
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3.5", regenerateMutation.isPending && "animate-spin")} />
              Régénérer
            </button>
          </div>
        </div>

        {data.budget ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Charge du jour : {data.budget.consumedLoad} / {data.budget.availableLoad} —
            la charge n'est pas du temps : elle tient compte de l'intensité et de tes derniers jours.
          </p>
        ) : null}

        {contextOpen ? (
          <ContextForm
            options={resourceOptions}
            defaultMinutes={data.objective.daily_time ?? 30}
            busy={adaptMutation.isPending}
            onSubmit={(payload) => adaptMutation.mutate(payload)}
          />
        ) : null}

        {data.context?.startsLater ? (
          <div className="panel mt-4 p-5 text-sm text-muted-foreground">
            Ta progression démarre le {data.objective.start_date}. D'ici là, aucune mission n'est
            générée et rien ne peut être manqué.
          </div>
        ) : null}

        {data.context?.dayOff && missions.length === 0 ? (
          <div className="panel mt-4 p-5 text-sm text-muted-foreground">
            Aujourd'hui n'est pas un de tes jours disponibles. Ton streak n'en souffre pas.
          </div>
        ) : null}

        {missions.length === 0 && !data.context?.startsLater && !data.context?.dayOff ? (
          <EmptyPanel title="Aucune mission pertinente aujourd'hui">
            <p>
              Mieux vaut ne rien ajouter que remplir ton temps. Si ton contexte a changé, indique-le
              ou régénère ta journée.
            </p>
          </EmptyPanel>
        ) : null}

        <div className="mt-4 space-y-3">
          {pending.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </div>

        {pending.length === 0 && done.length > 0 ? (
          <div className="panel mt-4 animate-rise p-6">
            <h3 className="font-display text-xl font-bold text-primary text-glow">JOURNÉE TERMINÉE</h3>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <Stat label="Temps réalisé" value={`${done.reduce((a, m) => a + m.duration, 0)} min`} />
              <Stat label="XP gagnée" value={`+${xpToday}`} />
              <Stat label="Missions" value={`${done.length}`} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Ce qui compte, c'est la régularité sur plusieurs jours, pas une journée parfaite.
            </p>
          </div>
        ) : null}

        {done.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
              Déjà fait aujourd'hui
            </h3>
            <div className="mt-3 space-y-3">
              {done.map((mission) => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-base font-semibold">{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ContextForm({
  options,
  defaultMinutes,
  busy,
  onSubmit,
}: {
  options: { value: ResourceTag; label: string }[];
  defaultMinutes: number;
  busy: boolean;
  onSubmit: (payload: { unavailable: ResourceTag[]; availableMinutesToday: number | null }) => void;
}) {
  const [unavailable, setUnavailable] = useState<ResourceTag[]>([]);
  const [minutes, setMinutes] = useState(defaultMinutes);

  return (
    <div className="panel mt-4 p-5">
      <p className="text-sm font-medium">Qu'est-ce qui n'est pas disponible aujourd'hui ?</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = unavailable.includes(option.value);
          return (
            <button
              key={option.value}
              onClick={() =>
                setUnavailable(
                  selected
                    ? unavailable.filter((r) => r !== option.value)
                    : [...unavailable, option.value],
                )
              }
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs",
                selected ? "border-destructive text-destructive" : "border-border text-muted-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="mt-5 text-sm font-medium">Temps réellement disponible : {minutes} min</p>
      <input
        type="range"
        min={5}
        max={180}
        step={5}
        value={minutes}
        onChange={(e) => setMinutes(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--primary)]"
      />
      <button
        onClick={() => onSubmit({ unavailable, availableMinutesToday: minutes })}
        disabled={busy}
        className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {busy ? "Adaptation…" : "Adapter ma journée"}
      </button>
    </div>
  );
}
