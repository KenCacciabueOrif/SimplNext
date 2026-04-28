> Last updated: 2026-04-28
> Changes: Initial README — documented composer components, their coordinate capture flow, and test coverage.

# app/components/composer

Input forms for creating new posts and thread replies. Both components share the same underlying `PostComposer` with different configurations.

## Architecture

`PostComposer` handles all form logic including geolocation coordinate capture. It listens for the `simpl:viewer-location-updated` event, reads `localStorage` as a fallback, and queries IndexedDB as a last resort, then injects `latitude`/`longitude` as hidden form fields before submission.

`ThreadReplyComposer` is a thin wrapper that adds collapsible open/close state around `PostComposer`. It starts collapsed to maximize scrollable space on thread pages.

## Files

| File | Purpose |
|---|---|
| `PostComposer.tsx` | Shared create form — handles title, body, coordinate hidden fields, and submit via `createPostAction`. Starts collapsed in reply contexts. Includes query-coordinate fallback when live GPS snapshot arrives late. |
| `ThreadReplyComposer.tsx` | Collapsible wrapper around `PostComposer` for thread reply pages. Starts hidden; toggle reveals the composer without a page reload. |

## Test Files

| File | Covers |
|---|---|
| `ThreadReplyComposer.test.tsx` | Toggle open/close behavior, composer visibility on thread pages. |

## Key Code Comments

- [`PostComposer.tsx` L1–6](PostComposer.tsx#L1) — Documents the query-coordinate fallback added to handle late-arriving GPS snapshots during form submit flows.
- [`ThreadReplyComposer.tsx` L1–6](ThreadReplyComposer.tsx#L1) — Documents the collapsible UX rationale.

## Maintenance Steps

1. Coordinate capture logic belongs in `PostComposer.tsx` — do not duplicate it in `ThreadReplyComposer`.
2. Any new form field added to `PostComposer` must also be handled in the corresponding `createPostAction` server action.
3. Tests for toggle behavior belong in `ThreadReplyComposer.test.tsx`; tests for form submission logic belong alongside `PostComposer` once the test suite is extended.
4. Run `npm run quality:ci` after any change.
