/**
 * Last updated: 2026-04-24
 * Changes: Added centralized geolocation storage/event constants for IndexedDB-backed GPS flow.
 * Purpose: Keep shared client-side keys synchronized across geolocation components.
 */

export const LOCATION_EVENT_NAME = "simpl:viewer-location-updated";
export const PERMISSION_STATE_EVENT_NAME = "simpl:geolocation-permission-state";
export const LOCATION_STORAGE_KEY = "simpl:viewer-location";
export const LOCATION_ACTIVITY_STORAGE_KEY = "simpl:viewer-location-active";
export const SORT_PREFERENCES_STORAGE_KEY = "simpl:sort-preferences";

export const LOCATION_INDEXED_DB_NAME = "simpl-geolocation";
export const LOCATION_INDEXED_DB_VERSION = 1;
export const LOCATION_INDEXED_DB_STORE = "state";
export const LOCATION_INDEXED_DB_KEY = "viewer-location";

export const VIEWER_LOCATION_COOKIE_KEY = "simpl-viewer-location";
export const VIEWER_LOCATION_COOKIE_MAX_AGE_SECONDS = 30 * 60;
