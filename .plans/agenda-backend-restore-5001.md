# Plano: Restaurar backend na porta 5001 e validar Agenda

## Objetivo
Resolver erros de `net::ERR_CONNECTION_REFUSED` no login do paciente (`/api/auth/patient/login`), iniciar o backend na porta `5001`, validar integração com o frontend (Vite 5173), confirmar estilos e contadores da Agenda e atualizar documentação.

## Contexto
- Frontend: `http://localhost:5173/` (Vite)
- Backend: `http://localhost:5001/api` (Express + Sequelize + Socket.io)
- Erro observado: chamadas ao `http://localhost:5001/api/auth/patient/login` recusadas (backend parado).

## Integração Map
- **Novo/Confirmado**: `backend/src/app.js` ← inicia servidor na `PORT=5001`
- **Conecta a**:
  - `backend/src/routes/auth.routes.js` → `/api/auth` (login/register)
  - `backend/src/routes/patient.routes.js` → `/api/patients` (autenticado)
  - `frontend/src/services/api.js` → `API_BASE_URL` apontando para `http://localhost:5001/api`
  - `frontend/src/store/themeStore.js` e `App.jsx` → controlam `.dark-mode/.light-mode` para estilos

## Plano de Ação
1. Iniciar backend com `npm run dev` e validar logs:
   - `🚀 Servidor rodando na porta 5001`
   - `🔗 API: http://localhost:5001/api` e `❤️  Health: /api/health`
2. Verificar CORS em `backend/src/app.js`:
   - `allowedOrigins` inclui `http://localhost:5173`
3. Testar `GET /api/health` e fluxo de login `/api/auth/patient/login` via frontend.
4. Validar Agenda:
   - Página `/agenda` renderiza contadores coloridos (mensal) e overlay de slots (semanal).
5. Atualizar documentação `docs/frontend/agenda.md` com seção de logs e solução.
6. Commit e push na branch `main` com mensagem descritiva.

## Critérios de Aceite
- Backend ativo na porta 5001 sem erros.
- Frontend consegue chamar `/api/*` sem `ERR_CONNECTION_REFUSED`.
- Agenda mostra estilos corretos em dark e light mode.
- Documentação atualizada com troubleshooting de backend.

## Hooks & Dependências
- **Triggers**: iniciar dev server backend, navegação `/agenda`, tentativa de login.
- **Dependências**: Node, Postgres, Sequelize, Socket.io, Vite.
- **Side Effects**: conexões Socket.io ativas, sincronização de modelos em dev.

## Observações de Segurança
- CORS restrito às origens locais usadas no desenvolvimento.
- Sem exposição de credenciais; variáveis via `.env`.