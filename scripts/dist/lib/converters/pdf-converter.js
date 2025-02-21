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
exports.convertPDF = convertPDF;
const ai_form_recognizer_1 = require("@azure/ai-form-recognizer");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const fs_1 = require("fs");
function convertPDF(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Read the PDF file
            const dataBuffer = yield fs_1.promises.readFile(filePath);
            // First, extract text using pdf-parse
            const pdfData = yield (0, pdf_parse_1.default)(dataBuffer);
            // Initialize Azure Form Recognizer client
            // Note: These should be in environment variables
            const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT || "";
            const apiKey = process.env.AZURE_FORM_RECOGNIZER_KEY || "";
            if (!endpoint || !apiKey) {
                return {
                    success: false,
                    error: "Azure Form Recognizer credentials not configured"
                };
            }
            const client = new ai_form_recognizer_1.DocumentAnalysisClient(endpoint, new ai_form_recognizer_1.AzureKeyCredential(apiKey));
            // Analyze the document
            const poller = yield client.beginAnalyzeDocument("prebuilt-document", dataBuffer);
            const result = yield poller.pollUntilDone();
            // Extract form fields
            const fields = result.fields;
            const extractedData = (fields === null || fields === void 0 ? void 0 : fields.map((field) => {
                var _a;
                return ({
                    name: field.name || 'unnamed_field',
                    type: field.type || 'text', // Default to text type if not specified
                    value: (_a = field.value) === null || _a === void 0 ? void 0 : _a.toString(),
                    bounds: field.bounds ? {
                        x: field.bounds.x || 0,
                        y: field.bounds.y || 0,
                        height: field.bounds.height || 0,
                        width: field.bounds.width || 0
                    } : undefined
                });
            })) || [];
            return {
                success: true,
                content: {
                    text: pdfData.text,
                    fields: extractedData
                }
            };
        }
        catch (error) {
            console.error('PDF conversion error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during PDF conversion'
            };
        }
    });
}
