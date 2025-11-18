import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms/Text/Text';
import { Icon } from '@components/atoms/Icon/Icon';

export interface SwipeAction {
  label: string;
  backgroundColor: string;
  borderColor?: string;
  onPress: () => void;
  icon?: React.ReactNode;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  leftActions,
  rightActions,
}) => {
  const renderActions = (actions: SwipeAction[], side: 'left' | 'right') => {
    if (!actions || actions.length === 0) return null;

    const handleActionPress = async (action: SwipeAction) => {
      // Trigger medium impact haptic when action is executed
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      action.onPress();
    };

    return (
      <View
        style={[
          styles.actionsContainer,
          side === 'left' ? styles.leftActions : styles.rightActions,
        ]}
      >
        {actions.map((action, index) => (
          <Pressable
            key={index}
            onPress={() => handleActionPress(action)}
            style={[
              styles.actionButton,
              {
                backgroundColor: action.backgroundColor,
                borderColor: action.borderColor || action.backgroundColor,
              },
            ]}
          >
            {action.icon && <View style={styles.iconContainer}>{action.icon}</View>}
            <Text
              variant="footnote"
              style={[
                styles.actionLabel,
                { color: action.borderColor || action.backgroundColor },
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  // For now, this is a simplified implementation
  // In a full implementation, you would use react-native-gesture-handler's Swipeable
  // This provides the basic structure that can be enhanced with gesture handling
  return (
    <View style={styles.container}>
      {renderActions(leftActions || [], 'left')}
      <View style={styles.content}>{children}</View>
      {renderActions(rightActions || [], 'right')}
    </View>
  );
};

// Common action presets factory - pass theme colors
export const createSwipeActions = (colors: any) => ({
  delete: (onPress: () => void): SwipeAction => ({
    label: 'Delete',
    backgroundColor: `${colors.systemRed}20`, // 20 = ~12% opacity
    borderColor: colors.systemRed,
    onPress,
    icon: <Icon name="trash-outline" size={20} color={colors.systemRed} />,
  }),

  archive: (onPress: () => void): SwipeAction => ({
    label: 'Archive',
    backgroundColor: `${colors.systemOrange}20`, // 20 = ~12% opacity
    borderColor: colors.systemOrange,
    onPress,
    icon: <Icon name="archive-outline" size={20} color={colors.systemOrange} />,
  }),

  edit: (onPress: () => void): SwipeAction => ({
    label: 'Edit',
    backgroundColor: `${colors.systemBlue}20`, // 20 = ~12% opacity
    borderColor: colors.systemBlue,
    onPress,
    icon: <Icon name="create-outline" size={20} color={colors.systemBlue} />,
  }),

  share: (onPress: () => void): SwipeAction => ({
    label: 'Share',
    backgroundColor: `${colors.systemPurple}20`, // 20 = ~12% opacity
    borderColor: colors.systemPurple,
    onPress,
    icon: <Icon name="share-outline" size={20} color={colors.systemPurple} />,
  }),
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  leftActions: {
    justifyContent: 'flex-start',
  },
  rightActions: {
    justifyContent: 'flex-end',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: '100%',
    borderWidth: 2,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  iconContainer: {
    marginBottom: 4,
  },
  actionLabel: {
    fontWeight: '600',
  },
});
