# Plano: Agenda Pessoal do Paciente e Tags no Dashboard

## Objetivo
- Exibir, no dashboard do paciente, sua agenda pessoal (consultas marcadas via marketplace e eventos próprios), distinta da agenda do profissional.
- Padronizar inputs de saúde do paciente com sintaxe `#TAG: valor`, permitindo representação numérica/gráfica e acompanhamento temporal.
- Minimizar atrito para o paciente (preenchimento fácil, quase gamificado) e manter extrações robustas nos registros do médico.

## Diretrizes e Conectores
- Frontend:
  - `frontend/src/pages/Patient/Profile.jsx` (Dashboard e abas) 
  - `frontend/src/components/patient/AgendaSummary.jsx` (novo)
  - `frontend/src/services/agendaService.js` (slots e appointments)
  - `frontend/src/services/api.js` (throttling, auth, retry)
  - `frontend/src/store/authStore.js` (dados do usuário/paciente)
- Backend:
  - `backend/src/controllers/agenda.controller.js` e `backend/src/routes/`
  - Endpoints: `/agenda/appointments`, `/agenda/slots` (docs em `docs/indexes/backend.md`)
- Regras do projeto:
  - Manter arquivos < 200 linhas; documentar conectores (JSDoc/Comentários)
  - DRF-like standards no backend Node (rotas e controllers já mapeados)
  - FHIR: validar e mapear quando aplicável na exportação/sugestões

## Mapa de Integração
- Novo Arquivo: `frontend/src/components/patient/AgendaSummary.jsx`
- Conecta a:
  - `frontend/src/services/agendaService.js` via `getAppointments({ patientId, status, start, end })`
  - `frontend/src/pages/Patient/Profile.jsx` (renderiza no Dashboard)
- Fluxo de Dados:
  1. Dashboard carrega paciente da `authStore` e perfil (`/auth/patient/me`)
  2. AgendaSummary requisita consultas (entre hoje e +30 dias) filtradas por `patientId`
  3. UI lista próximas consultas/eventos; estados (loading/empty/error) tratados
  4. Link para visão completa de agenda (aba própria ou `/agenda`)

## Tags do Paciente (Inputs Padronizados)
- Sintaxe: `#TAG: valor` com exemplos:
  - `#PESO: 71`, `#ALTURA: 175`, `#PA_SIS: 120`, `#PA_DIA: 80`
  - Temporais/transitórias: `#DOR_CABECA: leve`, `#FEBRE: 37.8`
- Representação no Dashboard:
  - Numérica: cartões ou mini-gráficos (sparkline) para evolução
  - Categórica: badges com cores, barras de progresso, ícones
- Persistência:
  - Frontend: inputs controlados; normalização antes do envio
  - Backend: endpoint dedicado (futuro) ou `records` com parser de tags
  - Validação: 
    - Checagem `#TAG: valor` e tipagem básica (número/texto/categórico)
    - Compatibilidade FHIR quando aplicável (mapeamento em exportação)
- UX Gamificada:
  - Placeholders exemplificando tags
  - Feedback imediato (válido/inválido) e dicas
  - Históricos simples com evolução (últimos N registros)

## Etapas
1) MVP Agenda no Dashboard
   - Componente `AgendaSummary` lista próximas consultas/eventos do paciente.
   - Integração com `agendaService.getAppointments` e estados de carregamento.
2) Abas de Agenda com dados reais
   - Popular aba "Agenda" com lista filtrável e navegação para detalhes.
3) Persistência de Inputs de Saúde (Tags)
   - Normalizar `#TAG: valor`, salvar, validar, exibir no dashboard.
4) Visualizações de Evolução
   - Gráficos leves (sparklines), médias e alertas básicos.
5) FHIR & AI
   - Mapear tags relevantes para FHIR, validar export; AI sugere normalizações.
6) Testes
   - Frontend: estados de AgendaSummary; validação de campos; mocks.
   - Backend: endpoints de agenda/tag com filtros e auth.

## Hooks & Dependências
- Triggers: Login do paciente → carregar perfil; mudança de aba → render AgendaSummary.
- Dependências: `authStore` (ID/tokens), `agendaService` (HTTP), layout UI.
- Efeitos Colaterais: navegação para `/agenda` ou abas; cache leve via serviço.

## Testes e Validações
- Frontend:
  - Loading/Empty/Error na agenda; render de N itens; navegação.
  - Validação de tags: sintaxe e tipagem.
- Backend:
  - Filtros `patientId`, `status`, `start`, `end` em `/agenda/appointments`.
  - Auth: apenas dados do paciente autenticado.

## Riscos & Mitigações
- Falhas de rede/429: throttling + retry do `api.js`.
- Dados incompletos: fallbacks na UI.
- Crescimento de arquivo: componente separado para manter `<200` linhas.

## Entregáveis
- `AgendaSummary.jsx` com conectores documentados e UI básica.
- Integração no dashboard de `Profile.jsx` sem exceder 200 linhas.
- Plano mantido em `.plans/paciente-dashboard-agenda-e-tags.md`.