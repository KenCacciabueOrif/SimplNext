/**
 * Last updated: 2026-04-21
 * Changes: Preserved feed query context across thread navigation so distance-based browsing survives page transitions.
 * Purpose: Render a thread page for a selected post or comment.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "@/app/components/PostCard";
import PostComposer from "@/app/components/PostComposer";
import { getThreadPageData, parseViewerLocation, type PostListItem } from "@/lib/simpl";

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string; lat?: string; lng?: string }>;
}) {
  const { id } = await params;
  const { lat, lng, sort } = await searchParams;
  const viewerLocation = parseViewerLocation(lat, lng);
  const threadData = await getThreadPageData(id, viewerLocation);

  if (!threadData) {
    notFound();
  }

  const { post, replies }: { post: PostListItem; replies: PostListItem[] } = threadData;
  const navigationParams = new URLSearchParams();

  if (sort) {
    navigationParams.set("sort", sort);
  }

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
    <div className="screen-stack">
      <div className="thread-bar">
        <Link href={backToParentHref} className="thread-bar-link">
          {post.parentId ? "Back to parent" : "Back to feed"}
        </Link>
        <span className="thread-bar-title">Commentaires</span>
      </div>

      <div className="post-list-screen">
        <PostCard post={post} threadId={post.id} mode="thread-main" navigationQuery={navigationQuery} />

        {replies.length === 0 ? (
          <div className="empty-state">
            <h2>Pas encore de réponse</h2>
            <p>Utilise le bouton + pour commencer le fil de discussion.</p>
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

      <div id="reply-form">
        <PostComposer
          heading="Nouveau commentaire"
          submitLabel="Publier la réponse"
          description="Chaque réponse devient un nouveau post relié à cet élément."
          parentId={post.id}
        />
      </div>

      <Link href="#reply-form" className="floating-create" aria-label="Répondre à ce post">
        +
      </Link>
    </div>
  );
}