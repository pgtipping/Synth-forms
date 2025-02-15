import React from 'react';
import { FormField } from './FormField';
import type { FormSectionType } from '../../types/form-schema';
import { cn } from '../../lib/utils';

interface FormSectionProps {
  section: FormSectionType;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  section,
  className,
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      {section.title && (
        <div className="border-b pb-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {section.title}
          </h3>
          {section.description && (
            <p className="mt-1 text-sm text-gray-500">
              {section.description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-6">
        {section.fields.map((field) => (
          <FormField key={field.id} field={field} />
        ))}
      </div>
    </div>
  );
};
