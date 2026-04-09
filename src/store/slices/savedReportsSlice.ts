import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SavedReport } from '@/types/report';

export interface SavedReportsState {
  reports: SavedReport[];
  lastBriefGeneratedAt?: string;
}

const initialState: SavedReportsState = {
  reports: [],
  lastBriefGeneratedAt: undefined,
};

const savedReportsSlice = createSlice({
  name: 'savedReports',
  initialState,
  reducers: {
    addSavedReport: (state, action: PayloadAction<SavedReport>) => {
      state.reports.unshift(action.payload);
    },
    updateSavedReport: (
      state,
      action: PayloadAction<{ id: string } & Partial<Omit<SavedReport, 'id'>>>
    ) => {
      const index = state.reports.findIndex(
        report => report.id === action.payload.id
      );
      if (index >= 0) {
        const { id: _id, ...updates } = action.payload;
        Object.assign(state.reports[index], updates);
      }
    },
    deleteSavedReport: (state, action: PayloadAction<string>) => {
      state.reports = state.reports.filter(
        report => report.id !== action.payload
      );
    },
    updateLastGenerated: (
      state,
      action: PayloadAction<{ id: string; generatedAt: string }>
    ) => {
      const report = state.reports.find(item => item.id === action.payload.id);
      if (report) {
        report.lastGeneratedAt = action.payload.generatedAt;
      }
    },
    setLastBriefGeneratedAt: (state, action: PayloadAction<string>) => {
      state.lastBriefGeneratedAt = action.payload;
    },
  },
});

export const {
  addSavedReport,
  updateSavedReport,
  deleteSavedReport,
  updateLastGenerated,
  setLastBriefGeneratedAt,
} = savedReportsSlice.actions;

export default savedReportsSlice.reducer;
