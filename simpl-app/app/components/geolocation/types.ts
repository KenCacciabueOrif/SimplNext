/**
 * Last updated: 2026-04-27
 * Changes: SortMode is now imported from lib/types instead of re-declared here
 *          to eliminate the shadow type that existed across the module boundary.
 * Purpose: Define canonical client-side geolocation contracts used by manager, storage, and refresh components.
 */

import type { SortMode } from "@/lib/types";

export type { SortMode };

export type PermissionStateValue = "granted" | "prompt" | "denied" | "unknown";

export type ViewerLocationSnapshot = {
  active: boolean;
  latitude: number | null;
  longitude: number | null;
  updatedAt: number;
};

// NOTE: SortPreferencesSnapshot mirrors the shape of FeedSortState from lib/types.ts
// but is kept as a separate type because it represents a browser-storage snapshot
// (client-side, serialised to localStorage), not a server-side resolved state.
export type SortPreferencesSnapshot = {
  popularity: SortMode;
  date: SortMode;
  distance: SortMode;
};

export function toStoredLocation(latitude: number, longitude: number): ViewerLocationSnapshot {
  return {
    active: true,
    latitude,
    longitude,
    updatedAt: Date.now(),
  };
}

export function toDisabledLocation(): ViewerLocationSnapshot {
  return {
    active: false,
    latitude: null,
    longitude: null,
    updatedAt: Date.now(),
  };
}
