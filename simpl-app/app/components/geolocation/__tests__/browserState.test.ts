import { beforeEach, describe, expect, it } from "vitest";
import {
  ensureDistanceModeFromPreferences,
  normalizeSortMode,
  parseLocationSnapshot,
  readSortPreferences,
} from "@/app/components/geolocation/browserState";
import { SORT_PREFERENCES_STORAGE_KEY } from "@/app/components/geolocation/constants";
import type { SortPreferencesSnapshot } from "@/app/components/geolocation/types";
import { installMockLocalStorage } from "@/app/components/geolocation/__tests__/testHelpers";

describe("browserState", () => {
  beforeEach(() => {
    installMockLocalStorage();
    localStorage.clear();
  });

  describe("normalizeSortMode", () => {
    it.each(["down", "up", "off"] as const)("accepts %s", (mode) => {
      expect(normalizeSortMode(mode)).toBe(mode);
    });

    it.each(["", "DOWN", "asc", "none", null])("rejects %s", (value) => {
      expect(normalizeSortMode(value)).toBeNull();
    });
  });

  describe("parseLocationSnapshot", () => {
    it("parses a valid snapshot payload", () => {
      const parsed = parseLocationSnapshot(
        JSON.stringify({
          active: true,
          latitude: 46.519653,
          longitude: 6.632273,
          updatedAt: 1_761_713_600_000,
        }),
      );

      expect(parsed).toEqual({
        active: true,
        latitude: 46.519653,
        longitude: 6.632273,
        updatedAt: 1_761_713_600_000,
      });
    });

    it("returns null for invalid payloads", () => {
      expect(parseLocationSnapshot(null)).toBeNull();
      expect(parseLocationSnapshot("not-json")).toBeNull();
      expect(
        parseLocationSnapshot(
          JSON.stringify({ active: "yes", latitude: 46.5, longitude: 6.6, updatedAt: 1 }),
        ),
      ).toBeNull();
    });
  });

  describe("readSortPreferences", () => {
    it("returns null when preferences are missing", () => {
      expect(readSortPreferences()).toBeNull();
    });

    it("returns null when preferences contain invalid values", () => {
      localStorage.setItem(
        SORT_PREFERENCES_STORAGE_KEY,
        JSON.stringify({ popularity: "down", date: "up", distance: "SIDEWAYS" }),
      );

      expect(readSortPreferences()).toBeNull();
    });

    it("parses persisted sort preferences", () => {
      const snapshot: SortPreferencesSnapshot = {
        popularity: "down",
        date: "off",
        distance: "down",
      };

      localStorage.setItem(SORT_PREFERENCES_STORAGE_KEY, JSON.stringify(snapshot));

      expect(readSortPreferences()).toEqual(snapshot);
    });
  });

  describe("ensureDistanceModeFromPreferences", () => {
    it("defaults distance to down when query has no distance and no preferences", () => {
      const params = new URLSearchParams("popularity=down");

      ensureDistanceModeFromPreferences(params, null);

      expect(params.get("distance")).toBe("down");
    });

    it("restores distance from preferences when stale URL has distance=off", () => {
      const params = new URLSearchParams("distance=off&lat=46.500000&lng=6.600000");

      ensureDistanceModeFromPreferences(params, {
        popularity: "off",
        date: "down",
        distance: "down",
      });

      expect(params.get("distance")).toBe("down");
    });

    it("keeps explicit distance=off when preferences also keep off", () => {
      const params = new URLSearchParams("distance=off");

      ensureDistanceModeFromPreferences(params, {
        popularity: "down",
        date: "off",
        distance: "off",
      });

      expect(params.get("distance")).toBe("off");
    });

    it("does not override an already active distance mode", () => {
      const params = new URLSearchParams("distance=up");

      ensureDistanceModeFromPreferences(params, {
        popularity: "off",
        date: "down",
        distance: "down",
      });

      expect(params.get("distance")).toBe("up");
    });
  });
});
