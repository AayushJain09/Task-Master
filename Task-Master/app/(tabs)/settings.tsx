import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Bell,
  Shield,
  Palette,
  Globe,
  CircleHelp as HelpCircle,
  Info,
  ChevronRight,
  Moon,
  Vibrate,
  Lock,
  Fingerprint,
} from 'lucide-react-native';

import Card from '@/components/ui/Card';
import { ThemeSegmentedControl } from '@/components/ui/ThemeToggle';
import { useTheme, useThemeStyles } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { biometricService } from '@/services/biometric.service';
import { APP_CONFIG } from '@/config/constants';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  showChevron?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showSwitch = false,
  switchValue = false,
  onSwitchChange,
  showChevron = true,
}) => {
  const { isDark } = useTheme();
  
  return (
    <TouchableOpacity
      className={`flex-row items-center py-4 ${
        isDark ? 'border-gray-700' : 'border-gray-100'
      } border-b last:border-b-0`}
      onPress={onPress}
      disabled={showSwitch}
    >
      <View className="mr-3">{icon}</View>
      <View className="flex-1">
        <Text className={`text-base font-medium ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {title}
        </Text>
        {subtitle && (
          <Text className={`text-sm mt-1 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {subtitle}
          </Text>
        )}
      </View>
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ 
            false: isDark ? '#374151' : '#E5E7EB', 
            true: '#3B82F6' 
          }}
          thumbColor="#FFFFFF"
        />
      ) : (
        showChevron && (
          <ChevronRight 
            size={20} 
            color={isDark ? '#6B7280' : '#9CA3AF'} 
          />
        )
      )}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const { isDark, theme } = useTheme();
  const { biometricEnabled, setupBiometric, disableBiometric } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [canUseBiometric, setCanUseBiometric] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const capabilities = await biometricService.checkBiometricCapabilities();
      setCanUseBiometric(capabilities.hasHardware && capabilities.isEnrolled);
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      setCanUseBiometric(false);
    }
  };

  const handleNotificationPress = () => {
    Alert.alert(
      'Notifications',
      'Configure your notification preferences here.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPress = () => {
    Alert.alert(
      'Privacy & Security',
      'Manage your privacy and security settings.',
      [{ text: 'OK' }]
    );
  };

  const handleLanguagePress = () => {
    Alert.alert('Language', 'Select your preferred language.', [
      { text: 'OK' },
    ]);
  };


  const handleHelpPress = () => {
    Alert.alert('Help & Support', 'Get help and support for using the app.', [
      { text: 'OK' },
    ]);
  };

  const handleAboutPress = () => {
    Alert.alert(
      'About',
      `${APP_CONFIG.NAME}\nVersion ${APP_CONFIG.VERSION}\n\nBuilt with Expo and React Native`,
      [{ text: 'OK' }]
    );
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      
      if (enabled) {
        if (!canUseBiometric) {
          Alert.alert(
            'Biometric Not Available',
            'Biometric authentication is not available on this device or not set up.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        await setupBiometric();
        Alert.alert(
          'Biometric Enabled',
          'Biometric authentication has been enabled successfully.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Disable Biometric',
          'Are you sure you want to disable biometric authentication?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                try {
                  await disableBiometric();
                  Alert.alert(
                    'Biometric Disabled',
                    'Biometric authentication has been disabled.',
                    [{ text: 'OK' }]
                  );
                } catch (error: any) {
                  Alert.alert('Error', error.message);
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className={`px-4 py-4 w-full ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-b`}>
        <Text className={`text-2xl font-bold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Settings
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 0 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Security */}
        <Card variant="elevated" className="mx-4 mb-4">
          <Text className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Security
          </Text>

          <SettingItem
            icon={<Fingerprint size={20} color="#8B5CF6" />}
            title="Biometric Authentication"
            subtitle={canUseBiometric ? 
              (biometricEnabled ? "Enabled" : "Use fingerprint or face ID to sign in") :
              "Not available on this device"
            }
            showSwitch={canUseBiometric}
            switchValue={biometricEnabled}
            onSwitchChange={handleBiometricToggle}
          />

          <SettingItem
            icon={<Shield size={20} color="#EF4444" />}
            title="Privacy & Security"
            subtitle="Manage data and security settings"
            onPress={handlePrivacyPress}
          />
        </Card>

        {/* Preferences */}
        <Card variant="elevated" className="mx-4 mb-4">
          <Text className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Preferences
          </Text>

          <SettingItem
            icon={<Bell size={20} color="#3B82F6" />}
            title="Notifications"
            subtitle="Push notifications and alerts"
            showSwitch
            switchValue={notificationsEnabled}
            onSwitchChange={setNotificationsEnabled}
          />

          <SettingItem
            icon={<Vibrate size={20} color="#10B981" />}
            title="Vibration"
            subtitle="Haptic feedback"
            showSwitch
            switchValue={vibrationEnabled}
            onSwitchChange={setVibrationEnabled}
          />

          <SettingItem
            icon={<Globe size={20} color="#06B6D4" />}
            title="Language"
            subtitle="English (US)"
            onPress={handleLanguagePress}
          />
        </Card>

        {/* Theme Selection */}
        <Card variant="elevated" className="mx-4 mb-4">
          <Text className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Theme
          </Text>
          
          <View className="mb-3">
            <Text className={`text-sm font-medium mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Choose your preferred theme
            </Text>
            <ThemeSegmentedControl />
          </View>

          <View className={`pt-3 mt-3 ${
            isDark ? 'border-gray-700' : 'border-gray-100'
          } border-t`}>
            <Text className={`text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Current theme: {theme === 'system' ? 'System (Auto)' : theme === 'dark' ? 'Dark' : 'Light'}
            </Text>
          </View>
        </Card>

        {/* Support */}
        <Card variant="elevated" className="mx-4 mb-4">
          <Text className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Support
          </Text>

          <SettingItem
            icon={<HelpCircle size={20} color="#F59E0B" />}
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={handleHelpPress}
          />

          <SettingItem
            icon={<Info size={20} color="#6366F1" />}
            title="About"
            subtitle={`Version ${APP_CONFIG.VERSION}`}
            onPress={handleAboutPress}
          />
        </Card>

      </ScrollView>
    </View>
  );
}
