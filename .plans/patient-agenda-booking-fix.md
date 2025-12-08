# Patient Agenda Booking Fix

Objective: Restore booking via “Agendar” on patient agenda page by resolving backend errors introduced by appointment origin tracking.

## Integration Map
- **Backend**: `backend/src/controllers/agenda.controller.js` → createAppointment
- **Models**: `backend/src/models/sequelize/Appointment.js` + migration `20251111120000-add-origin-to-appointments.js`
- **Frontend**: `frontend/src/pages/Patient/AgendaPacienteMedico.jsx` → `handleBook` uses `agendaService.createAppointment`
- **Services**: `frontend/src/services/agendaService.js`, `frontend/src/services/marketplaceService.js`

## Root Cause
- Regression due to new `appointments.origin` column used in code but not present in DB when migrations were not applied, causing Postgres error 42703 (undefined column) during booking.

## Plan (MVP)
1. Apply DB migration to add `origin` column (script: `npm run db:migrate`).
2. Add defensive fallback in `createAppointment`:
   - Try insert with `origin`.
   - If DB reports undefined column (42703), retry insert without `origin` and log a warning.
3. Validate booking from patient agenda page; UI feedback should show success and slot marked booked.

## Hooks & Dependencies
- **Triggers**: Patient clicks “Agendar” → POST `/api/agenda/appointments`.
- **Dependencies**: Auth token (patient), `availability_slots` existing and status `available`.
- **Side Effects**: Slot status updated to `booked` and optional Socket.io notification to the doctor.

## Testing Notes
- Patient user: navigate to `/patient/doctor/:id/agenda` and book an available slot.
- Expect: 201 on appointments; slot becomes booked; success message shown.
- Error path: If migration missing, controller fallback ensures booking succeeds and logs warning.

## Documentation Hooks
- Connector: `createAppointment` documents fallback and the need to run migrations.
- Indexes: migration adds `appointments_origin` for query performance.

## Compliance
- Minimal code change; focused on resilience.
- Integration documented; files remain under existing architecture.