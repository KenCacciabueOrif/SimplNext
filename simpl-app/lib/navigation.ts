/**
 * Last updated: 2026-04-27
 * Changes: Added parseViewerLocation, resolveFeedSortState, DEFAULT_FEED_SORT_STATE
 *          (moved from lib/simpl.ts — these are URL/query-string utilities, not data
 *          access concerns). Added buildNavigationQueryFromState for shared page use.
 * Purpose: Build and compose query strings for post/reply redirect targets, keeping
 *          sort mode and geolocation context across navigation. Also owns viewer-location
 *          parsing and feed-sort-state resolution from URL search params.
 */

import type { FeedSortState, SortMode, ViewerLocation } from "@/lib/types";

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

export function parseSortModeValue(value: string | null): SortMode | null {
  if (value === "down" || value === "up" || value === "off") {
    return value;
  }

  return null;
}

function parseCoordinate(value: string | null, min: number, max: number): number | null {
  if (!value) return null;

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;

  return parsed;
}

// ---------------------------------------------------------------------------
// Navigation query builder
// ---------------------------------------------------------------------------

/**
 * Sanitizes and rebuilds a navigation query string from form input.
 * Only allow-listed parameters (sort modes, coordinates, geo flag) are passed through.
 * Coordinates are validated against geographic bounds before inclusion.
 * When coordinates are present but no explicit distance mode was provided, distance
 * is defaulted to "down" so the redirect target renders with distance sorting active.
 */
export function buildNavigationQuery(rawNavigationQuery: FormDataEntryValue | null) {
  if (typeof rawNavigationQuery !== "string" || rawNavigationQuery.trim() === "") {
    return "";
  }

  const input = new URLSearchParams(rawNavigationQuery);
  const output = new URLSearchParams();

  const popularity = parseSortModeValue(input.get("popularity"));
  const date = parseSortModeValue(input.get("date"));
  const distance = parseSortModeValue(input.get("distance"));

  if (popularity) output.set("popularity", popularity);
  if (date) output.set("date", date);
  if (distance) output.set("distance", distance);

  const latitude = parseCoordinate(input.get("lat"), -90, 90);
  const longitude = parseCoordinate(input.get("lng"), -180, 180);

  if (latitude !== null && longitude !== null) {
    output.set("lat", latitude.toFixed(6));
    output.set("lng", longitude.toFixed(6));

    if (!distance) {
      output.set("distance", "down");
    }
  }

  const geo = input.get("geo");
  if (geo === "on" || geo === "off") output.set("geo", geo);

  return output.toString();
}

/**
 * Appends a navigation query string to a pathname.
 * Returns the bare pathname when the query is empty.
 */
export function withNavigationQuery(pathname: string, navigationQuery: string) {
  if (!navigationQuery) return pathname;

  return `${pathname}?${navigationQuery}`;
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
 * Normalise a raw URL search-param value into a SortMode.
 * Returns "off" for any unrecognised or missing input.
 */
function parseSortMode(input?: string): SortMode {
  if (input === "down" || input === "up" || input === "off") {
    return input;
  }

  return "off";
}

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

// ---------------------------------------------------------------------------
// Navigation query from server state
// ---------------------------------------------------------------------------

/**
 * Build a URL query string from a resolved FeedSortState and optional viewer
 * location.  Used by Server Component pages to embed navigation context into
 * card links and composer hrefs so sort mode and coordinates survive navigation.
 */
export function buildNavigationQueryFromState(
  sortState: FeedSortState,
  viewerLocation?: ViewerLocation | null,
): string {
  const params = new URLSearchParams();

  params.set("popularity", sortState.popularity);
  params.set("date", sortState.date);
  params.set("distance", sortState.distance);

  if (viewerLocation) {
    params.set("lat", viewerLocation.latitude.toFixed(6));
    params.set("lng", viewerLocation.longitude.toFixed(6));
  }

  return params.toString();
}
