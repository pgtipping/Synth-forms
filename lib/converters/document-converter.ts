import { promises as fs } from 'fs';
import { join } from 'path';
import * as libre from 'libreoffice-convert';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { detectOfficeWatermark } from '../office-watermark';
import { convertAsync } from '../office-watermark';

interface ConversionOptions {
  outputFormat: 'pdf' | 'png';
  deleteOriginal?: boolean;
}

interface ConversionResult {
  path: string;
  isTemporary: boolean;
}

export async function convertToPDF(
  inputPath: string,
  options: ConversionOptions = { outputFormat: 'pdf', deleteOriginal: false }
): Promise<ConversionResult> {
  // Check for watermarks in Office documents
  if (inputPath.endsWith('.docx') || inputPath.endsWith('.xlsx')) {
    const hasWatermark = await detectOfficeWatermark(inputPath, {}, {});
    if (hasWatermark) {
      throw new Error('Document contains watermark');
    }
  }

  try {
    // Read file
    const input = await fs.readFile(inputPath);
    
    // Determine output path
    const ext = options.outputFormat;
    const outputFileName = `${uuidv4()}.${ext}`;
    const outputDir = join(process.cwd(), 'temp');
    const outputPath = join(outputDir, outputFileName);

    // Ensure temp directory exists
    try {
      await fs.access(outputDir);
    } catch {
      await fs.mkdir(outputDir);
    }

    // Convert file
    const output = await convertAsync(String(inputPath), {}, {});
    await fs.writeFile(outputPath, output);

    // Optionally delete original
    if (options.deleteOriginal) {
      await fs.unlink(inputPath);
    }

    return { path: outputPath, isTemporary: true };
  } catch (error) {
    console.error('Document conversion error:', error);
    throw new Error(`Failed to convert document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
