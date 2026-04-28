> Last updated: 2026-04-28
> Changes: Initial README — documented server action modules, barrel entry point, shared helper contracts, and key code comment references.

# app/actions

Server-side Next.js actions for post creation, reaction toggling, and moderation voting. All modules use `"use server"` and are consumed by client components via the `app/actions.ts` barrel.

## Architecture Overview

During phase-2 cleanup, `app/actions.ts` was decomposed from a monolithic file into dedicated submodules. The barrel (`app/actions.ts`) remains as a single stable import point for consumers; new code may also import directly from the canonical submodules.

Shared helpers are kept separate from action logic:
- **`formUtils.ts`** handles `FormData` normalization — no Prisma, no business logic.
- **`txHelpers.ts`** handles Prisma transaction execution and post-action state reconciliation — no `FormData` parsing.

This separation keeps each module testable in isolation.

## Files

| File | Purpose |
|---|---|
| `postActions.ts` | Server actions for post and reply creation (`createPostAction`). Handles coordinate fallback from the navigation query when composer hidden fields are temporarily empty. |
| `reactionActions.ts` | Server action for toggling Like/Dislike reactions (`toggleReactionAction`). |
| `moderationActions.ts` | Server actions for casting and toggling moderation votes — Keep or Remove (`castModerationVoteAction`, `castModerationVoteFormAction`). |
| `formUtils.ts` | `normalizeText` and `parseOptionalFloat` — pure helpers for normalizing `FormData` entries before they reach Prisma. |
| `txHelpers.ts` | Prisma transaction helpers shared by reaction and moderation modules: `syncPostState` (reactions-only count sync) and `getViewerPostActionState`. |

### Barrel

| File | Purpose |
|---|---|
| `../actions.ts` | Re-export barrel — single stable import point for `createPostAction`, `toggleReactionAction`, `castModerationVoteAction`, and the `PostActionState` type. |

## Key Code Comments

- [`txHelpers.ts` L14–16](txHelpers.ts#L14) — Explains why reactions-only sync does not call `evaluateModerationPolicy`: calling it on posts with 0 moderation votes would reset their status incorrectly.
- [`postActions.ts` L1–5](postActions.ts#L1) — Documents the server-side coordinate fallback added to preserve localization through composer redirect flows.

## Maintenance Steps

1. New server actions belong in a new `*Actions.ts` file, not inline in `formUtils.ts` or `txHelpers.ts`.
2. Re-export new action symbols from `app/actions.ts` so existing consumers do not need to change import paths.
3. `formUtils.ts` must stay import-free of Prisma and domain logic — only `FormData` normalization.
4. `txHelpers.ts` must stay import-free of `FormData` — only Prisma transaction helpers.
5. Run `npm run quality:ci` after any change.
