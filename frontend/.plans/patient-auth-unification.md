## Plano: Unificação do Login de Paciente no Frontend

Objetivo: implementar autenticação de pacientes no frontend usando o endpoint `/auth/patient/login` e validação de sessão com `/auth/patient/me`, mantendo compatibilidade com o fluxo atual de médicos.

### Contexto e Motivação
- Hoje, o `Login.jsx` redireciona pacientes como convidados para `/marketplace`, sem autenticação.
- O `authStore.js` envia login para `/auth/login` (médicos) e valida token via `/auth/me`, não suportando pacientes.
- Backend já oferece endpoints dedicados de paciente: `/auth/patient/login` e `/auth/patient/me`.

### Integration Map
- **Novos/Atualizados Arquivos**:
  - `frontend/src/store/authStore.js` (atualizado)
  - `frontend/src/components/auth/Login.jsx` (atualizado)
- **Conecta a**:
  - `backend/src/controllers/auth.controller.js` via `/auth/login`, `/auth/patient/login`, `/auth/me`, `/auth/patient/me`
  - `frontend/src/services/api.js` para headers e interceptors
  - `frontend/src/components/Layout/PatientTopNav.jsx` para exibir usuário/logoff
- **Data Flow**:
  1. Paciente acessa `/login`
  2. `Login.jsx` envia credenciais para `authStore.login(email, password, 'patient')`
  3. `authStore.js` escolhe endpoint correto e salva `token` + `user`
  4. Interceptor adiciona `Authorization: Bearer <token>`
  5. `checkAuth` identifica `role` do token e valida em `/auth/patient/me` ou `/auth/me`
  6. UI atualiza `isAuthenticated` e `PatientTopNav` exibe Perfil/Sair

### Hooks & Dependencies
- **Triggers**:
  - Submit em `Login.jsx`
  - Montagem de rotas protegidas via `ProtectedRoute`
- **Dependencies**:
  - Axios `api.js` (baseURL `http://localhost:5001/api`)
  - JWT com `role` no payload (`patient` ou `medico`)
- **Side Effects**:
  - Persistência em `localStorage` (`hg_token` e `auth-storage`)
  - Header `Authorization` no `rawApi`
  - Inicialização de `socket` após login (mantida)

### Considerações de Coexistência & Codependências
- `ProtectedRoute.jsx` usa `checkAuth()`; precisa funcionar com ambos os roles.
- Interceptor 401 em `api.js` redireciona para `/login`; não muda.
- `PatientTopNav.jsx` decide exibir "Entrar" com base em `isAuthenticated`.

### MVP Scope
- Atualizar `authStore.login` para suportar `role==='patient'` com endpoint `/auth/patient/login`.
- Ajustar `checkAuth` para chamar `/auth/patient/me` quando o token indicar `role==='patient'`.
- Atualizar `Login.jsx` para autenticar paciente em vez de acesso convidado.
- Documentar conectores e hooks nas alterações.

### Testes e Validações
- Manual: acessar `/login` e testar login de médico e paciente.
- Verificar header `Authorization` nas requisições subsequentes.
- Garantir que `ProtectedRoute` libere acesso após `checkAuth`.

### Rollback Simples
- Reverter mudanças em `authStore.js` e `Login.jsx` para estado anterior.

### Riscos & Mitigações
- Token malformado sem `role`: fallback para `medico`.
- Falhas 401 no `checkAuth`: logout seguro e redirecionamento para `/login` (já coberto por interceptor).

---

Cache de referência (resumo rápido)
- Endpoints médicos: `/auth/login`, `/auth/me`
- Endpoints pacientes: `/auth/patient/login`, `/auth/patient/me`
- Token inclui `role`: `patient` ou `medico`