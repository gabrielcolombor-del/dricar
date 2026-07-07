import { PrismaClient } from "@prisma/client";

// Impede que múltiplas instâncias do Prisma Client sejam criadas no Next.js durante o desenvolvimento local (hot reload)
const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
