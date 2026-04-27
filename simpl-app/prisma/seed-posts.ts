/**
 * Last updated: 2026-04-27
 * Purpose: Creates all seed posts — 20 community root posts, 8 reply posts,
 *   2 explicitly flagged/hidden posts, and 6 moderation-scenario posts used
 *   to exercise every policy branch in tests and manual QA.
 */

import { PostStatus, PrismaClient } from "@prisma/client";
import { type SeedActors } from "./seed-actors";
import { createPost } from "./seed-helpers";

// ------------------------------
// Post creation
// ------------------------------

export async function createPosts(prisma: PrismaClient, actors: SeedActors) {
  const { alice, bob, clara, diego, emma, farid, gina, hugo, ines, julien, karim } = actors;

  // --- Root posts ---
  const rootPosts = await Promise.all([
    createPost(prisma, { title: "Créer un réseau local utile", body: "Et si Simpl servait à coordonner des idées, des besoins et des retours entre personnes proches géographiquement ?", authorId: alice.id, latitude: 46.5197, longitude: 6.6323 }),
    createPost(prisma, { title: "Nouveau design", body: "Je teste une interface plus claire avec des boutons plus lisibles et une structure proche du prototype d'origine.", authorId: bob.id, latitude: 46.5208, longitude: 6.6352 }),
    createPost(prisma, { title: "Petit update", body: "J'ai changé les règles de modération pour qu'elles collent mieux à notre volume actuel et aux usages réels.", authorId: clara.id, latitude: 46.5214, longitude: 6.6294 }),
    createPost(prisma, { title: "On a un design en retro", body: "Le noir et blanc revient, les bordures aussi, et le bouton + reprend sa place au-dessus de la liste.", authorId: diego.id, latitude: 46.5189, longitude: 6.6318 }),
    createPost(prisma, { title: "Marché de quartier samedi", body: "Qui passe au marché samedi matin ? J'aimerais centraliser les besoins et les coups de main dans le voisinage.", authorId: emma.id, latitude: 46.5232, longitude: 6.6381 }),
    createPost(prisma, { title: "Atelier vélo partagé", body: "On pourrait lancer un atelier vélo de deux heures le jeudi soir. Outils, café et mini diagnostics sur place.", authorId: alice.id, latitude: 46.5151, longitude: 6.6261 }),
    createPost(prisma, { title: "Mur d'idées pour le parc", body: "Le parc manque d'un espace simple pour proposer des améliorations. Bancs, ombre, eau, lecture, sport, tout est bienvenu.", authorId: bob.id, latitude: 46.5244, longitude: 6.6412 }),
    createPost(prisma, { title: "Besoin d'un coup de main déménagement", body: "Je déménage à deux rues d'ici vendredi en fin d'après-midi. Si quelqu'un a un diable ou 30 minutes, je prends.", authorId: clara.id, latitude: 46.5165, longitude: 6.6277 }),
    createPost(prisma, { title: "Bibliothèque de rue", body: "On pourrait installer une petite boîte à livres près de l'arrêt de bus. Idées pour l'emplacement et l'entretien ?", authorId: diego.id, latitude: 46.5176, longitude: 6.6334 }),
    createPost(prisma, { title: "Signalement bruit tardif", body: "Plusieurs soirées sont parties très loin cette semaine. On devrait peut-être documenter ça proprement avant de juger trop vite.", authorId: emma.id, latitude: 46.5221, longitude: 6.6302 }),
    createPost(prisma, { title: "Cours de cuisine entre voisins", body: "Je peux animer un atelier cuisine simple et bon marché dimanche. Si on est six ou sept, ça devient vraiment sympa.", authorId: alice.id, latitude: 46.5261, longitude: 6.6374 }),
    createPost(prisma, { title: "Retour sur la file de modération", body: "Je trouve bien d'avoir une page séparée pour les contenus signalés, mais il faut la garder très lisible.", authorId: bob.id, latitude: 46.5202, longitude: 6.6368 }),
    createPost(prisma, { title: "Mur végétal partagé", body: "Quelqu'un serait partant pour monter un petit mur végétal collectif dans la cour ? J'ai déjà quelques bacs.", authorId: clara.id, latitude: 46.5148, longitude: 6.6249 }),
    createPost(prisma, { title: "Écran de projection été", body: "J'ai un vieux vidéoprojecteur qui peut encore servir. Si on trouve un mur blanc, on peut faire une séance de quartier.", authorId: diego.id, latitude: 46.5219, longitude: 6.6347 }),
    createPost(prisma, { title: "Point d'eau pour les cyclistes", body: "Sur l'axe principal il manque un endroit simple pour remplir une gourde. Je note les endroits possibles.", authorId: emma.id, latitude: 46.5191, longitude: 6.6285 }),
    createPost(prisma, { title: "Échange de plantes et boutures", body: "On pourrait faire une table libre pour plantes, pots, boutures et conseils. Qui voudrait participer ?", authorId: alice.id, latitude: 46.5272, longitude: 6.6423 }),
    createPost(prisma, { title: "Collecte de vêtements locale", body: "Avant de tout envoyer loin, est-ce qu'on peut d'abord faire circuler ce qui peut encore servir ici ?", authorId: bob.id, latitude: 46.5139, longitude: 6.6255 }),
    createPost(prisma, { title: "Question sur les alertes météo", body: "Quand il y a de grosses pluies, une alerte locale dans le fil serait utile pour les caves et vélos en extérieur.", authorId: clara.id, latitude: 46.5251, longitude: 6.6395 }),
    createPost(prisma, { title: "Besoin de calme dans la cour", body: "Le matin tôt résonne beaucoup dans la cour. Peut-être qu'un rappel simple et collectif suffirait déjà.", authorId: diego.id, latitude: 46.5158, longitude: 6.6268 }),
    createPost(prisma, { title: "Affichage d'entraide locale", body: "On a plein de petits besoins qui pourraient être résolus à 500 mètres. Le fil Simpl devrait rendre ça très visible.", authorId: emma.id, latitude: 46.5182, longitude: 6.6329 }),
  ]);

  // --- Reply posts ---
  const replyPosts = await Promise.all([
    createPost(prisma, { title: "Réponse", body: "La V1 devrait prioriser le fil principal, les commentaires et une modération lisible.", authorId: bob.id, parentId: rootPosts[0].id, rootId: rootPosts[0].id, latitude: 46.5205, longitude: 6.6341 }),
    createPost(prisma, { title: "Même avis", body: "Oui, et il faut garder un ton très simple dans l'interface, sinon on perd le côté direct du prototype initial.", authorId: clara.id, parentId: rootPosts[0].id, rootId: rootPosts[0].id, latitude: 46.5193, longitude: 6.6315 }),
    createPost(prisma, { title: "Pour le marché", body: "Je peux passer avec une liste de courses et une glacière. On peut mutualiser les trajets facilement.", authorId: diego.id, parentId: rootPosts[4].id, rootId: rootPosts[4].id, latitude: 46.5231, longitude: 6.6373 }),
    createPost(prisma, { title: "Je viens aussi", body: "Je suis partante pour l'atelier vélo, surtout si on documente aussi les pièces de base à garder sur place.", authorId: emma.id, parentId: rootPosts[5].id, rootId: rootPosts[5].id, latitude: 46.5147, longitude: 6.6259 }),
    createPost(prisma, { title: "Signalement en discussion", body: "Le contenu est limite, mais pas forcément à masquer. Ça mérite une vraie revue collective.", authorId: alice.id, parentId: rootPosts[9].id, rootId: rootPosts[9].id, latitude: 46.5218, longitude: 6.6298, status: PostStatus.UNDER_REVIEW }),
    createPost(prisma, { title: "Bonne idée", body: "L'affichage d'entraide pourrait aussi remonter les demandes urgentes, avec une règle simple et transparente.", authorId: bob.id, parentId: rootPosts[19].id, rootId: rootPosts[19].id, latitude: 46.5186, longitude: 6.6332 }),
    createPost(prisma, { title: "Complément", body: "Pour les alertes météo, je verrais bien un message de service distinct des posts classiques.", authorId: clara.id, parentId: rootPosts[17].id, rootId: rootPosts[17].id, latitude: 46.5248, longitude: 6.6399 }),
    createPost(prisma, { title: "Volontaire", body: "Je peux aider au déménagement vendredi pendant une petite heure si besoin.", authorId: emma.id, parentId: rootPosts[7].id, rootId: rootPosts[7].id, latitude: 46.5162, longitude: 6.6281 }),
  ]);

  // --- Explicitly flagged / hidden posts ---
  const [flaggedPost, hiddenPost] = await Promise.all([
    createPost(prisma, { title: "Contenu signalé d'exemple", body: "Ce post sert à vérifier la file de modération et les décisions KEEP/REMOVE.", authorId: clara.id, latitude: 46.517, longitude: 6.629, status: PostStatus.UNDER_REVIEW }),
    createPost(prisma, { title: "Post fortement contesté", body: "Ce post est là pour tester le passage automatique en état HIDDEN quand plusieurs votes REMOVE s'accumulent.", authorId: diego.id, latitude: 46.5169, longitude: 6.6272, status: PostStatus.HIDDEN }),
  ]);

  // --- Moderation policy scenario posts ---
  // Each post is pre-seeded at 9 votes so one additional vote crosses the 10-vote threshold.
  const moderationScenarioPosts = await Promise.all([
    createPost(prisma, { title: "SCENARIO - <10 votes (one vote test)", body: "Seeded below 10 votes so one additional vote still keeps it in moderation and homepage.", authorId: farid.id, latitude: 46.5229, longitude: 6.6402, status: PostStatus.UNDER_REVIEW }),
    createPost(prisma, { title: "SCENARIO - trigger delete with one REMOVE", body: "Seeded at 9 votes so one extra REMOVE reaches >=10 with bad >= 2x good.", authorId: gina.id, latitude: 46.5234, longitude: 6.6415, status: PostStatus.UNDER_REVIEW }),
    createPost(prisma, { title: "SCENARIO - trigger approval with one KEEP", body: "Seeded at 9 votes so one extra KEEP reaches >=10 with good >= 2x bad.", authorId: hugo.id, latitude: 46.5241, longitude: 6.6392, status: PostStatus.ACTIVE }),
    createPost(prisma, { title: "SCENARIO - trigger moderation-only with one REMOVE", body: "Seeded at 9 votes so one extra REMOVE reaches >=10 with bad > good but without 2x ratio.", authorId: ines.id, latitude: 46.5174, longitude: 6.6269, status: PostStatus.HIDDEN }),
    createPost(prisma, { title: "SCENARIO - trigger dual visibility with one KEEP", body: "Seeded at 9 votes so one extra KEEP reaches >=10 with good >= bad and no 2x ratio.", authorId: julien.id, latitude: 46.5188, longitude: 6.6301, status: PostStatus.UNDER_REVIEW }),
    createPost(prisma, { title: "SCENARIO - reporter specific homepage hide (one vote toggle)", body: "Reporter starts with active REMOVE; one KEEP vote from that reporter restores homepage visibility for that actor.", authorId: karim.id, latitude: 46.5211, longitude: 6.6359, status: PostStatus.UNDER_REVIEW }),
  ]);

  return { rootPosts, replyPosts, flaggedPost, hiddenPost, moderationScenarioPosts };
}

export type SeedPosts = Awaited<ReturnType<typeof createPosts>>;
