# Plan technique — Bêta application de progression personnalisée

## 1. Périmètre de la bêta

La boucle complète : compte → objectif libre → évaluation adaptative → temps/contraintes → profil de progression → journée de missions → réalisation → XP/niveau → feedback → adaptation → progression/historique. Pas de social, pas de classement, pas de paiement.

Construction en 5 lots livrés l'un après l'autre (voir §7), pas en une seule génération.

## 2. Base de données (Lovable Cloud / PostgreSQL)

Tables, toutes liées à l'utilisateur, toutes protégées par Row Level Security (lecture/écriture limitées au propriétaire) :

- `profiles` — username, réglages, date de création (le compte et le mot de passe restent gérés par le système d'authentification, jamais stockés en clair).
- `objectives` — titre, description, domaine, type, dates de début/cible, temps par jour/semaine, jours disponibles, statut, paramètres de l'objectif (réponses de l'évaluation).
- `personal_levels` — une ligne par dimension mesurée (technique, vocabulaire…) : valeur, unité, date, origine, commentaire.
- `tests` — date prévue, date réalisée, résultat, unité, statut.
- `missions` — titre, description, date, durée, difficulté, XP, statut, source, famille, compétence, contraintes, prérequis.
- `mission_results` — statut final, date, durée réelle, difficulté perçue, commentaire, données de performance.
- `xp_events`, `level_events` — journal permanent, **écriture serveur uniquement** (aucune écriture directe autorisée depuis le navigateur).
- `challenges` — condition, progression courante/requise, récompense, période, statut.
- `context_adaptations` — trace des remplacements de mission (raison, mission d'origine, mission de remplacement).
- Table de rôles séparée (`user_roles`) préparée pour la modération future ; aucun rôle stocké sur le profil.

Règle de sécurité clé : XP, niveaux, difficulté et récompenses sont calculés et écrits côté serveur. Le client peut seulement déclarer « mission terminée » + son feedback.

## 3. Moteur de progression (modules côté serveur)

Chaîne : OBJECTIF → PROFIL → CONTRAINTES → HISTORIQUE → CHARGE → BESOINS → CANDIDATS → FILTRAGE → SCORE → SÉLECTION → DIFFICULTÉ → CHARGE → JOURNÉE → VALIDATION.

Un module = une responsabilité :

| Module | Rôle |
|---|---|
| Objective Analyzer | comprend l'objectif libre, propose le domaine, propose les questions pertinentes |
| Profile Manager | crée et met à jour les dimensions du profil |
| Candidate Generator | produit des missions candidates par domaine et famille |
| Candidate Filter | élimine les missions impossibles (temps, matériel, niveau, répétition, récupération, sécurité) |
| Scoring Engine | note sur 100 selon les poids du cahier des charges |
| Difficulty Engine | fixe la difficulté (5 paliers) et l'XP associée |
| Load Engine | gère budget temps et budget charge séparément |
| Rotation Engine | évite les répétitions stériles sans casser un travail nécessaire |
| Recovery Engine | propose récupération/consolidation quand la charge récente le justifie |
| Context Adapter | remplace une mission quand le contexte réel change, en conservant la compétence visée |
| Day Planner | assemble une journée cohérente de 1 à 5 missions |
| Feedback Learner | ajuste la calibration sur des tendances, jamais sur une seule réponse |

Le moteur est déterministe pour tout ce qui compte (XP, niveau, dates, contraintes). L'IA sert uniquement à comprendre l'objectif écrit librement, classifier le domaine, générer les questions et les variantes de missions, et rédiger les explications. Les clés restent côté serveur.

Barème XP (fixe) : 50 / 100 / 150 / 200 / 250. Paliers de niveau 1→10 : 500 à 7500 XP. XP permanente, jamais retirée.

## 4. Écrans et navigation

Onboarding : splash → bienvenue → création de compte → objectif libre → confirmation du domaine → évaluation adaptative → date de début → temps disponible → ressources et contraintes → résumé modifiable → création → premier jour.

Application : `Today` (accueil), détail d'une mission, fin de mission, mission non terminée, `Progression`, `Historique`, `Tests`, `Challenges`, `Paramètres`.

Today affiche : en-tête (username, niveau, XP, barre), objectif actif, évaluation (dernier/prochain test), « X min de missions restantes », les cartes de missions du jour dans n'importe quel ordre, streak en information secondaire.

## 5. Composants réutilisables

Cartes de mission, barre de progression XP, badge de difficulté, badge de statut, boutons, modales, formulaires d'onboarding par étapes, animations de gain d'XP et de passage de niveau, notifications, états de chargement, états vides, états d'erreur.

Un seul système de styles (thème sombre, lisible, responsive mobile/tablette/desktop). Aucune fausse donnée présentée comme réelle : tout écran non encore branché est explicitement marqué démonstration.

## 6. Points à clarifier (contradictions et manques du cahier des charges)

1. **Niveau de l'application : par compte ou par objectif ?** Le cahier parle d'un niveau d'application global mais aussi de plusieurs objectifs. Proposition la plus simple : XP et niveau **par compte**, un seul objectif actif à la fois en bêta.
2. **Plusieurs objectifs simultanés ?** Non traité. Proposition : un objectif actif en bêta, l'architecture permet d'en ajouter plus tard.
3. **Génération des missions : à quel moment ?** Proposition : à la première ouverture de la journée, plus un bouton de régénération manuelle limité — pas de tâche planifiée en bêta.
4. **Streak : quelle règle exacte ?** Proposition : une journée compte si au moins une mission de la journée est terminée ; les jours non disponibles et les jours avant la date de début ne cassent pas le streak.
5. **Contenu des missions : IA ou catalogue ?** Proposition : catalogue par domaine comme socle fiable, IA pour les variantes et les explications. Un catalogue purement IA rendrait les missions instables ; un catalogue seul limiterait la variété.
6. **Vérification email** : désactivée pour la bêta, comme demandé.
7. **Tests périodiques** : la fréquence dépend du domaine ; à définir domaine par domaine au lot 4.
8. **Langue de l'interface** : français par défaut ; le sélecteur de langue des paramètres restera présent mais sans traduction complète en bêta.

## 7. Ordre de construction

1. **Lot 1** — Backend : authentification, tables, règles d'accès, écriture serveur de l'XP.
2. **Lot 2** — Design système + onboarding complet jusqu'au résumé.
3. **Lot 3** — Moteur (modules, catalogue de missions pour 3 domaines : sport, langues, études) + Today + réalisation d'une mission + XP/niveau/feedback.
4. **Lot 4** — Mission non terminée, remplacement, adaptation au contexte, tests, challenges, domaines restants.
5. **Lot 5** — Progression, historique, paramètres, finitions d'animations et responsive.

Chaque lot : vérifier l'existant, réutiliser les composants, ne rien casser, tester la boucle avant de continuer.
