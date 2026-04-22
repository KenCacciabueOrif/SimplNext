/**
 * Last updated: 2026-04-22
 * Changes: Moved post actions to a browser-persisted queue and added local Good/Bad toggle-off parity with server acknowledgements.
 * Purpose: Handle Like/DisLike/Good/Bad interactions with immediate UI feedback while server actions complete.
 */

"use client";

import { useEffect, useState } from "react";
import { ModerationDecision, ReactionType } from "@prisma/client";
import {
  type PostActionState,
} from "@/app/actions";
import {
  enqueueModerationVote,
  enqueueReaction,
  getQueuedPostActions,
  startPostActionQueue,
  subscribeToPostActionQueue,
} from "@/app/components/postActionQueue";

type PostActionControlsProps = {
  postId: string;
  threadId: string;
  mode: "reactions" | "moderation";
  likeCount: number;
  dislikeCount: number;
  keepVoteCount: number;
  removeVoteCount: number;
  viewerReaction: ReactionType | null;
  viewerModerationDecision: ModerationDecision | null;
};

type OptimisticState = {
  likeCount: number;
  dislikeCount: number;
  keepVoteCount: number;
  removeVoteCount: number;
  viewerReaction: ReactionType | null;
  viewerModerationDecision: ModerationDecision | null;
};

function clampPositive(value: number) {
  return Math.max(0, value);
}

function applyReactionLocally(
  state: OptimisticState,
  nextType: ReactionType,
): OptimisticState {
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

function applyModerationLocally(
  state: OptimisticState,
  nextDecision: ModerationDecision,
): OptimisticState {
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

function mergeServerState(
  state: OptimisticState,
  nextState: PostActionState,
): OptimisticState {
  return {
    ...state,
    dislikeCount: nextState.dislikeCount,
    keepVoteCount: nextState.keepVoteCount,
    likeCount: nextState.likeCount,
    removeVoteCount: nextState.removeVoteCount,
    viewerModerationDecision: nextState.viewerModerationDecision,
    viewerReaction: nextState.viewerReaction,
  };
}

export default function PostActionControls({
  postId,
  threadId,
  mode,
  likeCount,
  dislikeCount,
  keepVoteCount,
  removeVoteCount,
  viewerReaction,
  viewerModerationDecision,
}: PostActionControlsProps) {
  const [state, setState] = useState<OptimisticState>({
    dislikeCount,
    keepVoteCount,
    likeCount,
    removeVoteCount,
    viewerModerationDecision,
    viewerReaction,
  });
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    startPostActionQueue();

    return subscribeToPostActionQueue((snapshot) => {
      setQueuedCount(snapshot.queue.filter((item) => item.postId === postId).length);

      const acknowledged = snapshot.acknowledged;

      if (!acknowledged || acknowledged.item.postId !== postId) {
        return;
      }

      setState((currentState) => mergeServerState(currentState, acknowledged.state));
    });
  }, [postId]);

  useEffect(() => {
    setQueuedCount(getQueuedPostActions(postId).length);
  }, [postId]);

  function submitReaction(nextType: ReactionType) {
    const optimisticState = applyReactionLocally(state, nextType);

    setState(optimisticState);
    enqueueReaction(postId, threadId, nextType);
  }

  function submitModerationVote(nextDecision: ModerationDecision) {
    const optimisticState = applyModerationLocally(state, nextDecision);

    setState(optimisticState);
    enqueueModerationVote(postId, threadId, nextDecision);
  }

  if (mode === "moderation") {
    return (
      <>
        <button
          className={`legacy-button${state.viewerModerationDecision === ModerationDecision.KEEP ? " is-active" : ""}`}
          type="button"
          aria-busy={queuedCount > 0}
          onClick={() => submitModerationVote(ModerationDecision.KEEP)}
        >
          {`Good ${state.keepVoteCount}`}
        </button>

        <button
          className={`legacy-button${state.viewerModerationDecision === ModerationDecision.REMOVE ? " is-active" : ""}`}
          type="button"
          aria-busy={queuedCount > 0}
          onClick={() => submitModerationVote(ModerationDecision.REMOVE)}
        >
          {`Bad ${state.removeVoteCount}`}
        </button>
      </>
    );
  }

  return (
    <>
      <button
        className={`legacy-button${state.viewerReaction === ReactionType.LIKE ? " is-active" : ""}`}
        type="button"
        aria-busy={queuedCount > 0}
        onClick={() => submitReaction(ReactionType.LIKE)}
      >
        {`Like ${state.likeCount}`}
      </button>

      <button
        className={`legacy-button${state.viewerReaction === ReactionType.DISLIKE ? " is-active" : ""}`}
        type="button"
        aria-busy={queuedCount > 0}
        onClick={() => submitReaction(ReactionType.DISLIKE)}
      >
        {`DisLike ${state.dislikeCount}`}
      </button>
    </>
  );
}
