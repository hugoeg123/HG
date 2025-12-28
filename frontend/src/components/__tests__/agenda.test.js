// Test file to verify agenda components are working correctly
import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WeeklyTimeGrid from '../WeeklyTimeGrid';
import TimeSlotConfig from '../TimeSlotConfig';
import AvailabilitySettings from '../AvailabilitySettings';
import TimeGridControls from '../TimeGridControls';

global.ResizeObserver =
  global.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

vi.mock('../../store/timeSlotStore', () => ({
  useTimeSlotStore: () => ({
    timeSlots: [],
    selectedWeek: new Date(),
    isCreatingSlot: false,
    draggedSlot: null,
    getCenteredWeekDays: () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * 24 * 60 * 60 * 1000));
    },
    getSlotsForDay: () => [],
    addManualSlot: () => {},
    setIsCreatingSlot: () => {},
    setDraggedSlot: () => {},
    checkConflicts: () => [],
    timeRanges: [],
    loadSlotsForWeek: () => {},
    createSlotInBackend: () => {},
    createSlotsFromRangeInBackend: () => {},
    createSlotsFromRangeWithSettings: () => {},
    updateSlotInBackend: () => {},
    deleteSlotInBackend: () => {},
    createAppointmentForSlot: () => {},
    confirmAppointmentPatientForSlot: () => {},
    cancelAppointmentForSlot: () => {},
    markingMode: 'default',
    setMarkingMode: () => {},
    setAppointmentDuration: () => {},
    setIntervalBetween: () => {},
    availabilitySettings: {},
    setSelectedWeek: () => {},
    appointmentDuration: 30,
    intervalBetween: 15,
    settings: {
      minWorkHour: 6,
      maxWorkHour: 22,
      defaultDuration: 30,
      defaultInterval: 15,
      timeStep: 15,
      modalities: [],
      allowOverlap: false,
      autoConfirm: false,
      showWeekends: false,
      maxRangesPerDay: 3,
      maxAdvanceBooking: 30
    },
    updateSettings: () => {},
    resetSettings: () => {}
  })
}));

vi.mock('../../store/patientStore.js', () => ({
  usePatientStore: () => ({
    patients: [],
    fetchPatients: () => {},
    createPatient: () => {},
    currentPatient: null
  })
}));

const renderWithRouter = (element) =>
  render(createElement(MemoryRouter, null, element));

describe('Agenda Components', () => {
  it('should render WeeklyTimeGrid without errors', () => {
    const { container } = renderWithRouter(createElement(WeeklyTimeGrid));
    expect(container).toBeTruthy();
  });

  it('should render TimeSlotConfig without errors', () => {
    const { container } = render(createElement(TimeSlotConfig, { open: true, onOpenChange: () => {} }));
    expect(container).toBeTruthy();
  });

  it('should render AvailabilitySettings without errors', () => {
    const { container } = render(createElement(AvailabilitySettings, { open: true, onOpenChange: () => {} }));
    expect(container).toBeTruthy();
  });

  it('should render TimeGridControls without errors', () => {
    const { container } = render(createElement(TimeGridControls));
    expect(container).toBeTruthy();
  });
});
