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
const promises_1 = require("fs/promises");
function testExcelConversion(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = Date.now();
        try {
            const converter = new office_converter_1.OfficeConverter();
            const result = yield converter.convertXLSX(filePath);
            const duration = Date.now() - startTime;
            return {
                approach: 'office-converter',
                duration,
                fieldCount: result.fields.length,
                confidence: result.confidence,
                fields: result.fields
            };
        }
        catch (error) {
            return {
                approach: 'office-converter',
                duration: Date.now() - startTime,
                fieldCount: 0,
                confidence: 0,
                fields: [],
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const excelPath = 'c:/Users/pgeor/OneDrive/Documents/Work/Documents/HR and Business Consulting/Project DIG inputs/Forms and templates/Free Templates and Forms/Competency Assessment/Job Competency Assessment Template_download.xlsx';
        console.log('\nTesting Excel Conversion with Job Competency Assessment Form...');
        try {
            const result = yield testExcelConversion(excelPath);
            console.log('Conversion Results:', {
                approach: result.approach,
                duration: result.duration + 'ms',
                fieldCount: result.fieldCount,
                confidence: result.confidence
            });
            // Save results
            yield (0, promises_1.writeFile)('excel-conversion-results.json', JSON.stringify(result, null, 2));
            if (result.error) {
                console.error('Error:', result.error);
            }
            else {
                console.log('\nDetected Fields:');
                console.log(JSON.stringify(result.fields, null, 2));
            }
        }
        catch (error) {
            console.error('Test failed:', error);
        }
    });
}
main().catch(console.error);
