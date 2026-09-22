import { Link } from "@tanstack/react-router";
import { Clock, Flame, Sparkles } from "lucide-react";

import { DIFFICULTY_LABEL, type Difficulty } from "@/lib/domain/xp";
import { FAMILY_LABEL, type Family } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export interface MissionCardData {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  difficulty: Difficulty;
  xp: number;
  status: "todo" | "in_progress" | "done" | "not_done" | "deleted";
  family: string | null;
}

const STATUS_LABEL: Record<MissionCardData["status"], string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminée",
  not_done: "Non terminée",
  deleted: "Supprimée",
};

const DIFFICULTY_TONE: Record<Difficulty, string> = {
  tres_facile: "text-success",
  facile: "text-success",
  moyenne: "text-primary",
  difficile: "text-warning",
  tres_difficile: "text-destructive",
};

export function MissionCard({ mission }: { mission: MissionCardData }) {
  const done = mission.status === "done";

  return (
    <Link
      to="/mission/$missionId"
      params={{ missionId: mission.id }}
      className={cn(
        "panel block animate-rise p-4 transition-transform hover:-translate-y-0.5 sm:p-5",
        done && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {mission.family ? (FAMILY_LABEL[mission.family as Family] ?? mission.family) : "Mission"}
          </p>
          <h3 className="mt-1 font-display text-base font-semibold sm:text-lg">{mission.title}</h3>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px]",
            done ? "text-success" : "text-muted-foreground",
          )}
        >
          {STATUS_LABEL[mission.status]}
        </span>
      </div>

      {mission.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{mission.description}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" /> {mission.duration} min
        </span>
        <span className={cn("flex items-center gap-1.5", DIFFICULTY_TONE[mission.difficulty])}>
          <Flame className="size-3.5" /> {DIFFICULTY_LABEL[mission.difficulty]}
        </span>
        <span className="flex items-center gap-1.5 text-xp">
          <Sparkles className="size-3.5" /> +{mission.xp} XP
        </span>
      </div>
    </Link>
  );
}
