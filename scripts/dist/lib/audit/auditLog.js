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
exports.getAuditLogs = exports.createAuditLog = void 0;
const prisma_1 = require("./prisma");
const client_1 = require("@prisma/client");
const createAuditLog = (_a) => __awaiter(void 0, [_a], void 0, function* ({ action, entityType, entityId, user, metadata, }) {
    return yield prisma_1.prisma.auditLog.create({
        data: {
            action,
            entityType,
            entityId,
            metadata: metadata !== null && metadata !== void 0 ? metadata : client_1.Prisma.JsonNull,
            userId: user.id,
        },
    });
});
exports.createAuditLog = createAuditLog;
const getAuditLogs = (entityType, entityId) => __awaiter(void 0, void 0, void 0, function* () {
    const where = Object.assign(Object.assign({}, (entityType && { entityType })), (entityId && { entityId }));
    return yield prisma_1.prisma.auditLog.findMany({
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
});
exports.getAuditLogs = getAuditLogs;
