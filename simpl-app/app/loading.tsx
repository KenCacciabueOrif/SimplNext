/**
 * Last updated: 2026-04-27
 * Changes: Phase D — replaced plain text with visual skeleton post-cards to give
 *          immediate feedback during Prisma/RSC streaming instead of a blank screen.
 * Purpose: Root loading skeleton served by Next.js while async Server Components
 *          resolve. Three placeholder cards mimic the post-card structure so the
 *          layout shift on hydration is minimal.
 */

export default function Loading() {
  return (
    <div className="loading-skeleton" role="status" aria-label="Chargement…">
      {[0, 1, 2].map((i) => (
        <div key={i} className="loading-skeleton-card">
          <div className="loading-skeleton-bar loading-skeleton-bar--meta" />
          <div className="loading-skeleton-bar loading-skeleton-bar--title" />
          <div className="loading-skeleton-bar loading-skeleton-bar--body" />
        </div>
      ))}
      <p className="loading-skeleton__label">Chargement…</p>
    </div>
  );
}
