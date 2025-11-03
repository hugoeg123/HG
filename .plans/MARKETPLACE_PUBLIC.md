# Plano: Marketplace Público (MVP)

Objetivo: Expor lista pública de médicos e horários disponíveis para prova visual do fluxo end-to-end.

## Escopo
- Backend: Endpoints públicos `/api/marketplace/medicos` e `/api/marketplace/slots`
- Frontend: Serviço `marketplaceService` e página `/marketplace` com filtros e cards
- Infra: Validar baseURL padrão `http://localhost:5001/api` e dev server Vite

## Integração Map
- New File: `backend/src/controllers/marketplace.controller.js`
  - Connects To:
    - `backend/src/models/sequelize/Medico.js` via ORM
    - `backend/src/models/sequelize/AvailabilitySlot.js` via ORM
    - `backend/src/routes/marketplace.routes.js` para exposição
  - Data Flow:
    1. Frontend → `GET /api/marketplace/medicos`
    2. Controller aplica filtros e paginação
    3. ORM → DB retorna médicos públicos
    4. Resposta JSON estruturada

- New File: `backend/src/routes/marketplace.routes.js`
  - Connects To: `backend/src/routes/index.js` via `router.use('/marketplace', ...)`
  - Validations: query e params via `express-validator`

- New File: `frontend/src/services/marketplaceService.js`
  - Connects To: `frontend/src/services/api.js`
  - Endpoints: `/marketplace/medicos`, `/marketplace/medicos/:id`, `/marketplace/slots`

- New File: `frontend/src/pages/Marketplace/DoctorsList.jsx`
  - Connects To: `App.jsx` rota pública `/marketplace`
  - Data Flow:
    1. Usuário define filtros e pesquisa
    2. Serviço chama API pública
    3. Renderiza cards e slots disponíveis (lazy-load)

## Hooks & Dependências
- Triggers: Navegação para `/marketplace` no frontend
- Dependencies: Axios baseURL (`VITE_API_URL`), backend ativo na porta `5001`
- Side Effects: Nenhum no banco; apenas leitura

## Segurança & Compliance
- Apenas dados públicos (`public_visibility=true`)
- Atributos limitados, sem dados sensíveis

## Testes
- Manual E2E via preview: listar médicos e abrir horários
- Futuro: testes de integração com mocks (Sequelize)

## Próximos Passos
- Página de detalhes do médico com agendamento
- Fluxo de criação de Appointment com proteção e validações