import type { MissionHistoryEntry, MissionTemplate } from "../domain/types";

/**
 * Recovery Engine — la récupération est une vraie mission de progression,
 * pas une absence de travail. Aucune prescription médicale n'est produite.
 */

export interface RecoveryNeed {
  needed: boolean;
  /** "charge" = charge récente élevée, "consolidation" = besoin d'assimiler. */
  reason: "charge" | "consolidation" | "difficulte" | null;
  explanation: string | null;
}

export function assessRecovery(input: {
  recentLoad: number;
  history: MissionHistoryEntry[];
}): RecoveryNeed {
  if (input.recentLoad > 0.75) {
    return {
      needed: true,
      reason: "charge",
      explanation: "Ta charge des derniers jours est élevée : une séance de récupération protège ta progression.",
    };
  }

  const lastFive = input.history.filter((h) => h.finalStatus === "done").slice(-5);
  const tooHard = lastFive.filter((h) => h.perceivedDifficulty === "trop_difficile").length;
  if (tooHard >= 2) {
    return {
      needed: true,
      reason: "difficulte",
      explanation: "Plusieurs séances récentes t'ont semblé trop difficiles : on consolide avant de repousser.",
    };
  }

  const recoveryDays = new Set(
    input.history
      .filter((h) => h.family === "recuperation" && h.finalStatus === "done")
      .map((h) => h.date.slice(0, 10)),
  );
  const lastSeven = [...Array(7).keys()].map((i) =>
    new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10),
  );
  const hadRecovery = lastSeven.some((d) => recoveryDays.has(d));
  const workedDays = new Set(
    input.history.filter((h) => h.finalStatus === "done").map((h) => h.date.slice(0, 10)),
  );
  const workedCount = lastSeven.filter((d) => workedDays.has(d)).length;

  if (!hadRecovery && workedCount >= 5) {
    return {
      needed: true,
      reason: "consolidation",
      explanation: "Cinq jours de travail sans temps de consolidation : on en place un aujourd'hui.",
    };
  }

  return { needed: false, reason: null, explanation: null };
}

export function isRecovery(template: MissionTemplate): boolean {
  return template.family === "recuperation";
}
