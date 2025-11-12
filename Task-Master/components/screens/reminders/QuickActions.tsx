import React from 'react';
import { View, Text, Pressable } from 'react-native';

/**
 * Type-safe definition for icon components sourced from lucide-react-native.
 * We keep the type generic to avoid a hard dependency on the LucideIcon interface,
 * while still guaranteeing color/size props exist for consistent styling.
 */
export type QuickActionIcon = React.ComponentType<{ color?: string; size?: number }>;

/**
 * Configuration signature for each quick action card.
 * The structure is intentionally rich so the presenter component can remain purely
 * declarative and reusable across future reminder experiences (mobile/tablet).
 */
export interface QuickActionConfig {
  id: string;
  label: string;
  description: string;
  icon: QuickActionIcon;
  accent: string;
  badgeBackground: string;
  badgeBorder: string;
}

interface QuickActionsProps {
  isDark: boolean;
  actions: QuickActionConfig[];
  onActionPress?: (action: QuickActionConfig) => void;
}

/**
 * QuickActions Component
 *
 * Presents a compact grid of high-frequency reminder operations (e.g., scheduling,
 * sharing) in a dedicated surface below the calendar. Each card highlights its
 * intent via iconography, accent colors, and concise metadata so the user can
 * initiate workflows with minimal friction.
 */
export const QuickActions: React.FC<QuickActionsProps> = ({ isDark, actions, onActionPress }) => {
  // Surface colors adapt to theme for consistent elevation depth perception
  const containerBackground = isDark ? '#050B15' : '#FFFFFF';
  const containerBorder = isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(15, 23, 42, 0.08)';

  return (
    <View
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 24,
        backgroundColor: containerBackground,
        borderWidth: 1,
        borderColor: containerBorder,
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.35 : 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
      }}
    >
      {/* Section header keeps context aligned with adjacent calendar */}
      <View style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: isDark ? '#F8FAFC' : '#0F172A',
          }}
        >
          Quick actions
        </Text>
        <Text
          style={{
            marginTop: 2,
            fontSize: 12,
            color: isDark ? '#94A3B8' : '#475569',
          }}
        >
          Jump into frequently used reminder flows.
        </Text>
      </View>

      {/* Two-column responsive grid keeps cards balanced on all screen widths */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <Pressable
              key={action.id}
              accessibilityRole="button"
              onPress={() => onActionPress?.(action)}
              style={{
                width: '48%',
                marginBottom: 12,
                padding: 14,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: action.badgeBorder,
                backgroundColor: action.badgeBackground,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#FFFFFF',
                  marginBottom: 10,
                }}
              >
                <Icon size={20} color={action.accent} />
              </View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: isDark ? '#F8FAFC' : '#0F172A',
                }}
              >
                {action.label}
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: isDark ? '#CBD5F5' : '#475569',
                }}
              >
                {action.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
