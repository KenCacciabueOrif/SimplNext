/**
 * Last updated: 2026-04-22
 * Changes: Switched moderation sorting to tri-state multi-filter modes and persisted all filter modes in navigation links.
 * Purpose: Render the posts currently under community review.
 */

import { cookies } from "next/headers";
import PostCard from "@/app/components/post/PostCard";
import SortBar from "@/app/components/sort/SortBar";
import { buildNavigationQueryFromState } from "@/lib/navigation";
import { readViewerLocationFromCookies } from "@/lib/viewer-location";
import {
  getModerationQueue,
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
  }>;
}) {
  const { sort, popularity, date, distance } = await searchParams;
  const viewerLocation = readViewerLocationFromCookies(await cookies());
  const sortState = resolveFeedSortState({ date, distance, popularity, sort }, viewerLocation);
  const posts = await getModerationQueue(sortState, viewerLocation);
  const navigationQuery = buildNavigationQueryFromState(sortState, viewerLocation);

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
