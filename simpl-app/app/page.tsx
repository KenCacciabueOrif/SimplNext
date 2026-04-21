/**
 * Last updated: 2026-04-21
 * Changes: Added support for location-aware distance sorting and preserved sort context in feed navigation.
 * Purpose: Render the main feed for root posts.
 */

import Link from "next/link";
import PostCard from "@/app/components/PostCard";
import SortBar from "@/app/components/SortBar";
import {
  getFeedPosts,
  parseViewerLocation,
  resolveFeedSort,
  type PostListItem,
} from "@/lib/simpl";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; lat?: string; lng?: string }>;
}) {
  const { lat, lng, sort: sortParam } = await searchParams;
  const viewerLocation = parseViewerLocation(lat, lng);
  const sort = resolveFeedSort(sortParam, viewerLocation);
  const posts = await getFeedPosts(sort, viewerLocation);
  const navigationParams = new URLSearchParams();

  navigationParams.set("sort", sort);

  if (viewerLocation) {
    navigationParams.set("lat", viewerLocation.latitude.toFixed(6));
    navigationParams.set("lng", viewerLocation.longitude.toFixed(6));
  }

  const navigationQuery = navigationParams.toString();

  return (
    <div className="screen-stack">
      <SortBar pathname="/" sort={sort} viewerLocation={viewerLocation} />

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