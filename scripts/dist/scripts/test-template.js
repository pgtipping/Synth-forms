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
const test_harness_1 = require("@/lib/converters/test-harness");
const path_1 = require("path");
const promises_1 = require("fs/promises");
function runComparativeTests() {
    return __awaiter(this, void 0, void 0, function* () {
        const testHarness = new test_harness_1.TemplateTestHarness();
        const testFiles = [
            'performance-improvement-plan.pdf',
            'Performance-Management-101-workbook.pdf'
        ];
        const results = [];
        for (const file of testFiles) {
            console.log(`Testing ${file}...`);
            const filePath = (0, path_1.join)(process.cwd(), 'templates', file);
            // Test with all converters
            const fileResults = yield testHarness.runComparativeTest(filePath);
            results.push({
                file,
                results: fileResults
            });
            console.log(`\nResults for ${file}:`);
            console.table(fileResults.map(r => ({
                converter: r.converter,
                duration: `${r.duration}ms`,
                fields: r.fieldCount,
                confidence: `${(r.confidence * 100).toFixed(1)}%`,
                error: r.error || 'None'
            })));
        }
        // Save detailed results
        yield (0, promises_1.writeFile)((0, path_1.join)(process.cwd(), 'conversion-test-results.json'), JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
    });
}
// Run tests
runComparativeTests().catch(console.error);
