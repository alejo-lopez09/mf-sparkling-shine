import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function ensurePrismaClient() {
  return prisma;
}

export function isDatabaseConfigured() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  return Boolean(databaseUrl && !databaseUrl.includes("replace-with"));
}
