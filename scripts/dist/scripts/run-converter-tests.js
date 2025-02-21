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
function runConverterTests() {
    return __awaiter(this, void 0, void 0, function* () {
        const testHarness = new test_harness_1.TemplateTestHarness();
        const testFiles = [
            (0, path_1.join)(process.cwd(), '../Free Templates and Forms/Perf Mgt/Employee Performance Evaluation Form dl.docx')
        ];
        const results = [];
        for (const filePath of testFiles) {
            console.log(`Testing file: ${filePath}`);
            try {
                const metrics = yield testHarness.testTemplate(filePath);
                const analysis = yield testHarness.analyzeResults(metrics);
                results.push({
                    file: filePath,
                    metrics,
                    analysis,
                    timestamp: new Date().toISOString()
                });
                console.log('\nResults for', filePath);
                console.log('-------------------');
                console.log('\nDetailed Metrics:');
                for (const metric of metrics) {
                    console.log(`\nConverter: ${metric.converter}`);
                    console.log(`Fields Detected: ${metric.fieldCount}`);
                    console.log(`Confidence Score: ${(metric.confidence * 100).toFixed(1)}%`);
                    console.log(`Processing Time: ${metric.duration}ms`);
                    if (metric.error) {
                        console.log(`Error: ${metric.error}`);
                    }
                }
                console.log('\nAnalysis:');
                for (const rec of analysis.recommendations) {
                    console.log(rec);
                }
                console.log('\n');
            }
            catch (error) {
                console.error(`Error testing ${filePath}:`, error);
            }
        }
        // Save detailed results to file
        const outputPath = (0, path_1.join)(process.cwd(), 'converter-test-results.json');
        yield (0, promises_1.writeFile)(outputPath, JSON.stringify(results, null, 2));
        console.log(`Full results saved to ${outputPath}`);
    });
}
runConverterTests().catch(console.error);
