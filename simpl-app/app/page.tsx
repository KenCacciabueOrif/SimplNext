/**
 * Last updated: 2026-04-22
 * Changes: Switched feed sorting to tri-state multi-filter controls and persisted each filter mode in navigation params.
 * Purpose: Render the main feed for root posts.
 */

import Link from "next/link";
import PostCard from "@/app/components/post/PostCard";
import SortBar from "@/app/components/sort/SortBar";
import { buildNavigationQueryFromState } from "@/lib/navigation";
import {
  getFeedPosts,
  parseViewerLocation,
  resolveFeedSortState,
  type PostListItem,
} from "@/lib/simpl";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    popularity?: string;
    date?: string;
    distance?: string;
    sort?: string;
    lat?: string;
    lng?: string;
  }>;
}) {
  const { lat, lng, sort, popularity, date, distance } = await searchParams;
  const viewerLocation = parseViewerLocation(lat, lng);
  const sortState = resolveFeedSortState({ date, distance, popularity, sort }, viewerLocation);
  const posts = await getFeedPosts(sortState, viewerLocation);
  const navigationQuery = buildNavigationQueryFromState(sortState, viewerLocation);

  return (
    <div className="screen-stack">
      <SortBar pathname="/" sortState={sortState} viewerLocation={viewerLocation} />

      {posts.length === 0 ? (
        <div className="empty-state">
          <h2>Aucun post disponible</h2>
          <p>Ajoute un premier contenu pour initialiser le fil principal.</p>
        </div>
      ) : (
        <div className="post-list-screen">
          {posts.map((post: PostListItem) => (
            <PostCard
              key={post.id}
              post={post}
              threadId={post.id}
              mode="feed"
              navigationQuery={navigationQuery}
            />
          ))}
        </div>
      )}

      <Link href={navigationQuery ? `/posts/new?${navigationQuery}` : "/posts/new"} className="floating-create" aria-label="Créer un nouveau post">
        +
      </Link>
    </div>
  );
}
