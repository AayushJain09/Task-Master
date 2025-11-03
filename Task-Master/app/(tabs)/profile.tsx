/**
 * Profile Screen Component
 * 
 * This component provides a comprehensive user profile interface with the following features:
 * - User information display with real-time data from authentication context
 * - Account status indicators (active, email verified, biometric security)
 * - Dark/light mode theme support with proper contrast
 * - Pull-to-refresh functionality for real-time profile updates
 * - Manual refresh option with loading states
 * - Quick action menu for profile management
 * - Secure logout functionality with confirmation
 * - Responsive design with proper spacing and layout
 * 
 * Profile Information Displayed:
 * - User avatar (initial-based fallback when no image available)
 * - Full name and email address
 * - Account status indicators with color-coded badges
 * - Account details including role, join date, and last login
 * - Quick action buttons for common tasks
 * 
 * Features:
 * - Real-time profile data synchronization
 * - Theme-aware styling and colors
 * - Accessibility support with proper labeling
 * - Loading states during profile operations
 * - Error handling with user-friendly messages
 * 
 * @component
 * @example
 * // Used in tab navigation - typically at /(tabs)/profile
 * <ProfileScreen />
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Mail,
  Calendar,
  Shield,
  CheckCircle,
  LogOut,
  RefreshCw,
  User,
  Fingerprint,
} from 'lucide-react-native';

// Context and components
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

/**
 * Profile Screen Component
 * 
 * Displays comprehensive user profile information with management options.
 * Integrates with AuthContext for user data and ThemeContext for styling.
 */
export default function ProfileScreen() {
  // ================================
  // HOOKS AND STATE
  // ================================
  
  /** Authentication context for user data and profile operations */
  const { user, biometricEnabled, logout, refreshProfile } = useAuth();
  
  // console.log("user", user);
  /** Theme context for dark/light mode styling */
  const { isDark } = useTheme();
  
  /** Loading state for manual refresh and logout operations */
  const [isLoading, setIsLoading] = useState(false);
  
  /** Loading state for pull-to-refresh functionality */
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ================================
  // EVENT HANDLERS
  // ================================

  /**
   * Handles user logout with confirmation dialog
   * 
   * Shows a confirmation alert before proceeding with logout.
   * Manages loading state during the logout process and handles errors.
   */
  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            await logout();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };


  /**
   * Handles pull-to-refresh profile data update
   * 
   * Called automatically when user pulls down on the ScrollView.
   * Updates profile data in the background and handles errors gracefully.
   * 
   * @async
   */
  const handleRefreshProfile = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refreshProfile();
      console.log('Profile refreshed successfully');

    } catch (error: any) {
      console.error('Profile refresh error:', error);
      Alert.alert(
        'Refresh Failed', 
        error.message || 'Failed to refresh profile. Please try again.'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshProfile]);

  /**
   * Handles manual profile refresh via header button
   * 
   * Provides manual refresh option with loading indicator and success feedback.
   * Shows loading state on refresh button and displays success/error messages.
   * 
   * @async
   */
  const handleManualRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      await refreshProfile();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Manual refresh error:', error);
      Alert.alert(
        'Refresh Failed', 
        error.message || 'Failed to refresh profile. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  // ================================
  // DATA CONFIGURATION
  // ================================
  
  /**
   * Essential account status indicators
   * 
   * Shows only the most important account information:
   * - Email verification status
   * - Account active status
   */
  const accountStats = [
    { 
      label: 'Email Verified', 
      value: user?.isEmailVerified ? 'Yes' : 'No',
      color: user?.isEmailVerified ? '#10B981' : '#EF4444'
    },
    { 
      label: 'Biometric', 
      value: biometricEnabled ? 'Enabled' : 'Disabled',
      color: biometricEnabled ? '#3B82F6' : '#6B7280'
    },
    { 
      label: 'Account', 
      value: user?.isActive ? 'Active' : 'Inactive',
      color: user?.isActive ? '#10B981' : '#EF4444'
    },
  ];


  // ================================
  // COMPONENT RENDER
  // ================================
  
  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className={`px-4 py-4 border-b flex-row items-center justify-between ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <Text className={`text-2xl font-bold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Profile
        </Text>
        
        <TouchableOpacity
          onPress={handleManualRefresh}
          disabled={isLoading}
          className={`p-2 rounded-full ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          } ${isLoading ? 'opacity-50' : ''}`}
        >
          <RefreshCw 
            size={20} 
            color={isDark ? '#9CA3AF' : '#6B7280'} 
            className={isLoading ? 'animate-spin' : ''}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefreshProfile}
            colors={['#3B82F6']}
            tintColor={isDark ? '#9CA3AF' : '#6B7280'}
            progressBackgroundColor={isDark ? '#374151' : '#F9FAFB'}
          />
        }
      >
        {/* Profile Header */}
        <Card variant="elevated" className="m-4">
          <View className="items-center">
            {/* Profile Picture */}
            <View className="relative mb-4">
              {false ? ( // Avatar not implemented in backend yet
                <Image
                  source={{ uri: '' }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <View className="w-24 h-24 bg-blue-500 rounded-full items-center justify-center">
                  <Text className="text-white text-2xl font-bold">
                    {user?.firstName?.charAt(0)?.toUpperCase() || user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>

            {/* User Info */}
            <Text className={`text-xl font-bold mb-1 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.fullName || 'User'}
            </Text>

            <View className="flex-row items-center mb-4">
              <Mail size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`text-sm ml-1 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {user?.email || 'No email available'}
              </Text>
            </View>

            {/* Account Status */}
            <View className={`flex-row w-full justify-around py-4 border-t ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              {accountStats.map((stat, index) => (
                <View key={index} className="items-center flex-1">
                  <View className="flex-row items-center mb-1">
                    <View 
                      className="w-2 h-2 rounded-full mr-1" 
                      style={{ backgroundColor: stat.color }}
                    />
                    <Text className={`text-sm font-semibold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`} style={{ color: stat.color }}>
                      {stat.value}
                    </Text>
                  </View>
                  <Text className={`text-xs text-center ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* User Details */}
        <Card variant="elevated" className="mx-4 mb-4">
          <Text className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Personal Information
          </Text>

          <View className="gap-y-3">
            <View className="flex-row items-center">
              <User size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`text-base ml-3 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                First Name: {user?.firstName || 'Not provided'}
              </Text>
            </View>

            <View className="flex-row items-center">
              <User size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`text-base ml-3 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Last Name: {user?.lastName || 'Not provided'}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Mail size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`text-base ml-3 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email: {user?.email || 'Not provided'}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Shield size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`text-base ml-3 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Role: {user?.role === 'admin' ? 'Administrator' : user?.role === 'moderator' ? 'Moderator' : 'User'}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Calendar size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`text-base ml-3 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Member Since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Unknown'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Account Status */}
        <Card variant="elevated" className="mx-4 mb-4">
          <Text className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Account Status
          </Text>

          <View className="gap-y-3">
            <View className="flex-row items-center">
              <CheckCircle 
                size={16} 
                color={user?.isEmailVerified ? '#10B981' : '#EF4444'} 
              />
              <Text className={`text-base ml-3 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Verified: {
                  <Text style={{ color: user?.isEmailVerified ? '#10B981' : '#EF4444' }}>
                    {user?.isEmailVerified ? 'Yes' : 'No'}
                  </Text>
                }
              </Text>
            </View>

            <View className="flex-row items-center">
              <Fingerprint 
                size={16} 
                color={biometricEnabled ? '#3B82F6' : '#6B7280'} 
              />
              <Text className={`text-base ml-3 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Biometric Enabled: {
                  <Text style={{ color: biometricEnabled ? '#3B82F6' : '#6B7280' }}>
                    {biometricEnabled ? 'Yes' : 'No'}
                  </Text>
                }
              </Text>
            </View>
          </View>
        </Card>


        {/* Logout Button */}
        <View className="mx-4">
          <Button
            title="Sign Out"
            variant="outline"
            onPress={handleLogout}
            loading={isLoading}
            leftIcon={<LogOut size={18} color="#EF4444" />}
            fullWidth
            className="border-red-500"
          />
        </View>
      </ScrollView>
    </View>
  );
}
