/**
 * Last updated: 2026-04-22
 * Changes: Added a collapsible thread reply composer that starts hidden and now documents automatic coordinate capture for replies.
 * Purpose: Keep the reply form accessible on thread pages while preserving maximum space for comment scrolling.
 */

"use client";

import { useState } from "react";
import PostComposer from "@/app/components/composer/PostComposer";

type ThreadReplyComposerProps = {
  parentId: string;
};

export default function ThreadReplyComposer({ parentId }: ThreadReplyComposerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id="reply-form" className={`reply-form-shell${isOpen ? " is-open" : ""}`}>
      <button
        type="button"
        className="reply-toggle-button"
        onClick={() => setIsOpen((currentState) => !currentState)}
        aria-expanded={isOpen}
        aria-controls="thread-reply-composer-panel"
      >
        {isOpen ? "-" : "+"}
      </button>

      {isOpen ? (
        <div id="thread-reply-composer-panel" className="reply-form-panel">
          <PostComposer
            heading="Nouveau commentaire"
            submitLabel="+"
            description="Chaque réponse devient un nouveau post relié à cet élément, avec coordonnées automatiques si la localisation est active."
            parentId={parentId}
          />
        </div>
      ) : null}
    </div>
  );
}

