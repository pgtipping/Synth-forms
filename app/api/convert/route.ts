import { NextRequest, NextResponse } from 'next/server';
import { BatchProcessor } from '@/lib/batch-processor';
import path from 'path';
import { promises as fs } from 'fs';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Configure directories
const BATCH_DIR = path.join(process.cwd(), 'batch-input');
const TEMP_DIR = path.join(process.cwd(), 'temp');

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure directories exist
async function ensureDirectories() {
  for (const dir of [BATCH_DIR, TEMP_DIR]) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDirectories();

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const options = {
      recursive: formData.get('recursive') === 'true',
      skipWatermarked: formData.get('skipWatermarked') !== 'false',
      fileTypes: formData.get('fileTypes')?.toString().split(',') || ['pdf', 'docx', 'xlsx']
    };
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Save files to batch directory
    const savedFiles: string[] = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = path.join(BATCH_DIR, `${uuidv4()}-${file.name}`);
      await writeFile(filePath, buffer);
      savedFiles.push(filePath);
    }

    // Process the batch
    const batchProcessor = new BatchProcessor();
    const result = await batchProcessor.processBatch(BATCH_DIR, options);

    // Clean up processed files
    for (const file of savedFiles) {
      try {
        await fs.unlink(file);
      } catch (error) {
        console.error(`Failed to clean up file ${file}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'POST endpoint for file conversion' },
    { status: 200 }
  );
}
