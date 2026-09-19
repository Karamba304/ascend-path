import type { Difficulty } from "../domain/xp";
import { XP_BY_DIFFICULTY } from "../domain/xp";
import type { MissionHistoryEntry, MissionTemplate, ObjectiveProfile } from "../domain/types";
import { overallLevel } from "./profile-manager";
import { calibrationFor } from "./feedback-learner";

const ORDER: Difficulty[] = ["tres_facile", "facile", "moyenne", "difficile", "tres_difficile"];

export interface DifficultyContext {
  profile: ObjectiveProfile;
  history: MissionHistoryEntry[];
  recentLoad: number;
  availableMinutes: number;
  daysToTarget: number | null;
}

/**
 * Difficulty Engine — fixe la difficulté et la durée réelle d'une mission.
 * La difficulté n'est jamais choisie par l'utilisateur, et ne double jamais
 * d'un coup : elle suit la calibration issue des tendances de feedback.
 */
export function resolveDifficulty(
  template: MissionTemplate,
  ctx: DifficultyContext,
): { difficulty: Difficulty; duration: number; xp: number } {
  let index = baseIndex(template.intensity);

  const level = overallLevel(ctx.profile);
  if (level < 15 && index > 2) index -= 1;
  if (level > 70 && index < 4) index += 1;

  index += calibrationFor(template.skill, ctx.history);

  if (ctx.recentLoad > 0.8 && template.family !== "recuperation") index -= 1;
  if (ctx.daysToTarget !== null && ctx.daysToTarget < 21 && template.family !== "recuperation") {
    index += 1;
  }
  if (template.family === "recuperation") index = Math.min(index, 1);

  index = Math.max(0, Math.min(ORDER.length - 1, index));
  const difficulty = ORDER[index]!;

  const durationFactor = [0.7, 0.85, 1, 1.15, 1.3][index]!;
  let duration = Math.round((template.baseDuration * durationFactor) / 5) * 5;
  duration = Math.max(5, Math.min(duration, Math.max(5, ctx.availableMinutes)));

  return { difficulty, duration, xp: XP_BY_DIFFICULTY[difficulty] };
}

function baseIndex(intensity: number): number {
  return Math.max(0, Math.min(4, intensity - 1));
}
