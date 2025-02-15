import { useCallback, useEffect } from 'react';
import { useSession } from '../context/SessionContext';
import { SessionStateType, SessionActivityType } from '../types/session';

interface UseSessionPersistenceProps {
  storageKey?: string;
  onSessionLoad?: (session: SessionStateType) => void;
  onSessionSave?: (session: SessionStateType) => void;
  onActivitySave?: (activity: SessionActivityType) => void;
}

export const useSessionPersistence = ({
  storageKey = 'form_session',
  onSessionLoad,
  onSessionSave,
  onActivitySave,
}: UseSessionPersistenceProps = {}) => {
  const { getCurrentSession, addActivity } = useSession();

  // Load session from storage
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(storageKey);
      if (savedSession) {
        const session = JSON.parse(savedSession) as SessionStateType;
        onSessionLoad?.(session);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      // Clear corrupted session data
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, onSessionLoad]);

  // Save session to storage
  const saveSession = useCallback(() => {
    try {
      const currentSession = getCurrentSession();
      localStorage.setItem(storageKey, JSON.stringify(currentSession));
      onSessionSave?.(currentSession);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, [getCurrentSession, storageKey, onSessionSave]);

  // Auto-save on activity
  const trackAndSaveActivity = useCallback(
    (activity: Omit<SessionActivityType, 'id' | 'timestamp'>) => {
      addActivity(activity);
      onActivitySave?.(activity as SessionActivityType);
      saveSession();
    },
    [addActivity, onActivitySave, saveSession]
  );

  // Save session before unload
  useEffect(() => {
    window.addEventListener('beforeunload', saveSession);
    return () => {
      window.removeEventListener('beforeunload', saveSession);
      saveSession(); // Save on unmount
    };
  }, [saveSession]);

  return {
    saveSession,
    trackAndSaveActivity,
  };
};
