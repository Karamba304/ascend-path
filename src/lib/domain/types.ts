import type { Difficulty } from "./xp";

export type Domain =
  | "sport"
  | "langues"
  | "etudes"
  | "programmation"
  | "lecture"
  | "mental"
  | "creation"
  | "habitudes"
  | "quantitatif"
  | "complexe";

export const DOMAIN_LABEL: Record<Domain, string> = {
  sport: "Sport / physique",
  langues: "Langues",
  etudes: "Études",
  programmation: "Programmation / compétences numériques",
  lecture: "Lecture",
  mental: "Mental / discipline",
  creation: "Création / projets",
  habitudes: "Habitudes",
  quantitatif: "Objectif quantitatif",
  complexe: "Objectif complexe",
};

/** Familles universelles + familles spécifiques. */
export type Family =
  | "apprentissage"
  | "pratique"
  | "consolidation"
  | "depassement"
  | "exposition"
  | "capacite"
  | "recuperation"
  | "evaluation"
  | "technique"
  | "physique"
  | "analyse";

export const FAMILY_LABEL: Record<Family, string> = {
  apprentissage: "Apprentissage",
  pratique: "Pratique",
  consolidation: "Consolidation",
  depassement: "Dépassement",
  exposition: "Exposition",
  capacite: "Capacité / endurance",
  recuperation: "Récupération",
  evaluation: "Évaluation",
  technique: "Technique",
  physique: "Physique",
  analyse: "Analyse",
};

/** Ressources/environnements déclarés à l'onboarding. */
export type ResourceTag =
  | "terrain"
  | "salle"
  | "ballon"
  | "materiel_sport"
  | "espace_interieur"
  | "exterieur"
  | "ordinateur"
  | "internet"
  | "livre"
  | "audio"
  | "partenaire"
  | "calme"
  | "cahier";

export interface MissionTemplate {
  id: string;
  domain: Domain;
  /** Discipline précise (football, boxe...) — vide = valable pour tout le domaine. */
  disciplines?: string[];
  family: Family;
  skill: string;
  title: string;
  description: string;
  /** Pourquoi cette mission existe (raison fonctionnelle). */
  purpose: string;
  /** Durée de référence en minutes. */
  baseDuration: number;
  /** Charge physique/mentale de 1 (légère) à 5 (lourde). */
  intensity: 1 | 2 | 3 | 4 | 5;
  /** Plage de niveau personnel (0-100) sur laquelle la mission est pertinente. */
  levelRange: [number, number];
  requires: ResourceTag[];
  steps?: string[];
  /** Variante utilisable quand une ressource manque. */
  fallbackOf?: string;
}

export interface SkillLevel {
  metric: string;
  value: number; // 0-100, estimation interne
}

export interface ObjectiveProfile {
  domain: Domain;
  discipline: string | null;
  ambitious: boolean;
  levels: SkillLevel[];
}

export interface MissionHistoryEntry {
  templateId: string | null;
  skill: string | null;
  family: string | null;
  date: string;
  difficulty: Difficulty;
  intensity: number;
  finalStatus: "done" | "not_done" | "deleted";
  perceivedDifficulty: "trop_facile" | "comme_prevu" | "trop_difficile" | null;
  duration: number;
}

export interface PlanInput {
  date: string;
  profile: ObjectiveProfile;
  resources: ResourceTag[];
  dailyMinutes: number;
  history: MissionHistoryEntry[];
  targetDate: string | null;
  /** Contraintes ponctuelles du jour (ressources indisponibles, temps réduit). */
  unavailable?: ResourceTag[];
  availableMinutesToday?: number;
}

export interface PlannedMission {
  templateId: string;
  title: string;
  description: string;
  reason: string;
  family: Family;
  skill: string;
  duration: number;
  difficulty: Difficulty;
  xp: number;
  steps: string[];
  requires: ResourceTag[];
  intensity: number;
}
