import { MISSION_CATALOG } from "./catalog";
import type { MissionTemplate, ObjectiveProfile } from "../domain/types";

/**
 * Candidate Generator — produit l'ensemble des missions envisageables
 * pour cet objectif, avant tout filtrage.
 */
export function generateCandidates(profile: ObjectiveProfile): MissionTemplate[] {
  const sameDomain = MISSION_CATALOG.filter((t) => t.domain === profile.domain);

  const disciplineAware = profile.discipline
    ? sameDomain.filter((t) => !t.disciplines || t.disciplines.includes(profile.discipline!))
    : sameDomain.filter((t) => !t.disciplines);

  const candidates = disciplineAware.length > 0 ? disciplineAware : sameDomain.filter((t) => !t.disciplines);

  // Les missions universelles servent de socle pour les objectifs complexes.
  if (profile.domain !== "complexe" && candidates.length < 4) {
    return [...candidates, ...MISSION_CATALOG.filter((t) => t.domain === "complexe")];
  }
  return candidates;
}
