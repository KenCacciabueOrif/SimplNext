import { beforeEach, describe, expect, it } from "vitest";
import { buildHomeTabHref } from "@/app/components/geolocation/tabNavigation";
import {
  LOCATION_ACTIVITY_STORAGE_KEY,
  LOCATION_STORAGE_KEY,
  SORT_PREFERENCES_STORAGE_KEY,
} from "@/app/components/geolocation/constants";

function installMockLocalStorage() {
  const store = new Map<string, string>();

  const localStorageMock = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  } satisfies Storage;

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorageMock,
  });
}

describe("buildHomeTabHref", () => {
  beforeEach(() => {
    installMockLocalStorage();
    localStorage.clear();
  });

  it("keeps valid query coordinates and restores distance from preferences", () => {
    localStorage.setItem(
      SORT_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ popularity: "off", date: "down", distance: "down" }),
    );

    const href = buildHomeTabHref("distance=off&lat=46.500000&lng=6.600000");
    const url = new URL(href, "http://localhost");

    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("lat")).toBe("46.500000");
    expect(url.searchParams.get("lng")).toBe("6.600000");
    expect(url.searchParams.get("distance")).toBe("down");
    expect(url.searchParams.get("geo")).toBe("on");
  });

  it("restores coordinates from stored snapshot when current query has none", () => {
    localStorage.setItem(LOCATION_ACTIVITY_STORAGE_KEY, "off");
    localStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify({
        active: true,
        latitude: 46.519653,
        longitude: 6.632273,
        updatedAt: 1_761_714_000_000,
      }),
    );

    const href = buildHomeTabHref("date=down");
    const url = new URL(href, "http://localhost");

    expect(url.searchParams.get("date")).toBe("down");
    expect(url.searchParams.get("lat")).toBe("46.519653");
    expect(url.searchParams.get("lng")).toBe("6.632273");
    expect(url.searchParams.get("distance")).toBe("down");
    expect(url.searchParams.get("geo")).toBe("on");
  });

  it("drops invalid coordinates and keeps clean sort params", () => {
    const href = buildHomeTabHref("date=up&lat=999&lng=abc&junk=1");
    const url = new URL(href, "http://localhost");

    expect(url.searchParams.get("date")).toBe("up");
    expect(url.searchParams.has("lat")).toBe(false);
    expect(url.searchParams.has("lng")).toBe(false);
    expect(url.searchParams.has("junk")).toBe(false);
  });
});
