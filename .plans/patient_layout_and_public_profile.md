# Patient Layout Defaults & Public Profile Sanitization

## Integration Map
- **New/Updated Files**:
  - `frontend/src/components/Layout/MainLayout.jsx` (added `initialLeftCollapsed`, `initialRightCollapsed` props)
  - `frontend/src/App.jsx` (pass default collapsed for patient routes)
  - `frontend/src/pages/Marketplace/MarketplaceSwitch.jsx` (use collapsed defaults for patient marketplace)
  - `frontend/src/pages/Profile.jsx` (sanitize `formacao` and `experiencias` before save)

- **Connects To**:
  - `frontend/src/pages/Patient/DoctorPublicProfile.jsx` via public data sourced from backend
  - `backend/src/controllers/marketplace.controller.js` provides `formacao` e `experiencias`
  - `frontend/src/services/api.js` for profile update (`PUT /auth/profile`)

- **Data Flow**:
  1. Patient routes render `MainLayout` with collapsed sidebars by default.
  2. Doctor edits profile in `Profile.jsx`; arrays are sanitized client-side.
  3. API call `PUT /auth/profile` persists clean arrays.
  4. `DoctorPublicProfile.jsx` reads normalized arrays and displays lists consistently.

## Hooks & Dependencies
- **Triggers**:
  - Route entry into `/patient/*` and authenticated marketplace activates collapsed layout.
  - Saving profile triggers sanitization of arrays before network request.

- **Dependencies**:
  - `React Router` for route grouping and layout injection.
  - `throttledApi` client for profile update calls.

- **Side Effects**:
  - UI cohesion in patient mode (more focus on center content).
  - Prevents empty/malformed entries showing as bullets in public view.

## Notes
- Files remain under 200 lines except existing large `Profile.jsx` (pre-existing).
- Documentation hooks were added inline to reflect integration points.
- No backend changes required; client-side normalization reduces noise.