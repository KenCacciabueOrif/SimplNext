/**
 * Last updated: 2026-04-22
 * Changes: Switched moderation sorting to tri-state multi-filter modes and persisted all filter modes in navigation links.
 * Purpose: Render the posts currently under community review.
 */

import PostCard from "@/app/components/PostCard";
import SortBar from "@/app/components/SortBar";
import {
  DEFAULT_FEED_SORT_STATE,
  getModerationQueue,
  parseViewerLocation,
  resolveFeedSortState,
} from "@/lib/simpl";

export default async function ModerationPage({
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
  const posts = await getModerationQueue(sortState, viewerLocation);
  const navigationParams = new URLSearchParams();

  navigationParams.set("popularity", sortState.popularity ?? DEFAULT_FEED_SORT_STATE.popularity);
  navigationParams.set("date", sortState.date ?? DEFAULT_FEED_SORT_STATE.date);
  navigationParams.set("distance", sortState.distance ?? DEFAULT_FEED_SORT_STATE.distance);

  if (viewerLocation) {
    navigationParams.set("lat", viewerLocation.latitude.toFixed(6));
    navigationParams.set("lng", viewerLocation.longitude.toFixed(6));
  }

  const navigationQuery = navigationParams.toString();

  return (
    <div className="screen-stack">
      <SortBar pathname="/moderation" sortState={sortState} viewerLocation={viewerLocation} />

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