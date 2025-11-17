# TrailSense Mobile App - State Management

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Status:** ✅ Complete
**Prerequisites**: [04-NAVIGATION.md](./04-NAVIGATION.md)

---

## State Management Architecture

### Three-Layer Approach

1. **Redux Toolkit**: Global application state (auth, user, settings)
2. **React Query**: Server state (alerts, devices, API data)
3. **Zustand**: UI state (modals, filters, temporary flags)

---

## Redux Store Configuration

```typescript
// src/store/index.ts

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'settings'],
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    user: userReducer,
    settings: settingsReducer,
    ui: uiReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

## React Query Setup

```typescript
// src/api/queryClient.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
```

### Query Hooks

```typescript
// src/hooks/useAlerts.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@api/endpoints/alerts';

export const useAlerts = (filters?: AlertFilters) => {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => alertsApi.getAlerts(filters),
  });
};

export const useMarkAlertReviewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => alertsApi.markReviewed(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};
```

---

## Zustand Store

```typescript
// src/store/uiStore.ts

import create from 'zustand';

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
```

---

## TODO Checklist

### Redux Setup

- [x] **1.1** Configure Redux store with persist
- [x] **1.2** Create authSlice (completed in auth)
- [x] **1.3** Create userSlice
- [x] **1.4** Create settingsSlice
- [x] **1.5** Create uiSlice
- [x] **1.6** Wrap App with Redux Provider

### React Query Setup

- [x] **2.1** Configure QueryClient
- [x] **2.2** Wrap App with QueryClientProvider
- [x] **2.3** Create query hooks for alerts
- [x] **2.4** Create query hooks for devices
- [x] **2.5** Create query hooks for whitelist
- [ ] **2.6** Implement optimistic updates (future enhancement)

### Zustand Setup

- [x] **3.1** Create UI store
- [x] **3.2** Create filter store
- [x] **3.3** Create radar store

### Testing

- [x] **4.1** Test Redux slices
- [x] **4.2** Test query hooks
- [ ] **4.3** Test optimistic updates (pending 2.6)
- [ ] **4.4** Test state persistence (future enhancement)

---

**Next Document**: [06-BACKEND-INTEGRATION.md](./06-BACKEND-INTEGRATION.md)
