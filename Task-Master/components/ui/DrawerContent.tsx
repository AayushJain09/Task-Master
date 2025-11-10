import React from 'react';
import Dashboard from '../screens/Dashboard';
import Tasks from '../screens/Tasks';
import Reminders from '../screens/Reminders';
import { DashboardMetricsResponse, DashboardActivityResponse } from '@/types/dashboard.types';

interface DrawerContentProps {
  activeOption: string;
  dashboardMetrics?: DashboardMetricsResponse['metrics'] | null;
  activityFeed?: DashboardActivityResponse['activities'];
  metricsLoading?: boolean;
  onRefreshDashboard?: () => Promise<void> | void;
}

export default function DrawerContent({
  activeOption,
  dashboardMetrics,
  activityFeed = [],
  metricsLoading = false,
  onRefreshDashboard,
}: DrawerContentProps) {
  switch (activeOption) {
    case 'dashboard':
      return (
        <Dashboard
          metrics={dashboardMetrics}
          activityFeed={activityFeed}
          loading={metricsLoading}
          onRefresh={onRefreshDashboard}
        />
      );
    case 'tasks':
      return (
        <Tasks
          taskStatistics={dashboardMetrics ? transformMetricsToTaskStats(dashboardMetrics) : null}
          statisticsLoading={metricsLoading}
          onRefreshStatistics={onRefreshDashboard}
        />
      );
    case 'reminders':
      return <Reminders />;
    default:
      return (
        <Dashboard
          metrics={dashboardMetrics}
          activityFeed={activityFeed}
          loading={metricsLoading}
          onRefresh={onRefreshDashboard}
        />
      );
  }
}

const transformMetricsToTaskStats = (metrics: DashboardMetricsResponse['metrics']) => ({
  todo: metrics.tasks.todo,
  in_progress: metrics.tasks.in_progress,
  done: metrics.tasks.done,
  total: metrics.tasks.total,
  overdue: metrics.overdue.active,
  completionRate: metrics.tasks.total > 0 ? Math.round((metrics.tasks.done / metrics.tasks.total) * 100) : 0,
  avgHours: 0,
  overdueBreakdown: {
    active: {
      total: metrics.overdue.active,
      todo: metrics.overdue.active,
      in_progress: 0,
    },
    resolved: {
      total: metrics.overdue.active,
      done: metrics.tasks.done,
    },
  },
  normalBreakdown: {
    total: metrics.tasks.total - metrics.overdue.active,
    todo: metrics.tasks.todo,
    in_progress: metrics.tasks.in_progress,
    done: metrics.tasks.done,
  },
});
