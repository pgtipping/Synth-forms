import { FieldType, ValidationRule } from './types';

export function detectFieldType(label: string, text: string): FieldType {
  const labelLower = label.toLowerCase();
  const textLower = text.toLowerCase();

  // Rating field detection
  if (
    labelLower.includes('rating') ||
    labelLower.includes('score') ||
    labelLower.includes('rank') ||
    textLower.includes('scale of') ||
    /rate.*[1-5]|[1-5].*rate/i.test(textLower)
  ) {
    return 'rating';
  }

  // Date field detection
  if (
    labelLower.includes('date') ||
    labelLower.includes('when') ||
    /\d{2}[-/]\d{2}[-/]\d{4}/.test(text)
  ) {
    return 'date';
  }

  // File upload detection
  if (
    labelLower.includes('upload') ||
    labelLower.includes('attachment') ||
    labelLower.includes('file')
  ) {
    return 'file';
  }

  // Currency field detection
  if (
    labelLower.includes('cost') ||
    labelLower.includes('price') ||
    labelLower.includes('amount') ||
    labelLower.includes('budget') ||
    /[$€£¥]/.test(text)
  ) {
    return 'currency';
  }

  // URL field detection
  if (
    labelLower.includes('url') ||
    labelLower.includes('website') ||
    labelLower.includes('link') ||
    /https?:\/\//.test(text)
  ) {
    return 'url';
  }

  // Textarea detection
  if (
    labelLower.includes('description') ||
    labelLower.includes('comments') ||
    labelLower.includes('feedback') ||
    labelLower.includes('explain') ||
    text.length > 100
  ) {
    return 'textarea';
  }

  // Default to input
  return 'input';
}

export function detectValidationRules(label: string, text: string): ValidationRule[] {
  const rules: ValidationRule[] = [];
  const labelLower = label.toLowerCase();

  // Required field detection
  if (
    labelLower.includes('*') ||
    labelLower.includes('required') ||
    text.includes('*required')
  ) {
    rules.push({ type: 'required' });
  }

  // Email validation
  if (
    labelLower.includes('email') ||
    labelLower.includes('e-mail') ||
    /@/.test(text)
  ) {
    rules.push({ type: 'email' });
  }

  // Phone validation
  if (
    labelLower.includes('phone') ||
    labelLower.includes('mobile') ||
    labelLower.includes('tel') ||
    /\+?\d{1,4}[-.\s]?\(?\d{1,}\)?/.test(text)
  ) {
    rules.push({ type: 'phone' });
  }

  // Number validation
  if (
    labelLower.includes('number') ||
    labelLower.includes('amount') ||
    labelLower.includes('quantity') ||
    /^\d+$/.test(text)
  ) {
    rules.push({ type: 'number' });
  }

  return rules;
}

export function detectRatingScale(text: string) {
  const scaleMatch = text.match(/(\d+).*to.*(\d+)/i);
  if (scaleMatch) {
    const min = parseInt(scaleMatch[1]);
    const max = parseInt(scaleMatch[2]);
    return {
      min,
      max,
      step: 1,
      style: 'numeric' as const
    };
  }

  // Default 5-point scale
  return {
    min: 1,
    max: 5,
    step: 1,
    style: 'numeric' as const
  };
}
