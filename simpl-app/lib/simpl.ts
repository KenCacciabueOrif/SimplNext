/**
 * Last updated: 2026-04-22
 * Changes: Added a shared moderation policy evaluator and applied it to homepage/moderation visibility rules.
 * Purpose: Centralize server-side data access and shared domain rules for the Simpl application.
 */

import { cookies } from "next/headers";
import { ModerationDecision, PostStatus, ReactionType } from "@prisma/client";
import prisma from "@/lib/prisma";

const ACTOR_COOKIE = "simpl-actor-key";

export type FeedSort = "new" | "top" | "distance";

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

function sortPostsByDistance(posts: PostListItem[]) {
  return [...posts].sort((left, right) => {
    if (left.distanceKm === null && right.distanceKm === null) {
      return right.createdAt.getTime() - left.createdAt.getTime();
    }

    if (left.distanceKm === null) {
      return 1;
    }

    if (right.distanceKm === null) {
      return -1;
    }

    if (left.distanceKm !== right.distanceKm) {
      return left.distanceKm - right.distanceKm;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
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

export function resolveFeedSort(input?: string, viewerLocation?: ViewerLocation | null): FeedSort {
  if (input === "distance" && viewerLocation) {
    return "distance";
  }

  if (input === "top") {
    return "top";
  }

  return "new";
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

export async function getFeedPosts(sort: FeedSort, viewerLocation?: ViewerLocation | null) {
  const viewerActor = await getViewerActor();

  const posts = (await prisma.post.findMany({
    where: {
      parentId: null,
    },
    orderBy:
      sort === "top"
        ? [{ likeCount: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
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

  return sort === "distance" ? sortPostsByDistance(visiblePosts) : visiblePosts;
}

export async function getThreadPageData(
  postId: string,
  sort: FeedSort = "new",
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
    orderBy:
      sort === "top"
        ? [{ likeCount: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
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
    replies: sort === "distance" ? sortPostsByDistance(normalizedReplies) : normalizedReplies,
  };
}

export async function getModerationQueue(
  sort: FeedSort = "new",
  viewerLocation?: ViewerLocation | null,
) {
  const viewerActor = await getViewerActor();

  const posts = (await prisma.post.findMany({
    where: {},
    orderBy: [{ removeVoteCount: "desc" }, { createdAt: "desc" }],
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

  return sort === "distance" ? sortPostsByDistance(moderationPosts) : moderationPosts;
}