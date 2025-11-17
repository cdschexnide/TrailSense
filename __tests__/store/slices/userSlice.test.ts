import reducer, {
  setUser,
  updateUser,
  setLoading,
  setError,
  clearUser,
  User,
} from '@store/slices/userSlice';

describe('userSlice', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
    organization: 'Test Org',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const initialState = {
    currentUser: null,
    loading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setUser', () => {
    const actual = reducer(initialState, setUser(mockUser));
    expect(actual.currentUser).toEqual(mockUser);
    expect(actual.error).toBeNull();
  });

  it('should handle updateUser', () => {
    const stateWithUser = {
      ...initialState,
      currentUser: mockUser,
    };
    const updates = { name: 'Updated Name' };
    const actual = reducer(stateWithUser, updateUser(updates));
    expect(actual.currentUser?.name).toBe('Updated Name');
    expect(actual.currentUser?.email).toBe(mockUser.email);
  });

  it('should handle setLoading', () => {
    const actual = reducer(initialState, setLoading(true));
    expect(actual.loading).toBe(true);
  });

  it('should handle setError', () => {
    const error = 'Something went wrong';
    const actual = reducer(initialState, setError(error));
    expect(actual.error).toBe(error);
    expect(actual.loading).toBe(false);
  });

  it('should handle clearUser', () => {
    const stateWithUser = {
      currentUser: mockUser,
      loading: true,
      error: 'Some error',
    };
    const actual = reducer(stateWithUser, clearUser());
    expect(actual).toEqual(initialState);
  });
});
