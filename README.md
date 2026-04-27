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
- Moderation now follows vote-threshold and ratio rules, with hard-delete outcomes and reporter-specific homepage filtering while REMOVE is active.
- Global cleanup implementation has started in incremental mode, with the first pass focused on duplication reduction and dead-code removal before larger feature-folder refactors.

## Maintenance Steps

1. Keep the scope and implementation status in sync with [simpl-app/README.md](simpl-app/README.md).
2. Record major architecture changes here when the rebuild direction changes.
3. Update links if more subfolders are added to the rebuild workspace.

## Todo

- Add milestone notes as the rebuild reaches parity with the legacy prototype.
- Document deployment and environment handling once the runtime setup is stabilized.