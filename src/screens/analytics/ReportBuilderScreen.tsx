import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Text } from '@components/atoms';
import {
  FilterChip,
  GroupedListSection,
  ListRow,
  PeriodPicker,
} from '@components/molecules';
import { ScreenLayout } from '@components/templates';
import { useTheme } from '@hooks/useTheme';
import { useDevices } from '@hooks/useDevices';
import { useAppDispatch, useAppSelector } from '@store/index';
import {
  addSavedReport,
  updateSavedReport,
} from '@store/slices/savedReportsSlice';
import type {
  AnalyticsStackParamList,
  MoreStackParamList,
} from '@navigation/types';
import type { DetectionType, ThreatLevel } from '@/types/alert';
import type { ReportConfig, ReportPeriod } from '@/types/report';
import { REPORT_TEMPLATES } from '@/types/report';

type ReportBuilderScreenProps =
  | NativeStackScreenProps<AnalyticsStackParamList, 'ReportBuilder'>
  | NativeStackScreenProps<MoreStackParamList, 'ReportBuilder'>;

const THREAT_LEVELS: ThreatLevel[] = ['critical', 'high', 'medium', 'low'];
const DETECTION_TYPES: DetectionType[] = ['wifi', 'bluetooth', 'cellular'];

const toggleValue = <T extends string>(items: T[], value: T) =>
  items.includes(value)
    ? items.filter(item => item !== value)
    : [...items, value];

const generateId = () =>
  `saved-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const ReportBuilderScreen = ({
  navigation,
  route,
}: ReportBuilderScreenProps) => {
  const { template, savedReportId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const savedReport = useAppSelector(state =>
    state.savedReports.reports.find(report => report.id === savedReportId)
  );
  const { data: devices = [] } = useDevices();
  const initialConfig = savedReport?.config;
  const inputRef = useRef<TextInput>(null);

  const [period, setPeriod] = useState<ReportPeriod>(
    initialConfig?.period || 'week'
  );
  const [threatLevels, setThreatLevels] = useState<ThreatLevel[]>(
    initialConfig?.threatLevels || THREAT_LEVELS
  );
  const [detectionTypes, setDetectionTypes] = useState<DetectionType[]>(
    initialConfig?.detectionTypes || DETECTION_TYPES
  );
  const [deviceIds, setDeviceIds] = useState<string[]>(
    initialConfig?.deviceIds || []
  );
  const [saving, setSaving] = useState(false);
  const [reportName, setReportName] = useState(savedReport?.name || '');

  useEffect(() => {
    if (devices.length > 0 && deviceIds.length === 0 && !initialConfig) {
      setDeviceIds(devices.map(device => device.id));
    }
  }, [devices, deviceIds.length, initialConfig]);

  const config = useMemo<ReportConfig>(
    () => ({
      template,
      period,
      threatLevels,
      detectionTypes,
      deviceIds,
    }),
    [template, period, threatLevels, detectionTypes, deviceIds]
  );

  const persistReport = () => {
    const trimmedName = reportName.trim();
    if (!trimmedName) return;

    const payload = {
      id: savedReport?.id || generateId(),
      name: trimmedName,
      config,
      createdAt: savedReport?.createdAt || new Date().toISOString(),
      lastGeneratedAt: savedReport?.lastGeneratedAt,
    };

    if (savedReport) {
      dispatch(updateSavedReport(payload));
    } else {
      dispatch(addSavedReport(payload));
    }

    Keyboard.dismiss();
    setSaving(false);
  };

  const openSaveFlow = () => {
    setSaving(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const cancelSave = () => {
    Keyboard.dismiss();
    setSaving(false);
  };

  return (
    <ScreenLayout
      header={{
        title: REPORT_TEMPLATES[template].name,
        showBack: true,
        onBackPress: () => navigation.goBack(),
        rightActions: (
          <Button buttonStyle="plain" onPress={openSaveFlow}>
            Save
          </Button>
        ),
      }}
      scrollable
    >
      <View style={styles.content}>
        {saving && (
          <View
            style={[
              styles.saveSection,
              {
                backgroundColor:
                  theme.colors.secondarySystemGroupedBackground,
                borderColor: theme.colors.separator,
              },
            ]}
          >
            <Text variant="headline" weight="semibold">
              Save Report
            </Text>
            <TextInput
              ref={inputRef}
              value={reportName}
              onChangeText={setReportName}
              placeholder="Weekly Security Summary"
              placeholderTextColor={theme.colors.tertiaryLabel}
              returnKeyType="done"
              onSubmitEditing={persistReport}
              style={[
                styles.saveInput,
                {
                  color: theme.colors.label,
                  backgroundColor: theme.colors.systemBackground,
                  borderColor: theme.colors.separator,
                },
              ]}
            />
            <View style={styles.saveActions}>
              <Button buttonStyle="gray" onPress={cancelSave}>
                Cancel
              </Button>
              <Button onPress={persistReport}>Save</Button>
            </View>
          </View>
        )}

        <PeriodPicker value={period} onChange={setPeriod} />

        <GroupedListSection title="Threat Levels">
          <View style={styles.chipWrap}>
            {THREAT_LEVELS.map(level => (
              <FilterChip
                key={level}
                label={level}
                count={0}
                color={
                  level === 'critical'
                    ? theme.colors.systemRed
                    : level === 'high'
                      ? theme.colors.systemOrange
                      : level === 'medium'
                        ? theme.colors.systemYellow
                        : theme.colors.systemGreen
                }
                isSelected={threatLevels.includes(level)}
                onPress={() =>
                  setThreatLevels(toggleValue(threatLevels, level))
                }
              />
            ))}
          </View>
        </GroupedListSection>

        <GroupedListSection title="Detection Types">
          <View style={styles.chipWrap}>
            {DETECTION_TYPES.map(type => (
              <FilterChip
                key={type}
                label={type}
                count={0}
                color={theme.colors.systemBlue}
                isSelected={detectionTypes.includes(type)}
                onPress={() =>
                  setDetectionTypes(toggleValue(detectionTypes, type))
                }
              />
            ))}
          </View>
        </GroupedListSection>

        <GroupedListSection title="Devices">
          {devices.map(device => (
            <ListRow
              key={device.id}
              title={device.name}
              subtitle={device.online ? 'Online' : 'Offline'}
              accessoryType={
                deviceIds.includes(device.id) ? 'checkmark' : 'none'
              }
              onPress={() => setDeviceIds(toggleValue(deviceIds, device.id))}
            />
          ))}
        </GroupedListSection>

        <Button
          fullWidth
          onPress={() =>
            (navigation as any).navigate('ReportPreview', {
              config,
              savedReportId,
            })
          }
        >
          Generate Report
        </Button>
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
  },
  saveSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  saveInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
  },
  saveActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});
