import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from '@components/atoms/Icon';
import { useAppDispatch } from '@store/index';
import { logout } from '@store/slices/authSlice';
import { clearUser } from '@store/slices/userSlice';
import { resetSettings } from '@store/slices/settingsSlice';
import { isDemoMode } from '@/config/demoMode';
import { featureFlagsManager } from '@/config/featureFlags';
import { revertDemoModeConfig } from '@/config/demoModeRuntime';

interface SettingsOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({
  visible,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    if (isDemoMode()) {
      featureFlagsManager.updateFlags({ DEMO_MODE: false });
      revertDemoModeConfig(queryClient);
      queryClient.clear();
      dispatch(clearUser());
      dispatch(resetSettings());
    }

    await dispatch(logout());
    onClose();
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.overlay} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Icon name="close" size={22} color="#a8a898" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Icon name="log-out-outline" size={20} color="#ef4444" />
            <Text style={[styles.menuText, styles.logoutText]}>Log Out</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.version}>TrailSense v{version}</Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  overlay: {
    backgroundColor: '#1a1a14',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#2a2a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#e8e8e0',
    fontSize: 17,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a2a1a',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutText: {
    color: '#ef4444',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a2a1a',
  },
  version: {
    color: '#8a887a',
    fontSize: 12,
  },
});

export default SettingsOverlay;
