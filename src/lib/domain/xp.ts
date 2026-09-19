export type Difficulty =
  | "tres_facile"
  | "facile"
  | "moyenne"
  | "difficile"
  | "tres_difficile";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  tres_facile: "Très facile",
  facile: "Facile",
  moyenne: "Moyenne",
  difficile: "Difficile",
  tres_difficile: "Très difficile",
};

/** Barème XP de la bêta. Fixé côté serveur, jamais choisi par l'utilisateur. */
export const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  tres_facile: 50,
  facile: 100,
  moyenne: 150,
  difficile: 200,
  tres_difficile: 250,
};

/** XP cumulée requise pour atteindre chaque niveau (index 0 = niveau 1). */
export const LEVEL_THRESHOLDS = [500, 1000, 1500, 2000, 2500, 3500, 4500, 5500, 6500, 7500];

export function levelFromXp(totalXp: number): number {
  let level = 0;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalXp >= threshold) level += 1;
    else break;
  }
  return level;
}

export function levelProgress(totalXp: number) {
  const level = levelFromXp(totalXp);
  const previous = level === 0 ? 0 : LEVEL_THRESHOLDS[level - 1]!;
  const next = LEVEL_THRESHOLDS[level] ?? null;
  const span = next === null ? 1 : next - previous;
  const done = totalXp - previous;
  return {
    level,
    previousThreshold: previous,
    nextThreshold: next,
    xpIntoLevel: done,
    xpForLevel: span,
    ratio: next === null ? 1 : Math.min(1, Math.max(0, done / span)),
  };
}
