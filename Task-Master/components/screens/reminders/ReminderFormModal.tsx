import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ReminderCategory, palette } from './data';

export interface ReminderFormValues {
  id?: string;
  title: string;
  date: string;
  time: string;
  category: ReminderCategory;
  notes?: string;
  relatedTask?: string;
}

interface ReminderFormModalProps {
  visible: boolean;
  isDark: boolean;
  initialValues?: Partial<ReminderFormValues>;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: ReminderFormValues) => void;
}

/**
 * ReminderFormModal
 *
 * Glide-in modal used for both creating and editing reminders. The wrapper handles:
 * - Animated entrance/exit (fade + translate)
 * - Keyboard-safe layout via `KeyboardAvoidingView`
 * - Controlled form state for title, date, time, category, and notes
 * - Optional related task field for "Add reminder to task"
 */
export const ReminderFormModal: React.FC<ReminderFormModalProps> = ({
  visible,
  isDark,
  initialValues,
  mode,
  onClose,
  onSubmit,
}) => {
  const [formValues, setFormValues] = useState<ReminderFormValues>({
    id: undefined,
    title: '',
    date: '',
    time: '',
    category: 'work',
    notes: '',
    relatedTask: '',
  });
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      const payload = initialValues ?? {};
      setFormValues({
        id: payload.id,
        title: payload.title ?? '',
        date: payload.date ?? '',
        time: payload.time ?? '',
        category: payload.category ?? 'work',
        notes: payload.notes ?? '',
        relatedTask: payload.relatedTask ?? '',
      });
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 40, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, initialValues, opacity, translateY]);

  const headerLabel = mode === 'edit' ? 'Edit reminder' : 'Create reminder';

  const categoryOptions = useMemo<ReminderCategory[]>(() => ['work', 'personal', 'health', 'deadline'], []);

  const handleChange = (key: keyof ReminderFormValues, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!formValues.title.trim() || !formValues.date || !formValues.time) {
      return;
    }
    onSubmit(formValues);
    onClose();
  };

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(5, 11, 21, 0.65)',
            opacity,
            justifyContent: 'flex-end',
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <Animated.View
            style={{
              transform: [{ translateY }],
            }}
          >
            <LinearGradient
              colors={isDark ? ['#050B15', '#0B1320'] : ['#FFFFFF', '#F8FBFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                padding: 20,
                borderWidth: 1,
                borderColor: isDark ? '#1F2937' : '#E2E8F0',
              }}
            >
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 46, height: 4, borderRadius: 999, backgroundColor: isDark ? '#1f2a37' : '#e2e8f0' }} />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: isDark ? '#F8FAFC' : '#0F172A',
                }}
              >
                {headerLabel}
              </Text>
              <Text style={{ marginTop: 4, color: isDark ? '#94A3B8' : '#475569' }}>
                {mode === 'edit'
                  ? 'Update the reminder details below.'
                  : 'Log a reminder and keep your flow clear.'}
              </Text>
              <ScrollView style={{ marginTop: 18 }} contentContainerStyle={{ paddingBottom: 24 }}>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: isDark ? '#CBD5F5' : '#475569', marginBottom: 6 }}>Title</Text>
                  <TextInput
                    placeholder="e.g. Follow up with design team"
                    placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
                    value={formValues.title}
                    onChangeText={text => handleChange('title', text)}
                    style={{
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: isDark ? '#1F2937' : '#E2E8F0',
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: isDark ? '#F8FAFC' : '#0F172A',
                    }}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isDark ? '#CBD5F5' : '#475569', marginBottom: 6 }}>Date</Text>
                    <TextInput
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
                      value={formValues.date}
                      onChangeText={text => handleChange('date', text)}
                      style={{
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: isDark ? '#1F2937' : '#E2E8F0',
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        color: isDark ? '#F8FAFC' : '#0F172A',
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isDark ? '#CBD5F5' : '#475569', marginBottom: 6 }}>Time</Text>
                    <TextInput
                      placeholder="HH:mm"
                      placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
                      value={formValues.time}
                      onChangeText={text => handleChange('time', text)}
                      style={{
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: isDark ? '#1F2937' : '#E2E8F0',
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        color: isDark ? '#F8FAFC' : '#0F172A',
                      }}
                    />
                  </View>
                </View>
                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: isDark ? '#CBD5F5' : '#475569', marginBottom: 8 }}>Category</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {categoryOptions.map(option => {
                      const isActive = formValues.category === option;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => handleChange('category', option)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: isActive ? palette[option] : isDark ? '#1F2937' : '#E2E8F0',
                            backgroundColor: isActive ? `${palette[option]}22` : 'transparent',
                          }}
                        >
                          <Text style={{ color: isActive ? palette[option] : isDark ? '#E2E8F0' : '#475569' }}>
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: isDark ? '#CBD5F5' : '#475569', marginBottom: 6 }}>Notes</Text>
                  <TextInput
                    placeholder="Add context or links..."
                    placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
                    value={formValues.notes}
                    multiline
                    onChangeText={text => handleChange('notes', text)}
                    style={{
                      minHeight: 90,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: isDark ? '#1F2937' : '#E2E8F0',
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: isDark ? '#F8FAFC' : '#0F172A',
                    }}
                  />
                </View>

                {mode === 'create' && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={{ color: isDark ? '#CBD5F5' : '#475569', marginBottom: 6 }}>Related task (optional)</Text>
                    <TextInput
                      placeholder="Task or project name"
                      placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
                      value={formValues.relatedTask}
                      onChangeText={text => handleChange('relatedTask', text)}
                      style={{
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: isDark ? '#1F2937' : '#E2E8F0',
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        color: isDark ? '#F8FAFC' : '#0F172A',
                      }}
                    />
                  </View>
                )}

                <Pressable
                  onPress={handleSubmit}
                  style={{
                    marginTop: 24,
                    borderRadius: 18,
                    paddingVertical: 14,
                    backgroundColor: '#2563EB',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                    {mode === 'edit' ? 'Save changes' : 'Create reminder'}
                  </Text>
                </Pressable>
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
