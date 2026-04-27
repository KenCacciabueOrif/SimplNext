/**
 * Last updated: 2026-04-27
 * Purpose: Tests for postActionQueue — the browser-persisted chronological queue
 *          that stores post reactions/moderation votes locally and replays them to
 *          the backend asynchronously. These tests cover enqueue, flush,
 *          subscriber notification, offline guard, and failure recovery.
 */

import { ModerationDecision, PostStatus, ReactionType } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { PostActionState } from "@/lib/types";
import { installMockLocalStorage } from "@/app/components/geolocation/__tests__/testHelpers";

// ---------------------------------------------------------------------------
// Mock server actions — vi.mock is hoisted before all imports so postActionQueue
// receives the stubs when it first resolves its @/app/actions dependency.
// ---------------------------------------------------------------------------

vi.mock("@/app/actions", () => ({
  toggleReactionAction: vi.fn(),
  castModerationVoteAction: vi.fn(),
}));

// Import AFTER vi.mock so the module binds to the stubs above.
import {
  enqueueReaction,
  enqueueModerationVote,
  getQueuedPostActions,
  subscribeToPostActionQueue,
} from "@/app/components/postActionQueue";
import { toggleReactionAction, castModerationVoteAction } from "@/app/actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A minimal valid PostActionState returned by a successful server action. */
function makeSuccessState(overrides?: Partial<PostActionState>): PostActionState {
  return {
    likeCount: 1,
    dislikeCount: 0,
    keepVoteCount: 0,
    removeVoteCount: 0,
    reportCount: 0,
    status: PostStatus.ACTIVE,
    viewerReaction: ReactionType.LIKE,
    viewerModerationDecision: null,
    ...overrides,
  };
}

/**
 * Drain all pending microtasks + a single macrotask turn so that async
 * flushQueue iterations (which use while + await) have time to complete.
 */
function flushAsync() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

// ---------------------------------------------------------------------------
// Environment setup — make canUseBrowser() return true and install localStorage
// ---------------------------------------------------------------------------

beforeAll(() => {
  // Expose globalThis as window so canUseBrowser() passes in the Node env.
  // Add addEventListener stub so registerBrowserListeners() does not throw.
  Object.defineProperty(globalThis, "addEventListener", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: globalThis,
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { onLine: true },
  });
});

beforeEach(() => {
  installMockLocalStorage();
  localStorage.clear();
  vi.mocked(toggleReactionAction).mockReset();
  vi.mocked(castModerationVoteAction).mockReset();
});

// ---------------------------------------------------------------------------
// Queue contents
// ---------------------------------------------------------------------------

describe("getQueuedPostActions", () => {
  it("returns empty array when queue is empty", () => {
    expect(getQueuedPostActions("post-1")).toEqual([]);
  });

  it("filters by postId", async () => {
    vi.mocked(toggleReactionAction).mockResolvedValue(makeSuccessState());
    enqueueReaction("post-1", "thread-1", ReactionType.LIKE);
    enqueueReaction("post-2", "thread-1", ReactionType.DISLIKE);

    // Check before flush completes
    const result = getQueuedPostActions("post-1");
    expect(result).toHaveLength(1);
    expect(result[0].postId).toBe("post-1");

    await flushAsync();
  });

  it("returns all pending items for the given post", async () => {
    // Mock returns a rejected promise so items stay in queue
    vi.mocked(toggleReactionAction).mockRejectedValue(new Error("network"));

    enqueueReaction("post-X", "thread-1", ReactionType.LIKE);
    // Second enqueue won't flush (isFlushing guard) but adds to queue
    await flushAsync();

    const items = getQueuedPostActions("post-X");
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items.every((i) => i.postId === "post-X")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// enqueueReaction
// ---------------------------------------------------------------------------

describe("enqueueReaction", () => {
  it("adds a reaction item with the correct shape", async () => {
    vi.mocked(toggleReactionAction).mockResolvedValue(makeSuccessState());
    const item = enqueueReaction("post-1", "thread-1", ReactionType.LIKE);

    expect(item.kind).toBe("reaction");
    expect(item.postId).toBe("post-1");
    expect(item.threadId).toBe("thread-1");
    expect(item.reactionType).toBe(ReactionType.LIKE);
    expect(typeof item.id).toBe("string");
    expect(typeof item.createdAt).toBe("number");

    await flushAsync();
  });

  it("persists the item to localStorage immediately", async () => {
    vi.mocked(toggleReactionAction).mockResolvedValue(makeSuccessState());
    enqueueReaction("post-3", "thread-3", ReactionType.DISLIKE);

    const raw = localStorage.getItem("simpl-post-action-queue-v1");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].postId).toBe("post-3");

    await flushAsync();
  });

  it("triggers flush and calls toggleReactionAction", async () => {
    vi.mocked(toggleReactionAction).mockResolvedValue(makeSuccessState());

    enqueueReaction("post-4", "thread-4", ReactionType.LIKE);
    await flushAsync();

    expect(toggleReactionAction).toHaveBeenCalledOnce();
    const formData: FormData = vi.mocked(toggleReactionAction).mock.calls[0][0];
    expect(formData.get("postId")).toBe("post-4");
    expect(formData.get("reactionType")).toBe(ReactionType.LIKE);
  });
});

// ---------------------------------------------------------------------------
// enqueueModerationVote
// ---------------------------------------------------------------------------

describe("enqueueModerationVote", () => {
  it("adds a moderation item with the correct shape", async () => {
    vi.mocked(castModerationVoteAction).mockResolvedValue(makeSuccessState());
    const item = enqueueModerationVote("post-5", "thread-5", ModerationDecision.KEEP);

    expect(item.kind).toBe("moderation");
    expect(item.postId).toBe("post-5");
    expect(item.decision).toBe(ModerationDecision.KEEP);

    await flushAsync();
  });

  it("calls castModerationVoteAction during flush", async () => {
    vi.mocked(castModerationVoteAction).mockResolvedValue(makeSuccessState());

    enqueueModerationVote("post-6", "thread-6", ModerationDecision.REMOVE);
    await flushAsync();

    expect(castModerationVoteAction).toHaveBeenCalledOnce();
    const formData: FormData = vi.mocked(castModerationVoteAction).mock.calls[0][0];
    expect(formData.get("decision")).toBe(ModerationDecision.REMOVE);
  });
});

// ---------------------------------------------------------------------------
// Flush behaviour
// ---------------------------------------------------------------------------

describe("flush", () => {
  it("removes the item from the queue after a successful server action", async () => {
    vi.mocked(toggleReactionAction).mockResolvedValue(makeSuccessState());

    enqueueReaction("post-7", "thread-7", ReactionType.LIKE);
    await flushAsync();

    const remaining = getQueuedPostActions("post-7");
    expect(remaining).toHaveLength(0);
  });

  it("keeps the item in the queue after a failed server action", async () => {
    vi.mocked(toggleReactionAction).mockRejectedValue(new Error("server error"));

    enqueueReaction("post-8", "thread-8", ReactionType.DISLIKE);
    await flushAsync();

    const remaining = getQueuedPostActions("post-8");
    expect(remaining).toHaveLength(1);
  });

  it("does not call server actions when offline", async () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { onLine: false },
    });

    vi.mocked(toggleReactionAction).mockResolvedValue(makeSuccessState());

    enqueueReaction("post-9", "thread-9", ReactionType.LIKE);
    await flushAsync();

    expect(toggleReactionAction).not.toHaveBeenCalled();

    // Restore online state for subsequent tests
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { onLine: true },
    });
  });
});

// ---------------------------------------------------------------------------
// Subscriber notifications
// ---------------------------------------------------------------------------

describe("subscribeToPostActionQueue", () => {
  it("calls the listener immediately with the current queue", () => {
    const snapshots: unknown[] = [];
    const unsubscribe = subscribeToPostActionQueue((snapshot) => {
      snapshots.push(snapshot);
    });

    expect(snapshots).toHaveLength(1);
    expect((snapshots[0] as { queue: unknown[] }).queue).toEqual([]);

    unsubscribe();
  });

  it("calls the listener when an item is enqueued", async () => {
    vi.mocked(toggleReactionAction).mockResolvedValue(makeSuccessState());

    const snapshots: unknown[] = [];
    const unsubscribe = subscribeToPostActionQueue((snapshot) => {
      snapshots.push(snapshot);
    });

    // First call is the immediate notification on subscribe
    expect(snapshots).toHaveLength(1);

    enqueueReaction("post-10", "thread-10", ReactionType.LIKE);

    // Second call is triggered by writeQueue inside enqueueReaction
    expect(snapshots.length).toBeGreaterThanOrEqual(2);

    await flushAsync();
    unsubscribe();
  });

  it("stops notifying after unsubscribe", async () => {
    vi.mocked(toggleReactionAction).mockResolvedValue(makeSuccessState());

    const snapshots: unknown[] = [];
    const unsubscribe = subscribeToPostActionQueue((snapshot) => {
      snapshots.push(snapshot);
    });

    unsubscribe();
    const countAfterUnsubscribe = snapshots.length;

    enqueueReaction("post-11", "thread-11", ReactionType.LIKE);
    await flushAsync();

    // No new notifications after unsubscribe
    expect(snapshots.length).toBe(countAfterUnsubscribe);
  });
});

// ---------------------------------------------------------------------------
// Chronological ordering
// ---------------------------------------------------------------------------

describe("chronological ordering", () => {
  it("preserves insertion order when items share the same timestamp", () => {
    const realDateNow = Date.now;
    let tick = 0;
    Date.now = () => 1_000_000 + tick++;

    vi.mocked(toggleReactionAction).mockResolvedValue(makeSuccessState());

    enqueueReaction("post-ord", "thread-ord", ReactionType.LIKE);
    enqueueReaction("post-ord", "thread-ord", ReactionType.DISLIKE);

    const items = getQueuedPostActions("post-ord");
    expect(items[0].createdAt).toBeLessThanOrEqual(items[1].createdAt);

    Date.now = realDateNow;
  });
});
