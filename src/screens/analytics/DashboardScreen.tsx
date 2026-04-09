import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAnalytics, useComparison } from '@hooks/useAnalytics';
import { TabSegment } from '@components/molecules';
import { useTheme } from '@hooks/useTheme';
import { ScreenLayout, LoadingState, ErrorState } from '@components/templates';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { Button } from '@components/atoms/Button';
import { useDevices } from '@hooks/useDevices';
import { generateInsights } from '@services/analyticsInsights';
import { OverviewTab, PatternsTab, SignalsTab } from './tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  AnalyticsStackParamList,
  MoreStackParamList,
} from '@navigation/types';

type Period = 'day' | 'week' | 'month' | 'year';
type AnalyticsTab = 'overview' | 'signals' | 'patterns';

const PERIOD_CONFIG: Record<Period, { shortLabel: string }> = {
  day: { shortLabel: '24h' },
  week: { shortLabel: '7d' },
  month: { shortLabel: '30d' },
  year: { shortLabel: '1y' },
};

type DashboardScreenProps =
  | NativeStackScreenProps<AnalyticsStackParamList, 'Dashboard'>
  | NativeStackScreenProps<MoreStackParamList, 'Dashboard'>;

export const DashboardScreen = ({ navigation }: DashboardScreenProps) => {
  const [period, setPeriod] = useState<Period>('week');
  const [tab, setTab] = useState<AnalyticsTab>('overview');
  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = useAnalytics({
    period,
  });
  const { data: comparison } = useComparison({
    period: period === 'year' ? 'month' : period,
    enabled: period !== 'year',
  });
  const { data: devices = [] } = useDevices();
  const { theme } = useTheme();
  const colors = theme.colors;

  const insights = useMemo(
    () => generateInsights(analytics, comparison, devices),
    [analytics, comparison, devices]
  );
  const navigateToReports = () => {
    (navigation as { navigate: (screen: 'Reports') => void }).navigate(
      'Reports'
    );
  };

  if (isLoading) return <LoadingState />;

  if (isError || !analytics) {
    return (
      <ErrorState
        message="Failed to load analytics"
        onRetry={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          refetch();
        }}
      />
    );
  }

  return (
    <ScreenLayout
      header={{
        title: 'Analytics',
        largeTitle: true,
        rightActions: (
          <Button
            buttonStyle="plain"
            onPress={navigateToReports}
            leftIcon={
              <Icon
                name="document-text-outline"
                size={20}
                color={colors.systemBlue}
              />
            }
          >
            Reports
          </Button>
        ),
      }}
      scrollable
    >
      <View style={styles.container}>
        <View
          style={[
            styles.periodContainer,
            { backgroundColor: colors.secondarySystemBackground },
          ]}
        >
          {(['day', 'week', 'month', 'year'] as Period[]).map(p => {
            const isSelected = period === p;
            return (
              <Pressable
                key={p}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPeriod(p);
                }}
                style={[
                  styles.periodButton,
                  isSelected && {
                    backgroundColor: colors.brandAccent || colors.primary,
                  },
                ]}
              >
                <Text
                  variant="subheadline"
                  weight={isSelected ? 'semibold' : 'regular'}
                  style={{ color: isSelected ? '#FFFFFF' : colors.label }}
                >
                  {PERIOD_CONFIG[p].shortLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TabSegment
          tabs={[
            { key: 'overview', label: 'Overview' },
            { key: 'signals', label: 'Signals' },
            { key: 'patterns', label: 'Patterns' },
          ]}
          selectedKey={tab}
          onSelect={key => setTab(key as AnalyticsTab)}
        />

        {tab === 'overview' ? (
          <OverviewTab
            analytics={analytics}
            comparison={comparison}
            devices={devices}
            insights={insights}
            onSelectTab={setTab}
          />
        ) : tab === 'signals' ? (
          <SignalsTab analytics={analytics} />
        ) : (
          <PatternsTab
            analytics={analytics}
            comparison={comparison}
            period={period}
          />
        )}
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 18,
  },
  periodContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
