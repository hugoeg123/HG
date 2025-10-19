// Test file to verify agenda components are working correctly
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import WeeklyTimeGrid from '../WeeklyTimeGrid';
import TimeSlotConfig from '../TimeSlotConfig';
import AvailabilitySettings from '../AvailabilitySettings';
import TimeGridControls from '../TimeGridControls';

describe('Agenda Components', () => {
  it('should render WeeklyTimeGrid without errors', () => {
    const { container } = render(<WeeklyTimeGrid />);
    expect(container).toBeTruthy();
  });

  it('should render TimeSlotConfig without errors', () => {
    const { container } = render(<TimeSlotConfig open={true} onOpenChange={() => {}} />);
    expect(container).toBeTruthy();
  });

  it('should render AvailabilitySettings without errors', () => {
    const { container } = render(<AvailabilitySettings open={true} onOpenChange={() => {}} />);
    expect(container).toBeTruthy();
  });

  it('should render TimeGridControls without errors', () => {
    const { container } = render(<TimeGridControls />);
    expect(container).toBeTruthy();
  });
});