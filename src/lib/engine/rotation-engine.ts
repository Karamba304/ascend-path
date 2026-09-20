import type { Family, MissionHistoryEntry, MissionTemplate } from "../domain/types";

/**
 * Rotation Engine — la répétition n'est pas interdite : elle est parfois
 * nécessaire. On évite seulement la répétition inutile, avec une tolérance
 * qui dépend de la famille de mission.
 */

/** Nombre de jours minimum recommandé avant de reproposer la même mission. */
const FAMILY_TOLERANCE: Record<Family, number> = {
  apprentissage: 1,
  pratique: 1,
  consolidation: 0, // la consolidation peut revenir chaque jour
  depassement: 3,
  exposition: 2,
  capacite: 2,
  recuperation: 0,
  evaluation: 7,
  technique: 1,
  physique: 2,
  analyse: 2,
};

export function toleranceFor(family: Family): number {
  return FAMILY_TOLERANCE[family] ?? 1;
}

export interface RotationContext {
  history: MissionHistoryEntry[];
  /** Missions déjà retenues pour la journée en construction. */
  selected: MissionTemplate[];
}

/** Pénalité de rotation 0 (rien à reprocher) à 1 (répétition inutile). */
export function repetitionPenalty(template: MissionTemplate, ctx: RotationContext): number {
  // Deux fois la même mission dans la même journée : jamais.
  if (ctx.selected.some((t) => t.id === template.id)) return 1;

  const tolerance = toleranceFor(template.family);

  const lastSame = daysSince(ctx.history.filter((h) => h.templateId === template.id));
  let penalty = 0;
  if (lastSame !== null && tolerance > 0 && lastSame < tolerance) {
    penalty += 0.6 * (1 - lastSame / Math.max(1, tolerance));
  }

  // Même famille trois jours de suite : on diversifie.
  const familyStreak = consecutiveDaysWithFamily(template.family, ctx.history);
  if (familyStreak >= 3 && template.family !== "recuperation" && template.family !== "consolidation") {
    penalty += 0.3;
  }

  // Même famille déjà deux fois aujourd'hui.
  const sameFamilyToday = ctx.selected.filter((t) => t.family === template.family).length;
  if (sameFamilyToday >= 2) penalty += 0.3;

  return Math.min(1, penalty);
}

/** Répétition tolérée ? Sert de garde-fou avant sélection. */
export function repetitionAcceptable(template: MissionTemplate, ctx: RotationContext): boolean {
  return repetitionPenalty(template, ctx) < 0.8;
}

function daysSince(entries: MissionHistoryEntry[]): number | null {
  if (entries.length === 0) return null;
  const latest = Math.max(...entries.map((e) => new Date(e.date).getTime()));
  return Math.floor((Date.now() - latest) / 86_400_000);
}

function consecutiveDaysWithFamily(family: string, history: MissionHistoryEntry[]): number {
  const days = new Set(
    history.filter((h) => h.family === family).map((h) => h.date.slice(0, 10)),
  );
  let streak = 0;
  for (let i = 1; i <= 6; i += 1) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    if (days.has(day)) streak += 1;
    else break;
  }
  return streak;
}
