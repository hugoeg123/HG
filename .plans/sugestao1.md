Bora! 👇 Vou direto ao ponto com o que já existe, o que falta e a forma mais limpa/segura de implantar o login do paciente sem quebrar o que você tem hoje.

# Estado atual (o que vi no repo)

* O **/login e /register** estão voltados ao **profissional** (“Acesso Profissional”, “Cadastro de Profissional”) e o link padrão “Faça login” aponta para `/login`. Não há telas para paciente ainda. 【】【】
* O fluxo de autenticação do front chama **POST `/auth/login`** e grava o **token no localStorage** (e até exporta via `window.healthGuardianUtils.setToken`), o que funciona, mas é um **ponto de atenção em segurança (XSS/exfiltração)**. 【】【】
* A **base de temas** (dark/bright) já está pronta, com tokens e utilitários (azul no claro; teal/verde no escuro). Dá para reaproveitar 100% nas telas do paciente. 【】【】

# Decisão de rotas (recomendação)

Para UX e SEO, deixe explícito quem é paciente e quem é pro — e faça o **default ser paciente**, como você sugeriu:

* **Paciente (default)**
  `GET /login` · `GET /register`
* **Profissional**
  `GET /pro/login` · `GET /pro/register`

Na UI do paciente, um link “Sou profissional” leva a `/pro/login`. E nas telas do pro, “Sou paciente” leva a `/login`. Assim não quebramos seus links atuais (só revisar os que apontam para `/login` dentro do módulo do pro). 【】

# Melhor abordagem técnica (MVP rápido e seguro)

## 1) Domínio de autenticação e papéis (RBAC)

* **Modelo de usuário único** com `role ∈ {patient, medico}` e **perfis tipados**:

  * `users(id, email, password_hash, role, status, created_at, ...)`
  * `patient_profiles(user_id, nome, nascimento, …)`
  * `medico_profiles(user_id, crm/rqe, specialty, …)`
* **JWT** com `sub`, `role` e escopos (ex.: `appointments:write`).
* **Middlewares** que checam `role` por rota:

  * rotas `/pro/**` exigem `role=medico`
  * rotas do app do paciente exigem `role=patient`

> Caso queira manter endpoints separados agora, tudo bem (ex.: `POST /auth/patient/login` e `POST /auth/pro/login`). A médio prazo é mais elegante **manter um único `/auth/login`** aceitando `role` no body e resolvendo o backend por role.

## 2) Telas mínimas (frontend) em concomitância com o tema

* **Paciente**

  * `/login` (email+senha, “Sou profissional” → `/pro/login`)
  * `/register` (cadastro simples)
  * **Explorar e agendar**: home → página do médico → slots → **checkout simples** (sem pagamento neste MVP)
* **Profissional**

  * `/pro/login` e `/pro/register`
  * **Disponibilidades e agenda** (você já tem boa base visual)
* Reaproveite o **AuthLayout** e mude apenas o título/subtítulo conforme a rota (mostrar “Acesso Paciente” quando estiver em `/login`). Hoje ele está fixo no profissional. 【】

## 3) Rotas de API mínimas (backend)

* Público:

  * `GET /doctors?specialty=&location=` – listar pros (para marketplace)
  * `GET /doctors/:id` – perfil público
  * `GET /doctors/:id/availability?from=&to=` – slots
* Paciente:

  * `POST /auth/login` (role=patient) · `POST /auth/register` (patient)
  * `POST /appointments` (doctor_id, start, end)
  * `GET /me/appointments`
* Profissional:

  * `POST /auth/login` (role=medico) · `POST /auth/register` (medico)
  * `GET /pro/appointments` · `POST /pro/availability` · `DELETE /pro/availability/:id`
  * `PATCH /pro/appointments/:id/confirm|cancel`

# Problemas/ajustes a corrigir agora

1. **Token em `localStorage` e exposto em `window`**
   Sugiro migrar para **cookies httpOnly + SameSite=Lax + Secure** e manter o Bearer só para chamadas WS, se necessário. No mínimo, **remova a exposição em `window.healthGuardianUtils`** e isole o uso de `localStorage` atrás de um serviço com revogação/rotatividade. 【】
2. **AuthLayout** fixo para profissional → torná-lo **role-aware** (ou duplicar um `PatientAuthLayout` simples). 【】
3. **Links internos** que assumem `/login` como profissional (ex.: “Faça login”) precisam ser atualizados para `/pro/login` quando dentro do fluxo de pro. 【】

# Passo-a-passo executável (curto)

1. **Router (frontend)** – declare as novas rotas:

```jsx
// routes.jsx
<Route path="/login" element={<AuthLayout role="patient" />}>
  <Route index element={<PatientLogin />} />
</Route>
<Route path="/register" element={<AuthLayout role="patient" />}>
  <Route index element={<PatientRegister />} />
</Route>

<Route path="/pro/login" element={<AuthLayout role="medico" />}>
  <Route index element={<ProLogin />} />
</Route>
<Route path="/pro/register" element={<AuthLayout role="medico" />}>
  <Route index element={<ProRegister />} />
</Route>
```

E ajuste o `AuthLayout` para usar `role` e trocar título/subtítulo dinamicamente (hoje está fixo em “Acesso Profissional”). 【】

2. **Store de auth** – aceite `role` no login/registro:

```js
// useAuthStore.login(email, password, role = 'patient')
// no backend: valide o role e emita JWT com claim role
```

Hoje ele chama `/auth/login` para qualquer coisa; mantenha isso, só passe `role` no body. 【】

3. **RBAC no backend** – proteja grupos de rotas:

```txt
/pro/**           -> requireAuth(role='medico')
/app/** (paciente)-> requireAuth(role='patient')
```

E implemente guards de escopo para `appointments`, `availability` etc.

4. **Marketplace minimal**

   * Página pública do médico (aproveite seu **Profile** em modo “Visão pública” e exponha uma versão readonly) 【】
   * Endpoint para **consultar disponibilidade** e **criar agendamento** (status `pending/confirmed/cancelled`).

# DoD (Definition of Done) — MVP “Paciente agenda médico”

* [ ] Paciente registra, loga e vê **lista de médicos** e **perfil público**
* [ ] Paciente vê **slots disponíveis** e cria um **agendamento**
* [ ] Profissional loga e **define disponibilidade** + **vê/gerencia agendamentos**
* [ ] RBAC aplicado (rotas e UI)
* [ ] Token **não** fica exposto em `window` e (ideal) sai do `localStorage`
* [ ] Telas seguem **tema claro/escuro** padrão (azul/teal) — já temos tokens/utilitários prontos 【】【】

Se quiser, já te entrego os componentes `PatientLogin`/`PatientRegister` prontos e o patch no `AuthLayout`/router para ficar plug-and-play com os estilos atuais.
