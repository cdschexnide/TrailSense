import React from 'react';
import { render } from '@testing-library/react-native';
import { ChatMessage } from '@/components/ai/ChatMessage';

jest.mock('@components/atoms/Text', () => ({
  Text: 'Text',
}));

jest.mock('@/components/ai/cards/CardRouter', () => ({
  CardRouter: () => <mock-card-router testID="card-router" />,
}));

jest.mock('@/components/ai/cards/TextCard', () => ({
  TextCard: () => <mock-text-card testID="text-card" />,
}));

describe('ChatMessage', () => {
  it('stretches assistant cards across the message column while keeping the timestamp left-aligned', () => {
    const { getByTestId } = render(
      <ChatMessage
        message={{
          role: 'assistant',
          content: 'Assessment text',
          timestamp: 1,
          structuredData: {
            type: 'device_query',
            devices: [],
            alertCounts: {},
          },
        }}
      />
    );

    expect(getByTestId('ai-message-container')).toHaveStyle({
      alignItems: 'stretch',
    });
    expect(getByTestId('ai-message-timestamp')).toHaveStyle({
      alignSelf: 'flex-start',
    });
  });
});
