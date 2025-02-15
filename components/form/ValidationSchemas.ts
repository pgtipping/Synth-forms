import { z } from 'zod';

export const employeeOnboardingSchema = z.object({
  companyName: z.string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters'),
  
  companyLogo: z
    .any()
    .refine((file) => {
      if (!file || !file[0]) return true;
      return ['image/jpeg', 'image/png'].includes(file[0].type);
    }, 'Only JPEG and PNG files are allowed')
    .refine((file) => {
      if (!file || !file[0]) return true;
      return file[0].size <= 5000000;
    }, 'File size must be less than 5MB')
    .optional(),
  
  employeeName: z.string()
    .min(1, 'Employee name is required')
    .max(100, 'Employee name must be less than 100 characters')
    .regex(/^[a-zA-Z\s-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  position: z.string()
    .min(1, 'Position is required')
    .max(100, 'Position must be less than 100 characters'),
  
  department: z.string()
    .min(1, 'Department is required')
    .max(100, 'Department must be less than 100 characters'),
  
  startDate: z.string()
    .min(1, 'Start date is required')
    .refine((date) => {
      const today = new Date();
      const selectedDate = new Date(date);
      return selectedDate >= today;
    }, 'Start date must be today or in the future'),
  
  manager: z.string()
    .min(1, 'Manager name is required')
    .max(100, 'Manager name must be less than 100 characters')
    .regex(/^[a-zA-Z\s-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  workLocation: z.string()
    .min(1, 'Work location is required')
    .max(200, 'Work location must be less than 200 characters'),
  
  equipmentNeeds: z.string()
    .min(1, 'Equipment needs are required')
    .max(1000, 'Equipment needs must be less than 1000 characters'),
  
  trainingRequirements: z.string()
    .min(1, 'Training requirements are required')
    .max(1000, 'Training requirements must be less than 1000 characters'),
  
  accessRequests: z.string()
    .min(1, 'Access requests are required')
    .max(1000, 'Access requests must be less than 1000 characters'),
  
  emergencyContact: z.object({
    name: z.string()
      .min(1, 'Emergency contact name is required')
      .max(100, 'Name must be less than 100 characters'),
    relationship: z.string()
      .min(1, 'Relationship is required')
      .max(50, 'Relationship must be less than 50 characters'),
    phone: z.string()
      .min(1, 'Phone number is required')
      .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format'),
    email: z.string()
      .email('Invalid email address')
      .optional(),
  }),
  
  specialInstructions: z.string()
    .max(2000, 'Special instructions must be less than 2000 characters')
    .optional(),
});

export type EmployeeOnboardingForm = z.infer<typeof employeeOnboardingSchema>;
