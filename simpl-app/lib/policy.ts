/**
 * Last updated: 2026-04-24
 * Changes: Extracted moderation policy evaluation from lib/simpl.ts as a standalone testable module.
 * Purpose: Encapsulate vote-threshold and ratio rules that determine post visibility and deletion outcomes.
 */

import { PostStatus } from "@prisma/client";
import type { ModerationPolicyOutcome } from "@/lib/types";

// ---------------------------------------------------------------------------
// Policy thresholds — adjust here without touching query/sort logic
// ---------------------------------------------------------------------------

const MODERATION_THRESHOLD = 10;
const STRONG_MAJORITY_RATIO = 2;

// ---------------------------------------------------------------------------
// Policy evaluator
// ---------------------------------------------------------------------------

/**
 * Computes the moderation outcome for a post given its current vote counts.
 *
 * Rules (in priority order):
 *  1. Total votes < threshold → post stays UNDER_REVIEW, visible on homepage.
 *  2. remove >= STRONG_MAJORITY_RATIO × keep → hard delete (REMOVED).
 *  3. keep >= STRONG_MAJORITY_RATIO × remove → post cleared (ACTIVE), removed from moderation.
 *  4. remove > keep → post hidden (HIDDEN), stays in moderation.
 *  5. Default → stays UNDER_REVIEW, visible on homepage.
 */
export function evaluateModerationPolicy(
  keepVoteCount: number,
  removeVoteCount: number,
): ModerationPolicyOutcome {
  const totalVotes = keepVoteCount + removeVoteCount;

  if (totalVotes < MODERATION_THRESHOLD) {
    return {
      inModeration: true,
      shouldDelete: false,
      status: PostStatus.UNDER_REVIEW,
      totalVotes,
      visibleOnHomepage: true,
    };
  }

  if (removeVoteCount >= STRONG_MAJORITY_RATIO * keepVoteCount) {
    return {
      inModeration: false,
      shouldDelete: true,
      status: PostStatus.REMOVED,
      totalVotes,
      visibleOnHomepage: false,
    };
  }

  if (keepVoteCount >= STRONG_MAJORITY_RATIO * removeVoteCount) {
    return {
      inModeration: false,
      shouldDelete: false,
      status: PostStatus.ACTIVE,
      totalVotes,
      visibleOnHomepage: true,
    };
  }

  if (removeVoteCount > keepVoteCount) {
    return {
      inModeration: true,
      shouldDelete: false,
      status: PostStatus.HIDDEN,
      totalVotes,
      visibleOnHomepage: false,
    };
  }

  return {
    inModeration: true,
    shouldDelete: false,
    status: PostStatus.UNDER_REVIEW,
    totalVotes,
    visibleOnHomepage: true,
  };
}
