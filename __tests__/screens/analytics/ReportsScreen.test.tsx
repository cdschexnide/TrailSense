import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@theme/index';
import { ReportsScreen } from '@screens/analytics/ReportsScreen';
import savedReportsReducer from '@store/slices/savedReportsSlice';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

jest.mock('@rnmapbox/maps', () => ({
  PointAnnotation: 'PointAnnotation',
  MapView: 'MapView',
  Camera: 'Camera',
}));

const mockNavigate = jest.fn();
const navigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
} as any;

const route = { key: 'reports', name: 'Reports', params: undefined } as any;

const renderScreen = (preloadedState?: any) => {
  const store = configureStore({
    reducer: {
      savedReports: savedReportsReducer,
    },
    preloadedState,
  });

  return render(
    <Provider store={store}>
      <NavigationContainer>
        <ThemeProvider>
          <ReportsScreen navigation={navigation} route={route} />
        </ThemeProvider>
      </NavigationContainer>
    </Provider>
  );
};

describe('ReportsScreen', () => {
  it('renders the three report templates', () => {
    const { getByText } = renderScreen();
    expect(getByText('Security Summary')).toBeTruthy();
    expect(getByText('Activity Report')).toBeTruthy();
    expect(getByText('Signal Analysis')).toBeTruthy();
  });

  it('navigates to brief screen', async () => {
    const { getByRole } = renderScreen();
    fireEvent.press(getByRole('button', { name: 'Intelligence Brief' }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Brief');
    });
  });

  it('renders saved reports from store', () => {
    const { getByText } = renderScreen({
      savedReports: {
        reports: [
          {
            id: 'saved-1',
            name: 'Weekly Review',
            config: {
              template: 'security-summary',
              period: 'week',
              threatLevels: ['critical', 'high', 'medium', 'low'],
              detectionTypes: ['wifi', 'bluetooth', 'cellular'],
              deviceIds: ['dev-1'],
            },
            createdAt: '2026-04-08T00:00:00.000Z',
            lastGeneratedAt: '2026-04-08T12:00:00.000Z',
          },
        ],
        lastBriefGeneratedAt: undefined,
      },
    });

    expect(getByText('Weekly Review')).toBeTruthy();
  });
});
