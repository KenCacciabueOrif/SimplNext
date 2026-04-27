/**
 * Last updated: 2026-04-27
 * Changes: Decomposed into navigation-sort.ts and navigation-query.ts; this file
 *   is now a backward-compatibility re-export barrel so all existing imports keep working.
 * Purpose: Single public import point for all navigation utilities.
 */

export {
  DEFAULT_FEED_SORT_STATE,
  parseSortModeValue,
  parseViewerLocation,
  resolveFeedSortState,
} from "@/lib/navigation-sort";

export {
  buildNavigationQuery,
  buildNavigationQueryFromState,
  withNavigationQuery,
} from "@/lib/navigation-query";
