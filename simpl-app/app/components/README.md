> Last updated: 2026-04-28
> Changes: Initial README — documented component domain folders, organization rules, and links to domain READMEs.

# app/components

Client-side React components organized by feature domain. Each domain folder is self-contained with its own README, tests, and pure helper modules.

## Domain Folders

| Folder | Purpose |
|---|---|
| [`geolocation/`](geolocation/README.md) | All GPS permission handling, coordinate persistence, feed refresh coordination, and URL navigation helpers. |
| [`post/`](post/README.md) | Post card rendering, reaction/moderation interaction controls, and the browser-side optimistic action queue. |
| [`composer/`](composer/README.md) | Post and reply creation forms with live GPS coordinate capture. |
| [`layout/`](layout/README.md) | Persistent shell components: primary tab navigation and geo-aware back-links. |
| [`sort/`](sort/README.md) | Sort control bar — pure presentation component backed by the `useGeoSort` hook. |

## Organization Rules

1. Components are grouped by **feature domain**, not by technical type (no flat `components/` dumping).
2. Each domain folder must have a `README.md` describing its purpose, files, and maintenance rules.
3. Pure helper modules (no React imports) that serve a single domain live inside the domain folder, not in `lib/`.
4. Shared pure utilities used by multiple domains belong in `lib/`.
5. Tests for React components use `@testing-library/react` and live in a `__tests__/` subfolder or alongside the component as `*.test.tsx`.

## Maintenance Steps

1. When adding a new component, place it in the most specific domain folder that matches its feature area.
2. If no existing domain fits, create a new domain folder with a `README.md`.
3. Keep this overview README updated when domain folders are added or renamed.
4. Run `npm run quality:ci` after any structural change.
