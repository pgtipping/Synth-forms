import { promises as fs } from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import libreofficeConvert from 'libreoffice-convert';

const convertAsync = promisify(libreofficeConvert.convert);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INFERENCE_SERVICE_URL = process.env.INFERENCE_SERVICE_URL || 'http://localhost:8000';

async function convertExcelToPdf(excelPath) {
  try {
    const pdfPath = excelPath.replace(/\.xlsx?$/, '.pdf');
    
    // Read the input file
    const input = await fs.readFile(excelPath);
    
    // Convert to PDF
    console.log('Converting Excel to PDF...');
    const output = await convertAsync(input, '.pdf', undefined);
    
    // Write the output file
    await fs.writeFile(pdfPath, output);
    console.log('PDF created:', pdfPath);
    
    return pdfPath;
  } catch (error) {
    console.error('Excel to PDF conversion failed:', error);
    throw error;
  }
}

async function sendToInferenceService(filePath) {
  try {
    // Read the file
    const fileContent = await fs.readFile(filePath);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fileContent, {
      filename: path.basename(filePath),
      contentType: 'application/pdf'
    });

    // Send to inference service
    console.log(`Sending ${path.basename(filePath)} to inference service...`);
    const response = await axios.post(`${INFERENCE_SERVICE_URL}/predict`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('Conversion response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error during inference:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const testFile = path.resolve(__dirname, '../Free Templates and Forms/Job Competency Assessment Template_download.xlsx');
    console.log('Starting conversion process...');
    console.log('Test file:', testFile);
    
    // First convert Excel to PDF
    console.log('Converting Excel to PDF...');
    const pdfPath = await convertExcelToPdf(testFile);
    console.log('PDF created:', pdfPath);
    
    // Then send PDF to inference service
    console.log('Sending to inference service...');
    const result = await sendToInferenceService(pdfPath);
    
    // Save the result
    const outputPath = path.resolve(__dirname, '../__tests__/conversion-result.json');
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
    console.log(`Results saved to ${outputPath}`);
    
    // Clean up PDF file
    await fs.unlink(pdfPath);
  } catch (error) {
    console.error('Conversion failed:', error.message);
    process.exit(1);
  }
}

main();
