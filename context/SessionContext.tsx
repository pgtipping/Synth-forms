import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { SessionStateType, SessionActivityType, ActivityTypeEnum } from '../types/session';

interface SessionContextType {
  addActivity: (activity: Omit<SessionActivityType, 'id' | 'timestamp'>) => void;
  getActivities: () => SessionActivityType[];
  getCurrentSession: () => SessionStateType;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: React.ReactNode;
  initialState?: Partial<SessionStateType>;
  onActivityAdded?: (activity: SessionActivityType) => void;
  onSessionEnd?: (session: SessionStateType) => void;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
  initialState,
  onActivityAdded,
  onSessionEnd,
}) => {
  const sessionRef = useRef<SessionStateType>({
    id: crypto.randomUUID(),
    startTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    activities: [],
    ...initialState,
  });

  const addActivity = useCallback(
    (activity: Omit<SessionActivityType, 'id' | 'timestamp'>) => {
      const newActivity: SessionActivityType = {
        ...activity,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };

      sessionRef.current = {
        ...sessionRef.current,
        lastActivity: newActivity.timestamp,
        activities: [...sessionRef.current.activities, newActivity],
      };

      onActivityAdded?.(newActivity);
    },
    [onActivityAdded]
  );

  const getActivities = useCallback(() => {
    return sessionRef.current.activities;
  }, []);

  const getCurrentSession = useCallback(() => {
    return sessionRef.current;
  }, []);

  const clearSession = useCallback(() => {
    const oldSession = sessionRef.current;
    sessionRef.current = {
      id: crypto.randomUUID(),
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      activities: [],
      ...initialState,
    };
    onSessionEnd?.(oldSession);
  }, [initialState, onSessionEnd]);

  // Session timeout handling
  useEffect(() => {
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    let timeoutId: NodeJS.Timeout;

    const checkSessionTimeout = () => {
      const now = new Date();
      const lastActivity = new Date(sessionRef.current.lastActivity);
      if (now.getTime() - lastActivity.getTime() > SESSION_TIMEOUT) {
        clearSession();
      }
    };

    const setupTimeout = () => {
      timeoutId = setTimeout(checkSessionTimeout, SESSION_TIMEOUT);
    };

    setupTimeout();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [clearSession]);

  // Window unload handling
  useEffect(() => {
    const handleUnload = () => {
      onSessionEnd?.(sessionRef.current);
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [onSessionEnd]);

  return (
    <SessionContext.Provider
      value={{
        addActivity,
        getActivities,
        getCurrentSession,
        clearSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
