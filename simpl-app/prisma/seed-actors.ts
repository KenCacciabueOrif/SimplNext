/**
 * Last updated: 2026-04-27
 * Purpose: Creates the 12 named anonymous seed actors used across all seed fixtures.
 *   Returns a named map so consuming modules reference actors by readable name.
 */

import { PrismaClient } from "@prisma/client";

// ------------------------------
// Actor creation
// ------------------------------

export async function createActors(prisma: PrismaClient) {
  const [alice, bob, clara, diego, emma, farid, gina, hugo, ines, julien, karim, lea] =
    await Promise.all([
      prisma.actor.create({ data: { key: "seed-alice", displayName: "Anon-Alice" } }),
      prisma.actor.create({ data: { key: "seed-bob", displayName: "Anon-Bob" } }),
      prisma.actor.create({ data: { key: "seed-clara", displayName: "Anon-Clara" } }),
      prisma.actor.create({ data: { key: "seed-diego", displayName: "Anon-Diego" } }),
      prisma.actor.create({ data: { key: "seed-emma", displayName: "Anon-Emma" } }),
      prisma.actor.create({ data: { key: "seed-farid", displayName: "Anon-Farid" } }),
      prisma.actor.create({ data: { key: "seed-gina", displayName: "Anon-Gina" } }),
      prisma.actor.create({ data: { key: "seed-hugo", displayName: "Anon-Hugo" } }),
      prisma.actor.create({ data: { key: "seed-ines", displayName: "Anon-Ines" } }),
      prisma.actor.create({ data: { key: "seed-julien", displayName: "Anon-Julien" } }),
      prisma.actor.create({ data: { key: "seed-karim", displayName: "Anon-Karim" } }),
      prisma.actor.create({ data: { key: "seed-lea", displayName: "Anon-Lea" } }),
    ]);

  return { alice, bob, clara, diego, emma, farid, gina, hugo, ines, julien, karim, lea };
}

export type SeedActors = Awaited<ReturnType<typeof createActors>>;
