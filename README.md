> Last updated: 2026-04-27
> Changes: Implemented global-cleanup phase 1 in `simpl-app` by reorganizing `app/components` into domain folders (`layout`, `post`, `composer`, `sort`, `geolocation`) and updating all affected imports/tests references.
> Last updated: 2026-04-27
> Changes: Started global-cleanup implementation phase 0 by adding strict local quality gates (Husky + lint-staged + staged related tests), a CI PR workflow, and a 200-line file-length guard with documented temporary exceptions in `simpl-app`.
> Last updated: 2026-04-27
> Changes: Documented the vote-refresh change in `simpl-app`: Like/DisLike and Good/Bad keep instant local card feedback, but feed/thread/moderation list reordering now waits for an explicit reload or sort change.
> Last updated: 2026-04-27
> Changes: Documented the Home-tab geolocation-context persistence fix in `simpl-app`, so returning Home from thread/comment pages keeps Distance and coordinates when GPS is active.
> Last updated: 2026-04-27
> Changes: Documented the geolocation navigation-context fix delivered in `simpl-app` to prevent Distance from falling back to `=` after publish/thread return flows when permission is granted.
> Last updated: 2026-04-24
> Changes: Started the incremental global cleanup in `simpl-app` with first anti-spaghetti quick wins (dead-code removal and shared geolocation browser-state utility extraction).
> Last updated: 2026-04-22
> Changes: Documented the implemented moderation threshold policy, reporter-specific homepage filtering, and instant queued action feedback.

# SimplNext

This folder contains the active rebuild of Simpl with Next.js.

## Purpose

- Replace the older CRA + Express prototype with a unified Next.js application.
- Keep the new work isolated from the legacy prototype while preserving feature references.
- Drive the rebuild with Prisma and PostgreSQL instead of the legacy Mongoose stack.

## Contents

- [simpl-app](simpl-app/README.md): active application codebase.

## Current Status

- The first implementation base is in place.
- The app now has a normalized Prisma schema for anonymous actors, posts, reactions, and moderation votes.
- Feed, thread, post creation, and moderation pages are wired in the Next.js app.
- The shared layout and page composition are now being pushed closer to the original black-and-white Simpl interface.
- Reaction and moderation action buttons now update instantly, persist in a local browser queue, and sync asynchronously to the backend.
- Vote actions now keep their instant per-card feedback without forcing an immediate server list refresh, so feed, thread, and moderation ordering stay stable until reload or sort-button navigation.
- Moderation now follows vote-threshold and ratio rules, with hard-delete outcomes and reporter-specific homepage filtering while REMOVE is active.
- Global cleanup implementation has started in incremental mode, with the first pass focused on duplication reduction and dead-code removal before larger feature-folder refactors.
- Global cleanup phase 0 is now enforced by default in `simpl-app`: pre-commit gates, CI PR gates, and a file-length policy (200 lines) with temporary baseline exceptions tracked in code.
- Global cleanup phase 1 is complete: top-level components were reorganized by domain with synchronized import/test updates.

## Maintenance Steps

1. Keep the scope and implementation status in sync with [simpl-app/README.md](simpl-app/README.md).
2. Record major architecture changes here when the rebuild direction changes.
3. Update links if more subfolders are added to the rebuild workspace.
4. Keep CI and local gate descriptions aligned with `.github/workflows/quality-gates.yml` and `simpl-app/scripts/file-length-config.mjs`.
5. Keep folder-taxonomy documentation in sync with `simpl-app/README.md` whenever component files move between domain folders.

## Todo

- Add milestone notes as the rebuild reaches parity with the legacy prototype.
- Document deployment and environment handling once the runtime setup is stabilized.