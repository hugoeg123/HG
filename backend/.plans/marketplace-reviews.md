# Marketplace Reviews – Plan

## Goal
- Add a simple public review system for doctors in the marketplace.
- Patients can post reviews; anyone can read reviews of public doctors.

## Integration Map
- **New Files**:
  - `src/models/sequelize/Review.js` – Sequelize model for reviews
  - `src/migrations/20251104090000-create-reviews.js` – Migration for reviews table
  - `src/controllers/review.controller.js` – Controller handlers for listing/creating reviews
- **Updated Files**:
  - `src/models/sequelize/index.js` – Register `Review` model and associations
  - `src/routes/marketplace.routes.js` – Add review endpoints
  - `frontend/src/services/marketplaceService.js` – Add API calls for reviews
  - `frontend/src/pages/Patient/DoctorPublicProfile.jsx` – Integrate reviews section
  - `frontend/src/pages/Patient/components/DoctorReviews.jsx` – Reviews UI & form
  - `frontend/src/pages/Patient/components/DoctorBio.jsx` – Bio section extracted to keep file < 200 lines

## Hooks & Dependencies
- **Triggers**:
  - GET `/api/marketplace/medicos/:id/reviews` – Reads public reviews
  - POST `/api/marketplace/medicos/:id/reviews` – Patient-auth required to create
- **Dependencies**:
  - `Medico` (doctor) exists and is public for listing
  - `Patient` identity from JWT via `authMiddleware`
- **Side Effects**:
  - Adds associations: `Medico.hasMany(Review)`, `Patient.hasMany(Review)`
  - New migration for backend DB

## Data Flow
1. Patient clicks a doctor in `DoctorsList.jsx` → navigates to `/patient/doctor/:id`.
2. `DoctorPublicProfile.jsx` fetches doctor details and renders `DoctorBio`.
3. `DoctorReviews.jsx` fetches public reviews; patient can submit a new review.
4. Backend validates, stores review, returns sanitized payload.

## API Design
- GET `/api/marketplace/medicos/:id/reviews`
  - Public; returns `{ id, rating, comment, createdAt }[]` for `is_public=true`.
- POST `/api/marketplace/medicos/:id/reviews`
  - Auth: `authorize(['patient'])`
  - Body: `{ rating: 1..5, comment?: string (<=1000), is_public?: boolean }`

## Model
```js
Review: {
  id: UUID PK,
  medico_id: FK → medicos.id (CASCADE),
  patient_id: FK → patients.id (SET NULL),
  rating: INTEGER(1..5),
  comment: TEXT,
  is_public: BOOLEAN default true,
}
```

## Standards Compliance
- Files kept < 200 lines and documented with connectors.
- Error handling reuses centralized patterns.
- No sensitive data exposure (patient PII omitted from public payloads).
- Minimal deltas; modular new files to reduce impact.

## MVP Tasks
- Model + migration + associations
- Controller GET/POST
- Routes + validations + auth
- Frontend service
- UI component for Reviews + integrate into profile
- Extract Bio to separate component