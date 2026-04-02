/**
 * SuggestionChips - REDESIGNED
 *
 * Beautiful suggestion UI with:
 * - Action cards for priority items
 * - Pill chips for suggestions
 * - Better visual hierarchy
 */

import React, { memo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text } from '@components/atoms/Text';
import { Icon, IconName } from '@components/atoms/Icon';
import { useTheme } from '@hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

export interface Suggestion {
  id: string;
  label: string;
  query: string;
  icon?: string;
  category?: 'alerts' | 'devices' | 'patterns' | 'general';
}

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
  title?: string;
  compact?: boolean;
}

type SuggestionCategory = NonNullable<Suggestion['category']>;

type CategoryConfig = {
  icon: IconName;
  color: string;
  gradient: [string, string];
};

const CATEGORY_CONFIG: Record<SuggestionCategory, CategoryConfig> = {
  alerts: {
    icon: 'notifications',
    color: '#A65D4C',
    gradient: ['#8B4D3B', '#A65D4C'],
  },
  devices: {
    icon: 'hardware-chip',
    color: '#5D7A6B',
    gradient: ['#4A6358', '#5D7A6B'],
  },
  patterns: {
    icon: 'analytics',
    color: '#7D7365',
    gradient: ['#6B6155', '#7D7365'],
  },
  general: {
    icon: 'help-circle',
    color: '#6B6B5E',
    gradient: ['#5A5A4E', '#6B6B5E'],
  },
};

const CONTEXTUAL_IDS = [
  'critical-alerts',
  'offline-devices',
  'low-battery',
  'review-alerts',
];

const SuggestionChipsComponent = ({
  suggestions,
  onSelect,
  title,
  compact = false,
}: SuggestionChipsProps) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const getConfig = (category?: SuggestionCategory): CategoryConfig =>
    CATEGORY_CONFIG[category ?? 'general'];

  if (compact) {
    return (
      <View style={styles.compactWrapper}>
        <LinearGradient
          colors={[
            'rgba(74,82,64,0.25)',
            'rgba(184,166,124,0.3)',
            'rgba(74,82,64,0.25)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.compactBorderGradient}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactScroll}
        >
          {suggestions.map(suggestion => {
            const config = getConfig(suggestion.category);
            return (
              <Pressable
                key={suggestion.id}
                onPress={() => onSelect(suggestion)}
                style={({ pressed }) => [
                  pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
                ]}
              >
                <LinearGradient
                  colors={config.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.compactChip}
                >
                  {suggestion.icon && (
                    <View style={styles.compactChipIcon}>
                      <Text style={styles.chipEmoji}>{suggestion.icon}</Text>
                    </View>
                  )}
                  <Text
                    variant="caption1"
                    weight="semibold"
                    style={{ color: '#FFFFFF' }}
                  >
                    {suggestion.label}
                  </Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  const contextualSuggestions = suggestions.filter(suggestion =>
    CONTEXTUAL_IDS.includes(suggestion.id)
  );
  const regularSuggestions = suggestions.filter(
    suggestion => !CONTEXTUAL_IDS.includes(suggestion.id)
  );

  return (
    <View style={styles.container}>
      {contextualSuggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionCardsScroll}
          style={styles.actionCardsContainer}
        >
          {contextualSuggestions.map(suggestion => {
            const config = getConfig(suggestion.category);
            return (
              <Pressable
                key={suggestion.id}
                onPress={() => onSelect(suggestion)}
                style={({ pressed }) => [pressed && { opacity: 0.8 }]}
              >
                <LinearGradient
                  colors={config.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionCard}
                >
                  <View style={styles.actionCardIcon}>
                    {suggestion.icon ? (
                      <Text style={styles.actionCardEmoji}>
                        {suggestion.icon}
                      </Text>
                    ) : (
                      <Icon name={config.icon} size={20} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    variant="subheadline"
                    weight="semibold"
                    style={{ color: '#FFFFFF' }}
                  >
                    {suggestion.label}
                  </Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {regularSuggestions.length > 0 && (
        <View style={styles.regularSection}>
          {title && (
            <Text
              variant="caption1"
              weight="semibold"
              style={[styles.sectionTitle, { color: colors.secondaryLabel }]}
            >
              {title.toUpperCase()}
            </Text>
          )}
          <View style={styles.suggestionsList}>
            {regularSuggestions.map(suggestion => {
              const config = getConfig(suggestion.category);
              return (
                <Pressable
                  key={suggestion.id}
                  onPress={() => onSelect(suggestion)}
                  style={({ pressed }) => [
                    styles.suggestionCard,
                    { backgroundColor: colors.secondarySystemBackground },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={styles.suggestionContent}>
                    {suggestion.icon && (
                      <View
                        style={[
                          styles.suggestionIcon,
                          { backgroundColor: config.color + '20' },
                        ]}
                      >
                        <Text style={styles.suggestionEmoji}>
                          {suggestion.icon}
                        </Text>
                      </View>
                    )}
                    <Text
                      variant="subheadline"
                      color="label"
                      style={{ flex: 1 }}
                    >
                      {suggestion.label}
                    </Text>
                    <Icon
                      name="chevron-forward"
                      size={16}
                      color={colors.tertiaryLabel}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

export const SuggestionChips = memo(SuggestionChipsComponent);

export const DEFAULT_SUGGESTIONS: Suggestion[] = [
  {
    id: 'summary-today',
    label: "Summarize today's activity",
    query:
      "Give me a summary of today's detection activity. What alerts have we had and what should I know?",
    icon: '📊',
    category: 'alerts',
  },
  {
    id: 'unreviewed',
    label: 'Show unreviewed alerts',
    query:
      'How many unreviewed alerts do I have? List the most important ones I should look at.',
    icon: '⚠️',
    category: 'alerts',
  },
  {
    id: 'device-status',
    label: 'Check sensor status',
    query:
      "What's the status of my TrailSense sensors? Are any offline or low on battery?",
    icon: '📡',
    category: 'devices',
  },
  {
    id: 'suspicious',
    label: 'Any suspicious activity?',
    query:
      'Have there been any suspicious detections or unusual patterns I should be aware of?',
    icon: '🔍',
    category: 'patterns',
  },
  {
    id: 'weekly-report',
    label: 'Weekly security report',
    query:
      'Give me a weekly security report. How many alerts have there been, what types, and any trends?',
    icon: '📈',
    category: 'general',
  },
  {
    id: 'quiet-times',
    label: 'When is it quietest?',
    query:
      'Based on my detection history, what times of day are typically quietest with the least activity?',
    icon: '🌙',
    category: 'patterns',
  },
];

export const getContextualSuggestions = (context: {
  unreviewedAlerts: number;
  criticalAlerts: number;
  offlineDevices: number;
  lowBatteryDevices: number;
}): Suggestion[] => {
  const suggestions: Suggestion[] = [];

  if (context.criticalAlerts > 0) {
    suggestions.push({
      id: 'critical-alerts',
      label: `${context.criticalAlerts} critical alert${context.criticalAlerts > 1 ? 's' : ''}`,
      query: `I have ${context.criticalAlerts} critical alert${context.criticalAlerts > 1 ? 's' : ''}. Tell me about them and what I should do.`,
      icon: '🚨',
      category: 'alerts',
    });
  }

  if (context.offlineDevices > 0) {
    suggestions.push({
      id: 'offline-devices',
      label: `${context.offlineDevices} sensor${context.offlineDevices > 1 ? 's' : ''} offline`,
      query: `I have ${context.offlineDevices} TrailSense sensor${context.offlineDevices > 1 ? 's' : ''} offline. Which ones and what could be wrong?`,
      icon: '📵',
      category: 'devices',
    });
  }

  if (context.lowBatteryDevices > 0) {
    suggestions.push({
      id: 'low-battery',
      label: `${context.lowBatteryDevices} low battery`,
      query: 'Which sensors have low battery and need attention soon?',
      icon: '🔋',
      category: 'devices',
    });
  }

  if (context.unreviewedAlerts > 0) {
    suggestions.push({
      id: 'review-alerts',
      label: `${context.unreviewedAlerts} unreviewed alert${context.unreviewedAlerts > 1 ? 's' : ''}`,
      query:
        'Show me the unreviewed alerts and help me prioritize what to check first.',
      icon: '✅',
      category: 'alerts',
    });
  }

  return suggestions;
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  compactWrapper: {
    marginTop: 12,
  },
  compactBorderGradient: {
    height: 1,
    marginBottom: 14,
    marginHorizontal: 16,
  },
  compactScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 8,
  },
  compactChipIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipEmoji: {
    fontSize: 14,
  },
  actionCardsContainer: {
    marginBottom: 16,
  },
  actionCardsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    width: 180,
    minHeight: 100,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
  },
  actionCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionCardEmoji: {
    fontSize: 18,
  },
  regularSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  suggestionsList: {
    gap: 10,
  },
  suggestionCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionEmoji: {
    fontSize: 16,
  },
});

SuggestionChips.displayName = 'SuggestionChips';
export default SuggestionChips;
