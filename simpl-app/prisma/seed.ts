/**
 * Last updated: 2026-04-22
 * Changes: Added explicit moderation-policy scenario posts and aligned seed counter/status recalculation with the new threshold rules.
 * Purpose: Seed development data for the Simpl PostgreSQL domain.
 */

import {
  ModerationDecision,
  PostStatus,
  PrismaClient,
  ReactionType,
} from "@prisma/client";
import { evaluateModerationPolicy } from "../lib/policy";

const prisma = new PrismaClient();

type SeedPostInput = {
  title: string;
  body: string;
  authorId: string;
  latitude: number;
  longitude: number;
  parentId?: string;
  rootId?: string;
  status?: PostStatus;
};

async function createPost(input: SeedPostInput) {
  return prisma.post.create({
    data: {
      title: input.title,
      body: input.body,
      authorId: input.authorId,
      latitude: input.latitude,
      longitude: input.longitude,
      parentId: input.parentId ?? null,
      rootId: input.rootId ?? null,
      status: input.status ?? PostStatus.ACTIVE,
    },
  });
}

async function updatePostCounters(postId: string) {
  const [reactions, moderationVotes, replyCount] = await Promise.all([
    prisma.reaction.findMany({
      where: { postId },
      select: { type: true },
    }),
    prisma.moderationVote.findMany({
      where: { postId },
      select: { decision: true },
    }),
    prisma.post.count({
      where: { parentId: postId },
    }),
  ]);

  const likeCount = reactions.filter((reaction) => reaction.type === ReactionType.LIKE).length;
  const dislikeCount = reactions.filter((reaction) => reaction.type === ReactionType.DISLIKE).length;
  const keepVoteCount = moderationVotes.filter(
    (vote) => vote.decision === ModerationDecision.KEEP,
  ).length;
  const removeVoteCount = moderationVotes.filter(
    (vote) => vote.decision === ModerationDecision.REMOVE,
  ).length;

  const moderationOutcome = evaluateModerationPolicy(keepVoteCount, removeVoteCount);

  if (moderationOutcome.shouldDelete) {
    await prisma.post.delete({ where: { id: postId } });
    return replyCount;
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      likeCount,
      dislikeCount,
      keepVoteCount,
      removeVoteCount,
      reportCount: removeVoteCount,
      isHomepageVisible: moderationOutcome.visibleOnHomepage,
      isInModeration: moderationOutcome.inModeration,
      status: moderationOutcome.status,
    },
  });

  return replyCount;
}

async function main() {
  await prisma.moderationVote.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.post.deleteMany();
  await prisma.actor.deleteMany();

  const [alice, bob, clara, diego, emma, farid, gina, hugo, ines, julien, karim, lea] = await Promise.all([
    prisma.actor.create({
      data: { key: "seed-alice", displayName: "Anon-Alice" },
    }),
    prisma.actor.create({
      data: { key: "seed-bob", displayName: "Anon-Bob" },
    }),
    prisma.actor.create({
      data: { key: "seed-clara", displayName: "Anon-Clara" },
    }),
    prisma.actor.create({
      data: { key: "seed-diego", displayName: "Anon-Diego" },
    }),
    prisma.actor.create({
      data: { key: "seed-emma", displayName: "Anon-Emma" },
    }),
    prisma.actor.create({
      data: { key: "seed-farid", displayName: "Anon-Farid" },
    }),
    prisma.actor.create({
      data: { key: "seed-gina", displayName: "Anon-Gina" },
    }),
    prisma.actor.create({
      data: { key: "seed-hugo", displayName: "Anon-Hugo" },
    }),
    prisma.actor.create({
      data: { key: "seed-ines", displayName: "Anon-Ines" },
    }),
    prisma.actor.create({
      data: { key: "seed-julien", displayName: "Anon-Julien" },
    }),
    prisma.actor.create({
      data: { key: "seed-karim", displayName: "Anon-Karim" },
    }),
    prisma.actor.create({
      data: { key: "seed-lea", displayName: "Anon-Lea" },
    }),
  ]);

  const rootPosts = await Promise.all([
    createPost({
      title: "Créer un réseau local utile",
      body: "Et si Simpl servait à coordonner des idées, des besoins et des retours entre personnes proches géographiquement ?",
      authorId: alice.id,
      latitude: 46.5197,
      longitude: 6.6323,
    }),
    createPost({
      title: "Nouveau design",
      body: "Je teste une interface plus claire avec des boutons plus lisibles et une structure proche du prototype d'origine.",
      authorId: bob.id,
      latitude: 46.5208,
      longitude: 6.6352,
    }),
    createPost({
      title: "Petit update",
      body: "J'ai changé les règles de modération pour qu'elles collent mieux à notre volume actuel et aux usages réels.",
      authorId: clara.id,
      latitude: 46.5214,
      longitude: 6.6294,
    }),
    createPost({
      title: "On a un design en retro",
      body: "Le noir et blanc revient, les bordures aussi, et le bouton + reprend sa place au-dessus de la liste.",
      authorId: diego.id,
      latitude: 46.5189,
      longitude: 6.6318,
    }),
    createPost({
      title: "Marché de quartier samedi",
      body: "Qui passe au marché samedi matin ? J'aimerais centraliser les besoins et les coups de main dans le voisinage.",
      authorId: emma.id,
      latitude: 46.5232,
      longitude: 6.6381,
    }),
    createPost({
      title: "Atelier vélo partagé",
      body: "On pourrait lancer un atelier vélo de deux heures le jeudi soir. Outils, café et mini diagnostics sur place.",
      authorId: alice.id,
      latitude: 46.5151,
      longitude: 6.6261,
    }),
    createPost({
      title: "Mur d'idées pour le parc",
      body: "Le parc manque d'un espace simple pour proposer des améliorations. Bancs, ombre, eau, lecture, sport, tout est bienvenu.",
      authorId: bob.id,
      latitude: 46.5244,
      longitude: 6.6412,
    }),
    createPost({
      title: "Besoin d'un coup de main déménagement",
      body: "Je déménage à deux rues d'ici vendredi en fin d'après-midi. Si quelqu'un a un diable ou 30 minutes, je prends.",
      authorId: clara.id,
      latitude: 46.5165,
      longitude: 6.6277,
    }),
    createPost({
      title: "Bibliothèque de rue",
      body: "On pourrait installer une petite boîte à livres près de l'arrêt de bus. Idées pour l'emplacement et l'entretien ?",
      authorId: diego.id,
      latitude: 46.5176,
      longitude: 6.6334,
    }),
    createPost({
      title: "Signalement bruit tardif",
      body: "Plusieurs soirées sont parties très loin cette semaine. On devrait peut-être documenter ça proprement avant de juger trop vite.",
      authorId: emma.id,
      latitude: 46.5221,
      longitude: 6.6302,
    }),
    createPost({
      title: "Cours de cuisine entre voisins",
      body: "Je peux animer un atelier cuisine simple et bon marché dimanche. Si on est six ou sept, ça devient vraiment sympa.",
      authorId: alice.id,
      latitude: 46.5261,
      longitude: 6.6374,
    }),
    createPost({
      title: "Retour sur la file de modération",
      body: "Je trouve bien d'avoir une page séparée pour les contenus signalés, mais il faut la garder très lisible.",
      authorId: bob.id,
      latitude: 46.5202,
      longitude: 6.6368,
    }),
    createPost({
      title: "Mur végétal partagé",
      body: "Quelqu'un serait partant pour monter un petit mur végétal collectif dans la cour ? J'ai déjà quelques bacs.",
      authorId: clara.id,
      latitude: 46.5148,
      longitude: 6.6249,
    }),
    createPost({
      title: "Écran de projection été",
      body: "J'ai un vieux vidéoprojecteur qui peut encore servir. Si on trouve un mur blanc, on peut faire une séance de quartier.",
      authorId: diego.id,
      latitude: 46.5219,
      longitude: 6.6347,
    }),
    createPost({
      title: "Point d'eau pour les cyclistes",
      body: "Sur l'axe principal il manque un endroit simple pour remplir une gourde. Je note les endroits possibles.",
      authorId: emma.id,
      latitude: 46.5191,
      longitude: 6.6285,
    }),
    createPost({
      title: "Échange de plantes et boutures",
      body: "On pourrait faire une table libre pour plantes, pots, boutures et conseils. Qui voudrait participer ?",
      authorId: alice.id,
      latitude: 46.5272,
      longitude: 6.6423,
    }),
    createPost({
      title: "Collecte de vêtements locale",
      body: "Avant de tout envoyer loin, est-ce qu'on peut d'abord faire circuler ce qui peut encore servir ici ?",
      authorId: bob.id,
      latitude: 46.5139,
      longitude: 6.6255,
    }),
    createPost({
      title: "Question sur les alertes météo",
      body: "Quand il y a de grosses pluies, une alerte locale dans le fil serait utile pour les caves et vélos en extérieur.",
      authorId: clara.id,
      latitude: 46.5251,
      longitude: 6.6395,
    }),
    createPost({
      title: "Besoin de calme dans la cour",
      body: "Le matin tôt résonne beaucoup dans la cour. Peut-être qu'un rappel simple et collectif suffirait déjà.",
      authorId: diego.id,
      latitude: 46.5158,
      longitude: 6.6268,
    }),
    createPost({
      title: "Affichage d'entraide locale",
      body: "On a plein de petits besoins qui pourraient être résolus à 500 mètres. Le fil Simpl devrait rendre ça très visible.",
      authorId: emma.id,
      latitude: 46.5182,
      longitude: 6.6329,
    }),
  ]);

  const replyPosts = await Promise.all([
    createPost({
      title: "Réponse",
      body: "La V1 devrait prioriser le fil principal, les commentaires et une modération lisible.",
      authorId: bob.id,
      parentId: rootPosts[0].id,
      rootId: rootPosts[0].id,
      latitude: 46.5205,
      longitude: 6.6341,
    }),
    createPost({
      title: "Même avis",
      body: "Oui, et il faut garder un ton très simple dans l'interface, sinon on perd le côté direct du prototype initial.",
      authorId: clara.id,
      parentId: rootPosts[0].id,
      rootId: rootPosts[0].id,
      latitude: 46.5193,
      longitude: 6.6315,
    }),
    createPost({
      title: "Pour le marché",
      body: "Je peux passer avec une liste de courses et une glacière. On peut mutualiser les trajets facilement.",
      authorId: diego.id,
      parentId: rootPosts[4].id,
      rootId: rootPosts[4].id,
      latitude: 46.5231,
      longitude: 6.6373,
    }),
    createPost({
      title: "Je viens aussi",
      body: "Je suis partante pour l'atelier vélo, surtout si on documente aussi les pièces de base à garder sur place.",
      authorId: emma.id,
      parentId: rootPosts[5].id,
      rootId: rootPosts[5].id,
      latitude: 46.5147,
      longitude: 6.6259,
    }),
    createPost({
      title: "Signalement en discussion",
      body: "Le contenu est limite, mais pas forcément à masquer. Ça mérite une vraie revue collective.",
      authorId: alice.id,
      parentId: rootPosts[9].id,
      rootId: rootPosts[9].id,
      latitude: 46.5218,
      longitude: 6.6298,
      status: PostStatus.UNDER_REVIEW,
    }),
    createPost({
      title: "Bonne idée",
      body: "L'affichage d'entraide pourrait aussi remonter les demandes urgentes, avec une règle simple et transparente.",
      authorId: bob.id,
      parentId: rootPosts[19].id,
      rootId: rootPosts[19].id,
      latitude: 46.5186,
      longitude: 6.6332,
    }),
    createPost({
      title: "Complément",
      body: "Pour les alertes météo, je verrais bien un message de service distinct des posts classiques.",
      authorId: clara.id,
      parentId: rootPosts[17].id,
      rootId: rootPosts[17].id,
      latitude: 46.5248,
      longitude: 6.6399,
    }),
    createPost({
      title: "Volontaire",
      body: "Je peux aider au déménagement vendredi pendant une petite heure si besoin.",
      authorId: emma.id,
      parentId: rootPosts[7].id,
      rootId: rootPosts[7].id,
      latitude: 46.5162,
      longitude: 6.6281,
    }),
  ]);

  const [flaggedPost, hiddenPost] = await Promise.all([
    createPost({
      title: "Contenu signalé d'exemple",
      body: "Ce post sert à vérifier la file de modération et les décisions KEEP/REMOVE.",
      authorId: clara.id,
      latitude: 46.517,
      longitude: 6.629,
      status: PostStatus.UNDER_REVIEW,
    }),
    createPost({
      title: "Post fortement contesté",
      body: "Ce post est là pour tester le passage automatique en état HIDDEN quand plusieurs votes REMOVE s'accumulent.",
      authorId: diego.id,
      latitude: 46.5169,
      longitude: 6.6272,
      status: PostStatus.HIDDEN,
    }),
  ]);

  const moderationScenarioPosts = await Promise.all([
    createPost({
      title: "SCENARIO - <10 votes (one vote test)",
      body: "Seeded below 10 votes so one additional vote still keeps it in moderation and homepage.",
      authorId: farid.id,
      latitude: 46.5229,
      longitude: 6.6402,
      status: PostStatus.UNDER_REVIEW,
    }),
    createPost({
      title: "SCENARIO - trigger delete with one REMOVE",
      body: "Seeded at 9 votes so one extra REMOVE reaches >=10 with bad >= 2x good.",
      authorId: gina.id,
      latitude: 46.5234,
      longitude: 6.6415,
      status: PostStatus.UNDER_REVIEW,
    }),
    createPost({
      title: "SCENARIO - trigger approval with one KEEP",
      body: "Seeded at 9 votes so one extra KEEP reaches >=10 with good >= 2x bad.",
      authorId: hugo.id,
      latitude: 46.5241,
      longitude: 6.6392,
      status: PostStatus.ACTIVE,
    }),
    createPost({
      title: "SCENARIO - trigger moderation-only with one REMOVE",
      body: "Seeded at 9 votes so one extra REMOVE reaches >=10 with bad > good but without 2x ratio.",
      authorId: ines.id,
      latitude: 46.5174,
      longitude: 6.6269,
      status: PostStatus.HIDDEN,
    }),
    createPost({
      title: "SCENARIO - trigger dual visibility with one KEEP",
      body: "Seeded at 9 votes so one extra KEEP reaches >=10 with good >= bad and no 2x ratio.",
      authorId: julien.id,
      latitude: 46.5188,
      longitude: 6.6301,
      status: PostStatus.UNDER_REVIEW,
    }),
    createPost({
      title: "SCENARIO - reporter specific homepage hide (one vote toggle)",
      body: "Reporter starts with active REMOVE; one KEEP vote from that reporter restores homepage visibility for that actor.",
      authorId: karim.id,
      latitude: 46.5211,
      longitude: 6.6359,
      status: PostStatus.UNDER_REVIEW,
    }),
  ]);

  const allPosts = [...rootPosts, ...replyPosts, flaggedPost, hiddenPost, ...moderationScenarioPosts];

  await prisma.reaction.createMany({
    data: [
      { actorId: bob.id, postId: rootPosts[0].id, type: ReactionType.LIKE },
      { actorId: clara.id, postId: rootPosts[0].id, type: ReactionType.LIKE },
      { actorId: diego.id, postId: rootPosts[1].id, type: ReactionType.LIKE },
      { actorId: emma.id, postId: rootPosts[1].id, type: ReactionType.LIKE },
      { actorId: alice.id, postId: rootPosts[2].id, type: ReactionType.LIKE },
      { actorId: emma.id, postId: rootPosts[2].id, type: ReactionType.DISLIKE },
      { actorId: alice.id, postId: rootPosts[4].id, type: ReactionType.LIKE },
      { actorId: bob.id, postId: rootPosts[4].id, type: ReactionType.LIKE },
      { actorId: clara.id, postId: rootPosts[5].id, type: ReactionType.LIKE },
      { actorId: diego.id, postId: rootPosts[7].id, type: ReactionType.LIKE },
      { actorId: emma.id, postId: rootPosts[8].id, type: ReactionType.LIKE },
      { actorId: bob.id, postId: rootPosts[10].id, type: ReactionType.LIKE },
      { actorId: clara.id, postId: rootPosts[12].id, type: ReactionType.LIKE },
      { actorId: alice.id, postId: rootPosts[15].id, type: ReactionType.LIKE },
      { actorId: diego.id, postId: rootPosts[19].id, type: ReactionType.LIKE },
      { actorId: alice.id, postId: replyPosts[0].id, type: ReactionType.LIKE },
      { actorId: clara.id, postId: replyPosts[1].id, type: ReactionType.LIKE },
      { actorId: bob.id, postId: replyPosts[2].id, type: ReactionType.LIKE },
      { actorId: alice.id, postId: replyPosts[3].id, type: ReactionType.LIKE },
      { actorId: emma.id, postId: flaggedPost.id, type: ReactionType.DISLIKE },
      { actorId: clara.id, postId: hiddenPost.id, type: ReactionType.DISLIKE },
    ],
  });

  await prisma.moderationVote.createMany({
    data: [
      {
        actorId: alice.id,
        postId: flaggedPost.id,
        decision: ModerationDecision.REMOVE,
      },
      {
        actorId: bob.id,
        postId: flaggedPost.id,
        decision: ModerationDecision.REMOVE,
      },
      {
        actorId: emma.id,
        postId: flaggedPost.id,
        decision: ModerationDecision.KEEP,
      },
      {
        actorId: alice.id,
        postId: hiddenPost.id,
        decision: ModerationDecision.REMOVE,
      },
      {
        actorId: bob.id,
        postId: hiddenPost.id,
        decision: ModerationDecision.REMOVE,
      },
      {
        actorId: clara.id,
        postId: hiddenPost.id,
        decision: ModerationDecision.REMOVE,
      },
      {
        actorId: diego.id,
        postId: replyPosts[4].id,
        decision: ModerationDecision.REMOVE,
      },
      // Scenario 1: total 8 votes (5 remove / 3 keep) => one vote stays below 10
      { actorId: alice.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.REMOVE },
      { actorId: bob.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.REMOVE },
      { actorId: clara.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.REMOVE },
      { actorId: diego.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.REMOVE },
      { actorId: emma.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.REMOVE },
      { actorId: farid.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.KEEP },
      { actorId: gina.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.KEEP },
      { actorId: hugo.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.KEEP },

      // Scenario 2: total 9 votes (6 remove / 3 keep) => one REMOVE triggers hard delete
      { actorId: alice.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.REMOVE },
      { actorId: bob.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.REMOVE },
      { actorId: clara.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.REMOVE },
      { actorId: diego.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.REMOVE },
      { actorId: emma.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.REMOVE },
      { actorId: farid.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.REMOVE },
      { actorId: gina.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.KEEP },
      { actorId: hugo.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.KEEP },
      { actorId: ines.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.KEEP },

      // Scenario 3: total 9 votes (6 keep / 3 remove) => one KEEP triggers moderation exit
      { actorId: alice.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.KEEP },
      { actorId: bob.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.KEEP },
      { actorId: clara.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.KEEP },
      { actorId: diego.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.KEEP },
      { actorId: emma.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.KEEP },
      { actorId: farid.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.KEEP },
      { actorId: gina.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.REMOVE },
      { actorId: hugo.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.REMOVE },
      { actorId: ines.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.REMOVE },

      // Scenario 4: total 9 votes (5 remove / 4 keep) => one REMOVE triggers moderation-only hidden
      { actorId: alice.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.REMOVE },
      { actorId: bob.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.REMOVE },
      { actorId: clara.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.REMOVE },
      { actorId: diego.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.REMOVE },
      { actorId: emma.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.REMOVE },
      { actorId: farid.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.KEEP },
      { actorId: gina.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.KEEP },
      { actorId: hugo.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.KEEP },
      { actorId: ines.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.KEEP },

      // Scenario 5: total 9 votes (5 keep / 4 remove) => one KEEP keeps moderation+homepage branch at >=10
      { actorId: alice.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.KEEP },
      { actorId: bob.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.KEEP },
      { actorId: clara.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.KEEP },
      { actorId: diego.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.KEEP },
      { actorId: emma.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.KEEP },
      { actorId: farid.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.REMOVE },
      { actorId: gina.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.REMOVE },
      { actorId: hugo.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.REMOVE },
      { actorId: ines.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.REMOVE },

      // Scenario 6: reporter-specific hide (one active REMOVE)
      { actorId: alice.id, postId: moderationScenarioPosts[5].id, decision: ModerationDecision.REMOVE },
      { actorId: bob.id, postId: moderationScenarioPosts[5].id, decision: ModerationDecision.KEEP },
      { actorId: clara.id, postId: moderationScenarioPosts[5].id, decision: ModerationDecision.KEEP },
      { actorId: diego.id, postId: moderationScenarioPosts[5].id, decision: ModerationDecision.KEEP },
      { actorId: emma.id, postId: moderationScenarioPosts[5].id, decision: ModerationDecision.KEEP },
    ],
  });

  await Promise.all(allPosts.map((post) => updatePostCounters(post.id)));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });