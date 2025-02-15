import { useCallback, useEffect, useRef } from 'react';
import { useSession } from '../context/SessionContext';
import { ActivityTypeEnum, AppUsageDetails } from '../types/session';

interface UseAppUsageProps {
  userId?: string;
  onUsageUpdate?: (usage: any) => void;
}

export const useAppUsage = ({ userId, onUsageUpdate }: UseAppUsageProps = {}) => {
  const { addActivity, getCurrentSession } = useSession();
  const lastActivityTime = useRef<number>(Date.now());
  const activeTimeRef = useRef<number>(0);

  // Track active time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const idleThreshold = 5 * 60 * 1000; // 5 minutes
      if (now - lastActivityTime.current < idleThreshold) {
        activeTimeRef.current += now - lastActivityTime.current;
      }
      lastActivityTime.current = now;
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const trackAppUsage = useCallback(
    (
      type: ActivityTypeEnum,
      details: Partial<typeof AppUsageDetails._type>
    ) => {
      const session = getCurrentSession();
      const now = new Date();

      addActivity({
        type,
        userId,
        details: {
          ...details,
          timestamp: now.toISOString(),
          activeTime: activeTimeRef.current,
        },
        metadata: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });

      // Update usage statistics
      const usage = {
        totalSessions: (session.totalSessions || 0) + 1,
        totalForms: session.totalForms || 0,
        totalTemplates: session.totalTemplates || 0,
        totalDownloads: session.totalDownloads || 0,
        totalCustomizations: session.totalCustomizations || 0,
        activeTime: activeTimeRef.current,
        lastActivity: now.toISOString(),
      };

      onUsageUpdate?.(usage);
    },
    [addActivity, getCurrentSession, userId, onUsageUpdate]
  );

  const trackNavigation = useCallback(
    (page: string, component?: string) => {
      trackAppUsage('APP_NAVIGATION', { page, component });
    },
    [trackAppUsage]
  );

  const trackSearch = useCallback(
    (query: string, filters?: Record<string, any>) => {
      trackAppUsage('APP_SEARCH', { query, filters });
    },
    [trackAppUsage]
  );

  const trackDownload = useCallback(
    (fileId: string, fileType: string) => {
      const session = getCurrentSession();
      trackAppUsage('FILE_DOWNLOAD', {
        fileId,
        fileType,
        totalDownloads: (session.totalDownloads || 0) + 1,
      });
    },
    [trackAppUsage, getCurrentSession]
  );

  const trackCustomization = useCallback(
    (templateId: string, customizationType: string, changes: Record<string, any>) => {
      const session = getCurrentSession();
      trackAppUsage(`FORM_CUSTOMIZE_${customizationType.toUpperCase()}` as ActivityTypeEnum, {
        templateId,
        changes,
        totalCustomizations: (session.totalCustomizations || 0) + 1,
      });
    },
    [trackAppUsage, getCurrentSession]
  );

  const trackTemplateAction = useCallback(
    (action: 'create' | 'update' | 'delete' | 'duplicate' | 'preview' | 'export' | 'import',
     templateId: string,
     details?: Record<string, any>) => {
      const session = getCurrentSession();
      trackAppUsage(`TEMPLATE_${action.toUpperCase()}` as ActivityTypeEnum, {
        templateId,
        ...details,
        totalTemplates: action === 'create' ? (session.totalTemplates || 0) + 1 : session.totalTemplates,
      });
    },
    [trackAppUsage, getCurrentSession]
  );

  const trackAnalytics = useCallback(
    (action: 'view' | 'export' | 'filter',
     reportType: string,
     details?: Record<string, any>) => {
      trackAppUsage(`ANALYTICS_${action.toUpperCase()}` as ActivityTypeEnum, {
        reportType,
        ...details,
      });
    },
    [trackAppUsage]
  );

  const getUsageStats = useCallback(() => {
    const session = getCurrentSession();
    return {
      totalSessions: session.totalSessions || 0,
      totalForms: session.totalForms || 0,
      totalTemplates: session.totalTemplates || 0,
      totalDownloads: session.totalDownloads || 0,
      totalCustomizations: session.totalCustomizations || 0,
      activeTime: activeTimeRef.current,
      lastLogin: session.lastLogin,
      recentTemplates: session.recentTemplates || [],
      recentForms: session.recentForms || [],
    };
  }, [getCurrentSession]);

  return {
    trackNavigation,
    trackSearch,
    trackDownload,
    trackCustomization,
    trackTemplateAction,
    trackAnalytics,
    getUsageStats,
  };
};
