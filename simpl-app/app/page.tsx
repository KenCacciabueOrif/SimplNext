/**
 * Last updated: 2026-04-21
 * Changes: Replaced the demo home page with the Simpl feed, sort controls, and top-level post cards.
 * Purpose: Render the main feed for root posts.
 */

import Link from "next/link";
import PostCard from "@/app/components/PostCard";
import { getFeedPosts, resolveFeedSort, type PostListItem } from "@/lib/simpl";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: sortParam } = await searchParams;
  const sort = resolveFeedSort(sortParam);
  const posts = await getFeedPosts(sort);

  return (
    <div className="view-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Fil principal</p>
          <h1>Posts locaux, discussions arborescentes, modération communautaire.</h1>
          <p>
            Cette première implémentation pose la base PostgreSQL pour le fil,
            les réactions, les réponses et la file de modération.
          </p>
        </div>

        <div className="hero-actions">
          <Link href="/posts/new" className="button">
            Nouveau post
          </Link>
          <Link href="/moderation" className="button-secondary">
            Voir la modération
          </Link>
        </div>
      </section>

      <section className="view-stack">
        <div className="section-heading">
          <div>
            <h2 className="page-heading">Fil</h2>
            <p className="page-subtitle">
              Le tri par distance est prévu ensuite. Le socle feed/thread/modération est maintenant câblé.
            </p>
          </div>

          <div className="sort-tabs">
            <Link href="/?sort=new" className={sort === "new" ? "is-active" : undefined}>
              Plus récents
            </Link>
            <Link href="/?sort=top" className={sort === "top" ? "is-active" : undefined}>
              Plus appréciés
            </Link>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="empty-card">
            <h2>Aucun post disponible</h2>
            <p>Ajoute un premier contenu pour initialiser le fil principal.</p>
          </div>
        ) : (
          <div className="post-stack">
            {posts.map((post: PostListItem) => (
              <PostCard key={post.id} post={post} threadId={post.id} mode="feed" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}