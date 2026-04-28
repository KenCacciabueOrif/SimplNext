> Last updated: 2026-04-28
> Changes: Initial README — documented lib/ module responsibilities, dependency graph, barrel strategy, and key code comment references.

# lib

Server-side domain library for Simpl. All modules in this folder are pure TypeScript — no React imports, no `"use client"` directives — and are safe to use in server components, server actions, and pure unit tests.

## Architecture Overview

The library was incrementally decomposed from a single `lib/simpl.ts` monolith into focused modules:

```
lib/
├── types.ts            ← domain types (shared by all modules)
├── prisma.ts           ← singleton Prisma client
├── actor.ts            ← anonymous actor identity (server-only: uses cookies)
├── viewer-location.ts  ← server-side location cookie parsing (server-only)
├── queries.ts          ← Prisma post queries for feed, thread, moderation
├── policy.ts           ← moderation vote-threshold rules (pure)
├── sorting.ts          ← tri-state aggregate ranking engine (pure)
├── geo.ts              ← Haversine distance math (pure)
├── navigation.ts       ← re-export barrel (backward compat)
├── navigation-sort.ts  ← sort-mode parsing + FeedSortState resolution (pure)
├── navigation-query.ts ← URL query building and sanitization (pure)
└── simpl.ts            ← re-export barrel (backward compat)
```

**Dependency rule:** pure modules (`policy`, `sorting`, `geo`, `navigation-sort`, `navigation-query`) must not import from server-only modules (`actor`, `queries`, `viewer-location`, `prisma`). This keeps them testable without mocking.

## Files

### Domain Types

| File | Purpose |
|---|---|
| `types.ts` | Single source of truth for all shared TypeScript types: `SortMode`, `FeedSortState`, `ViewerLocation`, `PostListItem`, `ModerationPolicyOutcome`, `PostActionState`. |

### Data Access (server-only)

| File | Purpose |
|---|---|
| `prisma.ts` | Singleton Prisma client with Accelerate extension. Hot-reload safe for development. |
| `actor.ts` | `getViewerActor` and `ensureAnonymousActor` — cookie-based anonymous identity lookup and creation via `next/headers`. |
| `viewer-location.ts` | Parse the `simpl-viewer-location` cookie from a server-side cookie reader into a `ViewerLocation` object. |
| `queries.ts` | `getFeedPosts`, `getThreadPageData`, `getModerationQueue` — Prisma queries with shared `buildPostInclude()` include builder and post-to-`PostListItem` mapper. |

### Business Logic (pure)

| File | Purpose |
|---|---|
| `policy.ts` | `evaluateModerationPolicy` — determines post visibility outcome (KEEP / REMOVE / hard-delete) from vote counts and the strong-majority ratio rule. |
| `sorting.ts` | Tri-state aggregate ranking engine: individual comparators for popularity, date, and distance, merged via normalized rank averaging. |
| `geo.ts` | `calculateDistanceKm` — Haversine great-circle distance between two coordinate pairs. No I/O, usable client and server. |

### Navigation (pure)

| File | Purpose |
|---|---|
| `navigation-sort.ts` | `parseSortModeValue`, `parseViewerLocation`, `resolveFeedSortState`, `DEFAULT_FEED_SORT_STATE` — URL search-param parsing into a resolved `FeedSortState`. |
| `navigation-query.ts` | `buildNavigationQuery`, `buildNavigationQueryFromState`, `withNavigationQuery` — build and sanitize URL query strings for post/reply redirects, carrying sort and geolocation context. |
| `navigation.ts` | Re-export barrel combining `navigation-sort` and `navigation-query`; all existing imports keep working. |

### Backward-Compatibility Barrels

| File | Purpose |
|---|---|
| `simpl.ts` | Re-exports everything from the canonical submodules. Retained so existing page-level imports remain unbroken. New code should import from the canonical module directly. |

## Test Files (`__tests__/`)

| File | Covers |
|---|---|
| `geo.test.ts` | Haversine distance calculation edge cases (7 tests). |
| `navigation.test.ts` | URL query parsing, building, and round-trip safety. |
| `policy.test.ts` | All 5 moderation policy branches. |
| `sorting.test.ts` | Individual comparators and aggregate ranking engine. |

## Key Code Comments

- [`policy.ts` L14–28](policy.ts#L14) — Policy threshold constants and the 5-point rule block documenting each decision branch.
- [`sorting.ts` L10–20](sorting.ts#L10) — Stable tie-breaker rationale for all comparators.
- [`queries.ts` L16–18](queries.ts#L16) — `PostQueryRecord` alias and the `buildPostInclude()` shape explanation.
- [`navigation-query.ts` L17–20](navigation-query.ts#L17) — Allowlist rationale: only known sort/geo parameters are forwarded to prevent query pollution.

## Maintenance Steps

1. New domain types belong in `types.ts` — not scattered in module files.
2. Pure functions (no I/O) belong in `policy`, `sorting`, `geo`, or `navigation-*` modules and must have a corresponding test in `__tests__/`.
3. Server-only functions (cookies, Prisma) belong in `actor`, `queries`, or `viewer-location`.
4. Do not add new re-exports to `simpl.ts` — add them to the canonical module and import directly.
5. Run `npm run quality:ci` after any change.
