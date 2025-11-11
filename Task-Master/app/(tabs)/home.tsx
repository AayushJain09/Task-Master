import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import SideDrawer, { DrawerToggle } from '@/components/ui/SideDrawer';
import DrawerContent from '@/components/ui/DrawerContent';
import { dashboardService } from '@/services/dashboard.service';
import {
  DashboardMetricsResponse,
  DashboardActivityResponse,
  DashboardAnalyticsResponse,
} from '@/types/dashboard.types';

export default function HomeScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDrawerOption, setActiveDrawerOption] = useState('dashboard');
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetricsResponse['metrics'] | null>(null);
  const [activityFeed, setActivityFeed] = useState<DashboardActivityResponse['activities']>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalyticsResponse['analytics'] | null>(null);
  const quickStats = useMemo(
    () => [
      {
        label: 'Open tasks',
        value: metrics?.tasks?.total ?? '—',
        helper: 'in pipeline',
        accent: '#60A5FA',
      },
      {
        label: 'Overdue',
        value: metrics?.overdue?.active ?? '0',
        helper: 'needs attention',
        accent: '#F87171',
      },
      {
        label: 'Completed',
        value: metrics?.tasks?.done ?? '—',
        helper: 'shipped',
        accent: '#34D399',
      },
    ],
    [metrics]
  );
  const weeklySnapshot = useMemo(
    () => ({
      created: metrics?.weekly?.created ?? 0,
      completed: metrics?.weekly?.completed ?? 0,
    }),
    [metrics]
  );

  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleDrawerOptionSelect = (optionId: string) => {
    setActiveDrawerOption(optionId);
  };

  /**
   * Aggregated fetch used by dashboard + tasks screen so we keep network calls centralized.
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      setMetricsLoading(true);
      const [metricsResponse, activityResponse, analyticsResponse] = await Promise.all([
        dashboardService.getMetrics(),
        dashboardService.getRecentActivity({ limit: 10 }),
        dashboardService.getAnalytics(),
      ]);
      setMetrics(metricsResponse.metrics);
      setActivityFeed(activityResponse.activities);
      setAnalytics(analyticsResponse.analytics);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Side Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeOption={activeDrawerOption}
        onOptionSelect={handleDrawerOptionSelect}
      />
    
      {/* Header */}
      <View className="px-4 pt-4">
        {activeDrawerOption === 'dashboard' ? (
          <LinearGradient
            colors={isDark ? ['#0F172A', '#111827'] : ['#EFF6FF', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 28,
              padding: 20,
              borderWidth: 1,
              borderColor: isDark ? '#1E3A8A' : '#C7D2FE',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <AccentBlob color={isDark ? '#1D4ED8' : '#A5B4FC'} size={220} style={{ right: -70, top: -80 }} />
            <AccentBlob color={isDark ? '#0EA5E9' : '#93C5FD'} size={140} style={{ left: -60, bottom: -90 }} />

            <View className="flex-row items-start justify-between">
              <DrawerToggle onToggle={handleDrawerToggle} isOpen={isDrawerOpen} />
              <View className="items-end">
                <Text className={`text-xs uppercase tracking-[0.4em] ${isDark ? 'text-indigo-200' : 'text-indigo-500'}`}>
                  Weekly pulse
                </Text>
                <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {weeklySnapshot.completed} done · {weeklySnapshot.created} created
                </Text>
              </View>
            </View>

            <View className="mt-6">
              <View className="flex-row items-center">
                <Sparkles size={16} color={isDark ? '#FDE68A' : '#D97706'} />
                <Text className={`text-xs uppercase tracking-[0.3em] ml-2 ${isDark ? 'text-amber-200' : 'text-amber-600'}`}>
                  Mission control
                </Text>
              </View>
              <Text className={`text-3xl font-black mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Welcome back, {user?.firstName || 'User'}! 👋
              </Text>
              <Text className={`text-base mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Here&apos;s the latest signal on your workload. Triage, focus, and keep momentum.
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-3 mt-6">
              {quickStats.map(stat => (
                <View
                  key={stat.label}
                  style={{
                    flex: 1,
                    minWidth: 110,
                    borderRadius: 18,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    backgroundColor: isDark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.85)',
                    borderWidth: 1,
                    borderColor: `${stat.accent}33`,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: 1.5,
                      color: stat.accent,
                    }}
                  >
                    {stat.label}
                  </Text>
                  <Text className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value}
                  </Text>
                  <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.helper}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={isDark ? ['#111827', '#0F172A'] : ['#FFFFFF', '#EEF2FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 18,
              borderWidth: 1,
              borderColor: isDark ? '#1F2937' : '#E2E8F0',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View className="flex-row items-center gap-4">
              <DrawerToggle onToggle={handleDrawerToggle} isOpen={isDrawerOpen} />
              <View>
                <Text className={`text-xs uppercase tracking-[0.4em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {activeDrawerOption === 'tasks' ? 'Task board' : 'Reminders'}
                </Text>
                <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {activeDrawerOption === 'tasks' ? 'Tasks' : 'Reminders'}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {activeDrawerOption === 'tasks'
                  ? `${metrics?.tasks?.total ?? 0} total`
                  : `${activityFeed.length} alerts`}
              </Text>
            </View>
          </LinearGradient>
        )}
      </View>

      {/* Dynamic Content Based on Drawer Selection */}
      <DrawerContent
        activeOption={activeDrawerOption}
        dashboardMetrics={metrics}
        analytics={analytics}
        activityFeed={activityFeed}
        metricsLoading={metricsLoading}
        onRefreshDashboard={fetchDashboardData}
      />
    </View>
  );
}

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
        opacity: 0.25,
      },
      style,
    ]}
  />
);
