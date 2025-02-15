import { prisma } from "./prisma";
import { User, Prisma } from "@prisma/client";

export type AuditLogAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "CUSTOM"
  | "FORM_SUBMISSION";

interface AuditLogParams {
  action: AuditLogAction;
  entityType: string;
  entityId: string;
  user: User;
  metadata?: Prisma.InputJsonValue;
}

export const createAuditLog = async ({
  action,
  entityType,
  entityId,
  user,
  metadata,
}: AuditLogParams) => {
  return await prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      metadata: metadata ?? Prisma.JsonNull,
      userId: user.id,
    } as Prisma.AuditLogUncheckedCreateInput,
  });
};

export const getAuditLogs = async (entityType?: string, entityId?: string) => {
  const where: Prisma.AuditLogWhereInput = {
    ...(entityType && { entityType }),
    ...(entityId && { entityId }),
  };

  return await prisma.auditLog.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
    },
  });
};
