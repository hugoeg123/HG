# Verificação local: Banco, Backend, API e Frontend

Objetivo: garantir que PostgreSQL (5432), Backend/API (5001) e Frontend/Vite (5173) estejam rodando corretamente, com validação de endpoints e preview da Agenda.

## Integração Map
- **Novo Documento**: `.plans/run-local-stack-verify.md`
- **Conecta Com**:
  - `backend/src/app.js` via start do servidor (porta 5001) e CORS
  - `backend/src/routes/index.js` via `/api/health` e rotas padrão
  - `frontend/src/App.jsx`, `frontend/src/index.css` e `frontend/vite.config.js` via Vite dev server (porta 5173)
  - Banco de dados PostgreSQL local (5432) via Sequelize
- **Fluxo de Dados**:
  1. PostgreSQL ativo → Backend sincroniza modelos (Sequelize)
  2. Backend expõe `/api/*` e health → Frontend consome via `VITE_API_URL`
  3. Frontend Vite serve UI → Preview valida Agenda (mensal/semanal)

## Hooks & Dependências
- **Triggers**:
  - Subida do backend (`npm run dev`) inicializa Socket.io e valida DB
  - Subida do frontend (`npm run dev -- --strictPort --port 5173`) ativa HMR
- **Dependências**:
  - Variáveis de ambiente: `PORT` (backend), `VITE_API_URL` (frontend, fallback `http://localhost:5001/api`)
  - Postgres acessível em `localhost:5432`
- **Side Effects**:
  - Rate limit das rotas `/api/auth/*` pode bloquear testes com muitas requisições
  - CORS deve aceitar `http://localhost:5173` (ajustado em `app.js`)

## Passos de Verificação
1. Banco: executar `node check-postgresql.js` e confirmar conexão OK.
2. Backend: iniciar em `backend/` com `npm run dev`; confirmar logs: porta, DB sincronizado, Socket.io.
3. API: validar `GET http://localhost:5001/api/health` com resposta `ok` e `db_status: up`.
4. Frontend: iniciar Vite em `frontend/` com `npm run dev -- --strictPort --port 5173`; abrir `http://localhost:5173/agenda`.
5. Coletar **2 logs** (Backend/DB e Frontend/Vite) para comprovação.

## Conectores/Comentários
// Connector: `backend/src/app.js` aplica CORS para `http://localhost:5173` e inicializa Socket.io.
// Hook: `backend/src/routes/index.js` expõe `/api/health` para checagem de saúde.
// Connector: `frontend/src/App.jsx` aplica temas `.dark/.light` e consome `VITE_API_URL`.
// Hook: Preview da Agenda valida integração real com Backend/API.

## Referências
- `SETUP-LOCAL.md`, `INICIO-RAPIDO.md`, `docs/frontend/README.md`, `docs/backend/README.md`, `docs/api-endpoints.md`, `CORS-FIX-SUMMARY.md`.