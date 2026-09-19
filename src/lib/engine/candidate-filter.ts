import type {
  MissionHistoryEntry,
  MissionTemplate,
  ObjectiveProfile,
  ResourceTag,
} from "../domain/types";
import { overallLevel } from "./profile-manager";

export interface FilterContext {
  profile: ObjectiveProfile;
  resources: ResourceTag[];
  availableMinutes: number;
  history: MissionHistoryEntry[];
  unavailable: ResourceTag[];
  /** Charge récente normalisée 0-1. */
  recentLoad: number;
}

export interface FilterResult {
  kept: MissionTemplate[];
  rejected: { template: MissionTemplate; reason: string }[];
}

/**
 * Candidate Filter — élimine les missions impossibles ou inutiles aujourd'hui.
 */
export function filterCandidates(
  candidates: MissionTemplate[],
  ctx: FilterContext,
): FilterResult {
  const level = overallLevel(ctx.profile);
  const kept: MissionTemplate[] = [];
  const rejected: { template: MissionTemplate; reason: string }[] = [];

  for (const template of candidates) {
    const missing = template.requires.filter(
      (r) => !ctx.resources.includes(r) || ctx.unavailable.includes(r),
    );
    if (missing.length > 0) {
      rejected.push({ template, reason: `ressource indisponible : ${missing.join(", ")}` });
      continue;
    }

    if (level < template.levelRange[0] - 10 || level > template.levelRange[1] + 10) {
      rejected.push({ template, reason: "niveau incompatible" });
      continue;
    }

    const minimumDuration = Math.max(5, Math.round(template.baseDuration * 0.5));
    if (minimumDuration > ctx.availableMinutes) {
      rejected.push({ template, reason: "temps insuffisant" });
      continue;
    }

    if (ctx.recentLoad > 0.85 && template.intensity >= 4 && template.family !== "recuperation") {
      rejected.push({ template, reason: "charge récente trop élevée" });
      continue;
    }

    const lastUse = lastUsedDaysAgo(template.id, ctx.history);
    if (lastUse !== null && lastUse < 1 && template.family !== "recuperation") {
      rejected.push({ template, reason: "répétition trop rapprochée" });
      continue;
    }

    kept.push(template);
  }

  return { kept, rejected };
}

export function lastUsedDaysAgo(
  templateId: string,
  history: MissionHistoryEntry[],
): number | null {
  const entries = history.filter((h) => h.templateId === templateId);
  if (entries.length === 0) return null;
  const mostRecent = entries
    .map((e) => new Date(e.date).getTime())
    .sort((a, b) => b - a)[0]!;
  return Math.floor((Date.now() - mostRecent) / 86_400_000);
}
