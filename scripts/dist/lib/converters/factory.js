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
exports.ConverterFactory = void 0;
const local_converter_1 = require("./local-converter");
const local_form_converter_1 = require("./local-form-converter");
const pdf_converter_1 = require("./pdf-converter");
const office_converter_1 = require("./office-converter");
class ConverterFactory {
    constructor() {
        this.converters = [];
        // Register available converters
        this.converters = [
            new local_form_converter_1.LocalFormConverter(),
            new local_converter_1.LocalDocumentConverter(),
            new pdf_converter_1.PDFConverter(),
            new office_converter_1.OfficeConverter(),
        ];
    }
    static getInstance() {
        if (!ConverterFactory.instance) {
            ConverterFactory.instance = new ConverterFactory();
        }
        return ConverterFactory.instance;
    }
    getConverter(fileType) {
        return this.converters.find(converter => converter.supports(fileType)) || null;
    }
    convert(filePath, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const fileType = ((_a = filePath.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
            const converter = this.getConverter(fileType);
            if (!converter) {
                return {
                    success: false,
                    error: `No converter available for file type: ${fileType}`
                };
            }
            try {
                return yield converter.convert(filePath, options);
            }
            catch (error) {
                return {
                    success: false,
                    error: `Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                };
            }
        });
    }
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.converters
                .filter(converter => converter.cleanup)
                .map(converter => { var _a; return (_a = converter.cleanup) === null || _a === void 0 ? void 0 : _a.call(converter); }));
        });
    }
}
exports.ConverterFactory = ConverterFactory;
