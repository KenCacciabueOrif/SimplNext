/**
 * Last updated: 2026-04-27
 * Changes: Reduced to a re-export barrel; logic moved to lib/actor.ts and lib/queries.ts.
 * Purpose: Backward-compatibility shim — new code should import from the canonical modules.
 */

// Types — re-export from the canonical source.
export type { FeedSortState, ModerationPolicyOutcome, PostListItem, SortMode, ViewerLocation } from "@/lib/types";

// Navigation/policy convenience shims — kept for consumers that imported from this module.
export { DEFAULT_FEED_SORT_STATE, parseViewerLocation, resolveFeedSortState } from "@/lib/navigation";
export { evaluateModerationPolicy } from "@/lib/policy";

// Actor management.
export { ensureAnonymousActor, getViewerActor } from "@/lib/actor";

// Post queries.
export { getFeedPosts, getModerationQueue, getThreadPageData } from "@/lib/queries";