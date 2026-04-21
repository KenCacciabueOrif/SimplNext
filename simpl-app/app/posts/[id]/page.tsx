/**
 * Last updated: 2026-04-21
 * Changes: Replaced the demo detail page with a Simpl thread view showing one main post and its direct replies.
 * Purpose: Render a thread page for a selected post or comment.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "@/app/components/PostCard";
import PostComposer from "@/app/components/PostComposer";
import { getThreadPageData, type PostListItem } from "@/lib/simpl";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const threadData = await getThreadPageData(id);

  if (!threadData) {
    notFound();
  }

  const { post, replies }: { post: PostListItem; replies: PostListItem[] } = threadData;

  return (
    <div className="view-stack">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Thread</p>
          <h1 className="page-heading">{post.title}</h1>
          <p className="page-subtitle">
            Les commentaires sont eux-mêmes des posts. Cette première itération affiche les réponses directes de l’élément courant.
          </p>
        </div>

        <div className="inline-actions">
          <Link href="/" className="text-link">
            Retour au fil
          </Link>
          {post.parentId ? (
            <Link href={`/posts/${post.parentId}`} className="text-link">
              Revenir au parent
            </Link>
          ) : null}
        </div>
      </section>

      <PostCard post={post} threadId={post.id} mode="thread-main" />

      <PostComposer
        heading="Répondre à ce post"
        submitLabel="Publier la réponse"
        description="Chaque réponse devient un nouveau post relié à ce thread."
        parentId={post.id}
      />

      <section className="view-stack">
        <div className="section-heading">
          <div>
            <h2 className="page-heading">Réponses directes</h2>
            <p className="page-subtitle">
              {replies.length} réponse{replies.length > 1 ? "s" : ""} pour cet élément.
            </p>
          </div>
        </div>

        {replies.length === 0 ? (
          <div className="empty-card">
            <h2>Pas encore de réponse</h2>
            <p>Utilise le formulaire ci-dessus pour démarrer la discussion.</p>
          </div>
        ) : (
          <div className="post-stack">
            {replies.map((reply: PostListItem) => (
              <PostCard key={reply.id} post={reply} threadId={post.id} mode="thread" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}