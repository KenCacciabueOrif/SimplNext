/**
 * Last updated: 2026-04-22
 * Changes: Added thread-level sort controls, independent reply scrolling, a collapsible reply composer that starts hidden, and scrolling of the main post with the replies.
 * Purpose: Render a thread page for a selected post or comment.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import PostCard from "@/app/components/PostCard";
import SortBar from "@/app/components/SortBar";
import ThreadReplyComposer from "@/app/components/ThreadReplyComposer";
import {
  getThreadPageData,
  parseViewerLocation,
  resolveFeedSort,
  type PostListItem,
} from "@/lib/simpl";

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string; lat?: string; lng?: string }>;
}) {
  const { id } = await params;
  const { lat, lng, sort: sortParam } = await searchParams;
  const viewerLocation = parseViewerLocation(lat, lng);
  const sort = resolveFeedSort(sortParam, viewerLocation);
  const threadData = await getThreadPageData(id, sort, viewerLocation);

  if (!threadData) {
    notFound();
  }

  const { post, replies }: { post: PostListItem; replies: PostListItem[] } = threadData;
  const navigationParams = new URLSearchParams();

  navigationParams.set("sort", sort);

  if (lat && lng) {
    navigationParams.set("lat", lat);
    navigationParams.set("lng", lng);
  }

  const navigationQuery = navigationParams.toString();
  const backToParentHref = post.parentId
    ? navigationQuery
      ? `/posts/${post.parentId}?${navigationQuery}`
      : `/posts/${post.parentId}`
    : navigationQuery
      ? `/?${navigationQuery}`
      : "/";

  return (
    <div className="screen-stack thread-screen">
      <div className="thread-bar">
        <Link href={backToParentHref} className="thread-bar-link">
          {post.parentId ? "Back to parent" : "Back to feed"}
        </Link>
        <span className="thread-bar-title">Commentaires</span>
      </div>

      <SortBar pathname={`/posts/${id}`} sort={sort} viewerLocation={viewerLocation} />

      <div className="thread-replies-screen">
        <div className="thread-replies-list">
          <PostCard post={post} threadId={post.id} mode="thread-main" navigationQuery={navigationQuery} />

          {replies.length === 0 ? (
            <div className="empty-state">
              <h2>Pas encore de réponse</h2>
              <p>Utilise le formulaire ci-dessous pour commencer le fil de discussion.</p>
            </div>
          ) : (
            replies.map((reply: PostListItem) => (
              <PostCard
                key={reply.id}
                post={reply}
                threadId={post.id}
                mode="thread"
                navigationQuery={navigationQuery}
              />
            ))
          )}
        </div>
      </div>

      <ThreadReplyComposer parentId={post.id} />
    </div>
  );
}