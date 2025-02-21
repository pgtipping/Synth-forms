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
exports.convertToPDF = convertToPDF;
const fs_1 = require("fs");
const path_1 = require("path");
const uuid_1 = require("uuid");
const office_watermark_1 = require("../office-watermark");
const office_watermark_2 = require("../office-watermark");
function convertToPDF(inputPath_1) {
    return __awaiter(this, arguments, void 0, function* (inputPath, options = { outputFormat: 'pdf', deleteOriginal: false }) {
        // Check for watermarks in Office documents
        if (inputPath.endsWith('.docx') || inputPath.endsWith('.xlsx')) {
            const hasWatermark = yield (0, office_watermark_1.detectOfficeWatermark)(inputPath, {}, {});
            if (hasWatermark) {
                throw new Error('Document contains watermark');
            }
        }
        try {
            // Read file
            const input = yield fs_1.promises.readFile(inputPath);
            // Determine output path
            const ext = options.outputFormat;
            const outputFileName = `${(0, uuid_1.v4)()}.${ext}`;
            const outputDir = (0, path_1.join)(process.cwd(), 'temp');
            const outputPath = (0, path_1.join)(outputDir, outputFileName);
            // Ensure temp directory exists
            try {
                yield fs_1.promises.access(outputDir);
            }
            catch (_a) {
                yield fs_1.promises.mkdir(outputDir);
            }
            // Convert file
            const output = yield (0, office_watermark_2.convertAsync)(String(inputPath), {}, {});
            yield fs_1.promises.writeFile(outputPath, output);
            // Optionally delete original
            if (options.deleteOriginal) {
                yield fs_1.promises.unlink(inputPath);
            }
            return { path: outputPath, isTemporary: true };
        }
        catch (error) {
            console.error('Document conversion error:', error);
            throw new Error(`Failed to convert document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });
}
