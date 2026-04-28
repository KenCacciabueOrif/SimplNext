> Last updated: 2026-04-28
> Changes: Initial README — documented SortBar responsibilities and its hook extraction.

# app/components/sort

Sort controls for the Simpl feed. The `SortBar` is a pure presentation component — all geolocation and sort state logic lives in the `useGeoSort` hook (located in `../geolocation/useGeoSort.ts`).

## Files

| File | Purpose |
|---|---|
| `SortBar.tsx` | Renders tri-state sort buttons for Popularity, Date, and Distance. Delegates all GPS acquisition, permission listening, localStorage persistence, and router navigation to `useGeoSort`. |

## Key Code Comments

- [`SortBar.tsx` L1–11](SortBar.tsx#L1) — Documents the extraction of `useGeoSort` and what was removed from `SortBar.tsx` (~235 → ~80 lines).

## Maintenance Steps

1. `SortBar.tsx` must remain a pure presentation component — no `useEffect`, no localStorage access, no `navigator.geolocation` calls inline.
2. New sort-related state logic belongs in `useGeoSort.ts` (in the geolocation folder), not here.
3. Run `npm run quality:ci` after any change.
