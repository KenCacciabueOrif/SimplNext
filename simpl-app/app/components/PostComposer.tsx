/**
 * Last updated: 2026-04-21
 * Changes: Reworked the composer markup so the form reads like the original Simpl creation panel.
 * Purpose: Render the create form shared by the new post page and thread reply flow.
 */

import { createPostAction } from "@/app/actions";

type PostComposerProps = {
  heading: string;
  submitLabel: string;
  description: string;
  parentId?: string;
};

export default function PostComposer({
  heading,
  submitLabel,
  description,
  parentId,
}: PostComposerProps) {
  return (
    <section className="composer-card">
      <div className="panel-title">
        <h2>{heading}</h2>
        <p>{description}</p>
      </div>

      <form action={createPostAction}>
        {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}

        <label className="field">
          <span>Titre</span>
          <input name="title" placeholder="Résume l’idée principale" required type="text" />
        </label>

        <label className="field">
          <span>Message</span>
          <textarea
            name="body"
            placeholder="Décris le sujet, le besoin ou la proposition."
            required
          />
        </label>

        <div className="field-grid">
          <label className="field">
            <span>Latitude</span>
            <input name="latitude" placeholder="46.5197" step="any" type="number" />
          </label>

          <label className="field">
            <span>Longitude</span>
            <input name="longitude" placeholder="6.6323" step="any" type="number" />
          </label>
        </div>

        <div className="button-row">
          <button className="button" type="submit">
            {submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}