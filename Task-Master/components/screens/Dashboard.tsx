import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { 
  CheckSquare, 
  TrendingUp,
  Activity,
  Calendar,
  Clock,
  Target,
  BarChart3,
} from 'lucide-react-native';
import Card from '../ui/Card';

export default function Dashboard() {
  const { isDark } = useTheme();

  return (
    <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
      <Text className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Dashboard Overview
      </Text>

      {/* Stats Cards Row */}
      <View className="flex-row mb-6">
        <Card variant="elevated" className="flex-1 mr-2 p-4">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
              <CheckSquare size={24} color="#3B82F6" />
            </View>
            <View>
              <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                24
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
                87%
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Completion
              </Text>
            </View>
          </View>
        </Card>
      </View>

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
                18/24
              </Text>
            </View>
            <View className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <View className="h-2 bg-green-500 rounded-full" style={{ width: '75%' }} />
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
      <Card variant="elevated" className="mb-4 p-4">
        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Recent Activity
        </Text>
        <View className="gap-y-3">
          {[
            { title: 'Completed "Review project proposal"', time: '2 hours ago', type: 'task' },
            { title: 'Set reminder for team meeting', time: '4 hours ago', type: 'reminder' },
            { title: 'Updated project documentation', time: '1 day ago', type: 'task' },
            { title: 'Achieved weekly productivity goal', time: '2 days ago', type: 'goal' },
          ].map((activity, index) => (
            <View key={index} className="flex-row items-center">
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                activity.type === 'task' ? 'bg-blue-500' :
                activity.type === 'reminder' ? 'bg-green-500' : 'bg-purple-500'
              }`}>
                {activity.type === 'task' ? (
                  <CheckSquare size={16} color="#FFFFFF" />
                ) : activity.type === 'reminder' ? (
                  <Clock size={16} color="#FFFFFF" />
                ) : (
                  <Target size={16} color="#FFFFFF" />
                )}
              </View>
              <View className="flex-1">
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {activity.title}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {activity.time}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Today's Summary */}
      <Card variant="elevated" className="mb-4 p-4">
        <View className="flex-row items-center mb-4">
          <Calendar size={24} color="#F59E0B" />
          <Text className={`text-lg font-semibold ml-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Today&apos;s Summary
          </Text>
        </View>
        
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              8
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Tasks Due
            </Text>
          </View>
          <View className="items-center">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              5
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Completed
            </Text>
          </View>
          <View className="items-center">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              3
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Reminders
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}