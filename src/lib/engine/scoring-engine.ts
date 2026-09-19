import type { MissionHistoryEntry, MissionTemplate, ObjectiveProfile } from "../domain/types";
import { lastUsedDaysAgo } from "./candidate-filter";
import { overallLevel } from "./profile-manager";

export const WEIGHTS = {
  objective: 25,
  level: 15,
  priority: 15,
  progression: 15,
  time: 10,
  load: 10,
  rotation: 5,
  feedback: 5,
};

export interface ScoreContext {
  profile: ObjectiveProfile;
  availableMinutes: number;
  history: MissionHistoryEntry[];
  recentLoad: number;
  /** Compétences prioritaires identifiées par le profil (les plus faibles). */
  priorities: string[];
}

export interface ScoredMission {
  template: MissionTemplate;
  score: number;
  breakdown: Record<string, number>;
}

/**
 * Scoring Engine — note chaque mission candidate sur 100.
 */
export function scoreCandidates(
  candidates: MissionTemplate[],
  ctx: ScoreContext,
): ScoredMission[] {
  const level = overallLevel(ctx.profile);

  return candidates
    .map((template) => {
      const breakdown: Record<string, number> = {};

      breakdown["objective"] =
        WEIGHTS.objective * (template.domain === ctx.profile.domain ? 1 : 0.5);

      const [min, max] = template.levelRange;
      const centre = (min + max) / 2;
      const spread = Math.max(20, (max - min) / 2);
      breakdown["level"] = WEIGHTS.level * Math.max(0, 1 - Math.abs(level - centre) / (spread * 2));

      const priorityIndex = ctx.priorities.indexOf(template.skill);
      breakdown["priority"] =
        priorityIndex === -1 ? WEIGHTS.priority * 0.25 : WEIGHTS.priority * (1 - priorityIndex * 0.25);

      const skillLevel = ctx.profile.levels.find((l) => l.metric === template.skill)?.value ?? level;
      breakdown["progression"] = WEIGHTS.progression * (1 - skillLevel / 100);

      const fit = Math.min(1, ctx.availableMinutes / Math.max(5, template.baseDuration));
      breakdown["time"] = WEIGHTS.time * (fit >= 1 ? 1 : fit);

      const loadFit =
        template.family === "recuperation"
          ? ctx.recentLoad
          : 1 - Math.abs(template.intensity / 5 - (1 - ctx.recentLoad));
      breakdown["load"] = WEIGHTS.load * Math.max(0, Math.min(1, loadFit));

      const daysAgo = lastUsedDaysAgo(template.id, ctx.history);
      breakdown["rotation"] =
        WEIGHTS.rotation * (daysAgo === null ? 1 : Math.min(1, daysAgo / 4));

      breakdown["feedback"] = WEIGHTS.feedback * feedbackFit(template, ctx.history);

      const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
      return { template, score: Math.round(score * 10) / 10, breakdown };
    })
    .sort((a, b) => b.score - a.score);
}

/** Le feedback passé sur la même compétence oriente la sélection. */
function feedbackFit(template: MissionTemplate, history: MissionHistoryEntry[]): number {
  const related = history.filter((h) => h.skill === template.skill && h.perceivedDifficulty);
  if (related.length === 0) return 0.6;
  const tooHard = related.filter((h) => h.perceivedDifficulty === "trop_difficile").length;
  const tooEasy = related.filter((h) => h.perceivedDifficulty === "trop_facile").length;
  const ratio = (tooEasy - tooHard) / related.length;
  // Trop facile récemment → la compétence mérite d'être reprise plus haut.
  return Math.max(0.2, Math.min(1, 0.6 + ratio * 0.4));
}
