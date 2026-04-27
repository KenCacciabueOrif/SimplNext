/**
 * Last updated: 2026-04-27
 * Purpose: Type declarations and runtime validator for the post-action queue.
 *   Imported by postActionQueue.ts and any consumer that needs to inspect queue items.
 */

import { ModerationDecision, ReactionType } from "@prisma/client";
import type { PostActionState } from "@/lib/types";

// ------------------------------
// Queue item types
// ------------------------------

export type ReactionQueueItem = {
  id: string;
  createdAt: number;
  postId: string;
  threadId: string;
  kind: "reaction";
  reactionType: ReactionType;
};

export type ModerationQueueItem = {
  id: string;
  createdAt: number;
  postId: string;
  threadId: string;
  kind: "moderation";
  decision: ModerationDecision;
};

export type QueuedPostAction = ReactionQueueItem | ModerationQueueItem;

export type QueueSnapshot = {
  queue: QueuedPostAction[];
  acknowledged?: {
    item: QueuedPostAction;
    state: PostActionState;
  };
};

export type QueueListener = (snapshot: QueueSnapshot) => void;

// ------------------------------
// Runtime validator
// ------------------------------

export function isQueuedPostAction(value: unknown): value is QueuedPostAction {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<QueuedPostAction>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.createdAt !== "number" ||
    typeof candidate.postId !== "string" ||
    typeof candidate.threadId !== "string" ||
    typeof candidate.kind !== "string"
  ) {
    return false;
  }

  if (candidate.kind === "reaction") {
    return (
      candidate.reactionType === ReactionType.LIKE ||
      candidate.reactionType === ReactionType.DISLIKE
    );
  }

  if (candidate.kind === "moderation") {
    return (
      candidate.decision === ModerationDecision.KEEP ||
      candidate.decision === ModerationDecision.REMOVE
    );
  }

  return false;
}
