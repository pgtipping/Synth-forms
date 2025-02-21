import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { FormField } from '@/components/ui/form-field';
import {
  CustomerServiceCompetencyForm,
  formFields,
  ratingLabels
} from '@/app/forms/customer-service-competency-assessment/schema';

interface CustomerServiceCompetencyTemplateProps {
  register: UseFormRegister<CustomerServiceCompetencyForm>;
  errors: FieldErrors<CustomerServiceCompetencyForm>;
}

export function CustomerServiceCompetencyTemplate({
  register,
  errors
}: CustomerServiceCompetencyTemplateProps) {
  return (
    <div className="space-y-8">
      {/* Employee Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Employee Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={formFields.employeeId.label}
            error={errors.employeeId?.message}
            {...register('employeeId')}
          />
          <FormField
            label={formFields.employeeName.label}
            error={errors.employeeName?.message}
            {...register('employeeName')}
          />
          <FormField
            label={formFields.position.label}
            error={errors.position?.message}
            {...register('position')}
          />
          <FormField
            label={formFields.department.label}
            error={errors.department?.message}
            {...register('department')}
          />
          <FormField
            label={formFields.evaluationDate.label}
            type="date"
            error={errors.evaluationDate?.message}
            {...register('evaluationDate')}
          />
          <FormField
            label={formFields.evaluator.label}
            error={errors.evaluator?.message}
            {...register('evaluator')}
          />
        </div>
      </div>

      {/* Customer Service Competencies */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Customer Service Competencies</h2>
        <div className="space-y-6">
          {Object.entries({
            customerServiceManagement: formFields.customerServiceManagement,
            serviceFailureRecovery: formFields.serviceFailureRecovery,
            customerValueChain: formFields.customerValueChain,
            customerAnalytics: formFields.customerAnalytics,
            crossFunctionalSatisfaction: formFields.crossFunctionalSatisfaction,
            bestPractices: formFields.bestPractices,
            qualityServiceApplication: formFields.qualityServiceApplication,
            businessEtiquette: formFields.businessEtiquette
          }).map(([key, field]) => (
            <div key={key} className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8">
                  <FormField
                    label={field.rating.label}
                    type="rating"
                    error={errors[key as keyof CustomerServiceCompetencyForm]?.rating?.message}
                    min={field.rating.min}
                    max={field.rating.max}
                    labels={ratingLabels}
                    {...register(`${key}.rating` as any)}
                  />
                </div>
                <div className="lg:col-span-4">
                  <FormField
                    label={field.comments.label}
                    type="textarea"
                    error={errors[key as keyof CustomerServiceCompetencyForm]?.comments?.message}
                    {...register(`${key}.comments` as any)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Marketing Competencies */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Marketing Competencies</h2>
        <div className="space-y-6">
          {Object.entries({
            marketingConcepts: formFields.marketingConcepts,
            marketAnalysis: formFields.marketAnalysis,
            marketSegmentation: formFields.marketSegmentation,
            productDevelopment: formFields.productDevelopment,
            marketingPlan: formFields.marketingPlan
          }).map(([key, field]) => (
            <div key={key} className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8">
                  <FormField
                    label={field.rating.label}
                    type="rating"
                    error={errors[key as keyof CustomerServiceCompetencyForm]?.rating?.message}
                    min={field.rating.min}
                    max={field.rating.max}
                    labels={ratingLabels}
                    {...register(`${key}.rating` as any)}
                  />
                </div>
                <div className="lg:col-span-4">
                  <FormField
                    label={field.comments.label}
                    type="textarea"
                    error={errors[key as keyof CustomerServiceCompetencyForm]?.comments?.message}
                    {...register(`${key}.comments` as any)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          .bg-gray-50 {
            background-color: transparent !important;
            border: 1px solid #e5e7eb;
          }
          
          textarea {
            border: 1px solid #e5e7eb !important;
          }
          
          input[type="date"] {
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// Export for use in other components
export default CustomerServiceCompetencyTemplate;
