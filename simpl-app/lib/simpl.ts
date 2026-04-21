/**
 * Last updated: 2026-04-21
 * Changes: Added the Simpl domain helpers for actor identity, feed queries, thread queries, and moderation queue reads.
 * Purpose: Centralize server-side data access and shared domain rules for the Simpl application.
 */

import { cookies } from "next/headers";
import { PostStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

const ACTOR_COOKIE = "simpl-actor-key";

export type FeedSort = "new" | "top";

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
};

type PostQueryRecord = Parameters<typeof toPostListItem>[0];

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
}): PostListItem {
  return {
    authorDisplayName: post.author.displayName,
    body: post.body,
    createdAt: post.createdAt,
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

export function resolveFeedSort(input?: string): FeedSort {
  return input === "top" ? "top" : "new";
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

export async function getFeedPosts(sort: FeedSort) {
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

  return posts.map(toPostListItem);
}

export async function getThreadPageData(postId: string) {
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

  return { post: toPostListItem(post), replies: replies.map(toPostListItem) };
}

export async function getModerationQueue() {
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

  return posts.map(toPostListItem);
}