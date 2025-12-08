## Visão Geral
- Implementar a aba `Editar Perfil` em `/patient/profile?tab=edit` com seções independentes, salvamento por div e indicador de progresso por seção e global.
- Alinhar ao stack atual: Frontend React (Vite, React Router, Tailwind, Radix UI, Zustand), Backend Node/Express + Sequelize.
- Minimizar impacto usando endpoints e modelos existentes quando possível (ex.: `Patient`, `PatientTagEntry`), introduzindo modelos novos apenas onde for claramente necessário.

## Estado Atual (Código)
- Tabs Radix presentes e já renderizam o tab "Editar Perfil": `frontend/src/pages/Patient/Profile.jsx:100-177`.
- Pacientes CRUD: `backend/src/routes/patient.routes.js:17-50` → `backend/src/controllers/patient.controller.js:88-195`.
- Perfil (paciente/profissional): `backend/src/routes/auth.routes.js:80-127`.
- Entradas de paciente (tags, peso/altura via tags): `backend/src/routes/patient-input.routes.js:18-36` → `backend/src/controllers/patientTag.controller.js:46-151` → `backend/src/models/sequelize/PatientTagEntry.js:12-68`.
- Modelo `Patient` com JSONB para alergias/condições/medicações: `backend/src/models/sequelize/Patient.js:120-148`.
- Registros e `Record.tags` (suporta `#HD`): `backend/src/models/sequelize/Record.js:56-162`.
- Versionamento atual é via `createdAt/updatedAt` e `source` (em `PatientTagEntry`). Não há `recorded_at/effective_at/recorded_by` dedicados.

## Objetivos Funcionais
- Seções (cards) na aba `Editar Perfil`:
  1) Contato (celular principal, celular emergência, email da conta, nome, sobrenome)
  2) Identificação (data de nascimento, gênero, etnia, trabalho)
  3) Antropometria (peso kg, altura m)
  4) Hábitos de vida (toggles fumo/bebo/me exercito → expandem sub-form)
  5) Antecedentes (alergias; gineco/obstétrico quando aplicável; cirúrgicos; patológicos; medicações)
- Cada seção:
  - exibe progresso local (% de campos essenciais preenchidos)
  - tem botão “Salvar” próprio
  - falhas de uma seção não quebram as outras
- Backend:
  - dados de antropometria e hábitos versionados (timestamp + origem)
  - antecedentes patológicos compatíveis com `#HD` e com início/fim quando possível

## Frontend — Implementação por Seção
- Arquitetura:
  - Manter página em `frontend/src/pages/Patient/Profile.jsx`, extraindo subcomponentes por seção para manter <200 linhas por arquivo (`components/PatientProfile/ContactCard.jsx`, `IdentificationCard.jsx`, `AnthropometricsCard.jsx`, `LifestyleCard.jsx`, `HistoryCard.jsx`).
  - Usar componentes UI existentes (Radix + Tailwind + Inputs locais); não introduzir novas libs (ex.: React Hook Form) na v1.
  - Estado: Zustand store local para progresso e loading por seção (ex.: `patientProfileStore`).

- Contato
  - Campos: `phone_main`, `phone_emergency`, `email` (read-only se login), `first_name`, `last_name`.
  - Salvamento: `PUT /api/patients/:id` com payload apenas desses campos.
  - Privacidade: badge/tooltip “dados confidenciais”; ocultar em logs.

- Identificação
  - Campos: `birth_date`, `gender`, `ethnicity`, `occupation`.
  - Salvamento: `PUT /api/patients/:id` parcial.
  - Progresso: considerar `birth_date`, `gender` e `ethnicity` como essenciais.

- Antropometria
  - Campos: `weight_kg`, `height_m`.
  - Salvamento v1 (mínimo impacto): `POST /api/patient-inputs` gerando `PatientTagEntry` com tags `#PESO` e `#ALTURA`, `source='patient_profile'`. Usa `createdAt` como timestamp e preserva histórico.
  - Snapshot: após salvar, atualizar store e exibir último valor na UI.

- Hábitos de Vida
  - Primeira camada: switches “Fumo ou já fumei?”, “Bebo bebidas alcoólicas?”, “Pratico atividade física regularmente?”.
  - Se "Sim":
    - Tabagismo: `smoking_status ('never'|'former'|'current')`, `cigarettes_per_day`, `years_smoked`, opcional `years_since_quit`; cálculo de `pack_years = (cigarettes_per_day / 20) * years_smoked`.
    - Álcool: `drinks_per_week`, `binge_last_30_days ('none'|'1'|'2-3'|'4+')`.
    - Atividade Física: `mod_minutes_per_week`, `vig_minutes_per_week`, `strength_days_per_week`; calcular `equivalent_moderate_minutes = mod + 2*vig`, `meets_who_guidelines`.
  - Salvamento v1:
    - Usar `POST /api/patient-inputs` com um `PatientTagEntry` por grupo (ex.: `#SMOKING_STATUS`, `#CIGPD`, `#YEARSSMOKED`, `#DRINKS_PER_WEEK`, `#BINGE_30D`, `#MOD_MIN`, `#VIG_MIN`, `#STRENGTH_DPW`) e `source='patient_profile'`. Mantém versionamento via `createdAt`.
  - Salvamento v2 (planejado): endpoint dedicado `POST /api/patients/:id/lifestyle-snapshots` com modelo Sequelize próprio para facilitar análises.

- Antecedentes
  - Alergias: toggle "tem alergias?" → lista `{substance, reaction, severity, notes}`.
    - Salvamento: `PUT /api/patients/:id` atualizando `Patient.allergies` (JSONB), preservando formato atual.
  - Gineco/Obstétrico (condicional por gênero/flag): `gravidity`, `parity_normal`, `parity_cesarean`, `abortions`, `currently_pregnant`.
    - Salvamento: `PUT /api/patients/:id` em campo JSONB (ex.: `obstetricHistory`), sem quebrar modelo atual (se o campo não existir, v2 inclui migração).
  - Cirúrgicos: `surgeries[]: {name, date, notes}`.
    - Salvamento: `PUT /api/patients/:id` (JSONB `surgeries`), v2 migra se não existir.
  - Patológicos: `conditions[]: {condition_name, onset_date, resolution_date, status, notes}`.
    - Salvamento: `PUT /api/patients/:id` campo `chronicConditions` mantendo compatibilidade; introduzir estrutura com `onset/resolution/status` para novos itens.
  - Medicações: `medications[]: {drug_name, dose, schedule, indication, notes}` → `PUT /api/patients/:id` campo existente `medications`.

- Progresso e Salvamento
  - Progresso por seção: calcular localmente (% preenchidos / essenciais por seção).
  - Progresso global: média ponderada das seções essenciais (contato, identificação, antropometria e pelo menos um bloco de hábitos/antecedentes quando aplicável).
  - UX: cada card com botão “Salvar [seção]”; feedback por toast; loading isolado por seção.

## Backend — Endpoints e Modelos
- Usar endpoints existentes para minimizar impacto:
  - `PUT /api/patients/:id` para Contato/Identificação/Antecedentes.
  - `POST /api/patient-inputs` para Antropometria e v1 de Hábitos (via tags) com `source='patient_profile'` e `actorRole='patient'` se disponível.
- v2 (planejado) — Lifestyle dedicado:
  - Model: `PatientLifestyleSnapshot` (Sequelize) com:
    - `patient_id`
    - tabagismo: `smoking_status`, `cigarettes_per_day`, `years_smoked`, `years_since_quit`, `pack_years`
    - álcool: `drinks_per_week`, `binge_last_30_days`
    - atividade: `mod_minutes_per_week`, `vig_minutes_per_week`, `strength_days_per_week`, `equivalent_moderate_minutes`, `meets_who_guidelines`
    - versionamento: `source`, `recorded_by`, `recorded_at`, `effective_at`, `createdAt`/`updatedAt`
  - Rotas: `POST /api/patients/:id/lifestyle-snapshots`, `GET /api/patients/:id/lifestyle-snapshots (histórico)`, `GET /api/patients/:id/lifestyle (snapshot atual)`.

## Dados, Versionamento e Integração com Tags
- Antropometria/Hábitos v1: armazenar via `PatientTagEntry` com chaves de tag claras e `source='patient_profile'`, garantindo histórico via `createdAt`.
- Patológicos e `#HD`: manter em `Patient.chronicConditions` (JSONB) com `onset/resolution/status`. Quando o médico registrar no prontuário, continua via `Record.tags` com `#HD`. Futuro: conciliador entre `Patient.chronicConditions` e `Record` timeline.
- Metadados: onde houver `PatientTagEntry`, já existe `source`. Em v2 de Lifestyle, incluir `recorded_by/recorded_at/effective_at` para análises temporais robustas.

## Segurança e LGPD
- Campos sensíveis (telefone, email): não logar payloads completos; mascarar nos logs.
- Autorizações: respeitar `authMiddleware` + escopos; permitir que paciente edite apenas seu próprio perfil.
- Rate limit: endpoints de perfil sob políticas já existentes (`app.js:95-133`).

## Testes
- Frontend (Vitest): testes para cálculo de progresso e render condicional dos sub-forms (lifestyle), mocks dos serviços.
- Backend (Jest + supertest):
  - `PUT /api/patients/:id` parcial por seção
  - `POST /api/patient-inputs` criando entradas de peso/altura e lifestyle tags, verificando `source` e ordenação por `createdAt`.
  - v2: testes de `PatientLifestyleSnapshot` (modelo + rotas).

## Fases de Entrega
- Fase 1 (UI + salvamento mínimo impacto)
  - Criar cards/seções na aba `edit` com progresso e salvar por div.
  - Contato/Identificação/Antecedentes → `PUT /api/patients/:id`.
  - Antropometria/Lifestyle v1 → `POST /api/patient-inputs` com tags canônicas.
- Fase 2 (Modelos dedicados e análises)
  - Introduzir `PatientLifestyleSnapshot` + endpoints de histórico/snapshot.
  - Ajustar store e gráficos de evolução.
- Fase 3 (Conciliar `#HD` com antecedentes)
  - Mapear `Patient.chronicConditions` ↔ `Record.tags (#HD)`; criar visão/timeline unificada.

## Integração e Documentação
- Documentar conectores nos arquivos novos (comentários curtos) e em `docs/PROFILE-SPEC.md` caso solicitado.
- Manter arquivos <200 linhas, modularizando por seção.

## Benefícios da Estratégia
- Alinha ao código e endpoints existentes, evitando migrações imediatas.
- Garante versionamento usando estruturas já presentes (`PatientTagEntry`) e prepara evolução para modelos dedicados quando necessário.
- Evita travas futuras ao separar responsabilidades por seção e introduzir camadas versionadas opcionais (Lifestyle v2).

Confere prosseguir com a Fase 1 (UI + salvamento com `PUT /api/patients/:id` e `POST /api/patient-inputs`), e já deixar os contratos dos endpoints v2 definidos para lifestyle?