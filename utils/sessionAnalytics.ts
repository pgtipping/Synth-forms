import { SessionStateType, SessionActivityType } from '../types/session';

interface FieldAnalytics {
  fieldId: string;
  changeCount: number;
  errorCount: number;
  timeSpent: number; // in milliseconds
  lastValue: any;
}

interface SectionAnalytics {
  sectionId: string;
  timeSpent: number; // in milliseconds
  fieldCount: number;
  errorCount: number;
  completionRate: number;
}

interface FormAnalytics {
  formId: string;
  startTime: string;
  endTime: string;
  totalTime: number; // in milliseconds
  sections: SectionAnalytics[];
  fields: FieldAnalytics[];
  errorCount: number;
  submissionCount: number;
  lastSubmissionStatus: 'success' | 'error' | undefined;
  completionRate: number;
}

export const analyzeSession = (session: SessionStateType): FormAnalytics => {
  const activities = session.activities;
  const formId = session.formId || '';
  
  // Initialize analytics
  const fieldsMap = new Map<string, FieldAnalytics>();
  const sectionsMap = new Map<string, SectionAnalytics>();
  let errorCount = 0;
  let submissionCount = 0;
  let lastSubmissionStatus: 'success' | 'error' | undefined;

  // Track section time
  const sectionTimeTracker = new Map<string, { enterTime: number }>();

  // Process activities
  activities.forEach((activity, index) => {
    switch (activity.type) {
      case 'FIELD_CHANGE':
        if (activity.fieldId) {
          const field = fieldsMap.get(activity.fieldId) || {
            fieldId: activity.fieldId,
            changeCount: 0,
            errorCount: 0,
            timeSpent: 0,
            lastValue: undefined,
          };
          field.changeCount++;
          field.lastValue = activity.details?.value;
          fieldsMap.set(activity.fieldId, field);
        }
        break;

      case 'VALIDATION_ERROR':
        errorCount++;
        if (activity.fieldId) {
          const field = fieldsMap.get(activity.fieldId) || {
            fieldId: activity.fieldId,
            changeCount: 0,
            errorCount: 0,
            timeSpent: 0,
            lastValue: undefined,
          };
          field.errorCount++;
          fieldsMap.set(activity.fieldId, field);
        }
        if (activity.sectionId) {
          const section = sectionsMap.get(activity.sectionId) || {
            sectionId: activity.sectionId,
            timeSpent: 0,
            fieldCount: 0,
            errorCount: 0,
            completionRate: 0,
          };
          section.errorCount++;
          sectionsMap.set(activity.sectionId, section);
        }
        break;

      case 'SECTION_CHANGE':
        if (activity.sectionId && activity.details?.action) {
          if (activity.details.action === 'enter') {
            sectionTimeTracker.set(activity.sectionId, {
              enterTime: new Date(activity.timestamp).getTime(),
            });
          } else if (activity.details.action === 'leave') {
            const tracker = sectionTimeTracker.get(activity.sectionId);
            if (tracker) {
              const timeSpent = new Date(activity.timestamp).getTime() - tracker.enterTime;
              const section = sectionsMap.get(activity.sectionId) || {
                sectionId: activity.sectionId,
                timeSpent: 0,
                fieldCount: 0,
                errorCount: 0,
                completionRate: 0,
              };
              section.timeSpent += timeSpent;
              sectionsMap.set(activity.sectionId, section);
            }
          }
        }
        break;

      case 'FORM_SUBMIT':
        submissionCount++;
        lastSubmissionStatus = activity.status as 'success' | 'error' | undefined;
        break;
    }
  });

  // Calculate completion rates
  const totalFields = fieldsMap.size;
  const completedFields = Array.from(fieldsMap.values()).filter(
    (field) => field.lastValue !== undefined && field.lastValue !== ''
  ).length;

  const completionRate = totalFields > 0 ? completedFields / totalFields : 0;

  // Calculate section completion rates
  sectionsMap.forEach((section) => {
    const sectionFields = Array.from(fieldsMap.values()).filter(
      (field) => activities.some(
        (activity) =>
          activity.fieldId === field.fieldId &&
          activity.sectionId === section.sectionId
      )
    );
    section.fieldCount = sectionFields.length;
    const completedSectionFields = sectionFields.filter(
      (field) => field.lastValue !== undefined && field.lastValue !== ''
    ).length;
    section.completionRate =
      section.fieldCount > 0 ? completedSectionFields / section.fieldCount : 0;
  });

  return {
    formId,
    startTime: session.startTime,
    endTime: session.lastActivity,
    totalTime: new Date(session.lastActivity).getTime() - new Date(session.startTime).getTime(),
    sections: Array.from(sectionsMap.values()),
    fields: Array.from(fieldsMap.values()),
    errorCount,
    submissionCount,
    lastSubmissionStatus,
    completionRate,
  };
};

export const generateSessionReport = (analytics: FormAnalytics): string => {
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  };

  return `
Form Session Report
==================

Form ID: ${analytics.formId}
Duration: ${formatDuration(analytics.totalTime)}
Completion Rate: ${(analytics.completionRate * 100).toFixed(1)}%
Error Count: ${analytics.errorCount}
Submission Attempts: ${analytics.submissionCount}
Final Status: ${analytics.lastSubmissionStatus || 'Not submitted'}

Section Analysis
---------------
${analytics.sections
  .map(
    (section) => `
${section.sectionId}:
- Time Spent: ${formatDuration(section.timeSpent)}
- Fields: ${section.fieldCount}
- Errors: ${section.errorCount}
- Completion: ${(section.completionRate * 100).toFixed(1)}%
`
  )
  .join('\n')}

Field Analysis
-------------
${analytics.fields
  .map(
    (field) => `
${field.fieldId}:
- Changes: ${field.changeCount}
- Errors: ${field.errorCount}
- Final Value: ${field.lastValue}
`
  )
  .join('\n')}
`;
};
