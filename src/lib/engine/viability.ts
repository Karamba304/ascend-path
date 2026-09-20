import type { MissionTemplate, ObjectiveProfile, ResourceTag } from "../domain/types";
import type { LoadBudget } from "./load-engine";
import { fitsLoad } from "./load-engine";
import { overallLevel } from "./profile-manager";
import type { Difficulty } from "../domain/xp";

/**
 * Seuil de viabilité — une mission ne doit jamais être sélectionnée
 * uniquement parce qu'elle obtient un bon score. Elle doit d'abord être
 * réellement réalisable aujourd'hui.
 */

export interface ViabilityContext {
  profile: ObjectiveProfile;
  resources: ResourceTag[];
  unavailable: ResourceTag[];
  budget: LoadBudget;
  daysToTarget: number | null;
}

export interface ViabilityVerdict {
  viable: boolean;
  reason: string | null;
}

export function checkViability(
  template: MissionTemplate,
  duration: number,
  difficulty: Difficulty,
  ctx: ViabilityContext,
): ViabilityVerdict {
  const missing = template.requires.filter(
    (r) => !ctx.resources.includes(r) || ctx.unavailable.includes(r),
  );
  if (missing.length > 0) return { viable: false, reason: `ressource indisponible : ${missing.join(", ")}` };

  const personalLevel = ctx.profile.levels.find((l) => l.metric === template.skill)?.value
    ?? overallLevel(ctx.profile);
  if (personalLevel < template.levelRange[0] - 12) {
    return { viable: false, reason: "niveau personnel encore trop bas pour cette mission" };
  }
  if (personalLevel > template.levelRange[1] + 15) {
    return { viable: false, reason: "mission devenue trop simple pour ce niveau personnel" };
  }

  if (duration > ctx.budget.remainingMinutes) {
    return { viable: false, reason: "temps restant insuffisant" };
  }

  if (!fitsLoad(template, duration, difficulty, ctx.budget)) {
    return { viable: false, reason: "charge restante insuffisante" };
  }

  if (
    ctx.daysToTarget !== null &&
    ctx.daysToTarget < 7 &&
    template.family === "apprentissage" &&
    personalLevel > 45
  ) {
    return { viable: false, reason: "échéance trop proche pour une mission d'apprentissage initial" };
  }

  return { viable: true, reason: null };
}

/**
 * Détecte une incompatibilité structurelle entre l'objectif et les
 * contraintes déclarées : on préfère demander une adaptation plutôt que
 * générer silencieusement un programme irréaliste.
 */
export interface FeasibilityIssue {
  code: "temps_insuffisant" | "ressources_insuffisantes" | "echeance_irrealiste";
  message: string;
  suggestion: string;
}

export function checkObjectiveFeasibility(input: {
  ambitious: boolean;
  dailyMinutes: number;
  availableDays: number;
  candidateCount: number;
  daysToTarget: number | null;
}): FeasibilityIssue | null {
  if (input.candidateCount === 0) {
    return {
      code: "ressources_insuffisantes",
      message: "Avec les ressources déclarées, aucune mission réalisable n'existe pour cet objectif.",
      suggestion: "Ajoute une ressource ou un environnement disponible (même minimal) pour débloquer des missions.",
    };
  }

  const weekly = input.dailyMinutes * input.availableDays;
  if (input.ambitious && weekly < 120) {
    return {
      code: "temps_insuffisant",
      message: `Cet objectif est très ambitieux, mais tu disposes de ${weekly} min par semaine.`,
      suggestion: "Augmente le temps disponible, ou garde un objectif intermédiaire plus réaliste pour commencer.",
    };
  }

  if (input.daysToTarget !== null && input.ambitious && input.daysToTarget < 30) {
    return {
      code: "echeance_irrealiste",
      message: "L'échéance choisie est très proche pour un objectif de ce niveau.",
      suggestion: "Repousse l'échéance, ou définis une étape intermédiaire atteignable d'ici là.",
    };
  }

  return null;
}
