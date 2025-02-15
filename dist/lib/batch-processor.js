import { promises as fs } from 'fs';
import path from 'path';
import { LocalFormConverter } from './local-form-converter';
import { prisma } from './prisma';
import { detectPDFWatermark } from './pdf-watermark';
import { convertToPDF } from './document-converter';
import { convertDOCX, convertXLSX } from './office-converter';
import { convertPDF } from './pdf-converter';
export class BatchProcessor {
    constructor() {
        this.processedCount = 0;
        this.errors = [];
        this.convertedTemplates = [];
        this.converter = new LocalFormConverter();
    }
    async processBatch(directoryPath, options = {}) {
        const { recursive = true, fileTypes = ['pdf', 'docx', 'xlsx'], skipWatermarked = true } = options;
        // Get all files in directory
        const files = await this.getFiles(directoryPath, recursive, fileTypes);
        // Process each file
        for (const file of files) {
            try {
                // Check file type
                const fileType = path.extname(file).toLowerCase().slice(1);
                if (!fileTypes.includes(fileType)) {
                    continue;
                }
                // Convert to PDF if needed
                let pdfPath = file;
                if (fileType !== 'pdf') {
                    const conversion = await convertToPDF(file);
                    pdfPath = conversion.path;
                }
                // Check for watermarks if required
                if (skipWatermarked) {
                    const watermarkResult = await detectPDFWatermark(pdfPath);
                    if (watermarkResult.hasWatermark) {
                        this.errors.push({
                            file,
                            error: 'Document contains watermark'
                        });
                        continue;
                    }
                }
                // Convert document based on type
                let result;
                if (fileType === 'docx') {
                    result = await convertDOCX(file);
                }
                else if (fileType === 'xlsx') {
                    result = await convertXLSX(file);
                }
                else if (fileType === 'pdf') {
                    result = await convertPDF(file);
                }
                else {
                    throw new Error('Unsupported file type');
                }
                if (!result.success) {
                    throw new Error(result.error || 'Unknown conversion error');
                }
                // Create template in database
                const template = await prisma.template.create({
                    data: {
                        title: path.basename(file, path.extname(file)),
                        status: 'ACTIVE',
                        categoryId: 'default',
                        content: result.content,
                        isSystemTemplate: true,
                        metadata: {
                            originalFile: file,
                            conversionDate: new Date().toISOString(),
                            batchProcessed: true
                        }
                    }
                });
                this.convertedTemplates.push({
                    originalFile: file,
                    templateId: template.id
                });
                this.processedCount++;
            }
            catch (error) {
                this.errors.push({
                    file,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return {
            totalFiles: files.length,
            successCount: this.processedCount,
            failureCount: this.errors.length,
            errors: this.errors,
            convertedTemplates: this.convertedTemplates
        };
    }
    async getFiles(dir, recursive, fileTypes) {
        const dirents = await fs.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(dirents.map(async (dirent) => {
            const res = path.resolve(dir, dirent.name);
            if (dirent.isDirectory()) {
                return recursive ? this.getFiles(res, recursive, fileTypes) : [];
            }
            return fileTypes.includes(path.extname(res).slice(1).toLowerCase()) ? [res] : [];
        }));
        return files.flat();
    }
}
