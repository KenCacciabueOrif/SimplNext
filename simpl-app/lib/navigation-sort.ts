/**
 * Last updated: 2026-04-27
 * Purpose: Viewer-location parsing and feed-sort-state resolution from URL search params.
 *   Owns the canonical DEFAULT_FEED_SORT_STATE and the parseSortModeValue helper that
 *   validates raw query-string values against the SortMode union.
 */

import type { FeedSortState, SortMode, ViewerLocation } from "@/lib/types";

// ---------------------------------------------------------------------------
// Sort-mode parsing
// ---------------------------------------------------------------------------

export function parseSortModeValue(value: string | null): SortMode | null {
  if (value === "down" || value === "up" || value === "off") {
    return value;
  }

  return null;
}

function parseSortMode(input?: string): SortMode {
  if (input === "down" || input === "up" || input === "off") {
    return input;
  }

  return "off";
}

// ---------------------------------------------------------------------------
// Viewer location parsing
// ---------------------------------------------------------------------------

/**
 * Parse and validate latitude/longitude URL search-param strings into a
 * ViewerLocation object.  Returns null when either value is missing, non-
 * numeric, or outside geographic bounds.
 */
export function parseViewerLocation(latitude?: string, longitude?: string): ViewerLocation | null {
  if (!latitude || !longitude) {
    return null;
  }

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
    return null;
  }

  if (
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return null;
  }

  return { latitude: parsedLatitude, longitude: parsedLongitude };
}

// ---------------------------------------------------------------------------
// Feed sort-state resolution
// ---------------------------------------------------------------------------

/**
 * Default tri-state sort configuration applied on first load (no URL params).
 * All three filters start in "down" (most-popular / newest / closest first).
 */
export const DEFAULT_FEED_SORT_STATE: FeedSortState = {
  popularity: "down",
  date: "down",
  distance: "down",
};

/**
 * Derive a FeedSortState from URL search params and optional viewer location.
 * Handles backward compatibility with the legacy single-sort `?sort=` param.
 * Drops distance automatically when no viewer location is available.
 */
export function resolveFeedSortState(
  input: {
    popularity?: string;
    date?: string;
    distance?: string;
    sort?: string;
  },
  viewerLocation?: ViewerLocation | null,
): FeedSortState {
  const sortState: FeedSortState = {
    popularity: parseSortMode(input.popularity),
    date: parseSortMode(input.date),
    distance: parseSortMode(input.distance),
  };

  // Backward compatibility with the previous single-sort query parameter.
  if (!input.popularity && !input.date && !input.distance) {
    if (input.sort === "top") {
      sortState.popularity = "down";
      sortState.date = "off";
      sortState.distance = "off";
    } else if (input.sort === "distance") {
      sortState.popularity = "off";
      sortState.date = "off";
      sortState.distance = "down";
    } else if (!input.sort) {
      // First load with no params: apply defaults, then reconcile location below.
      sortState.popularity = DEFAULT_FEED_SORT_STATE.popularity;
      sortState.date = DEFAULT_FEED_SORT_STATE.date;
      sortState.distance = DEFAULT_FEED_SORT_STATE.distance;
    } else {
      sortState.popularity = "off";
      sortState.date = "down";
      sortState.distance = "off";
    }
  }

  // Distance requires a known viewer location; drop it silently if unavailable.
  if (!viewerLocation) {
    sortState.distance = "off";
  } else if (!input.distance && sortState.distance === "off") {
    // Keep explicit distance=off, but when the parameter is absent and GPS is
    // available, apply the default distance mode automatically.
    sortState.distance = DEFAULT_FEED_SORT_STATE.distance;
  }

  return sortState;
}
