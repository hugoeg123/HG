# Plano de Performance: Sidebar de Pacientes e Dashboard

## Objetivo
- Reduzir latência ao selecionar pacientes na esquerda e navegar ao dashboard.
- Evitar requisições duplicadas e pesadas (prefetch de registros) na lista.

## Estratégia
- Cancelamento automático (AbortController) na busca de dashboard quando troca de paciente.
- Single-flight via `api.js` para GET concorrentes do mesmo recurso.
- Desabilitar prefetch pesado de registros na sidebar e carregar sob demanda.
- Exibir `recordCount` ao invés de materializar todos os registros.

## Integração Map
- **Atualizado**: `frontend/src/store/patientStore.js`
  - Conecta com: `frontend/src/services/api.js` via `api.get('/patients/:id/dashboard', { signal })`.
  - Hook: `dashboardAbortController` aborta requisição anterior quando o usuário muda de paciente.
  - Side effect: `fetchPatients(useCache, { prefetchRecords })` controla prefetch opcional.

- **Atualizado**: `frontend/src/components/Layout/LeftSidebar.jsx`
  - Conecta com: `store/patientStore.js` via `fetchPatients(true, { prefetchRecords: false })` e `fetchPatientRecords(id)`.
  - Data Flow:
    1. Usuário clica paciente → `setCurrentPatient` e navega `/patients/:id`.
    2. Expande paciente → lazy load de registros se `recordCount > 0`.
    3. Exibe `recordCount` para contagem sem carregar todos os registros.

- **Existente**: `frontend/src/services/api.js`
  - Hook: `singleFlightMap` para deduplicar GETs; interceptores ignoram `ERR_CANCELED/AbortError`.

## Testes & Validação
- Navegar rapidamente por 4–6 pacientes na sidebar e observar:
  - Sem travamento, sem loop de requisições.
  - Dashboard atualiza apenas a última seleção.
  - RecordCount aparece imediato; registros carregam ao expandir.
- Logs esperados: cancelamentos (AbortError), sem erros visíveis.

## Observações
- Mantidas APIs e contratos; mudanças minimizam impacto futuro.
- Arquivos seguem limite < 200 linhas por alteração.