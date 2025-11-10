import React from 'react';
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
import { DashboardMetricsResponse, ActivityLogEntry } from '@/types/dashboard.types';

/**
 * Props consumed by the dashboard screen. All heavy data lifting happens upstream
 * so this component can stay purely presentational.
 */
interface DashboardProps {
  metrics?: DashboardMetricsResponse['metrics'] | null;
  activityFeed?: ActivityLogEntry[];
  loading?: boolean;
  onRefresh?: () => Promise<void> | void;
}

const Dashboard: React.FC<DashboardProps> = ({
  metrics,
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
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Dashboard Overview
        </Text>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={loading}
          className={`px-3 py-1.5 rounded-full border ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          {loading ? (
            <ActivityIndicator size="small" color={isDark ? '#93C5FD' : '#2563EB'} />
          ) : (
            <Text className={isDark ? 'text-gray-300 text-sm' : 'text-gray-700 text-sm'}>
              Refresh stats
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Cards Row */}
      <View className="flex-row mb-6">
        <Card variant="elevated" className="flex-1 mr-2 p-4">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
              <CheckSquare size={24} color="#3B82F6" />
            </View>
            <View>
              <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {loading ? '—' : activeTasks}
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Active Tasks
              </Text>
            </View>
          </View>
        </Card>

        <Card variant="elevated" className="flex-1 ml-2 p-4">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-3">
              <TrendingUp size={24} color="#10B981" />
            </View>
            <View>
              <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {loading ? '—' : `${completionRate}%`}
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Completion Rate
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Task Health Summary */}
      <Card variant="elevated" className="mb-6 p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Task Health
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {metrics?.tasks.total ?? '—'} tracked tasks
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-4">
          <View
            className={`flex-1 min-w-[150px] rounded-2xl p-4 border ${
              isDark ? 'bg-red-900/20 border-red-900/40' : 'bg-red-50 border-red-100'
            }`}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className={`text-sm font-semibold ${isDark ? 'text-red-200' : 'text-red-700'}`}>
                Overdue now
              </Text>
              <AlertTriangle size={16} color={isDark ? '#F87171' : '#DC2626'} />
            </View>
            <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {loading ? '—' : overdueActive}
            </Text>
            <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {loading
                ? 'Updating...'
                : `${metrics?.tasks.todo ?? 0} todo · ${metrics?.tasks.in_progress ?? 0} in progress`}
            </Text>
            <Text className={`text-xs mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {loading
                ? '—'
                : `${metrics?.tasks.done ?? 0} finished after deadline`}
            </Text>
          </View>

          <View
            className={`flex-1 min-w-[150px] rounded-2xl p-4 border ${
              isDark ? 'bg-emerald-900/20 border-emerald-900/40' : 'bg-emerald-50 border-emerald-100'
            }`}
          >
            <Text className={`text-sm font-semibold ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>
              On track
            </Text>
            <Text className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {loading ? '—' : onTrack}
            </Text>
            <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {loading
                ? 'Updating...'
                : `${metrics?.tasks.todo ?? 0} todo · ${metrics?.tasks.in_progress ?? 0} in progress`}
            </Text>
            <Text className={`text-xs mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {loading
                ? '—'
                : `${metrics?.tasks.done ?? 0} completed on time`}
            </Text>
          </View>
        </View>
      </Card>

      {/* Progress Overview */}
      <Card variant="elevated" className="mb-6 p-4">
        <View className="flex-row items-center mb-4">
          <BarChart3 size={24} color="#3B82F6" />
          <Text className={`text-lg font-semibold ml-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Weekly Progress
          </Text>
        </View>
        
        <View className="gap-y-4">
          <View>
            <View className="flex-row justify-between mb-2">
              <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Tasks Completed
              </Text>
              <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {loading ? '—' : `${metrics?.tasks.done ?? 0}/${metrics?.tasks.total ?? 0}`}
              </Text>
            </View>
            <View className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <View
                className="h-2 bg-green-500 rounded-full"
                style={{ width: `${Math.min(completionRate, 100)}%` }}
              />
            </View>
          </View>

          <View>
            <View className="flex-row justify-between mb-2">
              <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Reminders Set
              </Text>
              <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                12/15
              </Text>
            </View>
            <View className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <View className="h-2 bg-blue-500 rounded-full" style={{ width: '80%' }} />
            </View>
          </View>

          <View>
            <View className="flex-row justify-between mb-2">
              <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Goals Achieved
              </Text>
              <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                7/10
              </Text>
            </View>
            <View className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <View className="h-2 bg-purple-500 rounded-full" style={{ width: '70%' }} />
            </View>
          </View>
        </View>
      </Card>

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
      <Card variant="elevated" className="mb-10 p-4">
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

export default Dashboard;
