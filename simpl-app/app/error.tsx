"use client";

/**
 * Last updated: 2026-04-27
 * Purpose: Root error boundary for the app/ segment. Catches unhandled errors
 *          thrown by Server Components (e.g., Prisma connection failures) and
 *          displays a recovery UI instead of a blank screen.
 *
 *          Must be a Client Component ("use client") — Next.js requirement for
 *          error.tsx files.
 */

import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to an error reporting service in production.
    console.error(error);
  }, [error]);

  return (
    <div className="error-boundary" role="alert">
      <h2>Une erreur est survenue.</h2>
      <p>Quelque chose s&apos;est mal passé lors du chargement de la page.</p>
      <button type="button" className="button" onClick={reset}>
        Réessayer
      </button>
    </div>
  );
}
