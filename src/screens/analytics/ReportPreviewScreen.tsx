import React, { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@components/atoms';
import {
  ActivityReportReport,
  SecuritySummaryReport,
  SignalAnalysisReport,
} from '@components/organisms';
import { ErrorState, LoadingState, ScreenLayout } from '@components/templates';
import { useAnalytics, useComparison } from '@hooks/useAnalytics';
import { useDevices } from '@hooks/useDevices';
import { exportReportCsv, exportReportPdf } from '@services/reportExport';
import { useAppDispatch } from '@store/index';
import { updateLastGenerated } from '@store/slices/savedReportsSlice';
import type {
  AnalyticsStackParamList,
  MoreStackParamList,
} from '@navigation/types';
import { REPORT_TEMPLATES } from '@/types/report';

type ReportPreviewScreenProps =
  | NativeStackScreenProps<AnalyticsStackParamList, 'ReportPreview'>
  | NativeStackScreenProps<MoreStackParamList, 'ReportPreview'>;

export const ReportPreviewScreen = ({
  navigation,
  route,
}: ReportPreviewScreenProps) => {
  const dispatch = useAppDispatch();
  const { config, savedReportId } = route.params;
  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = useAnalytics({
    period: config.period,
  });
  const { data: comparison } = useComparison({
    period: config.period === 'year' ? 'month' : config.period,
    enabled: config.period !== 'year',
  });
  const { data: devices = [] } = useDevices();

  useEffect(() => {
    if (analytics && savedReportId) {
      dispatch(
        updateLastGenerated({
          id: savedReportId,
          generatedAt: new Date().toISOString(),
        })
      );
    }
  }, [analytics, savedReportId, dispatch]);

  const handleExport = () => {
    if (!analytics) return;

    Alert.alert('Export Report', 'Choose a format to share.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Share as PDF',
        onPress: () =>
          exportReportPdf({
            config,
            analytics,
            comparison,
          }),
      },
      {
        text: 'Share as CSV',
        onPress: () =>
          exportReportCsv({
            config,
            analytics,
            comparison,
          }),
      },
    ]);
  };

  if (isLoading) return <LoadingState />;

  if (isError || !analytics) {
    return (
      <ErrorState
        message="Failed to load report data"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <ScreenLayout
      header={{
        title: REPORT_TEMPLATES[config.template].name,
        showBack: true,
        onBackPress: () => navigation.goBack(),
        rightActions: (
          <Button buttonStyle="plain" onPress={handleExport}>
            Export
          </Button>
        ),
      }}
      scrollable
    >
      <View style={styles.content}>
        {config.template === 'security-summary' ? (
          <SecuritySummaryReport
            analytics={analytics}
            comparison={comparison}
            devices={devices}
            config={config}
          />
        ) : config.template === 'activity-report' ? (
          <ActivityReportReport analytics={analytics} config={config} />
        ) : (
          <SignalAnalysisReport analytics={analytics} config={config} />
        )}
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
});
