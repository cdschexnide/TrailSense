import { create } from 'zustand';

interface FilterState {
  alertFilters: {
    severity: string[];
    deviceId: string | null;
    reviewed: boolean | null;
    dateRange: {
      start: string | null;
      end: string | null;
    };
  };
  deviceFilters: {
    status: string[];
    type: string | null;
    search: string;
  };
  setAlertSeverity: (severity: string[]) => void;
  setAlertDeviceId: (deviceId: string | null) => void;
  setAlertReviewed: (reviewed: boolean | null) => void;
  setAlertDateRange: (start: string | null, end: string | null) => void;
  setDeviceStatus: (status: string[]) => void;
  setDeviceType: (type: string | null) => void;
  setDeviceSearch: (search: string) => void;
  clearAlertFilters: () => void;
  clearDeviceFilters: () => void;
  clearAllFilters: () => void;
}

const initialAlertFilters = {
  severity: [],
  deviceId: null,
  reviewed: null,
  dateRange: {
    start: null,
    end: null,
  },
};

const initialDeviceFilters = {
  status: [],
  type: null,
  search: '',
};

export const useFilterStore = create<FilterState>(set => ({
  alertFilters: initialAlertFilters,
  deviceFilters: initialDeviceFilters,

  setAlertSeverity: severity =>
    set(state => ({
      alertFilters: { ...state.alertFilters, severity },
    })),

  setAlertDeviceId: deviceId =>
    set(state => ({
      alertFilters: { ...state.alertFilters, deviceId },
    })),

  setAlertReviewed: reviewed =>
    set(state => ({
      alertFilters: { ...state.alertFilters, reviewed },
    })),

  setAlertDateRange: (start, end) =>
    set(state => ({
      alertFilters: {
        ...state.alertFilters,
        dateRange: { start, end },
      },
    })),

  setDeviceStatus: status =>
    set(state => ({
      deviceFilters: { ...state.deviceFilters, status },
    })),

  setDeviceType: type =>
    set(state => ({
      deviceFilters: { ...state.deviceFilters, type },
    })),

  setDeviceSearch: search =>
    set(state => ({
      deviceFilters: { ...state.deviceFilters, search },
    })),

  clearAlertFilters: () =>
    set({
      alertFilters: initialAlertFilters,
    }),

  clearDeviceFilters: () =>
    set({
      deviceFilters: initialDeviceFilters,
    }),

  clearAllFilters: () =>
    set({
      alertFilters: initialAlertFilters,
      deviceFilters: initialDeviceFilters,
    }),
}));
