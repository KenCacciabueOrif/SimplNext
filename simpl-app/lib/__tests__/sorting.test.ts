import { PostStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  compareByDate,
  compareByDistance,
  compareByPopularity,
  sortPostsByAggregateRanks,
} from "@/lib/sorting";
import type { PostListItem } from "@/lib/types";

// ---------------------------------------------------------------------------
// Test fixture helpers
// ---------------------------------------------------------------------------

function makePost(overrides: Partial<PostListItem> & { id: string }): PostListItem {
  return {
    title: "Test",
    body: "Body",
    authorDisplayName: "anon",
    parentId: null,
    rootId: null,
    latitude: null,
    longitude: null,
    likeCount: 0,
    dislikeCount: 0,
    reportCount: 0,
    keepVoteCount: 0,
    removeVoteCount: 0,
    status: PostStatus.ACTIVE,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    replyCount: 0,
    distanceKm: null,
    viewerReaction: null,
    viewerModerationDecision: null,
    ...overrides,
  };
}

const older = new Date("2026-01-01T00:00:00Z");
const newer = new Date("2026-04-01T00:00:00Z");

// ---------------------------------------------------------------------------
// compareByPopularity
// ---------------------------------------------------------------------------

describe("compareByPopularity", () => {
  it("down: higher net score sorts first", () => {
    const a = makePost({ id: "a", likeCount: 10, dislikeCount: 2 }); // score 8
    const b = makePost({ id: "b", likeCount: 3, dislikeCount: 3 });  // score 0
    expect(compareByPopularity(a, b, "down")).toBeLessThan(0);
  });

  it("up: lower net score sorts first", () => {
    const a = makePost({ id: "a", likeCount: 10, dislikeCount: 2 }); // score 8
    const b = makePost({ id: "b", likeCount: 1, dislikeCount: 1 });  // score 0
    expect(compareByPopularity(a, b, "up")).toBeGreaterThan(0);
  });

  it("tie-breaks by date desc", () => {
    const a = makePost({ id: "a", likeCount: 5, createdAt: newer });
    const b = makePost({ id: "b", likeCount: 5, createdAt: older });
    expect(compareByPopularity(a, b, "down")).toBeLessThan(0); // a is newer → first
  });
});

// ---------------------------------------------------------------------------
// compareByDate
// ---------------------------------------------------------------------------

describe("compareByDate", () => {
  it("down: newer post sorts first", () => {
    const a = makePost({ id: "a", createdAt: newer });
    const b = makePost({ id: "b", createdAt: older });
    expect(compareByDate(a, b, "down")).toBeLessThan(0);
  });

  it("up: older post sorts first", () => {
    const a = makePost({ id: "a", createdAt: newer });
    const b = makePost({ id: "b", createdAt: older });
    expect(compareByDate(a, b, "up")).toBeGreaterThan(0);
  });

  it("tie-breaks by id when dates are equal", () => {
    const a = makePost({ id: "a", createdAt: older });
    const b = makePost({ id: "b", createdAt: older });
    expect(compareByDate(a, b, "down")).toBeLessThan(0); // "a" < "b" localeCompare
  });
});

// ---------------------------------------------------------------------------
// compareByDistance
// ---------------------------------------------------------------------------

describe("compareByDistance", () => {
  it("down: closer post sorts first", () => {
    const a = makePost({ id: "a", distanceKm: 1 });
    const b = makePost({ id: "b", distanceKm: 10 });
    expect(compareByDistance(a, b, "down")).toBeLessThan(0);
  });

  it("up: farther post sorts first", () => {
    const a = makePost({ id: "a", distanceKm: 1 });
    const b = makePost({ id: "b", distanceKm: 10 });
    expect(compareByDistance(a, b, "up")).toBeGreaterThan(0);
  });

  it("null distance sinks to bottom when other has distance", () => {
    const a = makePost({ id: "a", distanceKm: null });
    const b = makePost({ id: "b", distanceKm: 5 });
    expect(compareByDistance(a, b, "down")).toBeGreaterThan(0);
    expect(compareByDistance(b, a, "down")).toBeLessThan(0);
  });

  it("both null: tie-breaks by date desc", () => {
    const a = makePost({ id: "a", distanceKm: null, createdAt: newer });
    const b = makePost({ id: "b", distanceKm: null, createdAt: older });
    expect(compareByDistance(a, b, "down")).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// sortPostsByAggregateRanks
// ---------------------------------------------------------------------------

describe("sortPostsByAggregateRanks", () => {
  it("with no active dimensions, sorts by date desc", () => {
    const posts = [
      makePost({ id: "a", createdAt: older }),
      makePost({ id: "b", createdAt: newer }),
    ];
    const result = sortPostsByAggregateRanks(posts, {
      popularity: "off",
      date: "off",
      distance: "off",
    });
    expect(result[0].id).toBe("b");
    expect(result[1].id).toBe("a");
  });

  it("with date=down, sorts newest first", () => {
    const posts = [
      makePost({ id: "old", createdAt: older }),
      makePost({ id: "new", createdAt: newer }),
    ];
    const result = sortPostsByAggregateRanks(posts, {
      popularity: "off",
      date: "down",
      distance: "off",
    });
    expect(result[0].id).toBe("new");
  });

  it("sinks null-distance posts when distance is active", () => {
    const posts = [
      makePost({ id: "no-loc", distanceKm: null }),
      makePost({ id: "near", distanceKm: 1 }),
      makePost({ id: "far", distanceKm: 100 }),
    ];
    const result = sortPostsByAggregateRanks(posts, {
      popularity: "off",
      date: "off",
      distance: "down",
    });
    expect(result[result.length - 1].id).toBe("no-loc");
  });

  it("does not mutate the input array", () => {
    const posts = [
      makePost({ id: "a", createdAt: newer }),
      makePost({ id: "b", createdAt: older }),
    ];
    const original = [...posts];
    sortPostsByAggregateRanks(posts, { popularity: "off", date: "down", distance: "off" });
    expect(posts[0].id).toBe(original[0].id);
  });
});
