/**
 * Last updated: 2026-04-28
 * Changes: No changes — initial extraction from inline cookie reads across
 *          server components; centralises ViewerLocation cookie parsing behind
 *          the CookieReader interface for testability.
 * Purpose: Server-side helper that reads and validates the viewer location
 *          cookie, returning a typed ViewerLocation or null if absent/invalid.
 */

import type { ViewerLocation } from "@/lib/types";
import { VIEWER_LOCATION_COOKIE_KEY } from "@/app/components/geolocation/constants";

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

function parseCoordinate(value: string, min: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

function parseLocationCookie(rawCookie: string | undefined): ViewerLocation | null {
  if (!rawCookie) {
    return null;
  }

  const [rawLatitude, rawLongitude] = rawCookie.split(":");

  if (!rawLatitude || !rawLongitude) {
    return null;
  }

  const latitude = parseCoordinate(rawLatitude, -90, 90);
  const longitude = parseCoordinate(rawLongitude, -180, 180);

  if (latitude === null || longitude === null) {
    return null;
  }

  return { latitude, longitude };
}

export function readViewerLocationFromCookies(cookieStore: CookieReader): ViewerLocation | null {
  return parseLocationCookie(cookieStore.get(VIEWER_LOCATION_COOKIE_KEY)?.value);
}
