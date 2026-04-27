/**
 * Purpose: Server actions for post and reply creation.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ensureAnonymousActor } from "@/lib/actor";
import { buildNavigationQuery, withNavigationQuery } from "@/lib/navigation";
import { normalizeText, parseOptionalFloat } from "@/app/actions/formUtils";

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
