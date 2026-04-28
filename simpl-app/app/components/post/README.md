> Last updated: 2026-04-28
> Changes: Initial README — documented post component responsibilities, optimistic queue/state architecture, and key code comment references.

# app/components/post

Post presentation and interaction layer for the Simpl feed. This folder owns the visual card rendering (`PostCard`), all reaction and moderation interaction controls (`PostActionControls`), and the browser-side optimistic action queue that decouples UI feedback from server round-trips.

## Architecture Overview

The optimistic update system is split across three layers:

1. **Types** — `postActionQueueTypes.ts` defines the queue item shapes and runtime validator with no side effects.
2. **Queue** — `postActionQueue.ts` persists queued actions to `localStorage`, replays them in order against server actions, and notifies listeners on state changes.
3. **State helpers** — `postActionState.ts` provides pure functions that compute local UI state by applying a reaction or moderation vote to an existing `PostActionState`, without touching the queue or React.

`PostActionControls.tsx` connects these layers to React: it initializes local state from the queue, applies optimistic updates via `postActionState.ts`, and enqueues the action via `postActionQueue.ts`. `PostCard.tsx` composes the layout and delegates interaction entirely to `PostActionControls`.

## Files

| File | Purpose |
|---|---|
| `PostCard.tsx` | Present a Simpl post with its metadata, reaction counts, status badge, and action controls. Supports `feed`, `thread`, `thread-main`, and `moderation` display modes. |
| `PostActionControls.tsx` | Handle Like/DisLike/Good/Bad/Report interactions with immediate optimistic UI feedback while server actions complete asynchronously. |
| `postActionQueue.ts` | Store pending post actions in `localStorage`, replay them in chronological order against server actions, and notify listeners when the backend confirms each action. |
| `postActionQueueTypes.ts` | Type declarations (`ReactionQueueItem`, `ModerationQueueItem`, `QueuedPostAction`) and `isQueuedPostAction` runtime validator for the queue module. |
| `postActionState.ts` | Pure functions (`applyReactionLocally`, `applyModerationLocally`, `mergeServerState`) for computing `OptimisticPostState` from incoming actions before server acknowledgements. |

## Test Files

| File | Covers |
|---|---|
| `postActionQueue.test.ts` | Queue persistence, retry behavior, flush, listener notification (15 tests). |
| `postActionState.test.ts` | Optimistic state mutations for all reaction and moderation branches. |

## Key Code Comments

- [`postActionState.ts` L11–24](postActionState.ts#L11) — Section headers for the shared state shape and pure helper functions; explains the contract between this module and `PostActionControls`.
- [`postActionQueue.ts` L22–27](postActionQueue.ts#L22) — `STORAGE_KEY` definition and queue persistence rationale.
- [`PostActionControls.tsx` L1–7](PostActionControls.tsx#L1) — Documents the deliberate choice to stop merging delayed server-ack state into the local card so counts stay stable until reload.

## Maintenance Steps

1. Keep `postActionQueueTypes.ts` free of side effects — only types and the `isQueuedPostAction` validator.
2. Add new action types to `postActionQueueTypes.ts` first, then extend `postActionQueue.ts` and `postActionState.ts`.
3. Every change to `postActionState.ts` or `postActionQueue.ts` must be covered by a corresponding test update.
4. `PostCard.tsx` must not import directly from `postActionQueue.ts` — interaction handling lives in `PostActionControls.tsx` only.
5. Run `npm run quality:ci` after any change.
