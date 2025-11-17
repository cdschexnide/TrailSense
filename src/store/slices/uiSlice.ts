import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  successMessage: string | null;
  activeTab: string;
  sidebarOpen: boolean;
}

const initialState: UIState = {
  isLoading: false,
  loadingMessage: '',
  error: null,
  successMessage: null,
  activeTab: 'home',
  sidebarOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (!action.payload) {
        state.loadingMessage = '';
      }
    },
    setLoadingMessage: (state, action: PayloadAction<string>) => {
      state.loadingMessage = action.payload;
      state.isLoading = true;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setSuccessMessage: (state, action: PayloadAction<string | null>) => {
      state.successMessage = action.payload;
    },
    clearMessages: state => {
      state.error = null;
      state.successMessage = null;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    toggleSidebar: state => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebar: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
  },
});

export const {
  setLoading,
  setLoadingMessage,
  setError,
  setSuccessMessage,
  clearMessages,
  setActiveTab,
  toggleSidebar,
  setSidebar,
} = uiSlice.actions;

export default uiSlice.reducer;
