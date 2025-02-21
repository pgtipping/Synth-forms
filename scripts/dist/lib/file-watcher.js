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
exports.fileWatcher = exports.FileWatcher = exports.SystemStatusState = exports.SystemStatusType = void 0;
const chokidar_1 = require("chokidar");
const path_1 = require("path");
const prisma_1 = require("./prisma");
const audit_1 = require("./audit");
const client_1 = require("@prisma/client");
const basic_validation_1 = require("./basic-validation");
const cloud_converter_1 = require("./cloud-converter");
var SystemStatusType;
(function (SystemStatusType) {
    SystemStatusType["FILE_WATCHER"] = "FILE_WATCHER";
    SystemStatusType["TEMPLATE_PROCESSOR"] = "TEMPLATE_PROCESSOR";
    SystemStatusType["FORM_CONVERTER"] = "FORM_CONVERTER";
})(SystemStatusType || (exports.SystemStatusType = SystemStatusType = {}));
var SystemStatusState;
(function (SystemStatusState) {
    SystemStatusState["STARTING"] = "STARTING";
    SystemStatusState["RUNNING"] = "RUNNING";
    SystemStatusState["STOPPED"] = "STOPPED";
    SystemStatusState["ERROR"] = "ERROR";
})(SystemStatusState || (exports.SystemStatusState = SystemStatusState = {}));
class FileWatcher {
    constructor(watchPath) {
        this.watcher = null;
        this.watchPath = watchPath;
        this.converter = new cloud_converter_1.CloudDocumentConverter();
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.watcher) {
                return;
            }
            try {
                // Create system status record
                yield prisma_1.prisma.$executeRaw `
        INSERT INTO "SystemStatus" ("id", "type", "status", "message", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${SystemStatusType.FILE_WATCHER}, ${SystemStatusState.STARTING}, 'File watcher is starting', NOW(), NOW())
      `;
                this.watcher = (0, chokidar_1.watch)(this.watchPath, {
                    ignored: /(^|[\/\\])\../,
                    persistent: true
                });
                this.watcher
                    .on('add', this.handleFileAdd.bind(this))
                    .on('change', this.handleFileChange.bind(this))
                    .on('unlink', this.handleFileRemove.bind(this))
                    .on('error', (err) => { void this.handleError(err); });
                yield prisma_1.prisma.$executeRaw `
        UPDATE "SystemStatus"
        SET "status" = ${SystemStatusState.RUNNING},
            "message" = 'File watcher is running',
            "updatedAt" = NOW()
        WHERE "type" = ${SystemStatusType.FILE_WATCHER}
      `;
            }
            catch (error) {
                yield this.handleError(error instanceof Error ? error : new Error(String(error)));
            }
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.watcher) {
                yield this.watcher.close();
                this.watcher = null;
                yield prisma_1.prisma.$executeRaw `
        UPDATE "SystemStatus"
        SET "status" = ${SystemStatusState.STOPPED},
            "message" = 'File watcher has been stopped',
            "updatedAt" = NOW()
        WHERE "type" = ${SystemStatusType.FILE_WATCHER}
      `;
            }
        });
    }
    handleFileAdd(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Convert the document using Google Cloud Document AI
                const conversionResult = yield this.converter.convert(filePath);
                if (!conversionResult.success) {
                    console.error('Document conversion failed:', conversionResult.error);
                    return;
                }
                const basicTemplate = {
                    title: filePath,
                    content: conversionResult.content || {},
                    category: 'default-category',
                    tags: []
                };
                const { valid, errors } = (0, basic_validation_1.validateTemplate)(basicTemplate);
                if (!valid) {
                    console.error('Template validation failed:', errors);
                    // Consider updating system status here to reflect the validation failure
                    return;
                }
                const template = yield prisma_1.prisma.template.create({
                    data: {
                        title: filePath,
                        status: client_1.TemplateStatus.PROCESSING,
                        createdBy: { connect: { id: 'system' } },
                        metadata: {
                            fileType: ((_a = filePath.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'unknown'
                        },
                        content: {},
                        category: { connect: { id: 'default-category-id' } },
                        tags: []
                    }
                });
                yield (0, audit_1.createAuditLog)({
                    action: client_1.AuditAction.TEMPLATE_CREATE,
                    metadata: {
                        entityId: template.id,
                        entityType: 'template',
                        filePath
                    },
                    userId: 'system'
                });
            }
            catch (error) {
                yield this.handleError(error instanceof Error ? error : new Error(String(error)));
            }
        });
    }
    testHandleFileAdd(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.handleFileAdd(filePath);
        });
    }
    handleFileChange(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const template = yield prisma_1.prisma.template.findFirst({
                    where: { title: filePath }
                });
                if (template) {
                    yield prisma_1.prisma.template.update({
                        where: { id: template.id },
                        data: {
                            status: client_1.TemplateStatus.PROCESSING,
                            version: { increment: 1 }
                        }
                    });
                    yield (0, audit_1.createAuditLog)({
                        action: client_1.AuditAction.TEMPLATE_UPDATE,
                        metadata: {
                            entityId: template.id,
                            entityType: 'template',
                            filePath
                        },
                        userId: 'system'
                    });
                }
            }
            catch (error) {
                yield this.handleError(error instanceof Error ? error : new Error(String(error)));
            }
        });
    }
    handleFileRemove(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const template = yield prisma_1.prisma.template.findFirst({
                    where: { title: filePath }
                });
                if (template) {
                    yield prisma_1.prisma.template.update({
                        where: { id: template.id },
                        data: { status: client_1.TemplateStatus.ARCHIVED }
                    });
                    yield (0, audit_1.createAuditLog)({
                        action: client_1.AuditAction.TEMPLATE_DELETE,
                        metadata: {
                            entityId: template.id,
                            entityType: 'template',
                            filePath
                        },
                        userId: 'system'
                    });
                }
            }
            catch (error) {
                yield this.handleError(error instanceof Error ? error : new Error(String(error)));
            }
        });
    }
    handleError(error) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(error instanceof Error)) {
                error = new Error(String(error));
            }
            const err = error;
            console.error('File watcher error:', err);
            yield prisma_1.prisma.$executeRaw `
      UPDATE "SystemStatus"
      SET "status" = ${SystemStatusState.ERROR},
          "message" = ${err.message},
          "updatedAt" = NOW()
      WHERE "type" = ${SystemStatusType.FILE_WATCHER}
    `;
            yield (0, audit_1.createAuditLog)({
                action: client_1.AuditAction.SYSTEM_ERROR,
                metadata: {
                    entityType: 'file_watcher',
                    error: err.message
                },
                userId: 'system'
            });
        });
    }
}
exports.FileWatcher = FileWatcher;
exports.fileWatcher = new FileWatcher((0, path_1.join)(process.cwd(), 'templates'));
