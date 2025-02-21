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
const office_converter_1 = require("../lib/converters/office-converter");
const path_1 = require("path");
const promises_1 = require("fs/promises");
function testDirectDocxConversion() {
    return __awaiter(this, void 0, void 0, function* () {
        const docxPath = (0, path_1.join)(process.cwd(), 'Free Templates and Forms/Others/Food tasting evaluation form.docx');
        const results = [];
        console.log('\nTesting Direct DOCX Conversion...');
        try {
            const start = Date.now();
            const officeConverter = new office_converter_1.OfficeConverter();
            const result = yield officeConverter.convert(docxPath);
            const duration = Date.now() - start;
            results.push({
                approach: 'Direct DOCX',
                duration,
                fieldCount: result.fields.length,
                confidence: result.confidence
            });
            console.log('Direct DOCX Results:', results[0]);
            yield (0, promises_1.writeFile)('conversion-test-results.json', JSON.stringify(results, null, 2));
            yield (0, promises_1.writeFile)('detected-fields.json', JSON.stringify(result.fields, null, 2));
        }
        catch (error) {
            console.error('Error during direct DOCX conversion:', error);
        }
    });
}
testDirectDocxConversion().catch(console.error);
