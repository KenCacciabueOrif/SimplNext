/*
 * Last updated: 2026-04-27
 * Changes: Added a repository-local file-length guard used by pre-commit and CI quality gates.
 * Purpose: Enforce the cleanup constraint that application source files stay under 200 lines unless explicitly excluded.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { MAX_FILE_LINES, TEMPORARY_EXCEPTIONS } from "./file-length-config.mjs";

// ------------------------------
// Configuration
// ------------------------------

const MAX_LINES = Number(process.env.MAX_FILE_LINES ?? String(MAX_FILE_LINES));
const ROOT_DIR = process.cwd();

const SOURCE_ROOTS = ["app", "lib", "prisma", "scripts"];
const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs"]);
const EXCLUDED_SEGMENTS = new Set(["node_modules", ".next", ".git", "coverage"]);

// ------------------------------
// File Discovery
// ------------------------------

async function* walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (EXCLUDED_SEGMENTS.has(entry.name)) {
      continue;
    }

    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      yield* walkFiles(fullPath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    yield fullPath;
  }
}

function hasAllowedExtension(filePath) {
  return Array.from(ALLOWED_EXTENSIONS).some((extension) => filePath.endsWith(extension));
}

function isIgnoredByPathConventions(relativePath) {
  return relativePath.includes("/__tests__/") || relativePath.endsWith(".test.ts") || relativePath.endsWith(".test.tsx");
}

// ------------------------------
// Validation
// ------------------------------

async function countFileLines(filePath) {
  const content = await readFile(filePath, "utf8");

  if (content.length === 0) {
    return 0;
  }

  return content.split(/\r?\n/).length;
}

async function collectViolations() {
  const violations = [];

  for (const sourceRoot of SOURCE_ROOTS) {
    const absoluteRoot = join(ROOT_DIR, sourceRoot);

    try {
      const rootStats = await stat(absoluteRoot);

      if (!rootStats.isDirectory()) {
        continue;
      }
    } catch {
      continue;
    }

    for await (const filePath of walkFiles(absoluteRoot)) {
      if (!hasAllowedExtension(filePath)) {
        continue;
      }

      const relativePath = relative(ROOT_DIR, filePath).replaceAll("\\", "/");

      if (isIgnoredByPathConventions(relativePath)) {
        continue;
      }

      if (TEMPORARY_EXCEPTIONS.has(relativePath)) {
        continue;
      }

      const lineCount = await countFileLines(filePath);

      if (lineCount > MAX_LINES) {
        violations.push({
          filePath: relativePath,
          lineCount,
        });
      }
    }
  }

  return violations.sort((left, right) => right.lineCount - left.lineCount);
}

// ------------------------------
// Main
// ------------------------------

const violations = await collectViolations();

if (violations.length === 0) {
  console.log(`File-length guard passed: no source file exceeds ${MAX_LINES} lines.`);
  process.exit(0);
}

console.error(`File-length guard failed: ${violations.length} source file(s) exceed ${MAX_LINES} lines.`);
for (const violation of violations) {
  console.error(`- ${violation.filePath}: ${violation.lineCount} lines`);
}
console.error("Split these files or document a temporary exception before committing.");
process.exit(1);
