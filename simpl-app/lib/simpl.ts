/**
 * Last updated: 2026-04-27
 * Changes: Fixed ReactionType import to use inline type-import to satisfy consistent-type-imports ESLint rule.
 * Purpose: Server-side data access (Prisma queries), anonymous actor management, and sort-state resolution for the Simpl application.
 */

import { cookies } from "next/headers";
import { ModerationDecision, PostStatus, type ReactionType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { sortPostsByAggregateRanks } from "@/lib/sorting";
import { evaluateModerationPolicy } from "@/lib/policy";
import type { FeedSortState, ModerationPolicyOutcome, PostListItem, SortMode, ViewerLocation } from "@/lib/types";

// Re-export domain types so existing consumers keep working without import changes.
export type { FeedSortState, ModerationPolicyOutcome, PostListItem, SortMode, ViewerLocation };
export { evaluateModerationPolicy };

const ACTOR_COOKIE = "simpl-actor-key";

export const DEFAULT_FEED_SORT_STATE: FeedSortState = {
  popularity: "down",
  date: "down",
  distance: "down",
};

// ---------------------------------------------------------------------------
// Internal query record type — matches the Prisma include shape used in all
// post queries. Cast via `as unknown as PostQueryRecord[]` at query boundaries.
// ---------------------------------------------------------------------------

type PostQueryRecord = Parameters<typeof toPostListItem>[0];

// ---------------------------------------------------------------------------
// Distance math
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Internal post transformer
// ---------------------------------------------------------------------------

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
      // First load with no params at all: apply defaults, then reconcile with
      // viewer location availability below.
      sortState.popularity = DEFAULT_FEED_SORT_STATE.popularity;
      sortState.date = DEFAULT_FEED_SORT_STATE.date;
      sortState.distance = DEFAULT_FEED_SORT_STATE.distance;
    } else {
      sortState.popularity = "off";
      sortState.date = "down";
      sortState.distance = "off";
    }
  }

  // Distance requires a known viewer location; drop it silently if unavailable.
  if (!viewerLocation) {
    sortState.distance = "off";
  } else if (!input.distance && sortState.distance === "off") {
    // Keep explicit distance=off, but when the parameter is absent and GPS is
    // available, apply the default distance mode automatically.
    sortState.distance = DEFAULT_FEED_SORT_STATE.distance;
  }

  return sortState;
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