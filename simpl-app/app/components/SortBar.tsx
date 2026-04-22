"use client";

/**
 * Last updated: 2026-04-22
 * Changes: Replaced single-sort controls with tri-state filter toggles (down/up/off) for popularity, date, and distance.
 * Purpose: Render the sort controls in the same structural slot as the original Simpl interface.
 */

import { startTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FeedSortState, SortMode, ViewerLocation } from "@/lib/simpl";

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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        navigateToSortState(nextSortState, position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setIsLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          setDistanceError("Autorise la géolocalisation pour activer le tri par distance.");
          return;
        }

        setDistanceError("Impossible de récupérer la position actuelle.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 10_000,
      },
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

      {distanceError ? <p className="sort-feedback">{distanceError}</p> : null}
    </>
  );
}