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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Bell, Calendar as CalendarIcon, Clock, Tag as TagIcon, X } from 'lucide-react-native';
import { palette } from './data';
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

const CATEGORY_META: Record<ReminderCategory, { label: string; helper: string }> = {
  work: { label: 'Work', helper: 'Projects, syncs, deadlines' },
  personal: { label: 'Personal', helper: 'Life admin, family' },
  health: { label: 'Health', helper: 'Wellness, meds, routines' },
  deadline: { label: 'Deadline', helper: 'High-pressure deliverables' },
};

const PRIORITY_META: Record<ReminderPriority, { title: string; description: string; accent: string }> = {
  low: {
    title: 'Low',
    description: 'Nice-to-haves and casual nudges',
    accent: '#10B981',
  },
  medium: {
    title: 'Medium',
    description: 'Keep it on radar this week',
    accent: '#F59E0B',
  },
  high: {
    title: 'High',
    description: 'Time-sensitive follow-ups',
    accent: '#F97316',
  },
  critical: {
    title: 'Critical',
    description: 'Blockers, launches, hard deadlines',
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
                  <Text style={[styles.title, { color: isDark ? '#F4F7FF' : '#0F172A' }]}>
                    {mode === 'edit' ? 'Edit reminder' : 'Create reminder'}
                  </Text>
                  <Text style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Keep your nudges aligned with your task system.
                  </Text>
                </View>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <X size={18} color={isDark ? '#94A3B8' : '#475569'} />
                </Pressable>
              </View>

              <ScrollView
                style={{ marginTop: 12 }}
                contentContainerStyle={{ paddingBottom: 12 }}
                keyboardShouldPersistTaps="handled"
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
                  <View style={{ flex: 1 }}>
                    {renderInput(
                      'Date',
                      formValues.date,
                      text => handleChange('date', text),
                      'YYYY-MM-DD',
                      <CalendarIcon size={16} color={isDark ? '#CBD5F5' : '#64748B'} />,
                      errors.date
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    {renderInput(
                      'Time',
                      formValues.time,
                      text => handleChange('time', text),
                      'HH:mm',
                      <Clock size={16} color={isDark ? '#CBD5F5' : '#64748B'} />,
                      errors.time
                    )}
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#475569' }]}>
                    Category
                  </Text>
                  <View style={styles.categoryGrid}>
                    {categoryOptions.map(category => {
                      const isActive = formValues.category === category;
                      const meta = CATEGORY_META[category];
                      return (
                        <Pressable
                          key={category}
                          onPress={() => handleChange('category', category)}
                          style={[
                            styles.categoryCard,
                            {
                              borderColor: isActive ? palette[category] : 'rgba(148,163,184,0.2)',
                              backgroundColor: isActive
                                ? `${palette[category]}22`
                                : isDark
                                ? 'rgba(15,23,42,0.5)'
                                : '#FFFFFF',
                            },
                          ]}
                        >
                          <Text style={{ color: isDark ? '#E2E8F0' : '#0F172A', fontWeight: '600' }}>
                            {meta.label}
                          </Text>
                          <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}>
                            {meta.helper}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#475569' }]}>
                    Priority
                  </Text>
                  <View style={{ gap: 12 }}>
                    {(Object.keys(PRIORITY_META) as ReminderPriority[]).map(priority => {
                      const isActive = formValues.priority === priority;
                      const meta = PRIORITY_META[priority];
                      return (
                        <Pressable
                          key={priority}
                          onPress={() => handleChange('priority', priority)}
                          style={[
                            styles.priorityCard,
                            {
                              borderColor: isActive ? meta.accent : 'rgba(148,163,184,0.2)',
                              backgroundColor: isActive
                                ? `${meta.accent}22`
                                : isDark
                                ? 'rgba(15,23,42,0.55)'
                                : '#FFFFFF',
                            },
                          ]}
                        >
                          <View>
                            <Text style={{ color: isDark ? '#F8FAFC' : '#0F172A', fontWeight: '600' }}>
                              {meta.title}
                            </Text>
                            <Text style={{ color: isDark ? '#94A3B8' : '#475569', marginTop: 4 }}>
                              {meta.description}
                            </Text>
                          </View>
                          <View
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: meta.accent,
                            }}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#475569' }]}>Tags</Text>
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
                  <Text style={[styles.fieldLabel, { color: isDark ? '#94A3B8' : '#475569' }]}>Notes</Text>
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
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
