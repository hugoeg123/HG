# Plan: Appointment Origin Indicator & LeftSidebar Loading Fix

## Objective
- Track booking origin (`doctor_manual` vs `patient_marketplace`) and surface a compact badge in the time grid for marketplace bookings.
- Fix LeftSidebar spinner to show only during initial patient list load, avoiding UI lock during background refreshes.

## Integration Map
- New Migration: `backend/src/migrations/20251111120000-add-origin-to-appointments.js`
  - Connects To: `backend/src/models/sequelize/Appointment.js` via new `origin` column.
  - Side Effect: Enables filtering/indexing by `origin`.
- Updated Model: `backend/src/models/sequelize/Appointment.js`
  - Adds `origin` field with default `doctor_manual`.
  - Connects To: `backend/src/controllers/agenda.controller.js` during creation.
- Controller Update: `backend/src/controllers/agenda.controller.js`
  - Sets `origin` based on `req.user.role` (`patient_marketplace` for patients, `doctor_manual` for médicos, `system` otherwise).
  - Triggers: When calling `POST /agenda/appointments`.
- Frontend Store: `frontend/src/stores/timeSlotStore.js`
  - Merges `appointment.origin` with `booking.patientName` during `loadSlotsForWeek`.
  - Connects To: `agendaService.getAppointments` and `TimeGridSlot.jsx` for UI.
- UI Component: `frontend/src/components/TimeGridSlot.jsx`
  - Displays a small `Marketplace` badge when `slot.booking.origin === 'patient_marketplace'`.
- UI Component: `frontend/src/components/Layout/LeftSidebar.jsx`
  - Spinner shows only when `isLoading && patients.length === 0`.

## Data Flow
1. User action → Create appointment in backend.
2. Controller sets `origin` based on `req.user.role`.
3. Frontend `loadSlotsForWeek` fetches slots + appointments.
4. Store maps `{ patientName, origin }` into `slot.booking`.
5. `TimeGridSlot` renders badge when origin is marketplace.

## Hooks & Dependencies
- Triggers:
  - Appointment creation/update.
  - Weekly grid load (`loadSlotsForWeek`).
- Dependencies:
  - `agendaService.getSlots` and `agendaService.getAppointments` responses include `appointment.origin`.
- Side Effects:
  - LeftSidebar UX improvement; marketplace badge in grid.

## Testing Notes
- Backend: Run migration; create appointments as patient vs doctor; check `origin` persisted.
- Frontend: Load a week with booked appointments; verify badge appears only for marketplace bookings.

## FHIR & Compliance
- Non-PHI addition; origin flag is metadata.
- No impact on FHIR export logic.