import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
export const createAuditLog = async ({ action, entityType, entityId, user, metadata, }) => {
    return await prisma.auditLog.create({
        data: {
            action,
            entityType,
            entityId,
            metadata: metadata ?? Prisma.JsonNull,
            userId: user.id,
        },
    });
};
export const getAuditLogs = async (entityType, entityId) => {
    const where = {
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
