> Last updated: 2026-04-28
> Changes: Initial README — documented quality gate scripts, configuration, and usage.

# scripts

Build-time and commit-time quality enforcement scripts. These scripts are called by Husky pre-commit hooks, lint-staged, and the CI workflow.

## Files

| File | Purpose |
|---|---|
| `check-file-length.mjs` | Scans all application source files and fails if any exceed the configured line limit. Reads the threshold and exception list from `file-length-config.mjs`. Used by `npm run check:file-length` and `npm run quality:ci`. |
| `file-length-config.mjs` | Configuration for `check-file-length.mjs` — exports `MAX_FILE_LINES` (200) and `TEMPORARY_EXCEPTIONS` (a `Set` of relative paths exempted from the check). |
| `run-related-tests.mjs` | Discovers staged Git files, resolves related test files via naming convention, and runs only those tests with Vitest. Used by the Husky pre-commit hook via `npm run test:related-staged`. |

## Usage

```bash
# Check that no file exceeds 200 lines
npm run check:file-length

# Run only tests related to staged files (used by pre-commit hook)
npm run test:related-staged

# Full CI quality gate (file-length + lint + tests + build)
npm run quality:ci
```

## Key Code Comments

- [`file-length-config.mjs` L18–20](file-length-config.mjs#L18) — `TEMPORARY_EXCEPTIONS` set. Currently empty; add relative paths here when a file temporarily needs to exceed 200 lines during incremental decomposition.
- [`check-file-length.mjs` L14–17](check-file-length.mjs#L14) — Configuration section: where to change the scanned directories or override the threshold via `MAX_FILE_LINES` env var.

## Maintenance Steps

1. Never raise `MAX_FILE_LINES` globally — add a temporary exception to `TEMPORARY_EXCEPTIONS` instead, with a comment explaining why and when it will be resolved.
2. Remove entries from `TEMPORARY_EXCEPTIONS` as soon as the corresponding file is decomposed.
3. Do not add business logic to these scripts — they are quality tooling only.
