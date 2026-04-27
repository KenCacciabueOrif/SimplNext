"use client";

/**
 * Last updated: 2026-04-27
 * Changes: Extracted duplicated navigator.geolocation.getCurrentPosition call into a module-level requestCurrentPosition helper to eliminate repeated options objects.
 * Purpose: Render the sort controls in the same structural slot as the original Simpl interface.
 */

import { startTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FeedSortState, SortMode, ViewerLocation } from "@/lib/simpl";
import {
  PERMISSION_STATE_EVENT_NAME,
  SORT_PREFERENCES_STORAGE_KEY,
} from "@/app/components/geolocation/constants";
import type { PermissionStateValue } from "@/app/components/geolocation/types";

// ---------------------------------------------------------------------------
// Geolocation helper
// ---------------------------------------------------------------------------

function requestCurrentPosition(
  onSuccess: (lat: number, lng: number) => void,
  onError: (error: GeolocationPositionError) => void,
  options: PositionOptions,
) {
  navigator.geolocation.getCurrentPosition(
    (position) => onSuccess(position.coords.latitude, position.coords.longitude),
    onError,
    options,
  );
}

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

type SortBarProps = {
  pathname: string;
  sortState: FeedSortState;
  viewerLocation: ViewerLocation | null;
};

function cycleSortMode(mode: SortMode): SortMode {
  if (mode === "down") {
    return "up";
  }

  if (mode === "up") {
    return "off";
  }

  return "down";
}

function getModeIndicator(mode: SortMode) {
  if (mode === "down") {
    return "↓";
  }

  if (mode === "up") {
    return "↑";
  }

  return "=";
}

export default function SortBar({ pathname, sortState, viewerLocation }: SortBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionStateValue>("unknown");

  useEffect(() => {
    function handlePermissionStateUpdate(event: Event) {
      const customEvent = event as CustomEvent<PermissionStateValue>;
      setPermissionState(customEvent.detail ?? "unknown");
    }

    window.addEventListener(PERMISSION_STATE_EVENT_NAME, handlePermissionStateUpdate);

    return () => {
      window.removeEventListener(PERMISSION_STATE_EVENT_NAME, handlePermissionStateUpdate);
    };
  }, []);

  function requestLocationFromUserAction() {
    if (!("geolocation" in navigator)) {
      setDistanceError("La géolocalisation n'est pas disponible dans ce navigateur.");
      return;
    }

    setDistanceError(null);
    setIsLocating(true);

    requestCurrentPosition(
      (lat, lng) => {
        setIsLocating(false);

        const nextSortState: FeedSortState = {
          ...sortState,
          distance: sortState.distance === "off" ? "down" : sortState.distance,
        };

        navigateToSortState(nextSortState, lat, lng);
      },
      (error) => {
        setIsLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          setDistanceError("Géolocalisation refusée. Active-la dans les paramètres du navigateur.");
          return;
        }

        setDistanceError("Autorisation en attente ou position indisponible. Réessaie.");
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 12_000 },
    );
  }

  function navigateToSortState(nextSortState: FeedSortState, latitude?: number, longitude?: number) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("sort");
    nextParams.set("popularity", nextSortState.popularity);
    nextParams.set("date", nextSortState.date);
    nextParams.set("distance", nextSortState.distance);

    if (typeof latitude === "number" && typeof longitude === "number") {
      nextParams.set("lat", latitude.toFixed(6));
      nextParams.set("lng", longitude.toFixed(6));
    }

    localStorage.setItem(SORT_PREFERENCES_STORAGE_KEY, JSON.stringify(nextSortState));

    startTransition(() => {
      router.push(`${pathname}?${nextParams.toString()}`);
    });
  }

  function handleToggle(filter: keyof FeedSortState) {
    setDistanceError(null);
    const nextMode = cycleSortMode(sortState[filter]);
    const nextSortState: FeedSortState = {
      ...sortState,
      [filter]: nextMode,
    };

    if (filter !== "distance" || nextMode === "off") {
      navigateToSortState(nextSortState);
      return;
    }

    if (viewerLocation) {
      navigateToSortState(nextSortState, viewerLocation.latitude, viewerLocation.longitude);
      return;
    }

    if (!("geolocation" in navigator)) {
      setDistanceError("La géolocalisation n'est pas disponible dans ce navigateur.");
      return;
    }

    setIsLocating(true);

    requestCurrentPosition(
      (lat, lng) => {
        setIsLocating(false);
        navigateToSortState(nextSortState, lat, lng);
      },
      (error) => {
        setIsLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          setDistanceError("Autorise la géolocalisation pour activer le tri par distance.");
          return;
        }

        setDistanceError("Impossible de récupérer la position actuelle.");
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  }

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
          <button type="button" className="button" onClick={requestLocationFromUserAction} disabled={isLocating}>
            {isLocating ? "Demande GPS..." : "Activer la géolocalisation"}
          </button>
        </div>
      ) : null}

      {distanceError ? <p className="sort-feedback">{distanceError}</p> : null}
    </>
  );
}