import fs from 'fs/promises';
import config from '../config/conversion-rules';
import * as pdfjs from 'pdfjs-dist';
import { createCanvas } from 'canvas';
async function detectTextWatermark(page, pageNumber) {
    try {
        // Get all text content from the page
        const textContent = await page.getTextContent();
        const items = textContent.items;
        for (const item of items) {
            const text = item.str;
            const textLower = text.toLowerCase();
            // Check for exact matches and patterns
            const hasExactMatch = config.watermark.textKeywords.some(keyword => textLower.includes(keyword.toLowerCase()));
            const hasPatternMatch = config.watermark.patterns && (config.watermark.patterns.fullPattern.test(text) ||
                (config.watermark.patterns.urlPattern.test(text) &&
                    config.watermark.patterns.samplePattern.test(text)));
            if (hasExactMatch || hasPatternMatch) {
                // Check for watermark characteristics
                const isLargeFont = item.height > 20; // Large text
                const isTransparent = item.color && item.color[3] < 1; // Alpha channel < 1
                const isDiagonal = Math.abs(item.transform[1]) > 0.1; // Rotated text
                // Additional confidence for businessdriver.ng specific patterns
                const isBusinessDriverWatermark = config.watermark.patterns.fullPattern.test(text);
                const confidence = [
                    isLargeFont ? 0.2 : 0,
                    isTransparent ? 0.2 : 0,
                    isDiagonal ? 0.2 : 0,
                    hasPatternMatch ? 0.2 : 0,
                    isBusinessDriverWatermark ? 0.2 : 0
                ].reduce((a, b) => a + b, 0);
                if (confidence > 0.3) {
                    return {
                        hasWatermark: true,
                        type: 'text',
                        content: item.str,
                        confidence,
                        location: {
                            page: pageNumber,
                            x: item.transform[4],
                            y: item.transform[5],
                            rotation: Math.atan2(item.transform[1], item.transform[0]) * (180 / Math.PI)
                        }
                    };
                }
            }
        }
        return null;
    }
    catch (error) {
        console.error('Error detecting text watermark:', error);
        return null;
    }
}
async function detectImageWatermark(page, pageNumber) {
    try {
        const operatorList = await page.getOperatorList();
        const canvas = createCanvas(page.view[2], page.view[3]);
        const ctx = canvas.getContext('2d');
        for (const op of operatorList.fnArray) {
            if (op === pdfjs.OPS.paintXObject || op === pdfjs.OPS.paintImageXObject) {
                // Get image data
                const imgData = await page.objs.get(op.args[0]);
                // Check image characteristics typical of watermarks
                const isLargeImage = imgData.width > page.view[2] / 2 || imgData.height > page.view[3] / 2;
                const hasTransparency = imgData.data.some((value, index) => index % 4 === 3 && value < 255);
                const isCentered = Math.abs(imgData.x - page.view[2] / 2) < 100 && Math.abs(imgData.y - page.view[3] / 2) < 100;
                const confidence = [
                    isLargeImage ? 0.3 : 0,
                    hasTransparency ? 0.4 : 0,
                    isCentered ? 0.3 : 0
                ].reduce((a, b) => a + b, 0);
                if (confidence > 0.5) {
                    return {
                        hasWatermark: true,
                        type: 'image',
                        confidence,
                        location: {
                            page: pageNumber,
                            x: imgData.x,
                            y: imgData.y
                        }
                    };
                }
            }
        }
        return null;
    }
    catch (error) {
        console.error('Error detecting image watermark:', error);
        return null;
    }
}
export async function detectPDFWatermark(filePath) {
    try {
        const data = await fs.readFile(filePath);
        const pdf = await pdfjs.getDocument({ data }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            // Check for text watermarks
            const textResult = await detectTextWatermark(page, i);
            if (textResult) {
                return textResult;
            }
            // Check for image watermarks
            const imageResult = await detectImageWatermark(page, i);
            if (imageResult) {
                return imageResult;
            }
        }
        return {
            hasWatermark: false,
            confidence: 0
        };
    }
    catch (error) {
        console.error(`Error processing ${filePath}:`, error);
        return {
            hasWatermark: false,
            confidence: 0
        };
    }
}
