import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSchema, FormSchemaType } from '../../types/form-schema';
import { FormField } from './FormField';
import { useFormActivity } from '../../hooks/useFormActivity';

interface FormRendererProps {
  formTemplate: FormSchemaType;
  onSubmit: (data: any) => void;
  className?: string;
  userId?: string;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  formTemplate,
  onSubmit,
  className,
  userId,
}) => {
  const methods = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: formTemplate.sections.reduce((acc, section) => {
      section.fields.forEach((field) => {
        if (field.defaultValue !== undefined) {
          acc[field.name] = field.defaultValue;
        }
      });
      return acc;
    }, {} as Record<string, any>),
  });

  const {
    trackFieldChange,
    trackFormSubmit,
    trackValidationError,
    trackActivity,
  } = useFormActivity({
    formId: formTemplate.id,
    userId,
  });

  // Track form view on mount
  useEffect(() => {
    trackActivity('FORM_VIEW', {
      formTitle: formTemplate.title,
      formVersion: formTemplate.version,
    });
  }, [trackActivity, formTemplate.title, formTemplate.version]);

  // Track field changes
  useEffect(() => {
    const subscription = methods.watch((value, { name, type }) => {
      if (name && type === 'change') {
        const field = formTemplate.sections
          .flatMap((section) => section.fields)
          .find((f) => f.name === name);
        
        if (field) {
          trackFieldChange(field.id, value[name]);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [methods, trackFieldChange, formTemplate.sections]);

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data);
      trackFormSubmit(data, 'success');
    } catch (error) {
      if (error instanceof Error) {
        trackFormSubmit(data, 'error', error.message);
      }
    }
  };

  // Track validation errors
  useEffect(() => {
    const subscription = methods.formState.errors;
    Object.entries(subscription).forEach(([fieldName, error]) => {
      const field = formTemplate.sections
        .flatMap((section) => section.fields)
        .find((f) => f.name === fieldName);
      
      if (field && error?.message) {
        trackValidationError(field.id, error.message as string);
      }
    });
  }, [methods.formState.errors, trackValidationError, formTemplate.sections]);

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleSubmit)}
        className={`space-y-8 ${className || ''}`}
      >
        {/* Branding Section */}
        {formTemplate.branding && (
          <div className="form-branding">
            {formTemplate.branding.logo && (
              <img
                src={formTemplate.branding.logo}
                alt={`${formTemplate.branding.companyName || 'Company'} logo`}
                className="h-12 mb-4"
              />
            )}
            {formTemplate.branding.companyName && (
              <h2 className="text-xl font-semibold text-gray-900">
                {formTemplate.branding.companyName}
              </h2>
            )}
          </div>
        )}

        {/* Form Title */}
        <div className="form-header">
          <h1 className="text-2xl font-bold text-gray-900">
            {formTemplate.title}
          </h1>
          {formTemplate.description && (
            <p className="mt-2 text-gray-600">{formTemplate.description}</p>
          )}
        </div>

        {/* Form Sections */}
        {formTemplate.sections.map((section) => (
          <div
            key={section.id}
            className="form-section bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {section.title}
            </h3>
            {section.description && (
              <p className="text-gray-600 mb-6">{section.description}</p>
            )}
            <div className="space-y-6">
              {section.fields.map((field) => (
                <FormField key={field.id} field={field} />
              ))}
            </div>
          </div>
        ))}

        {/* Form Actions */}
        <div className="form-actions flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              methods.reset();
              trackActivity('FORM_EDIT', { action: 'reset' });
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Submit
          </button>
        </div>
      </form>
    </FormProvider>
  );
};
