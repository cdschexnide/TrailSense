import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AIProvider, useAI } from '@/services/llm/AIProvider';
import { llmService } from '@/services/llm/LLMService';
import { inferenceEngine } from '@/services/llm/inferenceEngine';
import { modelManager } from '@/services/llm/modelManager';
import { featureFlagsManager } from '@/config/featureFlags';

const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <AIProvider showDownloadModal={false}>{children}</AIProvider>
);

describe('LLM mock mode flow', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    modelManager.reset();
    featureFlagsManager.resetToDefaults();
    featureFlagsManager.updateFlags({
      LLM_ENABLED: true,
      LLM_ALERT_SUMMARIES: true,
      LLM_PATTERN_ANALYSIS: true,
      LLM_CONVERSATIONAL_ASSISTANT: true,
      LLM_MOCK_MODE: true,
    });
  });

  afterEach(async () => {
    await llmService.shutdown();
    featureFlagsManager.resetToDefaults();
  });

  it('enables AI in mock mode without loading the native model', async () => {
    const loadModelSpy = jest
      .spyOn(modelManager, 'loadModel')
      .mockRejectedValue(new Error('loadModel should not run in mock mode'));

    const { result } = renderHook(() => useAI(), { wrapper });

    await act(async () => {
      await result.current.enableAI();
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(loadModelSpy).not.toHaveBeenCalled();
  });

  it('uses mock inference for chat without loading the native model', async () => {
    const loadModelSpy = jest
      .spyOn(modelManager, 'loadModel')
      .mockRejectedValue(new Error('loadModel should not run in mock mode'));
    const inferenceSpy = jest
      .spyOn(inferenceEngine, 'generate')
      .mockResolvedValue('Mock assistant reply');

    const response = await llmService.chat({
      messages: [
        {
          role: 'user',
          content: 'What happened overnight?',
          timestamp: Date.now(),
        },
      ],
      securityContext: {
        recentAlerts: [],
        deviceStatus: [],
      },
    });

    expect(response.message).toBe('Mock assistant reply');
    expect(loadModelSpy).not.toHaveBeenCalled();
    expect(inferenceSpy).toHaveBeenCalledTimes(1);
  });
});
