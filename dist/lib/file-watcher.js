import { watch } from 'chokidar';
import { join } from 'path';
import { prisma } from './prisma';
import { createAuditLog } from './audit';
import { TemplateStatus, AuditAction } from '@prisma/client';
import { validateTemplate } from './basic-validation';
import { CloudDocumentConverter } from './cloud-converter';
export var SystemStatusType;
(function (SystemStatusType) {
    SystemStatusType["FILE_WATCHER"] = "FILE_WATCHER";
    SystemStatusType["TEMPLATE_PROCESSOR"] = "TEMPLATE_PROCESSOR";
    SystemStatusType["FORM_CONVERTER"] = "FORM_CONVERTER";
})(SystemStatusType || (SystemStatusType = {}));
export var SystemStatusState;
(function (SystemStatusState) {
    SystemStatusState["STARTING"] = "STARTING";
    SystemStatusState["RUNNING"] = "RUNNING";
    SystemStatusState["STOPPED"] = "STOPPED";
    SystemStatusState["ERROR"] = "ERROR";
})(SystemStatusState || (SystemStatusState = {}));
export class FileWatcher {
    constructor(watchPath) {
        this.watcher = null;
        this.watchPath = watchPath;
        this.converter = new CloudDocumentConverter();
    }
    async start() {
        if (this.watcher) {
            return;
        }
        try {
            // Create system status record
            await prisma.$executeRaw `
        INSERT INTO "SystemStatus" ("id", "type", "status", "message", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${SystemStatusType.FILE_WATCHER}, ${SystemStatusState.STARTING}, 'File watcher is starting', NOW(), NOW())
      `;
            this.watcher = watch(this.watchPath, {
                ignored: /(^|[\/\\])\../,
                persistent: true
            });
            this.watcher
                .on('add', this.handleFileAdd.bind(this))
                .on('change', this.handleFileChange.bind(this))
                .on('unlink', this.handleFileRemove.bind(this))
                .on('error', (err) => { void this.handleError(err); });
            await prisma.$executeRaw `
        UPDATE "SystemStatus"
        SET "status" = ${SystemStatusState.RUNNING},
            "message" = 'File watcher is running',
            "updatedAt" = NOW()
        WHERE "type" = ${SystemStatusType.FILE_WATCHER}
      `;
        }
        catch (error) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async stop() {
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
            await prisma.$executeRaw `
        UPDATE "SystemStatus"
        SET "status" = ${SystemStatusState.STOPPED},
            "message" = 'File watcher has been stopped',
            "updatedAt" = NOW()
        WHERE "type" = ${SystemStatusType.FILE_WATCHER}
      `;
        }
    }
    async handleFileAdd(filePath) {
        try {
            // Convert the document using Google Cloud Document AI
            const conversionResult = await this.converter.convert(filePath);
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
            const { valid, errors } = validateTemplate(basicTemplate);
            if (!valid) {
                console.error('Template validation failed:', errors);
                // Consider updating system status here to reflect the validation failure
                return;
            }
            const template = await prisma.template.create({
                data: {
                    title: filePath,
                    status: TemplateStatus.PROCESSING,
                    createdBy: { connect: { id: 'system' } },
                    metadata: {
                        fileType: filePath.split('.').pop()?.toLowerCase() || 'unknown'
                    },
                    content: {},
                    category: { connect: { id: 'default-category-id' } },
                    tags: []
                }
            });
            await createAuditLog({
                action: AuditAction.TEMPLATE_CREATE,
                metadata: {
                    entityId: template.id,
                    entityType: 'template',
                    filePath
                },
                userId: 'system'
            });
        }
        catch (error) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async testHandleFileAdd(filePath) {
        return this.handleFileAdd(filePath);
    }
    async handleFileChange(filePath) {
        try {
            const template = await prisma.template.findFirst({
                where: { title: filePath }
            });
            if (template) {
                await prisma.template.update({
                    where: { id: template.id },
                    data: {
                        status: TemplateStatus.PROCESSING,
                        version: { increment: 1 }
                    }
                });
                await createAuditLog({
                    action: AuditAction.TEMPLATE_UPDATE,
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
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async handleFileRemove(filePath) {
        try {
            const template = await prisma.template.findFirst({
                where: { title: filePath }
            });
            if (template) {
                await prisma.template.update({
                    where: { id: template.id },
                    data: { status: TemplateStatus.ARCHIVED }
                });
                await createAuditLog({
                    action: AuditAction.TEMPLATE_DELETE,
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
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async handleError(error) {
        if (!(error instanceof Error)) {
            error = new Error(String(error));
        }
        const err = error;
        console.error('File watcher error:', err);
        await prisma.$executeRaw `
      UPDATE "SystemStatus"
      SET "status" = ${SystemStatusState.ERROR},
          "message" = ${err.message},
          "updatedAt" = NOW()
      WHERE "type" = ${SystemStatusType.FILE_WATCHER}
    `;
        await createAuditLog({
            action: AuditAction.SYSTEM_ERROR,
            metadata: {
                entityType: 'file_watcher',
                error: err.message
            },
            userId: 'system'
        });
    }
}
export const fileWatcher = new FileWatcher(join(process.cwd(), 'templates'));
