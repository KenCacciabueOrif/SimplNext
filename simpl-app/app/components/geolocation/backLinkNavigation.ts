/**
 * Last updated: 2026-04-27
 * Changes: Extracted pure geo-aware back-link query restoration so it can be regression-tested independently of React rendering.
 * Purpose: Build a back-link href that restores geolocation coordinates and distance mode when browser state indicates active location context.
 */

import {
  ensureDistanceModeFromPreferences,
  isLocationMarkedActive,
  readSortPreferences,
  readStoredLocationSnapshot,
} from "@/app/components/geolocation/browserState";

export function ensureGeoQuery(pathname: string, params: URLSearchParams) {
  const latitude = params.get("lat");
  const longitude = params.get("lng");

  const preferences = readSortPreferences();

  if (latitude && longitude) {
    ensureDistanceModeFromPreferences(params, preferences);

    params.set("geo", "on");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const storedSnapshot = readStoredLocationSnapshot();

  if (storedSnapshot?.active && storedSnapshot.latitude !== null && storedSnapshot.longitude !== null) {
    params.set("lat", storedSnapshot.latitude.toFixed(6));
    params.set("lng", storedSnapshot.longitude.toFixed(6));
    params.set("geo", "on");
    ensureDistanceModeFromPreferences(params, preferences);

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  if (!isLocationMarkedActive()) {
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
