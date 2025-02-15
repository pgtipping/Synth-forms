import { OfficeConverter } from '../lib/converters/office-converter';
import { LocalFormConverter } from '../lib/converters/local-form-converter';
import { join } from 'path';
import { writeFile } from 'fs/promises';

interface TestResult {
  approach: string;
  duration: number;
  fieldCount: number;
  confidence: number;
  error?: string;
}

async function testDirectDocxConversion() {
  const docxPath = join(process.cwd(), '../Free Templates and Forms/Perf Mgt/Employee Performance Evaluation Form dl.docx');
  const results: TestResult[] = [];

  console.log('\nTesting Direct DOCX Conversion...');
  try {
    const start = Date.now();
    const officeConverter = new OfficeConverter();
    const result = await officeConverter.convert(docxPath);
    const duration = Date.now() - start;

    results.push({
      approach: 'Direct DOCX',
      duration,
      fieldCount: result.fields.length,
      confidence: result.confidence
    });

    console.log('Direct DOCX Results:', results[0]);
    await writeFile('conversion-test-results.json', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error during direct DOCX conversion:', error);
  }
}

testDirectDocxConversion().catch(console.error);
