import { ModerationDecision, PostStatus, ReactionType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  applyModerationLocally,
  applyReactionLocally,
  mergeServerState,
} from "@/app/components/post/postActionState";
import type { OptimisticPostState } from "@/app/components/post/postActionState";

// ---------------------------------------------------------------------------
// Test fixture helpers
// ---------------------------------------------------------------------------

function makeState(overrides?: Partial<OptimisticPostState>): OptimisticPostState {
  return {
    likeCount: 5,
    dislikeCount: 3,
    keepVoteCount: 2,
    removeVoteCount: 1,
    viewerReaction: null,
    viewerModerationDecision: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// applyReactionLocally
// ---------------------------------------------------------------------------

describe("applyReactionLocally", () => {
  it("adds a like when viewer has no reaction", () => {
    const result = applyReactionLocally(makeState(), ReactionType.LIKE);
    expect(result.likeCount).toBe(6);
    expect(result.viewerReaction).toBe(ReactionType.LIKE);
    expect(result.dislikeCount).toBe(3); // unchanged
  });

  it("adds a dislike when viewer has no reaction", () => {
    const result = applyReactionLocally(makeState(), ReactionType.DISLIKE);
    expect(result.dislikeCount).toBe(4);
    expect(result.viewerReaction).toBe(ReactionType.DISLIKE);
    expect(result.likeCount).toBe(5); // unchanged
  });

  it("removes like when viewer already liked (toggle)", () => {
    const state = makeState({ viewerReaction: ReactionType.LIKE, likeCount: 6 });
    const result = applyReactionLocally(state, ReactionType.LIKE);
    expect(result.likeCount).toBe(5);
    expect(result.viewerReaction).toBeNull();
  });

  it("removes dislike when viewer already disliked (toggle)", () => {
    const state = makeState({ viewerReaction: ReactionType.DISLIKE, dislikeCount: 4 });
    const result = applyReactionLocally(state, ReactionType.DISLIKE);
    expect(result.dislikeCount).toBe(3);
    expect(result.viewerReaction).toBeNull();
  });

  it("switches from like to dislike", () => {
    const state = makeState({ viewerReaction: ReactionType.LIKE, likeCount: 6 });
    const result = applyReactionLocally(state, ReactionType.DISLIKE);
    expect(result.likeCount).toBe(5);     // removed like
    expect(result.dislikeCount).toBe(4);  // added dislike
    expect(result.viewerReaction).toBe(ReactionType.DISLIKE);
  });

  it("switches from dislike to like", () => {
    const state = makeState({ viewerReaction: ReactionType.DISLIKE, dislikeCount: 4 });
    const result = applyReactionLocally(state, ReactionType.LIKE);
    expect(result.dislikeCount).toBe(3);  // removed dislike
    expect(result.likeCount).toBe(6);     // added like
    expect(result.viewerReaction).toBe(ReactionType.LIKE);
  });

  it("does not decrement below 0 when likeCount is already 0", () => {
    const state = makeState({ viewerReaction: ReactionType.LIKE, likeCount: 0 });
    const result = applyReactionLocally(state, ReactionType.LIKE);
    expect(result.likeCount).toBe(0);
  });

  it("does not mutate the input state", () => {
    const state = makeState();
    applyReactionLocally(state, ReactionType.LIKE);
    expect(state.likeCount).toBe(5);
    expect(state.viewerReaction).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// applyModerationLocally
// ---------------------------------------------------------------------------

describe("applyModerationLocally", () => {
  it("adds a keep vote when viewer has no decision", () => {
    const result = applyModerationLocally(makeState(), ModerationDecision.KEEP);
    expect(result.keepVoteCount).toBe(3);
    expect(result.viewerModerationDecision).toBe(ModerationDecision.KEEP);
  });

  it("adds a remove vote when viewer has no decision", () => {
    const result = applyModerationLocally(makeState(), ModerationDecision.REMOVE);
    expect(result.removeVoteCount).toBe(2);
    expect(result.viewerModerationDecision).toBe(ModerationDecision.REMOVE);
  });

  it("removes keep vote when viewer already voted keep (toggle)", () => {
    const state = makeState({
      viewerModerationDecision: ModerationDecision.KEEP,
      keepVoteCount: 3,
    });
    const result = applyModerationLocally(state, ModerationDecision.KEEP);
    expect(result.keepVoteCount).toBe(2);
    expect(result.viewerModerationDecision).toBeNull();
  });

  it("removes remove vote when viewer already voted remove (toggle)", () => {
    const state = makeState({
      viewerModerationDecision: ModerationDecision.REMOVE,
      removeVoteCount: 2,
    });
    const result = applyModerationLocally(state, ModerationDecision.REMOVE);
    expect(result.removeVoteCount).toBe(1);
    expect(result.viewerModerationDecision).toBeNull();
  });

  it("switches from keep to remove", () => {
    const state = makeState({
      viewerModerationDecision: ModerationDecision.KEEP,
      keepVoteCount: 3,
      removeVoteCount: 1,
    });
    const result = applyModerationLocally(state, ModerationDecision.REMOVE);
    expect(result.keepVoteCount).toBe(2);   // removed keep
    expect(result.removeVoteCount).toBe(2); // added remove
    expect(result.viewerModerationDecision).toBe(ModerationDecision.REMOVE);
  });

  it("does not mutate the input state", () => {
    const state = makeState();
    applyModerationLocally(state, ModerationDecision.KEEP);
    expect(state.keepVoteCount).toBe(2);
    expect(state.viewerModerationDecision).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mergeServerState
// ---------------------------------------------------------------------------

describe("mergeServerState", () => {
  it("overwrites all server-authoritative fields", () => {
    const state = makeState({
      likeCount: 99,
      dislikeCount: 99,
      keepVoteCount: 99,
      removeVoteCount: 99,
      viewerReaction: ReactionType.LIKE,
      viewerModerationDecision: ModerationDecision.KEEP,
    });
    const serverState = {
      likeCount: 10,
      dislikeCount: 2,
      keepVoteCount: 4,
      removeVoteCount: 1,
      reportCount: 0,
      status: PostStatus.ACTIVE,
      viewerReaction: null,
      viewerModerationDecision: null,
    };
    const result = mergeServerState(state, serverState);
    expect(result.likeCount).toBe(10);
    expect(result.dislikeCount).toBe(2);
    expect(result.keepVoteCount).toBe(4);
    expect(result.removeVoteCount).toBe(1);
    expect(result.viewerReaction).toBeNull();
    expect(result.viewerModerationDecision).toBeNull();
  });

  it("does not mutate the input state", () => {
    const state = makeState({ likeCount: 99 });
    mergeServerState(state, {
      likeCount: 1,
      dislikeCount: 0,
      keepVoteCount: 0,
      removeVoteCount: 0,
      reportCount: 0,
      status: PostStatus.ACTIVE,
      viewerReaction: null,
      viewerModerationDecision: null,
    });
    expect(state.likeCount).toBe(99);
  });
});

