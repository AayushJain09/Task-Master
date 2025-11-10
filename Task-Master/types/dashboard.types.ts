/**
 * Response payload for /dashboard/metrics endpoint.
 * Mirrors the backend structure so UI components can rely on typed data.
 */
export interface DashboardMetricsResponse {
  userContext: {
    userId: string;
    role: string;
  };
  metrics: {
    tasks: {
      total: number;
      todo: number;
      in_progress: number;
      done: number;
    };
    overdue: {
      active: number;
      upcoming: number;
    };
    weekly: {
      created: number;
      completed: number;
    };
    priority: {
      high: number;
      medium: number;
      low: number;
    };
    trends: {
      completedLast7Days: Array<{
        date: string;
        count: number;
      }>;
    };
    activitySummary: null | {
      lastAction: string;
      description: string;
      occurredAt: string;
    };
  };
}

/**
 * Individual entry in the recent activity feed.
 */
export interface ActivityLogEntry {
  _id: string;
  action: string;
  description: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  performedBy?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdAt: string;
}

/**
 * Deep analytics payload powering graphs/insights.
 */
export interface DashboardAnalyticsResponse {
  userContext: {
    userId: string;
    role: string;
  };
  analytics: {
    summary: {
      totalTasks: number;
      openTasks: number;
      completedTasks: number;
      overdueTasks: number;
      upcomingTasks: number;
    };
    statusDistribution: Record<string, number>;
    priorityDistribution: Record<string, number>;
    weeklyProgress: Array<{
      date: string;
      label: string;
      created: number;
      completed: number;
    }>;
    velocityTrend: Array<{
      week: number;
      year: number;
      completed: number;
    }>;
    cycleTime: {
      averageDays: number;
      fastestDays: number;
      slowestDays: number;
    };
  };
}

export interface DashboardActivityResponse {
  userContext: {
    userId: string;
    role: string;
  };
  activities: ActivityLogEntry[];
  pagination: {
    limit: number;
    returned: number;
  };
}
