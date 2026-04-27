/**
 * Last updated: 2026-04-27
 * Changes: Extracted from lib/simpl.ts as part of Phase 2 decomposition.
 * Purpose: Anonymous actor management — cookie-based identity creation and lookup.
 */

import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const ACTOR_COOKIE = "simpl-actor-key";

export async function getViewerActor() {
  const cookieStore = await cookies();
  const actorKey = cookieStore.get(ACTOR_COOKIE)?.value;

  if (!actorKey) {
    return null;
  }

  return prisma.actor.findUnique({
    where: { key: actorKey },
  });
}

export async function ensureAnonymousActor() {
  const cookieStore = await cookies();
  let actorKey = cookieStore.get(ACTOR_COOKIE)?.value;

  if (!actorKey) {
    actorKey = crypto.randomUUID();
    cookieStore.set(ACTOR_COOKIE, actorKey, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return prisma.actor.upsert({
    where: { key: actorKey },
    update: {},
    create: {
      key: actorKey,
      displayName: `Anon-${actorKey.slice(0, 8)}`,
    },
  });
}
