import { TemplateTestHarness } from '../lib/converters/test-harness.js';
import { readdir, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testTemplates() {
  const harness = new TemplateTestHarness();
  const templatesDir = join(__dirname, '../free forms and templates');
  
  try {
    const files = await readdir(templatesDir);
    const results = new Map<string, any>();

    for (const file of files) {
      if (!['.pdf', '.docx', '.xlsx'].includes(extname(file).toLowerCase())) {
        continue;
      }

      console.log(`Testing ${file}...`);
      const filePath = join(templatesDir, file);
      const metrics = await harness.testTemplate(filePath);
      const analysis = await harness.analyzeResults(metrics);
      
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
      data.metrics.forEach((m: any) => {
        report += `- ${m.converter}:\n`;
        report += `  - Duration: ${m.duration}ms\n`;
        report += `  - Fields detected: ${m.fieldCount}\n`;
        report += `  - Confidence: ${(m.confidence * 100).toFixed(1)}%\n`;
        if (m.error) report += `  - Error: ${m.error}\n`;
      });
      
      report += '\n### Recommendations\n';
      data.analysis.recommendations.forEach((r: string) => {
        report += `- ${r}\n`;
      });
      report += '\n---\n\n';
    }

    await writeFile(
      join(__dirname, '../conversion-test-results.md'),
      report
    );

    console.log('Test complete! Results saved to conversion-test-results.md');
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

testTemplates();
