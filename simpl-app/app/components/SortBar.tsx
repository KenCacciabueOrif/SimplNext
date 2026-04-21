"use client";

/**
 * Last updated: 2026-04-21
 * Changes: Made the distance control functional with browser geolocation and URL-backed sorting state.
 * Purpose: Render the sort controls in the same structural slot as the original Simpl interface.
 */

import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FeedSort, ViewerLocation } from "@/lib/simpl";

type SortBarProps = {
  pathname: "/" | "/moderation";
  sort: FeedSort;
  viewerLocation: ViewerLocation | null;
};

function buildSortHref(pathname: string, currentParams: URLSearchParams, nextSort: FeedSort) {
  const nextParams = new URLSearchParams(currentParams.toString());
  nextParams.set("sort", nextSort);
  const queryString = nextParams.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

export default function SortBar({ pathname, sort, viewerLocation }: SortBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const popularityHref = buildSortHref(pathname, new URLSearchParams(searchParams.toString()), "top");
  const dateHref = buildSortHref(pathname, new URLSearchParams(searchParams.toString()), "new");

  function navigateToDistance(latitude: number, longitude: number) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("sort", "distance");
    nextParams.set("lat", latitude.toFixed(6));
    nextParams.set("lng", longitude.toFixed(6));

    startTransition(() => {
      router.push(`${pathname}?${nextParams.toString()}`);
    });
  }

  function handleDistanceClick() {
    setDistanceError(null);

    if (viewerLocation) {
      navigateToDistance(viewerLocation.latitude, viewerLocation.longitude);
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
        navigateToDistance(position.coords.latitude, position.coords.longitude);
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
        <Link href={popularityHref} className={sort === "top" ? "is-active" : undefined}>
          Popularity ↓
        </Link>
        <Link href={dateHref} className={sort === "new" ? "is-active" : undefined}>
          Date ↓
        </Link>
        <button
          type="button"
          className={sort === "distance" ? "is-active" : undefined}
          onClick={handleDistanceClick}
          disabled={isLocating}
        >
          {isLocating ? "Distance..." : "Distance ↓"}
        </button>
      </div>

      {distanceError ? <p className="sort-feedback">{distanceError}</p> : null}
    </>
  );
}