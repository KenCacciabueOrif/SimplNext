import { describe, expect, it } from "vitest";
import { buildComposerNavigationQuery } from "@/app/components/geolocation/composerNavigation";
import type { ViewerLocationSnapshot } from "@/app/components/geolocation/types";

function makeSnapshot(overrides?: Partial<ViewerLocationSnapshot>): ViewerLocationSnapshot {
  return {
    active: true,
    latitude: 46.519653,
    longitude: 6.632273,
    updatedAt: 1_761_710_000_000,
    ...overrides,
  };
}

describe("buildComposerNavigationQuery", () => {
  it("drops query coordinates when snapshot is temporarily unavailable", () => {
    const result = buildComposerNavigationQuery("popularity=down&date=off&lat=46.500000&lng=6.600000", null);
    const params = new URLSearchParams(result);

    expect(params.has("lat")).toBe(false);
    expect(params.has("lng")).toBe(false);
    expect(params.has("distance")).toBe(false);
    expect(params.has("geo")).toBe(false);
  });

  it("drops stale query coordinates and keeps geo=on when snapshot is active", () => {
    const snapshot = makeSnapshot({ latitude: 40.7128, longitude: -74.006 });
    const result = buildComposerNavigationQuery("lat=46.500000&lng=6.600000&distance=up", snapshot);
    const params = new URLSearchParams(result);

    expect(params.has("lat")).toBe(false);
    expect(params.has("lng")).toBe(false);
    expect(params.get("distance")).toBe("up");
    expect(params.get("geo")).toBe("on");
  });

  it("does not force geo off when no coordinates are available anywhere", () => {
    const snapshot = makeSnapshot({ active: false, latitude: null, longitude: null });
    const result = buildComposerNavigationQuery("popularity=up&distance=off", snapshot);
    const params = new URLSearchParams(result);

    expect(params.has("lat")).toBe(false);
    expect(params.has("lng")).toBe(false);
    expect(params.has("geo")).toBe(false);
    expect(params.get("distance")).toBe("off");
  });

  it("keeps incoming geo=on when snapshot is temporarily unavailable", () => {
    const snapshot = makeSnapshot({ active: false, latitude: null, longitude: null });
    const result = buildComposerNavigationQuery("popularity=up&distance=down&geo=on", snapshot);
    const params = new URLSearchParams(result);

    expect(params.has("lat")).toBe(false);
    expect(params.has("lng")).toBe(false);
    expect(params.get("geo")).toBe("on");
    expect(params.get("distance")).toBe("down");
  });

  it("removes invalid sort modes from query", () => {
    const result = buildComposerNavigationQuery("popularity=invalid&date=down&distance=SIDE", null);
    const params = new URLSearchParams(result);

    expect(params.has("popularity")).toBe(false);
    expect(params.get("date")).toBe("down");
    expect(params.has("distance")).toBe(false);
  });
});
