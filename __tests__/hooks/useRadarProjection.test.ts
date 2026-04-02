import { renderHook } from '@testing-library/react-native';
import { useRadarProjection } from '@hooks/useRadarProjection';

const PROPERTY_CENTER = { latitude: 31.530757, longitude: -110.287842 };

describe('useRadarProjection', () => {
  it('projects property center to canvas center', () => {
    const { result } = renderHook(() =>
      useRadarProjection({
        propertyCenter: PROPERTY_CENTER,
        canvasSize: 350,
        maxRange: 244,
      })
    );

    const point = result.current.project(
      PROPERTY_CENTER.latitude,
      PROPERTY_CENTER.longitude
    );
    expect(point.x).toBeCloseTo(175, 0);
    expect(point.y).toBeCloseTo(175, 0);
  });

  it('projects due north toward the top of the canvas', () => {
    const { result } = renderHook(() =>
      useRadarProjection({
        propertyCenter: PROPERTY_CENTER,
        canvasSize: 350,
        maxRange: 244,
      })
    );

    const point = result.current.project(
      PROPERTY_CENTER.latitude + 0.0022,
      PROPERTY_CENTER.longitude
    );
    expect(point.x).toBeCloseTo(175, 0);
    expect(point.y).toBeLessThan(175);
  });

  it('clips points beyond the max range', () => {
    const { result } = renderHook(() =>
      useRadarProjection({
        propertyCenter: PROPERTY_CENTER,
        canvasSize: 350,
        maxRange: 244,
      })
    );

    const point = result.current.project(
      PROPERTY_CENTER.latitude + 0.01,
      PROPERTY_CENTER.longitude
    );
    const distance = Math.sqrt((point.x - 175) ** 2 + (point.y - 175) ** 2);
    expect(distance).toBeCloseTo(165, -1);
  });
});
