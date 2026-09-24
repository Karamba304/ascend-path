# Ascend Path

PROJET : APPLICATION DE PROGRESSION PERSONNALISÉE — BÊTA

1. CONTEXTE DU PRODUIT

Je construis une application web de progression personnelle.

L'application doit permettre à un utilisateur de définir pratiquement n'importe quel objectif : sport, études, langue, programmation, lecture, discipline, création de projet, habitude, objectif quantitatif ou objectif complexe.

Le principe central est :

OBJECTIF → ÉVALUATION → MISSIONS → ACTION → FEEDBACK → ADAPTATION → PROGRESSION

L'application ne doit PAS être un simple tracker d'habitudes, une todo-list ou une application de motivation.

Son cœur est un moteur de progression personnalisé qui détermine quelles actions sont pertinentes pour cet utilisateur, à ce moment précis, selon :

son objectif ;

son niveau actuel ;

ses compétences ;

sa progression ;

son historique ;

son temps disponible ;

sa charge récente ;

sa récupération ;

ses contraintes ;

son environnement ;

son matériel ;

son feedback ;

sa deadline ;

son contexte actuel.

L'application accompagne fortement l'utilisateur mais ne doit jamais promettre ou garantir qu'il atteindra son objectif.

Le niveau de l'application et l'XP représentent la progression dans l'application, PAS la valeur personnelle de l'utilisateur.

2. PHILOSOPHIE DU PRODUIT

Règles fondamentales :

Une mission doit avoir une raison précise d'exister.

L'XP ne doit jamais devenir l'objectif principal.

L'utilisateur ne choisit pas la récompense XP.

L'XP gagnée est permanente et non dépensable.

Une mission non terminée donne 0 XP mais ne retire jamais d'XP déjà gagné.

Supprimer une mission ne retire jamais d'XP.

Une mission supprimée doit avoir une raison.

L'application doit apprendre du feedback.

La difficulté doit évoluer progressivement.

Le système doit pousser l'utilisateur hors de sa zone de confort, sans générer volontairement des missions irréalisables.

La récupération est une vraie composante de progression.

Plus de temps disponible permet généralement plus de travail ou des missions plus riches, mais ne signifie jamais automatiquement plus d'effort maximal.

Une contrainte réelle peut provoquer le remplacement dynamique d'une mission.

Le moteur optimise la progression, pas l'exécution d'un programme rigide.

Les missions doivent être adaptées au domaine. Une mission de boxe ne doit pas ressembler à une mission de football, et une mission d'étude ne doit pas ressembler à une mission sportive.

Les informations demandées à l'utilisateur doivent être pertinentes pour son objectif. Ne pas poser un questionnaire générique inutile.

3. STYLE DE L'APPLICATION

Je veux une interface moderne, premium, immersive et très claire.

L'expérience doit donner une sensation de progression et de système personnel, inspirée des interfaces de progression de jeux vidéo/anime, notamment par :

XP ;

niveaux ;

missions ;

progression ;

animations ;

challenges ;

feedback ;

objectifs.

Mais ne pas copier une œuvre existante, ses personnages, ses logos ou ses éléments protégés.

Le design doit être original.

L'interface doit être :

moderne ;

sombre ou dark-first ;

très lisible ;

responsive ;

fluide ;

mobile-friendly ;

utilisable sur desktop ;

avec de belles cartes ;

barres de progression ;

animations sobres mais satisfaisantes ;

hiérarchie visuelle forte.

Éviter les interfaces surchargées.

4. ONBOARDING

Créer le parcours suivant :

Écran 1 — Splash

Afficher le nom de l'application de façon forte et esthétique.

Animation courte.

Écran 2 — Bienvenue

Afficher :

nom ;

courte phrase expliquant la proposition de valeur ;

bouton COMMENCER ;

bouton SE CONNECTER.

Écran 3 — Création de compte

Champs :

username ;

email ;

mot de passe.

Utiliser une authentification sécurisée.

Ne pas rendre obligatoire la vérification email pour la bêta si cela complique inutilement le premier test utilisateur.

Écran 4 — Objectif

Demander :

« Quel est ton objectif ? »

L'utilisateur peut écrire librement.

Exemples :

Je veux devenir footballeur professionnel.

Je veux apprendre l'espagnol.

Je veux réussir mon bac.

Je veux apprendre Python.

Je veux lire 20 livres.

Je veux améliorer ma discipline.

Je veux créer mon application.

Ne pas limiter les utilisateurs à une liste prédéfinie.

Écran 5 — Classification

Déterminer le domaine probable :

Sport / physique

Langues

Études

Programmation / compétences numériques

Lecture

Mental / discipline

Création / projets

Habitudes

Objectifs quantitatifs

Objectifs complexes

L'utilisateur doit pouvoir corriger la catégorie.

Écran 6 — Évaluation adaptative

NE PAS poser les mêmes questions à tout le monde.

Le moteur doit d'abord comprendre le type d'objectif puis demander uniquement les informations susceptibles d'influencer les missions.

Exemple :

Objectif :
« Devenir footballeur professionnel »

Questions possibles :

âge ;

poste ;

expérience ;

niveau actuel ;

niveau de compétition ;

fréquence actuelle d'entraînement ;

temps disponible ;

jours disponibles ;

accès à un terrain ;

accès à une salle ;

matériel disponible ;

entraînement seul ou accompagné ;

points forts ;

difficultés ;

dernier test ;

objectif intermédiaire ;

date de début.

Objectif :
« Apprendre l'espagnol »

Questions pertinentes :

niveau CECRL A1/A2/B1/B2/C1/C2 ;

ou « je ne connais pas mon niveau » ;

expérience ;

temps disponible ;

objectif concret ;

compétences difficiles ;

date de début.

Objectif :
« Lire 20 livres »

Questions beaucoup plus simples :

nombre de livres déjà lus récemment ;

temps disponible ;

type de livres ;

objectif final ;

deadline.

Ne jamais poser des questions sans utilité pour la génération des missions.

Écran 7 — Début

Demander explicitement :

« Quand souhaites-tu commencer ? »

Options :

aujourd'hui ;

demain ;

date personnalisée.

Une date de début future signifie qu'aucune mission ne doit être considérée comme manquée avant cette date.

Écran 8 — Temps

Demander :

temps disponible par jour ;

temps disponible par semaine ;

jours disponibles.

Écran 9 — Ressources et contraintes

Selon l'objectif, demander uniquement les ressources pertinentes :

matériel ;

salle ;

terrain ;

ordinateur ;

logiciels ;

livres ;

environnement ;

etc.

Écran 10 — Résumé

Afficher clairement toutes les informations importantes avant création.

Permettre la modification.

Écran 11 — Création de progression

Créer l'objectif et son profil de progression.

Écran 12 — Premier jour

Générer les premières missions.

5. PROFIL DE PROGRESSION

Ne pas utiliser uniquement un niveau global.

Pour les objectifs complexes, le profil peut contenir plusieurs dimensions.

Exemple football :

technique ;

finition ;

1v1 ;

contrôle ;

passe ;

vitesse ;

endurance ;

physique ;

compréhension tactique ;

mental.

Exemple langue :

vocabulaire ;

grammaire ;

compréhension orale ;

compréhension écrite ;

expression orale ;

expression écrite ;

prononciation ;

immersion.

Ces indicateurs sont des estimations internes destinées à guider le moteur.

Ne pas les présenter comme des mesures scientifiques absolues.

Le profil doit évoluer avec :

déclarations utilisateur ;

tests ;

résultats ;

feedback ;

missions terminées ;

historique.

6. PAGE TODAY / ACCUEIL

Créer une page principale appelée TODAY.

Elle doit afficher :

En-tête

username ;

niveau de l'application ;

XP actuel ;

barre XP.

Objectif actif

nom ;

progression ;

deadline ;

niveau personnel.

Évaluation

dernier test ;

prochain test si applicable.

Aujourd'hui

Afficher en priorité :

« X min de missions restantes »

et non simplement le temps déjà effectué.

Missions

Afficher les cartes des missions du jour.

L'utilisateur peut commencer n'importe quelle mission.

Ne pas imposer artificiellement un ordre.

Streak

Afficher :

streak actuel ;

meilleur streak.

Le streak reste secondaire par rapport à la progression réelle.

7. CARTE DE MISSION

Chaque mission doit afficher :

titre ;

description courte ;

durée ;

difficulté ;

XP ;

statut ;

bouton d'action.

Statuts :

À faire ;

En cours si nécessaire ;

Terminée ;

Non terminée ;

Supprimée.

8. ÉCRAN DE MISSION

Afficher :

titre ;

description ;

pourquoi cette mission est proposée ;

durée ;

difficulté ;

XP ;

matériel ;

environnement ;

étapes si nécessaire.

Afficher une phrase courte avant la mission.

Bouton :

COMMENCER

9. FIN DE MISSION

Afficher :

MISSION TERMINÉE

Puis :

+XP

Animer la barre XP.

Puis demander :

« Comment était la difficulté ? »

Choix :

Trop facile

Comme prévu

Trop difficile

Commentaire facultatif.

Le feedback doit être stocké et utilisé par le moteur.

10. MISSION NON TERMINÉE

Si une mission n'est pas terminée :

demander la raison :

Pas assez de temps

Trop difficile

Trop facile

Je ne peux pas la réaliser actuellement

Elle ne correspond plus à mon objectif

Autre

Puis demander :

« Souhaites-tu refaire cette mission un autre jour ? »

Si OUI :

demain ;

dans 2 jours ;

date personnalisée.

Si NON :

supprimer la mission pour l'utilisateur.

Puis demander :

« Souhaites-tu la remplacer ? »

Si OUI :

générer une mission alternative compatible.

Si NON :

continuer normalement.

Une mission supprimée ou non terminée ne retire jamais d'XP déjà gagné.

11. ADAPTATION AU CONTEXTE

Créer un mécanisme permettant de modifier une mission si les conditions réelles changent.

Exemple :

Mission prévue :

« Séance en salle »

Utilisateur :

« La salle est fermée. »

Le système doit rechercher une alternative fonctionnellement équivalente.

Exemple :

Salle → home workout.

La nouvelle mission doit conserver autant que possible :

objectif fonctionnel ;

compétence ciblée ;

niveau ;

charge pertinente ;

temps disponible.

Mais adapter :

environnement ;

matériel ;

durée ;

format.

Autres exemples :

terrain inaccessible ;

ordinateur indisponible ;

temps réduit ;

matériel manquant ;

changement de disponibilité.

Le moteur doit adapter la progression, pas déclarer automatiquement l'utilisateur en échec.

12. MOTEUR DE MISSIONS

Le moteur doit fonctionner selon cette chaîne :

OBJECTIF
→ PROFIL
→ CONTRAINTES
→ HISTORIQUE
→ CHARGE
→ BESOINS ACTUELS
→ MISSIONS CANDIDATES
→ FILTRAGE
→ SCORE
→ SÉLECTION
→ DIFFICULTÉ
→ CHARGE
→ JOURNÉE
→ VALIDATION.

13. FILTRAGE DES MISSIONS

Une mission candidate peut être exclue si :

elle ne correspond pas à l'objectif ;

mauvais domaine ;

niveau incompatible ;

prérequis absent ;

temps impossible ;

matériel indisponible ;

environnement impossible ;

charge trop élevée ;

répétition trop rapprochée ;

récupération insuffisante ;

contrainte de sécurité ;

mission devenue inutile.

14. SCORE DES MISSIONS

Utiliser les critères suivants comme base :

pertinence pour l'objectif : 25 ;

pertinence pour le niveau : 15 ;

priorité actuelle : 15 ;

progression nécessaire : 15 ;

temps disponible : 10 ;

récupération / charge : 10 ;

rotation / diversité : 5 ;

feedback utilisateur : 5.

Total : 100.

Ces poids peuvent évoluer selon le domaine et le contexte.

Ne pas sélectionner mécaniquement les cinq missions ayant le meilleur score.

Le moteur doit construire une combinaison cohérente.

15. FAMILLES DE MISSIONS

Familles universelles :

Apprentissage

Pratique

Répétition / consolidation

Difficulté / dépassement

Exposition

Endurance / capacité

Récupération / consolidation

Évaluation

Familles spécifiques pouvant être utilisées selon le domaine :

Force

Endurance

Puissance / explosivité

Technique

Coordination

Mobilité

Récupération

Analyse

Évaluation

Répétition / consolidation

Le système doit choisir les familles pertinentes au lieu de toutes les utiliser.

16. ROTATION

La rotation doit être stratégique.

Éviter :

même famille + même exercice + même difficulté + même durée plusieurs jours de suite.

Mais ne pas changer artificiellement une compétence simplement pour varier.

Si une compétence doit être travaillée plusieurs fois par semaine, elle peut revenir.

La récupération peut également revenir régulièrement.

17. DIFFICULTÉ

Niveaux :

Très facile

Facile

Moyenne

Difficile

Très difficile

La difficulté dépend de :

niveau personnel ;

demande de la mission ;

durée ;

quantité ;

complexité ;

historique ;

feedback ;

fréquence ;

charge récente ;

temps disponible ;

deadline.

« Difficile » signifie exigeant mais raisonnablement réalisable.

« Très difficile » doit rester réalisable dans le contexte prévu.

18. FEEDBACK ET APPRENTISSAGE

Le moteur doit utiliser le feedback pour calibrer progressivement les futures missions.

Exemple :

Difficile → Trop facile plusieurs fois

→ augmentation progressive.

Difficile → Trop difficile plusieurs fois

→ réduction, modification ou découpage.

Ne jamais doubler brutalement la difficulté après une seule réponse.

Chercher des tendances.

Le système doit pouvoir créer des variantes de missions.

19. CHARGE

Utiliser deux budgets :

Budget temps

Temps que l'utilisateur peut consacrer.

Budget charge

Quantité de travail pertinente compte tenu de son historique et de sa récupération.

30 minutes disponibles ne signifie pas forcément 30 minutes d'effort maximal.

Une journée peut être :

20 min travail + 10 min récupération.

20. RÉCUPÉRATION

La récupération est une vraie mission.

Elle peut être proposée quand les données indiquent une charge récente élevée ou un besoin de consolidation.

Selon le domaine, elle peut prendre différentes formes :

mobilité ;

récupération active ;

consolidation ;

analyse ;

retour au calme ;

préparation ;

autre activité pertinente.

Ne pas inventer de prescriptions médicales ou de recommandations arbitraires.

21. CONSTRUCTION DE LA JOURNÉE

Le moteur doit :

déterminer le temps disponible ;

déterminer la charge appropriée ;

identifier les priorités ;

sélectionner les familles pertinentes ;

sélectionner les missions ;

vérifier le temps ;

vérifier la charge ;

vérifier la diversité ;

vérifier la cohérence avec l'objectif ;

produire la journée.

Objectif bêta :

environ 1 à 5 missions par jour selon :

objectif ;

temps ;

difficulté ;

charge ;

contexte.

Plus de temps disponible peut permettre davantage de missions et/ou des missions plus longues/riches.

Ne jamais remplir artificiellement le temps.

22. MISSIONS SUPPLÉMENTAIRES

Si l'utilisateur termine toutes ses missions, ne pas générer automatiquement des missions supplémentaires pour farmer l'XP.

Avant toute mission supplémentaire :

vérifier :

utilité ;

objectif ;

temps ;

charge ;

récupération ;

répétition.

S'il n'y a pas de travail utile :

ne rien ajouter.

23. OBJECTIFS « DEVENIR PRO »

Si l'utilisateur saisit un objectif du type :

« devenir professionnel »

ou tout autre objectif extrêmement ambitieux :

ne pas simplement demander un niveau général.

Créer une évaluation plus poussée adaptée au domaine.

Le moteur doit établir :

niveau initial ;

sous-compétences ;

expérience ;

ressources ;

disponibilité ;

habitudes actuelles ;

points forts ;

points faibles ;

évaluations disponibles ;

étapes intermédiaires.

Le système ne doit jamais garantir que l'utilisateur deviendra professionnel.

Il doit uniquement construire une progression cohérente vers cet objectif.

24. DOMAINES V1

Supporter au minimum :

Sport / physique

Langues

Études

Programmation / compétences numériques

Lecture

Mental / discipline

Création / projets

Habitudes

Objectifs quantitatifs

Objectifs complexes

25. LANGUES

Demander le niveau CECRL lorsque pertinent :

A1 / A2 / B1 / B2 / C1 / C2

ou :

« Je ne connais pas mon niveau »

Possibilité d'évaluation ultérieure.

Familles :

vocabulaire ;

grammaire ;

compréhension orale ;

compréhension écrite ;

expression orale ;

expression écrite ;

prononciation ;

immersion ;

évaluation ;

consolidation.

Adapter réellement les missions au niveau.

26. ÉTUDES

L'objectif principal est la COMPRÉHENSION.

Ne pas réduire l'apprentissage à :

« mémorise 20 dates ».

Le moteur doit pouvoir travailler :

pourquoi ;

comment ;

où ;

qui ;

causes ;

conséquences ;

relations ;

ordre logique ;

application.

Familles :

compréhension ;

rappel actif ;

exercices ;

mémorisation comme support ;

analyse d'erreurs ;

révision ;

application ;

simulation ;

évaluation.

27. PROGRAMMATION

Progression possible :

tutoriel
→ exercice guidé
→ exercice autonome
→ problème
→ debugging
→ construction
→ projet
→ évaluation.

Les missions doivent produire de vrais résultats.

28. LECTURE

Selon l'objectif :

lecture ;

compréhension ;

rappel ;

réflexion ;

analyse ;

progression.

Ne pas créer des métriques artificielles.

29. MENTAL / DISCIPLINE

Missions possibles :

concentration ;

méditation ;

visualisation ;

réflexion ;

gestion des distractions ;

discipline ;

exposition progressive ;

évaluation.

Ne pas créer de faux « score mental scientifique ».

30. CRÉATION / PROJETS

Les grands objectifs doivent être décomposés.

Exemple :

Créer une application :

concept
→ architecture
→ prototype
→ page principale
→ fonctionnalité A
→ fonctionnalité B
→ tests
→ corrections
→ optimisation
→ publication.

Chaque mission doit produire un résultat tangible lorsque cela est pertinent.

31. HABITUDES

Ne pas demander uniquement :

« Quelle habitude veux-tu créer ? »

Demander aussi ce qui empêche actuellement sa mise en place.

Exemples :

oubli ;

manque de temps ;

fatigue ;

téléphone/distractions ;

difficulté à commencer ;

perte de motivation ;

mauvais environnement ;

habitude trop difficile ;

mauvais moment ;

autre.

Le moteur doit chercher la cause.

Exemple :

oubli → déclencheur/rappel.

manque de temps → version courte.

distractions → période sans distraction.

difficulté à commencer → micro-action de démarrage.

fatigue → modification du moment.

habitude trop difficile → réduction temporaire puis reconstruction.

32. SPORT / PHYSIQUE

Les missions doivent être spécifiques à la discipline.

Exemple football :

contrôle ;

dribble ;

1v1 ;

passe ;

finition ;

pied faible ;

coordination ;

vitesse ;

endurance ;

analyse tactique.

Exemple boxe :

garde ;

déplacements ;

jab ;

défense ;

combinaisons ;

coordination ;

travail spécifique.

Ne jamais générer une mission sportive générique sans vérifier la discipline.

Les missions doivent également tenir compte du matériel et de l'environnement.

33. TESTS

Certains objectifs nécessitent des évaluations périodiques.

Le test doit :

mesurer un résultat ;

enregistrer la date ;

conserver l'ancien résultat ;

mettre à jour le niveau personnel ;

influencer les futures missions.

La fréquence dépend de l'objectif.

Ne pas imposer un intervalle universel.

34. HISTORIQUE

Conserver :

missions terminées ;

missions non terminées ;

missions supprimées ;

raisons de suppression ;

XP ;

level-ups ;

tests ;

résultats ;

feedback ;

challenges.

L'utilisateur doit pouvoir comprendre son évolution.

35. XP

XP permanente.

L'utilisateur ne peut pas choisir l'XP.

Valeurs bêta :

Très facile : +50 XP
Facile : +100 XP
Moyenne : +150 XP
Difficile : +200 XP
Très difficile : +250 XP

Challenge : récompense supérieure possible.

Pas d'XP pour :

ouvrir l'application ;

naviguer ;

regarder une page ;

simplement se connecter.

36. NIVEAUX DE L'APPLICATION

Niveaux bêta :

Niveau 1 : 500 XP
Niveau 2 : 1000 XP
Niveau 3 : 1500 XP
Niveau 4 : 2000 XP
Niveau 5 : 2500 XP
Niveau 6 : 3500 XP
Niveau 7 : 4500 XP
Niveau 8 : 5500 XP
Niveau 9 : 6500 XP
Niveau 10 : 7500 XP

Animation de level-up :

NIVEAU X ATTEINT

avec animation et nouvel élément visuel.

37. CHALLENGES

V1 simple.

Exemple :

« Réaliser 4 sessions cette semaine »

2/4

+500 XP

Pas de clans ou classement mondial dans la bêta.

38. PROGRESSION

Page Progression :

objectif ;

progression ;

niveau personnel ;

derniers tests ;

prochains tests ;

missions ;

temps réalisé ;

XP ;

niveau application ;

statistiques spécifiques à l'objectif.

39. PARAMÈTRES

Créer :

compte ;

username ;

email ;

mot de passe ;

notifications ;

rappels ;

thème ;

langue ;

paramètres de progression ;

suppression du compte ;

déconnexion.

40. SOCIAL

PAS DE RÉSEAU SOCIAL EN BÊTA.

Pas :

chat ;

clans ;

classement ;

profil public ;

commentaires publics.

Cela viendra éventuellement plus tard.

41. MODÉRATION

Préparer l'architecture pour qu'une communauté puisse être ajoutée plus tard.

Les règles futures devront interdire notamment :

pornographie ;

sexualisation de mineurs ;

haine ;

racisme ;

antisémitisme ;

islamophobie ;

homophobie ;

discrimination ;

harcèlement ;

menaces ;

incitation à la violence ;

gore extrême ;

arnaques ;

spam ;

doxxing ;

données personnelles publiées ;

promotion d'activités criminelles ;

promotion de l'automutilation ou du suicide.

Les règles doivent être appliquées de manière égale à tous.

42. BASE DE DONNÉES

Utiliser une architecture relationnelle PostgreSQL.

Tables principales :

USERS

id

username

email

password_hash / gestion via système d'authentification

created_at

last_login

settings

OBJECTIVES

id

user_id

title

description

domain

type

created_at

start_date

target_date

daily_time

weekly_time

available_days

status

objective_parameters

PERSONAL_LEVELS

id

objective_id

metric

value

unit

date

origin

comment

TESTS

id

objective_id

planned_date

completed_date

result

unit

status

MISSIONS

id

objective_id

title

description

date

duration

difficulty

xp

status

source

family

skill

constraints

prerequisites

created_at

MISSION_RESULTS

id

mission_id

final_status

completion_date

actual_duration

perceived_difficulty

comment

performance_data

XP_EVENTS

id

user_id

amount

source

mission_id

challenge_id

date

LEVEL_EVENTS

id

user_id

old_level

new_level

date

CHALLENGES

id

user_id

objective_id

title

description

condition

current_progress

required_progress

xp_reward

start_date

end_date

status

Les données doivent être liées à l'utilisateur et protégées.

43. SÉCURITÉ

Utiliser une authentification sécurisée.

Ne jamais stocker les mots de passe en clair.

Les utilisateurs ne doivent pouvoir accéder qu'à leurs propres données.

Utiliser Row Level Security lorsque Supabase est utilisé.

L'utilisateur ne doit jamais pouvoir modifier directement :

son XP ;

ses événements XP ;

son niveau application ;

les récompenses de mission.

Les valeurs importantes doivent être contrôlées côté serveur/backend.

Ne jamais exposer de clé API secrète dans le frontend.

44. ARCHITECTURE DU MOTEUR

Créer une architecture modulaire :

Mission Engine

Objective Analyzer

Profile Manager

Candidate Generator

Candidate Filter

Scoring Engine

Difficulty Engine

Load Engine

Rotation Engine

Recovery Engine

Context Adapter

Day Planner

Feedback Learner

Chaque module doit avoir une responsabilité claire.

Ne pas mettre toute la logique dans un seul gros composant.

45. IA

L'IA peut être utilisée pour :

comprendre l'objectif libre ;

classifier le domaine ;

générer les questions pertinentes ;

comprendre les réponses libres ;

générer des variantes de missions ;

expliquer les missions ;

interpréter certains feedbacks.

Mais l'IA ne doit PAS être l'unique source de vérité pour :

XP ;

niveau ;

dates ;

permissions ;

données utilisateur ;

calculs critiques ;

contraintes ;

sécurité.

Le moteur déterministe doit contrôler ces éléments.

Les secrets API doivent rester côté serveur.

46. ARCHITECTURE FRONTEND

Utiliser des composants réutilisables.

Prévoir :

navigation principale ;

cartes ;

boutons ;

modales ;

formulaires ;

barres de progression ;

badges ;

animations ;

notifications ;

états de chargement ;

états vides ;

états d'erreur.

Éviter de dupliquer la logique.

47. RESPONSIVE

L'application doit être pensée d'abord pour desktop et mobile web.

La navigation doit être confortable sur :

téléphone ;

tablette ;

ordinateur.

Les cartes et boutons doivent rester facilement utilisables sur mobile.

48. PAS DE PLACEHOLDERS FAUX

Ne pas afficher de fausses données comme si elles venaient réellement du backend.

Pour les données non encore connectées, utiliser clairement un état de démonstration/de développement.

Mais les écrans doivent être conçus pour recevoir les vraies données.

49. V1 — CE QUI EST OBLIGATOIRE

La bêta doit contenir :

compte ;

onboarding ;

création d'objectif libre ;

évaluation adaptative ;

date de début ;

contraintes de temps ;

ressources ;

profil de progression ;

Today ;

missions ;

réalisation ;

XP ;

niveaux ;

feedback ;

missions non terminées ;

remplacement ;

adaptation au contexte ;

progression ;

historique ;

tests ;

challenges simples ;

paramètres.

50. CE QUI EST EXCLU DE LA BÊTA

Ne pas construire maintenant :

réseau social ;

clans ;

classement mondial ;

chat ;

abonnement complexe ;

publicité ;

vente de données ;

marketplace ;

application mobile native ;

blocage du téléphone ;

réveil avancé ;

système social complexe ;

dizaines d'intégrations externes.

Préparer seulement une architecture suffisamment propre pour les ajouter plus tard.

51. RÈGLE DE DÉVELOPPEMENT

Ne pas essayer de construire toute l'application en une seule génération.

Construire progressivement.

Avant chaque grosse modification :

vérifier l'architecture existante ;

ne pas casser les fonctionnalités existantes ;

réutiliser les composants ;

éviter les duplications ;

vérifier les erreurs ;

tester le résultat.

Ne pas modifier une partie non concernée sans raison.

52. CRITÈRE FINAL

La bêta doit permettre à un nouvel utilisateur de :

créer un compte ;

définir n'importe quel objectif ;

répondre à une évaluation adaptée ;

définir son temps et ses contraintes ;

recevoir une première journée personnalisée ;

réaliser une mission ;

gagner de l'XP ;

donner son feedback ;

voir son profil évoluer ;

recevoir des missions adaptées ensuite ;

modifier une mission si son contexte change ;

suivre sa progression.

Si ces 12 étapes fonctionnent correctement, la boucle principale de la bêta fonctionne.

IMPORTANT :

Ne pas inventer de fonctionnalités supplémentaires sans nécessité.

Si une décision technique n'est pas claire, ne pas improviser silencieusement : expliquer le problème, proposer l'option la plus simple compatible avec cette architecture et attendre validation lorsqu'une décision importante est nécessaire. Ne construis rien pour l'instant. Analyse ce cahier des charges et transforme-le en plan technique détaillé pour la bêta. Identifie les composants frontend, les routes, les tables Supabase, les fonctions backend, les modules du moteur de progression et leurs dépendances. Vérifie les éventuelles contradictions ou informations manquantes. Ne modifie aucun fichier et ne génère pas encore de code.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2d463ee7-f827-4151-a6c9-f6b5a941d837).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
