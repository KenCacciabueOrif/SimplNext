/**
 * Last updated: 2026-04-27
 * Changes: Extracted from lib/simpl.ts as part of Phase 2 decomposition.
 * Purpose: Server-side Prisma post queries for feed, thread, and moderation views.
 */

import { ModerationDecision, PostStatus, type ReactionType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { sortPostsByAggregateRanks } from "@/lib/sorting";
import { evaluateModerationPolicy } from "@/lib/policy";
import { calculateDistanceKm } from "@/lib/geo";
import { DEFAULT_FEED_SORT_STATE } from "@/lib/navigation";
import type { FeedSortState, PostListItem, ViewerLocation } from "@/lib/types";
import { getViewerActor } from "@/lib/actor";

// Convenience alias for the Prisma include shape used in all post queries.
// Cast via `as unknown as PostQueryRecord[]` at query site boundaries.
type PostQueryRecord = Parameters<typeof toPostListItem>[0];

// Builds the viewer-scoped Prisma include used across all post queries.
function buildPostInclude(actorId: string) {
  return {
    author: true,
    moderationVotes: { select: { decision: true }, take: 1, where: { actorId } },
    reactions: { select: { type: true }, take: 1, where: { actorId } },
    _count: { select: { replies: true } },
  };
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

export async function getFeedPosts(sortState: FeedSortState, viewerLocation?: ViewerLocation | null) {
  const viewerActor = await getViewerActor();

  const posts = (await prisma.post.findMany({
    where: { parentId: null },
    orderBy: [{ createdAt: "desc" }],
    include: buildPostInclude(viewerActor?.id ?? ""),
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
    include: buildPostInclude(viewerActor?.id ?? ""),
  })) as unknown as PostQueryRecord | null;

  if (!post) {
    return null;
  }

  const replies = (await prisma.post.findMany({
    where: { parentId: postId, status: PostStatus.ACTIVE },
    orderBy: [{ createdAt: "desc" }],
    include: buildPostInclude(viewerActor?.id ?? ""),
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
    include: buildPostInclude(viewerActor?.id ?? ""),
  })) as unknown as PostQueryRecord[];

  const normalizedPosts = posts.map((post) => toPostListItem(post, viewerLocation));
  const moderationPosts = normalizedPosts.filter((post) => {
    const outcome = evaluateModerationPolicy(post.keepVoteCount, post.removeVoteCount);
    return outcome.inModeration;
  });

  return sortPostsByAggregateRanks(moderationPosts, sortState);
}
