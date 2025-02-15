import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from './prisma';
import config from '../config/conversion-rules';


interface FileInfo {
  path: string;
  hash: string;
  size: number;
  lastModified: Date;
}

interface DuplicateGroup {
  hash: string;
  files: FileInfo[];
}

export class TemplateDeduplicate {
  private async calculateFileHash(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  }

  private async getFileInfo(filePath: string): Promise<FileInfo> {
    const stats = await fs.stat(filePath);
    const hash = await this.calculateFileHash(filePath);
    
    return {
      path: filePath,
      hash,
      size: stats.size,
      lastModified: stats.mtime
    };
  }

  private isExcluded(filePath: string): boolean {
    return config.excludePatterns.some(pattern => 
      filePath.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  async findDuplicates(directory: string): Promise<DuplicateGroup[]> {
    const duplicateGroups: Map<string, FileInfo[]> = new Map();
    
    async function* walkDirectory(dir: string): AsyncGenerator<string> {
      const files = await fs.readdir(dir, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          yield* walkDirectory(fullPath);
        } else {
          yield fullPath;
        }
      }
    }

    // Walk through directory and collect file info
    for await (const filePath of walkDirectory(directory)) {
      if (this.isExcluded(filePath)) continue;
      
      const fileInfo = await this.getFileInfo(filePath);
      const existingGroup = duplicateGroups.get(fileInfo.hash) || [];
      duplicateGroups.set(fileInfo.hash, [...existingGroup, fileInfo]);
    }

    // Filter out unique files and format results
    return Array.from(duplicateGroups.entries())
      .filter(([_, files]) => files.length > 1)
      .map(([hash, files]) => ({ hash, files }));
  }

  async cleanupDuplicates(duplicates: DuplicateGroup[]): Promise<void> {
    const cleanupDir = path.join(process.cwd(), 'duplicates_backup');
    await fs.mkdir(cleanupDir, { recursive: true });

    for (const group of duplicates) {
      // Sort files by last modified date, keeping the newest
      const sortedFiles = group.files.sort((a, b) => 
        b.lastModified.getTime() - a.lastModified.getTime()
      );
      
      // Keep the newest file, move others to backup
      const [keep, ...toMove] = sortedFiles;
      
      for (const file of toMove) {
        const backupPath = path.join(
          cleanupDir, 
          path.basename(file.path)
        );
        
        // Move to backup directory
        await fs.rename(file.path, backupPath);
        
        // Log the operation in the database
        await prisma.auditLog.create({
          data: {
            action: 'TEMPLATE_UPDATE',
            entityType: 'TEMPLATE',
            entityId: path.basename(file.path),
            metadata: {
              originalPath: file.path,
              backupPath: backupPath,
              operation: 'duplicate_cleanup'
            }
          }
        });
      }
    }
  }

  async generateReport(duplicates: DuplicateGroup[]): Promise<string> {
    let report = '# Template Duplication Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    for (const group of duplicates) {
      report += `## Duplicate Group (Hash: ${group.hash.slice(0, 8)})\n\n`;
      for (const file of group.files) {
        report += `- ${file.path}\n`;
        report += `  Size: ${(file.size / 1024).toFixed(2)}KB\n`;
        report += `  Last Modified: ${file.lastModified.toISOString()}\n\n`;
      }
      report += '\n';
    }

    return report;
  }
}
