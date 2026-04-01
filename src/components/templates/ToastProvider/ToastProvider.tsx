import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Toast, ToastVariant } from '@components/molecules/Toast';

interface ToastState {
  message: string;
  variant: ToastVariant;
  visible: boolean;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => undefined,
});

export const useToast = (): ToastContextType => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    variant: 'success',
    visible: false,
  });

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      setToast({
        message,
        variant,
        visible: true,
      });
    },
    []
  );

  const handleDismiss = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const value = useMemo(
    () => ({
      showToast,
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onDismiss={handleDismiss}
      />
    </ToastContext.Provider>
  );
};
