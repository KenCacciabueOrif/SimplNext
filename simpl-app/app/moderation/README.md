> Last updated: 2026-04-28
> Changes: Initial README — documented moderation page purpose, filtering rules, and key code comment reference.

# app/moderation

The community moderation queue. Displays posts that have been reported and are currently under review or hidden. Only content with a `UNDER_REVIEW` or `HIDDEN` status that carries active report or remove signals is shown — active or unreported posts are excluded.

## Routes

| Route | File | Purpose |
|---|---|---|
| `/moderation` | `page.tsx` | Render the moderation queue with tri-state sort controls. Posts are fetched via `getModerationQueue` and sorted by the same aggregate ranking engine used by the main feed. |

## Key Code Comments

- [`page.tsx` L1–5](page.tsx#L1) — Documents the moderation sort migration to tri-state multi-filter modes and filter-mode persistence in navigation links.

## Maintenance Steps

1. The filtering rules (which posts appear in the queue) live in `lib/queries.ts → getModerationQueue`. Do not add filtering logic to this page component.
2. Sort behavior is shared with the feed — use `resolveFeedSortState` and the same `SortBar` component.
3. Run `npm run quality:ci` after any change.
