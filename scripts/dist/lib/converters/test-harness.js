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
exports.TemplateTestHarness = void 0;
const cloud_converter_1 = require("@/lib/cloud-converter");
const local_form_converter_1 = require("@/lib/converters/local-form-converter");
const local_converter_1 = require("@/lib/converters/local-converter");
const pdf_converter_1 = require("@/lib/converters/pdf-converter");
const office_converter_1 = require("@/lib/converters/office-converter");
const promises_1 = require("fs/promises");
const path_1 = require("path");
class TemplateTestHarness {
    constructor() {
        this.converters = {
            cloud: new cloud_converter_1.CloudDocumentConverter(),
            localForm: new local_form_converter_1.LocalFormConverter(),
            localDoc: new local_converter_1.LocalDocumentConverter(),
            pdf: new pdf_converter_1.PDFConverter(),
            office: new office_converter_1.OfficeConverter()
        };
    }
    testSingleConverter(converter, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const start = Date.now();
            try {
                const result = yield this.converters[converter].convert(filePath);
                const duration = Date.now() - start;
                return {
                    converter,
                    duration,
                    fieldCount: ((_a = result.content) === null || _a === void 0 ? void 0 : _a.fields.length) || 0,
                    confidence: this.calculateConfidence(result)
                };
            }
            catch (error) {
                return {
                    converter,
                    duration: Date.now() - start,
                    fieldCount: 0,
                    confidence: 0,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });
    }
    calculateConfidence(result) {
        var _a;
        if (!((_a = result.content) === null || _a === void 0 ? void 0 : _a.fields))
            return 0;
        const fields = result.content.fields;
        let totalConfidence = 0;
        for (const field of fields) {
            // Weight factors for confidence calculation
            const hasName = field.name ? 1 : 0;
            const hasType = field.type ? 1 : 0;
            const hasValue = field.value !== undefined ? 1 : 0;
            const fieldConfidence = field.confidence || 0;
            totalConfidence += (hasName + hasType + hasValue + fieldConfidence) / 4;
        }
        return fields.length > 0 ? totalConfidence / fields.length : 0;
    }
    testTemplate(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileExt = (0, path_1.extname)(filePath).toLowerCase();
            const metrics = [];
            // Test appropriate converters based on file type
            if (fileExt === '.pdf') {
                // Add converter identification
                const cloudResult = yield this.testSingleConverter('cloud', filePath);
                cloudResult.converter = 'CloudDocumentConverter';
                const localFormResult = yield this.testSingleConverter('localForm', filePath);
                localFormResult.converter = 'LocalFormConverter';
                const localDocResult = yield this.testSingleConverter('localDoc', filePath);
                localDocResult.converter = 'LocalDocumentConverter';
                metrics.push(cloudResult, localFormResult, localDocResult);
            }
            else if (['.docx', '.xlsx'].includes(fileExt)) {
                // Convert to PDF first using OfficeConverter
                const pdfResult = yield this.converters.office.convert(filePath);
                if (pdfResult.success && pdfResult.path) {
                    const cloudResult = yield this.testSingleConverter('cloud', pdfResult.path);
                    cloudResult.converter = 'CloudDocumentConverter';
                    const localFormResult = yield this.testSingleConverter('localForm', pdfResult.path);
                    localFormResult.converter = 'LocalFormConverter';
                    const localDocResult = yield this.testSingleConverter('localDoc', pdfResult.path);
                    localDocResult.converter = 'LocalDocumentConverter';
                    metrics.push(cloudResult, localFormResult, localDocResult);
                    // Cleanup temporary PDF
                    yield (0, promises_1.unlink)(pdfResult.path);
                }
            }
            return metrics;
        });
    }
    analyzeResults(metrics) {
        return __awaiter(this, void 0, void 0, function* () {
            const validResults = metrics.filter(m => !m.error);
            if (validResults.length === 0) {
                return {
                    bestOverall: 'none',
                    bestConfidence: 'none',
                    bestSpeed: 'none',
                    recommendations: ['All converters failed']
                };
            }
            const bestConfidence = validResults.reduce((a, b) => a.confidence > b.confidence ? a : b);
            const bestSpeed = validResults.reduce((a, b) => a.duration < b.duration ? a : b);
            // Weight factors for overall score
            const scores = validResults.map(m => ({
                converter: m.converter,
                score: (m.confidence * 0.6) + (1 - m.duration / Math.max(...validResults.map(r => r.duration)) * 0.4)
            }));
            const bestOverall = scores.reduce((a, b) => a.score > b.score ? a : b);
            const recommendations = [
                `Best overall converter: ${bestOverall.converter}`,
                `Highest confidence: ${bestConfidence.converter} (${bestConfidence.confidence.toFixed(2)})`,
                `Fastest conversion: ${bestSpeed.converter} (${bestSpeed.duration}ms)`
            ];
            if (bestConfidence.confidence < 0.7) {
                recommendations.push('Warning: Low confidence scores, manual verification recommended');
            }
            return {
                bestOverall: bestOverall.converter,
                bestConfidence: bestConfidence.converter,
                bestSpeed: bestSpeed.converter,
                recommendations
            };
        });
    }
}
exports.TemplateTestHarness = TemplateTestHarness;
