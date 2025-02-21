import { promises as fs } from 'fs';
import mammoth from 'mammoth';
import xlsx from 'xlsx';
import { JSDOM } from 'jsdom';

export async function detectOfficeWatermark(
  filePath: string,
  options: any = {},
  context: any = {}
): Promise<boolean> {
  const fileExt = filePath.split('.').pop()?.toLowerCase();

  try {
    switch (fileExt) {
      case 'docx':
        return await detectWordWatermark(filePath);
      case 'xlsx':
        return await detectExcelWatermark(filePath);
      default:
        throw new Error(`Unsupported file type: ${fileExt}`);
    }
  } catch (error) {
    console.error(`Error detecting watermark: ${error}`);
    return false;
  }
}

async function detectWordWatermark(filePath: string): Promise<boolean> {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value.toLowerCase();
  
  // Common watermark patterns
  const watermarkPatterns = [
    'draft',
    'confidential',
    'sample',
    'watermark',
    'do not copy',
    'internal use only'
  ];

  return watermarkPatterns.some(pattern => text.includes(pattern.toLowerCase()));
}

async function detectExcelWatermark(filePath: string): Promise<boolean> {
  const workbook = xlsx.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  
  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const cells = Object.keys(sheet)
      .filter(key => key[0] !== '!') // Exclude special keys
      .map(key => sheet[key].v)
      .filter(Boolean)
      .map(value => String(value).toLowerCase());

    // Check for watermark patterns in cells
    const watermarkPatterns = [
      'draft',
      'confidential',
      'sample',
      'watermark',
      'do not copy',
      'internal use only'
    ];

    if (watermarkPatterns.some(pattern => 
      cells.some(cell => cell.includes(pattern.toLowerCase()))
    )) {
      return true;
    }
  }

  return false;
}
