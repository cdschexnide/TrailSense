import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  GroupedListSection,
  ReportTemplateRow,
  SavedReportRow,
} from '@components/molecules';
import { ScreenLayout } from '@components/templates';
import { useAppDispatch, useAppSelector } from '@store/index';
import { deleteSavedReport } from '@store/slices/savedReportsSlice';
import type {
  AnalyticsStackParamList,
  MoreStackParamList,
} from '@navigation/types';
import { REPORT_TEMPLATES } from '@/types/report';

type ReportsScreenProps =
  | NativeStackScreenProps<AnalyticsStackParamList, 'Reports'>
  | NativeStackScreenProps<MoreStackParamList, 'Reports'>;

const formatBriefSubtitle = (lastGeneratedAt?: string) => {
  if (!lastGeneratedAt) {
    return 'Generate an AI-powered security briefing';
  }

  return `Last generated ${new Date(lastGeneratedAt).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  )}`;
};

export const ReportsScreen = ({ navigation }: ReportsScreenProps) => {
  const dispatch = useAppDispatch();
  const savedReports = useAppSelector(state => state.savedReports.reports);
  const lastBriefGeneratedAt = useAppSelector(
    state => state.savedReports.lastBriefGeneratedAt
  );

  const navigate = navigation as {
    navigate: (
      screen: 'Brief' | 'ReportBuilder',
      params?: {
        template?: keyof typeof REPORT_TEMPLATES;
        savedReportId?: string;
      }
    ) => void;
  };

  return (
    <ScreenLayout
      header={{
        title: 'Reports',
        showBack: true,
        onBackPress: () => navigation.goBack(),
      }}
      scrollable
    >
      <View style={styles.content}>
      <GroupedListSection title="Intelligence Brief">
        <ReportTemplateRow
          title="Intelligence Brief"
          description={formatBriefSubtitle(lastBriefGeneratedAt)}
          icon="sparkles-outline"
          onPress={() => navigate.navigate('Brief')}
        />
      </GroupedListSection>

      <GroupedListSection title="Report Templates">
        {(
          Object.keys(REPORT_TEMPLATES) as Array<keyof typeof REPORT_TEMPLATES>
        ).map(template => (
          <ReportTemplateRow
            key={template}
            title={REPORT_TEMPLATES[template].name}
            description={REPORT_TEMPLATES[template].description}
            icon={REPORT_TEMPLATES[template].icon}
            onPress={() =>
              navigate.navigate('ReportBuilder', {
                template,
              })
            }
          />
        ))}
      </GroupedListSection>

      <GroupedListSection
        title="Saved Reports"
        footer={
          savedReports.length === 0
            ? 'No saved reports yet. Generate a report and save it for quick access.'
            : undefined
        }
      >
        {savedReports.map(report => (
          <SavedReportRow
            key={report.id}
            report={report}
            onPress={() =>
              navigate.navigate('ReportBuilder', {
                template: report.config.template,
                savedReportId: report.id,
              })
            }
            onDelete={() =>
              Alert.alert(
                'Delete Saved Report',
                `Remove "${report.name}" from saved reports?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => dispatch(deleteSavedReport(report.id)),
                  },
                ]
              )
            }
          />
        ))}
      </GroupedListSection>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
    paddingBottom: 32,
  },
});
