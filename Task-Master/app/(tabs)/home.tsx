import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import SideDrawer, { DrawerToggle } from '@/components/ui/SideDrawer';
import DrawerContent from '@/components/ui/DrawerContent';
import { tasksService } from '@/services/tasks.service';
import { TaskStatistics } from '@/types/task.types';

export default function HomeScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDrawerOption, setActiveDrawerOption] = useState('dashboard');
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [taskStatistics, setTaskStatistics] = useState<TaskStatistics | null>(null);

  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleDrawerOptionSelect = (optionId: string) => {
    setActiveDrawerOption(optionId);
  };

  const fetchTaskStatistics = useCallback(async () => {
    try {
      setStatisticsLoading(true);
      const response = await tasksService.getTaskStatistics();
      setTaskStatistics(response.statistics);
    } catch (error) {
      console.error('Failed to load task statistics:', error);
    } finally {
      setStatisticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaskStatistics();
  }, [fetchTaskStatistics]);

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
      <View className={`px-4 py-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}` }>
        <View className="flex-row items-center justify-between">
          <DrawerToggle onToggle={handleDrawerToggle} isOpen={isDrawerOpen} />
          <View className="flex-1">
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome back, {user?.firstName || 'User'}! 👋
            </Text>
            <Text className={`text-base mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Here are the latest updates for you
            </Text>
          </View>
        </View>
      </View>

      {/* Dynamic Content Based on Drawer Selection */}
      <DrawerContent 
        activeOption={activeDrawerOption} 
        taskStatistics={taskStatistics}
        statisticsLoading={statisticsLoading}
        onRefreshStatistics={fetchTaskStatistics}
      />
    </View>
  );
}
