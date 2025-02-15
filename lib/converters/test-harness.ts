import { CloudDocumentConverter } from '@/lib/cloud-converter';
import { LocalFormConverter } from '@/lib/converters/local-form-converter';
import { LocalDocumentConverter } from '@/lib/converters/local-converter';
import { PDFConverter } from '@/lib/converters/pdf-converter';
import { OfficeConverter } from '@/lib/converters/office-converter';
import { ConversionResult } from '@/lib/converters/types';
import { unlink } from 'fs/promises';
import { extname } from 'path';

interface ConversionMetrics {
  converter: string;
  duration: number;
  fieldCount: number;
  confidence: number;
  error?: string;
}

export class TemplateTestHarness {
  private converters = {
    cloud: new CloudDocumentConverter(),
    localForm: new LocalFormConverter(),
    localDoc: new LocalDocumentConverter(),
    pdf: new PDFConverter(),
    office: new OfficeConverter()
  };

  private async testSingleConverter(
    converter: string,
    filePath: string
  ): Promise<ConversionMetrics> {
    const start = Date.now();
    try {
      const result = await this.converters[converter as keyof typeof this.converters].convert(filePath);
      const duration = Date.now() - start;
      
      return {
        converter,
        duration,
        fieldCount: result.content?.fields.length || 0,
        confidence: this.calculateConfidence(result)
      };
    } catch (error) {
      return {
        converter,
        duration: Date.now() - start,
        fieldCount: 0,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private calculateConfidence(result: ConversionResult): number {
    if (!result.content?.fields) return 0;
    
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

  async testTemplate(filePath: string): Promise<ConversionMetrics[]> {
    const fileExt = extname(filePath).toLowerCase();
    const metrics: ConversionMetrics[] = [];

    // Test appropriate converters based on file type
    if (fileExt === '.pdf') {
      // Add converter identification
      const cloudResult = await this.testSingleConverter('cloud', filePath);
      cloudResult.converter = 'CloudDocumentConverter';
      
      const localFormResult = await this.testSingleConverter('localForm', filePath);
      localFormResult.converter = 'LocalFormConverter';
      
      const localDocResult = await this.testSingleConverter('localDoc', filePath);
      localDocResult.converter = 'LocalDocumentConverter';
      
      metrics.push(cloudResult, localFormResult, localDocResult);
    } else if (['.docx', '.xlsx'].includes(fileExt)) {
      // Convert to PDF first using OfficeConverter
      const pdfResult = await this.converters.office.convert(filePath);
      if (pdfResult.success && pdfResult.path) {
        const cloudResult = await this.testSingleConverter('cloud', pdfResult.path);
        cloudResult.converter = 'CloudDocumentConverter';
        
        const localFormResult = await this.testSingleConverter('localForm', pdfResult.path);
        localFormResult.converter = 'LocalFormConverter';
        
        const localDocResult = await this.testSingleConverter('localDoc', pdfResult.path);
        localDocResult.converter = 'LocalDocumentConverter';
        
        metrics.push(cloudResult, localFormResult, localDocResult);
        // Cleanup temporary PDF
        await unlink(pdfResult.path);
      }
    }

    return metrics;
  }

  async analyzeResults(metrics: ConversionMetrics[]): Promise<{
    bestOverall: string;
    bestConfidence: string;
    bestSpeed: string;
    recommendations: string[];
  }> {
    const validResults = metrics.filter(m => !m.error);
    if (validResults.length === 0) {
      return {
        bestOverall: 'none',
        bestConfidence: 'none',
        bestSpeed: 'none',
        recommendations: ['All converters failed']
      };
    }

    const bestConfidence = validResults.reduce((a, b) => 
      a.confidence > b.confidence ? a : b
    );

    const bestSpeed = validResults.reduce((a, b) => 
      a.duration < b.duration ? a : b
    );

    // Weight factors for overall score
    const scores = validResults.map(m => ({
      converter: m.converter,
      score: (m.confidence * 0.6) + (1 - m.duration/Math.max(...validResults.map(r => r.duration)) * 0.4)
    }));

    const bestOverall = scores.reduce((a, b) => 
      a.score > b.score ? a : b
    );

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
