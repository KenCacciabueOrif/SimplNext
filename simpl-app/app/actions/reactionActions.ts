/**
 * Purpose: Server action for toggling post reactions (Like / Dislike).
 */

"use server";

import type { ReactionType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureAnonymousActor } from "@/lib/actor";
import type { PostActionState } from "@/lib/types";
import { normalizeText } from "@/app/actions/formUtils";
import { syncPostState, getViewerPostActionState } from "@/app/actions/txHelpers";

export async function toggleReactionAction(
  formData: FormData,
): Promise<PostActionState> {
  const actor = await ensureAnonymousActor();
  const postId = normalizeText(formData.get("postId"));
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

  return snapshot;
}
