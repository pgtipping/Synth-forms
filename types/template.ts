export type TemplateStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ResponseStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "SUBMITTED"
  | "ARCHIVED";
export type FieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "EMAIL"
  | "DATE"
  | "SELECT"
  | "RADIO"
  | "CHECKBOX"
  | "FILE"
  | "RICH_TEXT";

export interface Template {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  version: number;
  parentVersionId?: string;
  versionHistory?: Array<{
    version: number;
    changedAt: string;
    changes: string[];
    migratedFrom?: number;
  }>;
  migrationNotes?: {
    fromVersion: number;
    toVersion: number;
    notes: string;
    automated: boolean;
  }[];
  status: TemplateStatus;
  content: any;
  metadata?: {
    originalFormat?: string;
    lastConvertedAt?: string;
    conversionStatus?: string;
    originalSource?: string;
  };
  formDefinition?: {
    fields: FormField[];
    layout?: {
      sections: {
        id: string;
        title: string;
        fields: string[];
      }[];
    };
  };
  customizableAreas?: any;
  previewImage?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  childVersions?: Template[];
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  hidden?: boolean;
  disabled?: boolean;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    minValue?: number;
    maxValue?: number;
    requiredIf?: string;
    customValidator?: string;
  };
  dependencies?: {
    fieldId: string;
    condition: {
      operator:
        | "equals"
        | "notEquals"
        | "contains"
        | "greaterThan"
        | "lessThan";
      value: string | number | boolean;
    };
    action: "show" | "hide" | "enable" | "disable" | "require" | "clear";
  }[];
  defaultValue?: string;
  placeholder?: string;
  options?: any[];
}

export interface Customization {
  id: string;
  name?: string;
  branding?: {
    logo?: {
      url: string;
      position: string;
    };
    colors?: {
      primary: string;
      secondary: string;
      text: string;
    };
  };
  fieldCustomizations?: {
    labels?: Record<string, string>;
    placeholders?: Record<string, string>;
    required?: string[];
    hidden?: string[];
  };
  typography?: {
    headerFont: string;
    bodyFont: string;
    fontSize: string;
  };
  templateId: string;
  userId: string;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormResponse {
  id: string;
  data: any;
  status: ResponseStatus;
  templateVersion: number;
  metadata?: {
    submittedAt?: string;
    lastModified?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  templateId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFilters {
  sort: "popular" | "newest" | "alphabetical";
  layout: "classic" | "modern";
  type: string;
  status?: TemplateStatus;
  category?: string;
}
