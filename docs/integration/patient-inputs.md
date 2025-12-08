## Integration Map

- New File: `backend/src/models/sequelize/PatientTagEntry.js`
- New File: `backend/src/controllers/patientTag.controller.js`
- New File: `backend/src/routes/patient-input.routes.js`
- Updated File: `backend/src/models/sequelize/index.js`
- Updated File: `backend/src/index.js` and `backend/src/routes/index.js`
- Updated File: `frontend/src/services/api.js` (exports `patientInputService`)
- Updated File: `frontend/src/pages/Patient/Profile.jsx` (save via `patientInputService.create`)

### Connects To
- `backend/src/middleware/auth.js` and `backend/src/middleware/authorize.js` to enforce patient role
- `backend/src/config/database-pg.js` via Sequelize instance
- `frontend/src/components/patient/AgendaSummary.jsx` (profile dashboard context)

### Data Flow
1. Patient inputs weight/height/notes in `Profile.jsx`
2. Frontend calls `patientInputService.create` → `POST /api/patient-inputs`
3. Backend `patient-input.routes.js` applies `authMiddleware` + `authorize(['patient'])`
4. Controller `patientTag.controller.js#createEntry` builds tags/content and inserts into `PatientTagEntry`
5. Entry stored in PostgreSQL with JSONB fields for `tags` and `metadata`
6. Frontend may fetch entries via `patientInputService.listMy`

## Hooks & Dependencies
- Triggers: Patient action on Save in `Profile.jsx`
- Dependencies: `Patient` model must exist; user must be authenticated as `patient`
- Side Effects: New entries available for AI context and future FHIR exports

## Compliance & Standards
- Tags use `#TAG: value` format (`#PESO`, `#ALTURA`)
- JSONB fields used for structured metadata
- Error handling returns clear messages; centralized logging in controller

## Notes
- Environment uses migrations; controller includes safe `sync()` fallback for non-migrated dev setups
- Future: validate against TagDefinition and FHIR schemas for export