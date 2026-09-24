import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Clock, Flame, Sparkles } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { ErrorPanel, LoadingPanel } from "@/components/app/states";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  completeMission,
  getSnapshot,
  markMissionNotDone,
  startMission,
} from "@/lib/api/app.functions";
import { DIFFICULTY_LABEL, type Difficulty } from "@/lib/domain/xp";
import { FAMILY_LABEL, type Family } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mission/$missionId")({
  head: () => ({
    meta: [
      { title: "Mission — ASCEND" },
      { name: "description", content: "Détail de ta mission : pourquoi elle existe, ses étapes et sa récompense." },
      { property: "og:title", content: "Mission — ASCEND" },
      { property: "og:description", content: "Une mission avec une raison d'exister." },
    ],
  }),
  component: MissionPage,
});

type Phase = "detail" | "running" | "done" | "notdone";

const NOT_DONE_REASONS = [
  { value: "pas_assez_de_temps", label: "Pas assez de temps" },
  { value: "trop_difficile", label: "Trop difficile" },
  { value: "trop_facile", label: "Trop facile" },
  { value: "impossible_actuellement", label: "Impossible actuellement" },
  { value: "hors_objectif", label: "Ne correspond plus à mon objectif" },
  { value: "autre", label: "Autre" },
] as const;

function MissionPage() {
  const { missionId } = Route.useParams();
  const { loading, session } = useRequireAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const snapshot = useServerFn(getSnapshot);
  const start = useServerFn(startMission);
  const complete = useServerFn(completeMission);
  const notDone = useServerFn(markMissionNotDone);

  const [phase, setPhase] = useState<Phase>("detail");
  const [xpGained, setXpGained] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState<(typeof NOT_DONE_REASONS)[number]["value"]>("pas_assez_de_temps");
  const [redoChoice, setRedoChoice] = useState<"demain" | "deux_jours" | "date" | "supprimer">("demain");
  const [redoDate, setRedoDate] = useState("");
  const [wantReplacement, setWantReplacement] = useState(false);

  const query = useQuery({
    queryKey: ["snapshot"],
    queryFn: () => snapshot(),
    enabled: Boolean(session),
  });

  const startMutation = useMutation({
    mutationFn: () => start({ data: { missionId } }),
    onSuccess: () => setPhase("running"),
    onError: () => toast.error("Impossible de démarrer cette mission."),
  });

  const completeMutation = useMutation({
    mutationFn: (payload: {
      perceivedDifficulty?: "trop_facile" | "comme_prevu" | "trop_difficile" | null;
      comment?: string | null;
    }) => complete({ data: { missionId, ...payload } }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["snapshot"] });
      if (!feedbackSent) {
        setXpGained(result.xpGained ?? 0);
        setPhase("done");
      } else {
        toast.success("Merci, ton retour ajuste tes prochaines missions.");
        navigate({ to: "/today" });
      }
    },
    onError: () => toast.error("Validation impossible pour le moment."),
  });

  const notDoneMutation = useMutation({
    mutationFn: () =>
      notDone({
        data: {
          missionId,
          reason,
          comment: comment || null,
          redoDate: redoChoice === "supprimer" ? null : resolveRedoDate(redoChoice, redoDate),
          wantReplacement,
        },
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["snapshot"] });
      toast.success(
        result.replacement
          ? "Une mission de remplacement compatible a été ajoutée."
          : result.rescheduled
            ? "Mission reportée. Aucune XP retirée."
            : "Mission supprimée. Aucune XP retirée.",
      );
      navigate({ to: "/today" });
    },
    onError: () => toast.error("Action impossible pour le moment."),
  });

  if (loading) return null;
  if (query.isPending) {
    return (
      <AppShell>
        <LoadingPanel label="Chargement de la mission…" />
      </AppShell>
    );
  }
  if (query.isError) {
    return (
      <AppShell>
        <ErrorPanel message="Mission indisponible." onRetry={() => query.refetch()} />
      </AppShell>
    );
  }

  const mission = (query.data.missions ?? []).find((m: { id: string }) => m.id === missionId) as
    | (Record<string, unknown> & {
        id: string;
        title: string;
        description: string | null;
        duration: number;
        difficulty: Difficulty;
        xp: number;
        status: string;
        family: string | null;
        reason: string | null;
        steps: unknown;
        requires: unknown;
        skill: string | null;
      })
    | undefined;

  if (!mission) {
    return (
      <AppShell>
        <ErrorPanel message="Cette mission n'existe plus dans ta journée." />
      </AppShell>
    );
  }

  const steps = Array.isArray(mission.steps) ? (mission.steps as string[]) : [];
  const requires = Array.isArray(mission.requires) ? (mission.requires as string[]) : [];

  if (phase === "done") {
    return (
      <AppShell>
        <div className="panel animate-rise p-6 text-center">
          <h1 className="font-display text-2xl font-bold text-primary text-glow">MISSION TERMINÉE</h1>
          <p className="mt-3 animate-xp-pop font-display text-4xl font-bold text-xp">
            +{xpGained} XP
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Cette XP est définitivement acquise. Elle mesure ta progression dans l'application, pas
            ta valeur.
          </p>

          <div className="mt-8 text-left">
            <p className="text-sm font-medium">Comment était la difficulté ?</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["trop_facile", "Trop facile"],
                  ["comme_prevu", "Comme prévu"],
                  ["trop_difficile", "Trop difficile"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => {
                    setFeedbackSent(true);
                    completeMutation.mutate({ perceivedDifficulty: value, comment: comment || null });
                  }}
                  disabled={completeMutation.isPending}
                  className="rounded-xl border border-border px-4 py-3 text-sm hover:border-primary disabled:opacity-60"
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Commentaire (facultatif)"
              className="input-base mt-3 resize-none"
            />
            <button
              onClick={() => navigate({ to: "/today" })}
              className="mt-3 w-full rounded-xl border border-border py-2.5 text-sm text-muted-foreground"
            >
              Passer et revenir à Aujourd'hui
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (phase === "notdone") {
    return (
      <AppShell>
        <div className="panel animate-rise p-6">
          <h1 className="font-display text-xl font-bold">Mission non terminée</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Aucune XP déjà gagnée ne sera retirée. Ta réponse sert à mieux calibrer la suite.
          </p>

          <p className="mt-6 text-sm font-medium">Pourquoi ?</p>
          <div className="mt-2 space-y-2">
            {NOT_DONE_REASONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setReason(option.value)}
                className={cn(
                  "w-full rounded-xl border px-4 py-2.5 text-left text-sm",
                  reason === option.value
                    ? "border-primary bg-primary/10"
                    : "border-border text-muted-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p className="mt-6 text-sm font-medium">Veux-tu la refaire un autre jour ?</p>
          <div className="mt-2 space-y-2">
            {(
              [
                ["demain", "Demain"],
                ["deux_jours", "Dans 2 jours"],
                ["date", "Une date précise"],
                ["supprimer", "Non, supprimer cette mission"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setRedoChoice(value)}
                className={cn(
                  "w-full rounded-xl border px-4 py-2.5 text-left text-sm",
                  redoChoice === value
                    ? "border-primary bg-primary/10"
                    : "border-border text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
            {redoChoice === "date" ? (
              <input
                type="date"
                className="input-base"
                value={redoDate}
                onChange={(e) => setRedoDate(e.target.value)}
              />
            ) : null}
          </div>

          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Commentaire (facultatif)"
            className="input-base mt-4 resize-none"
          />

          <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={wantReplacement}
              onChange={(e) => setWantReplacement(e.target.checked)}
            />
            Proposer une mission de remplacement si une seule est réellement pertinente
          </label>

          <button
            onClick={() => notDoneMutation.mutate()}
            disabled={notDoneMutation.isPending || (redoChoice === "date" && !redoDate)}
            className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {notDoneMutation.isPending ? "Enregistrement…" : "Valider"}
          </button>
          <button
            onClick={() => setPhase("detail")}
            className="mt-3 w-full rounded-xl border border-border py-2.5 text-sm text-muted-foreground"
          >
            Annuler
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <button
        onClick={() => navigate({ to: "/today" })}
        className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Aujourd'hui
      </button>

      <div className="panel animate-rise p-5 sm:p-7">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {mission.family ? (FAMILY_LABEL[mission.family as Family] ?? mission.family) : "Mission"}
          {query.data.objective ? ` · ${query.data.objective.title}` : ""}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">{mission.title}</h1>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" /> {mission.duration} min
          </span>
          <span className="flex items-center gap-1.5">
            <Flame className="size-3.5" /> {DIFFICULTY_LABEL[mission.difficulty]}
          </span>
          <span className="flex items-center gap-1.5 text-xp">
            <Sparkles className="size-3.5" /> +{mission.xp} XP
          </span>
        </div>

        {mission.description ? (
          <p className="mt-5 text-sm text-foreground/90">{mission.description}</p>
        ) : null}

        {mission.reason ? (
          <div className="mt-5 rounded-xl border border-border/70 bg-surface-strong/40 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Pourquoi cette mission
            </p>
            <p className="mt-1.5 text-sm">{mission.reason}</p>
          </div>
        ) : null}

        {requires.length > 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Matériel / environnement : {requires.join(", ")}
          </p>
        ) : null}

        {steps.length > 0 ? (
          <div className="mt-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Étapes</p>
            <ol className="mt-2 space-y-1.5 text-sm text-foreground/90">
              {steps.map((step, index) => (
                <li key={index}>
                  {index + 1}. {step}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <p className="mt-6 text-sm italic text-muted-foreground">
          {phase === "running"
            ? "Tu es dedans. Fais la mission, rien d'autre."
            : "Une seule chose à faire maintenant : cette mission."}
        </p>

        {mission.status === "done" ? (
          <p className="mt-6 rounded-xl border border-border p-4 text-sm text-success">
            Mission déjà terminée aujourd'hui. Elle ne peut pas être validée deux fois.
          </p>
        ) : phase === "running" ? (
          <div className="mt-6 space-y-3">
            <button
              onClick={() => completeMutation.mutate({})}
              disabled={completeMutation.isPending}
              className="w-full rounded-xl bg-primary py-3.5 font-display text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {completeMutation.isPending ? "Validation…" : "J'AI TERMINÉ"}
            </button>
            <button
              onClick={() => setPhase("notdone")}
              className="w-full rounded-xl border border-border py-3 text-sm text-muted-foreground"
            >
              Je n'ai pas terminé
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="w-full rounded-xl bg-primary py-3.5 font-display text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {startMutation.isPending ? "…" : "COMMENCER"}
            </button>
            <button
              onClick={() => setPhase("notdone")}
              className="w-full rounded-xl border border-border py-3 text-sm text-muted-foreground"
            >
              Je ne peux pas la faire
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function resolveRedoDate(
  choice: "demain" | "deux_jours" | "date" | "supprimer",
  custom: string,
): string | null {
  if (choice === "supprimer") return null;
  if (choice === "date") return custom || null;
  const offset = choice === "demain" ? 1 : 2;
  return new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
}
