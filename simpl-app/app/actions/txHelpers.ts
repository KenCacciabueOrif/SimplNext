/**
 * Last updated: 2026-04-28
 * Changes: No changes — initial extraction from app/actions.ts during phase-2 modularization.
 * Purpose: Private Prisma transaction helpers shared by reaction and moderation action modules.
 */

import { ModerationDecision, PostStatus, ReactionType } from "@prisma/client";
import type prisma from "@/lib/prisma";
import { evaluateModerationPolicy } from "@/lib/policy";
import type { PostActionState } from "@/lib/types";

export type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

// Reactions-only sync: updates like/dislike counts without touching moderation state.
// Calling evaluateModerationPolicy here would reset posts with 0 moderation votes to
// UNDER_REVIEW, incorrectly treating every reaction as a moderation event.
export async function syncPostState(
  tx: PrismaTransactionClient,
  postId: string,
) {
  const reactions = await tx.reaction.findMany({
    where: { postId },
    select: { type: true },
  });

  const likeCount = reactions.filter((r) => r.type === ReactionType.LIKE).length;
  const dislikeCount = reactions.filter((r) => r.type === ReactionType.DISLIKE).length;

  const post = await tx.post.update({
    where: { id: postId },
    data: { likeCount, dislikeCount },
  });

  return {
    deleted: false,
    state: {
      dislikeCount: post.dislikeCount,
      keepVoteCount: post.keepVoteCount,
      likeCount: post.likeCount,
      removeVoteCount: post.removeVoteCount,
      reportCount: post.reportCount,
      status: post.status,
    },
  };
}

// Full moderation sync: recounts votes, evaluates policy, and applies resulting
// status/visibility changes — including hard delete when threshold is met.
export async function syncModerationState(
  tx: PrismaTransactionClient,
  postId: string,
) {
  const [reactions, moderationVotes] = await Promise.all([
    tx.reaction.findMany({
      where: { postId },
      select: { type: true },
    }),
    tx.moderationVote.findMany({
      where: { postId },
      select: { decision: true },
    }),
  ]);

  const likeCount = reactions.filter((r) => r.type === ReactionType.LIKE).length;
  const dislikeCount = reactions.filter((r) => r.type === ReactionType.DISLIKE).length;
  const keepVoteCount = moderationVotes.filter((v) => v.decision === ModerationDecision.KEEP).length;
  const removeVoteCount = moderationVotes.filter((v) => v.decision === ModerationDecision.REMOVE).length;

  const moderationOutcome = evaluateModerationPolicy(keepVoteCount, removeVoteCount);

  if (moderationOutcome.shouldDelete) {
    await tx.post.delete({ where: { id: postId } });

    return {
      deleted: true,
      state: {
        dislikeCount,
        keepVoteCount,
        likeCount,
        removeVoteCount,
        reportCount: removeVoteCount,
        status: PostStatus.REMOVED,
      },
    };
  }

  const post = await tx.post.update({
    where: { id: postId },
    data: {
      dislikeCount,
      isHomepageVisible: moderationOutcome.visibleOnHomepage,
      isInModeration: moderationOutcome.inModeration,
      keepVoteCount,
      likeCount,
      removeVoteCount,
      reportCount: removeVoteCount,
      status: moderationOutcome.status,
    },
  });

  return {
    deleted: false,
    state: {
      dislikeCount: post.dislikeCount,
      keepVoteCount: post.keepVoteCount,
      likeCount: post.likeCount,
      removeVoteCount: post.removeVoteCount,
      reportCount: post.reportCount,
      status: post.status,
    },
  };
}

export async function getViewerPostActionState(
  tx: PrismaTransactionClient,
  actorId: string,
  postId: string,
): Promise<Pick<PostActionState, "viewerModerationDecision" | "viewerReaction">> {
  const [reaction, moderationVote] = await Promise.all([
    tx.reaction.findUnique({
      where: { actorId_postId: { actorId, postId } },
      select: { type: true },
    }),
    tx.moderationVote.findUnique({
      where: { actorId_postId: { actorId, postId } },
      select: { decision: true },
    }),
  ]);

  return {
    viewerModerationDecision: moderationVote?.decision ?? null,
    viewerReaction: reaction?.type ?? null,
  };
}
