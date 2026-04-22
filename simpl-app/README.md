> Last updated: 2026-04-22
> Changes: Implemented tri-state multi-filter sorting (Popularity/Date/Distance) with combined ranking by averaged normalized filter ranks across feed, thread replies, and moderation queue.
> Last updated: 2026-04-22
> Changes: Switched post actions to an instant local update flow backed by a browser-persisted chronological queue, aligned Good/Bad with Like/DisLike toggle-off behavior, restored Report on the main thread post, constrained thread pages so the main post and replies scroll together, made the thread reply composer collapsible and hidden by default, and moved reported comments out of normal thread lists.
> Last updated: 2026-04-22
> Changes: Implemented the vote-threshold moderation policy (including hard delete), added reporter-specific homepage filtering, and kept the existing instant action-feedback/thread UX improvements.

# Simpl.

Local social network with community moderation.

## Purpose

- Rebuild the original Simpl prototype inside a single Next.js application.
- Keep the product behavior centered on local posts, replies, reactions, and community moderation.
- Use Prisma with PostgreSQL as the persistence layer for the new implementation.

## Current Implementation

- Main feed on [app/page.tsx](app/page.tsx).
- Thread page on [app/posts/[id]/page.tsx](app/posts/%5Bid%5D/page.tsx).
- Thread page sort controls on [app/components/SortBar.tsx](app/components/SortBar.tsx).
- Collapsible thread reply composer on [app/components/ThreadReplyComposer.tsx](app/components/ThreadReplyComposer.tsx).
- Post creation page on [app/posts/new/page.tsx](app/posts/new/page.tsx).
- Moderation queue on [app/moderation/page.tsx](app/moderation/page.tsx).
- Server actions on [app/actions.ts](app/actions.ts).
- Legacy-style top tabs on [app/components/AppTabs.tsx](app/components/AppTabs.tsx).
- Legacy-style sort row on [app/components/SortBar.tsx](app/components/SortBar.tsx).
- Local-first Like/DisLike/Good/Bad controls on [app/components/PostActionControls.tsx](app/components/PostActionControls.tsx).
- Browser-persisted chronological action queue on [app/components/postActionQueue.ts](app/components/postActionQueue.ts).
- Shared post queries and anonymous actor helpers on [lib/simpl.ts](lib/simpl.ts).
- Prisma client setup on [lib/prisma.ts](lib/prisma.ts).
- Prisma domain schema on [prisma/schema.prisma](prisma/schema.prisma).
- Seed data on [prisma/seed.ts](prisma/seed.ts).

## Architecture Notes

- The app uses anonymous actors stored through a stable server-side cookie and persisted in PostgreSQL.
- Posts and replies share the same `Post` model through a self-relation.
- Reactions and moderation votes are normalized into separate tables instead of storing user arrays on the post record.
- Reaction and moderation clicks now update the card immediately, are stored chronologically in browser storage, and are replayed asynchronously to the backend.
- Like/DisLike and Good/Bad now share the same second-click cancellation behavior.
- Moderation now uses vote thresholds and ratios: below ten moderation votes the post stays in moderation while remaining homepage-visible; at ten or more votes, ratio rules decide delete, moderation exit, or moderation persistence.
- Reporters are filtered out from homepage visibility while their REMOVE vote remains active on a post.
- The main thread post now exposes the Report action in comment mode.
- Feed, thread replies, and moderation queue now use tri-state filters for Popularity/Date/Distance (down, up, off) that can run simultaneously.
- Combined ordering is computed as the average of normalized per-filter ranks, with equal weights and stable tie-breakers.
- When Distance is active, posts without coordinates are always placed at the end of the list.
- The main thread post still scrolls with replies in the same pane.
- Reported comments are removed from normal thread reply lists and remain accessible from moderation, where opening a comment still provides Back to parent context navigation.
- The thread reply composer now starts collapsed and can be toggled open without shrinking the replies viewport by default.
- The new Simpl tables are isolated from the earlier demo schema through dedicated table names.
- The visual shell now follows the original Simpl prototype much more closely: centered title bar, Home/Moderation tabs, sort row, stacked post cards, and black/white borders.
- The layout now adapts more cleanly to narrow, medium, and wide windows while keeping the same legacy visual language.
- The `Distance` sort now uses browser geolocation and real post coordinates instead of a placeholder value.

## Important Code Comments

- [app/actions.ts](app/actions.ts): server-side mutation entry point that now returns canonical action state for fast client reconciliation.
- [lib/simpl.ts](lib/simpl.ts): shared moderation policy evaluator, visibility filtering, and tri-state aggregate ranking helpers.
- [app/components/PostActionControls.tsx](app/components/PostActionControls.tsx): client-side action controls that update immediately and subscribe to backend acknowledgements from the browser queue.
- [app/components/SortBar.tsx](app/components/SortBar.tsx): shared sort controls used by the feed, moderation queue, and thread replies.
- [app/components/ThreadReplyComposer.tsx](app/components/ThreadReplyComposer.tsx): client-side toggle wrapper that keeps the thread reply form hidden until the user opens it.
- [app/components/postActionQueue.ts](app/components/postActionQueue.ts): browser-side queue that persists action clicks and flushes them in chronological order.
- [lib/simpl.ts](lib/simpl.ts): server-side query helpers and actor identity helpers.
- [prisma/schema.prisma](prisma/schema.prisma): PostgreSQL Simpl data model.
- [lib/prisma.ts](lib/prisma.ts): shared Prisma client lifecycle.

## Run Steps

1. Install dependencies with `npm install`.
2. Ensure `DATABASE_URL` is set in `.env`.
3. Synchronize the schema with `npx prisma db push`.
4. Seed development data with `npx prisma db seed`.
5. Start the app with `npm run dev`.

## Seed Coverage

- The seed now creates more than twenty posts in total.
- It includes root posts, reply chains, liked/disliked items, and multiple moderation states.
- This larger dataset is intended to make responsive feed and thread testing much more realistic.
- It also includes dedicated moderation scenario posts for each vote-threshold branch:
1. total votes below 10 (visible on home + moderation)
2. one-vote trigger to reach total votes >= 10 with bad >= 2x good (hard delete)
3. one-vote trigger to reach total votes >= 10 with good >= 2x bad (home-only, out of moderation)
4. one-vote trigger to reach total votes >= 10 with bad > good (moderation-only)
5. one-vote trigger to reach total votes >= 10 with good >= bad without 2x (home + moderation)
6. reporter-specific homepage hiding while REMOVE is active, with one-vote toggle verification

## Maintenance Steps

1. Update this README whenever routes, schema responsibilities, or major data flows change.
2. Keep `prisma/schema.prisma` and `prisma/seed.ts` aligned when new required fields are introduced.
3. Document any new top-level page or server action entry point here.
4. Keep generated folders such as `.next` and `node_modules` out of the documentation scope.

## Known Constraint

- The local editor reports a Prisma schema warning about `datasource.url` because the Prisma extension expects a newer configuration style. The installed Prisma CLI for this project still requires the datasource URL in `schema.prisma`, and the actual build passes with the current setup.

## Todo

- Refine the distance fallback UX when geolocation is denied or unavailable.
- Add richer thread navigation for deeper reply trees.
- Add a clearer moderation policy UI and status explanations.


