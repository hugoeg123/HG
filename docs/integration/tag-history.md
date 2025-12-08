## Tag History Timeline Integration

This document maps the integration for the Tag History Timeline feature across backend and frontend.

## Integration Map
- New File: `backend/src/controllers/tagHistory.controller.js`
- New File: `backend/src/routes/tag-history.routes.js`
- New File: `frontend/src/components/patient/TagHistoryTimeline.jsx`
- Updated File: `frontend/src/services/api.js` (added `tagHistoryService`)

### Connects To
- `backend/src/models/sequelize` → uses `PatientTagEntry`, `Record` for data aggregation
- `frontend/src/pages/Patient/Profile.jsx` → renders the timeline component in the "Histórico" tab
- `frontend/src/store/authStore.js` → supplies the authenticated token and patient context

### Data Flow
1. User opens `Patient/Profile` → Tab "Histórico" renders `TagHistoryTimeline`.
2. Component calls `tagHistoryService.get(tagKey, { patientId, start, end, limit })`.
3. Frontend makes `GET /api/tag-history/:tagKey` with query params.
4. Backend controller aggregates from `PatientTagEntry` and `Record` (normalized keys/units, author metadata).
5. Controller returns `{ count, items: [...] }`.
6. UI displays a timeline with value, unit, source, author, and timestamp.

## Hooks & Dependencies
- Triggers: route `GET /api/tag-history/:tagKey` with `authMiddleware` + `authorize(['medico','patient','admin','enfermeira'])`.
- Dependencies: Authentication via JWT (`authMiddleware`), Sequelize models for patient inputs and records.
- Side Effects: None; read-only aggregation endpoint.

## Backend Notes
- Route file: applies `authMiddleware` before role-based `authorize` to ensure `req.user` is available.
- Controller: normalizes tag keys (e.g., `PESO`, `ALTURA`), extracts numeric values with units from free text, and merges entries.
- Error Handling: returns 401 for missing auth, 403 for insufficient roles; network/server failures are logged via centralized error paths.

## Frontend Notes
- `TagHistoryTimeline.jsx`
  - States: `loading`, `error`, `items`.
  - Props: `tagKey`, `patientId`, optional filters.
  - Renders list of entries with date, value+unit, source (patient input/record), author name.

- `services/api.js`
  - `tagHistoryService.get(tagKey, params)` → uses `throttledApi.get('/tag-history/${tagKey}', { params })`.
  - Leverages existing interceptors (Authorization header, retries) and single-flight to avoid duplicate requests.

## Testing
- Script: `backend/test-tag-history.js`
  - Logs in, fetches a patient ID via `/api/patients`, then hits `/api/tag-history/PESO` and `/api/tag-history/ALTURA`.
  - Enhanced diagnostics for HTTP errors and request metadata.

## Compliance & Documentation
- Connector comments added in route/controller and component per project standards.
- Read-only endpoint; no PHI mutations; respects existing security and role checks.