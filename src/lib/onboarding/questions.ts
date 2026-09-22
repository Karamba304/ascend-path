import type { Domain, ResourceTag } from "@/lib/domain/types";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  label: string;
  help?: string;
  type: "choice" | "multi" | "text" | "number";
  options?: QuestionOption[];
  optional?: boolean;
}

const LEVEL_OPTIONS: QuestionOption[] = [
  { value: "debutant", label: "Débutant" },
  { value: "debutant_avance", label: "Débutant avancé" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "avance", label: "Avancé" },
  { value: "confirme", label: "Confirmé" },
  { value: "inconnu", label: "Je ne sais pas" },
];

const CEFR_OPTIONS: QuestionOption[] = [
  { value: "A1", label: "A1 — grands débuts" },
  { value: "A2", label: "A2 — bases" },
  { value: "B1", label: "B1 — je me débrouille" },
  { value: "B2", label: "B2 — à l'aise" },
  { value: "C1", label: "C1 — avancé" },
  { value: "C2", label: "C2 — quasi natif" },
  { value: "inconnu", label: "Je ne connais pas mon niveau" },
];

function strengthQuestion(options: QuestionOption[]): Question[] {
  return [
    {
      id: "strengths",
      label: "Quels sont tes points forts aujourd'hui ?",
      type: "multi",
      options,
      optional: true,
    },
    {
      id: "weaknesses",
      label: "Et tes points faibles ?",
      type: "multi",
      options,
      optional: true,
    },
  ];
}

const FOOTBALL_SKILLS: QuestionOption[] = [
  { value: "controle", label: "Contrôle" },
  { value: "dribble", label: "Dribble" },
  { value: "passe", label: "Passe" },
  { value: "finition", label: "Finition" },
  { value: "un_contre_un", label: "1 contre 1" },
  { value: "pied_faible", label: "Pied faible" },
  { value: "vitesse", label: "Vitesse" },
  { value: "endurance", label: "Endurance" },
  { value: "tactique", label: "Lecture du jeu" },
  { value: "mental", label: "Mental" },
];

const BOXE_SKILLS: QuestionOption[] = [
  { value: "garde", label: "Garde" },
  { value: "deplacements", label: "Déplacements" },
  { value: "jab", label: "Jab" },
  { value: "combinaisons", label: "Combinaisons" },
  { value: "defense", label: "Défense" },
  { value: "coordination", label: "Coordination" },
  { value: "endurance", label: "Endurance" },
  { value: "mental", label: "Mental" },
];

const LANGUE_SKILLS: QuestionOption[] = [
  { value: "vocabulaire", label: "Vocabulaire" },
  { value: "grammaire", label: "Grammaire" },
  { value: "comprehension_orale", label: "Compréhension orale" },
  { value: "comprehension_ecrite", label: "Compréhension écrite" },
  { value: "expression_orale", label: "Expression orale" },
  { value: "expression_ecrite", label: "Expression écrite" },
  { value: "prononciation", label: "Prononciation" },
];

/** Questions réellement utiles à la génération des missions, rien de plus. */
export function questionsFor(domain: Domain, discipline: string | null): Question[] {
  const base: Question[] = [];

  if (domain === "sport") {
    base.push({ id: "current_level", label: "Où te situes-tu aujourd'hui ?", type: "choice", options: LEVEL_OPTIONS });
    base.push({
      id: "competition",
      label: "Es-tu en compétition ou en club ?",
      type: "choice",
      options: [
        { value: "club", label: "Oui, en club" },
        { value: "loisir", label: "Non, en autonomie" },
      ],
    });
    if (discipline === "football") {
      base.push({
        id: "poste",
        label: "À quel poste joues-tu ?",
        type: "choice",
        options: [
          { value: "gardien", label: "Gardien" },
          { value: "defenseur", label: "Défenseur" },
          { value: "milieu", label: "Milieu" },
          { value: "attaquant", label: "Attaquant" },
        ],
      });
      base.push(...strengthQuestion(FOOTBALL_SKILLS));
    } else if (discipline === "boxe") {
      base.push(...strengthQuestion(BOXE_SKILLS));
    } else {
      base.push(
        ...strengthQuestion([
          { value: "technique", label: "Technique" },
          { value: "physique", label: "Physique" },
          { value: "endurance", label: "Endurance" },
          { value: "vitesse", label: "Vitesse" },
          { value: "coordination", label: "Coordination" },
          { value: "mental", label: "Mental" },
        ]),
      );
    }
    base.push({
      id: "accompagnement",
      label: "T'entraînes-tu seul ou accompagné ?",
      type: "choice",
      options: [
        { value: "seul", label: "Seul" },
        { value: "partenaire", label: "Avec un partenaire" },
        { value: "encadre", label: "Encadré par un coach" },
      ],
    });
    return base;
  }

  if (domain === "langues") {
    base.push({ id: "cefr", label: "Quel est ton niveau actuel ?", type: "choice", options: CEFR_OPTIONS });
    base.push({
      id: "experience",
      label: "Depuis combien de temps pratiques-tu cette langue ?",
      type: "choice",
      options: [
        { value: "debutant", label: "Je commence" },
        { value: "debutant_avance", label: "Moins d'un an" },
        { value: "intermediaire", label: "1 à 3 ans" },
        { value: "avance", label: "Plus de 3 ans" },
      ],
    });
    base.push({
      id: "usage",
      label: "Pour quel usage concret ?",
      type: "choice",
      options: [
        { value: "parler", label: "Parler au quotidien" },
        { value: "voyage", label: "Voyager" },
        { value: "examen", label: "Passer un examen" },
        { value: "travail", label: "Travailler dans cette langue" },
      ],
    });
    base.push(...strengthQuestion(LANGUE_SKILLS));
    return base;
  }

  if (domain === "etudes") {
    base.push({ id: "current_level", label: "Où en es-tu dans cette matière ?", type: "choice", options: LEVEL_OPTIONS });
    base.push({
      id: "difficulte",
      label: "Qu'est-ce qui te bloque le plus ?",
      type: "choice",
      options: [
        { value: "comprehension", label: "Comprendre le cours" },
        { value: "rappel", label: "Retenir dans le temps" },
        { value: "application", label: "Appliquer sur des exercices" },
        { value: "methode", label: "M'organiser" },
      ],
    });
    base.push(
      ...strengthQuestion([
        { value: "comprehension", label: "Compréhension" },
        { value: "rappel", label: "Rappel actif" },
        { value: "application", label: "Application" },
        { value: "methode", label: "Méthode" },
        { value: "regularite", label: "Régularité" },
      ]),
    );
    return base;
  }

  if (domain === "programmation") {
    base.push({ id: "current_level", label: "Quel est ton niveau actuel ?", type: "choice", options: LEVEL_OPTIONS });
    base.push({
      id: "usage",
      label: "Que veux-tu être capable de faire ?",
      type: "choice",
      options: [
        { value: "bases", label: "Comprendre les bases" },
        { value: "exercices", label: "Résoudre des exercices" },
        { value: "projet", label: "Construire un projet complet" },
        { value: "emploi", label: "Atteindre un niveau professionnel" },
      ],
    });
    base.push(
      ...strengthQuestion([
        { value: "bases", label: "Bases du langage" },
        { value: "resolution_problemes", label: "Résolution de problèmes" },
        { value: "debug", label: "Debugging" },
        { value: "construction", label: "Construction de projets" },
        { value: "autonomie", label: "Autonomie" },
      ]),
    );
    return base;
  }

  if (domain === "lecture") {
    base.push({
      id: "current_level",
      label: "Combien de livres as-tu lus ces six derniers mois ?",
      type: "choice",
      options: [
        { value: "debutant", label: "Aucun" },
        { value: "debutant_avance", label: "1 à 2" },
        { value: "intermediaire", label: "3 à 6" },
        { value: "avance", label: "Plus de 6" },
      ],
    });
    base.push({
      id: "type_lecture",
      label: "Quel type de lecture ?",
      type: "choice",
      options: [
        { value: "roman", label: "Romans" },
        { value: "essai", label: "Essais / non-fiction" },
        { value: "technique", label: "Ouvrages techniques" },
        { value: "mixte", label: "Un peu de tout" },
      ],
    });
    return base;
  }

  if (domain === "mental") {
    base.push({ id: "current_level", label: "Comment évalues-tu ta discipline actuelle ?", type: "choice", options: LEVEL_OPTIONS });
    base.push({
      id: "difficulte",
      label: "Qu'est-ce qui te fait décrocher ?",
      type: "choice",
      options: [
        { value: "distractions", label: "Les distractions" },
        { value: "motivation", label: "La perte de motivation" },
        { value: "fatigue", label: "La fatigue" },
        { value: "demarrage", label: "Le fait de commencer" },
      ],
    });
    return base;
  }

  if (domain === "habitudes") {
    base.push({
      id: "blocage",
      label: "Qu'est-ce qui t'a empêché de tenir cette habitude jusqu'ici ?",
      help: "C'est la cause qui détermine tes missions, pas l'habitude elle-même.",
      type: "choice",
      options: [
        { value: "oubli", label: "L'oubli" },
        { value: "manque_de_temps", label: "Le manque de temps" },
        { value: "fatigue", label: "La fatigue" },
        { value: "distractions", label: "Les distractions" },
        { value: "demarrage", label: "La difficulté à commencer" },
        { value: "motivation", label: "La perte de motivation" },
        { value: "environnement", label: "Un mauvais environnement" },
        { value: "trop_difficile", label: "L'habitude est trop difficile" },
        { value: "mauvais_moment", label: "Le mauvais moment de la journée" },
        { value: "autre", label: "Autre" },
      ],
    });
    base.push({ id: "current_level", label: "Où en es-tu aujourd'hui ?", type: "choice", options: LEVEL_OPTIONS });
    return base;
  }

  if (domain === "creation") {
    base.push({ id: "current_level", label: "Où en est ton projet ?", type: "choice", options: [
      { value: "debutant", label: "Une idée seulement" },
      { value: "debutant_avance", label: "Un début de plan" },
      { value: "intermediaire", label: "Un prototype" },
      { value: "avance", label: "Un projet déjà avancé" },
    ] });
    base.push({
      id: "etape",
      label: "Quelle étape te semble la plus urgente ?",
      type: "choice",
      options: [
        { value: "conception", label: "Clarifier le concept" },
        { value: "execution", label: "Produire" },
        { value: "finition", label: "Finir et corriger" },
        { value: "publication", label: "Publier" },
      ],
    });
    return base;
  }

  if (domain === "quantitatif") {
    base.push({ id: "cible", label: "Quelle est la valeur à atteindre ?", type: "text", optional: true });
    base.push({ id: "current_level", label: "Où en es-tu aujourd'hui ?", type: "choice", options: LEVEL_OPTIONS });
    return base;
  }

  base.push({ id: "current_level", label: "Où te situes-tu aujourd'hui ?", type: "choice", options: LEVEL_OPTIONS });
  base.push({
    id: "etape",
    label: "Par quoi veux-tu commencer ?",
    type: "choice",
    options: [
      { value: "comprendre", label: "Comprendre le sujet" },
      { value: "pratiquer", label: "Pratiquer régulièrement" },
      { value: "produire", label: "Produire un résultat" },
    ],
  });
  return base;
}

export interface ResourceOption {
  value: ResourceTag;
  label: string;
}

/** Ressources pertinentes selon le domaine — on ne demande rien d'inutile. */
export function resourcesFor(domain: Domain): ResourceOption[] {
  const common: ResourceOption[] = [
    { value: "calme", label: "Un endroit calme" },
    { value: "internet", label: "Une connexion internet" },
  ];

  if (domain === "sport") {
    return [
      { value: "terrain", label: "Un terrain" },
      { value: "salle", label: "Une salle de sport" },
      { value: "ballon", label: "Un ballon" },
      { value: "materiel_sport", label: "Du matériel (élastiques, poids, sac…)" },
      { value: "espace_interieur", label: "Un espace intérieur" },
      { value: "exterieur", label: "Un espace extérieur" },
      { value: "partenaire", label: "Un partenaire d'entraînement" },
      ...common,
    ];
  }

  if (domain === "langues" || domain === "etudes") {
    return [
      { value: "cahier", label: "Un cahier / de quoi écrire" },
      { value: "livre", label: "Un livre ou un support de cours" },
      { value: "audio", label: "De l'audio (écouteurs, podcasts…)" },
      { value: "ordinateur", label: "Un ordinateur" },
      { value: "partenaire", label: "Quelqu'un avec qui pratiquer" },
      ...common,
    ];
  }

  if (domain === "programmation" || domain === "creation") {
    return [
      { value: "ordinateur", label: "Un ordinateur" },
      { value: "cahier", label: "De quoi noter" },
      ...common,
    ];
  }

  if (domain === "lecture") {
    return [
      { value: "livre", label: "Un livre en cours" },
      { value: "cahier", label: "Un carnet de notes" },
      { value: "audio", label: "De l'audio" },
      ...common,
    ];
  }

  return [{ value: "cahier", label: "De quoi noter" }, { value: "espace_interieur", label: "Un espace intérieur" }, ...common];
}

export const WEEKDAYS: { value: string; label: string }[] = [
  { value: "lun", label: "Lun" },
  { value: "mar", label: "Mar" },
  { value: "mer", label: "Mer" },
  { value: "jeu", label: "Jeu" },
  { value: "ven", label: "Ven" },
  { value: "sam", label: "Sam" },
  { value: "dim", label: "Dim" },
];
