import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

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

/**
 * Suggestion Chips Component
 * Displays quick action suggestions for the AI Assistant
 */
export const SuggestionChips = memo<SuggestionChipsProps>(
  ({ suggestions, onSelect, title, compact = false }) => {
    const getCategoryColor = (category?: string) => {
      switch (category) {
        case 'alerts':
          return '#FF3B30';
        case 'devices':
          return '#007AFF';
        case 'patterns':
          return '#5856D6';
        case 'general':
        default:
          return '#8E8E93';
      }
    };

    // Compact mode: horizontal scrolling chips (used after messages)
    if (compact) {
      return (
        <View style={styles.compactWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.compactScrollContent}
          >
            {suggestions.map(suggestion => (
              <TouchableOpacity
                key={suggestion.id}
                style={[
                  styles.compactChip,
                  { borderColor: getCategoryColor(suggestion.category) },
                ]}
                onPress={() => onSelect(suggestion)}
                activeOpacity={0.7}
              >
                {suggestion.icon && (
                  <Text style={styles.chipIcon}>{suggestion.icon}</Text>
                )}
                <Text
                  style={[
                    styles.compactChipText,
                    { color: getCategoryColor(suggestion.category) },
                  ]}
                >
                  {suggestion.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }

    // Separate contextual (status) suggestions from regular suggestions
    const contextualIds = [
      'critical-alerts',
      'offline-devices',
      'low-battery',
      'review-alerts',
    ];
    const contextualSuggestions = suggestions.filter(s =>
      contextualIds.includes(s.id)
    );
    const regularSuggestions = suggestions.filter(
      s => !contextualIds.includes(s.id)
    );

    return (
      <View style={styles.container}>
        {/* Contextual status cards - horizontal row */}
        {contextualSuggestions.length > 0 && (
          <View style={styles.statusCardsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statusCardsScroll}
            >
              {contextualSuggestions.map(suggestion => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={[
                    styles.statusCard,
                    { borderLeftColor: getCategoryColor(suggestion.category) },
                  ]}
                  onPress={() => onSelect(suggestion)}
                  activeOpacity={0.7}
                >
                  {suggestion.icon && (
                    <Text style={styles.statusCardIcon}>{suggestion.icon}</Text>
                  )}
                  <Text style={styles.statusCardText}>{suggestion.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Regular suggestion chips */}
        {title && regularSuggestions.length > 0 && (
          <Text style={styles.title}>{title}</Text>
        )}
        {regularSuggestions.length > 0 && (
          <View style={styles.chipsWrapper}>
            {regularSuggestions.map(suggestion => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.chip}
                onPress={() => onSelect(suggestion)}
                activeOpacity={0.7}
              >
                <View style={styles.chipContent}>
                  {suggestion.icon && (
                    <Text style={styles.chipIconLarge}>{suggestion.icon}</Text>
                  )}
                  <Text style={styles.chipText}>{suggestion.label}</Text>
                </View>
                <View
                  style={[
                    styles.categoryIndicator,
                    { backgroundColor: getCategoryColor(suggestion.category) },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }
);

/**
 * Default suggestions for the AI Assistant
 */
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

/**
 * Context-aware suggestions based on security data
 */
export const getContextualSuggestions = (context: {
  unreviewedAlerts: number;
  criticalAlerts: number;
  offlineDevices: number;
  lowBatteryDevices: number;
}): Suggestion[] => {
  const suggestions: Suggestion[] = [];

  // High priority: Critical alerts
  if (context.criticalAlerts > 0) {
    suggestions.push({
      id: 'critical-alerts',
      label: `${context.criticalAlerts} critical alert${context.criticalAlerts > 1 ? 's' : ''}`,
      query: `I have ${context.criticalAlerts} critical alert${context.criticalAlerts > 1 ? 's' : ''}. Tell me about them and what I should do.`,
      icon: '🚨',
      category: 'alerts',
    });
  }

  // High priority: Offline devices
  if (context.offlineDevices > 0) {
    suggestions.push({
      id: 'offline-devices',
      label: `${context.offlineDevices} sensor${context.offlineDevices > 1 ? 's' : ''} offline`,
      query: `I have ${context.offlineDevices} TrailSense sensor${context.offlineDevices > 1 ? 's' : ''} offline. Which ones and what could be wrong?`,
      icon: '📵',
      category: 'devices',
    });
  }

  // Medium priority: Low battery
  if (context.lowBatteryDevices > 0) {
    suggestions.push({
      id: 'low-battery',
      label: `${context.lowBatteryDevices} low battery`,
      query: `Which sensors have low battery and need attention soon?`,
      icon: '🔋',
      category: 'devices',
    });
  }

  // Medium priority: Unreviewed alerts
  if (context.unreviewedAlerts > 0) {
    suggestions.push({
      id: 'review-alerts',
      label: `Review ${context.unreviewedAlerts} alert${context.unreviewedAlerts > 1 ? 's' : ''}`,
      query: `I have ${context.unreviewedAlerts} unreviewed alert${context.unreviewedAlerts > 1 ? 's' : ''}. Which ones are most important to review?`,
      icon: '📋',
      category: 'alerts',
    });
  }

  return suggestions;
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  // Status cards for contextual suggestions (critical alerts, offline, etc.)
  statusCardsContainer: {
    marginBottom: 16,
  },
  statusCardsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  statusCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
  },
  statusCardIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  statusCardText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Regular suggestion chips
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsWrapper: {
    paddingHorizontal: 16,
  },
  chip: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    marginBottom: 6,
    overflow: 'hidden',
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipIconLarge: {
    fontSize: 16,
    marginRight: 10,
  },
  chipText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  categoryIndicator: {
    height: 2,
  },
  // Compact inline chips - MUST have fixed height to prevent stretching
  compactWrapper: {
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
    paddingVertical: 12,
  },
  compactScrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },
  chipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  compactChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

SuggestionChips.displayName = 'SuggestionChips';
export default SuggestionChips;
