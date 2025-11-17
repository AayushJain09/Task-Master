import { apiService } from './api.service';
import {
  DashboardMetricsResponse,
  DashboardActivityResponse,
  DashboardAnalyticsResponse,
} from '@/types/dashboard.types';
import { resolveTimezone as resolveClientTimezone } from '@/utils/timezone';

class DashboardService {
  private baseEndpoint = '/dashboard';

  /**
   * Fetches the aggregated metrics dataset (task breakdowns, weekly stats, velocity summary).
   */
  async getMetrics(): Promise<DashboardMetricsResponse> {
    const timezone = resolveClientTimezone();
    const response = await apiService.get<DashboardMetricsResponse>(
      `${this.baseEndpoint}/metrics?timezone=${encodeURIComponent(timezone)}`
    );
    return response;
  }

  /**
   * Deeper analytics feed (weekly progress, cycle time, velocity trend) used for charts.
   */
  async getAnalytics(): Promise<DashboardAnalyticsResponse> {
    const timezone = resolveClientTimezone();
    const response = await apiService.get<DashboardAnalyticsResponse>(
      `${this.baseEndpoint}/analytics?timezone=${encodeURIComponent(timezone)}`
    );
    return response;
  }

  /**
   * Retrieves the recent activity feed scoped to the authenticated user.
   * @param params Optional paging/filtering options.
   */
  async getRecentActivity(params?: { limit?: number; actions?: string[] }): Promise<DashboardActivityResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.actions?.length) searchParams.set('actions', params.actions.join(','));

    const response = await apiService.get<DashboardActivityResponse>(
      `${this.baseEndpoint}/activity?${searchParams.toString()}`
    );
    return response;
  }
}

export const dashboardService = new DashboardService();
