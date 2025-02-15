// Mark this file as server-only
'use server';
import mammoth from 'mammoth';
import xlsx from 'xlsx';
import { promises as fs } from 'fs';
import path from 'path';
export async function convertDOCX(filePath) {
    try {
        const buffer = await fs.readFile(filePath);
        const result = await mammoth.convertToHtml({ buffer });
        return {
            success: true,
            content: result.value,
        };
    }
    catch (error) {
        console.error('DOCX conversion error:', error);
        return {
            success: false,
            content: null,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
export async function convertXLSX(filePath) {
    try {
        const buffer = await fs.readFile(filePath);
        const workbook = xlsx.read(buffer);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = xlsx.utils.sheet_to_json(firstSheet);
        return {
            success: true,
            content: jsonData,
        };
    }
    catch (error) {
        console.error('XLSX conversion error:', error);
        return {
            success: false,
            content: null,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
export async function detectOfficeWatermark(filePath) {
    try {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.docx') {
            const result = await convertDOCX(filePath);
            if (!result.success)
                return false;
            const content = result.content.toLowerCase();
            return content.includes('draft') ||
                content.includes('sample') ||
                content.includes('confidential');
        }
        if (ext === '.xlsx') {
            const result = await convertXLSX(filePath);
            if (!result.success)
                return false;
            const jsonStr = JSON.stringify(result.content).toLowerCase();
            return jsonStr.includes('draft') ||
                jsonStr.includes('sample') ||
                jsonStr.includes('confidential');
        }
        return false;
    }
    catch (error) {
        console.error('Error detecting office watermark:', error);
        return false;
    }
}
