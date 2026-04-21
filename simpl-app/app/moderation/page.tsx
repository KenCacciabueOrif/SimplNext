/**
 * Last updated: 2026-04-21
 * Changes: Added support for distance sorting inside the moderation queue and preserved viewer location in post links.
 * Purpose: Render the posts currently under community review.
 */

import PostCard from "@/app/components/PostCard";
import SortBar from "@/app/components/SortBar";
import { getModerationQueue, parseViewerLocation, resolveFeedSort } from "@/lib/simpl";

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; lat?: string; lng?: string }>;
}) {
  const { lat, lng, sort: sortParam } = await searchParams;
  const viewerLocation = parseViewerLocation(lat, lng);
  const sort = resolveFeedSort(sortParam, viewerLocation);
  const posts = await getModerationQueue(sort, viewerLocation);
  const navigationParams = new URLSearchParams();

  navigationParams.set("sort", sort);

  if (viewerLocation) {
    navigationParams.set("lat", viewerLocation.latitude.toFixed(6));
    navigationParams.set("lng", viewerLocation.longitude.toFixed(6));
  }

  const navigationQuery = navigationParams.toString();

  return (
    <div className="screen-stack">
      <SortBar pathname="/moderation" sort={sort} viewerLocation={viewerLocation} />

      {posts.length === 0 ? (
        <div className="empty-state">
          <h2>Rien à modérer</h2>
          <p>Aucun post n’est actuellement en revue communautaire.</p>
        </div>
      ) : (
        <div className="post-list-screen">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              threadId={post.id}
              mode="moderation"
              navigationQuery={navigationQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}