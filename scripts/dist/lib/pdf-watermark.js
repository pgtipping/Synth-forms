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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectPDFWatermark = detectPDFWatermark;
const promises_1 = __importDefault(require("fs/promises"));
const conversion_rules_1 = __importDefault(require("../config/conversion-rules"));
const pdfjs = __importStar(require("pdfjs-dist"));
const canvas_1 = require("canvas");
function detectTextWatermark(page, pageNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get all text content from the page
            const textContent = yield page.getTextContent();
            const items = textContent.items;
            for (const item of items) {
                const text = item.str;
                const textLower = text.toLowerCase();
                // Check for exact matches and patterns
                const hasExactMatch = conversion_rules_1.default.watermark.textKeywords.some(keyword => textLower.includes(keyword.toLowerCase()));
                const hasPatternMatch = conversion_rules_1.default.watermark.patterns && (conversion_rules_1.default.watermark.patterns.fullPattern.test(text) ||
                    (conversion_rules_1.default.watermark.patterns.urlPattern.test(text) &&
                        conversion_rules_1.default.watermark.patterns.samplePattern.test(text)));
                if (hasExactMatch || hasPatternMatch) {
                    // Check for watermark characteristics
                    const isLargeFont = item.height > 20; // Large text
                    const isTransparent = item.color && item.color[3] < 1; // Alpha channel < 1
                    const isDiagonal = Math.abs(item.transform[1]) > 0.1; // Rotated text
                    // Additional confidence for businessdriver.ng specific patterns
                    const isBusinessDriverWatermark = conversion_rules_1.default.watermark.patterns.fullPattern.test(text);
                    const confidence = [
                        isLargeFont ? 0.2 : 0,
                        isTransparent ? 0.2 : 0,
                        isDiagonal ? 0.2 : 0,
                        hasPatternMatch ? 0.2 : 0,
                        isBusinessDriverWatermark ? 0.2 : 0
                    ].reduce((a, b) => a + b, 0);
                    if (confidence > 0.3) {
                        return {
                            hasWatermark: true,
                            type: 'text',
                            content: item.str,
                            confidence,
                            location: {
                                page: pageNumber,
                                x: item.transform[4],
                                y: item.transform[5],
                                rotation: Math.atan2(item.transform[1], item.transform[0]) * (180 / Math.PI)
                            }
                        };
                    }
                }
            }
            return null;
        }
        catch (error) {
            console.error('Error detecting text watermark:', error);
            return null;
        }
    });
}
function detectImageWatermark(page, pageNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const operatorList = yield page.getOperatorList();
            const canvas = (0, canvas_1.createCanvas)(page.view[2], page.view[3]);
            const ctx = canvas.getContext('2d');
            for (const op of operatorList.fnArray) {
                if (op === pdfjs.OPS.paintXObject || op === pdfjs.OPS.paintImageXObject) {
                    // Get image data
                    const imgData = yield page.objs.get(op.args[0]);
                    // Check image characteristics typical of watermarks
                    const isLargeImage = imgData.width > page.view[2] / 2 || imgData.height > page.view[3] / 2;
                    const hasTransparency = imgData.data.some((value, index) => index % 4 === 3 && value < 255);
                    const isCentered = Math.abs(imgData.x - page.view[2] / 2) < 100 && Math.abs(imgData.y - page.view[3] / 2) < 100;
                    const confidence = [
                        isLargeImage ? 0.3 : 0,
                        hasTransparency ? 0.4 : 0,
                        isCentered ? 0.3 : 0
                    ].reduce((a, b) => a + b, 0);
                    if (confidence > 0.5) {
                        return {
                            hasWatermark: true,
                            type: 'image',
                            confidence,
                            location: {
                                page: pageNumber,
                                x: imgData.x,
                                y: imgData.y
                            }
                        };
                    }
                }
            }
            return null;
        }
        catch (error) {
            console.error('Error detecting image watermark:', error);
            return null;
        }
    });
}
function detectPDFWatermark(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield promises_1.default.readFile(filePath);
            const pdf = yield pdfjs.getDocument({ data }).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = yield pdf.getPage(i);
                // Check for text watermarks
                const textResult = yield detectTextWatermark(page, i);
                if (textResult) {
                    return textResult;
                }
                // Check for image watermarks
                const imageResult = yield detectImageWatermark(page, i);
                if (imageResult) {
                    return imageResult;
                }
            }
            return {
                hasWatermark: false,
                confidence: 0
            };
        }
        catch (error) {
            console.error(`Error processing ${filePath}:`, error);
            return {
                hasWatermark: false,
                confidence: 0
            };
        }
    });
}
