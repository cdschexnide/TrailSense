import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenLayout } from '@components/templates';
import { GroupedListSection, GroupedListRow } from '@components/molecules';
import { TacticalHeader } from '@components/organisms';
import { MoreStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<MoreStackParamList, 'MoreMenu'>;

export const MoreMenuScreen = ({ navigation }: Props) => {
  return (
    <ScreenLayout customHeader={<TacticalHeader title="MORE" />} scrollable>
      <GroupedListSection title="Insights">
        <GroupedListRow
          title="Analytics"
          icon="analytics"
          iconColor="#6B6B4E"
          showChevron
          onPress={() => navigation.navigate('Dashboard')}
        />
      </GroupedListSection>

      <GroupedListSection title="Preferences">
        <GroupedListRow
          title="Settings"
          icon="settings-outline"
          iconColor="#7A7A70"
          showChevron
          onPress={() => navigation.navigate('Settings')}
        />
      </GroupedListSection>
    </ScreenLayout>
  );
};
