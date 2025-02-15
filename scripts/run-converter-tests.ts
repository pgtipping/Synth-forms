import { TemplateTestHarness } from '@/lib/converters/test-harness';
import { join } from 'path';
import { writeFile } from 'fs/promises';

async function runConverterTests() {
  const testHarness = new TemplateTestHarness();
  const testFiles = [
    join(process.cwd(), '../Free Templates and Forms/Perf Mgt/Employee Performance Evaluation Form dl.docx')
  ];

  const results = [];

  for (const filePath of testFiles) {
    console.log(`Testing file: ${filePath}`);
    try {
      const metrics = await testHarness.testTemplate(filePath);
      const analysis = await testHarness.analyzeResults(metrics);
      
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
    } catch (error) {
      console.error(`Error testing ${filePath}:`, error);
    }
  }

  // Save detailed results to file
  const outputPath = join(process.cwd(), 'converter-test-results.json');
  await writeFile(outputPath, JSON.stringify(results, null, 2));
  console.log(`Full results saved to ${outputPath}`);
}

runConverterTests().catch(console.error);
