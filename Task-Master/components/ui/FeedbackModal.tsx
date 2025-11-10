import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

export interface FeedbackModalProps {
  visible: boolean;
  variant?: 'success' | 'error';
  title?: string;
  message?: string;
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  onRequestClose?: () => void;
  onRequestClose?: () => void;
  accentColor?: string;
}

/**
 * Lightweight modal for success/error states. Accepts optional actions so screens
 * can drive custom flows without duplicating UI.
 */
const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  variant = 'success',
  title,
  message,
  primaryAction,
  secondaryAction,
  onRequestClose,
  accentColor = '#3B82F6',
}) => {
  const { isDark } = useTheme();
  const isSuccess = variant === 'success';
  const iconColor = isSuccess ? '#10B981' : '#DC2626';

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className={`w-full rounded-2xl p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <View className="items-center mb-4">
            {isSuccess ? (
              <CheckCircle size={48} color={iconColor} />
            ) : (
              <AlertTriangle size={48} color={iconColor} />
            )}
          </View>
          {title && (
            <Text className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </Text>
          )}
          {message && (
            <Text className={`text-center mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {message}
            </Text>
          )}
          <View className="gap-y-3">
            {primaryAction && (
              <TouchableOpacity
                onPress={primaryAction.onPress}
                className="py-3 rounded-xl bg-blue-600"
              >
                <Text className="text-center text-white font-semibold text-base">
                  {primaryAction.label}
                </Text>
              </TouchableOpacity>
            )}
            {secondaryAction && (
              <TouchableOpacity
                onPress={secondaryAction.onPress}
                className={`py-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
              >
                <Text className={`text-center font-semibold text-base ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {secondaryAction.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FeedbackModal;
