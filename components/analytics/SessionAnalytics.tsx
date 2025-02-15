import React, { useMemo } from 'react';
import { useSession } from '../../context/SessionContext';
import { analyzeSession } from '../../utils/sessionAnalytics';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, className }) => {
  const percentage = (value / max) * 100;
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
      <div
        className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  trend,
}) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <div className="mt-2 flex items-baseline">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {trend && (
        <span
          className={`ml-2 text-sm font-medium ${
            trend.value >= 0
              ? 'text-green-600'
              : 'text-red-600'
          }`}
        >
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          <span className="sr-only">{trend.label}</span>
        </span>
      )}
    </div>
    {description && (
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    )}
  </div>
);

interface SessionAnalyticsProps {
  className?: string;
}

export const SessionAnalytics: React.FC<SessionAnalyticsProps> = ({ className }) => {
  const { getCurrentSession } = useSession();
  const session = getCurrentSession();
  const analytics = useMemo(() => analyzeSession(session), [session]);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return hours > 0
      ? `${hours}h ${minutes % 60}m`
      : `${minutes}m ${seconds % 60}s`;
  };

  const getErrorRate = () => {
    const totalFields = analytics.fields.length;
    return totalFields > 0
      ? (analytics.errorCount / totalFields) * 100
      : 0;
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Overview Section */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Completion Rate"
          value={`${(analytics.completionRate * 100).toFixed(1)}%`}
          description="Overall form completion"
        />
        <MetricCard
          title="Time Spent"
          value={formatDuration(analytics.totalTime)}
          description="Total session duration"
        />
        <MetricCard
          title="Error Rate"
          value={`${getErrorRate().toFixed(1)}%`}
          description="Fields with validation errors"
        />
        <MetricCard
          title="Submission Attempts"
          value={analytics.submissionCount}
          description={`Last status: ${analytics.lastSubmissionStatus || 'Not submitted'}`}
        />
      </div>

      {/* Section Analysis */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Section Completion
        </h3>
        <div className="space-y-4">
          {analytics.sections.map((section) => (
            <div key={section.sectionId} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {section.sectionId}
                </span>
                <span className="text-sm text-gray-500">
                  {(section.completionRate * 100).toFixed(1)}%
                </span>
              </div>
              <ProgressBar
                value={section.completionRate * 100}
                max={100}
                className="mb-4"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Time: {formatDuration(section.timeSpent)}</span>
                <span>Errors: {section.errorCount}</span>
                <span>Fields: {section.fieldCount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Field Analysis */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Field Interactions
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Field
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Changes
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Errors
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.fields.map((field) => (
                <tr key={field.fieldId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {field.fieldId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {field.changeCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {field.errorCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        field.lastValue
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {field.lastValue ? 'Completed' : 'Empty'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
