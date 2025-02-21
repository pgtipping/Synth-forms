import { z } from 'zod';
import { textField, textareaField, dateStringField } from '@/types/form-fields';

// Custom 4-point rating scale
const competencyRatingField = z.number()
  .min(1, 'Rating is required')
  .max(4, 'Maximum rating is 4');

// Form validation schema
export const customerServiceCompetencySchema = z.object({
  // Employee Information
  employeeId: textField,
  employeeName: textField,
  position: textField,
  department: textField,
  evaluationDate: dateStringField,
  evaluator: textField,

  // Customer Service Competencies
  customerServiceManagement: z.object({
    rating: competencyRatingField,
    comments: textareaField.optional()
  }),
  serviceFailureRecovery: z.object({
    rating: competencyRatingField,
    comments: textareaField.optional()
  }),
  customerValueChain: z.object({
    rating: competencyRatingField,
    comments: textareaField.optional()
  }),
  customerAnalytics: z.object({
    rating: competencyRatingField,
    comments: textareaField.optional()
  }),
  crossFunctionalSatisfaction: z.object({
    rating: competencyRatingField,
    comments: textareaField.optional()
  }),
  bestPractices: z.object({
    rating: competencyRatingField,
    comments: textareaField.optional()
  }),
  qualityServiceApplication: z.object({
    rating: competencyRatingField,
    comments: textareaField.optional()
  }),
  businessEtiquette: z.object({
    rating: competencyRatingField,
    comments: textareaField.optional()
  }),

  // Marketing Competencies
  marketingConcepts: z.object({
    rating: competencyRatingField,
    comments: textareaField.optional()
  }),
  marketAnalysis: z.object({
    rating: competencyRatingField,
    comments: textareaField.optional()
  }),
  marketSegmentation: z.object({
    rating: competencyRatingField,
    comments: textareaField.optional()
  }),
  productDevelopment: z.object({
    rating: competencyRatingField,
    comments: textareaField.optional()
  }),
  marketingPlan: z.object({
    rating: competencyRatingField,
    comments: textareaField.optional()
  })
});

// Type inference
export type CustomerServiceCompetencyForm = z.infer<typeof customerServiceCompetencySchema>;

// Rating scale labels
export const ratingLabels = {
  1: 'Novice',
  2: 'Can do with help',
  3: 'Can do without help',
  4: 'Expert'
} as const;

// Form field metadata
export const formFields = {
  employeeId: {
    label: 'Employee ID',
    type: 'text' as const,
    required: true
  },
  employeeName: {
    label: 'Employee Name',
    type: 'text' as const,
    required: true
  },
  position: {
    label: 'Position',
    type: 'text' as const,
    required: true
  },
  department: {
    label: 'Department',
    type: 'text' as const,
    required: true
  },
  evaluationDate: {
    label: 'Evaluation Date',
    type: 'date' as const,
    required: true
  },
  evaluator: {
    label: 'Evaluator Name',
    type: 'text' as const,
    required: true
  },

  // Customer Service Competencies
  customerServiceManagement: {
    rating: {
      label: 'Can effectively and efficiently manage the design and delivery of delightful customer service',
      type: 'rating' as const,
      min: 1,
      max: 4,
      required: true,
      labels: ratingLabels
    },
    comments: {
      label: 'Comments',
      type: 'textarea' as const,
      required: false
    }
  },
  serviceFailureRecovery: {
    rating: {
      label: 'Has the ability to convert service failures to rich customer experiences',
      type: 'rating' as const,
      min: 1,
      max: 4,
      required: true,
      labels: ratingLabels
    },
    comments: {
      label: 'Comments',
      type: 'textarea' as const,
      required: false
    }
  },
  customerValueChain: {
    rating: {
      label: 'Has a good understanding of the customer value chain and how to effectively leverage on it to deliver exceptional service to the customer',
      type: 'rating' as const,
      min: 1,
      max: 4,
      required: true,
      labels: ratingLabels
    },
    comments: {
      label: 'Comments',
      type: 'textarea' as const,
      required: false
    }
  },
  customerAnalytics: {
    rating: {
      label: 'Can design the analytical framework necessary to understand what customers value, and where to concentrate improvement efforts',
      type: 'rating' as const,
      min: 1,
      max: 4,
      required: true,
      labels: ratingLabels
    },
    comments: {
      label: 'Comments',
      type: 'textarea' as const,
      required: false
    }
  },
  crossFunctionalSatisfaction: {
    rating: {
      label: 'Can apply the cross-functional nature of customer satisfaction in the modern business environment',
      type: 'rating' as const,
      min: 1,
      max: 4,
      required: true,
      labels: ratingLabels
    },
    comments: {
      label: 'Comments',
      type: 'textarea' as const,
      required: false
    }
  },
  bestPractices: {
    rating: {
      label: 'Understand current best practices and cutting edge concepts and methods in customer satisfaction and quality',
      type: 'rating' as const,
      min: 1,
      max: 4,
      required: true,
      labels: ratingLabels
    },
    comments: {
      label: 'Comments',
      type: 'textarea' as const,
      required: false
    }
  },
  qualityServiceApplication: {
    rating: {
      label: 'Can apply key concepts of quality service to the company job environment',
      type: 'rating' as const,
      min: 1,
      max: 4,
      required: true,
      labels: ratingLabels
    },
    comments: {
      label: 'Comments',
      type: 'textarea' as const,
      required: false
    }
  },
  businessEtiquette: {
    rating: {
      label: 'Can describe the business etiquette required for professional relationship management',
      type: 'rating' as const,
      min: 1,
      max: 4,
      required: true,
      labels: ratingLabels
    },
    comments: {
      label: 'Comments',
      type: 'textarea' as const,
      required: false
    }
  },

  // Marketing Competencies
  marketingConcepts: {
    rating: {
      label: 'Can explain the key concepts and principles of marketing and describe the different orientations companies adopt to the marketplace',
      type: 'rating' as const,
      min: 1,
      max: 4,
      required: true,
      labels: ratingLabels
    },
    comments: {
      label: 'Comments',
      type: 'textarea' as const,
      required: false
    }
  },
  marketAnalysis: {
    rating: {
      label: 'Can establish a framework for collecting and analysing market information and competitor intelligence data',
      type: 'rating' as const,
      min: 1,
      max: 4,
      required: true,
      labels: ratingLabels
    },
    comments: {
      label: 'Comments',
      type: 'textarea' as const,
      required: false
    }
  },
  marketSegmentation: {
    rating: {
      label: 'Knows how to target ideal market segments for company\'s products and services and position accordingly',
      type: 'rating' as const,
      min: 1,
      max: 4,
      required: true,
      labels: ratingLabels
    },
    comments: {
      label: 'Comments',
      type: 'textarea' as const,
      required: false
    }
  },
  productDevelopment: {
    rating: {
      label: 'Knows how to develop innovative products and product introduction strategies',
      type: 'rating' as const,
      min: 1,
      max: 4,
      required: true,
      labels: ratingLabels
    },
    comments: {
      label: 'Comments',
      type: 'textarea' as const,
      required: false
    }
  },
  marketingPlan: {
    rating: {
      label: 'Can write a coherent, well-organized marketing plan',
      type: 'rating' as const,
      min: 1,
      max: 4,
      required: true,
      labels: ratingLabels
    },
    comments: {
      label: 'Comments',
      type: 'textarea' as const,
      required: false
    }
  }
} as const;
