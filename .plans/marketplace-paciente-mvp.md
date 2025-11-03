# Plano de Implementação – Login do Paciente e Marketplace Médico (MVP)

Objetivo: entregar um MVP funcional em que o paciente encontra profissionais, visualiza horários e agenda consultas; o médico gerencia agenda, pacientes e registros; com segurança (RBAC) e temas dark/bright em sincronia.

## Decisões de Rotas
- Paciente (default): `GET /login`
- Profissional: `GET /loginpro` e `GET /loginmed` (aliases)
- Registro Profissional: `GET /register` (mantém fluxo atual)

Racional: tornar `/login` o ponto de entrada do paciente melhora UX e alinha ao marketplace. Links cruzados (“Sou profissional” ↔ “Sou paciente”) evitam confusão.

## Estado Atual (Diagnóstico)
- Frontend
  - `AuthLayout.jsx` orientado ao profissional (títulos fixos)
  - `Login.jsx` padrão, chama `useAuthStore.login(email, password)`
  - Tema dark/bright já mapeado via classes `theme-dark-teal` e `theme-light-ice`
  - Rotas atuais: `/login`, `/register` dentro de `<AuthLayout />`
- Backend
  - `POST /api/auth/login` e `POST /api/auth/register` (registro de médico)
  - Middleware `authMiddleware` (JWT)
  - Não há RBAC explícito por role nas rotas
- Segurança
  - Token armazenado em `localStorage` e exposto via `window.healthGuardianUtils` (risco XSS/exfiltração)
  - CORS e interceptores tratados; CSRF não aplicável enquanto sem cookies httpOnly

## Abordagem Técnica (Etapa 1 – Frontend)
1) AuthLayout ciente de role
   - Prop `role = 'patient' | 'medico'`
   - Títulos/subtítulos dinâmicos e link de alternância de role
2) Login.jsx role-aware
   - Prop `role` repassada ao `authStore.login(email, password, role)`
   - Links contextuais: “Sou profissional” ↔ “Sou paciente”
3) Rotas
   - `/login` → `<AuthLayout role="patient" /><Login role="patient" />`
   - `/loginpro` e `/loginmed` → `<AuthLayout role="medico" /><Login role="medico" />`
   - `/register` continua sob `role="medico"`
4) Store de auth
   - `login(email, password, role = 'medico')` → envia `{ email, password, role }`

## Abordagem Técnica (Etapa 2 – Backend e RBAC)
- Modelo único de usuário com `role ∈ {patient, medico}`
- `JWT` inclui `role` e escopos
- Guards de rota:
  - `/pro/**` exige `role='medico'`
  - `/app/**` (paciente) exige `role='patient'`
- Endpoints mínimos do marketplace:
  - Público: `GET /doctors`, `GET /doctors/:id`, `GET /doctors/:id/availability?from=&to=`
  - Paciente: `POST /appointments`, `GET /me/appointments`
  - Profissional: `POST /pro/availability`, `GET /pro/appointments`, `PATCH /pro/appointments/:id/(confirm|cancel)`

## Segurança (Plano de Mitigação)
- Curto prazo:
  - Manter fluxo atual de token, mas remover uso desnecessário do `window.*` gradualmente
  - Sanitizar entradas em perfil/descrições e validar via `express-validator`
- Médio prazo:
  - Migrar para cookies httpOnly + `SameSite=Lax` + `Secure` (em produção)
  - Introduzir CSRF token nos POST sensíveis
  - Rotatividade/expiração de tokens (refresh flow)

## MVP – Critérios de Aceitação
- Paciente:
  - [ ] Acessa `/login`, autentica com sucesso
  - [ ] Visualiza lista de profissionais (mock ou real) e perfil público
  - [ ] Vê horários disponíveis e cria agendamento
- Profissional:
  - [ ] Acessa `/loginpro` ou `/loginmed`, autentica com sucesso
  - [ ] Define disponibilidade e gerencia agendamentos
- Segurança/UX:
  - [ ] RBAC aplicado nas rotas do app
  - [ ] Tema dark/bright consistente nas telas de login e navegação
  - [ ] Fluxo de erros de autenticação redireciona para `/login` (paciente)

## Checkpoints Visuais (Frontend)
- [ ] `/login` exibe “Acesso Paciente” e link “É profissional? Acesse aqui”
- [ ] `/loginpro` exibe “Acesso Profissional” e link “É paciente? Acesse aqui”
- [ ] Ambos respeitam tema dark/bright (teal no dark; azul no light)
- [ ] Responsividade: mobile ≤ 360px e desktop ≥ 1440px sem quebra
- [ ] Acessibilidade básica: labels, `aria`, contraste adequado

## Mapa de Integração
- Frontend
  - `src/components/Layout/AuthLayout.jsx` ↔ role-aware
  - `src/components/auth/Login.jsx` ↔ `src/store/authStore.js` (role no body)
  - `src/App.jsx` ↔ rotas `/login`, `/loginpro`, `/loginmed`
- Backend
  - `src/routes/auth.routes.js` ↔ recebe `role` (futuro), emite JWT com claim
  - `src/middleware/auth.js` ↔ valida token; expandir para RBAC
  - `src/routes/*` ↔ proteger por role e escopos

## Cronograma (Sugerido)
- Semana 1: Rotas e telas de login (feito), plano RBAC, mocks marketplace
- Semana 2: RBAC backend, endpoints públicos, disponibilidade, agendamento
- Semana 3: Histórico paciente, painel médico, testes e hardening de segurança

## Riscos & Mitigações
- Dependência de `localStorage` e `window.*` → migrar para cookies e token service
- Múltiplos servidores dev em portas diferentes → padronizar porta e CORS em `.env`
- Falta de endpoints de paciente → priorizar criação de `patients` e `appointments`

## Próximos Passos
- Implementar RBAC no backend
- Criar endpoints públicos de marketplace
- Construir telas: lista de médicos, perfil público e agenda
- Testes de integração (frontend ↔ backend) e auditoria de segurança