import React from 'react';
import { Icon } from '@components/atoms';
import { ListRow } from '@components/molecules/ListRow';

interface ReportTemplateRowProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}

export const ReportTemplateRow: React.FC<ReportTemplateRowProps> = ({
  title,
  description,
  icon,
  onPress,
}) => {
  return (
    <ListRow
      title={title}
      subtitle={description}
      leftIcon={<Icon name={icon as any} size={22} color="systemBlue" />}
      accessoryType="disclosureIndicator"
      onPress={onPress}
    />
  );
};

export default ReportTemplateRow;
