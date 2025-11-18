import React from 'react';
import { SwipeableRow, createSwipeActions } from '@components/molecules/SwipeableRow';
import { ListRow } from '@components/molecules/ListRow';
import { useTheme } from '@hooks/useTheme';

interface WhitelistItemProps {
  name: string;
  macAddress: string;
  category: string;
  onDelete: () => void;
}

export const WhitelistItem: React.FC<WhitelistItemProps> = ({
  name,
  macAddress,
  category,
  onDelete,
}) => {
  const { theme } = useTheme();
  const swipeActions = createSwipeActions(theme.colors);

  return (
    <SwipeableRow rightActions={[swipeActions.delete(onDelete)]}>
      <ListRow
        title={name}
        subtitle={macAddress}
        rightText={category}
        accessoryType="none"
      />
    </SwipeableRow>
  );
};
