import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
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

jest.mock('@/hooks/api/useAlerts', () => ({
  useAlerts: () => ({ data: [] }),
}));

jest.mock('@/hooks/api/useDevices', () => ({
  useDevices: () => ({ data: [] }),
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
  ChatMessage: ({ message }: any) => (
    <mock-chat-message testID={`chat-message-${message.role}`}>
      {message.content}
    </mock-chat-message>
  ),
  SuggestionChips: ({ compact }: any) => (
    <mock-suggestion-chips
      testID={compact ? 'suggestion-chips-compact' : 'suggestion-chips-full'}
    />
  ),
  SecurityStatusCard: 'SecurityStatusCard',
  DEFAULT_SUGGESTIONS: [],
  getContextualSuggestions: () => [],
}));

jest.mock('@assets/images/SmallTrailSenseCompanyLogo.png', () => 'logo');

import { AIAssistantScreen } from '@screens/ai/AIAssistantScreen';

describe('AIAssistantScreen welcome state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('keeps welcome suggestions in a footer outside the scroll body', () => {
    const { getByTestId, queryByTestId } = render(<AIAssistantScreen />);

    expect(getByTestId('ai-footer')).toHaveStyle({
      flexShrink: 0,
    });
    expect(getByTestId('ai-welcome-body')).toHaveStyle({
      flex: 1,
      minHeight: 0,
    });
    expect(getByTestId('ai-welcome-suggestions')).toBeTruthy();
    expect(getByTestId('suggestion-chips-full')).toBeTruthy();
    expect(queryByTestId('ai-quick-actions')).toBeNull();
  });

  it('uses a bounded chat content area and keeps quick actions in the footer', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify([
        {
          role: 'user',
          content: 'Which sensors need attention?',
          timestamp: 1,
        },
        {
          role: 'assistant',
          content: 'West perimeter is low on battery.',
          timestamp: 2,
        },
      ])
    );

    const { getByTestId, queryByTestId } = render(<AIAssistantScreen />);

    await waitFor(() => {
      expect(getByTestId('ai-content-area')).toHaveStyle({
        flex: 1,
        minHeight: 0,
      });
    });

    expect(getByTestId('ai-chat-scroll')).toHaveStyle({ flex: 1 });
    expect(getByTestId('ai-quick-actions')).toBeTruthy();
    expect(getByTestId('suggestion-chips-compact')).toBeTruthy();
    expect(queryByTestId('ai-welcome-suggestions')).toBeNull();
  });
});
