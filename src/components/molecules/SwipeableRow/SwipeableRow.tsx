import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@components/atoms/Text/Text';
import { Icon } from '@components/atoms/Icon/Icon';

export interface SwipeAction {
  label: string;
  backgroundColor: string;
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
              { backgroundColor: action.backgroundColor },
            ]}
          >
            {action.icon && <View style={styles.iconContainer}>{action.icon}</View>}
            <Text variant="footnote" style={styles.actionLabel}>
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
    backgroundColor: colors.systemRed,
    onPress,
    icon: <Icon name="trash-outline" size={20} color="white" />,
  }),

  archive: (onPress: () => void): SwipeAction => ({
    label: 'Archive',
    backgroundColor: colors.systemOrange,
    onPress,
    icon: <Icon name="archive-outline" size={20} color="white" />,
  }),

  edit: (onPress: () => void): SwipeAction => ({
    label: 'Edit',
    backgroundColor: colors.systemBlue,
    onPress,
    icon: <Icon name="create-outline" size={20} color="white" />,
  }),

  share: (onPress: () => void): SwipeAction => ({
    label: 'Share',
    backgroundColor: colors.systemPurple,
    onPress,
    icon: <Icon name="share-outline" size={20} color="white" />,
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
    paddingHorizontal: 20,
    minWidth: 80,
  },
  iconContainer: {
    marginBottom: 4,
  },
  actionLabel: {
    color: 'white',
    fontWeight: '600',
  },
});
