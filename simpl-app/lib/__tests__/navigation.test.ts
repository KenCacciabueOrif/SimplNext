import { describe, expect, it } from "vitest";
import {
  buildNavigationQuery,
  parseSortModeValue,
  withNavigationQuery,
} from "@/lib/navigation";

// ---------------------------------------------------------------------------
// parseSortModeValue
// ---------------------------------------------------------------------------

describe("parseSortModeValue", () => {
  it.each(["down", "up", "off"] as const)("accepts valid mode %s", (mode) => {
    expect(parseSortModeValue(mode)).toBe(mode);
  });

  it.each(["asc", "desc", "true", "1", "", "DOWN", "UP", "OFF"])(
    "rejects invalid value %s",
    (value) => {
      expect(parseSortModeValue(value)).toBeNull();
    },
  );

  it("rejects null", () => {
    expect(parseSortModeValue(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// buildNavigationQuery
// ---------------------------------------------------------------------------

describe("buildNavigationQuery", () => {
  it("returns empty string for empty input", () => {
    expect(buildNavigationQuery("")).toBe("");
  });

  it("returns empty string for null input", () => {
    expect(buildNavigationQuery(null)).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(buildNavigationQuery("   ")).toBe("");
  });

  it("passes through valid sort modes", () => {
    const result = buildNavigationQuery("popularity=down&date=up&distance=off");
    const params = new URLSearchParams(result);
    expect(params.get("popularity")).toBe("down");
    expect(params.get("date")).toBe("up");
    expect(params.get("distance")).toBe("off");
  });

  it("omits invalid sort mode values", () => {
    const result = buildNavigationQuery("popularity=invalid&date=down");
    const params = new URLSearchParams(result);
    expect(params.has("popularity")).toBe(false);
    expect(params.get("date")).toBe("down");
  });

  it("strips unknown parameters", () => {
    const result = buildNavigationQuery("foo=bar&baz=qux&date=down");
    const params = new URLSearchParams(result);
    expect(params.has("foo")).toBe(false);
    expect(params.has("baz")).toBe(false);
    expect(params.get("date")).toBe("down");
  });

  it("includes valid coordinates and defaults distance to down", () => {
    const result = buildNavigationQuery("lat=48.8&lng=2.3&popularity=down");
    const params = new URLSearchParams(result);
    expect(params.get("lat")).toBe("48.800000");
    expect(params.get("lng")).toBe("2.300000");
    expect(params.get("distance")).toBe("down");
    expect(params.get("popularity")).toBe("down");
  });

  it("does not override an explicit distance mode when coordinates are present", () => {
    const result = buildNavigationQuery("lat=48.8&lng=2.3&distance=up");
    const params = new URLSearchParams(result);
    expect(params.get("distance")).toBe("up");
  });

  it("excludes coordinates that are out of latitude bounds", () => {
    const result = buildNavigationQuery("lat=95&lng=2.3");
    const params = new URLSearchParams(result);
    expect(params.has("lat")).toBe(false);
    expect(params.has("lng")).toBe(false);
  });

  it("excludes coordinates that are out of longitude bounds", () => {
    const result = buildNavigationQuery("lat=48.8&lng=200");
    const params = new URLSearchParams(result);
    expect(params.has("lat")).toBe(false);
    expect(params.has("lng")).toBe(false);
  });

  it("excludes non-numeric coordinates", () => {
    const result = buildNavigationQuery("lat=abc&lng=2.3");
    const params = new URLSearchParams(result);
    expect(params.has("lat")).toBe(false);
    expect(params.has("lng")).toBe(false);
  });

  it("does not add distance=down when only one coordinate is present", () => {
    const result = buildNavigationQuery("lat=48.8");
    const params = new URLSearchParams(result);
    expect(params.has("distance")).toBe(false);
  });

  it("passes through geo=on / geo=off", () => {
    expect(new URLSearchParams(buildNavigationQuery("geo=on")).get("geo")).toBe("on");
    expect(new URLSearchParams(buildNavigationQuery("geo=off")).get("geo")).toBe("off");
  });

  it("strips invalid geo values", () => {
    const result = buildNavigationQuery("geo=maybe");
    expect(new URLSearchParams(result).has("geo")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// withNavigationQuery
// ---------------------------------------------------------------------------

describe("withNavigationQuery", () => {
  it("appends query to pathname", () => {
    expect(withNavigationQuery("/feed", "date=down")).toBe("/feed?date=down");
  });

  it("returns bare pathname when query is empty", () => {
    expect(withNavigationQuery("/feed", "")).toBe("/feed");
  });
});
