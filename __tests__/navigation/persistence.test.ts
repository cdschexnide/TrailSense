import {
  sanitizeNavigationState,
  type PersistedNavigationState,
} from '@/navigation/persistence';

describe('sanitizeNavigationState', () => {
  it('drops persisted Main state when the user is not authenticated', () => {
    const persistedState: PersistedNavigationState = {
      index: 0,
      routes: [{ name: 'Main' }],
    };

    expect(sanitizeNavigationState(persistedState, false)).toBeUndefined();
  });

  it('drops persisted Auth state when the user is authenticated', () => {
    const persistedState: PersistedNavigationState = {
      index: 0,
      routes: [{ name: 'Auth' }],
    };

    expect(sanitizeNavigationState(persistedState, true)).toBeUndefined();
  });

  it('keeps persisted state when the auth gate matches the root route', () => {
    const persistedState: PersistedNavigationState = {
      index: 0,
      routes: [{ name: 'Auth' }],
    };

    expect(sanitizeNavigationState(persistedState, false)).toEqual(
      persistedState
    );
  });
});
