import type { MissionTemplate, PlannedMission, ResourceTag } from "../domain/types";
import { MISSION_CATALOG } from "./catalog";

/**
 * Context Adapter — quand le contexte change, on conserve l'objectif
 * fonctionnel, la compétence ciblée et la charge pertinente ; on adapte
 * l'environnement, le matériel, la durée ou le format.
 */

export type ChangeSeverity = "leger" | "important" | "majeur";

export function classifyChange(input: {
  missions: PlannedMission[];
  unavailable: ResourceTag[];
  remainingMinutes: number;
}): ChangeSeverity {
  const blocked = input.missions.filter((m) =>
    m.requires.some((r) => input.unavailable.includes(r)),
  ).length;
  const totalDuration = input.missions.reduce((a, m) => a + m.duration, 0);

  if (blocked === 0 && totalDuration <= input.remainingMinutes) return "leger";
  if (blocked >= input.missions.length || input.remainingMinutes < totalDuration * 0.4) {
    return "majeur";
  }
  return "important";
}

/** Cherche une variante de la même compétence réalisable dans le contexte. */
export function findAdaptation(
  mission: PlannedMission,
  ctx: { resources: ResourceTag[]; unavailable: ResourceTag[]; remainingMinutes: number },
): MissionTemplate | null {
  const available = (t: MissionTemplate) =>
    t.requires.every((r) => ctx.resources.includes(r) && !ctx.unavailable.includes(r));

  const explicitFallback = MISSION_CATALOG.find(
    (t) => t.fallbackOf === mission.templateId && available(t),
  );
  if (explicitFallback) return explicitFallback;

  const sameSkill = MISSION_CATALOG.filter(
    (t) => t.id !== mission.templateId && t.skill === mission.skill && available(t),
  );
  if (sameSkill.length > 0) return closestDuration(sameSkill, mission.duration);

  const sameFamily = MISSION_CATALOG.filter(
    (t) => t.id !== mission.templateId && t.family === mission.family && available(t),
  );
  if (sameFamily.length > 0) return closestDuration(sameFamily, mission.duration);

  return null;
}

/** Adaptation légère : on réduit le format sans changer la compétence. */
export function shrinkToFit(mission: PlannedMission, remainingMinutes: number): PlannedMission | null {
  const minimum = Math.max(5, Math.round(mission.duration * 0.5));
  if (remainingMinutes < minimum) return null;
  const duration = Math.max(minimum, Math.round(Math.min(mission.duration, remainingMinutes) / 5) * 5);
  return { ...mission, duration };
}

function closestDuration(list: MissionTemplate[], duration: number): MissionTemplate {
  return [...list].sort(
    (a, b) => Math.abs(a.baseDuration - duration) - Math.abs(b.baseDuration - duration),
  )[0]!;
}
