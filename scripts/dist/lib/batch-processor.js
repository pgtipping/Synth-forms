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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchProcessor = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const local_form_converter_1 = require("./local-form-converter");
const prisma_1 = require("./prisma");
const pdf_watermark_1 = require("./pdf-watermark");
const document_converter_1 = require("./document-converter");
const office_converter_1 = require("./office-converter");
const pdf_converter_1 = require("./pdf-converter");
class BatchProcessor {
    constructor() {
        this.processedCount = 0;
        this.errors = [];
        this.convertedTemplates = [];
        this.converter = new local_form_converter_1.LocalFormConverter();
    }
    processBatch(directoryPath_1) {
        return __awaiter(this, arguments, void 0, function* (directoryPath, options = {}) {
            const { recursive = true, fileTypes = ['pdf', 'docx', 'xlsx'], skipWatermarked = true } = options;
            // Get all files in directory
            const files = yield this.getFiles(directoryPath, recursive, fileTypes);
            // Process each file
            for (const file of files) {
                try {
                    // Check file type
                    const fileType = path_1.default.extname(file).toLowerCase().slice(1);
                    if (!fileTypes.includes(fileType)) {
                        continue;
                    }
                    // Convert to PDF if needed
                    let pdfPath = file;
                    if (fileType !== 'pdf') {
                        const conversion = yield (0, document_converter_1.convertToPDF)(file);
                        pdfPath = conversion.path;
                    }
                    // Check for watermarks if required
                    if (skipWatermarked) {
                        const watermarkResult = yield (0, pdf_watermark_1.detectPDFWatermark)(pdfPath);
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
                        result = yield (0, office_converter_1.convertDOCX)(file);
                    }
                    else if (fileType === 'xlsx') {
                        result = yield (0, office_converter_1.convertXLSX)(file);
                    }
                    else if (fileType === 'pdf') {
                        result = yield (0, pdf_converter_1.convertPDF)(file);
                    }
                    else {
                        throw new Error('Unsupported file type');
                    }
                    if (!result.success) {
                        throw new Error(result.error || 'Unknown conversion error');
                    }
                    // Create template in database
                    const template = yield prisma_1.prisma.template.create({
                        data: {
                            title: path_1.default.basename(file, path_1.default.extname(file)),
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
        });
    }
    getFiles(dir, recursive, fileTypes) {
        return __awaiter(this, void 0, void 0, function* () {
            const dirents = yield fs_1.promises.readdir(dir, { withFileTypes: true });
            const files = yield Promise.all(dirents.map((dirent) => __awaiter(this, void 0, void 0, function* () {
                const res = path_1.default.resolve(dir, dirent.name);
                if (dirent.isDirectory()) {
                    return recursive ? this.getFiles(res, recursive, fileTypes) : [];
                }
                return fileTypes.includes(path_1.default.extname(res).slice(1).toLowerCase()) ? [res] : [];
            })));
            return files.flat();
        });
    }
}
exports.BatchProcessor = BatchProcessor;
