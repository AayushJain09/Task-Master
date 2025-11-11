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
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
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
import Button from '@/components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';

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
    <View className={`flex-1 pb-12 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefreshProfile}
            colors={['#3B82F6']}
            tintColor={isDark ? '#9CA3AF' : '#6B7280'}
            progressBackgroundColor={isDark ? '#1F2937' : '#FFFFFF'}
          />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <LinearGradient
          colors={isDark ? ['#0F172A', '#1D1F39'] : ['#EEF2FF', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginHorizontal: 16,
            marginTop: 24,
            padding: 24,
            borderRadius: 30,
            borderWidth: 1,
            borderColor: isDark ? '#1E3A8A' : '#C7D2FE',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <AccentBlob color={isDark ? '#7C3AED' : '#A5B4FC'} size={220} style={{ right: -60, top: -80 }} />
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-6">
              <Text className={`text-xs uppercase tracking-[0.4em] ${isDark ? 'text-indigo-200' : 'text-indigo-600'}`}>
                Identity
              </Text>
              <Text className={`text-3xl font-black mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.fullName || 'User'}
              </Text>
              <View className="flex-row items-center mt-3">
                <Mail size={16} color={isDark ? '#A5B4FC' : '#475569'} />
                <Text className={`text-sm ml-2 ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>
                  {user?.email || 'No email available'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleManualRefresh}
              disabled={isLoading}
              style={{
                padding: 10,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: isDark ? '#4338CA' : '#E0E7FF',
                backgroundColor: isDark ? 'rgba(67,56,202,0.25)' : 'rgba(224,231,255,0.9)',
              }}
              activeOpacity={0.8}
            >
              <RefreshCw size={18} color={isDark ? '#E0E7FF' : '#4338CA'} />
            </TouchableOpacity>
          </View>

          <View className="items-center mt-8">
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? '#312E81' : '#C7D2FE',
                shadowColor: isDark ? '#000' : '#94A3B8',
                shadowOpacity: 0.6,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 8 },
              }}
            >
              <Text className="text-white text-3xl font-black">
                {user?.firstName?.charAt(0)?.toUpperCase() || user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View className="flex-row gap-3 mt-6">
              {accountStats.map(stat => (
                <View
                  key={stat.label}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: `${stat.color}60`,
                    backgroundColor: `${stat.color}15`,
                  }}
                >
                  <Text style={{ fontSize: 12, color: stat.color, fontWeight: '600' }}>{stat.label}</Text>
                  <Text className={`text-xs mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        <SectionCard
          title="Personal"
          subtitle="Snapshot of your identity data."
          colors={isDark ? ['#111827', '#0F172A'] : ['#FFFFFF', '#F8FAFC']}
          borderColor={isDark ? '#1F2937' : '#E2E8F0'}
          accentColor={isDark ? '#0EA5E9' : '#38BDF8'}
          isDark={isDark}
        >
          {[
            { icon: <User size={16} color="#60A5FA" />, label: 'First Name', value: user?.firstName || 'Not provided' },
            { icon: <User size={16} color="#6366F1" />, label: 'Last Name', value: user?.lastName || 'Not provided' },
            { icon: <Mail size={16} color="#A78BFA" />, label: 'Email', value: user?.email || 'Not provided' },
            {
              icon: <Shield size={16} color="#34D399" />,
              label: 'Role',
              value: user?.role === 'admin' ? 'Administrator' : user?.role === 'moderator' ? 'Moderator' : 'Member',
            },
            {
              icon: <Calendar size={16} color="#FBBF24" />,
              label: 'Member since',
              value: user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Unknown',
            },
          ].map(field => (
            <View key={field.label} className="flex-row items-center mb-4">
              <View className="w-9 h-9 rounded-2xl bg-white/10 items-center justify-center mr-3">{field.icon}</View>
              <View className="flex-1">
                <Text className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {field.label}
                </Text>
                <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {field.value}
                </Text>
              </View>
            </View>
          ))}
        </SectionCard>

        <SectionCard
          title="Status"
          subtitle="Security posture and verification health."
          colors={isDark ? ['#0F172A', '#111827'] : ['#FFFFFF', '#FDF2F8']}
          borderColor={isDark ? '#312E81' : '#FBCFE8'}
          accentColor={isDark ? '#F472B6' : '#F9A8D4'}
          isDark={isDark}
        >
          {[
            {
              icon: <CheckCircle size={18} color={user?.isEmailVerified ? '#10B981' : '#F87171'} />,
              title: 'Email verified',
              value: user?.isEmailVerified ? 'Yes' : 'No',
              badgeColor: user?.isEmailVerified ? '#10B981' : '#F87171',
            },
            {
              icon: <Fingerprint size={18} color={biometricEnabled ? '#3B82F6' : '#64748B'} />,
              title: 'Biometric unlock',
              value: biometricEnabled ? 'Enabled' : 'Disabled',
              badgeColor: biometricEnabled ? '#3B82F6' : '#64748B',
            },
          ].map(status => (
            <View
              key={status.title}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
              }}
            >
              <View className="flex-row items-center">
                <View className="mr-3">{status.icon}</View>
                <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {status.title}
                </Text>
              </View>
              <View
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: `${status.badgeColor}22`,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: status.badgeColor }}>{status.value}</Text>
              </View>
            </View>
          ))}
        </SectionCard>

        <View className="mx-4 mt-2">
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

const SectionCard = ({
  title,
  subtitle,
  colors,
  borderColor,
  accentColor,
  isDark,
  children,
}: {
  title: string;
  subtitle: string;
  colors: [string, string];
  borderColor: string;
  accentColor: string;
  isDark: boolean;
  children: React.ReactNode;
}) => (
  <LinearGradient
    colors={colors}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      marginHorizontal: 16,
      marginTop: 20,
      borderRadius: 26,
      padding: 20,
      borderWidth: 1,
      borderColor,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <AccentBlob color={accentColor} size={160} style={{ right: -60, top: -60 }} />
    <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</Text>
    <Text className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{subtitle}</Text>
    <View className="mt-4">{children}</View>
  </LinearGradient>
);

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
