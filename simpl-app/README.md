> Last updated: 2026-04-28
> Changes: Report now uses the same optimistic post-action queue as Like/DisLike/Good/Bad, and reported cards are hidden immediately for the reporting viewer without waiting for a route reload.
> Last updated: 2026-04-28
> Changes: Fixed a production hydration mismatch on Vercel by making post timestamp rendering deterministic in PostCard (UTC formatter instead of environment-dependent locale runtime output).
> Last updated: 2026-04-27
> Changes: Started next cleanup phase by removing deprecated `vite-tsconfig-paths` usage in Vitest config and switching to native `resolve.tsconfigPaths` support to eliminate test-run warning noise.
> Last updated: 2026-04-27
> Changes: Phase 1 — reorganized `app/components` by domain (`layout`, `post`, `composer`, `sort`, `geolocation`) and updated imports/tests references accordingly.
> Last updated: 2026-04-27
> Changes: Started global-cleanup implementation phase 0 with enforceable quality gates: Husky pre-commit checks, lint-staged, staged related Vitest execution, CI PR workflow, and a 200-line file-length guard with temporary baseline exceptions.
> Last updated: 2026-04-27
> Changes: Deferred list reordering after Like/DisLike and Good/Bad: clicked cards still update instantly, but feed/thread/moderation ordering now refreshes only after explicit reload or sort navigation.
> Last updated: 2026-04-27
> Changes: Fixed Home tab behavior to preserve/restore active geolocation context (distance + coordinates) from thread/comment pages, and added tabNavigation regression tests.
> Last updated: 2026-04-27
> Changes: Added regression-testable pure geolocation navigation helpers (`composerNavigation.ts`, `backLinkNavigation.ts`) and expanded the Vitest suite to 93 tests across 7 files, including publish/back-return distance-context scenarios.
> Last updated: 2026-04-27
> Changes: Fixed geolocation navigation-context loss that could reset Distance to `off` after publish/thread navigation; PostComposer now preserves existing query coordinates when live snapshot loading is pending, GeoAwareBackLink now restores coordinates from persisted snapshot even if activity marker is stale, and added browserState helper tests for distance-mode recovery.
> Last updated: 2026-04-27
> Changes: Phase 4 — Lint enforcement + test suite: added @typescript-eslint/no-explicit-any and consistent-type-imports ESLint rules; installed Vitest with path-alias support; 69 tests across 4 files covering lib/policy.ts, lib/navigation.ts, lib/sorting.ts, and app/components/postActionState.ts (all pure functions).
> Last updated: 2026-04-27
> Changes: Phase 3 — UI decomposition: extracted pure optimistic-state helpers (applyReactionLocally, applyModerationLocally, mergeServerState) from PostActionControls into postActionState.ts; collapsed duplicated permission handler in GeoLocationManager into a single applyPermissionState useCallback; extracted requestCurrentPosition helper in SortBar to eliminate duplicated getCurrentPosition options blocks.
> Last updated: 2026-04-24
> Changes: Phase 2 — Modularized lib/simpl.ts into dedicated domain modules: pure sorting in lib/sorting.ts, moderation policy in lib/policy.ts, URL navigation helpers in lib/navigation.ts. Domain types consolidated in lib/types.ts. app/actions.ts now imports from lib/navigation.ts and lib/policy.ts instead of duplicating those helpers locally.
> Last updated: 2026-04-24
> Changes: Added browser/Next cache-restore reconciliation hooks (`pageshow`, `visibilitychange`, `focus`, `popstate`) so geolocation permission and feed distance context are rechecked even when navigation restores a cached page state.
> Last updated: 2026-04-24
> Changes: Added explicit permission re-test on home page entry: if geolocation is already authorized, the app immediately reapplies GPS distance behavior (`distance=down` with coordinates). If not authorized, the distance mode remains `=` and the dedicated geolocation request button stays visible.
> Last updated: 2026-04-24
> Changes: Added route-change geolocation resynchronization in the global manager so returning from thread/comment pages reapplies the latest persisted location snapshot to URL and feed sorting, even without a fresh browser geolocation callback.
> Last updated: 2026-04-24
> Changes: Added explicit browser persistence for geolocation active/inactive state and used stored sort preferences to recover stale `distance=off` query values when returning from comment pages while geolocation is active.
> Last updated: 2026-04-24
> Changes: Added geo-aware back navigation links that restore active location context from browser state when returning from comment threads, preventing unintended fallback to `GPS off` on the home feed.
> Last updated: 2026-04-24
> Changes: Geolocation consent prompting is now passive on first load: the app no longer triggers browser permission dialogs automatically, and the consent request is initiated only when the user presses the dedicated activation button.
> Last updated: 2026-04-24
> Changes: Fixed initial distance sort default behavior so Distance now starts in `off` (`=`) when no viewer location is available, and switches to `down` automatically once geolocation is accepted and coordinates are present.
> Last updated: 2026-04-24
> Changes: Added strict geolocation state separation (`prompt` vs `denied`) in the sort UX, including an explicit user-triggered GPS activation control for pending permission state and a dedicated refusal guidance message.
> Last updated: 2026-04-24
> Changes: Restored first-visit geolocation consent prompting in the permission watcher when browser state is `prompt`, and added periodic permission-state reconciliation for browsers that do not reliably emit permission change events.
> Last updated: 2026-04-24
> Changes: Replaced the geolocation flow with a modular 4-component orchestration: permission watcher, periodic updater, IndexedDB writer, and feed refresher. App bootstrap now restores location from IndexedDB when permission is granted.
> Last updated: 2026-04-24
> Changes: Enforced automatic distance=down activation when GPS coordinates become available (while preserving explicit distance=off), and hardened post/comment creation navigation context serialization to prevent loss of GPS distance state after redirects.
> Last updated: 2026-04-24
> Changes: Added resilient geolocation URL synchronization using browser history replacement + route refresh, and persisted sort preferences in local storage so GPS auto-activation can restore the user distance mode even when URL parameters are initially missing.
> Last updated: 2026-04-24
> Changes: Fixed geolocation reactivation after delayed browser permission grant and preserved feed/thread sort + GPS query context through post/comment creation redirects.
> Last updated: 2026-04-24
> Changes: Geolocation sync now bootstraps from browser storage, requests an immediate one-shot location on load/route change, and refreshes URL coordinates on each meaningful position change.
> Last updated: 2026-04-22
> Changes: Fixed distance-filter activation after geolocation approval by adding click-time geolocation fallback and preventing transient watcher errors from disabling known location state.
> Last updated: 2026-04-22
> Changes: Added automatic geolocation bootstrap on app load, continuous location refresh while active, automatic coordinate injection for new posts/replies, and explicit inactive-location fallback handling.
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
- Thread page sort controls on [app/components/sort/SortBar.tsx](app/components/sort/SortBar.tsx).
- Collapsible thread reply composer on [app/components/composer/ThreadReplyComposer.tsx](app/components/composer/ThreadReplyComposer.tsx).
- Post creation page on [app/posts/new/page.tsx](app/posts/new/page.tsx).
- Moderation queue on [app/moderation/page.tsx](app/moderation/page.tsx).
- Server actions on [app/actions.ts](app/actions.ts).
- Legacy-style top tabs on [app/components/layout/AppTabs.tsx](app/components/layout/AppTabs.tsx).
- Legacy-style sort row on [app/components/sort/SortBar.tsx](app/components/sort/SortBar.tsx).
- Geolocation orchestrator on [app/components/geolocation/GeoLocationManager.tsx](app/components/geolocation/GeoLocationManager.tsx).
- Geo-aware back link helper on [app/components/layout/GeoAwareBackLink.tsx](app/components/layout/GeoAwareBackLink.tsx).
- Geolocation permission watcher on [app/components/geolocation/GeoPermissionWatcher.tsx](app/components/geolocation/GeoPermissionWatcher.tsx).
- Geolocation periodic updater on [app/components/geolocation/GeoPeriodicLocationUpdater.tsx](app/components/geolocation/GeoPeriodicLocationUpdater.tsx).
- Geolocation IndexedDB writer on [app/components/geolocation/GeoIndexedDbWriter.tsx](app/components/geolocation/GeoIndexedDbWriter.tsx).
- Geolocation feed refresher on [app/components/geolocation/GeoFeedRefresher.tsx](app/components/geolocation/GeoFeedRefresher.tsx).
- Geolocation IndexedDB helpers on [app/components/geolocation/locationIndexedDb.ts](app/components/geolocation/locationIndexedDb.ts).
- Geolocation browser-state helpers on [app/components/geolocation/browserState.ts](app/components/geolocation/browserState.ts).
- Composer navigation-query helper on [app/components/geolocation/composerNavigation.ts](app/components/geolocation/composerNavigation.ts).
- Geo-aware back-link query helper on [app/components/geolocation/backLinkNavigation.ts](app/components/geolocation/backLinkNavigation.ts).
- Home-tab navigation helper on [app/components/geolocation/tabNavigation.ts](app/components/geolocation/tabNavigation.ts).
- Root loading skeleton on [app/loading.tsx](app/loading.tsx).
- Root error boundary on [app/error.tsx](app/error.tsx).
- Geolocation + sort hook on [app/components/geolocation/useGeoSort.ts](app/components/geolocation/useGeoSort.ts).
- Haversine distance math on [lib/geo.ts](lib/geo.ts).
- Local-first Like/DisLike/Good/Bad controls on [app/components/post/PostActionControls.tsx](app/components/post/PostActionControls.tsx).
- Pure optimistic-state helpers for post actions on [app/components/post/postActionState.ts](app/components/post/postActionState.ts).
- Shared post queries and anonymous actor helpers on [lib/simpl.ts](lib/simpl.ts).
- Domain types (SortMode, FeedSortState, ViewerLocation, ModerationPolicyOutcome, PostListItem) on [lib/types.ts](lib/types.ts).
- Pure tri-state sorting algorithms and aggregate rank engine on [lib/sorting.ts](lib/sorting.ts).
- Vote-threshold moderation policy evaluator on [lib/policy.ts](lib/policy.ts).
- URL navigation query builder on [lib/navigation.ts](lib/navigation.ts).
- Prisma client setup on [lib/prisma.ts](lib/prisma.ts).
- Prisma domain schema on [prisma/schema.prisma](prisma/schema.prisma).
- Seed data on [prisma/seed.ts](prisma/seed.ts).

## Architecture Notes

- The app uses anonymous actors stored through a stable server-side cookie and persisted in PostgreSQL.
- Posts and replies share the same `Post` model through a self-relation.
- Reactions and moderation votes are normalized into separate tables instead of storing user arrays on the post record.
- Global cleanup (2026-04-27): extracted `useGeoSort` hook from SortBar; moved geo math to `lib/geo.ts`; moved URL/feed-sort helpers to `lib/navigation.ts`; unified duplicate types in `lib/types.ts`; added root `loading.tsx` + `error.tsx`; added OWASP security headers in `next.config.ts`; coverage expanded to 118 tests.
- Reaction and moderation clicks now update the card immediately, are stored chronologically in browser storage, and are replayed asynchronously to the backend.
- Feed, thread-reply, and moderation lists no longer rerender immediately after reaction or moderation votes, so viewport order stays stable until the user reloads or changes sort settings.
- Like/DisLike and Good/Bad now share the same second-click cancellation behavior.
- Moderation now uses vote thresholds and ratios: below ten moderation votes the post stays in moderation while remaining homepage-visible; at ten or more votes, ratio rules decide delete, moderation exit, or moderation persistence.
- Reporters are filtered out from homepage visibility while their REMOVE vote remains active on a post.
- The main thread post now exposes the Report action in comment mode.
- Feed, thread replies, and moderation queue now use tri-state filters for Popularity/Date/Distance (down, up, off) that can run simultaneously.
- Combined ordering is computed as the average of normalized per-filter ranks, with equal weights and stable tie-breakers.
- When Distance is active, posts without coordinates are always placed at the end of the list.
- Geolocation permission is now requested automatically when the app connects, and viewer coordinates are refreshed continuously while permission remains active.
- Viewer location is now persisted in IndexedDB and synchronized to URL coordinates so distance sorting updates with movement over time.
- Geolocation concerns are split into dedicated components: permission policy watcher, periodic updater, IndexedDB persistence, and feed refresh synchronizer.
- Geolocation browser-state parsing (sort preferences + location snapshot + distance-mode recovery) is now centralized in a single shared helper file to avoid copy/paste drift.
- Geolocation now listens to browser permission-state changes and auto-retries location acquisition when access is granted after an initial deny/prompt flow.
- New posts and thread replies no longer ask for manual latitude/longitude fields and instead automatically submit live viewer coordinates when location is active.
- Post and reply creation now preserve the active navigation context (Popularity/Date/Distance + coordinates) across redirects so distance labels do not disappear after publishing.
- Post/reply composer now keeps existing URL coordinates during temporary snapshot-loading gaps so submit-time redirects do not accidentally drop geolocation context and reset Distance to `=`.
- Geo-aware back navigation now restores coordinates from the persisted location snapshot even if the activity marker is temporarily stale.
- Home-tab navigation now restores geolocation context with the same rules as back links, so clicking Home from thread/comment pages does not reset Distance to `=` while GPS is active.
- If geolocation is disabled, denied, or unavailable, coordinates are omitted by default and distance sorting gracefully falls back to non-distance ordering.
- The main thread post still scrolls with replies in the same pane.
- Reported comments are removed from normal thread reply lists and remain accessible from moderation, where opening a comment still provides Back to parent context navigation.
- The thread reply composer now starts collapsed and can be toggled open without shrinking the replies viewport by default.
- The new Simpl tables are isolated from the earlier demo schema through dedicated table names.
- The visual shell now follows the original Simpl prototype much more closely: centered title bar, Home/Moderation tabs, sort row, stacked post cards, and black/white borders.
- The layout now adapts more cleanly to narrow, medium, and wide windows while keeping the same legacy visual language.
- The `Distance` sort now uses browser geolocation and real post coordinates instead of a placeholder value.
- Global cleanup phase 0 now enforces local + CI quality gates: pre-commit checks (`check:file-length`, lint-staged, `test:related-staged`) and PR workflow checks (`check:file-length`, lint, tests, build).
- The 200-line file policy is active for source folders, with temporary baseline exceptions documented in `scripts/file-length-config.mjs` until decomposition phases complete.

## Important Code Comments

- [app/actions.ts](app/actions.ts): server-side mutation entry point that returns canonical action state for fast client reconciliation. Navigation query building is delegated to lib/navigation.ts; moderation policy to lib/policy.ts; vote actions no longer force immediate route revalidation, so list order stays stable until explicit navigation.
- [lib/simpl.ts](lib/simpl.ts): server-side Prisma queries, anonymous actor management, and sort-state resolution. Pure algorithms and types have been extracted to lib/sorting.ts, lib/policy.ts, lib/types.ts.
- [lib/types.ts](lib/types.ts): canonical domain types shared across all server and client modules.
- [lib/sorting.ts](lib/sorting.ts): pure tri-state ranking engine — individual comparators and aggregate normalized rank averaging.
- [lib/policy.ts](lib/policy.ts): vote-threshold moderation policy — threshold constants and outcome evaluator.
- [lib/navigation.ts](lib/navigation.ts): server-side URL navigation query sanitizer and composer for post/reply redirects.
- [app/components/post/PostActionControls.tsx](app/components/post/PostActionControls.tsx): client-side action controls that update immediately and subscribe to backend acknowledgements from the browser queue.
- [app/components/sort/SortBar.tsx](app/components/sort/SortBar.tsx): shared sort controls used by the feed, moderation queue, and thread replies.
- [app/components/composer/ThreadReplyComposer.tsx](app/components/composer/ThreadReplyComposer.tsx): client-side toggle wrapper that keeps the thread reply form hidden until the user opens it.
- [app/components/geolocation/GeoLocationManager.tsx](app/components/geolocation/GeoLocationManager.tsx): global client bootstrap for geolocation permissions, live watcher updates, and URL/storage synchronization.
- [app/components/layout/GeoAwareBackLink.tsx](app/components/layout/GeoAwareBackLink.tsx): client-side back link that restores missing geolocation params from browser state.
- [app/components/geolocation/GeoPermissionWatcher.tsx](app/components/geolocation/GeoPermissionWatcher.tsx): listens to browser permission-policy transitions and emits granted/prompt/denied updates.
- [app/components/geolocation/GeoPeriodicLocationUpdater.tsx](app/components/geolocation/GeoPeriodicLocationUpdater.tsx): polls geolocation periodically while permission remains granted.
- [app/components/geolocation/GeoIndexedDbWriter.tsx](app/components/geolocation/GeoIndexedDbWriter.tsx): persists latest viewer position snapshots into IndexedDB.
- [app/components/geolocation/GeoFeedRefresher.tsx](app/components/geolocation/GeoFeedRefresher.tsx): applies location updates to query params and forces SSR refresh.
- [app/components/geolocation/browserState.ts](app/components/geolocation/browserState.ts): shared browser-state parsing helpers used by geolocation-aware client components.
- [app/components/geolocation/composerNavigation.ts](app/components/geolocation/composerNavigation.ts): pure navigation-query builder that preserves distance/geolocation context for post/reply submissions.
- [app/components/geolocation/backLinkNavigation.ts](app/components/geolocation/backLinkNavigation.ts): pure geo-aware back-link query restorer used by GeoAwareBackLink.
- [app/components/geolocation/tabNavigation.ts](app/components/geolocation/tabNavigation.ts): pure Home-tab query builder that preserves/restores geolocation and sort context.
- [app/components/geolocation/locationIndexedDb.ts](app/components/geolocation/locationIndexedDb.ts): low-level IndexedDB read/write helpers for location state.
- [app/components/post/postActionQueue.ts](app/components/post/postActionQueue.ts): browser-side queue that persists action clicks and flushes them in chronological order.
- [lib/geo.ts](lib/geo.ts): pure Haversine distance calculator — no I/O or framework dependencies.
- [app/components/geolocation/useGeoSort.ts](app/components/geolocation/useGeoSort.ts): custom hook encapsulating permission-state listening, GPS acquisition, and router navigation for SortBar.
- [app/loading.tsx](app/loading.tsx): root Next.js loading skeleton — shown by Suspense while async Server Components stream.
- [app/error.tsx](app/error.tsx): root Next.js error boundary — catches RSC/Prisma errors and provides a retry control.
- [next.config.ts](next.config.ts): OWASP security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP) applied to every route.
- [app/components/post/postActionState.ts](app/components/post/postActionState.ts): pure optimistic-state helpers (applyReactionLocally, applyModerationLocally, mergeServerState) used by PostActionControls.
- [app/components/post/PostActionControls.tsx](app/components/post/PostActionControls.tsx): client-side action controls that update immediately and subscribe to backend acknowledgements from the browser queue.
- [lib/simpl.ts](lib/simpl.ts): server-side query helpers and actor identity helpers. Re-exports types from lib/types.ts and evaluateModerationPolicy from lib/policy.ts for backward compatibility.
- [prisma/schema.prisma](prisma/schema.prisma): PostgreSQL Simpl data model.
- [lib/prisma.ts](lib/prisma.ts): shared Prisma client lifecycle.
- [scripts/check-file-length.mjs](scripts/check-file-length.mjs): source-file size guard that enforces the cleanup line threshold for app/lib/prisma/scripts.
- [scripts/file-length-config.mjs](scripts/file-length-config.mjs): centralized threshold + temporary exception baseline to support incremental decomposition.
- [scripts/run-related-tests.mjs](scripts/run-related-tests.mjs): staged-file-aware Vitest runner used by pre-commit for targeted safety checks.
- [.husky/pre-commit](.husky/pre-commit): local commit gate chaining file-length, staged lint, and related tests.
- [../.github/workflows/quality-gates.yml](../.github/workflows/quality-gates.yml): pull-request quality workflow that enforces the same gates in CI.

## Test Suite

Run with `npm test` (single pass) or `npm run test:watch` (interactive).

- [lib/\_\_tests\_\_/policy.test.ts](lib/__tests__/policy.test.ts): 11 tests — all branches of `evaluateModerationPolicy`.
- [lib/\_\_tests\_\_/navigation.test.ts](lib/__tests__/navigation.test.ts): 28 tests — `parseSortModeValue`, `buildNavigationQuery`, `withNavigationQuery`.
- [lib/\_\_tests\_\_/sorting.test.ts](lib/__tests__/sorting.test.ts): 14 tests — individual comparators and `sortPostsByAggregateRanks`.
- [app/components/post/postActionState.test.ts](app/components/post/postActionState.test.ts): 16 tests — `applyReactionLocally`, `applyModerationLocally`, `mergeServerState`.
- [app/components/geolocation/\_\_tests\_\_/browserState.test.ts](app/components/geolocation/__tests__/browserState.test.ts): 17 tests — `normalizeSortMode`, `parseLocationSnapshot`, `readSortPreferences`, `ensureDistanceModeFromPreferences`.
- [app/components/geolocation/\_\_tests\_\_/composerNavigation.test.ts](app/components/geolocation/__tests__/composerNavigation.test.ts): 4 tests — composer navigation query composition and coordinate-preservation behavior.
- [app/components/geolocation/\_\_tests\_\_/backLinkNavigation.test.ts](app/components/geolocation/__tests__/backLinkNavigation.test.ts): 3 tests — back-link geolocation query restoration and stale activity-marker fallback.
- [app/components/geolocation/\_\_tests\_\_/tabNavigation.test.ts](app/components/geolocation/__tests__/tabNavigation.test.ts): 3 tests — Home-tab geolocation restoration and query sanitization.
- [app/components/post/postActionQueue.test.ts](app/components/post/postActionQueue.test.ts): 15 tests — `enqueueReaction`, `enqueueModerationVote`, flush success/failure/offline, subscriber notifications, chronological ordering.
- [lib/\_\_tests\_\_/geo.test.ts](lib/__tests__/geo.test.ts): 7 tests — `calculateDistanceKm` null-guard, same-location, known coordinate pairs, symmetry.
- [app/components/geolocation/\_\_tests\_\_/testHelpers.ts](app/components/geolocation/__tests__/testHelpers.ts): shared `installMockLocalStorage` utility used by all geolocation test files.

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
5. Keep `scripts/file-length-config.mjs` exception entries temporary and remove them as each oversized module is decomposed.
6. Keep local and CI quality gates aligned: `.husky/pre-commit`, `package.json` scripts, and `../.github/workflows/quality-gates.yml`.

## Known Constraint

- The local editor reports a Prisma schema warning about `datasource.url` because the Prisma extension expects a newer configuration style. The installed Prisma CLI for this project still requires the datasource URL in `schema.prisma`, and the actual build passes with the current setup.

## Todo

- Refine the distance fallback UX when geolocation is denied or unavailable.
- Add richer thread navigation for deeper reply trees.
- Add a clearer moderation policy UI and status explanations.



