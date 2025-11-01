import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { 
  BarChart3, 
  CheckSquare, 
  Users, 
  Settings as SettingsIcon,
  Home,
  TrendingUp,
  Activity,
  Calendar,
  Clock,
} from 'lucide-react-native';
import Card from './Card';

interface DrawerContentProps {
  activeOption: string;
}

export default function DrawerContent({ activeOption }: DrawerContentProps) {
  const { isDark } = useTheme();

  const renderDashboard = () => (
    <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
      <Text className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Dashboard Overview
      </Text>

      <View className="flex-row mb-4">
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
                Tasks
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
                Progress
              </Text>
            </View>
          </View>
        </Card>
      </View>

      <Card variant="elevated" className="mb-4 p-4">
        <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Recent Activity
        </Text>
        <View className="space-y-3">
          {[
            { title: 'Completed project review', time: '2 hours ago' },
            { title: 'Updated team documentation', time: '4 hours ago' },
            { title: 'Meeting with design team', time: '1 day ago' },
          ].map((activity, index) => (
            <View key={index} className="flex-row items-center">
              <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-3">
                <Activity size={16} color="#FFFFFF" />
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
    </ScrollView>
  );

  const renderAnalytics = () => (
    <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
      <Text className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Analytics & Reports
      </Text>

      <Card variant="elevated" className="mb-4 p-4">
        <View className="flex-row items-center mb-4">
          <BarChart3 size={24} color="#3B82F6" />
          <Text className={`text-lg font-semibold ml-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Performance Metrics
          </Text>
        </View>
        
        <View className="space-y-4">
          <View>
            <View className="flex-row justify-between mb-2">
              <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Task Completion Rate
              </Text>
              <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                87%
              </Text>
            </View>
            <View className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <View className="h-2 bg-green-500 rounded-full" style={{ width: '87%' }} />
            </View>
          </View>

          <View>
            <View className="flex-row justify-between mb-2">
              <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Project Progress
              </Text>
              <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                65%
              </Text>
            </View>
            <View className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <View className="h-2 bg-blue-500 rounded-full" style={{ width: '65%' }} />
            </View>
          </View>

          <View>
            <View className="flex-row justify-between mb-2">
              <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Team Collaboration
              </Text>
              <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                92%
              </Text>
            </View>
            <View className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <View className="h-2 bg-purple-500 rounded-full" style={{ width: '92%' }} />
            </View>
          </View>
        </View>
      </Card>
    </ScrollView>
  );

  const renderTasks = () => (
    <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
      <Text className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Task Management
      </Text>

      <Card variant="elevated" className="mb-4 p-4">
        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Today's Tasks
        </Text>
        
        {[
          { title: 'Review project proposal', priority: 'high', completed: false },
          { title: 'Update client documentation', priority: 'medium', completed: true },
          { title: 'Team standup meeting', priority: 'low', completed: false },
          { title: 'Code review session', priority: 'high', completed: false },
        ].map((task, index) => (
          <View key={index} className={`flex-row items-center py-3 ${index !== 3 ? 'border-b border-gray-200' : ''}`}>
            <View className={`w-4 h-4 rounded-full mr-3 ${
              task.completed ? 'bg-green-500' : 'border-2 border-gray-400'
            }`} />
            <View className="flex-1">
              <Text className={`font-medium ${
                task.completed 
                  ? isDark ? 'text-gray-500 line-through' : 'text-gray-400 line-through'
                  : isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {task.title}
              </Text>
              <View className="flex-row items-center mt-1">
                <View className={`px-2 py-1 rounded-full ${
                  task.priority === 'high' ? 'bg-red-100' :
                  task.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <Text className={`text-xs font-medium ${
                    task.priority === 'high' ? 'text-red-700' :
                    task.priority === 'medium' ? 'text-yellow-700' : 'text-green-700'
                  }`}>
                    {task.priority}
                  </Text>
                </View>
                <Clock size={12} color={isDark ? '#9CA3AF' : '#6B7280'} style={{ marginLeft: 8 }} />
                <Text className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Due today
                </Text>
              </View>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );

  const renderProfile = () => (
    <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
      <Text className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Profile Information
      </Text>

      <Card variant="elevated" className="mb-4 p-4">
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center mb-3">
            <Text className="text-white text-2xl font-bold">JD</Text>
          </View>
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            John Doe
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Product Manager
          </Text>
        </View>

        <View className="space-y-4">
          <View className="flex-row justify-between">
            <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </Text>
            <Text className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
              john.doe@company.com
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Projects
            </Text>
            <Text className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
              12 Active
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Team Members
            </Text>
            <Text className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
              8 People
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
      <Text className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Settings & Preferences
      </Text>

      <Card variant="elevated" className="mb-4 p-4">
        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Application Settings
        </Text>
        
        {[
          { title: 'Notifications', description: 'Manage your notification preferences' },
          { title: 'Privacy', description: 'Control your privacy settings' },
          { title: 'Theme', description: 'Choose your preferred theme' },
          { title: 'Language', description: 'Select your language' },
          { title: 'Data & Storage', description: 'Manage your data usage' },
        ].map((setting, index) => (
          <View key={index} className={`py-4 ${index !== 4 ? 'border-b border-gray-200' : ''}`}>
            <View className="flex-row items-center">
              <SettingsIcon size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <View className="ml-3 flex-1">
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {setting.title}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {setting.description}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );

  switch (activeOption) {
    case 'dashboard':
      return renderDashboard();
    case 'analytics':
      return renderAnalytics();
    case 'tasks':
      return renderTasks();
    case 'profile':
      return renderProfile();
    case 'settings':
      return renderSettings();
    default:
      return renderDashboard();
  }
}