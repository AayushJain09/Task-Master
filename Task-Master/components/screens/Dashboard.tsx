import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import {
  CheckSquare,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  BarChart3,
  AlertTriangle,
  ListChecks,
  MapPin,
  Activity as ActivityIcon,
} from 'lucide-react-native';
import Card from '../ui/Card';
import {
  DashboardMetricsResponse,
  ActivityLogEntry,
  DashboardAnalyticsResponse,
} from '@/types/dashboard.types';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Props consumed by the dashboard screen. All heavy data lifting happens upstream
 * so this component can stay purely presentational.
 */
interface DashboardProps {
  metrics?: DashboardMetricsResponse['metrics'] | null;
  analytics?: DashboardAnalyticsResponse['analytics'] | null;
  activityFeed?: ActivityLogEntry[];
  loading?: boolean;
  onRefresh?: () => Promise<void> | void;
}

const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  analytics,
  activityFeed = [],
  loading = false,
  onRefresh,
}) => {
  const { isDark } = useTheme();
  const activeTasks = (metrics?.tasks.todo || 0) + (metrics?.tasks.in_progress || 0);
  const completionRate =
    metrics?.tasks.total ? Math.round((metrics.tasks.done / metrics.tasks.total) * 100) : 0;
  const overdueActive = metrics?.overdue.active ?? 0;
  const onTrack = metrics ? metrics.tasks.total - overdueActive : 0;
  const chartBackground = isDark ? '#111827' : '#FFFFFF';
  const chartGridColor = isDark ? '#1F2937' : '#E5E7EB';

  const velocityLineData = useMemo(
    () =>
      (analytics?.velocityTrend || []).slice(-6).map(point => ({
        value: point.completed,
        label: `W${point.week}`,
        dataPointText: `${point.completed}`,
      })),
    [analytics]
  );

  const priorityPieData = useMemo(() => buildPriorityPieData(analytics), [analytics]);

  const priorityTotal = useMemo(
    () => priorityPieData.reduce((sum, slice) => sum + slice.value, 0),
    [priorityPieData]
  );

  const weeklyCreatedData = useMemo(
    () =>
      (analytics?.weeklyProgress || []).map(day => ({
        value: day.created,
        label: day.label,
        dataPointText: `${day.created}`,
      })),
    [analytics]
  );

  const weeklyCompletedData = useMemo(
    () =>
      (analytics?.weeklyProgress || []).map(day => ({
        value: day.completed,
        label: day.label,
        dataPointText: `${day.completed}`,
      })),
    [analytics]
  );
  const weeklyLabels = useMemo(
    () => (analytics?.weeklyProgress || []).map(day => day.label),
    [analytics]
  );

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <ScrollView
      className="flex-1 px-4 py-6"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Productivity Overview
          </Text>
          <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Track workload, momentum, and completion speed.
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={loading}
          className={`px-3 py-1.5 rounded-full border ${isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
        >
          {loading ? (
            <ActivityIndicator size="small" color={isDark ? '#93C5FD' : '#2563EB'} />
          ) : (
            <Text className={isDark ? 'text-gray-300 text-sm' : 'text-gray-700 text-sm'}>
              Refresh
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Summary chips */}
      <View className="flex-row flex-wrap gap-3 mb-6">
        {buildSummaryChips(analytics, metrics, isDark).map(chip => (
          <View
            key={chip.label}
            className={`flex-1 min-w-[150px] rounded-2xl p-4 ${chip.bg} border ${chip.border}`}
          >
            <Text className={`text-xs font-semibold ${chip.textMuted}`}>{chip.label}</Text>
            <Text className={`text-2xl font-bold mt-2 ${chip.textStrong}`}>{chip.value}</Text>
            {chip.subLabel && (
              <Text className={`text-xs mt-1 ${chip.textMuted}`}>{chip.subLabel}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Recent Activity */}
      {/* Recent Activity Feed */}
      <Card variant="elevated" className="mb-6 p-4">
        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Recent Activity
        </Text>
        <View className="gap-y-4">
          {loading && activityFeed.length === 0 ? (
            <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading activity...</Text>
          ) : activityFeed.length === 0 ? (
            <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              No recent activity yet.
            </Text>
          ) : (
            activityFeed.map(entry => {
              const palette = getActivityPalette(entry.action, isDark);
              return (
                <View key={entry._id} className="flex-row items-center">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: palette.bg }}
                  >
                    {palette.icon}
                  </View>
                  <View className="flex-1">
                    <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {entry.description}
                    </Text>
                    <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(entry.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </Card>

      {/* Today's Summary */}
      <Card variant="elevated" className="mb-6 p-4">
        <View className="flex-row items-center mb-4">
          <Calendar size={24} color="#F59E0B" />
          <Text className={`text-lg font-semibold ml-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Today&apos;s Summary
          </Text>
        </View>

        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {loading ? '—' : metrics?.tasks.todo ?? 0}
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              To Do
            </Text>
          </View>
          <View className="items-center">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {loading ? '—' : metrics?.tasks.in_progress ?? 0}
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              In Progress
            </Text>
          </View>
          <View className="items-center">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {loading ? '—' : metrics?.tasks.done ?? 0}
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Done
            </Text>
          </View>
        </View>
      </Card>

      {/* Bottom charts */}
      <View className="gap-y-6 mb-10">
        <Card variant="elevated" className="p-4">
          <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Workload Breakdown
          </Text>
          {priorityPieData.length ? (
            <View className="items-center">
              <PieChart
                data={priorityPieData}
                showGradient
                shadow
                shadowColor={isDark ? '#0f172a' : '#cbd5f5'}
                shadowWidth={8}
                strokeWidth={1}
                focusOnPress
                
                strokeColor={isDark ? '#111827' : '#ffffff'}
                gradientCenterColor='lightblue'
                centerLabelComponent={() => (
                  <View
                    className="items-center justify-center rounded-full p-1"

                  >
                    <Text className={`text-xl font-bold ${isDark ? 'text-gray-600' : 'text-gray-900'}`}>
                      {priorityTotal}
                    </Text>
                    <Text className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-800'}`}>
                      tasks
                    </Text>
                  </View>
                )}
              />
              <View className="flex-row flex-wrap justify-between mt-4">
                {priorityPieData.map(slice => (
                  <WorkloadLegend
                    key={slice.text}
                    label={slice.text}
                    value={slice.value}
                    color={slice.color}
                    isDark={isDark}
                  />
                ))}
              </View>
            </View>
          ) : (
            <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              Assign priorities to visualize workload composition.
            </Text>
          )}
        </Card>

        <Card variant="elevated" className="p-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <BarChart3 size={20} color="#3B82F6" />
              <Text className={`text-lg font-semibold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Weekly Progress
              </Text>
            </View>
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Created vs completed
            </Text>
          </View>
          {weeklyCreatedData.length ? (
            <LineChart
              data={weeklyCreatedData}
              data2={weeklyCompletedData}
              color1={isDark ? '#A5B4FC' : '#3B82F6'}
              color2={isDark ? '#6EE7B7' : '#10B981'}
              startFillColor1={isDark ? '#312E81' : '#BFDBFE'}
              startFillColor2={isDark ? '#064E3B' : '#D1FAE5'}
              endFillColor1={isDark ? '#111827' : '#FFFFFF'}
              endFillColor2={isDark ? '#0F172A' : '#FFFFFF'}
              thickness={3}
              hideRules={true}
              height={220}
              curved
              yAxisColor="#FDE68A"
              areaChart
              isAnimated
              hideDataPoints={false}
              dataPointsColor1={isDark ? '#FDE68A' : '#2563EB'}
              dataPointsColor2={isDark ? '#BBF7D0' : '#059669'}
              showVerticalLines
              verticalLinesColor={chartGridColor}
              xAxisLabelTexts={weeklyLabels}
              yAxisThickness={0}
              xAxisThickness={0}
              rulesColor={chartGridColor}
            />
          ) : (
            <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              Create or complete tasks to generate weekly insights.
            </Text>
          )}
          {weeklyCreatedData.length > 0 && (
            <View className="flex-row justify-center gap-x-6 mt-4">
              <LegendPill label="Created" color={isDark ? '#A5B4FC' : '#3B82F6'} />
              <LegendPill label="Completed" color={isDark ? '#6EE7B7' : '#10B981'} />
            </View>
          )}
        </Card>
      </View>

      {/* Cycle Time Insight */}
      <LinearGradient
        colors={isDark ? ['#1E1B4B', '#111827'] : ['#EEF2FF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 20,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: isDark ? '#312E81' : '#E0E7FF',
          shadowColor: isDark ? '#000' : '#94A3B8',
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Cycle Time
            </Text>
            <Text className={`text-xs mt-1 ${isDark ? 'text-indigo-200' : 'text-indigo-500'}`}>
              Days from creation to completion
            </Text>
          </View>
          <View className="px-3 py-1 rounded-full bg-white/20">
            <Text className="text-xs text-white">{analytics?.cycleTime ? 'Live' : 'Awaiting data'}</Text>
          </View>
        </View>
        {analytics?.cycleTime ? (
          <View className="gap-y-3">
            {buildCycleMetrics(analytics.cycleTime).map(metric => (
              <CycleMetric
                key={metric.label}
                label={metric.label}
                value={metric.value}
                isDark={isDark}
                percentage={metric.percentage}
                accent={metric.accent}
              />
            ))}
          </View>
        ) : (
          <Text className={`text-sm ${isDark ? 'text-indigo-100' : 'text-indigo-600'}`}>
            Complete a few tasks to start tracking cycle times.
          </Text>
        )}
      </LinearGradient>

      {/* Delivery velocity */}
      <Card variant="elevated" className="mb-10 p-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <TrendingUp size={20} color={isDark ? '#C084FC' : '#6366F1'} />
            <Text className={`text-lg font-semibold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Delivery Velocity
            </Text>
          </View>
          <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Last 6 weeks
          </Text>
        </View>
        {velocityLineData.length ? (
          <LineChart
            data={velocityLineData}
            curved
            isAnimated
            color1={isDark ? '#C084FC' : '#6366F1'}
            startFillColor1={isDark ? '#7C3AED' : '#C7D2FE'}
            endFillColor1={isDark ? '#111827' : '#FFFFFF'}
            startOpacity={0.6}
            endOpacity={0.05}
            thickness={4}
            hideDataPoints={false}
            dataPointsColor={isDark ? '#FDE68A' : '#A5B4FC'}
            dataPointsWidth={10}
            yAxisThickness={0}
            xAxisThickness={0}
            height={180}
            areaChart
            hideRules={true}
            yAxisColor="#0BA5A4"
            backgroundColor={chartBackground}
            rulesColor={chartGridColor}
          />
        ) : (
          <Text className={isDark ? 'text-gray-500' : 'text-gray-500'}>
            Ship a few tasks to start tracking velocity.
          </Text>
        )}
      </Card>
    </ScrollView>
  );
};

/**
 * Maps activity verbs to colors/icons so the feed looks cohesive.
 */
const getActivityPalette = (action: string, isDark: boolean) => {
  if (action.includes('created')) {
    return { bg: isDark ? '#1D4ED8' : '#DBEAFE', icon: <ListChecks size={16} color="#FFFFFF" /> };
  }
  if (action.includes('completed')) {
    return { bg: isDark ? '#065F46' : '#D1FAE5', icon: <CheckSquare size={16} color="#FFFFFF" /> };
  }
  if (action.includes('status')) {
    return { bg: isDark ? '#92400E' : '#FEF3C7', icon: <ActivityIcon size={16} color="#FFFFFF" /> };
  }
  return { bg: isDark ? '#4C1D95' : '#EDE9FE', icon: <MapPin size={16} color="#FFFFFF" /> };
};

const buildSummaryChips = (
  analytics: DashboardAnalyticsResponse['analytics'] | null | undefined,
  metrics: DashboardMetricsResponse['metrics'] | null | undefined,
  isDark: boolean
) => {
  const summary = analytics?.summary;
  return [
    {
      label: 'Open tasks',
      value: summary ? summary.openTasks : metrics?.tasks.total ?? '—',
      subLabel: 'Active workload',
      bg: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
      border: isDark ? 'border-blue-800/60' : 'border-blue-100',
      textStrong: isDark ? 'text-white' : 'text-blue-900',
      textMuted: isDark ? 'text-blue-200' : 'text-blue-700',
    },
    {
      label: 'Completed',
      value: summary ? summary.completedTasks : metrics?.tasks.done ?? '—',
      subLabel: `${completionRate(metrics)}% completion`,
      bg: isDark ? 'bg-emerald-900/25' : 'bg-emerald-50',
      border: isDark ? 'border-emerald-900/40' : 'border-emerald-100',
      textStrong: isDark ? 'text-white' : 'text-emerald-900',
      textMuted: isDark ? 'text-emerald-200' : 'text-emerald-700',
    },
    {
      label: 'Overdue',
      value: summary ? summary.overdueTasks : metrics?.overdue.active ?? '—',
      subLabel: summary ? `${summary.upcomingTasks} due soon` : '',
      bg: isDark ? 'bg-red-900/30' : 'bg-red-50',
      border: isDark ? 'border-red-900/40' : 'border-red-100',
      textStrong: isDark ? 'text-white' : 'text-red-900',
      textMuted: isDark ? 'text-red-200' : 'text-red-700',
    },
  ];
};

const completionRate = (metrics?: DashboardMetricsResponse['metrics'] | null) => {
  if (!metrics?.tasks.total) return 0;
  return Math.round((metrics.tasks.done / metrics.tasks.total) * 100);
};

const buildCycleMetrics = (cycleTime: {
  averageDays?: number;
  fastestDays?: number;
  slowestDays?: number;
}) => {
  const entries = [
    { label: 'Average', value: cycleTime.averageDays ?? 0, accent: '#C4B5FD' },
    { label: 'Fastest', value: cycleTime.fastestDays ?? 0, accent: '#6EE7B7' },
    { label: 'Slowest', value: cycleTime.slowestDays ?? 0, accent: '#FDE68A' },
  ];
  const max = Math.max(...entries.map(entry => entry.value), 1);

  return entries.map(entry => ({
    label: entry.label,
    value: `${entry.value.toFixed(1)}d`,
    percentage: Math.min((entry.value / max) * 100, 100),
    accent: entry.accent,
  }));
};

const buildPriorityPieData = (
  analytics: DashboardAnalyticsResponse['analytics'] | null | undefined
) => {
  const distribution = analytics?.priorityDistribution;
  if (!distribution) return [];

  const palette: Record<string, { color: string; label: string }> = {
    high: { color: '#EF4444', label: 'High' },
    medium: { color: '#F59E0B', label: 'Medium' },
    low: { color: '#0EA5E9', label: 'Low' },
  };

  const gradientHint: Record<string, string> = {
    high: '#FCA5A5',
    medium: '#FCD34D',
    low: '#93C5FD',
  };

  return Object.entries(distribution)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      value,
      color: palette[key]?.color || '#9CA3AF',
      gradientCenterColor: gradientHint[key] || '#E5E7EB',
      text: palette[key]?.label || key,
    }));
};

const WorkloadLegend = ({
  label,
  value,
  color,
  isDark = false,
}: {
  label: string;
  value: number;
  color: string;
  isDark?: boolean;
}) => (
  <View className="flex-row items-center mb-2 w-1/2">
    <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
    <Text className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
      {label} · {value}
    </Text>
  </View>
);

const LegendPill = ({ label, color }: { label: string; color: string }) => (
  <View className="flex-row items-center">
    <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
    <Text className="text-xs text-gray-600 dark:text-gray-300">{label}</Text>
  </View>
);

const CycleMetric = ({
  label,
  value,
  isDark,
  percentage,
  accent,
}: {
  label: string;
  value: string;
  isDark: boolean;
  percentage: number;
  accent: string;
}) => (
  <View className="mb-2">
    <View className="flex-row justify-between mb-1">
      <Text className={`text-sm ${isDark ? 'text-indigo-100' : 'text-indigo-900'}`}>{label}</Text>
      <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </Text>
    </View>
    <View className={`h-2 rounded-full ${isDark ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}>
      <View
        className="h-2 rounded-full"
        style={{
          width: `${percentage}%`,
          backgroundColor: accent,
          shadowColor: accent,
          shadowOpacity: 0.4,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 6,
        }}
      />
    </View>
  </View>
);

export default Dashboard;
