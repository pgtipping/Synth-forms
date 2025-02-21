import { z } from 'zod';
import { textField, ratingField, textareaField, dateStringField, baseFieldMetadata, createRatingField } from '@/types/form-fields';

// Form validation schema
export const jobCompetencySchema = z.object({
  // Employee Information
  employeeId: textField,
  employeeName: textField,
  position: textField,
  department: textField,
  evaluationDate: dateStringField,
  evaluator: textField,

  // Core Competencies
  jobKnowledge: z.object({
    rating: ratingField,
    evidence: textareaField,
    developmentNeeds: textareaField.optional()
  }),
  technicalSkills: z.object({
    rating: ratingField,
    evidence: textareaField,
    developmentNeeds: textareaField.optional()
  }),
  problemSolving: z.object({
    rating: ratingField,
    evidence: textareaField,
    developmentNeeds: textareaField.optional()
  }),
  communication: z.object({
    rating: ratingField,
    evidence: textareaField,
    developmentNeeds: textareaField.optional()
  }),
  teamwork: z.object({
    rating: ratingField,
    evidence: textareaField,
    developmentNeeds: textareaField.optional()
  }),

  // Leadership Competencies
  leadershipCompetencies: z.object({
    isApplicable: z.boolean(),
    visionAndStrategy: z.object({
      rating: ratingField,
      evidence: textareaField,
      developmentNeeds: textareaField
    }).optional()
  })
});

// TypeScript type from schema
export type JobCompetencyForm = z.infer<typeof jobCompetencySchema>;

// Form field metadata
export const formFields = {
  // Employee Information
  employeeId: {
    ...baseFieldMetadata.text,
    label: 'Employee ID'
  },
  employeeName: {
    ...baseFieldMetadata.text,
    label: 'Employee Name'
  },
  position: {
    ...baseFieldMetadata.text,
    label: 'Position'
  },
  department: {
    ...baseFieldMetadata.text,
    label: 'Department'
  },
  evaluationDate: {
    ...baseFieldMetadata.date,
    label: 'Evaluation Date'
  },
  evaluator: {
    ...baseFieldMetadata.text,
    label: 'Evaluator Name'
  },

  // Core Competencies
  jobKnowledge: {
    rating: createRatingField(
      'Job Knowledge',
      'Understanding and application of job-related knowledge, skills, and procedures'
    ),
    evidence: {
      ...baseFieldMetadata.textarea,
      label: 'Evidence/Examples'
    },
    developmentNeeds: {
      ...baseFieldMetadata.textarea,
      label: 'Development Needs',
      required: false
    }
  },
  technicalSkills: {
    rating: createRatingField(
      'Technical Skills',
      'Proficiency in required technical skills and tools'
    ),
    evidence: {
      ...baseFieldMetadata.textarea,
      label: 'Evidence/Examples'
    },
    developmentNeeds: {
      ...baseFieldMetadata.textarea,
      label: 'Development Needs',
      required: false
    }
  },
  problemSolving: {
    rating: createRatingField(
      'Problem Solving',
      'Ability to analyze problems and develop effective solutions'
    ),
    evidence: {
      ...baseFieldMetadata.textarea,
      label: 'Evidence/Examples'
    },
    developmentNeeds: {
      ...baseFieldMetadata.textarea,
      label: 'Development Needs',
      required: false
    }
  },
  communication: {
    rating: createRatingField(
      'Communication',
      'Effectiveness in verbal and written communication'
    ),
    evidence: {
      ...baseFieldMetadata.textarea,
      label: 'Evidence/Examples'
    },
    developmentNeeds: {
      ...baseFieldMetadata.textarea,
      label: 'Development Needs',
      required: false
    }
  },
  teamwork: {
    rating: createRatingField(
      'Teamwork',
      'Ability to work effectively with others and contribute to team success'
    ),
    evidence: {
      ...baseFieldMetadata.textarea,
      label: 'Evidence/Examples'
    },
    developmentNeeds: {
      ...baseFieldMetadata.textarea,
      label: 'Development Needs',
      required: false
    }
  },

  // Leadership Competencies
  leadershipCompetencies: {
    isApplicable: {
      type: 'checkbox' as const,
      label: 'Evaluate Leadership Competencies',
      required: false
    },
    visionAndStrategy: {
      rating: createRatingField(
        'Vision and Strategy',
        'Ability to develop and communicate strategic vision'
      ),
      evidence: {
        ...baseFieldMetadata.textarea,
        label: 'Evidence/Examples'
      },
      developmentNeeds: {
        ...baseFieldMetadata.textarea,
        label: 'Development Needs'
      }
    }
  }
} as const;
