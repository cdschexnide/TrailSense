import { create } from 'zustand';

interface UIState {
  isFilterModalOpen: boolean;
  selectedAlertFilter: string | null;
  radarZoomLevel: number;
  openFilterModal: () => void;
  closeFilterModal: () => void;
  setAlertFilter: (filter: string | null) => void;
  setRadarZoom: (level: number) => void;
}

export const useUIStore = create<UIState>(set => ({
  isFilterModalOpen: false,
  selectedAlertFilter: null,
  radarZoomLevel: 1,
  openFilterModal: () => set({ isFilterModalOpen: true }),
  closeFilterModal: () => set({ isFilterModalOpen: false }),
  setAlertFilter: filter => set({ selectedAlertFilter: filter }),
  setRadarZoom: level => set({ radarZoomLevel: level }),
}));
