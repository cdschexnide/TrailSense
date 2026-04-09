/**
 * SuggestionChips — Tactical Quick Actions
 *
 * Monospace bordered pills replacing emoji suggestion cards.
 * Compact and full modes with consistent tactical styling.
 */

import React, { memo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text } from '@components/atoms/Text';
import {
  tacticalColors as c,
  tacticalTypography as t,
} from '@/constants/tacticalTheme';

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

const SuggestionChipsComponent = ({
  suggestions,
  onSelect,
  compact = false,
}: SuggestionChipsProps) => {
  if (compact) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.compactScroll}
        style={styles.compactWrapper}
      >
        {suggestions.map(suggestion => (
          <Pressable
            key={suggestion.id}
            onPress={() => onSelect(suggestion)}
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.chipText}>
              {suggestion.label.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  // Full mode: larger pills for welcome screen
  return (
    <View style={styles.fullContainer}>
      <View style={styles.chipGrid}>
        {suggestions.map(suggestion => (
          <Pressable
            key={suggestion.id}
            onPress={() => onSelect(suggestion)}
            style={({ pressed }) => [
              styles.fullChip,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.fullChipText}>
              {suggestion.label.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export const SuggestionChips = memo(SuggestionChipsComponent);

export const DEFAULT_SUGGESTIONS: Suggestion[] = [
  {
    id: 'sitrep',
    label: 'SITREP',
    query:
      "Give me a full situation report. What's the current security status, any alerts, and sensor health?",
    category: 'general',
  },
  {
    id: 'critical',
    label: 'CRITICAL',
    query: 'Show me all critical alerts. What happened and what should I do?',
    category: 'alerts',
  },
  {
    id: 'sensors',
    label: 'SENSORS',
    query:
      "What's the status of my TrailSense sensors? Are any offline or low on battery?",
    category: 'devices',
  },
  {
    id: 'patterns',
    label: 'PATTERNS',
    query:
      'Have there been any suspicious detection patterns or repeat visitors I should know about?',
    category: 'patterns',
  },
  {
    id: 'weekly',
    label: 'WEEKLY',
    query:
      'Give me a weekly security report. Alert counts, types, trends, and when activity is highest.',
    category: 'general',
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
      label: `${context.criticalAlerts} CRITICAL`,
      query: `I have ${context.criticalAlerts} critical alert${context.criticalAlerts > 1 ? 's' : ''}. Tell me about them and what I should do.`,
      category: 'alerts',
    });
  }

  if (context.offlineDevices > 0) {
    suggestions.push({
      id: 'offline-devices',
      label: `${context.offlineDevices} OFFLINE`,
      query: `I have ${context.offlineDevices} sensor${context.offlineDevices > 1 ? 's' : ''} offline. Which ones and what could be wrong?`,
      category: 'devices',
    });
  }

  if (context.lowBatteryDevices > 0) {
    suggestions.push({
      id: 'low-battery',
      label: `${context.lowBatteryDevices} LOW BAT`,
      query: 'Which sensors have low battery and need attention soon?',
      category: 'devices',
    });
  }

  if (context.unreviewedAlerts > 0) {
    suggestions.push({
      id: 'review-alerts',
      label: `${context.unreviewedAlerts} UNREVIEWED`,
      query:
        'Show me the unreviewed alerts and help me prioritize what to check first.',
      category: 'alerts',
    });
  }

  return suggestions;
};

const styles = StyleSheet.create({
  compactWrapper: {
    marginTop: 8,
    height: 40,
    flexShrink: 0,
  },
  compactScroll: {
    paddingHorizontal: 16,
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: 32,
    justifyContent: 'center',
  },
  chipText: {
    ...t.quickAction,
    color: c.textSecondary,
  },
  fullContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fullChip: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fullChipText: {
    ...t.quickAction,
    color: c.textSecondary,
    fontSize: 13,
  },
});

SuggestionChips.displayName = 'SuggestionChips';
export default SuggestionChips;
