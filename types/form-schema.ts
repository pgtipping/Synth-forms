import { z } from 'zod';

// Field validation types
export const FieldValidation = z.object({
  required: z.boolean().default(false),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  customValidation: z.function().args(z.any()).returns(z.boolean()).optional(),
});

export type FieldValidationType = z.infer<typeof FieldValidation>;

// Base field properties that all field types share
export const BaseField = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  name: z.string(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  defaultValue: z.any().optional(),
  validation: FieldValidation.optional(),
  className: z.string().optional(),
  disabled: z.boolean().default(false),
  hidden: z.boolean().default(false),
  conditional: z.object({
    field: z.string(),
    value: z.any(),
  }).optional(),
});

// Text input field
export const TextField = BaseField.extend({
  type: z.literal('text'),
  multiline: z.boolean().default(false),
  rows: z.number().optional(),
});

// Select field
export const SelectField = BaseField.extend({
  type: z.literal('select'),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })),
  multiple: z.boolean().default(false),
});

// Checkbox field
export const CheckboxField = BaseField.extend({
  type: z.literal('checkbox'),
  checked: z.boolean().default(false),
});

// Radio field
export const RadioField = BaseField.extend({
  type: z.literal('radio'),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })),
});

// Date field
export const DateField = BaseField.extend({
  type: z.literal('date'),
  format: z.string().optional(),
});

// File upload field
export const FileField = BaseField.extend({
  type: z.literal('file'),
  accept: z.string().optional(),
  multiple: z.boolean().default(false),
  maxSize: z.number().optional(),
});

// Number field
export const NumberField = BaseField.extend({
  type: z.literal('number'),
  step: z.number().optional(),
});

// URL field
export const UrlField = BaseField.extend({
  type: z.literal('url'),
  pattern: z.string().optional(),
});

// Currency field
export const CurrencyField = BaseField.extend({
  type: z.literal('currency'),
  currency: z.string().default('USD'),
  precision: z.number().default(2),
});

// Color field
export const ColorField = BaseField.extend({
  type: z.literal('color'),
  format: z.enum(['hex', 'rgb', 'rgba']).default('hex'),
});

// Rating field
export const RatingField = BaseField.extend({
  type: z.literal('rating'),
  min: z.number().default(1),
  max: z.number().default(5),
  step: z.number().default(1),
  style: z.enum(['numeric', 'stars', 'emoji', 'custom']).default('stars'),
  labels: z.record(z.string()).optional(),
  customIcons: z.array(z.string()).optional(),
});

// Signature field
export const SignatureField = BaseField.extend({
  type: z.literal('signature'),
  format: z.enum(['draw', 'type']).default('draw'),
  includeTimestamp: z.boolean().default(true),
  requireName: z.boolean().default(true),
});

// Form section for grouping fields
export const FormSection = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(
    z.discriminatedUnion('type', [
      TextField,
      SelectField,
      CheckboxField,
      RadioField,
      DateField,
      FileField,
      NumberField,
      UrlField,
      CurrencyField,
      ColorField,
      RatingField,
      SignatureField,
    ])
  ),
});

// Complete form schema
export const FormSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  version: z.string(),
  created: z.string(),
  modified: z.string(),
  author: z.string().optional(),
  branding: z.object({
    logo: z.string().optional(),
    companyName: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
  }).optional(),
  sections: z.array(FormSection),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type FormSchemaType = z.infer<typeof FormSchema>;
export type FormSectionType = z.infer<typeof FormSection>;
export type TextFieldType = z.infer<typeof TextField>;
export type SelectFieldType = z.infer<typeof SelectField>;
export type CheckboxFieldType = z.infer<typeof CheckboxField>;
export type RadioFieldType = z.infer<typeof RadioField>;
export type DateFieldType = z.infer<typeof DateField>;
export type FileFieldType = z.infer<typeof FileField>;
export type NumberFieldType = z.infer<typeof NumberField>;
export type UrlFieldType = z.infer<typeof UrlField>;
export type CurrencyFieldType = z.infer<typeof CurrencyField>;
export type ColorFieldType = z.infer<typeof ColorField>;
export type RatingFieldType = z.infer<typeof RatingField>;
export type SignatureFieldType = z.infer<typeof SignatureField>;
