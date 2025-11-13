import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

export interface ReminderFilterOption {
  id: string;
  label: string;
  count: number;
  accent: string;
}

interface ReminderFiltersProps {
  isDark: boolean;
  options: ReminderFilterOption[];
  activeFilter: string;
  onFilterChange: (optionId: string) => void;
}

/**
 * ReminderFilters
 *
 * Horizontal pill selector that allows users to scope reminders by category.
 * Pills are fully data-driven so we can extend categories later without
 * touching the presentation layer.
 */
export const ReminderFilters: React.FC<ReminderFiltersProps> = ({
  isDark,
  options,
  activeFilter,
  onFilterChange,
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ paddingVertical: 10 }}
  >
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {options.map(option => {
        const isActive = option.id === activeFilter;
        return (
          <Pressable
            key={option.id}
            onPress={() => onFilterChange(option.id)}
            style={{
              borderRadius: 999,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: isActive ? option.accent : isDark ? '#1F2937' : '#E2E8F0',
              backgroundColor: isActive
                ? `${option.accent}22`
                : isDark
                ? 'rgba(15,23,42,0.6)'
                : '#FFFFFF',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isActive ? option.accent : isDark ? '#E2E8F0' : '#475569',
              }}
            >
              {option.label}
              <Text style={{ color: isActive ? option.accent : isDark ? '#94A3B8' : '#94A3B8' }}>
                {' '}
                {option.count}
              </Text>
            </Text>
          </Pressable>
        );
      })}
    </View>
  </ScrollView>
);
