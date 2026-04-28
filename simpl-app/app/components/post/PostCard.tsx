/**
 * Last updated: 2026-04-28
 * Changes: Converted to a client component, switched Report to optimistic queue handling, and made createdAt rendering deterministic (UTC) to avoid Vercel hydration mismatch.
 * Purpose: Present Simpl posts with their metadata, counters, and available actions.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { PostStatus } from "@prisma/client";
import GeoAwareBackLink from "@/app/components/layout/GeoAwareBackLink";
import PostActionControls from "@/app/components/post/PostActionControls";
import type { PostListItem } from "@/lib/simpl";

type PostCardMode = "feed" | "thread" | "thread-main" | "moderation";

type PostCardProps = {
  post: PostListItem;
  threadId: string;
  mode: PostCardMode;
  navigationQuery?: string;
};

function statusLabel(status: PostStatus) {
  switch (status) {
    case PostStatus.ACTIVE:
      return "Active";
    case PostStatus.UNDER_REVIEW:
      return "Under review";
    case PostStatus.HIDDEN:
      return "Hidden";
    case PostStatus.REMOVED:
      return "Removed";
    default:
      return status;
  }
}

function formatDistance(distanceKm: number | null) {
  if (distanceKm === null) {
    return "GPS off";
  }

  if (distanceKm < 1) {
    return `${Math.max(0.1, Math.round(distanceKm * 10) / 10)} km`;
  }

  if (distanceKm < 10) {
    return `${Math.round(distanceKm * 10) / 10} km`;
  }

  return `${Math.round(distanceKm)} km`;
}

const CREATED_AT_FORMATTER = new Intl.DateTimeFormat("fr-CH", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "UTC",
});

function formatCreatedAt(createdAt: Date | string) {
  return CREATED_AT_FORMATTER.format(new Date(createdAt));
}

export default function PostCard({ post, threadId, mode, navigationQuery }: PostCardProps) {
  const [isHiddenForReporter, setIsHiddenForReporter] = useState(
    post.viewerModerationDecision === "REMOVE",
  );

  if (isHiddenForReporter && mode !== "moderation") {
    return null;
  }

  const isModeration = mode === "moderation";
  const isMain = mode === "thread-main";
  const postThreadHref = navigationQuery ? `/posts/${post.id}?${navigationQuery}` : `/posts/${post.id}`;
  const backHref = post.parentId
    ? navigationQuery
      ? `/posts/${post.parentId}?${navigationQuery}`
      : `/posts/${post.parentId}`
    : navigationQuery
      ? `/?${navigationQuery}`
      : "/";

  return (
    <article
      className={`post-card${isMain ? " is-main" : ""}${post.status === PostStatus.HIDDEN ? " is-hidden" : ""}`}
    >
      <div className="post-meta-bar">
        <span>{post.authorDisplayName}</span>
        <span>{formatCreatedAt(post.createdAt)}</span>
        <span>{formatDistance(post.distanceKm)}</span>
      </div>

      <div className="post-body-panel">
        <h2 className="post-title">{post.title}</h2>
        <p className="post-body">{post.body}</p>
        {post.status !== PostStatus.ACTIVE ? (
          <p className={`post-status status-${post.status.toLowerCase()}`}>
            {statusLabel(post.status)}
          </p>
        ) : null}
      </div>

      <div className="post-actions-row">
        {isModeration ? (
          <div className="action-group">
            <PostActionControls
              postId={post.id}
              threadId={threadId}
              mode="moderation"
              likeCount={post.likeCount}
              dislikeCount={post.dislikeCount}
              keepVoteCount={post.keepVoteCount}
              removeVoteCount={post.removeVoteCount}
              viewerReaction={post.viewerReaction}
              viewerModerationDecision={post.viewerModerationDecision}
            />
          </div>
        ) : (
          <div className="action-group">
            <PostActionControls
              postId={post.id}
              threadId={threadId}
              mode="reactions"
              showReportButton
              likeCount={post.likeCount}
              dislikeCount={post.dislikeCount}
              keepVoteCount={post.keepVoteCount}
              removeVoteCount={post.removeVoteCount}
              viewerReaction={post.viewerReaction}
              viewerModerationDecision={post.viewerModerationDecision}
              onViewerReported={() => setIsHiddenForReporter(true)}
            />
          </div>
        )}

        <div className="action-group action-group-right">
          {mode === "thread-main" ? (
            <GeoAwareBackLink className="legacy-button legacy-link-button" fallbackHref={backHref}>
              Back
            </GeoAwareBackLink>
          ) : (
            <Link className="legacy-button legacy-link-button" href={postThreadHref}>
              Commentaires {post.replyCount}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
