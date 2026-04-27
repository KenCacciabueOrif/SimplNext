/*
 * Last updated: 2026-04-27
 * Changes: Added temporary baseline exceptions for files above the 200-line cleanup threshold.
 * Purpose: Keep quality gates strict for new growth while allowing incremental decomposition of known large modules.
 */

// ------------------------------
// Baseline Threshold
// ------------------------------

export const MAX_FILE_LINES = 200;

// ------------------------------
// Temporary Exceptions
// ------------------------------

// Keep this list short and remove entries as files are decomposed.
export const TEMPORARY_EXCEPTIONS = new Set([
  // All known large files have been decomposed — list is intentionally empty.
]);
