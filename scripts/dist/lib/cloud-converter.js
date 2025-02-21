"use strict";
/// <reference path="./documentai-augmentations.d.ts" />
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
exports.CloudDocumentConverter = void 0;
const documentai_1 = require("@google-cloud/documentai");
const fs_1 = require("fs");
const document_converter_1 = require("./document-converter");
class CloudDocumentConverter {
    constructor() {
        this.client = new documentai_1.DocumentProcessorServiceClient();
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        const location = process.env.GOOGLE_CLOUD_LOCATION || 'us'; // Default to 'us'
        if (!projectId) {
            throw new Error('Google Cloud Project ID not configured');
        }
        // Use the Form Parser processor
        this.processorName = `projects/${projectId}/locations/${location}/processors/form-parser-latest`;
    }
    convert(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            let pdfConversion = null;
            try {
                if (!this.processorName) {
                    throw new Error('Google Document AI processor not configured');
                }
                // Convert non-PDF files to PDF first
                let pdfPath = filePath;
                if (filePath.endsWith('.docx') || filePath.endsWith('.xlsx')) {
                    pdfConversion = yield (0, document_converter_1.convertToPDF)(filePath);
                    pdfPath = pdfConversion.path;
                }
                // Read the file
                const buffer = yield fs_1.promises.readFile(pdfPath);
                const content = buffer.toString('base64');
                const request = {
                    name: this.processorName,
                    document: {
                        content,
                        mimeType: 'application/pdf',
                    }
                };
                // Process the document
                const [result] = yield this.client.processDocument(request);
                const { document } = result;
                if (!document) {
                    throw new Error('No document in response');
                }
                // Extract form fields
                const fields = ((_c = (_b = (_a = document.forms) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.fields) === null || _c === void 0 ? void 0 : _c.map((field) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
                    return ({
                        name: ((_b = (_a = field.fieldName) === null || _a === void 0 ? void 0 : _a.textAnchor) === null || _b === void 0 ? void 0 : _b.content) || 'unnamed_field',
                        type: this.inferFieldType(field),
                        value: (_d = (_c = field.fieldValue) === null || _c === void 0 ? void 0 : _c.textAnchor) === null || _d === void 0 ? void 0 : _d.content,
                        bounds: field.boundingPoly ? {
                            x: ((_f = (_e = field.boundingPoly.normalizedVertices) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.x) || 0,
                            y: ((_h = (_g = field.boundingPoly.normalizedVertices) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.y) || 0,
                            width: (((_k = (_j = field.boundingPoly.normalizedVertices) === null || _j === void 0 ? void 0 : _j[2]) === null || _k === void 0 ? void 0 : _k.x) || 0) - (((_m = (_l = field.boundingPoly.normalizedVertices) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.x) || 0),
                            height: (((_p = (_o = field.boundingPoly.normalizedVertices) === null || _o === void 0 ? void 0 : _o[2]) === null || _p === void 0 ? void 0 : _p.y) || 0) - (((_r = (_q = field.boundingPoly.normalizedVertices) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.y) || 0),
                        } : undefined
                    });
                })) || [];
                return {
                    success: true,
                    content: {
                        text: document.text || '',
                        fields
                    }
                };
            }
            catch (error) {
                console.error('Cloud conversion error:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error during cloud conversion'
                };
            }
            finally {
                // Clean up temporary PDF if it was created
                if (pdfConversion === null || pdfConversion === void 0 ? void 0 : pdfConversion.isTemporary) {
                    try {
                        yield fs_1.promises.unlink(pdfConversion.path);
                    }
                    catch (error) {
                        console.error('Failed to clean up temporary PDF:', error);
                    }
                }
            }
        });
    }
    inferFieldType(field) {
        var _a, _b;
        // Add logic to infer field type based on content and context
        // This is a basic implementation
        const value = ((_b = (_a = field.fieldValue) === null || _a === void 0 ? void 0 : _a.textAnchor) === null || _b === void 0 ? void 0 : _b.content) || '';
        if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value))
            return 'date';
        if (/^\d+$/.test(value))
            return 'number';
        if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value))
            return 'email';
        if (/^(true|false|yes|no)$/i.test(value))
            return 'checkbox';
        return 'text';
    }
}
exports.CloudDocumentConverter = CloudDocumentConverter;
