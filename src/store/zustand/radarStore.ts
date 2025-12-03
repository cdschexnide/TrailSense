import { create } from 'zustand';

interface RadarState {
  zoomLevel: number;
  center: {
    latitude: number;
    longitude: number;
  } | null;
  selectedLayerId: string | null;
  visibleLayers: string[];
  autoUpdate: boolean;
  updateInterval: number; // in seconds
  setZoomLevel: (level: number) => void;
  setCenter: (latitude: number, longitude: number) => void;
  setSelectedLayer: (layerId: string | null) => void;
  toggleLayer: (layerId: string) => void;
  setVisibleLayers: (layerIds: string[]) => void;
  toggleAutoUpdate: () => void;
  setUpdateInterval: (interval: number) => void;
  resetRadar: () => void;
}

const initialState = {
  zoomLevel: 1,
  center: null,
  selectedLayerId: null,
  visibleLayers: ['alerts', 'devices'],
  autoUpdate: true,
  updateInterval: 60,
};

export const useRadarStore = create<RadarState>(set => ({
  ...initialState,

  setZoomLevel: level => set({ zoomLevel: level }),

  setCenter: (latitude, longitude) => set({ center: { latitude, longitude } }),

  setSelectedLayer: layerId => set({ selectedLayerId: layerId }),

  toggleLayer: layerId =>
    set(state => ({
      visibleLayers: state.visibleLayers.includes(layerId)
        ? state.visibleLayers.filter(id => id !== layerId)
        : [...state.visibleLayers, layerId],
    })),

  setVisibleLayers: layerIds => set({ visibleLayers: layerIds }),

  toggleAutoUpdate: () => set(state => ({ autoUpdate: !state.autoUpdate })),

  setUpdateInterval: interval => set({ updateInterval: interval }),

  resetRadar: () => set(initialState),
}));
