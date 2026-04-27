/**
 * Last updated: 2026-04-27
 * Changes: Extracted pure optimistic-state helpers to postActionState.ts; component now focuses solely on React/UI concerns.
 * Purpose: Handle Like/DisLike/Good/Bad interactions with immediate UI feedback while server actions complete.
 */

"use client";

import { useEffect, useState } from "react";
import { ModerationDecision, ReactionType } from "@prisma/client";
import {
  applyModerationLocally,
  applyReactionLocally,
  mergeServerState,
  type OptimisticPostState,
} from "@/app/components/post/postActionState";
import {
  enqueueModerationVote,
  enqueueReaction,
  getQueuedPostActions,
  startPostActionQueue,
  subscribeToPostActionQueue,
} from "@/app/components/post/postActionQueue";

// ---------------------------------------------------------------------------
// Component types
// ---------------------------------------------------------------------------

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
  const [state, setState] = useState<OptimisticPostState>({
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

