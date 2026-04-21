/**
 * Last updated: 2026-04-21
 * Changes: Added server actions for creating posts, toggling reactions, and casting moderation decisions.
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
import { ensureAnonymousActor } from "@/lib/simpl";

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

function getThreadId(formData: FormData, fallbackPostId: string) {
  const threadId = normalizeText(formData.get("threadId"));
  return threadId || fallbackPostId;
}

async function syncPostState(
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

  const likeCount =
    reactions.filter((reaction) => reaction.type === ReactionType.LIKE).length;
  const dislikeCount =
    reactions.filter((reaction) => reaction.type === ReactionType.DISLIKE).length;
  const keepVoteCount =
    moderationVotes.filter(
      (vote) => vote.decision === ModerationDecision.KEEP,
    ).length;
  const removeVoteCount =
    moderationVotes.filter(
      (vote) => vote.decision === ModerationDecision.REMOVE,
    ).length;

  let status: PostStatus = PostStatus.ACTIVE;

  if (removeVoteCount > 0) {
    status = PostStatus.UNDER_REVIEW;
  }

  if (removeVoteCount >= 3 && removeVoteCount > keepVoteCount) {
    status = PostStatus.HIDDEN;
  }

  if (keepVoteCount >= removeVoteCount && keepVoteCount > 0) {
    status = PostStatus.ACTIVE;
  }

  return tx.post.update({
    where: { id: postId },
    data: {
      dislikeCount,
      keepVoteCount,
      likeCount,
      removeVoteCount,
      reportCount: removeVoteCount,
      status,
    },
  });
}

function revalidatePostSurfaces(postId: string, threadId: string) {
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/moderation");
  revalidatePath(`/posts/${postId}`);
  revalidatePath(`/posts/${threadId}`);
}

export async function createPostAction(formData: FormData) {
  const actor = await ensureAnonymousActor();
  const title = normalizeText(formData.get("title"));
  const body = normalizeText(formData.get("body"));
  const parentId = normalizeText(formData.get("parentId")) || null;
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
    redirect(`/posts/${parentId}`);
  }

  redirect(`/posts/${created.id}`);
}

export async function toggleReactionAction(formData: FormData) {
  const actor = await ensureAnonymousActor();
  const postId = normalizeText(formData.get("postId"));
  const threadId = getThreadId(formData, postId);
  const reactionType = normalizeText(formData.get("reactionType"));

  if (!postId || !["LIKE", "DISLIKE"].includes(reactionType)) {
    throw new Error("Invalid reaction payload.");
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.reaction.findUnique({
      where: {
        actorId_postId: {
          actorId: actor.id,
          postId,
        },
      },
    });

    const nextType = reactionType as ReactionType;

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

    await syncPostState(tx, postId);
  });

  revalidatePostSurfaces(postId, threadId);
}

export async function castModerationVoteAction(formData: FormData) {
  const actor = await ensureAnonymousActor();
  const postId = normalizeText(formData.get("postId"));
  const threadId = getThreadId(formData, postId);
  const decision = normalizeText(formData.get("decision"));

  if (!postId || !["KEEP", "REMOVE"].includes(decision)) {
    throw new Error("Invalid moderation payload.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.moderationVote.upsert({
      where: {
        actorId_postId: {
          actorId: actor.id,
          postId,
        },
      },
      update: {
        decision: decision as ModerationDecision,
      },
      create: {
        actorId: actor.id,
        decision: decision as ModerationDecision,
        postId,
      },
    });

    await syncPostState(tx, postId);
  });

  revalidatePostSurfaces(postId, threadId);
}