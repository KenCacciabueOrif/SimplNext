/**
 * Last updated: 2026-04-28
 * Changes: No changes — initial extraction from app/actions.ts during phase-2 modularization.
 * Purpose: Form data normalization helpers shared by server action modules.
 */

export function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function parseOptionalFloat(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}
