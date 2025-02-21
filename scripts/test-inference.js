import { promises as fs } from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INFERENCE_SERVICE_URL = process.env.INFERENCE_SERVICE_URL || 'http://localhost:8000';

async function convertDocument(filePath) {
  try {
    // Read the file
    const fileContent = await fs.readFile(filePath);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fileContent, {
      filename: path.basename(filePath),
      contentType: getContentType(filePath)
    });

    // Send to inference service for conversion
    console.log(`Sending ${path.basename(filePath)} to inference service...`);
    const response = await axios.post(`${INFERENCE_SERVICE_URL}/predict`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('Conversion response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error during conversion:', error.message);
    throw error;
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.xlsx':
    case '.xls':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}

async function main() {
  try {
    const testFile = path.resolve(__dirname, '../Free Templates and Forms/Job Competency Assessment Template_download.xlsx');
    console.log('Starting conversion process...');
    console.log('Test file:', testFile);
    
    const result = await convertDocument(testFile);
    
    // Save the result
    const outputPath = path.resolve(__dirname, '../__tests__/conversion-result.json');
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
    console.log(`Results saved to ${outputPath}`);
  } catch (error) {
    console.error('Conversion failed:', error.message);
    process.exit(1);
  }
}

main();
