import reducer, {
  setLoading,
  setLoadingMessage,
  setError,
  setSuccessMessage,
  clearMessages,
  setActiveTab,
  toggleSidebar,
  setSidebar,
} from '@store/slices/uiSlice';

describe('uiSlice', () => {
  const initialState = {
    isLoading: false,
    loadingMessage: '',
    error: null,
    successMessage: null,
    activeTab: 'home',
    sidebarOpen: false,
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setLoading true', () => {
    const actual = reducer(initialState, setLoading(true));
    expect(actual.isLoading).toBe(true);
  });

  it('should handle setLoading false and clear loading message', () => {
    const stateWithLoading = {
      ...initialState,
      isLoading: true,
      loadingMessage: 'Loading...',
    };
    const actual = reducer(stateWithLoading, setLoading(false));
    expect(actual.isLoading).toBe(false);
    expect(actual.loadingMessage).toBe('');
  });

  it('should handle setLoadingMessage', () => {
    const actual = reducer(initialState, setLoadingMessage('Processing...'));
    expect(actual.loadingMessage).toBe('Processing...');
    expect(actual.isLoading).toBe(true);
  });

  it('should handle setError', () => {
    const actual = reducer(initialState, setError('An error occurred'));
    expect(actual.error).toBe('An error occurred');
    expect(actual.isLoading).toBe(false);
  });

  it('should handle setSuccessMessage', () => {
    const actual = reducer(initialState, setSuccessMessage('Success!'));
    expect(actual.successMessage).toBe('Success!');
  });

  it('should handle clearMessages', () => {
    const stateWithMessages = {
      ...initialState,
      error: 'Error message',
      successMessage: 'Success message',
    };
    const actual = reducer(stateWithMessages, clearMessages());
    expect(actual.error).toBeNull();
    expect(actual.successMessage).toBeNull();
  });

  it('should handle setActiveTab', () => {
    const actual = reducer(initialState, setActiveTab('alerts'));
    expect(actual.activeTab).toBe('alerts');
  });

  it('should handle toggleSidebar', () => {
    const actual = reducer(initialState, toggleSidebar());
    expect(actual.sidebarOpen).toBe(true);
    const actualAgain = reducer(actual, toggleSidebar());
    expect(actualAgain.sidebarOpen).toBe(false);
  });

  it('should handle setSidebar', () => {
    const actual = reducer(initialState, setSidebar(true));
    expect(actual.sidebarOpen).toBe(true);
  });
});
