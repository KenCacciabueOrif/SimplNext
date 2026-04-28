/**
 * Last updated: 2026-04-27
 * Purpose: Build and compose URL query strings for post/reply redirect targets,
 *   keeping sort mode and geolocation context across navigation.
 *   Sanitizes raw form input and rebuilds query strings from resolved server state.
 */

import type { FeedSortState, ViewerLocation } from "@/lib/types";
import { parseSortModeValue } from "@/lib/navigation-sort";

// ---------------------------------------------------------------------------
// Navigation query builder
// ---------------------------------------------------------------------------

/**
 * Sanitizes and rebuilds a navigation query string from form input.
 * Only allow-listed parameters (sort modes, coordinates, geo flag) are passed through.
 * Only non-sensitive sort + geo mode values are included.
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

  if (viewerLocation) params.set("geo", "on");

  return params.toString();
}
