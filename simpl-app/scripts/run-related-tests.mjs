/*
 * Last updated: 2026-04-27
 * Changes: Added staged-file-aware Vitest runner for pre-commit quality enforcement.
 * Purpose: Run targeted related tests for staged source changes to keep commits fast while preserving safety.
 */

import { existsSync } from "node:fs";
import { execSync, spawnSync } from "node:child_process";
import { resolve, relative } from "node:path";

// ------------------------------
// Git Staged File Discovery
// ------------------------------

function getGitRoot() {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
}

function getStagedFilesFromGit() {
  const output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
    encoding: "utf8",
  });

  return output
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isTestRelevantSourceFile(pathValue) {
  return /\.(ts|tsx|js|jsx)$/.test(pathValue) && !pathValue.includes(".d.ts");
}

// ------------------------------
// Vitest Invocation
// ------------------------------

function runVitestRelated(files) {
  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["vitest", "related", "--run", ...files],
    {
      stdio: "inherit",
    },
  );

  return result.status ?? 1;
}

// ------------------------------
// Main
// ------------------------------

const projectRoot = process.cwd();
const gitRoot = getGitRoot();
const stagedFiles = getStagedFilesFromGit();

const relatedFiles = stagedFiles
  .map((stagedPath) => resolve(gitRoot, stagedPath))
  .filter((absolutePath) => absolutePath.startsWith(projectRoot))
  .map((absolutePath) => relative(projectRoot, absolutePath).replaceAll("\\", "/"))
  .filter((localPath) => existsSync(localPath))
  .filter(isTestRelevantSourceFile);

if (relatedFiles.length === 0) {
  console.log("No staged source files require related Vitest execution.");
  process.exit(0);
}

console.log(`Running related Vitest checks for ${relatedFiles.length} staged source file(s)...`);
const exitCode = runVitestRelated(relatedFiles);
process.exit(exitCode);
