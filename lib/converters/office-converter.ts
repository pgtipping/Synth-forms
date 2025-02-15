// Mark this file as server-only
'use server';

import mammoth from 'mammoth';
import xlsx from 'xlsx';
import { promises as fs } from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

type ValidationRule = {
  type: 'email' | 'phone' | 'number' | 'length' | 'pattern' | 'date' | 'required' | 'range' | 'url' | 'currency' | 'custom';
  params?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
    currency?: string;
    customValidator?: string;
  };
};

interface FormSection {
  title: string;
  description?: string;
  fields: (FormField | FormSection)[];
  level: number; // Track section nesting level
  parent?: string; // Parent section title
}

interface FormField {
  type: 'input' | 'checkbox' | 'radio' | 'textarea' | 'date' | 'select' | 'signature' | 'rating' | 'currency' | 'url' | 'file' | 'color';
  label: string;
  required: boolean;
  validation?: ValidationRule[];
  options?: string[];
  section?: string;
  conditions?: {
    dependsOn: string;
    value: string | boolean | number;
    operation: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
  }[];
  ratingScale?: {
    min: number;
    max: number;
    step: number;
    labels?: Record<number, string>;
    style?: 'numeric' | 'stars' | 'emoji' | 'custom';
    customIcons?: string[];
  };
  placeholder?: string;
  defaultValue?: string | number | boolean;
  helpText?: string;
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

interface ConversionResult {
  success: boolean;
  content: any;
  error?: string;
  fields: (FormField | FormSection)[];
  confidence: number;
}

export class OfficeConverter {
  private detectValidationRules(label: string, text: string): ValidationRule[] {
    const rules: ValidationRule[] = [];
    const lowerLabel = label.toLowerCase();
    const lowerText = text.toLowerCase();

    // Required fields
    if (text.includes('*') || lowerText.includes('required')) {
      rules.push({ type: 'required' });
    }

    // Email fields
    if (lowerLabel.includes('email')) {
      rules.push({ type: 'email' });
    }

    // Phone fields
    if (lowerLabel.includes('phone') || lowerLabel.includes('tel')) {
      rules.push({ 
        type: 'phone',
        params: {
          pattern: '^[+]?[(]?[0-9]{3}[)]?[-\\s.]?[0-9]{3}[-\\s.]?[0-9]{4}$',
          message: 'Please enter a valid phone number'
        }
      });
    }

    // URL fields
    if (lowerLabel.includes('website') || lowerLabel.includes('url') || lowerLabel.includes('link')) {
      rules.push({ type: 'url' });
    }

    // Currency fields
    if (lowerLabel.includes('salary') || lowerLabel.includes('budget') || lowerLabel.includes('cost')) {
      rules.push({ 
        type: 'currency',
        params: {
          currency: 'USD',
          min: 0
        }
      });
    }

    // Number fields with ranges
    if (lowerLabel.includes('number') || lowerLabel.includes('amount') || lowerLabel.includes('quantity')) {
      rules.push({ 
        type: 'number',
        params: {
          min: 0,
          message: 'Please enter a valid number'
        }
      });
    }

    // Length constraints
    if (lowerLabel.includes('summary') || lowerLabel.includes('brief')) {
      rules.push({
        type: 'length',
        params: {
          max: 200,
          message: 'Please keep your response brief (max 200 characters)'
        }
      });
    } else if (lowerLabel.includes('description') || lowerLabel.includes('explain')) {
      rules.push({
        type: 'length',
        params: {
          min: 50,
          max: 1000,
          message: 'Please provide a detailed response (50-1000 characters)'
        }
      });
    }

    // Custom pattern matching
    if (lowerLabel.includes('employee id')) {
      rules.push({
        type: 'pattern',
        params: {
          pattern: '^[A-Z]{2}[0-9]{6}$',
          message: 'Employee ID must be 2 letters followed by 6 numbers'
        }
      });
    }

    return rules;
  }

  private detectFieldType(label: string, text: string): FormField['type'] {
    const lowerLabel = label.toLowerCase();
    const lowerText = text.toLowerCase();
    
    if (lowerLabel.includes('signature')) {
      return 'signature';
    }
    if (lowerLabel.includes('date')) {
      return 'date';
    }
    if (lowerLabel.includes('rating') || lowerLabel.includes('score') || lowerLabel.includes('rank') || 
        lowerLabel.includes('evaluate') || lowerLabel.includes('assessment')) {
      return 'rating';
    }
    if (lowerLabel.includes('website') || lowerLabel.includes('url')) {
      return 'url';
    }
    if (lowerLabel.includes('salary') || lowerLabel.includes('budget') || lowerLabel.includes('cost')) {
      return 'currency';
    }
    if (lowerLabel.includes('file') || lowerLabel.includes('upload') || lowerLabel.includes('attachment')) {
      return 'file';
    }
    if (lowerLabel.includes('color') || lowerLabel.includes('theme')) {
      return 'color';
    }
    if (lowerLabel.includes('explain') || lowerLabel.includes('comment') || lowerLabel.includes('discuss') || 
        lowerText.includes('what') || lowerText.includes('how') || lowerText.includes('why')) {
      return 'textarea';
    }
    return 'input';
  }

  private detectRatingScale(text: string): FormField['ratingScale'] | undefined {
    // Look for common rating patterns
    const numericMatch = text.match(/(\d+)\s*-\s*(\d+)/);
    const starMatch = text.match(/(\d+)\s*stars?/i);
    const emojiMatch = text.toLowerCase().includes('emoji') || text.includes('😀') || text.includes('👍');
    
    if (numericMatch) {
      const min = parseInt(numericMatch[1]);
      const max = parseInt(numericMatch[2]);
      let labels: Record<number, string> = {};
      
      // Look for label patterns
      if (text.toLowerCase().includes('poor') && text.toLowerCase().includes('excellent')) {
        labels = {
          [min]: 'Poor',
          [Math.floor((max - min) / 2) + min]: 'Average',
          [max]: 'Excellent'
        };
      } else if (text.toLowerCase().includes('disagree') && text.toLowerCase().includes('agree')) {
        labels = {
          [min]: 'Strongly Disagree',
          [Math.floor((max - min) / 4) + min]: 'Disagree',
          [Math.floor((max - min) / 2) + min]: 'Neutral',
          [Math.floor(3 * (max - min) / 4) + min]: 'Agree',
          [max]: 'Strongly Agree'
        };
      }
      
      return {
        min,
        max,
        step: 1,
        labels,
        style: 'numeric'
      };
    }
    
    if (starMatch) {
      const max = parseInt(starMatch[1]);
      return {
        min: 0,
        max,
        step: 1,
        style: 'stars'
      };
    }
    
    if (emojiMatch) {
      return {
        min: 1,
        max: 5,
        step: 1,
        style: 'emoji',
        labels: {
          1: '😞',
          2: '😕',
          3: '😐',
          4: '🙂',
          5: '😀'
        }
      };
    }
    
    return undefined;
  }

  private detectSectionLevel(text: string, index: number, paragraphs: NodeListOf<Element>): number {
    // Check for explicit numbering (e.g., "1.", "1.1.", "A.", "I.")
    if (text.match(/^[A-Z1-9]+\./)) {
      const parts = text.split('.');
      return parts.length - 1;
    }
    
    // Check for strong/bold tags
    const paragraph = paragraphs[index];
    if (paragraph.querySelector('strong, b')) {
      return 1;
    }
    
    // Check for Part/Section markers
    if (text.match(/^(Part|Section)\s+\d+:/i)) {
      return 1;
    }
    
    // Check for indentation using text
    const leadingSpaces = text.match(/^\s+/);
    if (leadingSpaces) {
      return Math.floor(leadingSpaces[0].length / 4) + 1;
    }
    
    return 1;
  }

  private detectFields(html: string): { fields: (FormField | FormSection)[]; confidence: number } {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const fields: (FormField | FormSection)[] = [];
    let detectionConfidence = 0.8;
    let currentSection: FormSection | null = null;
    let sectionStack: FormSection[] = [];

    // Find input fields
    const paragraphs = doc.querySelectorAll('p');
    paragraphs.forEach((p, index) => {
      const text = p.textContent || '';
      console.log(`Paragraph ${index}:`, text);
      
      // Check for section headers
      if (p.querySelector('strong, b') || text.match(/^(Part|Section)\s+\d+:/i)) {
        const level = this.detectSectionLevel(text, index, paragraphs);
        
        // Pop sections until we find the right parent level
        while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].level >= level) {
          const completedSection = sectionStack.pop();
          if (completedSection) {
            if (sectionStack.length > 0) {
              sectionStack[sectionStack.length - 1].fields.push(completedSection);
            } else {
              fields.push(completedSection);
            }
          }
        }
        
        currentSection = {
          title: text.trim(),
          fields: [],
          level,
          parent: sectionStack.length > 0 ? sectionStack[sectionStack.length - 1].title : undefined
        };
        sectionStack.push(currentSection);
        detectionConfidence += 0.05;
        return;
      }
      
      // Check for Word-style placeholders
      if (text.includes('Click or tap here to enter text') || text.includes('Click or tap to enter')) {
        console.log('Found Word input field:', text);
        const label = text.split(/Click or tap (?:here )?to enter/)[0].trim().replace(/:\s*$/, '');
        if (label) {
          const type = this.detectFieldType(label, text);
          const validation = this.detectValidationRules(label, text);
          const ratingScale = type === 'rating' ? this.detectRatingScale(text) : undefined;
          
          const field: FormField = {
            type,
            label,
            required: validation.some(v => v.type === 'required'),
            validation,
            section: currentSection?.title,
            ratingScale
          };

          if (currentSection) {
            currentSection.fields.push(field);
          } else {
            fields.push(field);
          }
          detectionConfidence += 0.05;
        }
      }
      
      // Check for classic input field patterns
      else if (text.includes('_____') || text.includes('     ')) {
        console.log('Found classic input field:', text);
        const label = text.split(/[_\s]{5,}/)[0].trim();
        if (label) {
          const type = this.detectFieldType(label, text);
          const validation = this.detectValidationRules(label, text);
          const ratingScale = type === 'rating' ? this.detectRatingScale(text) : undefined;
          
          const field: FormField = {
            type,
            label,
            required: validation.some(v => v.type === 'required'),
            validation,
            section: currentSection?.title,
            ratingScale
          };

          if (currentSection) {
            currentSection.fields.push(field);
          } else {
            fields.push(field);
          }
          detectionConfidence += 0.05;
        }
      }
      
      // Check for checkbox/radio patterns (including Word-style bullets)
      if (text.includes('□') || text.includes('[ ]') || text.includes('()') || text.includes('🞏')) {
        console.log('Found checkbox/radio:', text);
        const label = text.replace(/[□\[\]()🞏]/g, '').trim();
        if (label) {
          // If it's part of a group, look for the group label in previous paragraphs
          let groupLabel = '';
          for (let i = index - 1; i >= 0 && i >= index - 3; i--) {
            const prevText = (paragraphs[i]?.textContent || '').trim();
            if (!prevText.includes('□') && !prevText.includes('[ ]') && !prevText.includes('()') && !prevText.includes('🞏')) {
              groupLabel = prevText;
              break;
            }
          }
          
          const type = text.includes('()') ? 'radio' : 'checkbox';
          
          // If we found a group label, this is part of a radio/select group
          if (groupLabel) {
            // Find or create the group
            let group = fields.find(f => f.type === 'select' && f.label === groupLabel);
            if (!group) {
              group = {
                type: 'select',
                label: groupLabel,
                required: groupLabel.includes('*') || groupLabel.includes('required'),
                options: []
              };
              fields.push(group);
              detectionConfidence += 0.05;
            }
            if (group.options) {
              group.options.push(label);
            }
          } else {
            // Standalone checkbox
            const field: FormField = {
              type,
              label,
              required: label.includes('*') || label.includes('required'),
              section: currentSection?.title
            };

            if (currentSection) {
              currentSection.fields.push(field);
            } else {
              fields.push(field);
            }
            detectionConfidence += 0.05;
          }
        }
      }
      
      // Check for standalone labels that might be signature fields
      else if (text.includes('Signature') || text.includes('Name:')) {
        console.log('Found signature field:', text);
        const label = text.trim();
        if (label && !fields.some(f => f.label === label)) {
          const field: FormField = {
            type: 'signature',
            label,
            required: label.includes('*') || label.includes('required'),
            section: currentSection?.title
          };

          if (currentSection) {
            currentSection.fields.push(field);
          } else {
            fields.push(field);
          }
          detectionConfidence += 0.05;
        }
      }
    });

    // Add remaining sections
    while (sectionStack.length > 0) {
      const completedSection = sectionStack.pop();
      if (completedSection) {
        if (sectionStack.length > 0) {
          sectionStack[sectionStack.length - 1].fields.push(completedSection);
        } else {
          fields.push(completedSection);
        }
      }
    }

    // Normalize confidence score between 0 and 1
    detectionConfidence = Math.min(detectionConfidence, 1);
    console.log('Total fields found:', fields.length);
    
    return { fields, confidence: detectionConfidence };
  }

  async convert(filePath: string): Promise<ConversionResult> {
    try {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.convertToHtml({ buffer });
      
      // Detect fields in the converted HTML
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
        error: error instanceof Error ? error.message : 'Unknown error',
        fields: [],
        confidence: 0
      };
    }
  }

  async convertXLSX(filePath: string): Promise<ConversionResult> {
    try {
      const workbook = xlsx.readFile(filePath);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = xlsx.utils.sheet_to_json(firstSheet);
      
      return {
        success: true,
        content: jsonData,
        fields: [],
        confidence: 0.8
      };
    } catch (error) {
      return {
        success: false,
        content: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        fields: [],
        confidence: 0
      };
    }
  }

  async detectOfficeWatermark(filePath: string): Promise<boolean> {
    try {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.toLowerCase();
      
      const watermarkKeywords = [
        'draft',
        'confidential',
        'internal use only',
        'do not copy',
        'watermark'
      ];
      
      return watermarkKeywords.some(keyword => text.includes(keyword));
    } catch (error) {
      console.error('Error detecting watermark:', error);
      return false;
    }
  }
}
