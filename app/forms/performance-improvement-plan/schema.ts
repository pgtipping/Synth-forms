import { z } from 'zod';
import { 
  textField, 
  textareaField, 
  dateStringField,
  progressField,
  priorityField,
  createTextField,
  createTextareaField
} from '../../../types/form-fields';

// Form validation schema
export const performanceImprovementSchema = z.object({
  employeeName: textField,
  position: textField,
  department: textField,
  manager: textField,
  initiationDate: dateStringField,
  duration: textField,
  startDate: dateStringField,
  endDate: dateStringField,
  
  // Performance Areas
  performanceAreas: z.array(z.object({
    area: textField,
    currentPerformance: textareaField,
    expectedPerformance: textareaField,
    actionSteps: textareaField,
    timeline: textField,
    progress: progressField,
    priority: priorityField
  })).min(1, 'At least one performance area must be defined'),

  // Support and Resources
  supportProvided: textareaField,
  resources: textareaField,

  // Progress Reviews
  progressReviews: z.array(z.object({
    date: dateStringField,
    progress: textareaField,
    nextSteps: textareaField
  })),

  // Signatures
  employeeSignature: textField,
  managerSignature: textField,
  hrSignature: textField,
  signatureDate: dateStringField,

  // Additional Comments
  comments: z.string().optional()
});

// TypeScript type from schema
export type PerformanceImprovementForm = z.infer<typeof performanceImprovementSchema>;

// Form field metadata
export const formFields = {
  employeeName: createTextField('Employee Name'),
  position: createTextField('Position'),
  department: createTextField('Department'),
  manager: createTextField('Manager'),
  initiationDate: {
    ...baseFieldMetadata.date,
    label: 'Initiation Date'
  },
  duration: createTextField('Duration of PIP'),
  startDate: {
    ...baseFieldMetadata.date,
    label: 'Start Date'
  },
  endDate: {
    ...baseFieldMetadata.date,
    label: 'End Date'
  },

  // Performance Areas
  performanceAreas: {
    type: 'array' as const,
    label: 'Performance Areas',
    itemFields: {
      area: createTextField('Area for Improvement'),
      currentPerformance: createTextareaField('Current Performance'),
      expectedPerformance: createTextareaField('Expected Performance'),
      actionSteps: createTextareaField('Action Steps'),
      timeline: createTextField('Timeline'),
      progress: {
        ...baseFieldMetadata.progress,
        label: 'Progress'
      },
      priority: {
        ...baseFieldMetadata.priority,
        label: 'Priority'
      }
    }
  },

  // Support and Resources
  supportProvided: createTextareaField('Support to be Provided'),
  resources: createTextareaField('Resources Required'),

  // Progress Reviews
  progressReviews: {
    type: 'array' as const,
    label: 'Progress Reviews',
    itemFields: {
      date: {
        ...baseFieldMetadata.date,
        label: 'Review Date'
      },
      progress: createTextareaField('Progress Made'),
      nextSteps: createTextareaField('Next Steps')
    }
  },

  // Signatures
  employeeSignature: createTextField('Employee Signature'),
  managerSignature: createTextField('Manager Signature'),
  hrSignature: createTextField('HR Representative Signature'),
  signatureDate: {
    ...baseFieldMetadata.date,
    label: 'Date'
  },

  // Additional Comments
  comments: createTextareaField('Additional Comments', false)
} as const;
