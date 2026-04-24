/**
 * Last updated: 2026-04-24
 * Changes: Preserved validated navigation query context (sort + geolocation params) across post/reply creation redirects, while keeping canonical post action state for reaction/moderation mutations. Redirect context now defaults distance mode to down when GPS coordinates are present and no explicit distance mode is submitted.
 * Purpose: Centralize write operations for the Simpl application.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ModerationDecision,
  PostStatus,
  ReactionType,
} from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureAnonymousActor, evaluateModerationPolicy } from "@/lib/simpl";

export type PostActionState = {
  likeCount: number;
  dislikeCount: number;
  keepVoteCount: number;
  removeVoteCount: number;
  reportCount: number;
  status: PostStatus;
  viewerReaction: ReactionType | null;
  viewerModerationDecision: ModerationDecision | null;
};

type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalFloat(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSortModeValue(value: string | null): "down" | "up" | "off" | null {
  if (value === "down" || value === "up" || value === "off") {
    return value;
  }

  return null;
}

function parseViewerCoordinate(value: string | null, min: number, max: number) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

function buildNavigationQuery(rawNavigationQuery: FormDataEntryValue | null) {
  if (typeof rawNavigationQuery !== "string" || rawNavigationQuery.trim() === "") {
    return "";
  }

  const input = new URLSearchParams(rawNavigationQuery);
  const output = new URLSearchParams();

  const popularity = parseSortModeValue(input.get("popularity"));
  const date = parseSortModeValue(input.get("date"));
  const distance = parseSortModeValue(input.get("distance"));

  if (popularity) {
    output.set("popularity", popularity);
  }

  if (date) {
    output.set("date", date);
  }

  if (distance) {
    output.set("distance", distance);
  }

  const latitude = parseViewerCoordinate(input.get("lat"), -90, 90);
  const longitude = parseViewerCoordinate(input.get("lng"), -180, 180);

  if (latitude !== null && longitude !== null) {
    output.set("lat", latitude.toFixed(6));
    output.set("lng", longitude.toFixed(6));

    if (!distance) {
      output.set("distance", "down");
    }
  }

  const geo = input.get("geo");

  if (geo === "on" || geo === "off") {
    output.set("geo", geo);
  }

  return output.toString();
}

function withNavigationQuery(pathname: string, navigationQuery: string) {
  if (!navigationQuery) {
    return pathname;
  }

  return `${pathname}?${navigationQuery}`;
}

function getThreadId(formData: FormData, fallbackPostId: string) {
  const threadId = normalizeText(formData.get("threadId"));
  return threadId || fallbackPostId;
}

async function syncPostState(
  tx: PrismaTransactionClient,
  postId: string,
) {
  // Reactions only: update like/dislike counts without touching the moderation state.
  // Calling evaluateModerationPolicy here would reset posts with 0 moderation votes to
  // UNDER_REVIEW, which would incorrectly treat every reaction as a moderation event.
  const reactions = await tx.reaction.findMany({
    where: { postId },
    select: { type: true },
  });

  const likeCount = reactions.filter((r) => r.type === ReactionType.LIKE).length;
  const dislikeCount = reactions.filter((r) => r.type === ReactionType.DISLIKE).length;

  const post = await tx.post.update({
    where: { id: postId },
    data: { likeCount, dislikeCount },
  });

  return {
    deleted: false,
    state: {
      dislikeCount: post.dislikeCount,
      keepVoteCount: post.keepVoteCount,
      likeCount: post.likeCount,
      removeVoteCount: post.removeVoteCount,
      reportCount: post.reportCount,
      status: post.status,
    },
  };
}

// Full moderation sync: recounts moderation votes, evaluates the policy, and
// applies the resulting status/visibility changes — including hard delete.
async function syncModerationState(
  tx: PrismaTransactionClient,
  postId: string,
) {
  const [reactions, moderationVotes] = await Promise.all([
    tx.reaction.findMany({
      where: { postId },
      select: { type: true },
    }),
    tx.moderationVote.findMany({
      where: { postId },
      select: { decision: true },
    }),
  ]);

  const likeCount = reactions.filter((r) => r.type === ReactionType.LIKE).length;
  const dislikeCount = reactions.filter((r) => r.type === ReactionType.DISLIKE).length;
  const keepVoteCount = moderationVotes.filter((v) => v.decision === ModerationDecision.KEEP).length;
  const removeVoteCount = moderationVotes.filter((v) => v.decision === ModerationDecision.REMOVE).length;

  const moderationOutcome = evaluateModerationPolicy(keepVoteCount, removeVoteCount);

  if (moderationOutcome.shouldDelete) {
    await tx.post.delete({ where: { id: postId } });

    return {
      deleted: true,
      state: {
        dislikeCount,
        keepVoteCount,
        likeCount,
        removeVoteCount,
        reportCount: removeVoteCount,
        status: PostStatus.REMOVED,
      },
    };
  }

  const post = await tx.post.update({
    where: { id: postId },
    data: {
      dislikeCount,
      isHomepageVisible: moderationOutcome.visibleOnHomepage,
      isInModeration: moderationOutcome.inModeration,
      keepVoteCount,
      likeCount,
      removeVoteCount,
      reportCount: removeVoteCount,
      status: moderationOutcome.status,
    },
  });

  return {
    deleted: false,
    state: {
      dislikeCount: post.dislikeCount,
      keepVoteCount: post.keepVoteCount,
      likeCount: post.likeCount,
      removeVoteCount: post.removeVoteCount,
      reportCount: post.reportCount,
      status: post.status,
    },
  };
}

async function getViewerPostActionState(
  tx: PrismaTransactionClient,
  actorId: string,
  postId: string,
) {
  const [reaction, moderationVote] = await Promise.all([
    tx.reaction.findUnique({
      where: {
        actorId_postId: {
          actorId,
          postId,
        },
      },
      select: { type: true },
    }),
    tx.moderationVote.findUnique({
      where: {
        actorId_postId: {
          actorId,
          postId,
        },
      },
      select: { decision: true },
    }),
  ]);

  return {
    viewerModerationDecision: moderationVote?.decision ?? null,
    viewerReaction: reaction?.type ?? null,
  };
}

function revalidatePostSurfaces(postId: string, threadId: string) {
  revalidatePath("/");
  revalidatePath("/moderation");
  revalidatePath(`/posts/${postId}`);
  revalidatePath(`/posts/${threadId}`);
}

export async function createPostAction(formData: FormData) {
  const actor = await ensureAnonymousActor();
  const title = normalizeText(formData.get("title"));
  const body = normalizeText(formData.get("body"));
  const parentId = normalizeText(formData.get("parentId")) || null;
  const navigationQuery = buildNavigationQuery(formData.get("navigationQuery"));
  const latitude = parseOptionalFloat(formData.get("latitude"));
  const longitude = parseOptionalFloat(formData.get("longitude"));

  if (!title || !body) {
    throw new Error("A title and body are required to publish content.");
  }

  let rootId: string | null = null;

  if (parentId) {
    const parent = await prisma.post.findUnique({
      where: { id: parentId },
      select: { id: true, rootId: true },
    });

    if (!parent) {
      throw new Error("The parent post does not exist anymore.");
    }

    rootId = parent.rootId ?? parent.id;
  }

  const created = await prisma.post.create({
    data: {
      authorId: actor.id,
      body,
      latitude,
      longitude,
      parentId,
      rootId,
      title,
    },
  });

  revalidatePath("/");
  revalidatePath("/posts");

  if (parentId) {
    revalidatePath(`/posts/${parentId}`);
    redirect(withNavigationQuery(`/posts/${parentId}`, navigationQuery));
  }

  redirect(withNavigationQuery(`/posts/${created.id}`, navigationQuery));
}

export async function toggleReactionAction(
  formData: FormData,
): Promise<PostActionState> {
  const actor = await ensureAnonymousActor();
  const postId = normalizeText(formData.get("postId"));
  const threadId = getThreadId(formData, postId);
  const reactionType = normalizeText(formData.get("reactionType"));

  if (!postId || !["LIKE", "DISLIKE"].includes(reactionType)) {
    throw new Error("Invalid reaction payload.");
  }

  const nextType = reactionType as ReactionType;

  const snapshot = await prisma.$transaction(async (tx) => {
    const existing = await tx.reaction.findUnique({
      where: {
        actorId_postId: {
          actorId: actor.id,
          postId,
        },
      },
    });

    if (existing?.type === nextType) {
      await tx.reaction.delete({ where: { id: existing.id } });
    } else if (existing) {
      await tx.reaction.update({
        where: { id: existing.id },
        data: { type: nextType },
      });
    } else {
      await tx.reaction.create({
        data: {
          actorId: actor.id,
          postId,
          type: nextType,
        },
      });
    }

    const syncResult = await syncPostState(tx, postId);

    if (syncResult.deleted) {
      return {
        ...syncResult.state,
        viewerModerationDecision: null,
        viewerReaction: null,
      } satisfies PostActionState;
    }

    const viewerState = await getViewerPostActionState(tx, actor.id, postId);

    return {
      ...syncResult.state,
      ...viewerState,
    } satisfies PostActionState;
  });

  revalidatePostSurfaces(postId, threadId);

  return snapshot;
}

export async function castModerationVoteAction(
  formData: FormData,
): Promise<PostActionState> {
  const actor = await ensureAnonymousActor();
  const postId = normalizeText(formData.get("postId"));
  const threadId = getThreadId(formData, postId);
  const decision = normalizeText(formData.get("decision"));

  if (!postId || !["KEEP", "REMOVE"].includes(decision)) {
    throw new Error("Invalid moderation payload.");
  }

  const snapshot = await prisma.$transaction(async (tx) => {
    const nextDecision = decision as ModerationDecision;
    const existing = await tx.moderationVote.findUnique({
      where: {
        actorId_postId: {
          actorId: actor.id,
          postId,
        },
      },
    });

    if (existing?.decision === nextDecision) {
      await tx.moderationVote.delete({ where: { id: existing.id } });
    } else if (existing) {
      await tx.moderationVote.update({
        where: { id: existing.id },
        data: { decision: nextDecision },
      });
    } else {
      await tx.moderationVote.create({
        data: {
          actorId: actor.id,
          decision: nextDecision,
          postId,
        },
      });
    }

    const syncResult = await syncModerationState(tx, postId);

    if (syncResult.deleted) {
      return {
        ...syncResult.state,
        viewerModerationDecision: null,
        viewerReaction: null,
      } satisfies PostActionState;
    }

    const viewerState = await getViewerPostActionState(tx, actor.id, postId);

    return {
      ...syncResult.state,
      ...viewerState,
    } satisfies PostActionState;
  });

  revalidatePostSurfaces(postId, threadId);

  return snapshot;
}

export async function castModerationVoteFormAction(formData: FormData): Promise<void> {
  await castModerationVoteAction(formData);
}