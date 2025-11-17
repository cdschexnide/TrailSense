import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Card, Button, Badge } from '@components/atoms';

interface WhitelistItemProps {
  item: {
    id: string;
    name: string;
    macAddress: string;
    category?: string;
    expiresAt?: string;
  };
  onDelete: () => void;
}

export const WhitelistItem: React.FC<WhitelistItemProps> = ({ item, onDelete }) => {
  const handleDelete = () => {
    Alert.alert(
      'Remove from Whitelist',
      `Are you sure you want to remove "${item.name}" from the whitelist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  const isTemporary = !!item.expiresAt;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.mac}>{item.macAddress}</Text>
        </View>
        <View style={styles.badges}>
          {item.category && (
            <Badge label={item.category.toUpperCase()} color="info" />
          )}
          {isTemporary && (
            <Badge label="TEMPORARY" color="warning" />
          )}
        </View>
      </View>

      {isTemporary && item.expiresAt && (
        <Text style={styles.expires}>
          Expires: {new Date(item.expiresAt).toLocaleDateString()}
        </Text>
      )}

      <Button
        title="Remove"
        variant="ghost"
        size="sm"
        onPress={handleDelete}
        style={styles.button}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  mac: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.6,
  },
  badges: {
    gap: 4,
  },
  expires: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
  },
  button: {
    alignSelf: 'flex-start',
  },
});
