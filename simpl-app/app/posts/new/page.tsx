/**
 * Last updated: 2026-04-21
 * Changes: Reworked the creation page to use the same stark black-and-white panel structure as the original Simpl create view.
 * Purpose: Render the top-level post creation page.
 */

import Link from "next/link";
import PostComposer from "@/app/components/PostComposer";

export default function NewPostPage() {
  return (
    <div className="screen-stack">
      <div className="thread-bar">
        <Link href="/" className="thread-bar-link">
          Retour au fil
        </Link>
        <span className="thread-bar-title">Nouveau post</span>
      </div>

      <PostComposer
        heading="Nouveau post"
        submitLabel="Publier"
        description="Ajoute un titre, un message, puis éventuellement une latitude et longitude pour préparer le tri de proximité."
      />
    </div>
  );
}