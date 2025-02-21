"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUDIT_ENTITY_TYPES = exports.AUDIT_ACTIONS = void 0;
exports.createAuditLog = createAuditLog;
exports.createAuditLogAlternative = createAuditLogAlternative;
exports.getAuditLogs = getAuditLogs;
exports.getAuditLogsAlternative = getAuditLogsAlternative;
const prisma_1 = require("@/lib/prisma");
const next_auth_1 = require("next-auth");
const route_1 = require("@/app/api/auth/[...nextauth]/route");
const headers_1 = require("next/headers");
exports.AUDIT_ACTIONS = [
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
];
exports.AUDIT_ENTITY_TYPES = {
    AUTH: "AUTH",
    TEMPLATE: "TEMPLATE",
    FORM: "FORM",
    USER: "USER",
    SYSTEM: "SYSTEM",
};
function createAuditLog(_a) {
    return __awaiter(this, arguments, void 0, function* ({ action, userId, metadata = {}, entityType = exports.AUDIT_ENTITY_TYPES.AUTH, entityId = exports.AUDIT_ENTITY_TYPES.SYSTEM, }) {
        var _b;
        try {
            // Get session in server component/API route
            const session = yield (0, next_auth_1.getServerSession)(route_1.authOptions);
            const reqHeaders = yield (0, headers_1.headers)();
            const data = {
                action,
                entityType,
                entityId,
                userId: ((_b = session === null || session === void 0 ? void 0 : session.user) === null || _b === void 0 ? void 0 : _b.id) || userId,
                metadata: Object.assign(Object.assign({}, metadata), { ipAddress: reqHeaders.get("x-forwarded-for") || "", userAgent: reqHeaders.get("user-agent") || "", timestamp: new Date().toISOString() }),
            };
            return yield prisma_1.prisma.auditLog.create({ data });
        }
        catch (error) {
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
                yield prisma_1.prisma.auditLog.create({
                    data: {
                        userId: "system",
                        metadata: JSON.parse(JSON.stringify(Object.assign(Object.assign({}, errorDetails), { originalMetadata: JSON.parse(JSON.stringify(errorDetails.originalMetadata || {})) }))),
                        action: "SYSTEM_ERROR",
                        entityType: exports.AUDIT_ENTITY_TYPES.SYSTEM,
                        entityId: "audit-system",
                    },
                });
            }
            catch (secondaryError) {
                console.error("Failed to create error audit log:", secondaryError);
            }
            return null;
        }
    });
}
function createAuditLogAlternative(_a) {
    return __awaiter(this, arguments, void 0, function* ({ action, userId, metadata = {}, entityType = exports.AUDIT_ENTITY_TYPES.AUTH, entityId = exports.AUDIT_ENTITY_TYPES.SYSTEM, }) {
        try {
            const headersList = (0, headers_1.headers)();
            const userAgent = headersList.get("user-agent") || "unknown";
            const ipAddress = headersList.get("x-forwarded-for") || "unknown";
            const path = headersList.get("x-invoke-path") || "unknown";
            const method = headersList.get("x-invoke-method") || "unknown";
            const enhancedMetadata = Object.assign(Object.assign({}, metadata), { userAgent,
                ipAddress,
                path,
                method, timestamp: new Date().toISOString() });
            const auditLog = yield prisma_1.prisma.auditLog.create({
                data: {
                    action,
                    entityType,
                    entityId,
                    userId,
                    metadata: enhancedMetadata,
                },
            });
            return auditLog;
        }
        catch (error) {
            console.error("Failed to create audit log:", error);
            throw error;
        }
    });
}
function getAuditLogs(_a) {
    return __awaiter(this, arguments, void 0, function* ({ userId, action, entityType, startDate, endDate, page = 1, limit = 50, searchTerm, sortBy = "createdAt", sortOrder = "desc", includeMetadata = false, }) {
        try {
            const where = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (userId && { userId })), (action && { action })), (entityType && { entityType })), (startDate || endDate
                ? {
                    createdAt: Object.assign(Object.assign({}, (startDate && { gte: startDate })), (endDate && { lte: endDate })),
                }
                : {})), (searchTerm && {
                OR: [
                    { entityId: { contains: searchTerm } },
                    { userId: { contains: searchTerm } },
                ],
            }));
            const [total, logs] = yield Promise.all([
                prisma_1.prisma.auditLog.count({ where }),
                prisma_1.prisma.auditLog.findMany({
                    where,
                    orderBy: { [sortBy]: sortOrder },
                    skip: (page - 1) * limit,
                    take: limit,
                    include: Object.assign({ user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        } }, (includeMetadata && {
                        metadata: true,
                    })),
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
        }
        catch (error) {
            console.error("Failed to fetch audit logs:", error);
            throw error;
        }
    });
}
function getAuditLogsAlternative(_a) {
    return __awaiter(this, arguments, void 0, function* ({ userId, action, entityType, startDate, endDate, page = 1, limit = 50, searchTerm, sortBy = "createdAt", sortOrder = "desc", includeMetadata = false, }) {
        try {
            const where = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (userId && { userId })), (action && { action })), (entityType && { entityType })), (startDate && {
                createdAt: {
                    gte: startDate,
                },
            })), (endDate && {
                createdAt: {
                    lte: endDate,
                },
            })), (searchTerm && {
                OR: [
                    { action: { contains: searchTerm, mode: "insensitive" } },
                    { entityType: { contains: searchTerm, mode: "insensitive" } },
                    { entityId: { contains: searchTerm, mode: "insensitive" } },
                ],
            }));
            const [total, logs] = yield Promise.all([
                prisma_1.prisma.auditLog.count({ where }),
                prisma_1.prisma.auditLog.findMany({
                    where,
                    orderBy: {
                        [sortBy]: sortOrder,
                    },
                    skip: (page - 1) * limit,
                    take: limit,
                    select: Object.assign({ id: true, action: true, entityType: true, entityId: true, userId: true, createdAt: true }, (includeMetadata && { metadata: true })),
                }),
            ]);
            return {
                logs,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            console.error("Failed to fetch audit logs:", error);
            throw error;
        }
    });
}
