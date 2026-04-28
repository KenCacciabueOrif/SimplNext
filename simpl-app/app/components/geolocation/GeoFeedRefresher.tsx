/**
 * Last updated: 2026-04-24
 * Changes: Reused shared browser-state helpers for sort parsing and distance-mode recovery to remove duplicated logic.
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
  VIEWER_LOCATION_COOKIE_KEY,
  VIEWER_LOCATION_COOKIE_MAX_AGE_SECONDS,
} from "@/app/components/geolocation/constants";
import {
  ensureDistanceModeFromPreferences,
  normalizeSortMode,
  readSortPreferences,
} from "@/app/components/geolocation/browserState";
import type { SortPreferencesSnapshot, ViewerLocationSnapshot } from "@/app/components/geolocation/types";

type GeoFeedRefresherProps = {
  request: {
    id: number;
    snapshot: ViewerLocationSnapshot;
  } | null;
};

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
    params.delete("lat");
    params.delete("lng");

    if (snapshot.active && snapshot.latitude !== null && snapshot.longitude !== null) {
      params.set("geo", "on");

      const preferences = readSortPreferences();

      // Recover from stale URLs carrying distance=off while browser state says
      // geolocation is active and user preference is distance-on.
      ensureDistanceModeFromPreferences(params, preferences);

      localStorage.setItem(LOCATION_ACTIVITY_STORAGE_KEY, "on");
      document.cookie = `${VIEWER_LOCATION_COOKIE_KEY}=${snapshot.latitude.toFixed(6)}:${snapshot.longitude.toFixed(6)}; Max-Age=${VIEWER_LOCATION_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
    } else {
      params.set("geo", "off");
      localStorage.setItem(LOCATION_ACTIVITY_STORAGE_KEY, "off");
      document.cookie = `${VIEWER_LOCATION_COOKIE_KEY}=; Max-Age=0; Path=/; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
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
