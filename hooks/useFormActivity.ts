import { useCallback } from 'react';
import { useSession } from '../context/SessionContext';
import { ActivityTypeEnum } from '../types/session';

interface UseFormActivityProps {
  formId: string;
  userId?: string;
}

export const useFormActivity = ({ formId, userId }: UseFormActivityProps) => {
  const { addActivity } = useSession();

  const trackFieldChange = useCallback(
    (fieldId: string, value: any, sectionId?: string) => {
      addActivity({
        type: 'FIELD_CHANGE',
        formId,
        userId,
        fieldId,
        sectionId,
        details: {
          value,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [addActivity, formId, userId]
  );

  const trackSectionChange = useCallback(
    (sectionId: string, action: 'enter' | 'leave') => {
      addActivity({
        type: 'SECTION_CHANGE',
        formId,
        userId,
        sectionId,
        details: {
          action,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [addActivity, formId, userId]
  );

  const trackFormSubmit = useCallback(
    (formData: any, status: 'success' | 'error' = 'success', error?: string) => {
      addActivity({
        type: 'FORM_SUBMIT',
        formId,
        userId,
        status,
        errorMessage: error,
        details: {
          formData,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [addActivity, formId, userId]
  );

  const trackFormSave = useCallback(
    (formData: any, status: 'success' | 'error' = 'success', error?: string) => {
      addActivity({
        type: 'FORM_SAVE',
        formId,
        userId,
        status,
        errorMessage: error,
        details: {
          formData,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [addActivity, formId, userId]
  );

  const trackValidationError = useCallback(
    (fieldId: string, error: string, sectionId?: string) => {
      addActivity({
        type: 'VALIDATION_ERROR',
        formId,
        userId,
        fieldId,
        sectionId,
        status: 'error',
        errorMessage: error,
        details: {
          timestamp: new Date().toISOString(),
        },
      });
    },
    [addActivity, formId, userId]
  );

  const trackFileUpload = useCallback(
    (
      fieldId: string,
      file: File,
      status: 'success' | 'error' = 'success',
      error?: string
    ) => {
      addActivity({
        type: 'FILE_UPLOAD',
        formId,
        userId,
        fieldId,
        status,
        errorMessage: error,
        details: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [addActivity, formId, userId]
  );

  const trackApiError = useCallback(
    (error: Error, endpoint: string) => {
      addActivity({
        type: 'API_ERROR',
        formId,
        userId,
        status: 'error',
        errorMessage: error.message,
        details: {
          endpoint,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [addActivity, formId, userId]
  );

  const trackActivity = useCallback(
    (
      type: ActivityTypeEnum,
      details?: Record<string, any>,
      status?: 'success' | 'warning' | 'error',
      error?: string
    ) => {
      addActivity({
        type,
        formId,
        userId,
        status,
        errorMessage: error,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [addActivity, formId, userId]
  );

  return {
    trackFieldChange,
    trackSectionChange,
    trackFormSubmit,
    trackFormSave,
    trackValidationError,
    trackFileUpload,
    trackApiError,
    trackActivity,
  };
};
