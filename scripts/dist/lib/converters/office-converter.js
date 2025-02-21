"use strict";
// Mark this file as server-only
'use server';
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
exports.OfficeConverter = void 0;
const mammoth_1 = __importDefault(require("mammoth"));
const xlsx_1 = __importDefault(require("xlsx"));
const path_1 = __importDefault(require("path"));
const jsdom_1 = require("jsdom");
const uuid_1 = require("uuid");
const watermark_1 = require("../shared/watermark");
const field_detection_1 = require("../shared/field-detection");
const form_structure_1 = require("../shared/form-structure");
class OfficeConverter {
    constructor() {
        this.fields = [];
        this.confidence = 0;
    }
    convert(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check for watermarks
                const hasWatermark = yield (0, watermark_1.detectOfficeWatermark)(filePath, {}, {});
                if (hasWatermark) {
                    return {
                        success: false,
                        content: null,
                        error: 'Document contains watermark',
                        fields: [],
                        confidence: 0
                    };
                }
                // Convert based on file type
                const ext = path_1.default.extname(filePath).toLowerCase();
                if (ext === '.xlsx') {
                    return this.convertXLSX(filePath);
                }
                // Convert DOCX to HTML
                const result = yield mammoth_1.default.convertToHtml({ path: filePath });
                const { fields, confidence } = this.detectFields(result.value);
                return {
                    success: true,
                    content: result.value,
                    fields,
                    confidence
                };
            }
            catch (error) {
                return {
                    success: false,
                    content: null,
                    error: `Conversion failed: ${error.message}`,
                    fields: [],
                    confidence: 0
                };
            }
        });
    }
    detectFields(html) {
        const dom = new jsdom_1.JSDOM(html);
        const document = dom.window.document;
        const paragraphs = document.querySelectorAll('p');
        const fields = [];
        let totalConfidence = 0;
        let fieldCount = 0;
        paragraphs.forEach((p, index) => {
            var _a, _b;
            const text = ((_a = p.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            if (!text)
                return;
            // Skip if it's just a number or bullet point
            if (/^[\d•·-]$/.test(text))
                return;
            const label = ((_b = text.split(':')[0]) === null || _b === void 0 ? void 0 : _b.trim()) || text;
            const type = (0, field_detection_1.detectFieldType)(label, text);
            const validation = (0, field_detection_1.detectValidationRules)(label, text);
            const ratingScale = type === 'rating' ? (0, field_detection_1.detectRatingScale)(text) : undefined;
            const field = {
                id: (0, uuid_1.v4)(),
                type,
                label,
                required: validation.some(rule => rule.type === 'required'),
                validation,
                section: this.detectSection(text, index, paragraphs),
                ratingScale
            };
            fields.push(field);
            totalConfidence += this.calculateFieldConfidence(field);
            fieldCount++;
        });
        // Process form structure
        const sections = (0, form_structure_1.processFormStructure)(fields);
        const mergedSections = (0, form_structure_1.mergeSections)(sections);
        const isValid = (0, form_structure_1.validateFormStructure)(mergedSections);
        return {
            fields: mergedSections,
            confidence: fieldCount > 0 ? totalConfidence / fieldCount : 0
        };
    }
    calculateFieldConfidence(field) {
        let confidence = 0.5; // Base confidence
        // Adjust based on field properties
        if (field.validation && field.validation.length > 0)
            confidence += 0.1;
        if (field.type !== 'input')
            confidence += 0.1; // Non-default type detection
        if (field.ratingScale)
            confidence += 0.1;
        if (field.section)
            confidence += 0.1;
        return Math.min(confidence, 1); // Cap at 1.0
    }
    detectSection(text, index, paragraphs) {
        var _a;
        // Look back for the nearest heading-like text
        for (let i = index - 1; i >= 0; i--) {
            const p = paragraphs[i];
            const pText = ((_a = p.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            if (pText &&
                (p.tagName === 'H1' ||
                    p.tagName === 'H2' ||
                    p.tagName === 'H3' ||
                    p.tagName === 'H4' ||
                    /^[A-Z][\w\s]{2,}:?$/.test(pText) || // Capitalized text ending with optional colon
                    /^\d+\.\s+[A-Z]/.test(pText)) // Numbered sections
            ) {
                return pText;
            }
        }
        return undefined;
    }
    convertXLSX(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const workbook = xlsx_1.default.readFile(filePath);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const data = xlsx_1.default.utils.sheet_to_json(worksheet, { header: 1 });
                const fields = [];
                let totalConfidence = 0;
                let fieldCount = 0;
                // Process headers as field labels
                const headers = data[0];
                headers.forEach((header, index) => {
                    if (!header)
                        return;
                    const type = (0, field_detection_1.detectFieldType)(header, '');
                    const validation = (0, field_detection_1.detectValidationRules)(header, '');
                    const field = {
                        id: (0, uuid_1.v4)(),
                        type,
                        label: header,
                        required: validation.some(rule => rule.type === 'required'),
                        validation
                    };
                    fields.push(field);
                    totalConfidence += this.calculateFieldConfidence(field);
                    fieldCount++;
                });
                // Process form structure
                const sections = (0, form_structure_1.processFormStructure)(fields);
                const mergedSections = (0, form_structure_1.mergeSections)(sections);
                return {
                    success: true,
                    content: data,
                    fields: mergedSections,
                    confidence: fieldCount > 0 ? totalConfidence / fieldCount : 0
                };
            }
            catch (error) {
                return {
                    success: false,
                    content: null,
                    error: `Excel conversion failed: ${error.message}`,
                    fields: [],
                    confidence: 0
                };
            }
        });
    }
}
exports.OfficeConverter = OfficeConverter;
