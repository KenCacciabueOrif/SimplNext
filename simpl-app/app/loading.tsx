/**
 * Last updated: 2026-04-27
 * Purpose: Root loading skeleton served by Next.js while any async Server
 *          Component in the app/ segment is streaming. Prevents a blank screen
 *          during Prisma fetches or slow RSC resolution.
 */

export default function Loading() {
  return (
    <div className="loading-skeleton" role="status" aria-label="Chargement…">
      <p className="loading-skeleton__label">Chargement…</p>
    </div>
  );
}
