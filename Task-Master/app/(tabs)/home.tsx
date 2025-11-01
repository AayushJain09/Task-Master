import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import SideDrawer, { DrawerToggle } from '@/components/ui/SideDrawer';
import DrawerContent from '@/components/ui/DrawerContent';

export default function HomeScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDrawerOption, setActiveDrawerOption] = useState('dashboard');

  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleDrawerOptionSelect = (optionId: string) => {
    setActiveDrawerOption(optionId);
  };


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
          <View className="flex-1">
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome back, {user?.firstName || 'User'}! 👋
            </Text>
            <Text className={`text-base mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Here are the latest updates for you
            </Text>
          </View>
          <DrawerToggle onToggle={handleDrawerToggle} isOpen={isDrawerOpen} />
        </View>
      </View>

      {/* Dynamic Content Based on Drawer Selection */}
      <DrawerContent activeOption={activeDrawerOption} />
    </View>
  );
}
