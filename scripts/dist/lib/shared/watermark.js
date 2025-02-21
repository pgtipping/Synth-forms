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
exports.detectOfficeWatermark = detectOfficeWatermark;
const mammoth_1 = __importDefault(require("mammoth"));
const xlsx_1 = __importDefault(require("xlsx"));
function detectOfficeWatermark(filePath_1) {
    return __awaiter(this, arguments, void 0, function* (filePath, options = {}, context = {}) {
        var _a;
        const fileExt = (_a = filePath.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        try {
            switch (fileExt) {
                case 'docx':
                    return yield detectWordWatermark(filePath);
                case 'xlsx':
                    return yield detectExcelWatermark(filePath);
                default:
                    throw new Error(`Unsupported file type: ${fileExt}`);
            }
        }
        catch (error) {
            console.error(`Error detecting watermark: ${error}`);
            return false;
        }
    });
}
function detectWordWatermark(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield mammoth_1.default.extractRawText({ path: filePath });
        const text = result.value.toLowerCase();
        // Common watermark patterns
        const watermarkPatterns = [
            'draft',
            'confidential',
            'sample',
            'watermark',
            'do not copy',
            'internal use only'
        ];
        return watermarkPatterns.some(pattern => text.includes(pattern.toLowerCase()));
    });
}
function detectExcelWatermark(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const workbook = xlsx_1.default.readFile(filePath);
        const sheetNames = workbook.SheetNames;
        for (const sheetName of sheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const cells = Object.keys(sheet)
                .filter(key => key[0] !== '!') // Exclude special keys
                .map(key => sheet[key].v)
                .filter(Boolean)
                .map(value => String(value).toLowerCase());
            // Check for watermark patterns in cells
            const watermarkPatterns = [
                'draft',
                'confidential',
                'sample',
                'watermark',
                'do not copy',
                'internal use only'
            ];
            if (watermarkPatterns.some(pattern => cells.some(cell => cell.includes(pattern.toLowerCase())))) {
                return true;
            }
        }
        return false;
    });
}
