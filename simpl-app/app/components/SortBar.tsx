"use client";

/**
 * Last updated: 2026-04-27
 * Changes: Extracted all geolocation + sort logic into useGeoSort hook
 *          (app/components/geolocation/useGeoSort.ts). SortBar is now a
 *          pure presentation component that delegates state to the hook.
 * Purpose: Render the sort controls in the same structural slot as the
 *          original Simpl interface.
 */

import type { FeedSortState, SortMode, ViewerLocation } from "@/lib/types";
import { useGeoSort } from "@/app/components/geolocation/useGeoSort";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortBarProps = {
  pathname: string;
  sortState: FeedSortState;
  viewerLocation: ViewerLocation | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getModeIndicator(mode: SortMode) {
  if (mode === "down") return "↓";
  if (mode === "up") return "↑";
  return "=";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SortBar({ pathname, sortState, viewerLocation }: SortBarProps) {
  const { distanceError, isLocating, permissionState, handleToggle, requestLocationFromUserAction } =
    useGeoSort({ pathname, sortState, viewerLocation });

  return (
    <>
      <div className="legacy-sortbar" aria-label="Sort controls">
        <button
          type="button"
          className={sortState.popularity !== "off" ? "is-active" : undefined}
          onClick={() => handleToggle("popularity")}
        >
          Popularity {getModeIndicator(sortState.popularity)}
        </button>
        <button
          type="button"
          className={sortState.date !== "off" ? "is-active" : undefined}
          onClick={() => handleToggle("date")}
        >
          Date {getModeIndicator(sortState.date)}
        </button>
        <button
          type="button"
          className={sortState.distance !== "off" ? "is-active" : undefined}
          onClick={() => handleToggle("distance")}
          disabled={isLocating}
        >
          {isLocating ? "Distance..." : `Distance ${getModeIndicator(sortState.distance)}`}
        </button>
      </div>

      {permissionState !== "granted" && !viewerLocation ? (
        <div className="sort-feedback" role="status" aria-live="polite">
          <p>
            {permissionState === "denied"
              ? "Géolocalisation refusée. Tu peux relancer la demande après avoir ajusté les paramètres navigateur."
              : "Géolocalisation non active. Demande l&apos;autorisation pour activer le tri par distance."}
          </p>
          <button
            type="button"
            className="button"
            onClick={requestLocationFromUserAction}
            disabled={isLocating}
          >
            {isLocating ? "Demande GPS..." : "Activer la géolocalisation"}
          </button>
        </div>
      ) : null}

      {distanceError ? <p className="sort-feedback">{distanceError}</p> : null}
    </>
  );
}
