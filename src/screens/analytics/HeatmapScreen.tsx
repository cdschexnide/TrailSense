import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MapView, { Heatmap, PROVIDER_GOOGLE } from 'react-native-maps';
import { useHeatmapData } from '@hooks/useAnalytics';
import { DetectionType } from '@types';

export const HeatmapScreen = () => {
  const [selectedType, setSelectedType] = useState<DetectionType | 'all'>('all');
  const { data: heatmapPoints, isLoading } = useHeatmapData();

  const filteredPoints =
    selectedType === 'all'
      ? heatmapPoints
      : heatmapPoints?.filter((point) => point.type === selectedType);

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Detection Type:</Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedType === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedType('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedType === 'all' && styles.filterButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedType === 'cellular' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedType('cellular')}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedType === 'cellular' && styles.filterButtonTextActive,
              ]}
            >
              Cellular
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedType === 'wifi' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedType('wifi')}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedType === 'wifi' && styles.filterButtonTextActive,
              ]}
            >
              WiFi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedType === 'bluetooth' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedType('bluetooth')}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedType === 'bluetooth' && styles.filterButtonTextActive,
              ]}
            >
              Bluetooth
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading heatmap...</Text>
        </View>
      ) : (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: filteredPoints?.[0]?.latitude || 37.78825,
            longitude: filteredPoints?.[0]?.longitude || -122.4324,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {filteredPoints && filteredPoints.length > 0 && (
            <Heatmap
              points={filteredPoints.map((point) => ({
                latitude: point.latitude,
                longitude: point.longitude,
                weight: point.weight || 1,
              }))}
              radius={50}
              opacity={0.7}
              gradient={{
                colors: ['green', 'yellow', 'orange', 'red'],
                startPoints: [0.01, 0.25, 0.5, 1],
                colorMapSize: 256,
              }}
            />
          )}
        </MapView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  filterLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
