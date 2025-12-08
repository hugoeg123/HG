# Plano de Correção – Login quebrado por JWT_SECRET ausente

## Contexto e Sintomas
- Usuários afetados: `hugo@gmail.com` (profissional) e `lucas@gmail.com` (paciente).
- Erros observados:
  - Backend: `secretOrPrivateKey must have a value` ao gerar/verificar JWT.
  - API: respostas 500 em `/api/auth/login` e `/api/auth/patient/login`.
- Ambiente: backend responde em `http://localhost:5001/` com `environment=development`.

## Diagnóstico
- Causa raiz: variável `process.env.JWT_SECRET` não definida (arquivo `.env` inexistente no diretório `backend`).
- Evidências:
  - `src/controllers/auth.controller.js` usa `process.env.JWT_SECRET` em `generateToken` e `generatePatientToken`.
  - `src/middleware/auth.js` e `src/middleware/auth.middleware.js` verificam tokens com `process.env.JWT_SECRET`.
  - `src/services/socket.service.js` também verifica tokens com `process.env.JWT_SECRET`.
  - `Invoke-RestMethod` em `/api/auth/login` retornou `{ details: "secretOrPrivateKey must have a value" }`.

## Correção Mínima Proposta
- Adicionar arquivo `backend/.env` com:
  - `JWT_SECRET=<valor_seguro_de_desenvolvimento>`
  - `JWT_EXPIRES_IN=24h`
- Reiniciar o servidor backend para carregar o `.env` (dotenv é inicializado em `src/app.js` e `src/index.js`).

## Impacto e Codependências
- Módulos que dependem do `JWT_SECRET`:
  - `controllers/auth.controller.js` → emissão de tokens no login/registro.
  - `middleware/auth.js` e `middleware/auth.middleware.js` → proteção de rotas com verificação JWT.
  - `services/socket.service.js` → autenticação de conexões WebSocket.
- Frontend:
  - `frontend/src/stores/authStore.js` → consome `/auth/login` e `/auth/patient/login` e armazena o token.
  - Interceptores em `frontend/src/services/api.js` → adicionam `Authorization: Bearer <token>`.
- Banco de dados: sem alterações; credenciais padrão (`postgres/postgres`) são mantidas enquanto o Docker PG está ativo.

## Integração Map
- **Novo Arquivo**: `backend/.env`
- **Conecta-se a**:
  - `backend/src/controllers/auth.controller.js` (geração de JWT – login médico/paciente)
  - `backend/src/middleware/auth.js` e `auth.middleware.js` (verificação de JWT)
  - `backend/src/services/socket.service.js` (verificação de JWT em sockets)
- **Fluxo de Dados**:
  1. Usuário envia credenciais → Frontend (`authStore.js`).
  2. Requisição → Backend `/api/auth/login` ou `/api/auth/patient/login`.
  3. Backend verifica senha no PostgreSQL → gera `JWT` com `JWT_SECRET`.
  4. Frontend recebe token → salva e usa em chamadas subsequentes (`Authorization`).
  5. Middleware/sockets validam token com o mesmo segredo.

## Hooks & Dependências
- **Triggers**: tentativas de login, chamadas a rotas protegidas, conexão socket.
- **Dependências**: `dotenv`, `jsonwebtoken`, `bcryptjs`, PostgreSQL (Sequelize).
- **Side Effects**: tokens passam a ser emitidos e verificados corretamente; 401 volta a funcionar em rotas protegidas quando token falta/expira.

## Passos de Validação
1. Reiniciar backend.
2. Testar login profissional:
   - POST `http://localhost:5001/api/auth/login` body `{ "email": "hugo@gmail.com", "password": "extra-300" }`.
3. Testar login paciente:
   - POST `http://localhost:5001/api/auth/patient/login` body `{ "email": "lucas@gmail.com", "password": "extra-300" }`.
4. Verificar que resposta contém `token` e `user` e que chamadas subsequentes com `Authorization: Bearer <token>` funcionam.

## Plano de Rollback
- Remover/alterar `JWT_SECRET` apenas em desenvolvimento; em produção usar segredo forte e mecanismo de rotação.
- Caso algo quebre, restaurar o `.env` anterior (se existir) e reiniciar.

## Observações de Segurança
- Não versionar `.env` com segredos.
- Usar segredo forte e rotacionar em ambientes produtivos.