import type { Domain, ObjectiveProfile, SkillLevel } from "../domain/types";

/** Dimensions internes par domaine. Estimations destinées à guider le moteur. */
const DIMENSIONS: Record<Domain, string[]> = {
  sport: ["technique", "physique", "endurance", "vitesse", "coordination", "mental"],
  langues: [
    "vocabulaire",
    "grammaire",
    "comprehension_orale",
    "comprehension_ecrite",
    "expression_orale",
    "expression_ecrite",
    "prononciation",
  ],
  etudes: ["comprehension", "rappel", "application", "methode", "regularite"],
  programmation: ["bases", "resolution_problemes", "debug", "construction", "autonomie"],
  lecture: ["volume", "comprehension", "regularite", "reflexion"],
  mental: ["concentration", "regularite", "gestion_distractions", "recul"],
  creation: ["conception", "execution", "finition", "regularite"],
  habitudes: ["declenchement", "regularite", "environnement", "resistance"],
  quantitatif: ["volume", "regularite", "constance"],
  complexe: ["comprehension", "execution", "regularite", "capacite"],
};

const DISCIPLINE_DIMENSIONS: Record<string, string[]> = {
  football: [
    "controle",
    "dribble",
    "passe",
    "finition",
    "un_contre_un",
    "pied_faible",
    "vitesse",
    "endurance",
    "tactique",
    "mental",
  ],
  boxe: ["garde", "deplacements", "jab", "combinaisons", "defense", "coordination", "endurance", "mental"],
  course: ["endurance", "vitesse", "regularite", "recuperation", "mental"],
  musculation: ["force", "technique", "volume", "recuperation", "regularite"],
};

export function dimensionsFor(domain: Domain, discipline: string | null): string[] {
  if (discipline && DISCIPLINE_DIMENSIONS[discipline]) return DISCIPLINE_DIMENSIONS[discipline]!;
  return DIMENSIONS[domain];
}

export const DIMENSION_LABEL: Record<string, string> = {
  technique: "Technique",
  physique: "Physique",
  endurance: "Endurance",
  vitesse: "Vitesse",
  coordination: "Coordination",
  mental: "Mental",
  controle: "Contrôle",
  dribble: "Dribble",
  passe: "Passe",
  finition: "Finition",
  un_contre_un: "1 contre 1",
  pied_faible: "Pied faible",
  tactique: "Compréhension tactique",
  garde: "Garde",
  deplacements: "Déplacements",
  jab: "Jab",
  combinaisons: "Combinaisons",
  defense: "Défense",
  vocabulaire: "Vocabulaire",
  grammaire: "Grammaire",
  comprehension_orale: "Compréhension orale",
  comprehension_ecrite: "Compréhension écrite",
  expression_orale: "Expression orale",
  expression_ecrite: "Expression écrite",
  prononciation: "Prononciation",
  comprehension: "Compréhension",
  rappel: "Rappel actif",
  application: "Application",
  methode: "Méthode",
  regularite: "Régularité",
  bases: "Bases",
  resolution_problemes: "Résolution de problèmes",
  debug: "Debugging",
  construction: "Construction",
  autonomie: "Autonomie",
  volume: "Volume",
  reflexion: "Réflexion",
  concentration: "Concentration",
  gestion_distractions: "Gestion des distractions",
  recul: "Recul",
  conception: "Conception",
  execution: "Exécution",
  finition_projet: "Finition",
  declenchement: "Déclenchement",
  environnement: "Environnement",
  resistance: "Résistance",
  constance: "Constance",
  force: "Force",
  recuperation: "Récupération",
  capacite: "Capacité",
};

export function labelFor(metric: string): string {
  return DIMENSION_LABEL[metric] ?? metric.replaceAll("_", " ");
}

/**
 * Profile Manager — construit le profil initial à partir des réponses
 * d'évaluation, puis le fait évoluer.
 */
export function buildInitialProfile(input: {
  domain: Domain;
  discipline: string | null;
  ambitious: boolean;
  answers: Record<string, string | string[]>;
}): ObjectiveProfile {
  const base = declaredBaseline(input.answers);
  const levels: SkillLevel[] = dimensionsFor(input.domain, input.discipline).map((metric) => ({
    metric,
    value: clamp(base + strengthBonus(metric, input.answers)),
  }));

  return {
    domain: input.domain,
    discipline: input.discipline,
    ambitious: input.ambitious,
    levels,
  };
}

function declaredBaseline(answers: Record<string, string | string[]>): number {
  const cefr = String(answers["cefr"] ?? "");
  const cefrMap: Record<string, number> = { A1: 12, A2: 25, B1: 40, B2: 55, C1: 72, C2: 85 };
  if (cefrMap[cefr]) return cefrMap[cefr]!;

  const level = String(answers["current_level"] ?? answers["experience"] ?? "");
  const map: Record<string, number> = {
    debutant: 10,
    debutant_avance: 25,
    intermediaire: 40,
    avance: 60,
    confirme: 75,
    inconnu: 25,
  };
  return map[level] ?? 25;
}

function strengthBonus(metric: string, answers: Record<string, string | string[]>): number {
  const strengths = toArray(answers["strengths"]);
  const weaknesses = toArray(answers["weaknesses"]);
  if (strengths.includes(metric)) return 10;
  if (weaknesses.includes(metric)) return -10;
  return 0;
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function clamp(value: number): number {
  return Math.min(95, Math.max(3, Math.round(value)));
}

/** Moyenne pondérée du profil : niveau personnel global (estimation). */
export function overallLevel(profile: ObjectiveProfile): number {
  if (profile.levels.length === 0) return 0;
  const sum = profile.levels.reduce((acc, l) => acc + l.value, 0);
  return Math.round(sum / profile.levels.length);
}
