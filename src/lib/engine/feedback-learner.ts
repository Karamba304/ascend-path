import type { MissionHistoryEntry } from "../domain/types";

/**
 * Feedback Learner — cherche des tendances, pas des réactions immédiates.
 * Retourne un décalage de difficulté (-1, 0, +1) pour une compétence.
 */
export function calibrationFor(skill: string, history: MissionHistoryEntry[]): number {
  const related = history
    .filter((h) => h.skill === skill && h.perceivedDifficulty)
    .slice(-5);

  if (related.length < 2) return 0;

  const tooEasy = related.filter((h) => h.perceivedDifficulty === "trop_facile").length;
  const tooHard = related.filter((h) => h.perceivedDifficulty === "trop_difficile").length;

  if (tooEasy >= 2 && tooEasy > tooHard) return 1;
  if (tooHard >= 2 && tooHard > tooEasy) return -1;
  return 0;
}

/** Ajustement d'estimation de niveau après une mission terminée. */
export function levelDelta(entry: {
  finalStatus: "done" | "not_done" | "deleted";
  perceivedDifficulty: "trop_facile" | "comme_prevu" | "trop_difficile" | null;
}): number {
  if (entry.finalStatus !== "done") return 0;
  switch (entry.perceivedDifficulty) {
    case "trop_facile":
      return 3;
    case "comme_prevu":
      return 2;
    case "trop_difficile":
      return 1;
    default:
      return 1;
  }
}
