import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
  title: string;
  value: number | string;
  change?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change }) => {
  const isPositive = change?.startsWith('+');
  const isNegative = change?.startsWith('-');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {change && (
        <Text
          style={[
            styles.change,
            isPositive && styles.changePositive,
            isNegative && styles.changeNegative,
          ]}
        >
          {change}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  title: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
  changePositive: {
    color: '#00C853',
  },
  changeNegative: {
    color: '#FF5252',
  },
});
