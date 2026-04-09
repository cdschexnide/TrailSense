import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, SkeletonCard, Text } from '@components/atoms';
import {
  BriefSummaryCard,
  FindingCard,
  PeriodPicker,
} from '@components/molecules';
import { ScreenLayout } from '@components/templates';
import { useAnalytics, useComparison } from '@hooks/useAnalytics';
import { useDevices } from '@hooks/useDevices';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { generateInsights } from '@services/analyticsInsights';
// Lazy import to avoid module-evaluation crash when LLM modules
// have circular or heavy initialisation chains.
const getLlmService = () =>
  (require('@services/llm') as { llmService: typeof import('@services/llm')['llmService'] }).llmService;
import { exportBriefCsv, exportBriefPdf } from '@services/reportExport';
import { useAppDispatch } from '@store/index';
import { setLastBriefGeneratedAt } from '@store/slices/savedReportsSlice';
import type {
  AnalyticsStackParamList,
  MoreStackParamList,
} from '@navigation/types';
import type { IntelligenceBrief, ReportPeriod } from '@/types/report';

type BriefScreenProps =
  | NativeStackScreenProps<AnalyticsStackParamList, 'Brief'>
  | NativeStackScreenProps<MoreStackParamList, 'Brief'>;

const buildFallbackSummary = ({
  totalAlerts,
  uniqueDevices,
  avgConfidence,
  nighttimeActivity,
}: {
  totalAlerts: number;
  uniqueDevices: number;
  avgConfidence: number;
  nighttimeActivity: { count: number; percentOfTotal: number };
}) =>
  `TrailSense recorded ${totalAlerts} detections from ${uniqueDevices} unique devices during this period. Average confidence held at ${Math.round(avgConfidence)}%, with ${nighttimeActivity.count} nighttime detections representing ${Math.round(nighttimeActivity.percentOfTotal)}% of total activity.

The property remains best characterized by the current threat distribution, overnight movement rate, and any shifts in unique-device volume or confidence quality versus the previous period.`;

export const BriefScreen = ({ navigation }: BriefScreenProps) => {
  const dispatch = useAppDispatch();
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [brief, setBrief] = useState<IntelligenceBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: analytics } = useAnalytics({ period });
  const { data: comparison } = useComparison({
    period: period === 'year' ? 'month' : period,
    enabled: period !== 'year',
  });
  const { data: devices = [] } = useDevices();

  const fallbackFindings = useMemo(
    () =>
      generateInsights(analytics, comparison, devices).map(insight => ({
        title: insight.title,
        description: insight.subtitle,
        severity: insight.severity,
        metric: insight.targetTab ? `Review ${insight.targetTab}` : undefined,
      })),
    [analytics, comparison, devices]
  );

  const generateBrief = async () => {
    if (!analytics) return;

    setLoading(true);

    try {
      // Use LLM only when enabled AND not in mock mode (mock inference
      // returns a canned alert summary, not a brief-formatted response).
      const useLlm =
        FEATURE_FLAGS.LLM_ENABLED && !FEATURE_FLAGS.LLM_MOCK_MODE;

      const result = useLlm
        ? await getLlmService().generateBrief({
            analytics,
            comparison,
            period,
          })
        : null;

      const hasValidResult =
        result &&
        result.summary &&
        result.findings &&
        result.findings.length > 0;

      const nextBrief: IntelligenceBrief = hasValidResult
        ? result
        : {
            summary: buildFallbackSummary(analytics),
            findings: fallbackFindings,
            generatedAt: new Date().toISOString(),
            period,
          };

      setBrief(nextBrief);
      dispatch(setLastBriefGeneratedAt(nextBrief.generatedAt));
    } catch {
      const nextBrief: IntelligenceBrief = {
        summary: buildFallbackSummary(analytics),
        findings: fallbackFindings,
        generatedAt: new Date().toISOString(),
        period,
      };
      setBrief(nextBrief);
      dispatch(setLastBriefGeneratedAt(nextBrief.generatedAt));
    } finally {
      setLoading(false);
    }
  };

  const exportBrief = () => {
    if (!brief) return;

    Alert.alert('Export Brief', 'Choose a format to share.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Share as PDF', onPress: () => exportBriefPdf(brief) },
      { text: 'Share as CSV', onPress: () => exportBriefCsv(brief) },
    ]);
  };

  return (
    <ScreenLayout
      header={{
        title: 'Intelligence Brief',
        showBack: true,
        onBackPress: () => navigation.goBack(),
        rightActions: brief ? (
          <Button buttonStyle="plain" onPress={exportBrief}>
            Export
          </Button>
        ) : undefined,
      }}
      scrollable
    >
      <View style={styles.content}>
        <PeriodPicker value={period} onChange={setPeriod} />

        <Button fullWidth onPress={generateBrief} loading={loading}>
          Generate Brief
        </Button>

        {loading ? (
          <View style={styles.skeletonContainer}>
            <SkeletonCard />
            <SkeletonCard />
            <Text
              variant="footnote"
              color="secondaryLabel"
              style={styles.loadingText}
            >
              Analyzing property data...
            </Text>
          </View>
        ) : null}

        {brief ? (
          <>
            <BriefSummaryCard summary={brief.summary} />
            <View style={styles.findings}>
              <Text variant="title3">Key Findings</Text>
              {brief.findings.map((finding, index) => (
                <FindingCard
                  key={`${finding.title}-${index}`}
                  finding={finding}
                />
              ))}
            </View>
          </>
        ) : null}
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 18,
  },
  skeletonContainer: {
    gap: 12,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 4,
  },
  findings: {
    gap: 12,
  },
});
