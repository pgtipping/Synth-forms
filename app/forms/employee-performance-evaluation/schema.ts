import { z } from 'zod';
import { textField, ratingField, createRatingField } from '../../../types/form-fields';

// Form validation schema
export const employeePerformanceSchema = z.object({
  employeeName: textField,
  position: textField,
  reviewPeriod: textField,
  jobKnowledge: ratingField,
  workQuality: ratingField,
  productivity: ratingField,
  communication: ratingField,
  teamwork: ratingField,
  initiative: ratingField,
  comments: z.string().optional(),
  goals: z.string().min(1, 'Please set at least one goal'),
  employeeSignature: textField,
  managerSignature: textField,
  reviewDate: z.string().min(1, 'Review date is required')
});

// TypeScript type from schema
export type EmployeePerformanceForm = z.infer<typeof employeePerformanceSchema>;

// Form field metadata
export const formFields = {
  employeeName: {
    ...baseFieldMetadata.text,
    label: 'Employee Name'
  },
  position: {
    ...baseFieldMetadata.text,
    label: 'Position'
  },
  reviewPeriod: {
    ...baseFieldMetadata.text,
    label: 'Review Period'
  },
  jobKnowledge: createRatingField(
    'Job Knowledge',
    'Understanding of job-related skills, procedures, and equipment'
  ),
  workQuality: createRatingField(
    'Quality of Work',
    'Accuracy, thoroughness, and adherence to standards'
  ),
  productivity: createRatingField(
    'Productivity',
    'Volume of work, efficiency, and time management'
  ),
  communication: createRatingField(
    'Communication Skills',
    'Verbal and written communication effectiveness'
  ),
  teamwork: createRatingField(
    'Teamwork',
    'Cooperation with others and contribution to team goals'
  ),
  initiative: createRatingField(
    'Initiative',
    'Self-motivation and proactive problem-solving'
  ),
  comments: {
    type: 'textarea' as const,
    label: 'Additional Comments',
    required: false
  },
  goals: {
    type: 'textarea' as const,
    label: 'Performance Goals',
    required: true
  },
  employeeSignature: {
    ...baseFieldMetadata.text,
    label: 'Employee Signature'
  },
  managerSignature: {
    ...baseFieldMetadata.text,
    label: 'Manager Signature'
  },
  reviewDate: {
    ...baseFieldMetadata.text,
    label: 'Review Date'
  }
} as const;
