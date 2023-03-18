/**
 * PrismaClient singleton.
 *
 * In Next.js dev mode (HMR), modules are re-evaluated on every change which
 * would otherwise create a new PrismaClient on every hot-reload and quickly
 * exhaust the Postgres connection pool. We cache the client on globalThis
 * to survive HMR.
 *
 * In production we instantiate exactly one client per Node.js worker.
 */

import { Prisma, PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

const logLevels: Prisma.LogLevel[] =
  process.env.NODE_ENV === "production"
    ? ["error", "warn"]
    : ["query", "error", "warn"];

function createPrisma(): PrismaClient {
  return new PrismaClient({
    log: logLevels,
    errorFormat: "pretty",
  });
}

export const prisma: PrismaClient = global._prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  global._prisma = prisma;
}

export type { Prisma } from "@prisma/client";
export default prisma;
