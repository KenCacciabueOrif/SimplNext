/**
 * Last updated: 2026-04-24
 * Changes: Reused shared geolocation browser-state helpers to remove duplicated sort/location parsing logic.
 * Purpose: Keep feed/thread back navigation aligned with active distance sorting after returning from comments.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ensureDistanceModeFromPreferences,
  isLocationMarkedActive,
  readSortPreferences,
  readStoredLocationSnapshot,
} from "@/app/components/geolocation/browserState";

type GeoAwareBackLinkProps = {
  fallbackHref: string;
  className?: string;
  children: React.ReactNode;
};

function ensureGeoQuery(pathname: string, params: URLSearchParams) {
  const latitude = params.get("lat");
  const longitude = params.get("lng");

  const preferences = readSortPreferences();

  if (latitude && longitude) {
    ensureDistanceModeFromPreferences(params, preferences);

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
    ensureDistanceModeFromPreferences(params, preferences);
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
