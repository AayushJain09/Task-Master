import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Easing } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import {
  CheckSquare,
  TrendingUp,
  Calendar,
  BarChart3,
  AlertTriangle,
  ListChecks,
  MapPin,
  Activity as ActivityIcon,
} from 'lucide-react-native';
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
  const completionRate =
    metrics?.tasks.total ? Math.round((metrics.tasks.done / metrics.tasks.total) * 100) : 0;
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

  // Only surface the freshest five activity events to keep the card focused.
  const visibleActivities = useMemo(() => activityFeed.slice(0, 5), [activityFeed]);

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
      <LinearGradient
        colors={isDark ? ['#111827', '#1F2937'] : ['#EFF6FF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 20,
          marginBottom: 18,
          borderWidth: 1,
          borderColor: isDark ? '#1F2937' : '#DBEAFE',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <AccentBlob color={isDark ? '#1E3A8A' : '#BFDBFE'} size={180} style={{ right: -40, top: -60 }} />
        <AccentBlob color={isDark ? '#0EA5E9' : '#60A5FA'} size={120} style={{ left: -50, bottom: -50 }} />
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-6">
            <Text className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-indigo-200' : 'text-indigo-600'}`}>
              Mission Control
            </Text>
            <Text className={`text-3xl font-black mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Productivity Overview
            </Text>
            <Text className={`text-sm mt-3 leading-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Monitor flow health, uncover bottlenecks, and keep the sprint pulse steady.
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={loading}
            className="px-4 py-2 rounded-full border"
            style={{
              borderColor: isDark ? '#93C5FD40' : '#2563EB30',
              backgroundColor: isDark ? '#312E8140' : '#DBEAFE70',
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={isDark ? '#93C5FD' : '#2563EB'} />
            ) : (
              <Text
                className="text-sm font-semibold"
                style={{ color: isDark ? '#F8FAFC' : '#1E3A8A' }}
              >
                Refresh
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Summary chips - vector-styled */}
      <View className="flex-row flex-wrap gap-3 mb-6">
        {buildSummaryChips(analytics, metrics, isDark).map(chip => (
          <LinearGradient
            key={chip.label}
            colors={chip.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              minWidth: 150,
              borderRadius: 22,
              padding: 18,
              borderWidth: 1,
              borderColor: chip.borderColor,
              overflow: 'hidden',
            }}
          >
            <AccentBlob color={chip.accentBlob} size={120} style={{ right: -30, top: -40 }} />
            <View className="flex-row items-center mb-4">
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: chip.iconBg }}
              >
                {chip.icon}
              </View>
              <Text className="ml-3 text-xs font-semibold uppercase tracking-widest" style={{ color: chip.labelColor }}>
                {chip.label}
              </Text>
            </View>
            <Text className="text-3xl font-black" style={{ color: chip.valueColor }}>
              {chip.value}
            </Text>
            {chip.subLabel && (
              <Text className="text-xs mt-2" style={{ color: chip.helperColor }}>
                {chip.subLabel}
              </Text>
            )}
          </LinearGradient>
        ))}
      </View>

      {/* Recent Activity Feed */}
      <LinearGradient
        colors={isDark ? ['#0F172A', '#111827'] : ['#F8FAFC', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 20,
          marginBottom: 18,
          borderWidth: 1,
          borderColor: isDark ? '#1F2937' : '#E2E8F0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <AccentBlob color={isDark ? '#1D4ED8' : '#C7D2FE'} size={200} style={{ right: -80, top: -40 }} />
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Recent Activity
            </Text>
            <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Task updates flowing through your workspace.
            </Text>
          </View>
          <View className="px-3 py-1 rounded-full" style={{ backgroundColor: isDark ? '#1F2937' : '#E0E7FF' }}>
            <Text className={`text-xs font-semibold ${isDark ? 'text-indigo-200' : 'text-indigo-700'}`}>
              Live
            </Text>
          </View>
        </View>
        <View className="gap-y-5">
          {loading && activityFeed.length === 0 ? (
            <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading activity...</Text>
          ) : activityFeed.length === 0 ? (
            <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              No recent activity yet.
            </Text>
          ) : (
            visibleActivities.map((entry, index) => {
              const palette = getActivityPalette(entry.action, isDark);
              const isLast = index === visibleActivities.length - 1;
              return (
                <View key={entry._id} className="flex-row">
                  <View className="items-center mr-3">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: palette.bg }}
                    >
                      {palette.icon}
                    </View>
                    {!isLast && (
                      <View
                        style={{
                          width: 2,
                          flex: 1,
                          backgroundColor: isDark ? '#1F2937' : '#E5E7EB',
                          marginTop: 4,
                        }}
                      />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
      </LinearGradient>

      {/* Today's Summary */}
      <LinearGradient
        colors={isDark ? ['#1B1F31', '#111826'] : ['#FFF7ED', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 20,
          marginBottom: 18,
          borderWidth: 1,
          borderColor: isDark ? '#1F2937' : '#FED7AA',
          overflow: 'hidden',
        }}
      >
        <AccentBlob color={isDark ? '#9A3412' : '#FDBA74'} size={160} style={{ right: -60, top: -50 }} />
        <View className="flex-row items-center mb-6">
          <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: isDark ? '#78350F' : '#FDE68A' }}>
            <Calendar size={26} color={isDark ? '#FCD34D' : '#B45309'} />
          </View>
          <View className="ml-4">
            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Today&apos;s Summary
            </Text>
            <Text className={`text-xs mt-1 ${isDark ? 'text-amber-200' : 'text-amber-600'}`}>
              Where the sprint stands right now.
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between">
          {[
            { label: 'To Do', value: metrics?.tasks.todo ?? 0 },
            { label: 'In Progress', value: metrics?.tasks.in_progress ?? 0 },
            { label: 'Done', value: metrics?.tasks.done ?? 0 },
          ].map(bucket => (
            <View key={bucket.label} className="items-center flex-1">
              <Text className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {loading ? '—' : bucket.value}
              </Text>
              <Text className={`text-xs mt-2 tracking-widest ${isDark ? 'text-amber-200' : 'text-amber-600'}`}>
                {bucket.label}
              </Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Bottom charts */}
      <View className="gap-y-6 mb-10">
        <LinearGradient
          colors={isDark ? ['#0F172A', '#111827'] : ['#F0F9FF', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: isDark ? '#1E3A8A' : '#BAE6FD',
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Workload Breakdown
              </Text>
              <Text className={`text-xs mt-1 ${isDark ? 'text-sky-200' : 'text-sky-600'}`}>
                Priority blend across your active portfolio.
              </Text>
            </View>
          </View>
          {priorityPieData.length ? (
            <View className="items-center">
              <PieChart
                data={priorityPieData}
                showGradient
                donut
                innerRadius={60}
                radius={90}
                shadow
                shadowColor={isDark ? '#0f172a' : '#cbd5f5'}
                shadowWidth={8}
                strokeWidth={1}
                strokeColor={isDark ? '#111827' : '#FFFFFF'}
                centerLabelComponent={() => (
                  <View
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 45,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: isDark ? '#1E40AF' : '#E0F2FE',
                    }}
                  >
                    <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {priorityTotal}
                    </Text>
                    <Text className={`text-xs uppercase tracking-widest ${isDark ? 'text-sky-200' : 'text-sky-600'}`}>
                      tasks
                    </Text>
                  </View>
                )}
              />
              <View className="flex-row flex-wrap justify-between mt-6 w-full">
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
        </LinearGradient>

        <LinearGradient
          colors={isDark ? ['#111827', '#0F172A'] : ['#EEF2FF', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: isDark ? '#312E81' : '#E0E7FF',
          }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <BarChart3 size={20} color={isDark ? '#A5B4FC' : '#4338CA'} />
              <Text className={`text-lg font-semibold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Weekly Progress
              </Text>
            </View>
            <Text className={`text-xs ${isDark ? 'text-indigo-200' : 'text-indigo-500'}`}>
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
        </LinearGradient>
      </View>

      <CycleInsightCard cycleTime={analytics?.cycleTime} isDark={isDark} />

      {/* Delivery velocity */}
      <LinearGradient
        colors={isDark ? ['#2E1065', '#1E1B4B', '#111827'] : ['#F5F3FF', '#EEF2FF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 28,
          padding: 24,
          borderWidth: 1,
          borderColor: isDark ? '#7C3AED' : '#DDD6FE',
          marginBottom: 16,
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <TrendingUp size={20} color={isDark ? '#F0ABFC' : '#7C3AED'} />
            <View className="ml-3">
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Delivery Velocity
              </Text>
              <Text className={`text-xs ${isDark ? 'text-purple-200' : 'text-purple-600'}`}>
                Completed stories each week
              </Text>
            </View>
          </View>
          <Text className={`text-xs ${isDark ? 'text-purple-200' : 'text-purple-600'}`}>
            Last 6 weeks
          </Text>
        </View>
        {velocityLineData.length ? (
          <LineChart
            data={velocityLineData}
            curved
            isAnimated
            color1={isDark ? '#F0ABFC' : '#7C3AED'}
            startFillColor1={isDark ? '#7C3AED' : '#DDD6FE'}
            endFillColor1={isDark ? '#111827' : '#FFFFFF'}
            startOpacity={0.6}
            endOpacity={0.05}
            thickness={4}
            hideDataPoints={false}
            dataPointsColor={isDark ? '#FDE68A' : '#7C3AED'}
            dataPointsWidth={10}
            yAxisThickness={0}
            xAxisThickness={0}
            height={200}
            areaChart
            hideRules={true}
            yAxisColor="#0BA5A4"
            backgroundColor="transparent"
            rulesColor={chartGridColor}
          />
        ) : (
          <Text className={isDark ? 'text-gray-500' : 'text-gray-500'}>
            Ship a few tasks to start tracking velocity.
          </Text>
        )}
      </LinearGradient>
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
  const baseValueColor = isDark ? '#F9FAFB' : '#0F172A';

  return [
    {
      label: 'Open orbit',
      value: summary ? summary.openTasks : metrics?.tasks.total ?? '—',
      subLabel: 'Active workload in flight',
      gradient: isDark ? ['#1E1B4B', '#0F172A'] : ['#DBEAFE', '#FFFFFF'],
      borderColor: isDark ? '#312E81' : '#BFDBFE',
      labelColor: isDark ? '#C7D2FE' : '#1D4ED8',
      helperColor: isDark ? '#E0E7FF' : '#475569',
      valueColor: baseValueColor,
      iconBg: isDark ? '#312E81' : '#DBEAFE',
      accentBlob: isDark ? '#4338CA' : '#A5B4FC',
      icon: <ListChecks size={18} color={isDark ? '#C7D2FE' : '#1D4ED8'} />,
    },
    {
      label: 'Completion',
      value: summary ? summary.completedTasks : metrics?.tasks.done ?? '—',
      subLabel: `${completionRate(metrics)}% completion rate`,
      gradient: isDark ? ['#064E3B', '#052E16'] : ['#D1FAE5', '#FFFFFF'],
      borderColor: isDark ? '#065F46' : '#A7F3D0',
      labelColor: isDark ? '#6EE7B7' : '#047857',
      helperColor: isDark ? '#D1FAE5' : '#047857',
      valueColor: baseValueColor,
      iconBg: isDark ? '#065F46' : '#DEF7EC',
      accentBlob: isDark ? '#10B981' : '#34D399',
      icon: <CheckSquare size={18} color={isDark ? '#6EE7B7' : '#047857'} />,
    },
    {
      label: 'Overdue watch',
      value: summary ? summary.overdueTasks : metrics?.overdue.active ?? '—',
      subLabel: summary ? `${summary.upcomingTasks} deadlines approaching` : 'Monitor approaching work',
      gradient: isDark ? ['#7F1D1D', '#450A0A'] : ['#FEE2E2', '#FFFFFF'],
      borderColor: isDark ? '#991B1B' : '#FCA5A5',
      labelColor: isDark ? '#FCA5A5' : '#B91C1C',
      helperColor: isDark ? '#FECACA' : '#7F1D1D',
      valueColor: baseValueColor,
      iconBg: isDark ? '#991B1B' : '#FEE2E2',
      accentBlob: isDark ? '#F87171' : '#FCA5A5',
      icon: <AlertTriangle size={18} color={isDark ? '#FECACA' : '#B91C1C'} />,
    },
  ];
};

const completionRate = (metrics?: DashboardMetricsResponse['metrics'] | null) => {
  if (!metrics?.tasks.total) return 0;
  return Math.round((metrics.tasks.done / metrics.tasks.total) * 100);
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

/**
 * AccentBlob renders subtle vector circles so each card gets a soft, futuristic accent without extra SVG assets.
 */
const AccentBlob = ({
  color,
  size = 140,
  style,
}: {
  color: string;
  size?: number;
  style?: object;
}) => (
  <View
    pointerEvents="none"
    style={[
      {
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: color,
        opacity: 0.35,
      },
      style,
    ]}
  />
);

const CycleInsightCard = ({
  cycleTime,
  isDark,
}: {
  cycleTime?: {
    averageDays?: number;
    fastestDays?: number;
    slowestDays?: number;
  } | null;
  isDark: boolean;
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: cycleTime ? 1 : 0,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [cycleTime, animatedValue]);

  const metrics = useMemo(() => {
    if (!cycleTime) return [];
    return [
      {
        label: 'Average pace',
        value: cycleTime.averageDays ?? 0,
        accent: '#C4B5FD',
        subtle: '#4C1D95',
      },
      {
        label: 'Fastest turn',
        value: cycleTime.fastestDays ?? 0,
        accent: '#6EE7B7',
        subtle: '#064E3B',
      },
      {
        label: 'Slowest turn',
        value: cycleTime.slowestDays ?? 0,
        accent: '#FDE68A',
        subtle: '#92400E',
      },
    ];
  }, [cycleTime]);

  const maxValue = Math.max(...metrics.map(item => item.value), 1);
  const sparklineData = metrics.map(item => ({
    value: item.value,
    label: item.label[0],
    dataPointText: `${item.value.toFixed(1)}d`,
  }));

  return (
    <LinearGradient
      colors={isDark ? ['#1B1A4B', '#0F172A'] : ['#E0E7FF', '#F9FAFB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 28,
        padding: 24,
        marginBottom: 24,
        overflow: 'hidden',
      }}
    >
      {/* Subtle vector accents */}
      <View pointerEvents="none" style={{ position: 'absolute', right: -40, top: -20 }}>
        <View
          style={{
            width: 160,
            height: 160,
            borderRadius: 999,
            backgroundColor: isDark ? '#312E8140' : '#C4B5FD40',
          }}
        />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: -50, bottom: -60 }}>
        <View
          style={{
            width: 200,
            height: 200,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: isDark ? '#4338CA40' : '#A5B4FC60',
          }}
        />
      </View>

      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Cycle Time Radar
          </Text>
          <Text className={`text-xs mt-1 ${isDark ? 'text-indigo-200' : 'text-indigo-500'}`}>
            Snapshot of delivery speed over recent work.
          </Text>
        </View>
        <View className="px-3 py-1 rounded-full bg-white/20">
          <Text className="text-xs text-white">{cycleTime ? 'Tracking' : 'Awaiting data'}</Text>
        </View>
      </View>

      {!cycleTime ? (
        <Text className={`text-sm ${isDark ? 'text-indigo-100' : 'text-indigo-700'}`}>
          Complete a few tasks to start measuring cycle time insights.
        </Text>
      ) : (
        <>
          <View className="flex-row items-end justify-between mb-6">
            <View>
              <Text className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {cycleTime.averageDays?.toFixed(1) ?? '0.0'}
                <Text className="text-lg font-semibold"> d</Text>
              </Text>
              <Text className={`text-sm mt-1 ${isDark ? 'text-indigo-100' : 'text-indigo-700'}`}>
                Mean time from kickoff to done
              </Text>
            </View>
            <View className="items-end">
              <Text className={`text-xs uppercase tracking-widest ${isDark ? 'text-indigo-200' : 'text-indigo-600'}`}>
                Sparkline
              </Text>
              <LineChart
                data={sparklineData}
                hideRules
                hideDataPoints
                isAnimated
                animationDuration={700}
                adjustToWidth
                noOfSections={2}
                width={140}
                height={80}
                curved
                areaChart
                startOpacity={0.3}
                endOpacity={0}
                startFillColor={isDark ? '#C4B5FD' : '#4C1D95'}
                color1={isDark ? '#F472B6' : '#7C3AED'}
                backgroundColor="transparent"
              />
            </View>
          </View>

          <View className="gap-y-4">
            {metrics.map(metric => {
              const progressWidth = animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', `${Math.min((metric.value / maxValue) * 100, 100)}%`],
              });

              return (
                <View key={metric.label}>
                  <View className="flex-row justify-between mb-1">
                    <Text className={`text-xs font-semibold ${isDark ? 'text-indigo-100' : 'text-indigo-900'}`}>
                      {metric.label}
                    </Text>
                    <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {metric.value.toFixed(1)} d
                    </Text>
                  </View>
                  <View className={`h-2.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-indigo-100'}`}>
                    <Animated.View
                      style={{
                        width: progressWidth,
                        height: '100%',
                        borderRadius: 999,
                        backgroundColor: metric.accent,
                        shadowColor: metric.subtle,
                        shadowOpacity: 0.4,
                        shadowOffset: { width: 0, height: 4 },
                        shadowRadius: 8,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          <View className="flex-row mt-6 gap-3">
            {metrics.map(metric => (
              <View
                key={`${metric.label}-chip`}
                className="flex-1 rounded-2xl px-3 py-2"
                style={{
                  backgroundColor: isDark ? `${metric.subtle}40` : `${metric.accent}30`,
                }}
              >
                <Text className="text-xs font-semibold text-white">
                  {metric.label.split(' ')[0]}
                </Text>
                <Text className="text-sm font-bold text-white">
                  {metric.value.toFixed(1)} d
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </LinearGradient>
  );
};

export default Dashboard;
