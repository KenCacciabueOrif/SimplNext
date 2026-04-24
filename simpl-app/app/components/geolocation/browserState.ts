/**
 * Last updated: 2026-04-24
 * Changes: Added shared browser-state helpers for geolocation snapshots, sort preference parsing, and distance mode normalization.
 * Purpose: Remove duplicated localStorage/query parsing logic across geolocation-aware client components.
 */

import {
  LOCATION_ACTIVITY_STORAGE_KEY,
  LOCATION_STORAGE_KEY,
  SORT_PREFERENCES_STORAGE_KEY,
} from "@/app/components/geolocation/constants";
import type {
  SortMode,
  SortPreferencesSnapshot,
  ViewerLocationSnapshot,
} from "@/app/components/geolocation/types";

export function normalizeSortMode(value: string | null): SortMode | null {
  if (value === "down" || value === "up" || value === "off") {
    return value;
  }

  return null;
}

export function parseLocationSnapshot(rawValue: string | null): ViewerLocationSnapshot | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<ViewerLocationSnapshot>;

    if (
      typeof parsed.active !== "boolean" ||
      typeof parsed.updatedAt !== "number" ||
      (parsed.latitude !== null && typeof parsed.latitude !== "number") ||
      (parsed.longitude !== null && typeof parsed.longitude !== "number")
    ) {
      return null;
    }

    return {
      active: parsed.active,
      latitude: parsed.latitude ?? null,
      longitude: parsed.longitude ?? null,
      updatedAt: parsed.updatedAt,
    } satisfies ViewerLocationSnapshot;
  } catch {
    return null;
  }
}

export function readStoredLocationSnapshot() {
  return parseLocationSnapshot(localStorage.getItem(LOCATION_STORAGE_KEY));
}

export function readSortPreferences() {
  const rawValue = localStorage.getItem(SORT_PREFERENCES_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<SortPreferencesSnapshot>;
    const popularity = normalizeSortMode(parsed.popularity ?? null);
    const date = normalizeSortMode(parsed.date ?? null);
    const distance = normalizeSortMode(parsed.distance ?? null);

    if (!popularity || !date || !distance) {
      return null;
    }

    return { popularity, date, distance } satisfies SortPreferencesSnapshot;
  } catch {
    return null;
  }
}

export function isLocationMarkedActive() {
  return localStorage.getItem(LOCATION_ACTIVITY_STORAGE_KEY) === "on";
}

export function ensureDistanceModeFromPreferences(
  params: URLSearchParams,
  preferences: SortPreferencesSnapshot | null,
) {
  const currentDistance = params.get("distance");

  if (!currentDistance) {
    params.set("distance", preferences?.distance ?? "down");
    return;
  }

  if (currentDistance === "off" && (preferences?.distance === "down" || preferences?.distance === "up")) {
    params.set("distance", preferences.distance);
  }
}