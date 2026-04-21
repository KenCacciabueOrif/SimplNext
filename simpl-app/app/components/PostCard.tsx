/**
 * Last updated: 2026-04-21
 * Changes: Added a reusable post card for feed, thread, and moderation contexts.
 * Purpose: Present Simpl posts with their metadata, counters, and available actions.
 */

import Link from "next/link";
import { ModerationDecision, PostStatus } from "@prisma/client";
import {
  castModerationVoteAction,
  toggleReactionAction,
} from "@/app/actions";
import type { PostListItem } from "@/lib/simpl";

type PostCardMode = "feed" | "thread" | "thread-main" | "moderation";

type PostCardProps = {
  post: PostListItem;
  threadId: string;
  mode: PostCardMode;
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

function formatDistance(post: Pick<PostListItem, "latitude" | "longitude">) {
  if (post.latitude === null || post.longitude === null) {
    return "Location pending";
  }

  return `${post.latitude.toFixed(2)}, ${post.longitude.toFixed(2)}`;
}

export default function PostCard({ post, threadId, mode }: PostCardProps) {
  const isModeration = mode === "moderation";
  const isMain = mode === "thread-main";

  return (
    <article
      className={`post-card${isMain ? " is-main" : ""}${post.status === PostStatus.HIDDEN ? " is-hidden" : ""}`}
    >
      <div className="meta-row">
        <p className="meta-line">
          <span>{post.authorDisplayName}</span>
          <span>{new Date(post.createdAt).toLocaleString("fr-CH")}</span>
          <span>{formatDistance(post)}</span>
        </p>

        <span className={`status-badge status-${post.status.toLowerCase()}`}>
          {statusLabel(post.status)}
        </span>
      </div>

      <div className="post-stack">
        <h2 className="post-title">{post.title}</h2>
        <p className="post-body">{post.body}</p>
      </div>

      <ul className="counter-list">
        <li>Likes {post.likeCount}</li>
        <li>Dislikes {post.dislikeCount}</li>
        <li>Signalements {post.reportCount}</li>
        <li>Réponses {post.replyCount}</li>
      </ul>

      <div className="button-row">
        {isModeration ? (
          <>
            <form action={castModerationVoteAction}>
              <input name="postId" type="hidden" value={post.id} />
              <input name="threadId" type="hidden" value={threadId} />
              <input name="decision" type="hidden" value={ModerationDecision.KEEP} />
              <button className="button-secondary" type="submit">
                Garder ({post.keepVoteCount})
              </button>
            </form>

            <form action={castModerationVoteAction}>
              <input name="postId" type="hidden" value={post.id} />
              <input name="threadId" type="hidden" value={threadId} />
              <input name="decision" type="hidden" value={ModerationDecision.REMOVE} />
              <button className="button-danger" type="submit">
                Retirer ({post.removeVoteCount})
              </button>
            </form>
          </>
        ) : (
          <>
            <form action={toggleReactionAction}>
              <input name="postId" type="hidden" value={post.id} />
              <input name="threadId" type="hidden" value={threadId} />
              <input name="reactionType" type="hidden" value="LIKE" />
              <button className="button-secondary" type="submit">
                Like
              </button>
            </form>

            <form action={toggleReactionAction}>
              <input name="postId" type="hidden" value={post.id} />
              <input name="threadId" type="hidden" value={threadId} />
              <input name="reactionType" type="hidden" value="DISLIKE" />
              <button className="button-secondary" type="submit">
                Dislike
              </button>
            </form>

            <form action={castModerationVoteAction}>
              <input name="postId" type="hidden" value={post.id} />
              <input name="threadId" type="hidden" value={threadId} />
              <input name="decision" type="hidden" value={ModerationDecision.REMOVE} />
              <button className="button-danger" type="submit">
                Report
              </button>
            </form>
          </>
        )}

        <Link className="text-link" href={`/posts/${post.id}`}>
          Ouvrir le thread
        </Link>

        {post.parentId ? (
          <Link className="text-link" href={`/posts/${post.parentId}`}>
            Parent
          </Link>
        ) : null}
      </div>
    </article>
  );
}