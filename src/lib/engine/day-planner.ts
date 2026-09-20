import type {
  Family,
  MissionTemplate,
  PlanInput,
  PlannedMission,
} from "../domain/types";
import { generateCandidates } from "./candidate-generator";
import { filterCandidates } from "./candidate-filter";
import { scoreCandidates } from "./scoring-engine";
import { resolveDifficulty } from "./difficulty-engine";
import { buildLoadBudget, loadCost, type LoadBudget, type TodayUsage } from "./load-engine";
import { repetitionAcceptable, repetitionPenalty } from "./rotation-engine";
import { assessRecovery } from "./recovery-engine";
import { checkObjectiveFeasibility, checkViability, type FeasibilityIssue } from "./viability";
import { overallLevel } from "./profile-manager";

export interface DayPlan {
  missions: PlannedMission[];
  budget: LoadBudget;
  /** Explication courte affichée à l'utilisateur. */
  contextSentence: string;
  recoveryIncluded: boolean;
  feasibility: FeasibilityIssue | null;
  /** Pourquoi certaines missions n'ont pas été retenues (diagnostic interne). */
  rejected: { id: string; reason: string }[];
}

export interface DayPlannerOptions extends PlanInput {
  usedToday?: TodayUsage;
  /** Missions déjà présentes dans la journée (à ne pas dupliquer). */
  excludeTemplateIds?: string[];
  /** Nombre maximum de missions à produire (1 à 5 en bêta). */
  maxMissions?: number;
}

/**
 * Day Planner — construit une journée cohérente.
 * Le score dit ce qui est pertinent ; la composition décide de la journée.
 * On ne remplit jamais artificiellement le temps disponible.
 */
export function planDay(input: DayPlannerOptions): DayPlan {
  const availableMinutes = input.availableMinutesToday ?? input.dailyMinutes;
  const budget = buildLoadBudget({
    availableMinutes,
    dailyMinutes: input.dailyMinutes,
    history: input.history,
    usedToday: input.usedToday,
  });

  const daysToTarget = input.targetDate
    ? Math.ceil((new Date(input.targetDate).getTime() - Date.now()) / 86_400_000)
    : null;

  const allCandidates = generateCandidates(input.profile);
  const { kept, rejected } = filterCandidates(allCandidates, {
    profile: input.profile,
    resources: input.resources,
    availableMinutes: budget.remainingMinutes,
    history: input.history,
    unavailable: input.unavailable ?? [],
    recentLoad: budget.recentLoad,
  });

  const feasibility = checkObjectiveFeasibility({
    ambitious: input.profile.ambitious,
    dailyMinutes: input.dailyMinutes,
    availableDays: 7,
    candidateCount: kept.length,
    daysToTarget,
  });

  const priorities = [...input.profile.levels]
    .sort((a, b) => a.value - b.value)
    .slice(0, 4)
    .map((l) => l.metric);

  const scored = scoreCandidates(kept, {
    profile: input.profile,
    availableMinutes: budget.remainingMinutes,
    history: input.history,
    recentLoad: budget.recentLoad,
    priorities,
  });

  const recovery = assessRecovery({ recentLoad: budget.recentLoad, history: input.history });
  const exclude = new Set(input.excludeTemplateIds ?? []);
  const maxMissions = Math.max(1, Math.min(5, input.maxMissions ?? maxMissionsFor(budget.remainingMinutes)));

  const selected: MissionTemplate[] = [];
  const planned: PlannedMission[] = [];
  const rejectedLog: { id: string; reason: string }[] = rejected.map((r) => ({
    id: r.template.id,
    reason: r.reason,
  }));

  const working = { ...budget };

  const tryAdd = (template: MissionTemplate): boolean => {
    if (exclude.has(template.id)) return false;
    if (!repetitionAcceptable(template, { history: input.history, selected })) {
      rejectedLog.push({ id: template.id, reason: "répétition inutile" });
      return false;
    }

    const { difficulty, duration, xp } = resolveDifficulty(template, {
      profile: input.profile,
      history: input.history,
      recentLoad: working.recentLoad,
      availableMinutes: working.remainingMinutes,
      daysToTarget,
    });

    const verdict = checkViability(template, duration, difficulty, {
      profile: input.profile,
      resources: input.resources,
      unavailable: input.unavailable ?? [],
      budget: working,
      daysToTarget,
    });
    if (!verdict.viable) {
      rejectedLog.push({ id: template.id, reason: verdict.reason ?? "non viable" });
      return false;
    }

    // Cohérence de la journée : pas deux missions très difficiles d'affilée.
    const hardCount = planned.filter(
      (m) => m.difficulty === "difficile" || m.difficulty === "tres_difficile",
    ).length;
    if (hardCount >= 2 && (difficulty === "difficile" || difficulty === "tres_difficile")) {
      rejectedLog.push({ id: template.id, reason: "journée déjà exigeante" });
      return false;
    }

    selected.push(template);
    planned.push({
      templateId: template.id,
      title: template.title,
      description: template.description,
      reason: template.purpose,
      family: template.family,
      skill: template.skill,
      duration,
      difficulty,
      xp,
      steps: template.steps ?? [],
      requires: template.requires,
      intensity: template.intensity,
    });

    const cost = loadCost(duration, template.intensity, difficulty);
    working.remainingMinutes = Math.max(0, working.remainingMinutes - duration);
    working.remainingLoad = Math.max(0, Math.round((working.remainingLoad - cost) * 10) / 10);
    working.consumedMinutes += duration;
    working.consumedLoad = Math.round((working.consumedLoad + cost) * 10) / 10;
    return true;
  };

  // 1. Récupération d'abord si elle est nécessaire.
  let recoveryIncluded = false;
  if (recovery.needed) {
    const recoveryTemplate = scored.find((s) => s.template.family === "recuperation")?.template;
    if (recoveryTemplate && tryAdd(recoveryTemplate)) recoveryIncluded = true;
  }

  // 2. Mission principale : la plus pertinente sur une compétence prioritaire.
  const ordered = [...scored].sort((a, b) => {
    const pa = repetitionPenalty(a.template, { history: input.history, selected });
    const pb = repetitionPenalty(b.template, { history: input.history, selected });
    return b.score - b.score * pb - (a.score - a.score * pa);
  });

  for (const { template } of ordered) {
    if (planned.length >= maxMissions) break;
    if (template.family === "recuperation" && recoveryIncluded) continue;
    if (!diversifies(template, planned)) continue;
    tryAdd(template);
  }

  // 3. Si la journée est trop pauvre, on autorise une famille déjà utilisée —
  //    mais jamais une mission inutile juste pour remplir le temps.
  if (planned.length === 0) {
    for (const { template } of ordered) {
      if (tryAdd(template)) break;
    }
  }

  const finalBudget: LoadBudget = {
    ...budget,
    consumedMinutes: working.consumedMinutes,
    consumedLoad: working.consumedLoad,
    remainingMinutes: working.remainingMinutes,
    remainingLoad: working.remainingLoad,
  };

  return {
    missions: orderDay(planned),
    budget: finalBudget,
    contextSentence: contextSentence(planned, recovery.explanation, input.profile),
    recoveryIncluded,
    feasibility,
    rejected: rejectedLog,
  };
}

/** Validation finale : diversité minimale, aucune journée absurde. */
function diversifies(template: MissionTemplate, planned: PlannedMission[]): boolean {
  const sameSkill = planned.filter((m) => m.skill === template.skill).length;
  if (sameSkill >= 2) return false;
  const sameFamily = planned.filter((m) => m.family === template.family).length;
  return sameFamily < 2;
}

/** Ordre de la journée : montée en intensité, récupération en fin. */
function orderDay(missions: PlannedMission[]): PlannedMission[] {
  const rank = (m: PlannedMission) => {
    if (m.family === "recuperation") return 3;
    if (m.family === "apprentissage" || m.family === "technique") return 0;
    if (m.family === "depassement" || m.family === "physique") return 2;
    return 1;
  };
  return [...missions].sort((a, b) => rank(a) - rank(b));
}

function maxMissionsFor(minutes: number): number {
  if (minutes <= 20) return 1;
  if (minutes <= 40) return 2;
  if (minutes <= 70) return 3;
  if (minutes <= 110) return 4;
  return 5;
}

function contextSentence(
  missions: PlannedMission[],
  recoveryExplanation: string | null,
  profile: { levels: { value: number }[] },
): string {
  if (missions.length === 0) {
    return "Aucune mission pertinente aujourd'hui : mieux vaut ne rien ajouter que remplir le temps.";
  }
  if (recoveryExplanation) return recoveryExplanation;

  const level = overallLevel(profile as never);
  const total = missions.reduce((a, m) => a + m.duration, 0);
  const focus = missions[0]!.skill.replaceAll("_", " ");
  if (level < 20) {
    return `Journée de mise en route : ${total} min, priorité sur ${focus}.`;
  }
  const hard = missions.some((m) => m.difficulty === "difficile" || m.difficulty === "tres_difficile");
  if (hard) return `Journée exigeante : ${total} min, dont un vrai bloc de dépassement.`;
  return `Journée de construction : ${total} min, axe principal ${focus}.`;
}

export type { Family };
