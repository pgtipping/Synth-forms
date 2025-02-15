import React, { useMemo } from 'react';
import { useAppUsage } from '../../hooks/useAppUsage';
import { useSession } from '../../context/SessionContext';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        {icon && (
          <div className="flex-shrink-0">
            <div className="h-10 w-10 text-primary-600">{icon}</div>
          </div>
        )}
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
              {change !== undefined && (
                <div
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

interface TimelineItemProps {
  title: string;
  timestamp: string;
  description?: string;
  status?: 'success' | 'warning' | 'error';
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  title,
  timestamp,
  description,
  status = 'success',
}) => (
  <li>
    <div className="relative pb-8">
      <div className="relative flex items-start space-x-3">
        <div>
          <div
            className={`relative px-1 ${
              status === 'success'
                ? 'bg-green-500'
                : status === 'warning'
                ? 'bg-yellow-500'
                : 'bg-red-500'
            } h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white`}
          >
            <span className="text-white text-lg">•</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div>
            <div className="text-sm">
              <span className="font-medium text-gray-900">{title}</span>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">{timestamp}</p>
            {description && (
              <p className="mt-2 text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  </li>
);

export const AppUsageAnalytics: React.FC = () => {
  const { getUsageStats } = useAppUsage();
  const { getCurrentSession } = useSession();
  const session = getCurrentSession();

  const formatDuration = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const recentActivities = useMemo(() => {
    return session.activities
      .slice(-10)
      .reverse()
      .map((activity) => ({
        title: activity.type,
        timestamp: new Date(activity.timestamp).toLocaleString(),
        description: activity.details?.description,
        status: activity.status || 'success',
      }));
  }, [session.activities]);

  const stats = getUsageStats();

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Forms"
          value={stats.totalForms}
          icon={<span>📝</span>}
        />
        <StatCard
          title="Total Templates"
          value={stats.totalTemplates}
          icon={<span>📋</span>}
        />
        <StatCard
          title="Total Downloads"
          value={stats.totalDownloads}
          icon={<span>⬇️</span>}
        />
        <StatCard
          title="Total Customizations"
          value={stats.totalCustomizations}
          icon={<span>🎨</span>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Time Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Usage Time</h3>
          <div className="mt-4">
            <div className="flex justify-between items-baseline">
              <p className="text-4xl font-semibold text-gray-900">
                {formatDuration(stats.activeTime)}
              </p>
              <p className="text-sm text-gray-500">Active time this session</p>
            </div>
          </div>
        </div>

        {/* Recent Templates */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Templates
          </h3>
          <ul className="mt-4 divide-y divide-gray-200">
            {stats.recentTemplates.map((template, index) => (
              <li key={template} className="py-3">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {template}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Recent Activity
        </h3>
        <div className="flow-root">
          <ul className="-mb-8">
            {recentActivities.map((activity, index) => (
              <TimelineItem key={index} {...activity} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
