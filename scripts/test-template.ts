import { TemplateTestHarness } from '@/lib/converters/test-harness';
import { join } from 'path';
import { writeFile } from 'fs/promises';

async function runComparativeTests() {
  const testHarness = new TemplateTestHarness();
  const testFiles = [
    'performance-improvement-plan.pdf',
    'Performance-Management-101-workbook.pdf'
  ];

  const results = [];

  for (const file of testFiles) {
    console.log(`Testing ${file}...`);
    const filePath = join(process.cwd(), 'templates', file);
    
    // Test with all converters
    const fileResults = await testHarness.runComparativeTest(filePath);
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
  await writeFile(
    join(process.cwd(), 'conversion-test-results.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
  );
}

// Run tests
runComparativeTests().catch(console.error);
