/**
 * Last updated: 2026-04-24
 * Changes: Added a dedicated feed refresher that syncs URL query params from geolocation updates and forces server re-evaluation.
 * Purpose: Keep SSR sort/location data aligned with client-side geolocation events.
 */

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LOCATION_ACTIVITY_STORAGE_KEY,
  LOCATION_EVENT_NAME,
  LOCATION_STORAGE_KEY,
  SORT_PREFERENCES_STORAGE_KEY,
} from "@/app/components/geolocation/constants";
import type { SortMode, SortPreferencesSnapshot, ViewerLocationSnapshot } from "@/app/components/geolocation/types";

type GeoFeedRefresherProps = {
  request: {
    id: number;
    snapshot: ViewerLocationSnapshot;
  } | null;
};

function normalizeSortMode(value: string | null): SortMode | null {
  if (value === "down" || value === "up" || value === "off") {
    return value;
  }

  return null;
}

function readSortPreferences() {
  const rawValue = localStorage.getItem(SORT_PREFERENCES_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<SortPreferencesSnapshot>;
    const popularity = normalizeSortMode(parsed.popularity ?? null);
    const date = normalizeSortMode(parsed.date ?? null);
    const distance = normalizeSortMode(parsed.distance ?? null);

    if (!popularity || !date || !distance) {
      return null;
    }

    return { popularity, date, distance } satisfies SortPreferencesSnapshot;
  } catch {
    return null;
  }
}

function persistSortPreferencesFromParams(params: URLSearchParams) {
  const popularity = normalizeSortMode(params.get("popularity"));
  const date = normalizeSortMode(params.get("date"));
  const distance = normalizeSortMode(params.get("distance"));

  if (!popularity || !date || !distance) {
    return;
  }

  localStorage.setItem(
    SORT_PREFERENCES_STORAGE_KEY,
    JSON.stringify({ popularity, date, distance } satisfies SortPreferencesSnapshot),
  );
}

export default function GeoFeedRefresher({ request }: GeoFeedRefresherProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!request || typeof window === "undefined") {
      return;
    }

    const { snapshot } = request;
    const currentUrl = new URL(window.location.href);
    const params = currentUrl.searchParams;

    if (snapshot.active && snapshot.latitude !== null && snapshot.longitude !== null) {
      params.set("lat", snapshot.latitude.toFixed(6));
      params.set("lng", snapshot.longitude.toFixed(6));
      params.set("geo", "on");

      const preferences = readSortPreferences();
      const currentDistance = params.get("distance");

      if (!currentDistance) {
        params.set("distance", preferences?.distance ?? "down");
      } else if (currentDistance === "off" && (preferences?.distance === "down" || preferences?.distance === "up")) {
        // Recover from stale URLs carrying distance=off while browser state
        // says geolocation is active and user preference is distance-on.
        params.set("distance", preferences.distance);
      }

      localStorage.setItem(LOCATION_ACTIVITY_STORAGE_KEY, "on");
    } else {
      params.delete("lat");
      params.delete("lng");
      params.set("geo", "off");
      localStorage.setItem(LOCATION_ACTIVITY_STORAGE_KEY, "off");
    }

    persistSortPreferencesFromParams(params);

    const nextQuery = params.toString();
    const nextHref = nextQuery ? `${currentUrl.pathname}?${nextQuery}` : currentUrl.pathname;
    const currentHref = `${currentUrl.pathname}${currentUrl.search}`;

    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(snapshot));
    window.dispatchEvent(new CustomEvent(LOCATION_EVENT_NAME, { detail: snapshot }));

    if (currentHref !== nextHref) {
      window.history.replaceState(window.history.state, "", nextHref);
    }

    router.refresh();
  }, [pathname, request, router]);

  return null;
}
