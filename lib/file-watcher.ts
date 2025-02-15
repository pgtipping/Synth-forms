import { watch } from 'chokidar';
import { join } from 'path';
import { prisma } from './prisma';
import { createAuditLog } from './audit';
import { Prisma, TemplateStatus, AuditAction } from '@prisma/client';
import { BasicTemplate, validateTemplate } from './basic-validation';
import { CloudDocumentConverter } from './cloud-converter';
import { LocalDocumentConverter } from './local-converter';

export enum SystemStatusType {
  FILE_WATCHER = 'FILE_WATCHER',
  TEMPLATE_PROCESSOR = 'TEMPLATE_PROCESSOR',
  FORM_CONVERTER = 'FORM_CONVERTER'
}

export enum SystemStatusState {
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR'
}

export class FileWatcher {
  private watcher: ReturnType<typeof watch> | null = null;
  private watchPath: string;
  private converter: CloudDocumentConverter;

  constructor(watchPath: string) {
    this.watchPath = watchPath;
    this.converter = new CloudDocumentConverter();
  }

  async start() {
    if (this.watcher) {
      return;
    }

    try {
      // Create system status record
      await prisma.$executeRaw`
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
        .on('error', (err: unknown) => { void this.handleError(err); });

      await prisma.$executeRaw`
        UPDATE "SystemStatus"
        SET "status" = ${SystemStatusState.RUNNING},
            "message" = 'File watcher is running',
            "updatedAt" = NOW()
        WHERE "type" = ${SystemStatusType.FILE_WATCHER}
      `;

    } catch (error) {
      await this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async stop() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;

      await prisma.$executeRaw`
        UPDATE "SystemStatus"
        SET "status" = ${SystemStatusState.STOPPED},
            "message" = 'File watcher has been stopped',
            "updatedAt" = NOW()
        WHERE "type" = ${SystemStatusType.FILE_WATCHER}
      `;
    }
  }

  private async handleFileAdd(filePath: string) {
    try {
      // Convert the document using Google Cloud Document AI
      const conversionResult = await this.converter.convert(filePath);
      
      if (!conversionResult.success) {
        console.error('Document conversion failed:', conversionResult.error);
        return;
      }

      const basicTemplate: BasicTemplate = {
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

    } catch (error) {
      await this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  public async testHandleFileAdd(filePath: string): Promise<void> {
    return this.handleFileAdd(filePath);
  }

  private async handleFileChange(filePath: string) {
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
    } catch (error) {
      await this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async handleFileRemove(filePath: string) {
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
    } catch (error) {
      await this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async handleError(error: unknown) {
    if (!(error instanceof Error)) {
      error = new Error(String(error));
    }
    const err = error as Error;

    console.error('File watcher error:', err);

    await prisma.$executeRaw`
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
