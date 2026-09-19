import type { Domain } from "../domain/types";

interface Rule {
  domain: Domain;
  keywords: string[];
}

const RULES: Rule[] = [
  {
    domain: "sport",
    keywords: [
      "football", "foot", "basket", "boxe", "tennis", "course", "courir", "marathon",
      "muscu", "musculation", "sport", "athlete", "athlète", "natation", "nager",
      "rugby", "handball", "volley", "cyclisme", "velo", "vélo", "mma", "judo",
      "karate", "karaté", "physique", "pompes", "abdos", "sprint", "endurance",
    ],
  },
  {
    domain: "langues",
    keywords: [
      "espagnol", "anglais", "allemand", "italien", "japonais", "chinois", "arabe",
      "portugais", "russe", "coreen", "coréen", "langue", "parler", "bilingue",
      "vocabulaire", "toeic", "toefl",
    ],
  },
  {
    domain: "etudes",
    keywords: [
      "bac", "brevet", "examen", "concours", "licence", "master", "partiel",
      "revision", "révision", "cours", "maths", "mathématiques", "physique-chimie",
      "histoire", "philosophie", "medecine", "médecine", "prepa", "prépa", "diplome", "diplôme",
    ],
  },
  {
    domain: "programmation",
    keywords: [
      "python", "javascript", "typescript", "java", "code", "coder", "programmation",
      "developpeur", "développeur", "algorithme", "react", "sql", "data", "informatique",
      "cybersecurite", "cybersécurité", "design", "figma",
    ],
  },
  {
    domain: "lecture",
    keywords: ["lire", "lecture", "livre", "livres", "roman", "bouquin", "pages"],
  },
  {
    domain: "mental",
    keywords: [
      "discipline", "concentration", "focus", "meditation", "méditation", "mental",
      "confiance", "procrastination", "stress", "anxiete", "anxiété", "volonte", "volonté",
    ],
  },
  {
    domain: "creation",
    keywords: [
      "creer", "créer", "application", "site", "startup", "projet", "entreprise",
      "jeu", "album", "roman a ecrire", "musique", "chaine", "chaîne", "youtube",
      "podcast", "business", "produit", "portfolio",
    ],
  },
  {
    domain: "habitudes",
    keywords: [
      "habitude", "routine", "arreter", "arrêter", "tous les jours", "chaque jour",
      "me lever", "reveiller", "réveiller", "coucher", "sommeil", "telephone", "téléphone",
      "ecrans", "écrans", "sucre",
    ],
  },
  {
    domain: "quantitatif",
    keywords: ["atteindre", "objectif de", "kg", "km", "euros", "abonnes", "abonnés", "clients"],
  },
];

const AMBITION_KEYWORDS = [
  "professionnel", "pro", "expert", "elite", "élite", "haut niveau", "champion",
  "vivre de", "carriere", "carrière", "meilleur",
];

const DISCIPLINES: Record<string, string[]> = {
  football: ["football", "foot", "footballeur"],
  boxe: ["boxe", "boxeur", "boxing"],
  basket: ["basket", "basketball"],
  course: ["course", "courir", "marathon", "semi", "10 km", "sprint"],
  musculation: ["muscu", "musculation", "prise de masse", "force"],
  tennis: ["tennis"],
  natation: ["natation", "nager"],
  espagnol: ["espagnol"],
  anglais: ["anglais", "english"],
  japonais: ["japonais"],
  python: ["python"],
  web: ["javascript", "typescript", "react", "site", "web"],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export interface ObjectiveAnalysis {
  domain: Domain;
  discipline: string | null;
  ambitious: boolean;
  confidence: "haute" | "moyenne" | "faible";
  alternatives: Domain[];
}

/**
 * Objective Analyzer — comprend l'objectif écrit librement.
 * Analyse déterministe par mots-clés ; l'utilisateur peut toujours corriger.
 */
export function analyzeObjective(rawText: string): ObjectiveAnalysis {
  const text = normalize(rawText);
  const scores = new Map<Domain, number>();

  for (const rule of RULES) {
    for (const keyword of rule.keywords) {
      if (text.includes(normalize(keyword))) {
        scores.set(rule.domain, (scores.get(rule.domain) ?? 0) + 1);
      }
    }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const quantified = /\b\d+\b/.test(text);

  let domain: Domain;
  let confidence: ObjectiveAnalysis["confidence"];

  if (ranked.length === 0) {
    domain = quantified ? "quantitatif" : "complexe";
    confidence = "faible";
  } else {
    domain = ranked[0]![0];
    confidence = ranked.length === 1 || ranked[0]![1] > (ranked[1]?.[1] ?? 0) ? "haute" : "moyenne";
  }

  let discipline: string | null = null;
  for (const [name, keywords] of Object.entries(DISCIPLINES)) {
    if (keywords.some((k) => text.includes(normalize(k)))) {
      discipline = name;
      break;
    }
  }

  const ambitious = AMBITION_KEYWORDS.some((k) => text.includes(normalize(k)));

  return {
    domain,
    discipline,
    ambitious,
    confidence,
    alternatives: ranked.slice(1, 4).map(([d]) => d),
  };
}
