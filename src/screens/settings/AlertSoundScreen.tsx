/**
 * AlertSoundScreen
 *
 * Alert sound customization with:
 * - Sound selection for different threat levels
 * - Preview playback
 * - Volume control
 */

import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Switch } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import { ScreenLayout } from '@components/templates';
import { ListSection } from '@components/molecules/ListSection';
import { useTheme } from '@hooks/useTheme';

interface SoundOption {
  id: string;
  name: string;
  description: string;
}

const SOUND_OPTIONS: SoundOption[] = [
  { id: 'alert', name: 'Alert', description: 'Standard alert tone' },
  { id: 'chime', name: 'Chime', description: 'Gentle chime sound' },
  { id: 'beacon', name: 'Beacon', description: 'Urgent beacon signal' },
  { id: 'radar', name: 'Radar', description: 'Radar ping sound' },
  { id: 'siren', name: 'Siren', description: 'Warning siren' },
  { id: 'none', name: 'None', description: 'Silent (vibration only)' },
];

interface SoundRowProps {
  sound: SoundOption;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

const SoundRow = ({ sound, isSelected, onSelect, onPreview }: SoundRowProps) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect();
      }}
      style={({ pressed }) => [
        styles.soundRow,
        { backgroundColor: colors.secondarySystemBackground },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.soundInfo}>
        <Text variant="body" weight="semibold" color="label">
          {sound.name}
        </Text>
        <Text variant="caption1" style={{ color: colors.secondaryLabel, marginTop: 2 }}>
          {sound.description}
        </Text>
      </View>

      {sound.id !== 'none' && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPreview();
          }}
          style={[styles.playButton, { backgroundColor: colors.systemBlue + '20' }]}
        >
          <Icon name="play" size={16} color={colors.systemBlue} />
        </Pressable>
      )}

      {isSelected && (
        <View style={[styles.checkmark, { backgroundColor: colors.systemBlue }]}>
          <Icon name="checkmark" size={14} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );
};

export const AlertSoundScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const [criticalSound, setCriticalSound] = useState('siren');
  const [highSound, setHighSound] = useState('beacon');
  const [mediumSound, setMediumSound] = useState('alert');
  const [lowSound, setLowSound] = useState('chime');
  const [customSoundsEnabled, setCustomSoundsEnabled] = useState(true);

  const handlePreview = (soundId: string) => {
    // In production, this would play the actual sound
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    console.log('Preview sound:', soundId);
  };

  return (
    <ScreenLayout
      header={{
        title: 'Alert Sounds',
        showBack: true,
        onBackPress: () => navigation.goBack(),
      }}
      scrollable
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={[styles.heroIconContainer, { backgroundColor: colors.systemPink + '20' }]}>
          <Icon name="musical-notes" size={32} color={colors.systemPink} />
        </View>
        <Text variant="headline" weight="semibold" color="label" style={{ marginTop: 16 }}>
          Alert Sounds
        </Text>
        <Text variant="subheadline" style={{ color: colors.secondaryLabel, marginTop: 4, textAlign: 'center' }}>
          Customize sounds for different threat levels
        </Text>
      </View>

      {/* Custom Sounds Toggle */}
      <View style={[styles.toggleCard, { backgroundColor: colors.secondarySystemBackground }]}>
        <View style={[styles.toggleIcon, { backgroundColor: colors.systemPink + '20' }]}>
          <Icon name="options-outline" size={20} color={colors.systemPink} />
        </View>
        <View style={styles.toggleContent}>
          <Text variant="body" weight="semibold" color="label">
            Custom Sounds per Level
          </Text>
          <Text variant="caption1" style={{ color: colors.secondaryLabel, marginTop: 2 }}>
            Different sounds for each threat level
          </Text>
        </View>
        <Switch
          value={customSoundsEnabled}
          onValueChange={(val) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCustomSoundsEnabled(val);
          }}
          trackColor={{ true: colors.systemPink }}
        />
      </View>

      {customSoundsEnabled ? (
        <>
          {/* Critical Alerts */}
          <ListSection header="CRITICAL ALERTS" style={styles.section}>
            <View style={[styles.levelIndicator, { backgroundColor: '#FF3B30' + '20' }]}>
              <View style={[styles.levelDot, { backgroundColor: '#FF3B30' }]} />
              <Text variant="caption1" weight="semibold" style={{ color: '#FF3B30', marginLeft: 8 }}>
                Immediate security risks
              </Text>
            </View>
            {SOUND_OPTIONS.map((sound) => (
              <SoundRow
                key={sound.id}
                sound={sound}
                isSelected={criticalSound === sound.id}
                onSelect={() => setCriticalSound(sound.id)}
                onPreview={() => handlePreview(sound.id)}
              />
            ))}
          </ListSection>

          {/* High Alerts */}
          <ListSection header="HIGH ALERTS" style={styles.section}>
            <View style={[styles.levelIndicator, { backgroundColor: '#FF9500' + '20' }]}>
              <View style={[styles.levelDot, { backgroundColor: '#FF9500' }]} />
              <Text variant="caption1" weight="semibold" style={{ color: '#FF9500', marginLeft: 8 }}>
                Significant concerns
              </Text>
            </View>
            {SOUND_OPTIONS.map((sound) => (
              <SoundRow
                key={sound.id}
                sound={sound}
                isSelected={highSound === sound.id}
                onSelect={() => setHighSound(sound.id)}
                onPreview={() => handlePreview(sound.id)}
              />
            ))}
          </ListSection>

          {/* Medium Alerts */}
          <ListSection header="MEDIUM ALERTS" style={styles.section}>
            <View style={[styles.levelIndicator, { backgroundColor: '#FFCC00' + '20' }]}>
              <View style={[styles.levelDot, { backgroundColor: '#FFCC00' }]} />
              <Text variant="caption1" weight="semibold" style={{ color: '#FFCC00', marginLeft: 8 }}>
                Moderate events
              </Text>
            </View>
            {SOUND_OPTIONS.map((sound) => (
              <SoundRow
                key={sound.id}
                sound={sound}
                isSelected={mediumSound === sound.id}
                onSelect={() => setMediumSound(sound.id)}
                onPreview={() => handlePreview(sound.id)}
              />
            ))}
          </ListSection>

          {/* Low Alerts */}
          <ListSection header="LOW ALERTS" style={styles.section}>
            <View style={[styles.levelIndicator, { backgroundColor: '#34C759' + '20' }]}>
              <View style={[styles.levelDot, { backgroundColor: '#34C759' }]} />
              <Text variant="caption1" weight="semibold" style={{ color: '#34C759', marginLeft: 8 }}>
                Minor events
              </Text>
            </View>
            {SOUND_OPTIONS.map((sound) => (
              <SoundRow
                key={sound.id}
                sound={sound}
                isSelected={lowSound === sound.id}
                onSelect={() => setLowSound(sound.id)}
                onPreview={() => handlePreview(sound.id)}
              />
            ))}
          </ListSection>
        </>
      ) : (
        <ListSection header="ALL ALERTS" style={styles.section}>
          <Text variant="caption1" style={[styles.sectionNote, { color: colors.secondaryLabel }]}>
            This sound will be used for all alert levels
          </Text>
          {SOUND_OPTIONS.map((sound) => (
            <SoundRow
              key={sound.id}
              sound={sound}
              isSelected={criticalSound === sound.id}
              onSelect={() => {
                setCriticalSound(sound.id);
                setHighSound(sound.id);
                setMediumSound(sound.id);
                setLowSound(sound.id);
              }}
              onPreview={() => handlePreview(sound.id)}
            />
          ))}
        </ListSection>
      )}

      <View style={{ height: 40 }} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 14,
    borderRadius: 14,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionNote: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  levelIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  soundInfo: {
    flex: 1,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
