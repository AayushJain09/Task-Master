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
  Globe,
  CircleHelp as HelpCircle,
  Info,
  ChevronRight,
  Vibrate,
  Lock,
  Fingerprint,
} from 'lucide-react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { ThemeSegmentedControl } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
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
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)',
        backgroundColor: isDark ? 'rgba(15,23,42,0.65)' : 'rgba(255,255,255,0.82)',
        marginBottom: 12,
        shadowColor: isDark ? '#000000' : '#CBD5F5',
        shadowOpacity: isDark ? 0.45 : 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      }}
      onPress={onPress}
      disabled={showSwitch}
      activeOpacity={0.85}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          backgroundColor: isDark ? 'rgba(79,70,229,0.18)' : 'rgba(219,234,254,0.8)',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: isDark ? '#F8FAFC' : '#111827',
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 13,
              marginTop: 4,
              color: isDark ? '#94A3B8' : '#4B5563',
            }}
          >
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
            true: '#3B82F6',
          }}
          thumbColor="#FFFFFF"
        />
      ) : (
        showChevron && (
          <ChevronRight size={20} color={isDark ? '#94A3B8' : '#94A3B8'} />
        )
      )}
    </TouchableOpacity>
  );
};

interface SettingsSectionProps {
  title: string;
  subtitle: string;
  colors: [string, string];
  borderColor: string;
  accentColor: string;
  isDark: boolean;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  subtitle,
  colors,
  borderColor,
  accentColor,
  isDark,
  children,
}) => (
  <LinearGradient
    colors={colors}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      borderRadius: 26,
      padding: 20,
      marginHorizontal: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <AccentBlob color={accentColor} size={160} style={{ right: -60, top: -80 }} />
    <Text
      style={{
        fontSize: 18,
        fontWeight: '700',
        color: isDark ? '#F8FAFC' : '#0F172A',
      }}
    >
      {title}
    </Text>
    <Text
      style={{
        fontSize: 12,
        marginTop: 4,
        color: isDark ? '#CBD5F5' : '#475569',
      }}
    >
      {subtitle}
    </Text>
    <View style={{ marginTop: 18 }}>{children}</View>
  </LinearGradient>
);

export default function SettingsScreen() {
  const { isDark, theme } = useTheme();
  const { biometricEnabled, setupBiometric, disableBiometric } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [sessionAlertsEnabled, setSessionAlertsEnabled] = useState(true);
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
    <View className={`flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 24 }}
      >
        <LinearGradient
          colors={isDark ? ['#0F172A', '#1F1B3A'] : ['#EFF6FF', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginHorizontal: 16,
            marginBottom: 24,
            padding: 24,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <AccentBlob color={isDark ? '#1D4ED8' : '#93C5FD'} size={180} style={{ right: -50, top: -60 }} />
          <Text className={`text-xs uppercase tracking-[0.4em] ${isDark ? 'text-indigo-200' : 'text-indigo-600'}`}>
            Control Center
          </Text>
          <Text className={`text-3xl font-black mt-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Settings
          </Text>
          <Text className={`text-sm mt-2 max-w-[250px] leading-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Tailor notifications, security, and theming to match how you work best.
          </Text>
        </LinearGradient>

        <SettingsSection
          title="Security"
          subtitle="Keep your workspace locked down."
          colors={isDark ? ['#111827', '#0F172A'] : ['#FDF2F8', '#FFFFFF']}
          borderColor={isDark ? '#312E81' : '#FBCFE8'}
          accentColor={isDark ? '#BE185D' : '#F472B6'}
          isDark={isDark}
        >
          <SettingItem
            icon={<Fingerprint size={20} color={isDark ? '#C084FC' : '#7C3AED'} />}
            title="Biometric authentication"
            subtitle={
              canUseBiometric
                ? biometricEnabled
                  ? 'Enabled for quick sign-ins'
                  : 'Use Face ID / Touch ID to unlock faster'
                : 'Not available on this device'
            }
            showSwitch={canUseBiometric}
            switchValue={biometricEnabled}
            onSwitchChange={handleBiometricToggle}
          />
          <SettingItem
            icon={<Shield size={20} color={isDark ? '#F87171' : '#DC2626'} />}
            title="Privacy & security"
            subtitle="Manage data export, sessions, and access"
            onPress={handlePrivacyPress}
          />
          <SettingItem
            icon={<Lock size={20} color={isDark ? '#FBBF24' : '#D97706'} />}
            title="Session alerts"
            subtitle="Notify me when a new device signs in"
            showSwitch
            switchValue={sessionAlertsEnabled}
            onSwitchChange={setSessionAlertsEnabled}
          />
        </SettingsSection>

        <SettingsSection
          title="Experience"
          subtitle="Tune interactions, feedback, and localization."
          colors={isDark ? ['#0F172A', '#111827'] : ['#ECFEFF', '#FFFFFF']}
          borderColor={isDark ? '#0EA5E9' : '#A5F3FC'}
          accentColor={isDark ? '#06B6D4' : '#67E8F9'}
          isDark={isDark}
        >
          <SettingItem
            icon={<Bell size={20} color={isDark ? '#60A5FA' : '#2563EB'} />}
            title="Push notifications"
            subtitle="Sprint reminders, mentions, and alerts"
            showSwitch
            switchValue={notificationsEnabled}
            onSwitchChange={setNotificationsEnabled}
          />
          <SettingItem
            icon={<Vibrate size={20} color={isDark ? '#34D399' : '#059669'} />}
            title="Haptic feedback"
            subtitle="Vibrate on task updates and nudges"
            showSwitch
            switchValue={vibrationEnabled}
            onSwitchChange={setVibrationEnabled}
          />
          <SettingItem
            icon={<Globe size={20} color={isDark ? '#FDE68A' : '#D97706'} />}
            title="Language"
            subtitle="English (US)"
            onPress={handleLanguagePress}
          />
        </SettingsSection>

        <SettingsSection
          title="Theme & appearance"
          subtitle="Choose the vibe that matches your focus."
          colors={isDark ? ['#1B1C3B', '#111827'] : ['#FAF5FF', '#FFFFFF']}
          borderColor={isDark ? '#7C3AED' : '#E9D5FF'}
          accentColor={isDark ? '#8B5CF6' : '#C084FC'}
          isDark={isDark}
        >
          <View
            style={{
              borderRadius: 18,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
              padding: 16,
              backgroundColor: isDark ? 'rgba(17,24,39,0.7)' : 'rgba(255,255,255,0.9)',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: isDark ? '#E0E7FF' : '#312E81',
                marginBottom: 10,
              }}
            >
              Colorway
            </Text>
            <ThemeSegmentedControl />
            <Text
              style={{
                fontSize: 12,
                marginTop: 12,
                color: isDark ? '#A5B4FC' : '#7C3AED',
              }}
            >
              Current theme: {theme === 'dark' ? 'Dark' : 'Light'}
            </Text>
          </View>
        </SettingsSection>

        <SettingsSection
          title="Support"
          subtitle="Learn more, get help, or peek behind the curtain."
          colors={isDark ? ['#0F172A', '#111827'] : ['#F8FAFC', '#FFFFFF']}
          borderColor={isDark ? '#1F2937' : '#E2E8F0'}
          accentColor={isDark ? '#38BDF8' : '#93C5FD'}
          isDark={isDark}
        >
          <SettingItem
            icon={<HelpCircle size={20} color={isDark ? '#FBBF24' : '#D97706'} />}
            title="Help & support"
            subtitle="Guides, FAQs, live chat"
            onPress={handleHelpPress}
          />
          <SettingItem
            icon={<Info size={20} color={isDark ? '#A5B4FC' : '#6366F1'} />}
            title="About"
            subtitle={`Version ${APP_CONFIG.VERSION}`}
            onPress={handleAboutPress}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

/**
 * Accent blob helper to keep gradients vector-inspired without static assets.
 */
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
        opacity: 0.3,
      },
      style,
    ]}
  />
);
