export interface FormField {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  label: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  readonly?: boolean;
  validation?: string;
  conditions?: FieldCondition[];
  relationships?: FieldRelationship[];
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: {
    layout: 'full' | 'half' | 'third';
    alignment: 'left' | 'center' | 'right';
    emphasis: 'normal' | 'strong' | 'subtle';
  };
  accessibility?: {
    ariaLabel?: string;
    ariaDescription?: string;
    tabIndex?: number;
  };
}

export interface FieldCondition {
  type: 'visibility' | 'requirement' | 'validation';
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string | number | boolean;
}

export interface FieldRelationship {
  type: 'parent' | 'child' | 'sibling' | 'dependent';
  sourceField: string;
  targetField: string;
  conditions?: FieldCondition[];
}

export interface FormSection {
  id: string;
  type: 'section';
  label: string;
  level: number;
  fields: FormField[];
  subsections?: FormSection[];
  conditions?: FieldCondition[];
  layout?: {
    columns: number;
    spacing: 'compact' | 'normal' | 'loose';
    style: 'card' | 'panel' | 'plain';
  };
}

export interface ConversionResult {
  success: boolean;
  content?: {
    text: string;
    fields: FormField[];
  };
  error?: string;
}

export interface DocumentConverter {
  convert(filePath: string): Promise<ConversionResult>;
}
