import { useMemo } from 'react';

interface UseRadarProjectionOptions {
  propertyCenter: { latitude: number; longitude: number };
  canvasSize: number;
  maxRange: number;
}

const metersPerDegLat = () => 111_320;
const metersPerDegLng = (lat: number) =>
  111_320 * Math.cos((lat * Math.PI) / 180);

export function useRadarProjection({
  propertyCenter,
  canvasSize,
  maxRange,
}: UseRadarProjectionOptions) {
  return useMemo(() => {
    const center = canvasSize / 2;
    const radius = center - 10;
    const latMeters = metersPerDegLat();
    const lngMeters = metersPerDegLng(propertyCenter.latitude);

    const project = (lat: number, lng: number) => {
      const northMeters = (lat - propertyCenter.latitude) * latMeters;
      const eastMeters = (lng - propertyCenter.longitude) * lngMeters;
      const distance = Math.sqrt(northMeters ** 2 + eastMeters ** 2);
      const boundedDistance = Math.min(distance, maxRange);
      const pixelDistance = (boundedDistance / maxRange) * radius;
      const angle = Math.atan2(eastMeters, northMeters);

      return {
        x: center + pixelDistance * Math.sin(angle),
        y: center - pixelDistance * Math.cos(angle),
      };
    };

    return { project, center, radius };
  }, [propertyCenter.latitude, propertyCenter.longitude, canvasSize, maxRange]);
}
