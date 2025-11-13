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
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Bell, Calendar as CalendarIcon, Clock, Tag as TagIcon, X } from 'lucide-react-native';
import { palette } from './data';
import { formatDateKey } from './utils';
import type { ReminderCategory, ReminderPriority } from '@/types/reminder.types';

export interface ReminderFormValues {
  id?: string;
  title: string;
  date: string;
  time: string;
  category: ReminderCategory;
  priority: ReminderPriority;
  timezone: string;
  notes?: string;
  tags: string[];
}

interface ReminderFormModalProps {
  visible: boolean;
  isDark: boolean;
  initialValues?: Partial<ReminderFormValues>;
  defaultTimezone: string;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: ReminderFormValues) => Promise<void> | void;
  submitting?: boolean;
}

type FieldErrors = Partial<Record<keyof ReminderFormValues, string>>;

const CATEGORY_META: Record<ReminderCategory, { label: string }> = {
  work: { label: 'Work' },
  personal: { label: 'Personal' },
  health: { label: 'Health' },
  deadline: { label: 'Deadline' },
};

const PRIORITY_META: Record<ReminderPriority, { title: string; accent: string }> = {
  low: {
    title: 'Low',
    accent: '#10B981',
  },
  medium: {
    title: 'Medium',
    accent: '#F59E0B',
  },
  high: {
    title: 'High',
    accent: '#F97316',
  },
  critical: {
    title: 'Critical',
    accent: '#EF4444',
  },
};

/**
 * ReminderFormModal
 *
 * Mirrors the Create Task modal experience with blur backdrop, pill selectors,
 * and inline validation. Handles both create and edit flows.
 */
export const ReminderFormModal: React.FC<ReminderFormModalProps> = ({
  visible,
  isDark,
  initialValues,
  defaultTimezone,
  mode,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  const [formValues, setFormValues] = useState<ReminderFormValues>({
    id: undefined,
    title: '',
    date: '',
    time: '',
    category: 'work',
    priority: 'medium',
    timezone: defaultTimezone,
    notes: '',
    tags: [],
  });
  const [tagDraft, setTagDraft] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(40)).current;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      const payload = initialValues ?? {};
      setFormValues({
        id: payload.id,
        title: payload.title ?? '',
        date: payload.date ?? '',
        time: payload.time ?? '',
        category: payload.category ?? 'work',
        priority: payload.priority ?? 'medium',
        timezone: payload.timezone ?? defaultTimezone,
        notes: payload.notes ?? '',
        tags: payload.tags ?? [],
      });
      setErrors({});
      setGeneralError(null);
      setTagDraft('');
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
  }, [visible, initialValues, defaultTimezone, opacity, translateY]);

  const categoryOptions = useMemo<ReminderCategory[]>(() => ['work', 'personal', 'health', 'deadline'], []);

  const handleChange = <K extends keyof ReminderFormValues>(key: K, value: ReminderFormValues[K]) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleTagCommit = () => {
    const trimmed = tagDraft.trim().toLowerCase();
    if (!trimmed) return;
    if (formValues.tags.includes(trimmed)) {
      setTagDraft('');
      return;
    }
    handleChange('tags', [...formValues.tags, trimmed]);
    setTagDraft('');
  };

  const handleTagRemove = (tag: string) => {
    handleChange('tags', formValues.tags.filter(item => item !== tag));
  };

  const validateForm = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (!formValues.title.trim()) {
      nextErrors.title = 'Title is required.';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formValues.date)) {
      nextErrors.date = 'Use YYYY-MM-DD format.';
    }
    if (!/^\d{2}:\d{2}$/.test(formValues.time)) {
      nextErrors.time = 'Use HH:mm format.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setGeneralError(null);
      await onSubmit(formValues);
    } catch (error) {
      const message =
        (error as { message?: string })?.message || 'Unable to save reminder. Please try again.';
      setGeneralError(message);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    icon: React.ReactNode,
    error?: string
  ) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#475569' }]}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          {
            borderColor: error
              ? '#EF4444'
              : isDark
              ? 'rgba(148,163,184,0.25)'
              : 'rgba(15,23,42,0.08)',
            backgroundColor: isDark ? 'rgba(15,23,42,0.65)' : '#FFFFFF',
          },
        ]}
      >
        {icon}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
          value={value}
          onChangeText={onChangeText}
          style={[styles.input, { color: isDark ? '#F8FAFC' : '#0F172A' }]}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.backdrop, { opacity }]} >
          <BlurView tint={isDark ? 'dark' : 'light'} intensity={visible ? 60 : 0} style={StyleSheet.absoluteFill} />
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <Animated.View className="max-h-[70%]" style={[styles.sheet, { transform: [{ translateY }] }]}>
            <LinearGradient
              colors={isDark ? ['#0B1220', '#050B15'] : ['#FFFFFF', '#F6F8FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.sheetContent,
                { borderColor: isDark ? 'rgba(148,163,184,0.25)' : 'rgba(15,23,42,0.06)' },
              ]}
            >
              {/* <View style={styles.grabber} /> */}
              <View style={styles.headerRow}>
                <View>
                  <Text className="px-3" style={[styles.title, { color: isDark ? '#F4F7FF' : '#0F172A' }]}>
                    {mode === 'edit' ? 'Edit reminder' : 'Create reminder'}
                  </Text>
                  {/* <Text style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Keep your nudges aligned with your task system.
                  </Text> */}
                </View>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <X size={18} color={isDark ? '#94A3B8' : '#475569'} />
                </Pressable>
              </View>

              <ScrollView
                style={{ marginTop: 12 }}
                contentContainerStyle={{ paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {renderInput(
                  'Reminder title',
                  formValues.title,
                  text => handleChange('title', text),
                  'Sprint update, call Alex...',
                  <Bell size={16} color={isDark ? '#CBD5F5' : '#64748B'} />,
                  errors.title
                )}

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    style={[styles.pickerField, getPickerStyle(isDark, !!errors.date)]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <CalendarIcon size={16} color={isDark ? '#CBD5F5' : '#64748B'} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { marginBottom: 2, color: isDark ? '#94A3B8' : '#475569' }]}>
                        Date
                      </Text>
                      <Text style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                        {formValues.date || 'YYYY-MM-DD'}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    style={[styles.pickerField, getPickerStyle(isDark, !!errors.time)]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Clock size={16} color={isDark ? '#CBD5F5' : '#64748B'} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { marginBottom: 2, color: isDark ? '#94A3B8' : '#475569' }]}>
                        Time
                      </Text>
                      <Text style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                        {formValues.time || 'HH:mm'}
                      </Text>
                    </View>
                  </Pressable>
                </View>
                {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
                {errors.time ? <Text style={styles.errorText}>{errors.time}</Text> : null}

                <View style={{ marginBottom: 16 }}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#475569' }]}>
                    Category
                  </Text>
                  <View style={styles.pillRow}>
                    {categoryOptions.map(category => {
                      const isActive = formValues.category === category;
                      return (
                        <Pressable
                          key={category}
                          onPress={() => handleChange('category', category)}
                          style={[
                            styles.pill,
                            {
                              borderColor: isActive ? palette[category] : 'rgba(148,163,184,0.25)',
                              backgroundColor: isActive
                                ? `${palette[category]}22`
                                : isDark
                                ? 'rgba(15,23,42,0.55)'
                                : '#FFFFFF',
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: isActive ? palette[category] : isDark ? '#E2E8F0' : '#475569',
                              fontWeight: '600',
                            }}
                          >
                            {CATEGORY_META[category].label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#475569' }]}>
                    Priority
                  </Text>
                  <View style={styles.pillRow}>
                    {(Object.keys(PRIORITY_META) as ReminderPriority[]).map(priority => {
                      const isActive = formValues.priority === priority;
                      const meta = PRIORITY_META[priority];
                      return (
                        <Pressable
                          key={priority}
                          onPress={() => handleChange('priority', priority)}
                          style={[
                            styles.pill,
                            {
                              borderColor: isActive ? meta.accent : 'rgba(148,163,184,0.25)',
                              backgroundColor: isActive
                                ? `${meta.accent}22`
                                : isDark
                                ? 'rgba(15,23,42,0.55)'
                                : '#FFFFFF',
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: isActive ? meta.accent : isDark ? '#E2E8F0' : '#475569',
                              fontWeight: '600',
                            }}
                          >
                            {meta.title}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#475569' }]}>
                    Tags (optional)
                  </Text>
                  <View
                    style={[
                      styles.inputShell,
                      {
                        borderColor: isDark ? 'rgba(148,163,184,0.25)' : 'rgba(15,23,42,0.08)',
                        backgroundColor: isDark ? 'rgba(15,23,42,0.65)' : '#FFFFFF',
                      },
                    ]}
                  >
                    <TagIcon size={16} color={isDark ? '#CBD5F5' : '#64748B'} />
                    <TextInput
                      placeholder="Type and press enter to add"
                      placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
                      value={tagDraft}
                      onChangeText={setTagDraft}
                      onSubmitEditing={handleTagCommit}
                      style={[styles.input, { color: isDark ? '#F8FAFC' : '#0F172A' }]}
                    />
                    {tagDraft.length > 0 && (
                      <Pressable onPress={handleTagCommit}>
                        <Text style={{ color: '#2563EB', fontWeight: '600' }}>Add</Text>
                      </Pressable>
                    )}
                  </View>
                  <View style={styles.tagsRow}>
                    {formValues.tags.map(tag => (
                      <Pressable key={tag} onPress={() => handleTagRemove(tag)} style={styles.tagPill}>
                        <Text style={{ color: '#2563EB', fontWeight: '600' }}>{tag}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#475569' }]}>
                    Notes (optional)
                  </Text>
                  <TextInput
                    placeholder="Add context, links, or expectations"
                    placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
                    value={formValues.notes}
                    multiline
                    onChangeText={text => handleChange('notes', text)}
                    style={[
                      styles.notesInput,
                      {
                        borderColor: isDark ? 'rgba(148,163,184,0.25)' : 'rgba(15,23,42,0.08)',
                        backgroundColor: isDark ? 'rgba(15,23,42,0.65)' : '#FFFFFF',
                        color: isDark ? '#F8FAFC' : '#0F172A',
                      },
                    ]}
                  />
                </View>

                <View style={styles.timezoneRow}>
                  <Text style={{ color: isDark ? '#94A3B8' : '#475569' }}>Timezone</Text>
                  <Text style={{ color: isDark ? '#F8FAFC' : '#0F172A', fontWeight: '600' }}>
                    {formValues.timezone}
                  </Text>
                </View>

                {generalError ? <Text style={styles.generalError}>{generalError}</Text> : null}

                <Pressable
                  onPress={handleSubmit}
                  disabled={submitting}
                  style={[
                    styles.submitButton,
                    { backgroundColor: submitting ? '#1D4ED880' : '#2563EB' },
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitText}>
                      {mode === 'edit' ? 'Save reminder' : 'Create reminder'}
                    </Text>
                  )}
                </Pressable>
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        {showDatePicker && (
          <DateTimePicker
            value={composeDateForPicker(formValues.date, formValues.time)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                handleChange('date', formatDateKey(selectedDate));
              }
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={composeDateForPicker(formValues.date, formValues.time)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selectedDate) => {
              setShowTimePicker(false);
              if (selectedDate) {
                const hours = String(selectedDate.getHours()).padStart(2, '0');
                const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
                handleChange('time', `${hours}:${minutes}`);
              }
            }}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(5,11,21,0.65)',
  },
  sheet: {
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 1,
    paddingVertical: 12,
    borderWidth: 1,
    margin:10
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 10,
    borderBottomColor: 'grey'
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148,163,184,0.12)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  fieldLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  inputShell: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  errorText: {
    color: '#EF4444',
    marginTop: 4,
    fontSize: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    flexBasis: '48%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 6,
  },
  priorityCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notesInput: {
    minHeight: 110,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(37,99,235,0.1)',
  },
  timezoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  generalError: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 12,
  },
  submitButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pickerField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

function getPickerStyle(isDark: boolean, hasError: boolean) {
  return {
    borderColor: hasError
      ? '#EF4444'
      : isDark
      ? 'rgba(148,163,184,0.25)'
      : 'rgba(15,23,42,0.08)',
    backgroundColor: isDark ? 'rgba(15,23,42,0.65)' : '#FFFFFF',
  };
}

function composeDateForPicker(date: string, time: string) {
  const baseline = new Date();
  const [year, month, day] = (date || '').split('-').map(Number);
  const [hours, minutes] = (time || '').split(':').map(Number);
  const result = new Date(baseline);
  if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
    result.setFullYear(year, (month || 1) - 1, day || 1);
  }
  result.setHours(Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
  return result;
}
