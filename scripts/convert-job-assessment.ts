import { LocalFormConverter } from '../lib/converters/local-form-converter';
import path from 'path';

async function main() {
  const converter = new LocalFormConverter();
  const filePath = path.resolve(__dirname, '../Free Templates and Forms/Job Competency Assessment Template_download.xlsx');
  
  try {
    const result = await converter.convert(filePath);
    console.log('Conversion Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Conversion failed:', error);
    console.error('Error details:', error.response?.data || error.message);
  }
}

main();
