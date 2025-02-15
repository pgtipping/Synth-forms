import { DocumentConverter, ConversionResult } from './types/converter';
import { promises as fs } from 'fs';
import axios from 'axios';
import FormData from 'form-data';

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
          name: field.label || 'unnamed_field',
          type: this.inferFieldType(field),
          value: field.text,
          confidence: field.confidence
        }));

      // Process form structure
      const formStructure = await this.processFormStructure(fields);

      return {
        success: true,
        content: {
          text: fields.map(f => f.value).join(' '),
          fields,
          formStructure
        }
      };

    } catch (error) {
      console.error('Local form conversion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during local form conversion'
      };
    }
  }

  private getContentType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/octet-stream';
    }
  }

  private inferFieldType(field: any): string {
    const text = field.text?.toLowerCase() || '';
    const label = field.label?.toLowerCase() || '';
    
    // Section detection
    if (
      label.includes('section') ||
      label.includes('part') ||
      /^[IVX]+\.|^\d+\.|^[A-Z]\./i.test(label) ||
      field.children?.length > 0
    ) {
      return 'section';
    }

    // Date detection with improved patterns
    if (
      label.includes('date') ||
      label.includes('when') ||
      label.includes('deadline') ||
      /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(text) ||
      /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(text) ||
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(text)
    ) {
      return 'date';
    }

    // Selection/Choice field detection
    if (
      label.includes('select') ||
      label.includes('choose') ||
      label.includes('option') ||
      /^(?:☐|☑|✓|x|\[\s*\]|\[x\]|\s*•\s*)/i.test(text) ||
      text.split(/[,|]/).length > 1
    ) {
      return 'select';
    }

    // Rating/Score field detection
    if (
      label.includes('rate') ||
      label.includes('score') ||
      label.includes('rating') ||
      label.includes('evaluation') ||
      /^[1-5]$/.test(text) ||
      /^\d+\/\d+$/.test(text)
    ) {
      return 'rating';
    }

    // Yes/No field detection
    if (
      /^(?:yes|no|y|n)$/i.test(text) ||
      label.includes('yes/no') ||
      label.includes('y/n')
    ) {
      return 'boolean';
    }

    // Multi-line text detection with improved conditions
    if (
      text.includes('\n') ||
      text.length > 100 ||
      label.includes('description') ||
      label.includes('comment') ||
      label.includes('explain') ||
      label.includes('detail') ||
      label.includes('elaborate')
    ) {
      return 'textarea';
    }

    // Email detection
    if (
      label.includes('email') ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
    ) {
      return 'email';
    }

    // Phone detection
    if (
      label.includes('phone') || 
      label.includes('tel') ||
      /^[\d\s\-+()]{7,}$/.test(text)
    ) {
      return 'phone';
    }

    // Number detection
    if (
      label.includes('amount') ||
      label.includes('number') ||
      /^[\d.,]+$/.test(text)
    ) {
      return 'number';
    }

    // Checkbox/Radio detection
    if (
      label.includes('check') ||
      label.includes('select') ||
      /^[☐☑✓x\s]{1,2}$/i.test(text)
    ) {
      return 'checkbox';
    }

    return 'text';
  }

  private validateField(field: any): boolean {
    // Skip validation for section types
    if (this.inferFieldType(field) === 'section') {
      return true;
    }

    if (!field.text && !field.label) {
      return false;
    }

    // Improved confidence threshold for different field types
    if (field.confidence) {
      const type = this.inferFieldType(field);
      const threshold = {
        'section': 0.3,
        'date': 0.6,
        'select': 0.5,
        'rating': 0.7,
        'boolean': 0.8,
        'textarea': 0.4,
        'text': 0.5
      }[type] || 0.5;

      if (field.confidence < threshold) {
        return false;
      }
    }

    // Validate field based on type
    const type = this.inferFieldType(field);
    switch (type) {
      case 'date':
        return !isNaN(Date.parse(field.text)) || /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(field.text);
      case 'rating':
        return /^[1-5]$/.test(field.text) || /^\d+\/\d+$/.test(field.text);
      case 'boolean':
        return /^(?:yes|no|y|n)$/i.test(field.text);
      case 'select':
        return field.text.split(/[,|]/).length > 1 || /^(?:☐|☑|✓|x|\[\s*\]|\[x\]|\s*•\s*)/i.test(field.text);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.text);
      case 'number':
        return !isNaN(parseFloat(field.text));
      default:
        return true;
    }
  }

  private async processFormStructure(fields: any[]): Promise<FormSection[]> {
    const sections: FormSection[] = [];
    let currentSection: FormSection | null = null;

    for (const field of fields) {
      if (this.inferFieldType(field) === 'section') {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          id: this.generateId(),
          type: 'section',
          label: field.label,
          level: field.level || 1,
          fields: [],
          layout: {
            columns: this.inferColumnCount(field),
            spacing: this.inferSpacing(field),
            style: this.inferSectionStyle(field)
          }
        };
      } else if (currentSection) {
        currentSection.fields.push(this.createFormField(field));
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return this.buildSectionHierarchy(sections);
  }

  private createFormField(field: any): FormField {
    const type = this.inferFieldType(field);
    const relationships = this.inferRelationships(field);
    const conditions = this.inferConditions(field);

    return {
      id: this.generateId(),
      type,
      label: field.label,
      value: field.text,
      required: this.inferRequired(field),
      validation: this.inferValidation(field, type),
      conditions,
      relationships,
      style: {
        layout: this.inferFieldLayout(field),
        alignment: this.inferAlignment(field),
        emphasis: this.inferEmphasis(field)
      },
      accessibility: {
        ariaLabel: field.label,
        ariaDescription: this.generateAriaDescription(field),
        tabIndex: this.calculateTabIndex(field)
      }
    };
  }

  private inferRelationships(field: any): FieldRelationship[] {
    const relationships: FieldRelationship[] = [];
    
    // Parent-child relationships
    if (field.parent) {
      relationships.push({
        type: 'child',
        sourceField: field.id,
        targetField: field.parent
      });
    }

    // Dependent relationships based on field references
    if (field.text?.includes('if') || field.label?.includes('if')) {
      const dependentFields = this.extractDependentFields(field);
      for (const dependentField of dependentFields) {
        relationships.push({
          type: 'dependent',
          sourceField: field.id,
          targetField: dependentField,
          conditions: [{
            type: 'visibility',
            field: dependentField,
            operator: 'equals',
            value: true
          }]
        });
      }
    }

    return relationships;
  }

  private inferConditions(field: any): FieldCondition[] {
    const conditions: FieldCondition[] = [];

    // Required conditions
    if (field.label?.includes('*') || field.label?.toLowerCase().includes('required')) {
      conditions.push({
        type: 'requirement',
        field: field.id,
        operator: 'equals',
        value: true
      });
    }

    // Validation conditions based on field type
    switch (this.inferFieldType(field)) {
      case 'email':
        conditions.push({
          type: 'validation',
          field: field.id,
          operator: 'contains',
          value: '@'
        });
        break;
      case 'date':
        conditions.push({
          type: 'validation',
          field: field.id,
          operator: 'lessThan',
          value: new Date().toISOString()
        });
        break;
      case 'number':
        if (field.label?.toLowerCase().includes('rating')) {
          conditions.push({
            type: 'validation',
            field: field.id,
            operator: 'lessThan',
            value: 6
          });
        }
        break;
    }

    return conditions;
  }

  private inferRequired(field: any): boolean {
    return (
      field.label?.includes('*') ||
      field.label?.toLowerCase().includes('required') ||
      field.required === true
    );
  }

  private inferValidation(field: any, type: string): string {
    switch (type) {
      case 'email':
        return '^[\\w-\\.]+@[\\w-]+\\.[\\w-]{2,4}$';
      case 'phone':
        return '^[\\d\\s\\-+()]{7,}$';
      case 'date':
        return '^\\d{4}-\\d{2}-\\d{2}$';
      case 'number':
        return '^\\d+$';
      default:
        return '';
    }
  }

  private inferFieldLayout(field: any): 'full' | 'half' | 'third' {
    if (field.label?.length > 50 || field.text?.length > 100) {
      return 'full';
    }
    return field.label?.length > 25 ? 'half' : 'third';
  }

  private inferAlignment(field: any): 'left' | 'center' | 'right' {
    if (field.type === 'number' || field.type === 'date') {
      return 'right';
    }
    return 'left';
  }

  private inferEmphasis(field: any): 'normal' | 'strong' | 'subtle' {
    if (field.label?.toLowerCase().includes('important') || field.required) {
      return 'strong';
    }
    if (field.label?.toLowerCase().includes('optional')) {
      return 'subtle';
    }
    return 'normal';
  }

  private generateAriaDescription(field: any): string {
    const parts = [];
    if (field.required) {
      parts.push('Required field');
    }
    if (field.type === 'date') {
      parts.push('Enter date in YYYY-MM-DD format');
    }
    return parts.join('. ');
  }

  private calculateTabIndex(field: any): number {
    // Implement logical tab order based on field position and type
    return 0; // Placeholder
  }

  private generateId(): string {
    return `field_${Math.random().toString(36).substr(2, 9)}`;
  }

  private buildSectionHierarchy(sections: FormSection[]): FormSection[] {
    // Implement logic to build section hierarchy
    return sections;
  }

  private inferColumnCount(field: any): number {
    // Implement logic to infer column count
    return 1;
  }

  private inferSpacing(field: any): string {
    // Implement logic to infer spacing
    return 'normal';
  }

  private inferSectionStyle(field: any): string {
    // Implement logic to infer section style
    return 'default';
  }

  private extractDependentFields(field: any): string[] {
    // Implement logic to extract dependent fields
    return [];
  }
}

interface FormSection {
  id: string;
  type: 'section';
  label: string;
  level: number;
  fields: FormField[];
  layout: {
    columns: number;
    spacing: string;
    style: string;
  };
}

interface FormField {
  id: string;
  type: string;
  label: string;
  value: string;
  required: boolean;
  validation: string;
  conditions: FieldCondition[];
  relationships: FieldRelationship[];
  style: {
    layout: 'full' | 'half' | 'third';
    alignment: 'left' | 'center' | 'right';
    emphasis: 'normal' | 'strong' | 'subtle';
  };
  accessibility: {
    ariaLabel: string;
    ariaDescription: string;
    tabIndex: number;
  };
}

interface FieldCondition {
  type: 'requirement' | 'validation';
  field: string;
  operator: 'equals' | 'contains' | 'lessThan';
  value: any;
}

interface FieldRelationship {
  type: 'child' | 'dependent';
  sourceField: string;
  targetField: string;
  conditions?: FieldCondition[];
}
