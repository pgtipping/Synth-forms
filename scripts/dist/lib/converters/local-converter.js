"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.LocalDocumentConverter = void 0;
const tesseract_js_1 = require("tesseract.js");
const pdfjs = __importStar(require("pdfjs-dist"));
const fs_1 = require("fs");
class LocalDocumentConverter {
    constructor() {
        this.initializeWorker();
    }
    initializeWorker() {
        return __awaiter(this, void 0, void 0, function* () {
            this.worker = yield (0, tesseract_js_1.createWorker)('eng');
        });
    }
    convert(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.worker) {
                    yield this.initializeWorker();
                }
                // Load the PDF document
                const data = yield pdfjs.getDocument({ data: new Uint8Array(yield fs_1.promises.readFile(filePath)) });
                const pdfDocument = yield data.promise;
                // Get the first page
                const page = yield pdfDocument.getPage(1);
                // Get text content
                const textContent = yield page.getTextContent();
                const text = textContent.items.map((item) => item.str).join(' ');
                // Perform OCR on the page
                const { data: { words } } = yield this.worker.recognize(filePath);
                // Convert words to form fields
                const fields = this.detectFields(words, text);
                return {
                    success: true,
                    content: {
                        text,
                        fields
                    }
                };
            }
            catch (error) {
                console.error('Local conversion error:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error during local conversion'
                };
            }
        });
    }
    detectFields(words, text) {
        const fields = [];
        const commonLabels = ['name', 'email', 'phone', 'address', 'date', 'signature'];
        words.forEach((word, index) => {
            const wordText = word.text.toLowerCase();
            // Check if word matches common form field labels
            const matchedLabel = commonLabels.find(label => wordText.includes(label));
            if (matchedLabel) {
                fields.push({
                    name: word.text,
                    type: this.inferFieldType(matchedLabel),
                    bounds: {
                        x: word.bbox.x0,
                        y: word.bbox.y0,
                        width: word.bbox.x1 - word.bbox.x0,
                        height: word.bbox.y1 - word.bbox.y0
                    }
                });
            }
        });
        return fields;
    }
    inferFieldType(label) {
        switch (label.toLowerCase()) {
            case 'email':
                return 'email';
            case 'phone':
                return 'tel';
            case 'date':
                return 'date';
            case 'signature':
                return 'signature';
            default:
                return 'text';
        }
    }
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.worker) {
                yield this.worker.terminate();
            }
        });
    }
}
exports.LocalDocumentConverter = LocalDocumentConverter;
