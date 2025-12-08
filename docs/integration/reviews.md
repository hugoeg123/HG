## Integration Map

- **New File**: `backend/src/models/sequelize/Review.js`
- **New File**: `backend/src/migrations/20251104090000-create-reviews.js`
- **Connects To**:
  - `backend/src/controllers/review.controller.js` via model import
  - `backend/src/routes/marketplace.routes.js` via route handlers (`GET` público e `POST` paciente)
  - `frontend/src/services/marketplaceService.js` via endpoints `/marketplace/medicos/:id/reviews`
  - `frontend/src/pages/Patient/components/DoctorReviews.jsx` para UI de avaliações
  - `frontend/src/pages/Patient/components/DoctorBio.jsx` como parte do perfil público

## Data Flow
1. Paciente autenticado → Frontend (`DoctorReviews.jsx` formulário)
2. API call → Backend `POST /api/marketplace/medicos/:id/reviews` (auth patient)
3. Database update → `reviews` (FK `medico_id`, `patient_id` opcional)
4. Listagem pública → `GET /api/marketplace/medicos/:id/reviews` filtra `is_public=true`
5. Frontend exibe avaliações → `DoctorReviews.jsx`

## Hooks & Dependencies
- **Triggers**:
  - `createReview` exige `req.user.role === 'patient'`
  - Listagem pública verifica `Medico.public_visibility === true`
- **Dependencies**:
  - PostgreSQL extensões: `uuid-ossp`, `citext`, `pgcrypto` (ativadas em migrações anteriores)
  - Índices: `reviews_medico_id_idx`, `reviews_patient_id_idx`, `reviews_medico_public_idx`
- **Side Effects**:
  - Remoção de paciente (`patients`) não apaga reviews (ON DELETE SET NULL)

## Connector Notes
- Backend
  - `Review` associa `belongsTo(Medico)` e `belongsTo(Patient)`
  - `review.controller.js` não expõe dados sensíveis do paciente em listagens públicas
- Frontend
  - `marketplaceService.getDoctorReviews(id)` para listagem
  - `marketplaceService.createDoctorReview(id, { rating, comment, is_public })` para criação

## Safety & Compliance
- `patient_id` é opcional para importações/anonimização; criação via paciente sempre popula
- Validação de `rating` (1–5) e sanitização de `comment` no backend
- Logs centralizados em `app.js` via error handler