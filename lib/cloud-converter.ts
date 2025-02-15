/// <reference path="./documentai-augmentations.d.ts" />

import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import { promises as fs } from 'fs';
import { ConversionResult, DocumentConverter } from './types/converter';
import { convertToPDF } from './document-converter';

declare module "@google-cloud/documentai" {
  interface IDocument {
    forms?: any; // Added property to support custom form data
  }
}

export class CloudDocumentConverter implements DocumentConverter {
  private client: DocumentProcessorServiceClient;
  private processorName: string;

  constructor() {
    this.client = new DocumentProcessorServiceClient();
    
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us'; // Default to 'us'
    
    if (!projectId) {
      throw new Error('Google Cloud Project ID not configured');
    }
    
    // Use the Form Parser processor
    this.processorName = `projects/${projectId}/locations/${location}/processors/form-parser-latest`;
  }

  async convert(filePath: string): Promise<ConversionResult> {
    let pdfConversion: { path: string; isTemporary: boolean } | null = null;
    
    try {
      if (!this.processorName) {
        throw new Error('Google Document AI processor not configured');
      }

      // Convert non-PDF files to PDF first
      let pdfPath = filePath;
      if (filePath.endsWith('.docx') || filePath.endsWith('.xlsx')) {
        pdfConversion = await convertToPDF(filePath);
        pdfPath = pdfConversion.path;
      }

      // Read the file
      const buffer = await fs.readFile(pdfPath);
      const content = buffer.toString('base64');

      const request = {
        name: this.processorName,
        document: {
          content,
          mimeType: 'application/pdf',
        }
      };

      // Process the document
      const [result] = await this.client.processDocument(request);
      const { document } = result;

      if (!document) {
        throw new Error('No document in response');
      }

      // Extract form fields
      const fields = document.forms?.[0]?.fields?.map((field: any) => ({
        name: field.fieldName?.textAnchor?.content || 'unnamed_field',
        type: this.inferFieldType(field),
        value: field.fieldValue?.textAnchor?.content,
        bounds: field.boundingPoly ? {
          x: field.boundingPoly.normalizedVertices?.[0]?.x || 0,
          y: field.boundingPoly.normalizedVertices?.[0]?.y || 0,
          width: (field.boundingPoly.normalizedVertices?.[2]?.x || 0) - (field.boundingPoly.normalizedVertices?.[0]?.x || 0),
          height: (field.boundingPoly.normalizedVertices?.[2]?.y || 0) - (field.boundingPoly.normalizedVertices?.[0]?.y || 0),
        } : undefined
      })) || [];

      return {
        success: true,
        content: {
          text: document.text || '',
          fields
        }
      };

    } catch (error) {
      console.error('Cloud conversion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during cloud conversion'
      };
    } finally {
      // Clean up temporary PDF if it was created
      if (pdfConversion?.isTemporary) {
        try {
          await fs.unlink(pdfConversion.path);
        } catch (error) {
          console.error('Failed to clean up temporary PDF:', error);
        }
      }
    }
  }

  private inferFieldType(field: any): string {
    // Add logic to infer field type based on content and context
    // This is a basic implementation
    const value = field.fieldValue?.textAnchor?.content || '';
    
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value)) return 'date';
    if (/^\d+$/.test(value)) return 'number';
    if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) return 'email';
    if (/^(true|false|yes|no)$/i.test(value)) return 'checkbox';
    return 'text';
  }
}
