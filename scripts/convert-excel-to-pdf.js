import XLSX from 'xlsx';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import FormData from 'form-data';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INFERENCE_SERVICE_URL = process.env.INFERENCE_SERVICE_URL || 'http://localhost:8000';

async function convertExcelToPdf(excelPath) {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(excelPath);
    
    // Convert to HTML
    const html = XLSX.write(workbook, { type: 'string', bookType: 'html' });
    
    // Create a temporary HTML file
    const tempHtmlPath = excelPath.replace(/\.xlsx?$/, '.temp.html');
    await fs.writeFile(tempHtmlPath, html);
    
    // Convert HTML to PDF using Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });
    
    const pdfPath = excelPath.replace(/\.xlsx?$/, '.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    await browser.close();
    
    // Clean up temporary HTML file
    await fs.unlink(tempHtmlPath);
    
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
        ...formData.getHeaders()
      }
    });

    return response.data;
  } catch (error) {
    console.error('Failed to send to inference service:', error);
    throw error;
  }
}

// Format and display detected fields
function formatDetectedFields(response, options = {}) {
  const {
    minConfidence = 90,
    sortBy = 'position', // 'position' or 'confidence'
    groupSimilar = true,
    minTextLength = 2
  } = options;

  console.log('\nDetected Form Fields:');
  console.log('===================\n');

  if (!response || typeof response !== 'object') {
    console.log('Invalid response format');
    return;
  }

  // Extract and filter fields from the response
  let fields = [];
  for (const [key, value] of Object.entries(response)) {
    if (Array.isArray(value)) {
      fields.push(...value.map(field => ({
        ...field,
        section: key
      })));
    }
  }

  // Apply filters
  fields = fields.filter(field => {
    // Remove low confidence fields
    if (field.confidence < minConfidence) return false;
    // Remove very short text (likely noise)
    if (field.text.trim().length < minTextLength) return false;
    // Remove duplicate text in same area
    const isDuplicate = fields.some(other => 
      other !== field && 
      other.text === field.text &&
      other.bbox &&
      field.bbox &&
      Math.abs(other.bbox.y - field.bbox.y) < 5
    );
    return !isDuplicate;
  });
  
  if (fields.length === 0) {
    console.log('No form fields detected in the document');
    return;
  }

  // Sort fields
  if (sortBy === 'position') {
    fields.sort((a, b) => {
      if (!a.bbox || !b.bbox) return 0;
      // Sort by y position first, then x position
      const yDiff = a.bbox.y - b.bbox.y;
      return yDiff !== 0 ? yDiff : a.bbox.x - b.bbox.x;
    });
  } else if (sortBy === 'confidence') {
    fields.sort((a, b) => b.confidence - a.confidence);
  }

  // Group similar fields if requested
  if (groupSimilar) {
    const groups = {};
    fields.forEach(field => {
      // Group by prefix (e.g., "Can", "Skill", etc.)
      const prefix = field.text.split(' ')[0];
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(field);
    });

    // Print grouped fields
    Object.entries(groups).forEach(([prefix, groupFields]) => {
      if (groupFields.length > 1) {
        console.log(`\n${prefix.toUpperCase()} GROUP:`);
        console.log('-'.repeat(20));
        groupFields.forEach(printField);
        console.log();
      }
    });

    // Print remaining ungrouped fields
    console.log('\nOTHER FIELDS:');
    console.log('-'.repeat(20));
    fields
      .filter(field => {
        const prefix = field.text.split(' ')[0];
        return groups[prefix].length === 1;
      })
      .forEach(printField);
  } else {
    // Print all fields in order
    fields.forEach(printField);
  }
}

// Helper function to print a single field
function printField(field) {
  console.log(`• Type: ${field.type || 'unknown'}`);
  console.log(`  Text: "${field.text}"`);
  console.log(`  Confidence: ${Math.round(field.confidence)}%`);
  if (field.bbox) {
    const { x, y, width, height } = field.bbox;
    console.log(`  Position: x=${Math.round(x)}, y=${Math.round(y)}, w=${Math.round(width)}, h=${Math.round(height)}`);
  }
  console.log();
}

async function main() {
  try {
    // Test file path
    const testFile = path.join(__dirname, '..', 'Free Templates and Forms', 'Job Competency Assessment Template_download.xlsx');
    console.log('Test file:', testFile);

    // Convert Excel to PDF
    console.log('Converting Excel to PDF...');
    const pdfPath = await convertExcelToPdf(testFile);

    // Send to inference service
    const result = await sendToInferenceService(pdfPath);
    console.log('Raw inference response:', JSON.stringify(result, null, 2));
    console.log('Processing inference results...\n');
    formatDetectedFields(result, {
      minConfidence: 90,
      sortBy: 'position',
      groupSimilar: true,
      minTextLength: 2
    });
  } catch (error) {
    console.error('Conversion failed:', error);
    process.exit(1);
  }
}

main();
