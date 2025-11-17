import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { inactivityService } from '@services/inactivityService';
import type { AuthState } from '../types/auth';

export const useAuth = (): AuthState => {
  const auth = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (auth.isAuthenticated) {
      // Start inactivity monitoring when user is authenticated
      inactivityService.start();
    }

    return () => {
      // Stop inactivity monitoring when component unmounts or user logs out
      if (auth.isAuthenticated) {
        inactivityService.stop();
      }
    };
  }, [auth.isAuthenticated]);

  return auth;
};
