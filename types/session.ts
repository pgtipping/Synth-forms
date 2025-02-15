import { z } from 'zod';

export const ActivityType = z.enum([
  // Form Interaction Activities
  'FORM_VIEW',
  'FORM_EDIT',
  'FIELD_CHANGE',
  'SECTION_CHANGE',
  'FORM_SAVE',
  'FORM_SUBMIT',
  'FORM_ERROR',
  
  // Template Management Activities
  'TEMPLATE_CREATE',
  'TEMPLATE_UPDATE',
  'TEMPLATE_DELETE',
  'TEMPLATE_DUPLICATE',
  'TEMPLATE_PREVIEW',
  'TEMPLATE_EXPORT',
  'TEMPLATE_IMPORT',
  
  // File Activities
  'FILE_UPLOAD',
  'FILE_DELETE',
  'FILE_DOWNLOAD',
  'FILE_CONVERT',
  
  // Validation Activities
  'VALIDATION_ERROR',
  'API_ERROR',
  
  // App Usage Activities
  'APP_LOGIN',
  'APP_LOGOUT',
  'APP_ERROR',
  'APP_NAVIGATION',
  'APP_SEARCH',
  'APP_FILTER',
  'APP_SORT',
  
  // Form Customization Activities
  'FORM_CUSTOMIZE_THEME',
  'FORM_CUSTOMIZE_LAYOUT',
  'FORM_CUSTOMIZE_BRANDING',
  'FORM_CUSTOMIZE_VALIDATION',
  'FORM_CUSTOMIZE_WORKFLOW',
  
  // Analytics Activities
  'ANALYTICS_VIEW',
  'ANALYTICS_EXPORT',
  'ANALYTICS_FILTER',
  
  // Integration Activities
  'INTEGRATION_CONNECT',
  'INTEGRATION_DISCONNECT',
  'INTEGRATION_SYNC',
  'INTEGRATION_ERROR',
]);

export type ActivityTypeEnum = z.infer<typeof ActivityType>;

// Enhanced activity details for app usage
export const AppUsageDetails = z.object({
  page: z.string().optional(),
  component: z.string().optional(),
  action: z.string().optional(),
  duration: z.number().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Enhanced activity details for form customization
export const FormCustomizationDetails = z.object({
  templateId: z.string(),
  customizationType: z.enum([
    'theme',
    'layout',
    'branding',
    'validation',
    'workflow'
  ]),
  changes: z.record(z.string(), z.any()),
  previousVersion: z.string().optional(),
  newVersion: z.string().optional(),
});

// Enhanced activity details for analytics
export const AnalyticsDetails = z.object({
  reportType: z.string(),
  filters: z.record(z.string(), z.any()).optional(),
  exportFormat: z.string().optional(),
  timeRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
});

export const SessionActivity = z.object({
  id: z.string(),
  type: ActivityType,
  timestamp: z.string(),
  userId: z.string().optional(),
  formId: z.string().optional(),
  sectionId: z.string().optional(),
  fieldId: z.string().optional(),
  details: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  duration: z.number().optional(),
  status: z.enum(['success', 'warning', 'error']).optional(),
  errorMessage: z.string().optional(),
  // New fields for enhanced tracking
  appVersion: z.string().optional(),
  userAgent: z.string().optional(),
  platform: z.string().optional(),
  sessionId: z.string().optional(),
  ipAddress: z.string().optional(),
});

export type SessionActivityType = z.infer<typeof SessionActivity>;

export const SessionState = z.object({
  id: z.string(),
  startTime: z.string(),
  lastActivity: z.string(),
  activities: z.array(SessionActivity),
  formId: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  // New fields for app usage tracking
  totalSessions: z.number().optional(),
  totalForms: z.number().optional(),
  totalTemplates: z.number().optional(),
  totalDownloads: z.number().optional(),
  totalCustomizations: z.number().optional(),
  activeTime: z.number().optional(), // in milliseconds
  lastLogin: z.string().optional(),
  preferredTheme: z.string().optional(),
  recentTemplates: z.array(z.string()).optional(),
  recentForms: z.array(z.string()).optional(),
});
