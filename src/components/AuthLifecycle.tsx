import { useAuth } from '@hooks/useAuth';
import { useAppSelector } from '@store/index';
import { useWebSocket } from '@hooks/useWebSocket';

export function AuthLifecycle() {
  useAuth();
  const token = useAppSelector(
    state => state.auth.tokens?.accessToken ?? null
  );
  useWebSocket(token);
  return null;
}
