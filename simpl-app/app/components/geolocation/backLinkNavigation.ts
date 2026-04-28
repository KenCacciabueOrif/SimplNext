/**
 * Last updated: 2026-04-27
 * Changes: Extracted pure geo-aware back-link query restoration so it can be regression-tested independently of React rendering.
 * Purpose: Build a back-link href that restores geolocation coordinates and distance mode when browser state indicates active location context.
 */

import {
  ensureDistanceModeFromPreferences,
  readSortPreferences,
  readStoredLocationSnapshot,
} from "@/app/components/geolocation/browserState";

export function ensureGeoQuery(pathname: string, params: URLSearchParams) {
  const hasLegacyCoordinates = Boolean(params.get("lat") && params.get("lng"));

  params.delete("lat");
  params.delete("lng");

  if (hasLegacyCoordinates) {
    params.set("geo", "on");
  }

  const preferences = readSortPreferences();

  if (params.get("geo") === "on") {
    ensureDistanceModeFromPreferences(params, preferences);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const storedSnapshot = readStoredLocationSnapshot();

  if (storedSnapshot?.active && storedSnapshot.latitude !== null && storedSnapshot.longitude !== null) {
    params.set("geo", "on");
    ensureDistanceModeFromPreferences(params, preferences);

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}