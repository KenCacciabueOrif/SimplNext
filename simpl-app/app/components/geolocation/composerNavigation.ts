/**
 * Last updated: 2026-04-28
 * Changes: Stopped forcing geo=off when coordinates are temporarily unavailable so active distance context does not regress during post/reply submit flows.
 * Purpose: Build a sanitized navigation query for composer submissions using URL state + optional live geolocation snapshot.
 */

import {
  normalizeSortMode,
} from "@/app/components/geolocation/browserState";
import type { ViewerLocationSnapshot } from "@/app/components/geolocation/types";

export function buildComposerNavigationQuery(
  inputQuery: string,
  locationSnapshot: ViewerLocationSnapshot | null,
) {
  const merged = new URLSearchParams(inputQuery);

  const popularity = normalizeSortMode(merged.get("popularity"));
  const date = normalizeSortMode(merged.get("date"));
  const distance = normalizeSortMode(merged.get("distance"));

  if (popularity) {
    merged.set("popularity", popularity);
  } else {
    merged.delete("popularity");
  }

  if (date) {
    merged.set("date", date);
  } else {
    merged.delete("date");
  }

  const hasQueryCoordinates = Boolean(merged.get("lat") && merged.get("lng"));

  if (locationSnapshot?.active && locationSnapshot.latitude !== null && locationSnapshot.longitude !== null) {
    merged.set("lat", locationSnapshot.latitude.toFixed(6));
    merged.set("lng", locationSnapshot.longitude.toFixed(6));
    merged.set("geo", "on");

    if (!distance) {
      merged.set("distance", "down");
    }
  } else if (hasQueryCoordinates) {
    // Keep incoming navigation coordinates when the snapshot has not loaded yet.
    if (merged.get("geo") !== "off") {
      merged.set("geo", "on");
    }

    if (!distance) {
      merged.set("distance", "down");
    }
  } else {
    merged.delete("lat");
    merged.delete("lng");
  }

  const normalizedDistance = normalizeSortMode(merged.get("distance"));

  if (normalizedDistance) {
    merged.set("distance", normalizedDistance);
  } else {
    merged.delete("distance");
  }

  return merged.toString();
}
