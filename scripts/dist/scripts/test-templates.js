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
const test_harness_js_1 = require("../lib/converters/test-harness.js");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const url_1 = require("url");
const path_2 = require("path");
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = (0, path_2.dirname)(__filename);
function testTemplates() {
    return __awaiter(this, void 0, void 0, function* () {
        const harness = new test_harness_js_1.TemplateTestHarness();
        const templatesDir = (0, path_1.join)(__dirname, '../free forms and templates');
        try {
            const files = yield (0, promises_1.readdir)(templatesDir);
            const results = new Map();
            for (const file of files) {
                if (!['.pdf', '.docx', '.xlsx'].includes((0, path_1.extname)(file).toLowerCase())) {
                    continue;
                }
                console.log(`Testing ${file}...`);
                const filePath = (0, path_1.join)(templatesDir, file);
                const metrics = yield harness.testTemplate(filePath);
                const analysis = yield harness.analyzeResults(metrics);
                results.set(file, {
                    metrics,
                    analysis
                });
            }
            // Generate report
            let report = '# Template Conversion Test Results\n\n';
            for (const [file, data] of results) {
                report += `## ${file}\n\n`;
                report += '### Metrics\n';
                data.metrics.forEach((m) => {
                    report += `- ${m.converter}:\n`;
                    report += `  - Duration: ${m.duration}ms\n`;
                    report += `  - Fields detected: ${m.fieldCount}\n`;
                    report += `  - Confidence: ${(m.confidence * 100).toFixed(1)}%\n`;
                    if (m.error)
                        report += `  - Error: ${m.error}\n`;
                });
                report += '\n### Recommendations\n';
                data.analysis.recommendations.forEach((r) => {
                    report += `- ${r}\n`;
                });
                report += '\n---\n\n';
            }
            yield (0, promises_1.writeFile)((0, path_1.join)(__dirname, '../conversion-test-results.md'), report);
            console.log('Test complete! Results saved to conversion-test-results.md');
        }
        catch (error) {
            console.error('Error during testing:', error);
        }
    });
}
testTemplates();
