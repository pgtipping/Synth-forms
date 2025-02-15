import { createWorker } from 'tesseract.js';
import * as pdfjs from 'pdfjs-dist';
import { promises as fs } from 'fs';
import { ConversionResult, DocumentConverter } from './types/converter';

export class LocalDocumentConverter implements DocumentConverter {
  private worker: any;

  constructor() {
    this.initializeWorker();
  }

  private async initializeWorker() {
    this.worker = await createWorker('eng');
  }

  async convert(filePath: string): Promise<ConversionResult> {
    try {
      if (!this.worker) {
        await this.initializeWorker();
      }

      // Load the PDF document
      const data = await pdfjs.getDocument({ data: new Uint8Array(await fs.readFile(filePath)) });
      const pdfDocument = await data.promise;
      
      // Get the first page
      const page = await pdfDocument.getPage(1);
      
      // Get text content
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str).join(' ');

      // Perform OCR on the page
      const { data: { words } } = await this.worker.recognize(filePath);

      // Convert words to form fields
      const fields = this.detectFields(words, text);

      return {
        success: true,
        content: {
          text,
          fields
        }
      };

    } catch (error) {
      console.error('Local conversion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during local conversion'
      };
    }
  }

  private detectFields(words: any[], text: string): any[] {
    const fields: any[] = [];
    const commonLabels = ['name', 'email', 'phone', 'address', 'date', 'signature'];
    
    words.forEach((word, index) => {
      const wordText = word.text.toLowerCase();
      
      // Check if word matches common form field labels
      const matchedLabel = commonLabels.find(label => wordText.includes(label));
      
      if (matchedLabel) {
        fields.push({
          name: word.text,
          type: this.inferFieldType(matchedLabel),
          bounds: {
            x: word.bbox.x0,
            y: word.bbox.y0,
            width: word.bbox.x1 - word.bbox.x0,
            height: word.bbox.y1 - word.bbox.y0
          }
        });
      }
    });

    return fields;
  }

  private inferFieldType(label: string): string {
    switch (label.toLowerCase()) {
      case 'email':
        return 'email';
      case 'phone':
        return 'tel';
      case 'date':
        return 'date';
      case 'signature':
        return 'signature';
      default:
        return 'text';
    }
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
    }
  }
}
