/**
 * Last updated: 2026-04-21
 * Changes: Replaced the demo blog seed with representative Simpl actors, posts, replies, reactions, and moderation votes.
 * Purpose: Seed development data for the Simpl PostgreSQL domain.
 */

import {
  ModerationDecision,
  PostStatus,
  PrismaClient,
  ReactionType,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.moderationVote.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.post.deleteMany();
  await prisma.actor.deleteMany();

  const [alice, bob, clara] = await Promise.all([
    prisma.actor.create({
      data: { key: "seed-alice", displayName: "Anon-Alice" },
    }),
    prisma.actor.create({
      data: { key: "seed-bob", displayName: "Anon-Bob" },
    }),
    prisma.actor.create({
      data: { key: "seed-clara", displayName: "Anon-Clara" },
    }),
  ]);

  const rootPost = await prisma.post.create({
    data: {
      title: "Créer un réseau local utile",
      body: "Et si Simpl servait à coordonner des idées, des besoins et des retours entre personnes proches géographiquement ?",
      authorId: alice.id,
      latitude: 46.5197,
      longitude: 6.6323,
    },
  });

  const replyOne = await prisma.post.create({
    data: {
      title: "Réponse",
      body: "La V1 devrait prioriser le fil principal, les commentaires et une modération lisible.",
      authorId: bob.id,
      parentId: rootPost.id,
      rootId: rootPost.id,
      latitude: 46.5205,
      longitude: 6.6341,
    },
  });

  const flaggedPost = await prisma.post.create({
    data: {
      title: "Contenu signalé d'exemple",
      body: "Ce post sert à vérifier la file de modération et les décisions KEEP/REMOVE.",
      authorId: clara.id,
      latitude: 46.517,
      longitude: 6.629,
      reportCount: 2,
      removeVoteCount: 2,
      status: PostStatus.UNDER_REVIEW,
    },
  });

  await prisma.reaction.createMany({
    data: [
      { actorId: bob.id, postId: rootPost.id, type: ReactionType.LIKE },
      { actorId: clara.id, postId: rootPost.id, type: ReactionType.LIKE },
      { actorId: alice.id, postId: replyOne.id, type: ReactionType.LIKE },
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
    ],
  });

  await prisma.post.update({
    where: { id: rootPost.id },
    data: { likeCount: 2 },
  });

  await prisma.post.update({
    where: { id: replyOne.id },
    data: { likeCount: 1 },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });