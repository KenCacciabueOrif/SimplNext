/**
 * Last updated: 2026-04-22
 * Changes: Added tri-state multi-filter sorting with averaged normalized ranks across popularity/date/distance while preserving moderation policy helpers.
 * Purpose: Centralize server-side data access and shared domain rules for the Simpl application.
 */

import { cookies } from "next/headers";
import { ModerationDecision, PostStatus, ReactionType } from "@prisma/client";
import prisma from "@/lib/prisma";

const ACTOR_COOKIE = "simpl-actor-key";

export type SortMode = "down" | "up" | "off";

export type FeedSortState = {
  popularity: SortMode;
  date: SortMode;
  distance: SortMode;
};

export const DEFAULT_FEED_SORT_STATE: FeedSortState = {
  popularity: "down",
  date: "down",
  distance: "down",
};

export type ViewerLocation = {
  latitude: number;
  longitude: number;
};

export type ModerationPolicyOutcome = {
  totalVotes: number;
  shouldDelete: boolean;
  inModeration: boolean;
  visibleOnHomepage: boolean;
  status: PostStatus;
};

export type PostListItem = {
  id: string;
  title: string;
  body: string;
  authorDisplayName: string;
  parentId: string | null;
  rootId: string | null;
  latitude: number | null;
  longitude: number | null;
  likeCount: number;
  dislikeCount: number;
  reportCount: number;
  keepVoteCount: number;
  removeVoteCount: number;
  status: PostStatus;
  createdAt: Date;
  replyCount: number;
  distanceKm: number | null;
  viewerReaction: ReactionType | null;
  viewerModerationDecision: ModerationDecision | null;
};

type PostQueryRecord = Parameters<typeof toPostListItem>[0];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(
  viewerLocation: ViewerLocation,
  post: Pick<PostListItem, "latitude" | "longitude">,
) {
  if (post.latitude === null || post.longitude === null) {
    return null;
  }

  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(post.latitude - viewerLocation.latitude);
  const longitudeDelta = toRadians(post.longitude - viewerLocation.longitude);
  const viewerLatitude = toRadians(viewerLocation.latitude);
  const postLatitude = toRadians(post.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(viewerLatitude) * Math.cos(postLatitude) *
      Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function compareCreatedAtDesc(left: PostListItem, right: PostListItem) {
  if (left.createdAt.getTime() !== right.createdAt.getTime()) {
    return right.createdAt.getTime() - left.createdAt.getTime();
  }

  return left.id.localeCompare(right.id);
}

function compareByPopularity(left: PostListItem, right: PostListItem, mode: Exclude<SortMode, "off">) {
  const leftScore = left.likeCount - left.dislikeCount;
  const rightScore = right.likeCount - right.dislikeCount;

  if (leftScore !== rightScore) {
    return mode === "down" ? rightScore - leftScore : leftScore - rightScore;
  }

  return compareCreatedAtDesc(left, right);
}

function compareByDate(left: PostListItem, right: PostListItem, mode: Exclude<SortMode, "off">) {
  if (left.createdAt.getTime() !== right.createdAt.getTime()) {
    return mode === "down"
      ? right.createdAt.getTime() - left.createdAt.getTime()
      : left.createdAt.getTime() - right.createdAt.getTime();
  }

  return left.id.localeCompare(right.id);
}

function compareByDistance(left: PostListItem, right: PostListItem, mode: Exclude<SortMode, "off">) {
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
    return mode === "down" ? left.distanceKm - right.distanceKm : right.distanceKm - left.distanceKm;
  }

  return compareCreatedAtDesc(left, right);
}

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

function getActiveSortModes(sortState: FeedSortState) {
  const activeModes: Array<"popularity" | "date" | "distance"> = [];

  if (sortState.popularity !== "off") {
    activeModes.push("popularity");
  }

  if (sortState.date !== "off") {
    activeModes.push("date");
  }

  if (sortState.distance !== "off") {
    activeModes.push("distance");
  }

  return activeModes;
}

function sortPostsByAggregateRanks(posts: PostListItem[], sortState: FeedSortState) {
  const activeModes = getActiveSortModes(sortState);

  if (activeModes.length === 0) {
    return [...posts].sort(compareCreatedAtDesc);
  }

  const dateMode = sortState.date === "off" ? null : sortState.date;
  const distanceMode = sortState.distance === "off" ? null : sortState.distance;
  const popularityMode = sortState.popularity === "off" ? null : sortState.popularity;

  const rankMaps = {
    date:
      dateMode === null
        ? null
        : buildNormalizedRankMap(posts, (left, right) => compareByDate(left, right, dateMode)),
    distance:
      distanceMode === null
        ? null
        : buildNormalizedRankMap(posts, (left, right) => compareByDistance(left, right, distanceMode)),
    popularity:
      popularityMode === null
        ? null
        : buildNormalizedRankMap(posts, (left, right) => compareByPopularity(left, right, popularityMode)),
  };

  const scoreByPost = new Map<string, number>();

  posts.forEach((post) => {
    let total = 0;

    if (rankMaps.popularity) {
      total += rankMaps.popularity.get(post.id) ?? 1;
    }

    if (rankMaps.date) {
      total += rankMaps.date.get(post.id) ?? 1;
    }

    if (rankMaps.distance) {
      total += rankMaps.distance.get(post.id) ?? 1;
    }

    scoreByPost.set(post.id, total / activeModes.length);
  });

  return [...posts].sort((left, right) => {
    if (sortState.distance !== "off") {
      if (left.distanceKm === null && right.distanceKm !== null) {
        return 1;
      }

      if (left.distanceKm !== null && right.distanceKm === null) {
        return -1;
      }
    }

    const leftScore = scoreByPost.get(left.id) ?? 1;
    const rightScore = scoreByPost.get(right.id) ?? 1;

    if (leftScore !== rightScore) {
      return leftScore - rightScore;
    }

    return compareCreatedAtDesc(left, right);
  });
}

function toPostListItem(post: {
  id: string;
  title: string;
  body: string;
  parentId: string | null;
  rootId: string | null;
  latitude: number | null;
  longitude: number | null;
  likeCount: number;
  dislikeCount: number;
  reportCount: number;
  keepVoteCount: number;
  removeVoteCount: number;
  status: PostStatus;
  createdAt: Date;
  author: { displayName: string };
  _count: { replies: number };
  reactions: { type: ReactionType }[];
  moderationVotes: { decision: ModerationDecision }[];
}, viewerLocation?: ViewerLocation | null): PostListItem {
  return {
    authorDisplayName: post.author.displayName,
    body: post.body,
    createdAt: post.createdAt,
    distanceKm: viewerLocation ? calculateDistanceKm(viewerLocation, post) : null,
    dislikeCount: post.dislikeCount,
    id: post.id,
    keepVoteCount: post.keepVoteCount,
    latitude: post.latitude,
    likeCount: post.likeCount,
    longitude: post.longitude,
    parentId: post.parentId,
    removeVoteCount: post.removeVoteCount,
    replyCount: post._count.replies,
    reportCount: post.reportCount,
    rootId: post.rootId,
    status: post.status,
    title: post.title,
    viewerModerationDecision: post.moderationVotes[0]?.decision ?? null,
    viewerReaction: post.reactions[0]?.type ?? null,
  };
}

export function parseViewerLocation(latitude?: string, longitude?: string): ViewerLocation | null {
  if (!latitude || !longitude) {
    return null;
  }

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
    return null;
  }

  if (parsedLatitude < -90 || parsedLatitude > 90 || parsedLongitude < -180 || parsedLongitude > 180) {
    return null;
  }

  return { latitude: parsedLatitude, longitude: parsedLongitude };
}

function parseSortMode(input?: string): SortMode {
  if (input === "down" || input === "up" || input === "off") {
    return input;
  }

  return "off";
}

export function resolveFeedSortState(input: {
  popularity?: string;
  date?: string;
  distance?: string;
  sort?: string;
}, viewerLocation?: ViewerLocation | null): FeedSortState {
  const sortState: FeedSortState = {
    popularity: parseSortMode(input.popularity),
    date: parseSortMode(input.date),
    distance: parseSortMode(input.distance),
  };

  // Backward compatibility with the previous single-sort query parameter.
  if (!input.popularity && !input.date && !input.distance) {
    if (input.sort === "top") {
      sortState.popularity = "down";
      sortState.date = "off";
      sortState.distance = "off";
    } else if (input.sort === "distance") {
      sortState.popularity = "off";
      sortState.date = "off";
      sortState.distance = "down";
    } else if (!input.sort) {
      // First load with no params at all: apply the full default (all down).
      return { ...DEFAULT_FEED_SORT_STATE };
    } else {
      sortState.popularity = "off";
      sortState.date = "down";
      sortState.distance = "off";
    }
  }

  // Distance requires a known viewer location; drop it silently if unavailable.
  if (!viewerLocation) {
    sortState.distance = "off";
  }

  return sortState;
}

export function evaluateModerationPolicy(
  keepVoteCount: number,
  removeVoteCount: number,
): ModerationPolicyOutcome {
  const totalVotes = keepVoteCount + removeVoteCount;

  if (totalVotes < 10) {
    return {
      inModeration: true,
      shouldDelete: false,
      status: PostStatus.UNDER_REVIEW,
      totalVotes,
      visibleOnHomepage: true,
    };
  }

  if (removeVoteCount >= 2 * keepVoteCount) {
    return {
      inModeration: false,
      shouldDelete: true,
      status: PostStatus.REMOVED,
      totalVotes,
      visibleOnHomepage: false,
    };
  }

  if (keepVoteCount >= 2 * removeVoteCount) {
    return {
      inModeration: false,
      shouldDelete: false,
      status: PostStatus.ACTIVE,
      totalVotes,
      visibleOnHomepage: true,
    };
  }

  if (removeVoteCount > keepVoteCount) {
    return {
      inModeration: true,
      shouldDelete: false,
      status: PostStatus.HIDDEN,
      totalVotes,
      visibleOnHomepage: false,
    };
  }

  return {
    inModeration: true,
    shouldDelete: false,
    status: PostStatus.UNDER_REVIEW,
    totalVotes,
    visibleOnHomepage: true,
  };
}

export async function getViewerActor() {
  const cookieStore = await cookies();
  const actorKey = cookieStore.get(ACTOR_COOKIE)?.value;

  if (!actorKey) {
    return null;
  }

  return prisma.actor.findUnique({
    where: { key: actorKey },
  });
}

export async function ensureAnonymousActor() {
  const cookieStore = await cookies();
  let actorKey = cookieStore.get(ACTOR_COOKIE)?.value;

  if (!actorKey) {
    actorKey = crypto.randomUUID();
    cookieStore.set(ACTOR_COOKIE, actorKey, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return prisma.actor.upsert({
    where: { key: actorKey },
    update: {},
    create: {
      key: actorKey,
      displayName: `Anon-${actorKey.slice(0, 8)}`,
    },
  });
}

export async function getFeedPosts(sortState: FeedSortState, viewerLocation?: ViewerLocation | null) {
  const viewerActor = await getViewerActor();

  const posts = (await prisma.post.findMany({
    where: {
      parentId: null,
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      author: true,
      moderationVotes: {
        select: { decision: true },
        take: 1,
        where: {
          actorId: viewerActor?.id ?? "",
        },
      },
      reactions: {
        select: { type: true },
        take: 1,
        where: {
          actorId: viewerActor?.id ?? "",
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  })) as unknown as PostQueryRecord[];

  const normalizedPosts = posts.map((post) => toPostListItem(post, viewerLocation));
  const visiblePosts = normalizedPosts.filter((post) => {
    const outcome = evaluateModerationPolicy(post.keepVoteCount, post.removeVoteCount);

    if (!outcome.visibleOnHomepage) {
      return false;
    }

    // A reporter should not see a post in homepage while their REMOVE vote is still active.
    if (post.viewerModerationDecision === ModerationDecision.REMOVE) {
      return false;
    }

    return true;
  });

  return sortPostsByAggregateRanks(visiblePosts, sortState);
}

export async function getThreadPageData(
  postId: string,
  sortState: FeedSortState = DEFAULT_FEED_SORT_STATE,
  viewerLocation?: ViewerLocation | null,
) {
  const viewerActor = await getViewerActor();

  const post = (await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: true,
      moderationVotes: {
        select: { decision: true },
        take: 1,
        where: {
          actorId: viewerActor?.id ?? "",
        },
      },
      reactions: {
        select: { type: true },
        take: 1,
        where: {
          actorId: viewerActor?.id ?? "",
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  })) as unknown as PostQueryRecord | null;

  if (!post) {
    return null;
  }

  const replies = (await prisma.post.findMany({
    where: {
      parentId: postId,
      status: PostStatus.ACTIVE,
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      author: true,
      moderationVotes: {
        select: { decision: true },
        take: 1,
        where: {
          actorId: viewerActor?.id ?? "",
        },
      },
      reactions: {
        select: { type: true },
        take: 1,
        where: {
          actorId: viewerActor?.id ?? "",
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  })) as unknown as PostQueryRecord[];

  const normalizedReplies = replies.map((reply) => toPostListItem(reply, viewerLocation));

  return {
    post: toPostListItem(post, viewerLocation),
    replies: sortPostsByAggregateRanks(normalizedReplies, sortState),
  };
}

export async function getModerationQueue(
  sortState: FeedSortState = DEFAULT_FEED_SORT_STATE,
  viewerLocation?: ViewerLocation | null,
) {
  const viewerActor = await getViewerActor();

  const posts = (await prisma.post.findMany({
    where: {},
    orderBy: [{ createdAt: "desc" }],
    include: {
      author: true,
      moderationVotes: {
        select: { decision: true },
        take: 1,
        where: {
          actorId: viewerActor?.id ?? "",
        },
      },
      reactions: {
        select: { type: true },
        take: 1,
        where: {
          actorId: viewerActor?.id ?? "",
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  })) as unknown as PostQueryRecord[];

  const normalizedPosts = posts.map((post) => toPostListItem(post, viewerLocation));
  const moderationPosts = normalizedPosts.filter((post) => {
    const outcome = evaluateModerationPolicy(post.keepVoteCount, post.removeVoteCount);
    return outcome.inModeration;
  });

  return sortPostsByAggregateRanks(moderationPosts, sortState);
}