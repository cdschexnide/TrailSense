import React from 'react';
import { render } from '@testing-library/react-native';
import { StatusChip } from '@components/molecules/StatusChip/StatusChip';

describe('StatusChip', () => {
  it('shows "No active detections" when count is 0', () => {
    const { getByText } = render(<StatusChip count={0} />);
    expect(getByText('No active detections')).toBeTruthy();
  });

  it('shows singular "device" for count of 1', () => {
    const { getByText } = render(<StatusChip count={1} />);
    expect(getByText('1 device detected')).toBeTruthy();
  });

  it('shows plural "devices" for count > 1', () => {
    const { getByText } = render(<StatusChip count={5} />);
    expect(getByText('5 devices detected')).toBeTruthy();
  });

  it('uses active dot color when count > 0', () => {
    const { toJSON } = render(<StatusChip count={3} />);
    const tree = toJSON();
    // The second child of the container is the dot view
    const dot = (tree as any).children[0];
    const flatStyle = Array.isArray(dot.props.style)
      ? Object.assign({}, ...dot.props.style)
      : dot.props.style;
    expect(flatStyle.backgroundColor).toBe('#fbbf24');
  });

  it('uses idle dot color when count is 0', () => {
    const { toJSON } = render(<StatusChip count={0} />);
    const tree = toJSON();
    const dot = (tree as any).children[0];
    const flatStyle = Array.isArray(dot.props.style)
      ? Object.assign({}, ...dot.props.style)
      : dot.props.style;
    expect(flatStyle.backgroundColor).toBe('#4ade80');
  });
});
