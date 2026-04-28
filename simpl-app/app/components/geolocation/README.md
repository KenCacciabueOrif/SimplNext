> Last updated: 2026-04-28
> Changes: Initial README — documented geolocation folder structure, component responsibilities, hook contracts, and key code comment references.

# app/components/geolocation

Client-side geolocation infrastructure for the Simpl feed. This folder owns all GPS permission handling, coordinate persistence, feed refresh coordination, and URL navigation helpers needed to carry geolocation context across route transitions.

## Architecture Overview

The folder follows a strict separation of concerns:

- **Orchestration** — `GeoLocationManager.tsx` assembles sub-components and hooks. It is the only component that holds state and passes callbacks down.
- **Leaf components** — `GeoPermissionWatcher`, `GeoPeriodicLocationUpdater`, `GeoIndexedDbWriter`, `GeoFeedRefresher` each do exactly one thing and accept callbacks as props.
- **Hooks** — `useGeo*` hooks extract individual `useEffect` blocks from the orchestrator for readability and independent testability.
- **Pure helpers** — `browserState.ts`, `backLinkNavigation.ts`, `composerNavigation.ts`, `tabNavigation.ts` contain no React; all are pure-function modules covered by unit tests in `__tests__/`.
- **Storage layer** — `locationIndexedDb.ts` wraps IndexedDB access; `constants.ts` centralizes all storage keys and event names.
- **Types** — `types.ts` defines `ViewerLocationSnapshot`, `PermissionStateValue`, `SortPreferencesSnapshot`, and related helpers.

## Files

### Components

| File | Purpose |
|---|---|
| `GeoLocationManager.tsx` | Root orchestrator — owns permission + location state, mounts leaf sub-components and hooks. |
| `GeoPermissionWatcher.tsx` | Watches `navigator.permissions` changes and emits `PermissionStateValue` events passively (no automatic prompt on load). |
| `GeoPeriodicLocationUpdater.tsx` | Polls `navigator.geolocation.watchPosition` at a set interval once permission is granted. |
| `GeoIndexedDbWriter.tsx` | Writes the latest `ViewerLocationSnapshot` to IndexedDB whenever orchestration state changes. |
| `GeoFeedRefresher.tsx` | Listens for location events and refreshes SSR feed URL parameters to stay in sync with client GPS state. |

### Hooks

| File | Purpose |
|---|---|
| `useGeoIndexedDbSync.ts` | On `granted` permission, reads last-known location from IndexedDB and fires an immediate refresh. |
| `useGeoRouteRefresh.ts` | Re-emits the stored location snapshot on every route change so SSR data stays in sync without a fresh GPS callback. |
| `useGeoPagePermissionCheck.ts` | On home-page entry, queries `Permissions API` and fires `getCurrentPosition` immediately when already `granted`. |
| `useGeoVisibilityReconciler.ts` | Re-checks permission and location on `pageshow`, `visibilitychange`, `focus`, and `popstate` to handle tab-background/restore cycles. |
| `useGeoSort.ts` | Custom hook extracted from `SortBar.tsx` — owns permission listener, GPS acquisition, localStorage persistence, and router navigation for the tri-state sort UI. |

### Pure Helpers

| File | Purpose |
|---|---|
| `browserState.ts` | `localStorage`/`sessionStorage` read helpers for location snapshots, sort preferences, and distance-mode recovery. SSR-safe. |
| `backLinkNavigation.ts` | Builds a geo-aware back-link href that restores active coordinates and distance mode from browser state when returning from a thread or comment page. |
| `composerNavigation.ts` | Builds a sanitized navigation query for `PostComposer`/`ThreadReplyComposer` form submissions, merging URL state with the live GPS snapshot. |
| `tabNavigation.ts` | Builds Home and Moderation tab href values preserving sort and geolocation context across deep navigation. |

### Storage & Types

| File | Purpose |
|---|---|
| `constants.ts` | All shared string keys: localStorage keys, IndexedDB names, cookie keys, custom event names. |
| `locationIndexedDb.ts` | `readLocationSnapshotFromIndexedDb` and `writeLocationSnapshotToIndexedDb` — IndexedDB persistence helpers. |
| `types.ts` | Canonical client-side geolocation contracts: `ViewerLocationSnapshot`, `PermissionStateValue`, `SortPreferencesSnapshot`, and conversion helpers (`toStoredLocation`, `toDisabledLocation`). |

## Sub-folders

- [`__tests__/`](__tests__/) — Unit tests for all pure helpers (`backLinkNavigation`, `browserState`, `composerNavigation`, `tabNavigation`).

## Key Code Comments

- [`GeoPermissionWatcher.tsx` L28–29](GeoPermissionWatcher.tsx#L28) — Explains why prompting is passive (no automatic `getCurrentPosition` on load).
- [`GeoFeedRefresher.tsx` L68–69](GeoFeedRefresher.tsx#L68) — Explains stale-URL recovery logic when returning from cached pages.
- [`useGeoSort.ts` L1–11](useGeoSort.ts#L1) — Documents extraction rationale and what was removed from `SortBar.tsx`.
- [`constants.ts`](constants.ts) — Single source of truth for all storage keys; changing a key here propagates to all components.

## Maintenance Steps

1. Add new storage keys to `constants.ts` only — never hard-code them in components.
2. New geolocation behavior should be extracted as a dedicated `useGeo*` hook, not added inline to `GeoLocationManager.tsx`.
3. Every pure helper (no React imports) must have a corresponding test in `__tests__/`.
4. Keep `types.ts` as the single source for geolocation type definitions; do not re-declare `SortMode` or `ViewerLocationSnapshot` elsewhere.
5. Run `npm run quality:ci` after any change to this folder.
