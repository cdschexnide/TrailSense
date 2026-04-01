import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Icon, Text } from '@components/atoms';
import { useTheme } from '@hooks/useTheme';

type IconName = keyof typeof Ionicons.glyphMap;

interface PermissionScreenProps {
  icon: IconName;
  title: string;
  description: string;
  onAllow: () => void;
  onSkip?: () => void;
}

export const PermissionScreen: React.FC<PermissionScreenProps> = ({
  icon,
  title,
  description,
  onAllow,
  onSkip,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.systemBackground },
      ]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.colors.secondarySystemBackground },
          ]}
        >
          <Icon name={icon} size={48} color="systemBlue" />
        </View>
        <Text
          variant="title1"
          weight="bold"
          align="center"
          style={styles.title}
        >
          {title}
        </Text>
        <Text
          variant="body"
          color="secondaryLabel"
          align="center"
          style={styles.description}
        >
          {description}
        </Text>
      </View>
      <View style={styles.buttons}>
        <Button buttonStyle="filled" onPress={onAllow}>
          Allow
        </Button>
        {onSkip ? (
          <Button buttonStyle="plain" onPress={onSkip}>
            Maybe Later
          </Button>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
  },
  description: {
    maxWidth: 300,
    marginBottom: 24,
  },
  buttons: {
    gap: 12,
    paddingBottom: 16,
  },
});
