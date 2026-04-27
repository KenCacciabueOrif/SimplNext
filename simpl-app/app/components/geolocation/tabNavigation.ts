/**
 * Last updated: 2026-04-27
 * Changes: Added Home-tab navigation query restoration with geolocation-aware fallback so tab clicks keep active distance context.
 * Purpose: Build Home tab href values that preserve sort and geolocation state across deep navigation.
 */

import { ensureGeoQuery } from "@/app/components/geolocation/backLinkNavigation";
import { normalizeSortMode } from "@/app/components/geolocation/browserState";

function parseCoordinate(value: string | null, min: number, max: number): string | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed.toFixed(6);
}

export function buildHomeTabHref(rawQuery: string) {
  const input = new URLSearchParams(rawQuery);
  const output = new URLSearchParams();

  const popularity = normalizeSortMode(input.get("popularity"));
  const date = normalizeSortMode(input.get("date"));
  const distance = normalizeSortMode(input.get("distance"));

  if (popularity) output.set("popularity", popularity);
  if (date) output.set("date", date);
  if (distance) output.set("distance", distance);

  const latitude = parseCoordinate(input.get("lat"), -90, 90);
  const longitude = parseCoordinate(input.get("lng"), -180, 180);

  if (latitude && longitude) {
    output.set("lat", latitude);
    output.set("lng", longitude);
  }

  const geo = input.get("geo");
  if (geo === "on" || geo === "off") {
    output.set("geo", geo);
  }

  return ensureGeoQuery("/", output);
}
