import React from 'react';
import { SwipeableRow, swipeActions } from '@components/molecules/SwipeableRow';
import { ListRow } from '@components/molecules/ListRow';

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
