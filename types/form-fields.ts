import { z } from 'zod';

// Base field types
export const textField = z.string().min(1, 'This field is required');
export const numberField = z.number().min(0);
export const dateField = z.date();
export const emailField = z.string().email('Invalid email address');
export const textareaField = z.string().min(1, 'This field is required');
export const dateStringField = z.string().min(1, 'Date is required').regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format');
export const phoneField = z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number');

// Rating field (1-5 scale)
export const ratingField = z.number().min(1).max(5);

// Yes/No field
export const yesNoField = z.enum(['yes', 'no']);

// Progress status field
export const progressField = z.enum(['not-started', 'in-progress', 'completed']);

// Priority field
export const priorityField = z.enum(['low', 'medium', 'high']);

// Base field metadata types
export const baseFieldMetadata = {
  text: {
    type: 'text' as const,
    required: true
  },
  textarea: {
    type: 'textarea' as const,
    required: true
  },
  date: {
    type: 'date' as const,
    required: true
  },
  email: {
    type: 'email' as const,
    required: true
  },
  phone: {
    type: 'tel' as const,
    required: true
  },
  rating: {
    type: 'rating' as const,
    min: 1,
    max: 5
  },
  yesNo: {
    type: 'radio' as const,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' }
    ]
  },
  progress: {
    type: 'select' as const,
    options: [
      { value: 'not-started', label: 'Not Started' },
      { value: 'in-progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' }
    ]
  },
  priority: {
    type: 'select' as const,
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' }
    ]
  }
} as const;

// Helper to create a rating field with labels
export const createRatingField = (
  label: string,
  description?: string
) => ({
  ...baseFieldMetadata.rating,
  label,
  description,
  labels: {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  }
});

// Helper to create a text field with custom label
export const createTextField = (
  label: string,
  required: boolean = true
) => ({
  ...baseFieldMetadata.text,
  label,
  required
});

// Helper to create a textarea field with custom label
export const createTextareaField = (
  label: string,
  required: boolean = true
) => ({
  ...baseFieldMetadata.textarea,
  label,
  required
});
