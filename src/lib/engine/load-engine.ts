import type { MissionHistoryEntry, MissionTemplate } from "../domain/types";
import type { Difficulty } from "../domain/xp";

/**
 * Load Engine — la charge n'est PAS du temps.
 * 30 minutes disponibles ne signifient pas 30 minutes d'effort maximal.
 * On sépare explicitement charge disponible / consommée / restante.
 */

const DIFFICULTY_FACTOR: Record<Difficulty, number> = {
  tres_facile: 0.6,
  facile: 0.8,
  moyenne: 1,
  difficile: 1.25,
  tres_difficile: 1.5,
};

/** Coût de charge d'une mission (unités abstraites). */
export function loadCost(duration: number, intensity: number, difficulty?: Difficulty): number {
  const intensityFactor = 0.5 + intensity * 0.18;
  const difficultyFactor = difficulty ? DIFFICULTY_FACTOR[difficulty] : 1;
  return Math.round((duration / 10) * intensityFactor * difficultyFactor * 10) / 10;
}

/** Charge récente normalisée 0-1, fenêtre glissante de 3 jours. */
export function recentLoad(history: MissionHistoryEntry[], dailyMinutes: number): number {
  const since = Date.now() - 3 * 86_400_000;
  const done = history.filter(
    (h) => h.finalStatus === "done" && new Date(h.date).getTime() >= since,
  );
  if (done.length === 0) return 0;
  const used = done.reduce((acc, h) => acc + loadCost(h.duration, h.intensity, h.difficulty), 0);
  const reference = Math.max(1, dailyReferenceLoad(dailyMinutes) * 3);
  return Math.max(0, Math.min(1, used / reference));
}

/** Charge de référence pour une journée type. */
export function dailyReferenceLoad(dailyMinutes: number): number {
  return loadCost(Math.max(10, dailyMinutes), 3);
}

export interface LoadBudget {
  /** Minutes réellement disponibles aujourd'hui. */
  availableMinutes: number;
  /** Minutes déjà consommées par les missions terminées du jour. */
  consumedMinutes: number;
  remainingMinutes: number;
  /** Charge pertinente aujourd'hui (peut être inférieure au temps disponible). */
  availableLoad: number;
  consumedLoad: number;
  remainingLoad: number;
  /** Charge récente 0-1, utilisée par la récupération et la difficulté. */
  recentLoad: number;
}

export interface TodayUsage {
  minutes: number;
  load: number;
}

/** Ce que l'utilisateur a déjà fait aujourd'hui (charge en cours de journée). */
export function usageToday(entries: { duration: number; intensity: number; difficulty: Difficulty }[]): TodayUsage {
  return entries.reduce<TodayUsage>(
    (acc, e) => ({
      minutes: acc.minutes + e.duration,
      load: acc.load + loadCost(e.duration, e.intensity, e.difficulty),
    }),
    { minutes: 0, load: 0 },
  );
}

export function buildLoadBudget(input: {
  availableMinutes: number;
  dailyMinutes: number;
  history: MissionHistoryEntry[];
  usedToday?: TodayUsage;
}): LoadBudget {
  const recent = recentLoad(input.history, input.dailyMinutes);
  const reference = dailyReferenceLoad(input.availableMinutes);

  // Plus la charge récente est élevée, plus la charge pertinente du jour baisse.
  const availableLoad = Math.round(reference * (1 - recent * 0.45) * 10) / 10;

  const used = input.usedToday ?? { minutes: 0, load: 0 };
  return {
    availableMinutes: input.availableMinutes,
    consumedMinutes: used.minutes,
    remainingMinutes: Math.max(0, input.availableMinutes - used.minutes),
    availableLoad,
    consumedLoad: Math.round(used.load * 10) / 10,
    remainingLoad: Math.max(0, Math.round((availableLoad - used.load) * 10) / 10),
    recentLoad: recent,
  };
}

/** Une mission tient-elle dans la charge restante ? */
export function fitsLoad(
  template: MissionTemplate,
  duration: number,
  difficulty: Difficulty,
  budget: LoadBudget,
): boolean {
  const cost = loadCost(duration, template.intensity, difficulty);
  // La récupération n'est jamais bloquée par la charge : elle la réduit.
  if (template.family === "recuperation") return duration <= budget.remainingMinutes;
  return cost <= budget.remainingLoad + 0.5 && duration <= budget.remainingMinutes;
}
