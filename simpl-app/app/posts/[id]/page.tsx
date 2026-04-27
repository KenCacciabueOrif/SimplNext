/**
 * Last updated: 2026-04-22
 * Changes: Added tri-state multi-filter sorting for replies and preserved filter modes in thread navigation links.
 * Purpose: Render a thread page for a selected post or comment.
 */

import { notFound } from "next/navigation";
import GeoAwareBackLink from "@/app/components/GeoAwareBackLink";
import PostCard from "@/app/components/PostCard";
import SortBar from "@/app/components/SortBar";
import ThreadReplyComposer from "@/app/components/ThreadReplyComposer";
import { buildNavigationQueryFromState } from "@/lib/navigation";
import {
  getThreadPageData,
  parseViewerLocation,
  resolveFeedSortState,
  type PostListItem,
} from "@/lib/simpl";

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    popularity?: string;
    date?: string;
    distance?: string;
    sort?: string;
    lat?: string;
    lng?: string;
  }>;
}) {
  const { id } = await params;
  const { lat, lng, sort, popularity, date, distance } = await searchParams;
  const viewerLocation = parseViewerLocation(lat, lng);
  const sortState = resolveFeedSortState({ date, distance, popularity, sort }, viewerLocation);
  const threadData = await getThreadPageData(id, sortState, viewerLocation);

  if (!threadData) {
    notFound();
  }

  const { post, replies }: { post: PostListItem; replies: PostListItem[] } = threadData;
  const navigationQuery = buildNavigationQueryFromState(sortState, viewerLocation);
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
        <GeoAwareBackLink fallbackHref={backToParentHref} className="thread-bar-link">
          {post.parentId ? "Back to parent" : "Back to feed"}
        </GeoAwareBackLink>
        <span className="thread-bar-title">Commentaires</span>
      </div>

      <SortBar pathname={`/posts/${id}`} sortState={sortState} viewerLocation={viewerLocation} />

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