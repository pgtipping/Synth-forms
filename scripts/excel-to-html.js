import XLSX from 'xlsx';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

function convertExcelToHtml(excelPath) {
  console.log('Reading Excel file:', excelPath);
  
  // Read Excel file
  const workbook = XLSX.readFile(excelPath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
  console.log('Worksheet loaded:', workbook.SheetNames[0]);
  
  // Create HTML structure
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Form Template</title>
  <style>
    .form-section { margin-bottom: 2rem; }
    .field-group { margin-bottom: 1rem; }
    .form-field { margin-bottom: 0.5rem; }
    label { display: block; margin-bottom: 0.25rem; }
    .help-text { font-size: 0.875rem; color: #666; margin-top: 0.25rem; }
    .rating-input { display: flex; gap: 1rem; }
    .radio-group { display: flex; gap: 1rem; }
  </style>
</head>
<body>
  <form id="form-template">`;

  // Get worksheet range
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  console.log('Sheet range:', range);
  
  let currentSection = null;
  let inFieldGroup = false;

  // Process cells
  for (let row = range.s.r; row <= range.e.r; row++) {
    let rowHtml = '';
    let isSection = false;

    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellRef];
      
      if (!cell || !cell.v) continue;

      const value = String(cell.v).trim();
      console.log('Processing cell:', cellRef, 'Value:', value);
      
      // Check if this is a section header
      if (isSectionHeader(value)) {
        console.log('Found section header:', value);
        if (inFieldGroup) {
          rowHtml += '</div>'; // Close previous field group
          inFieldGroup = false;
        }
        if (currentSection) {
          rowHtml += '</section>';
        }
        currentSection = value;
        rowHtml += `\n<section class="form-section" data-section="${value}">
          <h2>${value}</h2>`;
        isSection = true;
        break;
      }
      
      // Check if this is a field
      if (isFieldLabel(value)) {
        console.log('Found field label:', value);
        if (!inFieldGroup) {
          rowHtml += '<div class="field-group">';
          inFieldGroup = true;
        }
        
        const fieldType = detectFieldType(value);
        const fieldId = generateFieldId(value);
        const required = value.includes('*');
        
        console.log('Field details:', { fieldType, fieldId, required });
        
        rowHtml += `
          <div class="form-field" data-type="${fieldType}">
            <label for="${fieldId}">${value}</label>`;
            
        // Add appropriate input based on field type
        switch (fieldType) {
          case 'rating':
            rowHtml += `
              <div class="rating-input">
                <input type="radio" name="${fieldId}" value="1" ${required ? 'required' : ''}>
                <input type="radio" name="${fieldId}" value="2">
                <input type="radio" name="${fieldId}" value="3">
                <input type="radio" name="${fieldId}" value="4">
                <input type="radio" name="${fieldId}" value="5">
              </div>`;
            break;
          case 'textarea':
            rowHtml += `
              <textarea id="${fieldId}" name="${fieldId}" ${required ? 'required' : ''}></textarea>`;
            break;
          case 'date':
            rowHtml += `
              <input type="date" id="${fieldId}" name="${fieldId}" ${required ? 'required' : ''}>`;
            break;
          case 'yesno':
            rowHtml += `
              <div class="radio-group">
                <input type="radio" id="${fieldId}_yes" name="${fieldId}" value="yes" ${required ? 'required' : ''}>
                <label for="${fieldId}_yes">Yes</label>
                <input type="radio" id="${fieldId}_no" name="${fieldId}" value="no">
                <label for="${fieldId}_no">No</label>
              </div>`;
            break;
          default:
            rowHtml += `
              <input type="${fieldType}" id="${fieldId}" name="${fieldId}" ${required ? 'required' : ''}>`;
        }
        
        // Check next cell for help text
        const nextCellRef = XLSX.utils.encode_cell({ r: row, c: col + 1 });
        const nextCell = worksheet[nextCellRef];
        if (nextCell && nextCell.v && isHelpText(String(nextCell.v))) {
          console.log('Found help text:', nextCell.v);
          rowHtml += `<div class="help-text">${nextCell.v}</div>`;
        }
        
        rowHtml += '</div>';
      }
    }
    
    if (rowHtml) {
      html += rowHtml;
    }
  }

  // Close any open tags
  if (inFieldGroup) {
    html += '</div>';
  }
  if (currentSection) {
    html += '</section>';
  }
  
  html += `
    </form>
  </body>
</html>`;

  // Save the HTML file
  const htmlPath = excelPath.replace(/\.xlsx?$/, '.html');
  fs.writeFileSync(htmlPath, html);
  
  console.log('Converted HTML saved to:', htmlPath);
  console.log('\nGenerated HTML:');
  console.log(html);
  
  return html;
}

function isSectionHeader(value) {
  // Section headers are typically in all caps, or end with ":"
  return (
    value.toUpperCase() === value && value.length > 3 ||
    value.endsWith(':') ||
    /^(Section|Part|Category)\s+\d+/i.test(value)
  );
}

function isFieldLabel(value) {
  // Field labels typically end with ":" or "*" or contain form-related keywords
  return (
    value.endsWith(':') ||
    value.includes('*') ||
    /\b(name|date|email|phone|rating|comments?|description)\b/i.test(value)
  );
}

function isHelpText(value) {
  // Help text typically starts with certain phrases or is in parentheses
  return (
    value.startsWith('(') ||
    value.startsWith('Help:') ||
    value.startsWith('Note:') ||
    /^(Please|Enter|Select|Provide)/i.test(value)
  );
}

function detectFieldType(value) {
  const lower = value.toLowerCase();
  
  if (lower.includes('rating') || lower.includes('score')) return 'rating';
  if (lower.includes('comment') || lower.includes('description')) return 'textarea';
  if (lower.includes('date')) return 'date';
  if (lower.includes('yes/no') || lower.includes('y/n')) return 'yesno';
  if (lower.includes('email')) return 'email';
  if (lower.includes('phone') || lower.includes('tel')) return 'tel';
  if (lower.includes('number') || lower.includes('amount')) return 'number';
  
  return 'text';
}

function generateFieldId(value) {
  // Convert label to kebab-case ID
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Main execution
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const excelPath = process.argv[2];
if (!excelPath) {
  console.error('Please provide an Excel file path');
  process.exit(1);
}

try {
  convertExcelToHtml(excelPath);
} catch (error) {
  console.error('Error converting Excel to HTML:', error);
  process.exit(1);
}
