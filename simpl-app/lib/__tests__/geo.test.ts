/**
 * Last updated: 2026-04-27
 * Purpose: Tests for lib/geo.ts — verifies the Haversine distance formula
 *          against known coordinate pairs and edge cases.
 */

import { describe, expect, it } from "vitest";
import { calculateDistanceKm } from "@/lib/geo";

// ---------------------------------------------------------------------------
// Fixtures — known distances used for approximate assertions
// ---------------------------------------------------------------------------

/** Geneva, Switzerland */
const GENEVA = { latitude: 46.2044, longitude: 6.1432 };

/** Lausanne, Switzerland — roughly 60 km from Geneva along the lake */
const LAUSANNE = { latitude: 46.5197, longitude: 6.6323 };

/** Zurich, Switzerland — roughly 240 km from Geneva */
const ZURICH = { latitude: 47.3769, longitude: 8.5417 };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("calculateDistanceKm", () => {
  it("returns null when post has no coordinates", () => {
    const result = calculateDistanceKm(GENEVA, { latitude: null, longitude: null });
    expect(result).toBeNull();
  });

  it("returns null when only latitude is null", () => {
    const result = calculateDistanceKm(GENEVA, { latitude: null, longitude: 6.6323 });
    expect(result).toBeNull();
  });

  it("returns null when only longitude is null", () => {
    const result = calculateDistanceKm(GENEVA, { latitude: 46.5197, longitude: null });
    expect(result).toBeNull();
  });

  it("returns 0 when viewer and post are at the same location", () => {
    const result = calculateDistanceKm(GENEVA, GENEVA);
    expect(result).toBeCloseTo(0, 5);
  });

  it("computes Geneva → Lausanne distance within ±10 km of 57 km", () => {
    const result = calculateDistanceKm(GENEVA, LAUSANNE);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(47);
    expect(result!).toBeLessThan(67);
  });

  it("computes Geneva → Zurich distance within ±15 km of 225 km", () => {
    const result = calculateDistanceKm(GENEVA, ZURICH);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(210);
    expect(result!).toBeLessThan(240);
  });

  it("is symmetric (A→B ≈ B→A)", () => {
    const ab = calculateDistanceKm(GENEVA, LAUSANNE);
    const ba = calculateDistanceKm(LAUSANNE, GENEVA);
    expect(ab).not.toBeNull();
    expect(ba).not.toBeNull();
    expect(Math.abs(ab! - ba!)).toBeLessThan(0.001);
  });
});
