/**
 * Last updated: 2026-04-27
 * Changes: Extracted from PostActionControls.tsx to separate pure optimistic-state helpers from React component concerns.
 * Purpose: Provide pure functions for computing local optimistic post action state before server acknowledgements arrive.
 */

import { ModerationDecision, ReactionType } from "@prisma/client";
import type { PostActionState } from "@/app/actions";

// ---------------------------------------------------------------------------
// Shared optimistic state shape
// ---------------------------------------------------------------------------

export type OptimisticPostState = {
  likeCount: number;
  dislikeCount: number;
  keepVoteCount: number;
  removeVoteCount: number;
  viewerReaction: ReactionType | null;
  viewerModerationDecision: ModerationDecision | null;
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function clampPositive(value: number) {
  return Math.max(0, value);
}

export function applyReactionLocally(
  state: OptimisticPostState,
  nextType: ReactionType,
): OptimisticPostState {
  const next = { ...state };

  if (state.viewerReaction === nextType) {
    if (nextType === ReactionType.LIKE) {
      next.likeCount = clampPositive(state.likeCount - 1);
    } else {
      next.dislikeCount = clampPositive(state.dislikeCount - 1);
    }

    next.viewerReaction = null;
    return next;
  }

  if (state.viewerReaction === ReactionType.LIKE) {
    next.likeCount = clampPositive(state.likeCount - 1);
  }

  if (state.viewerReaction === ReactionType.DISLIKE) {
    next.dislikeCount = clampPositive(state.dislikeCount - 1);
  }

  if (nextType === ReactionType.LIKE) {
    next.likeCount = state.likeCount + 1;
  } else {
    next.dislikeCount = state.dislikeCount + 1;
  }

  next.viewerReaction = nextType;
  return next;
}

export function applyModerationLocally(
  state: OptimisticPostState,
  nextDecision: ModerationDecision,
): OptimisticPostState {
  const next = { ...state };

  if (state.viewerModerationDecision === nextDecision) {
    if (nextDecision === ModerationDecision.KEEP) {
      next.keepVoteCount = clampPositive(state.keepVoteCount - 1);
    }

    if (nextDecision === ModerationDecision.REMOVE) {
      next.removeVoteCount = clampPositive(state.removeVoteCount - 1);
    }

    next.viewerModerationDecision = null;
    return next;
  }

  if (state.viewerModerationDecision === ModerationDecision.KEEP) {
    next.keepVoteCount = clampPositive(state.keepVoteCount - 1);
  }

  if (state.viewerModerationDecision === ModerationDecision.REMOVE) {
    next.removeVoteCount = clampPositive(state.removeVoteCount - 1);
  }

  if (nextDecision === ModerationDecision.KEEP) {
    next.keepVoteCount = state.keepVoteCount + 1;
  }

  if (nextDecision === ModerationDecision.REMOVE) {
    next.removeVoteCount = state.removeVoteCount + 1;
  }

  next.viewerModerationDecision = nextDecision;
  return next;
}

export function mergeServerState(
  state: OptimisticPostState,
  serverState: PostActionState,
): OptimisticPostState {
  return {
    ...state,
    dislikeCount: serverState.dislikeCount,
    keepVoteCount: serverState.keepVoteCount,
    likeCount: serverState.likeCount,
    removeVoteCount: serverState.removeVoteCount,
    viewerModerationDecision: serverState.viewerModerationDecision,
    viewerReaction: serverState.viewerReaction,
  };
}
