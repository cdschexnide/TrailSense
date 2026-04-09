import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms';
import { Icon } from '@components/atoms/Icon';
import { useTheme } from '@hooks/useTheme';
import type { SavedReport, ReportTemplate } from '@/types/report';
import { REPORT_TEMPLATES } from '@/types/report';

interface SavedReportRowProps {
  report: SavedReport;
  onPress: () => void;
  onDelete: () => void;
}

const TEMPLATE_COLORS: Record<ReportTemplate, string> = {
  'security-summary': '#EF4444',
  'activity-report': '#F59E0B',
  'signal-analysis': '#3B82F6',
};

const TEMPLATE_ICONS: Record<ReportTemplate, string> = {
  'security-summary': 'shield-checkmark-outline',
  'activity-report': 'bar-chart-outline',
  'signal-analysis': 'radio-outline',
};

const formatDate = (value?: string) => {
  if (!value) return 'Not yet generated';
  const d = new Date(value);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const SavedReportRow: React.FC<SavedReportRowProps> = ({
  report,
  onPress,
  onDelete,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const templateColor = TEMPLATE_COLORS[report.config.template];
  const templateIcon = TEMPLATE_ICONS[report.config.template];
  const templateName = REPORT_TEMPLATES[report.config.template].name;

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleLongPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      accessibilityRole="button"
      accessibilityLabel={`${report.name}, ${templateName}`}
      accessibilityHint="Long press to delete"
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.systemGray6 },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: `${templateColor}18` },
        ]}
      >
        <Icon
          name={templateIcon as any}
          size={20}
          color={templateColor}
        />
      </View>

      <View style={styles.content}>
        <Text
          variant="body"
          weight="semibold"
          style={{ color: colors.label }}
          numberOfLines={1}
        >
          {report.name}
        </Text>
        <View style={styles.meta}>
          <View
            style={[
              styles.badge,
              { backgroundColor: `${templateColor}18` },
            ]}
          >
            <Text
              variant="caption2"
              weight="semibold"
              style={{ color: templateColor, fontSize: 10 }}
            >
              {templateName}
            </Text>
          </View>
          <Text variant="caption2" color="tertiaryLabel">
            {formatDate(report.lastGeneratedAt)}
          </Text>
        </View>
      </View>

      <Icon
        name="chevron-forward"
        size={16}
        color={colors.tertiaryLabel}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

export default SavedReportRow;
