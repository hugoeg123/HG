# Plano: Correção de exibição de registros na LeftSidebar

## Contexto
- Problema: Paciente com 2 registros aparece como "Nenhum registro encontrado" na LeftSidebar após login; ao criar um terceiro registro, todos aparecem, e após sair/entrar o problema retorna.
- Sintoma observado: `recordCount` mostra 2, mas a lista renderiza vazio.
- Hipótese: Comparações estritas de IDs (`===`) entre `string` (ex.: `useParams`) e `number` (ex.: dados normalizados) impedem sincronização do estado (`currentPatient.records`) e do gating de renderização.

## Causa Raiz
- No `LeftSidebar.jsx`, condições de expansão e renderização com `expandedPatient === patientId` e `currentPatient?.id === patientId` dependem de igualdade estrita.
- No `patientStore.js`, `fetchPatientRecords` só atualiza `currentPatient.records` se `state.currentPatient?.id === patientId`, o que pode falhar com tipos divergentes após uso de cache/localStorage ou rota.
- `updatePatient`/`deletePatient` usam `startsWith` em `patientId` sem guard, potencial para exceção quando `id` é `number` (não o problema reportado, mas alinhado à correção de tipos).

## Plano de Ação
1. Introduzir helper de igualdade segura de IDs (`eqId`) em `LeftSidebar.jsx` e `patientStore.js` usando `String(a) === String(b)`.
2. Substituir comparações estritas por `eqId` nos pontos críticos:
   - `LeftSidebar.jsx`: gating de expansão, renderização de records.
   - `patientStore.js`: atualizações em `fetchPatientRecords`, `createRecord`, `updatePatient`, `deletePatient`.
3. Adicionar pequenos guards em `startsWith` para evitar exceções quando `patientId` for número.
4. Documentar conectores e hooks nos arquivos editados conforme padrão do projeto.
5. Subir o frontend (Vite) e validar visualmente a LeftSidebar.

## Integração Map
- **Arquivos alterados**:
  - `frontend/src/components/Layout/LeftSidebar.jsx`
  - `frontend/src/store/patientStore.js`
- **Conecta com**:
  - `frontend/src/services/api.js` via `recordService.getByPatient`
  - `backend/src/controllers/record.controller.js` para `/records/patient/:patientId`
  - `frontend/src/store/authStore.js` (interceptores de token em `api.js`)
- **Fluxo de Dados**:
  1. Usuário expande paciente na LeftSidebar.
  2. `setCurrentPatient` + `fetchPatientRecords(patient.id)`.
  3. `patientStore` carrega cache e busca na API; atualiza `currentPatient.records`.
  4. LeftSidebar renderiza lista quando `eqId(currentPatient.id, patient.id)`.

## Hooks & Dependências
- **Triggers**: Clique para expandir paciente; criação de registro.
- **Dependências**: `recordService`, `localStorage` de pacientes/records, `useParams` (ids como string).
- **Side Effects**: Atualização imediata de UI e cache local sem alterar contratos de API.

## MVP & Impacto
- Correção de gating de renderização e atualização de estado com baixa intrusão.
- Minimiza regressões; não altera endpoints ou modelos.