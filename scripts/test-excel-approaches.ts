import { OfficeConverter } from '../lib/converters/office-converter';
import { join } from 'path';
import { writeFile } from 'fs/promises';

interface ConversionResult {
  approach: string;
  duration: number;
  fieldCount: number;
  confidence: number;
  fields: any[];
  error?: string;
}

async function testExcelConversion(filePath: string): Promise<ConversionResult> {
  const startTime = Date.now();
  try {
    const converter = new OfficeConverter();
    const result = await converter.convertXLSX(filePath);
    
    const duration = Date.now() - startTime;
    return {
      approach: 'office-converter',
      duration,
      fieldCount: result.fields.length,
      confidence: result.confidence,
      fields: result.fields
    };
  } catch (error) {
    return {
      approach: 'office-converter',
      duration: Date.now() - startTime,
      fieldCount: 0,
      confidence: 0,
      fields: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function main() {
  const excelPath = 'c:/Users/pgeor/OneDrive/Documents/Work/Documents/HR and Business Consulting/Project DIG inputs/Forms and templates/Free Templates and Forms/Competency Assessment/Job Competency Assessment Template_download.xlsx';
  
  console.log('\nTesting Excel Conversion with Job Competency Assessment Form...');
  try {
    const result = await testExcelConversion(excelPath);
    
    console.log('Conversion Results:', {
      approach: result.approach,
      duration: result.duration + 'ms',
      fieldCount: result.fieldCount,
      confidence: result.confidence
    });

    // Save results
    await writeFile('excel-conversion-results.json', JSON.stringify(result, null, 2));
    
    if (result.error) {
      console.error('Error:', result.error);
    } else {
      console.log('\nDetected Fields:');
      console.log(JSON.stringify(result.fields, null, 2));
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main().catch(console.error);
