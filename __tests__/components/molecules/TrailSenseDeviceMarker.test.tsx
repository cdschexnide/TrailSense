import React from 'react';
import { render } from '@testing-library/react-native';
import { TrailSenseDeviceMarker } from '@/components/molecules/TrailSenseDeviceMarker';

jest.mock('@rnmapbox/maps', () => ({
  PointAnnotation: ({ children }: any) => (
    <mock-point-annotation>{children}</mock-point-annotation>
  ),
}));

describe('TrailSenseDeviceMarker', () => {
  it('keeps a non-collapsable wrapper as the single PointAnnotation child', () => {
    const { UNSAFE_getByType } = render(
      <TrailSenseDeviceMarker
        id="device-1"
        coordinate={[-110.287842, 31.530757]}
      />
    );

    const annotation = UNSAFE_getByType('mock-point-annotation');
    const wrapper = React.Children.only(
      annotation.props.children
    ) as React.ReactElement;

    expect(wrapper.props.collapsable).toBe(false);
  });
});
