// Mock environment variables
process.env.AZURE_FORM_RECOGNIZER_ENDPOINT = 'https://test.cognitiveservices.azure.com/';
process.env.AZURE_FORM_RECOGNIZER_KEY = 'test-key';

// Create test fixtures directory
const fs = require('fs');
const path = require('path');

const fixturesDir = path.join(__dirname, '__tests__', 'fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

// Create test files if they don't exist
const createTestPDF = () => {
  const filePath = path.join(fixturesDir, 'test-form.pdf');
  if (!fs.existsSync(filePath)) {
    // Create a minimal PDF file
    const pdfContent = Buffer.from(
      '%PDF-1.4\n' +
      '1 0 obj\n' +
      '<<\n' +
      '/Type /Catalog\n' +
      '/Pages 2 0 R\n' +
      '>>\n' +
      'endobj\n' +
      '2 0 obj\n' +
      '<<\n' +
      '/Type /Pages\n' +
      '/Kids [3 0 R]\n' +
      '/Count 1\n' +
      '>>\n' +
      'endobj\n' +
      '3 0 obj\n' +
      '<<\n' +
      '/Type /Page\n' +
      '/Parent 2 0 R\n' +
      '/MediaBox [0 0 612 792]\n' +
      '>>\n' +
      'endobj\n' +
      'xref\n' +
      '0 4\n' +
      '0000000000 65535 f\n' +
      '0000000010 00000 n\n' +
      '0000000079 00000 n\n' +
      '0000000173 00000 n\n' +
      'trailer\n' +
      '<<\n' +
      '/Size 4\n' +
      '/Root 1 0 R\n' +
      '>>\n' +
      'startxref\n' +
      '281\n' +
      '%%EOF'
    );
    fs.writeFileSync(filePath, pdfContent);
  }
};

const createTestDOCX = () => {
  const filePath = path.join(fixturesDir, 'test-form.docx');
  if (!fs.existsSync(filePath)) {
    // Create a minimal DOCX file
    const docxContent = Buffer.from(
      'PK\x03\x04\x14\x00\x00\x00\x08\x00' +
      '\x00\x00!'.repeat(30)
    );
    fs.writeFileSync(filePath, docxContent);
  }
};

const createTestXLSX = () => {
  const filePath = path.join(fixturesDir, 'test-form.xlsx');
  if (!fs.existsSync(filePath)) {
    // Create a minimal XLSX file
    const xlsxContent = Buffer.from(
      'PK\x03\x04\x14\x00\x00\x00\x08\x00' +
      '\x00\x00!'.repeat(30)
    );
    fs.writeFileSync(filePath, xlsxContent);
  }
};

createTestPDF();
createTestDOCX();
createTestXLSX();
