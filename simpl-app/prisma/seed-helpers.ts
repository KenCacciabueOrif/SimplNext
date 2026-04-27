/**
 * Last updated: 2026-04-27
 * Purpose: Low-level Prisma helpers used by all seed modules — type definitions,
 *   the generic post-creation factory, and the post-counter sync utility.
 */

import {
  ModerationDecision,
  PostStatus,
  PrismaClient,
  ReactionType,
} from "@prisma/client";
import { evaluateModerationPolicy } from "../lib/policy";

// ------------------------------
// Types
// ------------------------------

export type SeedPostInput = {
  title: string;
  body: string;
  authorId: string;
  latitude: number;
  longitude: number;
  parentId?: string;
  rootId?: string;
  status?: PostStatus;
};

// ------------------------------
// Post factory
// ------------------------------

export async function createPost(prisma: PrismaClient, input: SeedPostInput) {
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

// ------------------------------
// Counter sync
// ------------------------------

export async function updatePostCounters(prisma: PrismaClient, postId: string) {
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

  const likeCount = reactions.filter((r) => r.type === ReactionType.LIKE).length;
  const dislikeCount = reactions.filter((r) => r.type === ReactionType.DISLIKE).length;
  const keepVoteCount = moderationVotes.filter(
    (v) => v.decision === ModerationDecision.KEEP,
  ).length;
  const removeVoteCount = moderationVotes.filter(
    (v) => v.decision === ModerationDecision.REMOVE,
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
