"use client";

/**
 * Last updated: 2026-04-27
 * Purpose: Custom React hook that encapsulates all geolocation + sort state logic
 *          for SortBar.tsx. Owns the permissionState listener, GPS acquisition,
 *          localStorage snapshot persistence, and router navigation.
 *
 * Extracted from SortBar.tsx to reduce that component from ~235 to ~80 lines
 * and to make the geo-acquisition logic independently testable.
 */

import { startTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FeedSortState, SortMode, ViewerLocation } from "@/lib/types";
import {
  PERMISSION_STATE_EVENT_NAME,
  SORT_PREFERENCES_STORAGE_KEY,
} from "@/app/components/geolocation/constants";
import type { PermissionStateValue } from "@/app/components/geolocation/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UseGeoSortProps = {
  pathname: string;
  sortState: FeedSortState;
  viewerLocation: ViewerLocation | null;
};

export type UseGeoSortResult = {
  distanceError: string | null;
  isLocating: boolean;
  permissionState: PermissionStateValue;
  handleToggle: (filter: keyof FeedSortState) => void;
  requestLocationFromUserAction: () => void;
};

// ---------------------------------------------------------------------------
// Internal helpers (not exported — only used by this hook)
// ---------------------------------------------------------------------------

function cycleSortMode(mode: SortMode): SortMode {
  if (mode === "down") return "up";
  if (mode === "up") return "off";
  return "down";
}

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
// Hook
// ---------------------------------------------------------------------------

export function useGeoSort({
  pathname,
  sortState,
  viewerLocation,
}: UseGeoSortProps): UseGeoSortResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionStateValue>("unknown");

  // Listen for permission-state changes broadcast by the geolocation watcher.
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

  // Navigate to a new URL reflecting the updated sort state and optionally a
  // fresh viewer location. Also persists sort preferences to localStorage.
  function navigateToSortState(
    nextSortState: FeedSortState,
    latitude?: number,
    longitude?: number,
  ) {
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
    const nextSortState: FeedSortState = { ...sortState, [filter]: nextMode };

    // Non-distance toggles and disabling distance never need GPS.
    if (filter !== "distance" || nextMode === "off") {
      navigateToSortState(nextSortState);
      return;
    }

    // Distance toggle ON — use cached location if available.
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
          setDistanceError(
            "Géolocalisation refusée. Active-la dans les paramètres du navigateur.",
          );
          return;
        }
        setDistanceError("Autorisation en attente ou position indisponible. Réessaie.");
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 12_000 },
    );
  }

  return {
    distanceError,
    isLocating,
    permissionState,
    handleToggle,
    requestLocationFromUserAction,
  };
}
