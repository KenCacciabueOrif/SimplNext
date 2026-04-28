/**
 * Last updated: 2026-04-28
 * Purpose: Tests for app/actions/formUtils.ts — verifies FormData normalization
 *          helpers for text and float inputs.
 */

import { describe, expect, it } from "vitest";
import { normalizeText, parseOptionalFloat } from "@/app/actions/formUtils";

// ---------------------------------------------------------------------------
// normalizeText
// ---------------------------------------------------------------------------

describe("normalizeText", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normalizeText("  hello  ")).toBe("hello");
  });

  it("returns an empty string for null", () => {
    expect(normalizeText(null)).toBe("");
  });

  it("returns an empty string for a File (non-string FormDataEntryValue)", () => {
    const file = new File([""], "test.txt");
    expect(normalizeText(file)).toBe("");
  });

  it("returns the original string when no trimming is needed", () => {
    expect(normalizeText("hello")).toBe("hello");
  });

  it("returns an empty string for a whitespace-only string", () => {
    expect(normalizeText("   ")).toBe("");
  });

  it("preserves internal whitespace", () => {
    expect(normalizeText("  hello world  ")).toBe("hello world");
  });
});

// ---------------------------------------------------------------------------
// parseOptionalFloat
// ---------------------------------------------------------------------------

describe("parseOptionalFloat", () => {
  it("parses a valid float string", () => {
    expect(parseOptionalFloat("46.2044")).toBeCloseTo(46.2044);
  });

  it("parses a valid integer string as float", () => {
    expect(parseOptionalFloat("42")).toBe(42);
  });

  it("parses a negative value", () => {
    expect(parseOptionalFloat("-33.8688")).toBeCloseTo(-33.8688);
  });

  it("returns null for null", () => {
    expect(parseOptionalFloat(null)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseOptionalFloat("")).toBeNull();
  });

  it("returns null for a whitespace-only string", () => {
    expect(parseOptionalFloat("   ")).toBeNull();
  });

  it("returns null for a non-numeric string", () => {
    expect(parseOptionalFloat("abc")).toBeNull();
  });

  it("returns null for NaN", () => {
    expect(parseOptionalFloat("NaN")).toBeNull();
  });

  it("returns null for Infinity", () => {
    expect(parseOptionalFloat("Infinity")).toBeNull();
  });

  it("returns null for a File (non-string FormDataEntryValue)", () => {
    const file = new File([""], "test.txt");
    expect(parseOptionalFloat(file)).toBeNull();
  });
});
