/**
 * Last updated: 2026-04-22
 * Changes: Replaced Like/DisLike/Good/Bad form submits with optimistic client controls and restored Report availability on the main thread post.
 * Purpose: Present Simpl posts with their metadata, counters, and available actions.
 */

import Link from "next/link";
import { ModerationDecision, PostStatus } from "@prisma/client";
import {
  castModerationVoteFormAction,
} from "@/app/actions";
import PostActionControls from "@/app/components/PostActionControls";
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

export default function PostCard({ post, threadId, mode, navigationQuery }: PostCardProps) {
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
        <span>{new Date(post.createdAt).toLocaleString("fr-CH")}</span>
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
              likeCount={post.likeCount}
              dislikeCount={post.dislikeCount}
              keepVoteCount={post.keepVoteCount}
              removeVoteCount={post.removeVoteCount}
              viewerReaction={post.viewerReaction}
              viewerModerationDecision={post.viewerModerationDecision}
            />

            <form action={castModerationVoteFormAction}>
              <input name="postId" type="hidden" value={post.id} />
              <input name="threadId" type="hidden" value={threadId} />
              <input name="decision" type="hidden" value={ModerationDecision.REMOVE} />
              <button className="legacy-button" type="submit">
                Report
              </button>
            </form>
          </div>
        )}

        <div className="action-group action-group-right">
          {mode === "thread-main" ? (
            <Link className="legacy-button legacy-link-button" href={backHref}>
              Back
            </Link>
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