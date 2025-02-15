import { CloudDocumentConverter } from '../cloud-converter.js';
import { LocalFormConverter } from './local-form-converter.js';
import { LocalDocumentConverter } from './local-converter.js';
import { PDFConverter } from './pdf-converter.js';
import { OfficeConverter } from './office-converter.js';
import { unlink } from 'fs/promises';
import { extname } from 'path';
export class TemplateTestHarness {
    constructor() {
        this.converters = {
            cloud: new CloudDocumentConverter(),
            localForm: new LocalFormConverter(),
            localDoc: new LocalDocumentConverter(),
            pdf: new PDFConverter(),
            office: new OfficeConverter()
        };
    }
    async testSingleConverter(converter, filePath) {
        const start = Date.now();
        try {
            const result = await this.converters[converter].convert(filePath);
            const duration = Date.now() - start;
            return {
                converter,
                duration,
                fieldCount: result.content?.fields.length || 0,
                confidence: this.calculateConfidence(result)
            };
        }
        catch (error) {
            return {
                converter,
                duration: Date.now() - start,
                fieldCount: 0,
                confidence: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    calculateConfidence(result) {
        if (!result.content?.fields)
            return 0;
        const fields = result.content.fields;
        let totalConfidence = 0;
        for (const field of fields) {
            // Weight factors for confidence calculation
            const hasName = field.name ? 1 : 0;
            const hasType = field.type ? 1 : 0;
            const hasValue = field.value !== undefined ? 1 : 0;
            const fieldConfidence = field.confidence || 0;
            totalConfidence += (hasName + hasType + hasValue + fieldConfidence) / 4;
        }
        return fields.length > 0 ? totalConfidence / fields.length : 0;
    }
    async testTemplate(filePath) {
        const fileExt = extname(filePath).toLowerCase();
        const metrics = [];
        // Test appropriate converters based on file type
        if (fileExt === '.pdf') {
            metrics.push(await this.testSingleConverter('cloud', filePath), await this.testSingleConverter('localForm', filePath), await this.testSingleConverter('localDoc', filePath));
        }
        else if (['.docx', '.xlsx'].includes(fileExt)) {
            // Convert to PDF first
            const pdfResult = await this.converters.office.convert(filePath);
            if (pdfResult.success && pdfResult.path) {
                metrics.push(await this.testSingleConverter('cloud', pdfResult.path), await this.testSingleConverter('localForm', pdfResult.path), await this.testSingleConverter('localDoc', pdfResult.path));
                // Cleanup temporary PDF
                await unlink(pdfResult.path);
            }
        }
        return metrics;
    }
    async analyzeResults(metrics) {
        const validResults = metrics.filter(m => !m.error);
        if (validResults.length === 0) {
            return {
                bestOverall: 'none',
                bestConfidence: 'none',
                bestSpeed: 'none',
                recommendations: ['All converters failed']
            };
        }
        const bestConfidence = validResults.reduce((a, b) => a.confidence > b.confidence ? a : b);
        const bestSpeed = validResults.reduce((a, b) => a.duration < b.duration ? a : b);
        // Weight factors for overall score
        const scores = validResults.map(m => ({
            converter: m.converter,
            score: (m.confidence * 0.6) + (1 - m.duration / Math.max(...validResults.map(r => r.duration)) * 0.4)
        }));
        const bestOverall = scores.reduce((a, b) => a.score > b.score ? a : b);
        const recommendations = [
            `Best overall converter: ${bestOverall.converter}`,
            `Highest confidence: ${bestConfidence.converter} (${bestConfidence.confidence.toFixed(2)})`,
            `Fastest conversion: ${bestSpeed.converter} (${bestSpeed.duration}ms)`
        ];
        if (bestConfidence.confidence < 0.7) {
            recommendations.push('Warning: Low confidence scores, manual verification recommended');
        }
        return {
            bestOverall: bestOverall.converter,
            bestConfidence: bestConfidence.converter,
            bestSpeed: bestSpeed.converter,
            recommendations
        };
    }
}
