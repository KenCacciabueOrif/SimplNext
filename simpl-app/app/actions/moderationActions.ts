/**
 * Purpose: Server actions for casting and toggling moderation votes (Keep / Remove).
 */

"use server";

import type { ModerationDecision } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureAnonymousActor } from "@/lib/actor";
import type { PostActionState } from "@/lib/types";
import { normalizeText } from "@/app/actions/formUtils";
import { syncModerationState, getViewerPostActionState } from "@/app/actions/txHelpers";

export async function castModerationVoteAction(
  formData: FormData,
): Promise<PostActionState> {
  const actor = await ensureAnonymousActor();
  const postId = normalizeText(formData.get("postId"));
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

  return snapshot;
}

export async function castModerationVoteFormAction(formData: FormData): Promise<void> {
  await castModerationVoteAction(formData);
}
