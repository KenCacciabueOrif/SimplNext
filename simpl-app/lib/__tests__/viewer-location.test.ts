/**
 * Last updated: 2026-04-28
 * Purpose: Tests for lib/viewer-location.ts — verifies coordinate parsing,
 *          boundary validation, and malformed cookie handling.
 */

import { describe, expect, it } from "vitest";
import { readViewerLocationFromCookies } from "@/lib/viewer-location";
import { VIEWER_LOCATION_COOKIE_KEY } from "@/app/components/geolocation/constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCookieStore(cookieValue?: string) {
  return {
    get: (name: string) =>
      name === VIEWER_LOCATION_COOKIE_KEY && cookieValue !== undefined
        ? { value: cookieValue }
        : undefined,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("readViewerLocationFromCookies", () => {
  // -------------------------------------------------------------------------
  // Valid inputs
  // -------------------------------------------------------------------------

  it("parses a well-formed coordinate pair", () => {
    const result = readViewerLocationFromCookies(makeCookieStore("46.2044:6.1432"));
    expect(result).toEqual({ latitude: 46.2044, longitude: 6.1432 });
  });

  it("accepts negative latitude and longitude", () => {
    const result = readViewerLocationFromCookies(makeCookieStore("-33.8688:151.2093"));
    expect(result).toEqual({ latitude: -33.8688, longitude: 151.2093 });
  });

  it("accepts boundary values (90:-180)", () => {
    const result = readViewerLocationFromCookies(makeCookieStore("90:-180"));
    expect(result).toEqual({ latitude: 90, longitude: -180 });
  });

  it("accepts boundary values (-90:180)", () => {
    const result = readViewerLocationFromCookies(makeCookieStore("-90:180"));
    expect(result).toEqual({ latitude: -90, longitude: 180 });
  });

  it("accepts zero coordinates (0:0)", () => {
    const result = readViewerLocationFromCookies(makeCookieStore("0:0"));
    expect(result).toEqual({ latitude: 0, longitude: 0 });
  });

  // -------------------------------------------------------------------------
  // Missing cookie
  // -------------------------------------------------------------------------

  it("returns null when the cookie is absent", () => {
    const result = readViewerLocationFromCookies(makeCookieStore(undefined));
    expect(result).toBeNull();
  });

  it("returns null when cookie store does not have the key", () => {
    const result = readViewerLocationFromCookies({ get: () => undefined });
    expect(result).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Malformed values
  // -------------------------------------------------------------------------

  it("returns null for an empty string", () => {
    const result = readViewerLocationFromCookies(makeCookieStore(""));
    expect(result).toBeNull();
  });

  it("returns null when the separator is missing", () => {
    const result = readViewerLocationFromCookies(makeCookieStore("46.20446.1432"));
    expect(result).toBeNull();
  });

  it("returns null when latitude is not a number", () => {
    const result = readViewerLocationFromCookies(makeCookieStore("abc:6.1432"));
    expect(result).toBeNull();
  });

  it("returns null when longitude is not a number", () => {
    const result = readViewerLocationFromCookies(makeCookieStore("46.2044:xyz"));
    expect(result).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Out-of-range values
  // -------------------------------------------------------------------------

  it("returns null when latitude exceeds 90", () => {
    const result = readViewerLocationFromCookies(makeCookieStore("91:6.1432"));
    expect(result).toBeNull();
  });

  it("returns null when latitude is below -90", () => {
    const result = readViewerLocationFromCookies(makeCookieStore("-91:6.1432"));
    expect(result).toBeNull();
  });

  it("returns null when longitude exceeds 180", () => {
    const result = readViewerLocationFromCookies(makeCookieStore("46.2044:181"));
    expect(result).toBeNull();
  });

  it("returns null when longitude is below -180", () => {
    const result = readViewerLocationFromCookies(makeCookieStore("46.2044:-181"));
    expect(result).toBeNull();
  });
});
