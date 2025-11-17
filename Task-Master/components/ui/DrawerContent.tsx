import React from 'react';
import { View, Text } from 'react-native';
import Dashboard from '../screens/Dashboard';
import Tasks from '../screens/Tasks';
import Reminders from '../screens/Reminders';
import {
  DashboardMetricsResponse,
  DashboardActivityResponse,
  DashboardAnalyticsResponse,
} from '@/types/dashboard.types';

/**
 * DrawerContent ties the drawer selection to the correct screen/component.
 * It keeps the dashboard state (metrics + activity feed) centralized in Home
 * and simply passes the already-fetched data down.
 */
interface DrawerContentProps {
  activeOption: string;
  dashboardMetrics?: DashboardMetricsResponse['metrics'] | null;
  activityFeed?: DashboardActivityResponse['activities'];
  analytics?: DashboardAnalyticsResponse['analytics'] | null;
  metricsLoading?: boolean;
  onRefreshDashboard?: () => Promise<void> | void;
}

export default function DrawerContent({
  activeOption,
  dashboardMetrics,
  analytics,
  activityFeed = [],
  metricsLoading = false,
  onRefreshDashboard,
}: DrawerContentProps) {
  switch (activeOption) {
    case 'dashboard':
      return (
        <Dashboard
          metrics={dashboardMetrics}
          analytics={analytics}
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
    case 'admin-users':
      return (
        <DrawerPlaceholder
          title="Admin · User Directory"
          description="Manage roles, reset access, and review membership approvals in the full web console."
        />
      );
    case 'admin-audit':
      return (
        <DrawerPlaceholder
          title="Admin · Audit Logs"
          description="Open the admin experience to review authentication attempts, permission changes, and escalations."
        />
      );
    case 'moderator-review':
      return (
        <DrawerPlaceholder
          title="Moderator · Content Review"
          description="Head to the moderation workspace to process flagged items and keep collaboration healthy."
        />
      );
    case 'moderator-moderation':
      return (
        <DrawerPlaceholder
          title="Moderator · Escalations"
          description="Track outstanding moderation tickets from the dedicated moderator dashboard."
        />
      );
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

const DrawerPlaceholder = ({ title, description }: { title: string; description: string }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' }}>{title}</Text>
    <Text style={{ color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>{description}</Text>
    <Text style={{ marginTop: 24, fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>
      Available on the desktop admin portal
    </Text>
  </View>
);
