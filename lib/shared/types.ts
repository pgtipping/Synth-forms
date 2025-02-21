export type ValidationRule = {
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

export type FieldType = 'input' | 'checkbox' | 'radio' | 'textarea' | 'date' | 'select' | 'signature' | 'rating' | 'currency' | 'url' | 'file' | 'color';

export interface FormField {
  id: string;
  type: FieldType;
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

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: (FormField | FormSection)[];
  level: number;
  parent?: string;
  layout?: {
    columns: number;
    spacing: string;
    style: string;
  };
}

export interface ConversionResult {
  success: boolean;
  content: any;
  error?: string;
  fields: (FormField | FormSection)[];
  confidence: number;
}
