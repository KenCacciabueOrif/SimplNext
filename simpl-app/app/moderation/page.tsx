/**
 * Last updated: 2026-04-21
 * Changes: Added the first moderation queue page backed by PostgreSQL post status and moderation votes.
 * Purpose: Render the posts currently under community review.
 */

import PostCard from "@/app/components/PostCard";
import { getModerationQueue } from "@/lib/simpl";

export default async function ModerationPage() {
  const posts = await getModerationQueue();

  return (
    <div className="view-stack">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Communauté</p>
          <h1 className="page-heading">File de modération</h1>
          <p className="page-subtitle">
            Les posts signalés passent ici. La règle actuelle masque le contenu lorsqu’il reçoit au moins trois votes REMOVE dominants.
          </p>
        </div>
      </section>

      {posts.length === 0 ? (
        <div className="empty-card">
          <h2>Rien à modérer</h2>
          <p>Aucun post n’est actuellement en revue communautaire.</p>
        </div>
      ) : (
        <div className="post-stack">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} threadId={post.id} mode="moderation" />
          ))}
        </div>
      )}
    </div>
  );
}