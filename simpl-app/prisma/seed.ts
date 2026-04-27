/**
 * Last updated: 2026-04-27
 * Changes: Decomposed into focused sub-modules (seed-helpers, seed-actors, seed-posts, seed-interactions).
 * Purpose: Orchestrator — clears existing data, runs each seed phase in order, and disconnects.
 */

import { PrismaClient } from "@prisma/client";
import { createActors } from "./seed-actors";
import { updatePostCounters } from "./seed-helpers";
import { createInteractions } from "./seed-interactions";
import { createPosts } from "./seed-posts";

const prisma = new PrismaClient();

// ------------------------------
// Orchestration
// ------------------------------

async function main() {
  await prisma.moderationVote.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.post.deleteMany();
  await prisma.actor.deleteMany();

  const actors = await createActors(prisma);
  const posts = await createPosts(prisma, actors);
  await createInteractions(prisma, actors, posts);

  const allPosts = [
    ...posts.rootPosts,
    ...posts.replyPosts,
    posts.flaggedPost,
    posts.hiddenPost,
    ...posts.moderationScenarioPosts,
  ];
  await Promise.all(allPosts.map((post) => updatePostCounters(prisma, post.id)));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });