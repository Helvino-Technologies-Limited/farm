import { PrismaClient, type Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/** Runs a multi-step business transaction with a generous timeout. Neon's pooled connection can
 * add real per-query latency (especially after a cold start), and Prisma's 5s interactive-transaction
 * default is too tight for flows like createSale that run half a dozen sequential queries. */
export function withTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return db.$transaction(fn, { timeout: 20000, maxWait: 10000 });
}
