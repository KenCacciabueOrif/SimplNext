/**
 * Last updated: 2026-04-21
 * Changes: Kept a single shared Prisma client instance for the Simpl domain and hot-reload safe development.
 * Purpose: Expose the Prisma client used by server components and server actions.
 */

import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "@prisma/client";

const createPrismaClient = () =>
    new PrismaClient().$extends(withAccelerate());

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
    prisma: ExtendedPrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export default prisma;