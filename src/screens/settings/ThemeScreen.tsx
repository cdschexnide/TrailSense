/**
 * ThemeScreen
 *
 * Theme selection with:
 * - Light, Dark, System options
 * - Visual preview cards
 * - Instant theme switching
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms/Text';
import { Icon } from '@components/atoms/Icon';
import type { IconName } from '@components/atoms/Icon/Icon';
import { ScreenLayout } from '@components/templates';
import { ListSection } from '@components/molecules/ListSection';
import { useTheme } from '@hooks/useTheme';
import { ColorScheme } from '@theme/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  MoreStackParamList,
  SettingsStackParamList,
} from '@navigation/types';

type ThemeOption = ColorScheme | 'auto';

interface ThemeCardProps {
  option: ThemeOption;
  title: string;
  subtitle: string;
  icon: IconName;
  isSelected: boolean;
  onSelect: () => void;
}

type ThemeScreenProps =
  | NativeStackScreenProps<MoreStackParamList, 'Theme'>
  | NativeStackScreenProps<SettingsStackParamList, 'Theme'>;

const ThemeCard = ({
  option,
  title,
  subtitle,
  icon,
  isSelected,
  onSelect,
}: ThemeCardProps) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const getPreviewColors = () => {
    switch (option) {
      case 'light':
        return { bg: '#FFFFFF', card: '#F2F2F7', text: '#000000' };
      case 'dark':
        return { bg: '#000000', card: '#1C1C1E', text: '#FFFFFF' };
      case 'auto':
        return {
          bg: 'linear',
          card: colors.tertiarySystemBackground,
          text: colors.label,
        };
    }
  };

  const previewColors = getPreviewColors();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSelect();
      }}
      style={({ pressed }) => [
        styles.themeCard,
        { backgroundColor: colors.secondarySystemBackground },
        isSelected && { borderColor: colors.systemBlue, borderWidth: 2 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {/* Preview */}
      <View style={styles.previewContainer}>
        {option === 'auto' ? (
          <View style={styles.splitPreview}>
            <View
              style={[
                styles.previewHalf,
                {
                  backgroundColor: '#FFFFFF',
                  borderTopLeftRadius: 10,
                  borderBottomLeftRadius: 10,
                },
              ]}
            >
              <View
                style={[styles.previewCard, { backgroundColor: '#F2F2F7' }]}
              />
              <View
                style={[styles.previewLine, { backgroundColor: '#000000' }]}
              />
            </View>
            <View
              style={[
                styles.previewHalf,
                {
                  backgroundColor: '#000000',
                  borderTopRightRadius: 10,
                  borderBottomRightRadius: 10,
                },
              ]}
            >
              <View
                style={[styles.previewCard, { backgroundColor: '#1C1C1E' }]}
              />
              <View
                style={[styles.previewLine, { backgroundColor: '#FFFFFF' }]}
              />
            </View>
          </View>
        ) : (
          <View style={[styles.preview, { backgroundColor: previewColors.bg }]}>
            <View
              style={[
                styles.previewCard,
                { backgroundColor: previewColors.card },
              ]}
            />
            <View
              style={[
                styles.previewLine,
                { backgroundColor: previewColors.text },
              ]}
            />
            <View
              style={[
                styles.previewLine,
                styles.previewLineShort,
                { backgroundColor: previewColors.text },
              ]}
            />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: colors.systemBlue + '20' },
          ]}
        >
          <Icon name={icon} size={20} color={colors.systemBlue} />
        </View>
        <View style={styles.cardText}>
          <Text variant="body" weight="semibold" color="label">
            {title}
          </Text>
          <Text
            variant="caption1"
            style={{ color: colors.secondaryLabel, marginTop: 2 }}
          >
            {subtitle}
          </Text>
        </View>
        {isSelected && (
          <View
            style={[styles.checkmark, { backgroundColor: colors.systemBlue }]}
          >
            <Icon name="checkmark" size={14} color="#FFFFFF" />
          </View>
        )}
      </View>
    </Pressable>
  );
};

export const ThemeScreen = ({ navigation }: ThemeScreenProps) => {
  const { theme, setColorScheme } = useTheme();
  const colors = theme.colors;

  // Determine current selection - if colorScheme matches system, it's likely 'auto'
  // We need to track the actual user preference
  const [currentSelection, setCurrentSelection] =
    React.useState<ThemeOption>('auto');

  // Load current preference on mount
  React.useEffect(() => {
    const loadPreference = async () => {
      const saved = await AsyncStorage.getItem('@trailsense:theme');
      if (saved) {
        setCurrentSelection(saved as ThemeOption);
      }
    };
    loadPreference();
  }, []);

  const handleThemeSelect = (newTheme: ThemeOption) => {
    setCurrentSelection(newTheme);
    setColorScheme(newTheme);
  };

  return (
    <ScreenLayout
      header={{
        title: 'Theme',
        showBack: true,
        onBackPress: () => navigation.goBack(),
      }}
      scrollable
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View
          style={[
            styles.heroIconContainer,
            { backgroundColor: colors.systemPurple + '20' },
          ]}
        >
          <Icon name="color-palette" size={32} color={colors.systemPurple} />
        </View>
        <Text
          variant="headline"
          weight="semibold"
          color="label"
          style={{ marginTop: 16 }}
        >
          Appearance
        </Text>
        <Text
          variant="subheadline"
          style={{
            color: colors.secondaryLabel,
            marginTop: 4,
            textAlign: 'center',
          }}
        >
          Choose how TrailSense looks to you
        </Text>
      </View>

      {/* Theme Options */}
      <ListSection header="SELECT THEME" style={styles.section}>
        <ThemeCard
          option="light"
          title="Light"
          subtitle="Always use light mode"
          icon="sunny-outline"
          isSelected={currentSelection === 'light'}
          onSelect={() => handleThemeSelect('light')}
        />
        <ThemeCard
          option="dark"
          title="Dark"
          subtitle="Always use dark mode"
          icon="moon-outline"
          isSelected={currentSelection === 'dark'}
          onSelect={() => handleThemeSelect('dark')}
        />
        <ThemeCard
          option="auto"
          title="System"
          subtitle="Match device settings"
          icon="phone-portrait-outline"
          isSelected={currentSelection === 'auto'}
          onSelect={() => handleThemeSelect('auto')}
        />
      </ListSection>

      {/* Info Note */}
      <View
        style={[
          styles.infoCard,
          { backgroundColor: colors.secondarySystemBackground },
        ]}
      >
        <Icon
          name="information-circle-outline"
          size={20}
          color={colors.secondaryLabel}
        />
        <Text
          variant="caption1"
          style={{ color: colors.secondaryLabel, marginLeft: 10, flex: 1 }}
        >
          When set to System, the app will automatically switch between light
          and dark mode based on your device settings.
        </Text>
      </View>

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
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  themeCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  previewContainer: {
    padding: 16,
    paddingBottom: 12,
  },
  preview: {
    height: 80,
    borderRadius: 10,
    padding: 12,
  },
  splitPreview: {
    flexDirection: 'row',
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewHalf: {
    flex: 1,
    padding: 10,
  },
  previewCard: {
    height: 24,
    borderRadius: 4,
    marginBottom: 8,
  },
  previewLine: {
    height: 8,
    borderRadius: 4,
    opacity: 0.3,
  },
  previewLineShort: {
    width: '60%',
    marginTop: 6,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingTop: 0,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    marginLeft: 12,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
  },
});
