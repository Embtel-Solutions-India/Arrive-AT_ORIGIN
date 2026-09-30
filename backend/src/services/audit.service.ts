import type { Request } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

export async function audit(
  req: Request | null,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Prisma.InputJsonValue,
  userId?: string,
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        metadata,
        userId: userId ?? req?.user?.id,
        ip: req?.ip,
      },
    });
  } catch (err) {
    logger.error({ err }, "audit log write failed");
  }
}
