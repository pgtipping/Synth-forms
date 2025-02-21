import { DocumentConverter, ConversionResult, FormField, FormSection } from '../types/converter';
import { promises as fs } from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import { 
  detectFieldType, 
  detectValidationRules, 
  detectRatingScale 
} from '../shared/field-detection';
import { 
  processFormStructure, 
  mergeSections, 
  validateFormStructure 
} from '../shared/form-structure';

export class LocalFormConverter implements DocumentConverter {
  private inferenceServiceUrl: string;

  constructor() {
    this.inferenceServiceUrl = process.env.INFERENCE_SERVICE_URL || 'http://localhost:8000';
  }

  async convert(filePath: string): Promise<ConversionResult> {
    try {
      // Read the file
      const fileContent = await fs.readFile(filePath);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', fileContent, {
        filename: filePath.split('/').pop() || 'document',
        contentType: this.getContentType(filePath),
      });

      // Send to inference service
      const response = await axios.post(`${this.inferenceServiceUrl}/predict`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      // Transform and validate fields
      const fields = response.data.fields
        .filter((field: any) => this.validateField(field))
        .map((field: any) => ({
          id: uuidv4(),
          name: field.label || 'unnamed_field',
          type: detectFieldType(field.label || '', field.text || ''),
          label: field.label || 'unnamed_field',
          required: detectValidationRules(field.label || '', field.text || '').some(rule => rule.type === 'required'),
          validation: detectValidationRules(field.label || '', field.text || ''),
          style: {
            layout: 'full',
            alignment: 'left',
            emphasis: 'normal'
          }
        }));

      return {
        success: true,
        content: {
          text: fields.map(f => f.label).join(' '),
          fields: fields
        }
      };
    } catch (error) {
      console.error('Conversion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private validateField(field: any): boolean {
    return field && 
           typeof field === 'object' && 
           (field.label || field.text);
  }

  private getContentType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'application/octet-stream';
    }
  }
}
