/**
 * Last updated: 2026-04-27
 * Purpose: Re-emits the last known location snapshot on every route transition so
 *   GeoFeedRefresher can reconcile URL + SSR state even without a fresh GPS callback.
 */

"use client";

import { useEffect } from "react";
import type { ViewerLocationSnapshot } from "@/app/components/geolocation/types";

export function useGeoRouteRefresh(
  pathname: string,
  locationSnapshot: ViewerLocationSnapshot | null,
  requestRefresh: (snapshot: ViewerLocationSnapshot) => void,
): void {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Route transitions can land on stale query params (e.g. back from thread).
    // Re-emit the latest known snapshot so GeoFeedRefresher can reconcile URL +
    // SSR state even when no fresh geolocation callback fired yet.
    if (locationSnapshot) {
      requestRefresh({
        ...locationSnapshot,
        updatedAt: Date.now(),
      });
    }
  }, [pathname, locationSnapshot, requestRefresh]);
}
