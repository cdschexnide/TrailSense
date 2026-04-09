import reducer, {
  addSavedReport,
  updateSavedReport,
  deleteSavedReport,
  updateLastGenerated,
  setLastBriefGeneratedAt,
} from '@store/slices/savedReportsSlice';
import type { ReportConfig, SavedReport } from '@/types/report';

const makeConfig = (overrides?: Partial<ReportConfig>): ReportConfig => ({
  template: 'security-summary',
  period: 'week',
  threatLevels: ['critical', 'high', 'medium', 'low'],
  detectionTypes: ['cellular', 'wifi', 'bluetooth'],
  deviceIds: ['dev-1', 'dev-2'],
  ...overrides,
});

const makeSaved = (overrides?: Partial<SavedReport>): SavedReport => ({
  id: 'report-1',
  name: 'My Report',
  config: makeConfig(),
  createdAt: '2026-04-08T00:00:00.000Z',
  ...overrides,
});

describe('savedReportsSlice', () => {
  const initialState = {
    reports: [] as SavedReport[],
    lastBriefGeneratedAt: undefined,
  };

  it('returns the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('adds a saved report', () => {
    const report = makeSaved();
    const state = reducer(initialState, addSavedReport(report));
    expect(state.reports).toHaveLength(1);
    expect(state.reports[0]).toEqual(report);
  });

  it('updates a saved report', () => {
    const report = makeSaved();
    const state = reducer(
      { ...initialState, reports: [report] },
      updateSavedReport({
        ...report,
        name: 'Updated Name',
      })
    );
    expect(state.reports[0].name).toBe('Updated Name');
  });

  it('deletes a saved report', () => {
    const report = makeSaved();
    const state = reducer(
      { ...initialState, reports: [report] },
      deleteSavedReport(report.id)
    );
    expect(state.reports).toEqual([]);
  });

  it('updates last generated timestamp', () => {
    const report = makeSaved();
    const state = reducer(
      { ...initialState, reports: [report] },
      updateLastGenerated({
        id: report.id,
        generatedAt: '2026-04-08T12:00:00.000Z',
      })
    );
    expect(state.reports[0].lastGeneratedAt).toBe('2026-04-08T12:00:00.000Z');
  });

  it('tracks last brief generated time', () => {
    const state = reducer(
      initialState,
      setLastBriefGeneratedAt('2026-04-08T09:30:00.000Z')
    );
    expect(state.lastBriefGeneratedAt).toBe('2026-04-08T09:30:00.000Z');
  });
});
