/**
 * Last updated: 2026-04-24
 * Changes: Extracted pure sorting algorithms from lib/simpl.ts to make them testable and reusable in isolation.
 * Purpose: Provide the tri-state aggregate ranking engine and individual sort comparators for feeds, threads, and the moderation queue.
 */

import type { FeedSortState, PostListItem, SortMode } from "@/lib/types";

// ---------------------------------------------------------------------------
// Stable tie-breaker used by all comparators
// ---------------------------------------------------------------------------

function compareCreatedAtDesc(left: PostListItem, right: PostListItem) {
  if (left.createdAt.getTime() !== right.createdAt.getTime()) {
    return right.createdAt.getTime() - left.createdAt.getTime();
  }

  return left.id.localeCompare(right.id);
}

// ---------------------------------------------------------------------------
// Individual comparators
// ---------------------------------------------------------------------------

export function compareByPopularity(
  left: PostListItem,
  right: PostListItem,
  mode: Exclude<SortMode, "off">,
) {
  const leftScore = left.likeCount - left.dislikeCount;
  const rightScore = right.likeCount - right.dislikeCount;

  if (leftScore !== rightScore) {
    return mode === "down" ? rightScore - leftScore : leftScore - rightScore;
  }

  return compareCreatedAtDesc(left, right);
}

export function compareByDate(
  left: PostListItem,
  right: PostListItem,
  mode: Exclude<SortMode, "off">,
) {
  if (left.createdAt.getTime() !== right.createdAt.getTime()) {
    return mode === "down"
      ? right.createdAt.getTime() - left.createdAt.getTime()
      : left.createdAt.getTime() - right.createdAt.getTime();
  }

  return left.id.localeCompare(right.id);
}

export function compareByDistance(
  left: PostListItem,
  right: PostListItem,
  mode: Exclude<SortMode, "off">,
) {
  if (left.distanceKm === null && right.distanceKm === null) {
    return compareCreatedAtDesc(left, right);
  }

  if (left.distanceKm === null) {
    return 1;
  }

  if (right.distanceKm === null) {
    return -1;
  }

  if (left.distanceKm !== right.distanceKm) {
    return mode === "down"
      ? left.distanceKm - right.distanceKm
      : right.distanceKm - left.distanceKm;
  }

  return compareCreatedAtDesc(left, right);
}

// ---------------------------------------------------------------------------
// Aggregate ranking engine
// ---------------------------------------------------------------------------

function buildNormalizedRankMap(
  posts: PostListItem[],
  comparator: (left: PostListItem, right: PostListItem) => number,
) {
  const sorted = [...posts].sort(comparator);
  const rankMap = new Map<string, number>();
  const denominator = sorted.length <= 1 ? 1 : sorted.length - 1;

  sorted.forEach((post, index) => {
    rankMap.set(post.id, index / denominator);
  });

  return rankMap;
}

function getActiveSortDimensions(sortState: FeedSortState) {
  const active: Array<"popularity" | "date" | "distance"> = [];

  if (sortState.popularity !== "off") active.push("popularity");
  if (sortState.date !== "off") active.push("date");
  if (sortState.distance !== "off") active.push("distance");

  return active;
}

export function sortPostsByAggregateRanks(
  posts: PostListItem[],
  sortState: FeedSortState,
) {
  const activeDimensions = getActiveSortDimensions(sortState);

  if (activeDimensions.length === 0) {
    return [...posts].sort(compareCreatedAtDesc);
  }

  const dateMode = sortState.date === "off" ? null : sortState.date;
  const distanceMode = sortState.distance === "off" ? null : sortState.distance;
  const popularityMode = sortState.popularity === "off" ? null : sortState.popularity;

  const rankMaps = {
    date:
      dateMode === null
        ? null
        : buildNormalizedRankMap(posts, (l, r) => compareByDate(l, r, dateMode)),
    distance:
      distanceMode === null
        ? null
        : buildNormalizedRankMap(posts, (l, r) => compareByDistance(l, r, distanceMode)),
    popularity:
      popularityMode === null
        ? null
        : buildNormalizedRankMap(posts, (l, r) => compareByPopularity(l, r, popularityMode)),
  };

  const scoreByPost = new Map<string, number>();

  posts.forEach((post) => {
    let total = 0;

    if (rankMaps.popularity) total += rankMaps.popularity.get(post.id) ?? 1;
    if (rankMaps.date) total += rankMaps.date.get(post.id) ?? 1;
    if (rankMaps.distance) total += rankMaps.distance.get(post.id) ?? 1;

    scoreByPost.set(post.id, total / activeDimensions.length);
  });

  return [...posts].sort((left, right) => {
    // Posts without coordinates always sink to the bottom when distance is active.
    if (sortState.distance !== "off") {
      if (left.distanceKm === null && right.distanceKm !== null) return 1;
      if (left.distanceKm !== null && right.distanceKm === null) return -1;
    }

    const leftScore = scoreByPost.get(left.id) ?? 1;
    const rightScore = scoreByPost.get(right.id) ?? 1;

    if (leftScore !== rightScore) return leftScore - rightScore;

    return compareCreatedAtDesc(left, right);
  });
}
