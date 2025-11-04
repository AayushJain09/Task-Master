import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { 
  Bell,
  Plus,
  Clock,
  Calendar,
  AlarmClock,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Repeat,
} from 'lucide-react-native';
import Card from '../ui/Card';

export default function Reminders() {
  const { isDark } = useTheme();

  const reminders = [
    {
      id: 1,
      title: 'Team meeting in conference room',
      time: '10:00 AM',
      date: 'Today',
      type: 'meeting',
      status: 'active',
      recurring: false,
    },
    {
      id: 2,
      title: 'Submit weekly report',
      time: '5:00 PM',
      date: 'Today',
      type: 'deadline',
      status: 'active',
      recurring: false,
    },
    {
      id: 3,
      title: 'Take medication',
      time: '8:00 AM',
      date: 'Daily',
      type: 'health',
      status: 'completed',
      recurring: true,
    },
    {
      id: 4,
      title: 'Call client about project updates',
      time: '2:00 PM',
      date: 'Tomorrow',
      type: 'work',
      status: 'active',
      recurring: false,
    },
    {
      id: 5,
      title: 'Gym workout session',
      time: '7:00 PM',
      date: 'Today',
      type: 'personal',
      status: 'missed',
      recurring: true,
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: '#3B82F6' };
      case 'deadline': return { bg: 'bg-red-100', text: 'text-red-700', icon: '#EF4444' };
      case 'health': return { bg: 'bg-green-100', text: 'text-green-700', icon: '#10B981' };
      case 'work': return { bg: 'bg-purple-100', text: 'text-purple-700', icon: '#8B5CF6' };
      case 'personal': return { bg: 'bg-orange-100', text: 'text-orange-700', icon: '#F59E0B' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', icon: '#6B7280' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={20} color="#10B981" />;
      case 'missed': return <AlertCircle size={20} color="#EF4444" />;
      default: return <Bell size={20} color="#3B82F6" />;
    }
  };

  return (
    <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Reminders
        </Text>
        <TouchableOpacity className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center">
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View className="flex-row mb-6 gap-x-3">
        <Card variant="elevated" className="flex-1 p-3">
          <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {reminders.filter(r => r.status === 'active').length}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Active
          </Text>
        </Card>
        <Card variant="elevated" className="flex-1 p-3">
          <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {reminders.filter(r => r.date === 'Today').length}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Today
          </Text>
        </Card>
        <Card variant="elevated" className="flex-1 p-3">
          <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {reminders.filter(r => r.recurring).length}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Recurring
          </Text>
        </Card>
      </View>

      {/* Today's Reminders */}
      <Card variant="elevated" className="mb-6 p-4">
        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Today&apos;s Reminders
        </Text>
        
        {reminders
          .filter(reminder => reminder.date === 'Today')
          .map((reminder, index, filteredReminders) => {
            const typeColors = getTypeColor(reminder.type);
            
            return (
              <View 
                key={reminder.id} 
                className={`py-4 ${index !== filteredReminders.length - 1 ? `border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}` : ''}`}
              >
                <View className="flex-row items-start">
                  <View className="mr-3 mt-1">
                    {getStatusIcon(reminder.status)}
                  </View>
                  
                  <View className="flex-1">
                    <Text className={`font-medium text-base ${
                      reminder.status === 'completed' 
                        ? isDark ? 'text-gray-500 line-through' : 'text-gray-400 line-through'
                        : reminder.status === 'missed'
                        ? isDark ? 'text-red-400' : 'text-red-600'
                        : isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {reminder.title}
                    </Text>
                    
                    <View className="flex-row items-center mt-2 gap-x-3">
                      {/* Time */}
                      <View className="flex-row items-center">
                        <Clock size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                        <Text className={`text-sm ml-1 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {reminder.time}
                        </Text>
                      </View>
                      
                      {/* Type Badge */}
                      <View className={`px-2 py-1 rounded-full ${typeColors.bg}`}>
                        <Text className={`text-xs font-medium ${typeColors.text}`}>
                          {reminder.type.toUpperCase()}
                        </Text>
                      </View>
                      
                      {/* Recurring Indicator */}
                      {reminder.recurring && (
                        <View className="flex-row items-center">
                          <Repeat size={12} color={isDark ? '#9CA3AF' : '#6B7280'} />
                          <Text className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Recurring
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {/* Sound Indicator */}
                  <TouchableOpacity className="ml-2">
                    <Volume2 size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
      </Card>

      {/* Upcoming Reminders */}
      <Card variant="elevated" className="mb-6 p-4">
        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Upcoming Reminders
        </Text>
        
        {reminders
          .filter(reminder => reminder.date !== 'Today' && reminder.date !== 'Daily')
          .map((reminder, index, filteredReminders) => {
            const typeColors = getTypeColor(reminder.type);
            
            return (
              <View 
                key={reminder.id} 
                className={`py-3 ${index !== filteredReminders.length - 1 ? `border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}` : ''}`}
              >
                <View className="flex-row items-center">
                  <View className={`w-8 h-8 rounded-full items-center justify-center mr-3`} style={{ backgroundColor: typeColors.icon }}>
                    <Bell size={14} color="#FFFFFF" />
                  </View>
                  
                  <View className="flex-1">
                    <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {reminder.title}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Calendar size={12} color={isDark ? '#9CA3AF' : '#6B7280'} />
                      <Text className={`text-sm ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {reminder.date} at {reminder.time}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
      </Card>

      {/* Quick Actions */}
      <Card variant="elevated" className="mb-4 p-4">
        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Quick Actions
        </Text>
        
        <View className="gap-y-3">
          <TouchableOpacity className={`flex-row items-center p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <Plus size={20} color="#3B82F6" />
            <Text className={`ml-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Add New Reminder
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity className={`flex-row items-center p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <AlarmClock size={20} color="#10B981" />
            <Text className={`ml-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Set Quick Timer
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity className={`flex-row items-center p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <Repeat size={20} color="#8B5CF6" />
            <Text className={`ml-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Manage Recurring
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
}