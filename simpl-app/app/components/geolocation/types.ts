/**
 * Last updated: 2026-04-24
 * Changes: Added shared geolocation snapshot and permission-state types for modular GPS orchestration components.
 * Purpose: Define canonical client-side geolocation contracts used by manager, storage, and refresh components.
 */

export type PermissionStateValue = "granted" | "prompt" | "denied" | "unknown";

export type ViewerLocationSnapshot = {
  active: boolean;
  latitude: number | null;
  longitude: number | null;
  updatedAt: number;
};

export type SortMode = "down" | "up" | "off";

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
