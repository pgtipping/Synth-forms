import { useState, useCallback } from 'react';
import { FormSchemaType } from '../types/form-schema';

interface UseFormTemplateProps {
  onSubmit?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useFormTemplate = ({ onSubmit, onError }: UseFormTemplateProps = {}) => {
  const [formTemplate, setFormTemplate] = useState<FormSchemaType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const convertToFormTemplate = useCallback(async (uploadedFile: File): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      // Send to inference service
      const response = await fetch('/api/convert-template', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to convert template');
      }

      const data = await response.json();
      
      // Transform the inference service response into our form schema
      const template: FormSchemaType = {
        id: data.id || crypto.randomUUID(),
        title: data.title || uploadedFile.name,
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        sections: data.sections.map((section: any) => ({
          id: section.id || crypto.randomUUID(),
          title: section.title,
          description: section.description,
          fields: section.fields.map((field: any) => ({
            id: field.id || crypto.randomUUID(),
            type: field.type,
            label: field.label,
            name: field.name,
            placeholder: field.placeholder,
            validation: field.validation,
            ...field,
          })),
        })),
      };

      setFormTemplate(template);
      onSubmit?.(template);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [onSubmit, onError]);

  const updateFormTemplate = useCallback((updates: Partial<FormSchemaType>) => {
    setFormTemplate((current) => {
      if (!current) return null;
      return {
        ...current,
        ...updates,
        modified: new Date().toISOString(),
      };
    });
  }, []);

  return {
    formTemplate,
    loading,
    error,
    convertToFormTemplate,
    updateFormTemplate,
  };
};
