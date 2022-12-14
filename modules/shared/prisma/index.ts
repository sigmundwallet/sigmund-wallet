import { PrismaClient } from "@prisma/client";
import { fieldEncryptionMiddleware } from "prisma-field-encryption";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  (() => {
    const client = new PrismaClient({});
    client.$use(fieldEncryptionMiddleware());
    return client;
  })();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
