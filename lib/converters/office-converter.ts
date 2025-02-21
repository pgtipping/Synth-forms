// Mark this file as server-only
'use server';

import mammoth from 'mammoth';
import xlsx from 'xlsx';
import { promises as fs } from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { v4 as uuidv4 } from 'uuid';
import { detectOfficeWatermark } from '../shared/watermark';
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
import { 
  FormField, 
  FormSection, 
  ConversionResult 
} from '../shared/types';

export class OfficeConverter {
  private fields: (FormField | FormSection)[] = [];
  private confidence = 0;

  async convert(filePath: string): Promise<ConversionResult> {
    try {
      // Check for watermarks
      const hasWatermark = await detectOfficeWatermark(filePath, {}, {});
      if (hasWatermark) {
        return {
          success: false,
          content: null,
          error: 'Document contains watermark',
          fields: [],
          confidence: 0
        };
      }

      // Convert based on file type
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.xlsx') {
        return this.convertXLSX(filePath);
      }

      // Convert DOCX to HTML
      const result = await mammoth.convertToHtml({ path: filePath });
      const { fields, confidence } = this.detectFields(result.value);

      return {
        success: true,
        content: result.value,
        fields,
        confidence
      };
    } catch (error) {
      return {
        success: false,
        content: null,
        error: `Conversion failed: ${error.message}`,
        fields: [],
        confidence: 0
      };
    }
  }

  private detectFields(html: string): { fields: (FormField | FormSection)[]; confidence: number } {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const paragraphs = document.querySelectorAll('p');
    
    const fields: FormField[] = [];
    let totalConfidence = 0;
    let fieldCount = 0;

    paragraphs.forEach((p, index) => {
      const text = p.textContent?.trim() || '';
      if (!text) return;

      // Skip if it's just a number or bullet point
      if (/^[\d•·-]$/.test(text)) return;

      const label = text.split(':')[0]?.trim() || text;
      const type = detectFieldType(label, text);
      const validation = detectValidationRules(label, text);
      const ratingScale = type === 'rating' ? detectRatingScale(text) : undefined;

      const field: FormField = {
        id: uuidv4(),
        type,
        label,
        required: validation.some(rule => rule.type === 'required'),
        validation,
        section: this.detectSection(text, index, paragraphs),
        ratingScale
      };

      fields.push(field);
      totalConfidence += this.calculateFieldConfidence(field);
      fieldCount++;
    });

    // Process form structure
    const sections = processFormStructure(fields);
    const mergedSections = mergeSections(sections);
    const isValid = validateFormStructure(mergedSections);

    return {
      fields: mergedSections,
      confidence: fieldCount > 0 ? totalConfidence / fieldCount : 0
    };
  }

  private calculateFieldConfidence(field: FormField): number {
    let confidence = 0.5; // Base confidence

    // Adjust based on field properties
    if (field.validation && field.validation.length > 0) confidence += 0.1;
    if (field.type !== 'input') confidence += 0.1; // Non-default type detection
    if (field.ratingScale) confidence += 0.1;
    if (field.section) confidence += 0.1;

    return Math.min(confidence, 1); // Cap at 1.0
  }

  private detectSection(text: string, index: number, paragraphs: NodeListOf<Element>): string | undefined {
    // Look back for the nearest heading-like text
    for (let i = index - 1; i >= 0; i--) {
      const p = paragraphs[i];
      const pText = p.textContent?.trim() || '';
      
      if (
        pText &&
        (p.tagName === 'H1' ||
         p.tagName === 'H2' ||
         p.tagName === 'H3' ||
         p.tagName === 'H4' ||
         /^[A-Z][\w\s]{2,}:?$/.test(pText) || // Capitalized text ending with optional colon
         /^\d+\.\s+[A-Z]/.test(pText)) // Numbered sections
      ) {
        return pText;
      }
    }
    
    return undefined;
  }

  async convertXLSX(filePath: string): Promise<ConversionResult> {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      const fields: FormField[] = [];
      let totalConfidence = 0;
      let fieldCount = 0;

      // Process headers as field labels
      const headers = data[0] as string[];
      headers.forEach((header, index) => {
        if (!header) return;

        const type = detectFieldType(header, '');
        const validation = detectValidationRules(header, '');

        const field: FormField = {
          id: uuidv4(),
          type,
          label: header,
          required: validation.some(rule => rule.type === 'required'),
          validation
        };

        fields.push(field);
        totalConfidence += this.calculateFieldConfidence(field);
        fieldCount++;
      });

      // Process form structure
      const sections = processFormStructure(fields);
      const mergedSections = mergeSections(sections);

      return {
        success: true,
        content: data,
        fields: mergedSections,
        confidence: fieldCount > 0 ? totalConfidence / fieldCount : 0
      };
    } catch (error) {
      return {
        success: false,
        content: null,
        error: `Excel conversion failed: ${error.message}`,
        fields: [],
        confidence: 0
      };
    }
  }
}
