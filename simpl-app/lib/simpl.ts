/**
 * Last updated: 2026-04-21
 * Changes: Added viewer geolocation parsing and real distance-based sorting for feed and moderation queries.
 * Purpose: Centralize server-side data access and shared domain rules for the Simpl application.
 */

import { cookies } from "next/headers";
import { PostStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

const ACTOR_COOKIE = "simpl-actor-key";

export type FeedSort = "new" | "top" | "distance";

export type ViewerLocation = {
  latitude: number;
  longitude: number;
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
  const posts = (await prisma.post.findMany({
    where: {
      parentId: null,
      status: PostStatus.ACTIVE,
    },
    orderBy:
      sort === "top"
        ? [{ likeCount: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
    include: {
      author: true,
      _count: {
        select: { replies: true },
      },
    },
  })) as unknown as PostQueryRecord[];

  const normalizedPosts = posts.map((post) => toPostListItem(post, viewerLocation));
  return sort === "distance" ? sortPostsByDistance(normalizedPosts) : normalizedPosts;
}

export async function getThreadPageData(postId: string, viewerLocation?: ViewerLocation | null) {
  const post = (await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: true,
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
      status: {
        not: PostStatus.REMOVED,
      },
    },
    orderBy: [{ createdAt: "asc" }],
    include: {
      author: true,
      _count: {
        select: { replies: true },
      },
    },
  })) as unknown as PostQueryRecord[];

  return {
    post: toPostListItem(post, viewerLocation),
    replies: replies.map((reply) => toPostListItem(reply, viewerLocation)),
  };
}

export async function getModerationQueue(
  sort: FeedSort = "new",
  viewerLocation?: ViewerLocation | null,
) {
  const posts = (await prisma.post.findMany({
    where: {
      status: {
        in: [PostStatus.UNDER_REVIEW, PostStatus.HIDDEN],
      },
    },
    orderBy: [{ removeVoteCount: "desc" }, { createdAt: "desc" }],
    include: {
      author: true,
      _count: {
        select: { replies: true },
      },
    },
  })) as unknown as PostQueryRecord[];

  const normalizedPosts = posts.map((post) => toPostListItem(post, viewerLocation));
  return sort === "distance" ? sortPostsByDistance(normalizedPosts) : normalizedPosts;
}