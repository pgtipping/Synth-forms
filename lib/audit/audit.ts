import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import type { Session, User } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Prisma, AuditLog } from "@prisma/client";
import { headers } from "next/headers";
import { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

export const AUDIT_ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "REGISTER",
  "TEMPLATE_CREATE",
  "TEMPLATE_UPDATE",
  "TEMPLATE_DELETE",
  "TEMPLATE_PREVIEW",
  "TEMPLATE_EXPORT",
  "FORM_SUBMIT",
  "FORM_SAVE_DRAFT",
  "FORM_VALIDATE",
  "USER_UPDATE",
  "SETTINGS_CHANGE",
  "SYSTEM_ERROR",
  "CUSTOM",
  "FORM_SUBMISSION"
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITY_TYPES = {
  AUTH: "AUTH",
  TEMPLATE: "TEMPLATE",
  FORM: "FORM",
  USER: "USER",
  SYSTEM: "SYSTEM",
} as const;

export type AuditEntityType =
  (typeof AUDIT_ENTITY_TYPES)[keyof typeof AUDIT_ENTITY_TYPES];

export interface AuditMetadata {
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  error?: string;
  filePath?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
  path?: string;
  method?: string;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
}

export interface AuditLogInput {
  action: AuditAction;
  userId: string;
  metadata?: AuditMetadata;
  entityType?: AuditEntityType;
  entityId?: string;
}

export interface AuditLogParams {
  action: AuditAction;
  entityType: string;
  entityId: string;
  user: User;
  metadata?: Prisma.InputJsonValue;
}

export async function createAuditLog({
  action,
  userId,
  metadata = {},
  entityType = AUDIT_ENTITY_TYPES.AUTH,
  entityId = AUDIT_ENTITY_TYPES.SYSTEM,
}: AuditLogInput) {
  try {
    // Get session in server component/API route
    const session = await getServerSession(authOptions);
    const reqHeaders = await headers(); 
    const data: Prisma.AuditLogUncheckedCreateInput = {
      action,
      entityType,
      entityId,
      userId: session?.user?.id || userId,
      metadata: {
        ...metadata,
        ipAddress: reqHeaders.get("x-forwarded-for") || "",
        userAgent: reqHeaders.get("user-agent") || "",
        timestamp: new Date().toISOString(),
      } as Prisma.JsonObject,
    };

    return await prisma.auditLog.create({ data });
  } catch (error) {
    // Enhanced error handling
    const errorDetails = {
      timestamp: new Date().toISOString(),
      action,
      entityType,
      error: error instanceof Error ? error.message : "Unknown error",
      originalMetadata: metadata,
    };

    // Log to error monitoring system
    console.error("Audit Log Creation Failed:", errorDetails);

    // Create system error log
    try {
      await prisma.auditLog.create({
        data: {
          userId: "system",
          metadata: JSON.parse(JSON.stringify({
            ...errorDetails,
            originalMetadata: JSON.parse(JSON.stringify(errorDetails.originalMetadata || {})),
          })) as unknown as Prisma.JsonObject,
          action: "SYSTEM_ERROR" as AuditAction,
          entityType: AUDIT_ENTITY_TYPES.SYSTEM,
          entityId: "audit-system",
        },
      });
    } catch (secondaryError) {
      console.error("Failed to create error audit log:", secondaryError);
    }

    return null;
  }
}

export async function createAuditLogAlternative({
  action,
  userId,
  metadata = {},
  entityType = AUDIT_ENTITY_TYPES.AUTH,
  entityId = AUDIT_ENTITY_TYPES.SYSTEM,
}: AuditLogInput) {
  try {
    const headersList = headers();
    const userAgent = headersList.get("user-agent") || "unknown";
    const ipAddress = headersList.get("x-forwarded-for") || "unknown";
    const path = headersList.get("x-invoke-path") || "unknown";
    const method = headersList.get("x-invoke-method") || "unknown";

    const enhancedMetadata = {
      ...metadata,
      userAgent,
      ipAddress,
      path,
      method,
      timestamp: new Date().toISOString(),
    };

    const auditLog = await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId,
        metadata: enhancedMetadata as Prisma.InputJsonValue,
      },
    });

    return auditLog;
  } catch (error) {
    console.error("Failed to create audit log:", error);
    throw error;
  }
}

export interface EnhancedAuditQuery {
  userId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: "createdAt" | "action" | "entityType";
  sortOrder?: "asc" | "desc";
  includeMetadata?: boolean;
}

export async function getAuditLogs({
  userId,
  action,
  entityType,
  startDate,
  endDate,
  page = 1,
  limit = 50,
  searchTerm,
  sortBy = "createdAt",
  sortOrder = "desc",
  includeMetadata = false,
}: EnhancedAuditQuery) {
  try {
    const where: Prisma.AuditLogWhereInput = {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
      ...(searchTerm && {
        OR: [
          { entityId: { contains: searchTerm } },
          { userId: { contains: searchTerm } },
        ] as Prisma.AuditLogWhereInput[],
      }),
    };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          ...(includeMetadata && {
            metadata: true,
          }),
        },
      }),
    ]);

    return {
      logs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    throw error;
  }
}

export async function getAuditLogsAlternative({
  userId,
  action,
  entityType,
  startDate,
  endDate,
  page = 1,
  limit = 50,
  searchTerm,
  sortBy = "createdAt",
  sortOrder = "desc",
  includeMetadata = false,
}: EnhancedAuditQuery) {
  try {
    const where: Prisma.AuditLogWhereInput = {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(startDate && {
        createdAt: {
          gte: startDate,
        },
      }),
      ...(endDate && {
        createdAt: {
          lte: endDate,
        },
      }),
      ...(searchTerm && {
        OR: [
          { action: { contains: searchTerm, mode: "insensitive" } },
          { entityType: { contains: searchTerm, mode: "insensitive" } },
          { entityId: { contains: searchTerm, mode: "insensitive" } },
        ],
      }),
    };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          userId: true,
          createdAt: true,
          ...(includeMetadata && { metadata: true }),
        },
      }),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    throw error;
  }
}
