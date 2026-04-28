import { beforeEach, describe, expect, it } from "vitest";
import { ensureGeoQuery } from "@/app/components/geolocation/backLinkNavigation";
import {
  LOCATION_ACTIVITY_STORAGE_KEY,
  LOCATION_STORAGE_KEY,
  SORT_PREFERENCES_STORAGE_KEY,
} from "@/app/components/geolocation/constants";
import { installMockLocalStorage } from "@/app/components/geolocation/__tests__/testHelpers";

describe("ensureGeoQuery", () => {
  beforeEach(() => {
    installMockLocalStorage();
    localStorage.clear();
  });

  it("drops coordinates and keeps geo=on with recovered distance", () => {
    const params = new URLSearchParams("distance=off&lat=46.500000&lng=6.600000");

    localStorage.setItem(
      SORT_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ popularity: "off", date: "down", distance: "down" }),
    );

    const result = ensureGeoQuery("/", params);
    const output = new URL(result, "http://localhost");

    expect(output.searchParams.has("lat")).toBe(false);
    expect(output.searchParams.has("lng")).toBe(false);
    expect(output.searchParams.get("distance")).toBe("down");
    expect(output.searchParams.get("geo")).toBe("on");
  });

  it("restores geo mode from stored snapshot even when activity marker is off", () => {
    localStorage.setItem(LOCATION_ACTIVITY_STORAGE_KEY, "off");
    localStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify({
        active: true,
        latitude: 46.519653,
        longitude: 6.632273,
        updatedAt: 1_761_711_000_000,
      }),
    );
    localStorage.setItem(
      SORT_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ popularity: "off", date: "down", distance: "down" }),
    );

    const result = ensureGeoQuery("/", new URLSearchParams("distance=off"));
    const output = new URL(result, "http://localhost");

    expect(output.searchParams.has("lat")).toBe(false);
    expect(output.searchParams.has("lng")).toBe(false);
    expect(output.searchParams.get("distance")).toBe("down");
    expect(output.searchParams.get("geo")).toBe("on");
  });

  it("returns unchanged query when no location context is available", () => {
    localStorage.setItem(LOCATION_ACTIVITY_STORAGE_KEY, "off");

    const result = ensureGeoQuery("/", new URLSearchParams("date=down"));
    const output = new URL(result, "http://localhost");

    expect(output.searchParams.get("date")).toBe("down");
    expect(output.searchParams.has("lat")).toBe(false);
    expect(output.searchParams.has("lng")).toBe(false);
  });
});
