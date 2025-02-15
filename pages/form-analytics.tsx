import React from 'react';
import { SessionProvider } from '../context/SessionContext';
import { SessionAnalytics } from '../components/analytics/SessionAnalytics';
import { useSessionPersistence } from '../hooks/useSessionPersistence';

export default function FormAnalyticsPage() {
  const { saveSession } = useSessionPersistence({
    onSessionLoad: (session) => {
      console.log('Session loaded:', session);
    },
    onSessionSave: (session) => {
      console.log('Session saved:', session);
    },
    onActivitySave: (activity) => {
      console.log('Activity saved:', activity);
    },
  });

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Form Analytics
              </h1>
              <button
                onClick={saveSession}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Save Session
              </button>
            </div>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <SessionAnalytics />
            </div>
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              Session data is automatically saved and can be restored when you return.
            </p>
          </div>
        </footer>
      </div>
    </SessionProvider>
  );
}
