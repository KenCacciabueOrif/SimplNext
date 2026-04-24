/**
 * Last updated: 2026-04-24
 * Changes: Added a client-side back link that restores geolocation query parameters from browser state when missing.
 * Purpose: Keep feed/thread back navigation aligned with active distance sorting after returning from comments.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  LOCATION_ACTIVITY_STORAGE_KEY,
  LOCATION_STORAGE_KEY,
  SORT_PREFERENCES_STORAGE_KEY,
} from "@/app/components/geolocation/constants";

type GeoAwareBackLinkProps = {
  fallbackHref: string;
  className?: string;
  children: React.ReactNode;
};

type ViewerLocationSnapshot = {
  active: boolean;
  latitude: number | null;
  longitude: number | null;
  updatedAt: number;
};

type SortMode = "down" | "up" | "off";

type SortPreferencesSnapshot = {
  popularity: SortMode;
  date: SortMode;
  distance: SortMode;
};

function readStoredLocationSnapshot() {
  const rawValue = localStorage.getItem(LOCATION_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<ViewerLocationSnapshot>;

    if (
      typeof parsed.active !== "boolean" ||
      typeof parsed.updatedAt !== "number" ||
      (parsed.latitude !== null && typeof parsed.latitude !== "number") ||
      (parsed.longitude !== null && typeof parsed.longitude !== "number")
    ) {
      return null;
    }

    return {
      active: parsed.active,
      latitude: parsed.latitude ?? null,
      longitude: parsed.longitude ?? null,
      updatedAt: parsed.updatedAt,
    } satisfies ViewerLocationSnapshot;
  } catch {
    return null;
  }
}

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

function isLocationMarkedActive() {
  return localStorage.getItem(LOCATION_ACTIVITY_STORAGE_KEY) === "on";
}

function ensureGeoQuery(pathname: string, params: URLSearchParams) {
  const latitude = params.get("lat");
  const longitude = params.get("lng");

  const preferences = readSortPreferences();

  if (latitude && longitude) {
    const currentDistance = params.get("distance");

    if (!currentDistance) {
      params.set("distance", preferences?.distance ?? "down");
    } else if (currentDistance === "off" && (preferences?.distance === "down" || preferences?.distance === "up")) {
      params.set("distance", preferences.distance);
    }

    params.set("geo", "on");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  if (!isLocationMarkedActive()) {
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const storedSnapshot = readStoredLocationSnapshot();

  if (storedSnapshot?.active && storedSnapshot.latitude !== null && storedSnapshot.longitude !== null) {
    params.set("lat", storedSnapshot.latitude.toFixed(6));
    params.set("lng", storedSnapshot.longitude.toFixed(6));
    params.set("geo", "on");

    const currentDistance = params.get("distance");

    if (!currentDistance) {
      params.set("distance", preferences?.distance ?? "down");
    } else if (currentDistance === "off" && (preferences?.distance === "down" || preferences?.distance === "up")) {
      params.set("distance", preferences.distance);
    }
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default function GeoAwareBackLink({ fallbackHref, className, children }: GeoAwareBackLinkProps) {
  const searchParams = useSearchParams();
  const [href, setHref] = useState(fallbackHref);

  useEffect(() => {
    const parsedFallback = new URL(fallbackHref, window.location.origin);
    const mergedParams = new URLSearchParams(parsedFallback.search);

    // Keep explicit query context from the current URL whenever available.
    for (const [key, value] of searchParams.entries()) {
      mergedParams.set(key, value);
    }

    setHref(ensureGeoQuery(parsedFallback.pathname, mergedParams));
  }, [fallbackHref, searchParams]);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
