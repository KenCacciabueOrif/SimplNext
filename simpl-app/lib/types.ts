/**
 * Last updated: 2026-04-24
 * Changes: Centralized all domain types previously scattered across lib/simpl.ts, app/actions.ts, and geolocation component types.
 * Purpose: Single source of truth for domain-level TypeScript types shared across server and client modules.
 */

import type { ModerationDecision, PostStatus, ReactionType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

export type SortMode = "down" | "up" | "off";

export type FeedSortState = {
  popularity: SortMode;
  date: SortMode;
  distance: SortMode;
};

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

export type ViewerLocation = {
  latitude: number;
  longitude: number;
};

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export type PostListItem = {
  id: string;
  title: string;
  body: string;
  authorDisplayName: string;
  parentId: string | null;
  rootId: string | null;
  latitude: number | null;
  longitude: number | null;
  likeCount: number;
  dislikeCount: number;
  reportCount: number;
  keepVoteCount: number;
  removeVoteCount: number;
  status: PostStatus;
  createdAt: Date;
  replyCount: number;
  distanceKm: number | null;
  viewerReaction: ReactionType | null;
  viewerModerationDecision: ModerationDecision | null;
};

// ---------------------------------------------------------------------------
// Moderation
// ---------------------------------------------------------------------------

export type ModerationPolicyOutcome = {
  totalVotes: number;
  shouldDelete: boolean;
  inModeration: boolean;
  visibleOnHomepage: boolean;
  status: PostStatus;
};
