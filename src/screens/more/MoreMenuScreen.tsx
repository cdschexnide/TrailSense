import React from 'react';
import { ScreenLayout } from '@components/templates';
import { GroupedListSection, GroupedListRow } from '@components/molecules';

export const MoreMenuScreen = ({ navigation }: any) => {
  return (
    <ScreenLayout
      header={{ title: 'More', largeTitle: true }}
      scrollable={true}
    >
      <GroupedListSection title="Insights">
        <GroupedListRow
          title="Analytics"
          icon="analytics"
          iconColor="#6B6B4E"
          showChevron
          onPress={() => navigation.navigate('Dashboard')}
        />
        <GroupedListRow
          title="AI Assistant"
          icon="sparkles-outline"
          iconColor="#8A6090"
          showChevron
          onPress={() => navigation.navigate('TrailSenseAI')}
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
