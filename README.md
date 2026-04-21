> Last updated: 2026-04-21
> Changes: Kept the rebuild status in sync and added a follow-up todo for slow feedback on reaction and moderation buttons.

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

## Maintenance Steps

1. Keep the scope and implementation status in sync with [simpl-app/README.md](simpl-app/README.md).
2. Record major architecture changes here when the rebuild direction changes.
3. Update links if more subfolders are added to the rebuild workspace.

## Todo

- Add milestone notes as the rebuild reaches parity with the legacy prototype.
- Improve perceived refresh speed for Like, DisLike, Good, and Bad actions after submission.
- Document deployment and environment handling once the runtime setup is stabilized.