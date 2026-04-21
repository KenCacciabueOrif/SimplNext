/**
 * Last updated: 2026-04-21
 * Changes: Replaced the demo author-bound form with the Simpl anonymous composer.
 * Purpose: Render the top-level post creation page.
 */

import Link from "next/link";
import PostComposer from "@/app/components/PostComposer";

export default function NewPostPage() {
  return (
    <div className="view-stack">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Publication</p>
          <h1 className="page-heading">Créer un post principal</h1>
          <p className="page-subtitle">
            La V1 conserve un mode anonyme. Le formulaire crée directement un post racine dans le fil.
          </p>
        </div>

        <Link href="/" className="text-link">
          Retour au fil
        </Link>
      </section>

      <PostComposer
        heading="Nouveau post"
        submitLabel="Publier"
        description="Ajoute un titre, un message, puis éventuellement une latitude et longitude si tu veux préparer le tri de proximité."
      />
    </div>
  );
}