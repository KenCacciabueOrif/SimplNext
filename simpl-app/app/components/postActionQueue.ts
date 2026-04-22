/**
 * Last updated: 2026-04-22
 * Changes: Added a browser-persisted chronological queue for post actions so UI feedback can be instant while backend sync happens later.
 * Purpose: Store Like/DisLike/Good/Bad clicks locally, replay them in order, and notify clients when the backend confirms them.
 */

"use client";

import { ModerationDecision, ReactionType } from "@prisma/client";
import {
  castModerationVoteAction,
  toggleReactionAction,
  type PostActionState,
} from "@/app/actions";

const STORAGE_KEY = "simpl-post-action-queue-v1";

type ReactionQueueItem = {
  id: string;
  createdAt: number;
  postId: string;
  threadId: string;
  kind: "reaction";
  reactionType: ReactionType;
};

type ModerationQueueItem = {
  id: string;
  createdAt: number;
  postId: string;
  threadId: string;
  kind: "moderation";
  decision: ModerationDecision;
};

export type QueuedPostAction = ReactionQueueItem | ModerationQueueItem;

type QueueSnapshot = {
  queue: QueuedPostAction[];
  acknowledged?: {
    item: QueuedPostAction;
    state: PostActionState;
  };
};

type QueueListener = (snapshot: QueueSnapshot) => void;

const listeners = new Set<QueueListener>();

let isFlushing = false;
let browserListenersRegistered = false;

function canUseBrowser() {
  return typeof window !== "undefined";
}

function isQueuedPostAction(value: unknown): value is QueuedPostAction {
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
    return candidate.reactionType === ReactionType.LIKE || candidate.reactionType === ReactionType.DISLIKE;
  }

  if (candidate.kind === "moderation") {
    return candidate.decision === ModerationDecision.KEEP || candidate.decision === ModerationDecision.REMOVE;
  }

  return false;
}

function readQueue(): QueuedPostAction[] {
  if (!canUseBrowser()) {
    return [];
  }

  const serialized = window.localStorage.getItem(STORAGE_KEY);

  if (!serialized) {
    return [];
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isQueuedPostAction).sort((left, right) => left.createdAt - right.createdAt);
  } catch {
    return [];
  }
}

function notifyListeners(snapshot: QueueSnapshot) {
  listeners.forEach((listener) => {
    listener(snapshot);
  });
}

function writeQueue(queue: QueuedPostAction[], acknowledged?: QueueSnapshot["acknowledged"]) {
  if (!canUseBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  notifyListeners({ acknowledged, queue });
}

function removeQueuedItem(queue: QueuedPostAction[], id: string) {
  return queue.filter((item) => item.id !== id);
}

async function sendQueuedAction(item: QueuedPostAction): Promise<PostActionState> {
  const formData = new FormData();
  formData.set("postId", item.postId);
  formData.set("threadId", item.threadId);

  if (item.kind === "reaction") {
    formData.set("reactionType", item.reactionType);
    return toggleReactionAction(formData);
  }

  formData.set("decision", item.decision);
  return castModerationVoteAction(formData);
}

async function flushQueue() {
  if (!canUseBrowser() || isFlushing || navigator.onLine === false) {
    return;
  }

  isFlushing = true;

  try {
    while (true) {
      const queue = readQueue();
      const nextItem = queue[0];

      if (!nextItem) {
        break;
      }

      try {
        const state = await sendQueuedAction(nextItem);
        const nextQueue = removeQueuedItem(readQueue(), nextItem.id);
        writeQueue(nextQueue, { item: nextItem, state });
      } catch {
        break;
      }
    }
  } finally {
    isFlushing = false;
  }
}

function registerBrowserListeners() {
  if (!canUseBrowser() || browserListenersRegistered) {
    return;
  }

  window.addEventListener("online", () => {
    void flushQueue();
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    notifyListeners({ queue: readQueue() });
  });

  browserListenersRegistered = true;
}

export function startPostActionQueue() {
  registerBrowserListeners();
  void flushQueue();
}

export function subscribeToPostActionQueue(listener: QueueListener) {
  registerBrowserListeners();
  listeners.add(listener);
  listener({ queue: readQueue() });

  return () => {
    listeners.delete(listener);
  };
}

export function getQueuedPostActions(postId: string) {
  return readQueue().filter((item) => item.postId === postId);
}

export function enqueueReaction(postId: string, threadId: string, reactionType: ReactionType) {
  const nextItem: QueuedPostAction = {
    createdAt: Date.now(),
    id: crypto.randomUUID(),
    kind: "reaction",
    postId,
    reactionType,
    threadId,
  };

  const queue = [...readQueue(), nextItem].sort((left, right) => left.createdAt - right.createdAt);
  writeQueue(queue);
  void flushQueue();
  return nextItem;
}

export function enqueueModerationVote(postId: string, threadId: string, decision: ModerationDecision) {
  const nextItem: QueuedPostAction = {
    createdAt: Date.now(),
    decision,
    id: crypto.randomUUID(),
    kind: "moderation",
    postId,
    threadId,
  };

  const queue = [...readQueue(), nextItem].sort((left, right) => left.createdAt - right.createdAt);
  writeQueue(queue);
  void flushQueue();
  return nextItem;
}