import React from 'react';
import { render } from '@testing-library/react-native';
import { ScrollView } from 'react-native';

// Mock all heavy dependencies so we only test structure
jest.mock('@/services/llm', () => ({
  useAI: () => ({
    isAvailable: true,
    isReady: true,
    isEnabling: false,
    isGenerating: false,
    downloadProgress: 0,
    response: null,
    enableAI: jest.fn(),
  }),
}));

jest.mock('@/config/featureFlags', () => ({
  FEATURE_FLAGS: { LLM_CONVERSATIONAL_ASSISTANT: true },
  shouldShowLLMFeatures: () => true,
}));

jest.mock('@/config/llmConfig', () => ({
  getStorageRequirements: () => ({ formattedTotal: '1.14 GB' }),
}));

jest.mock('@/hooks/useSecurityContext', () => ({
  useSecurityContext: () => ({
    totalAlerts: 5,
    unreviewedAlerts: 2,
    criticalAlerts: 0,
    highAlerts: 1,
    mediumAlerts: 2,
    lowAlerts: 2,
    alertsLast24h: 5,
    alertsLast7d: 20,
    totalDevices: 5,
    onlineDevices: 4,
    offlineDevices: 1,
    lowBatteryDevices: 0,
    wifiDetections: 3,
    bluetoothDetections: 1,
    cellularDetections: 1,
    recentAlerts: [],
    deviceList: [],
    mostActiveDevice: null,
    quietestPeriod: null,
    busiestPeriod: null,
    contextString: '',
    isLoading: false,
  }),
}));

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        systemBackground: '#000',
        secondarySystemBackground: '#1c1c1e',
        label: '#fff',
        secondaryLabel: '#8e8e93',
        separator: '#38383a',
        systemBlue: '#007AFF',
        systemRed: '#FF3B30',
        systemGray3: '#48484a',
        systemGray4: '#3a3a3c',
        systemGray5: '#2c2c2e',
        brandAccent: '#4A5240',
        primary: '#4A5240',
        tertiaryLabel: '#48484a',
        systemGreen: '#34C759',
        systemPurple: '#AF52DE',
        systemYellow: '#FFCC00',
        systemOrange: '#FF9500',
      },
    },
    colorScheme: 'dark',
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => (
    <mock-safe-area-view {...props}>{children}</mock-safe-area-view>
  ),
}));

jest.mock('@components/atoms/Text', () => ({
  Text: 'Text',
}));

jest.mock('@components/atoms/Icon', () => ({
  Icon: 'Icon',
}));

jest.mock('@/components/ai', () => ({
  ChatMessage: 'ChatMessage',
  SuggestionChips: 'SuggestionChips',
  SecurityStatusCard: 'SecurityStatusCard',
  DEFAULT_SUGGESTIONS: [],
  getContextualSuggestions: () => [],
}));

jest.mock('@assets/images/SmallTrailSenseCompanyLogo.png', () => 'logo');

import { AIAssistantScreen } from '@screens/ai/AIAssistantScreen';

describe('AIAssistantScreen welcome state', () => {
  it('renders welcome content inside a ScrollView', () => {
    const { UNSAFE_queryByType } = render(<AIAssistantScreen />);
    const scrollView = UNSAFE_queryByType(ScrollView);
    expect(scrollView).not.toBeNull();
  });

  it('ScrollView has keyboardShouldPersistTaps="handled"', () => {
    const { UNSAFE_queryByType } = render(<AIAssistantScreen />);
    const scrollView = UNSAFE_queryByType(ScrollView);
    expect(scrollView?.props.keyboardShouldPersistTaps).toBe('handled');
  });
});
