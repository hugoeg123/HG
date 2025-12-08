## Objetivo

Implementar a separação clara entre as agendas de profissional e paciente no produto, garantindo que:
- Paciente veja apenas sua própria agenda (consultas marcadas e eventos) no seu perfil.
- Disponibilidades do profissional sejam exibidas apenas no perfil público do profissional (Marketplace/Perfil), sem misturar com a agenda do paciente.
- Inputs de saúde preenchidos pelo paciente sejam salvos como tags estruturadas com marcador da origem (paciente), permitindo discriminação na análise futura.

## Integração Map

- **Novo Endpoint**: `GET /api/agenda/my-appointments`
  - **Conecta a**: `frontend/src/components/patient/AgendaSummary.jsx` via `agendaService.getMyAppointments`
  - **Dados**: Lista de `Appointment` do paciente autenticado, incluindo `slot.medico`

- **Novo Modelo**: `src/models/sequelize/PatientTagEntry.js`
  - **Conecta a**:
    - `src/controllers/patient_tag_entry.controller.js`
    - `src/routes/patient_input.routes.js` (prefixo `/api/patient-inputs`)
    - `frontend/src/services/patientInputService.js` (create/listMine)
    - `frontend/src/pages/Patient/Profile.jsx` (salvar inputs de saúde)
  - **Dados**: `patient_id`, `tag_id` (opcional), `tag_name` (opcional), `value`, `source`, `medico_id` (opcional)

- **Frontend**:
  - `AgendaSummary.jsx`: usa `getMyAppointments` para exibir agenda do paciente.
  - `Profile.jsx`: botão "Salvar" persiste peso/altura/notas como `PatientTagEntry` com `source='patient'`.
  - `patientInputService.js`: encapsula chamadas para `/api/patient-inputs`.

## Hooks & Dependências

- **Triggers**:
  - Login paciente → `AgendaSummary` carrega `my-appointments`.
  - Ação "Salvar" em `Profile.jsx` → cria entradas de tags do paciente.

- **Dependências**:
  - Autenticação JWT (`authMiddleware`) para identificar `req.user.role` e `req.user.id`.
  - Modelos existentes: `Appointment`, `AvailabilitySlot`, `Medico`, `Patient`, `Tag`.

- **Side Effects**:
  - Nenhuma alteração na lógica de slots/agendamentos do médico.
  - Persistência adicional de dados sensíveis do paciente (respeitar segurança e validações).

## Design & Segurança de Dados

- Endpoint `my-appointments` exige `role=patient` e filtra por `patient_id`.
- `PatientTagEntry` grava `source='patient'` para entradas oriundas do paciente; permite futura distinção entre entradas do profissional e do paciente.
- Validações de entrada (express-validator): tipos, datas ISO, UUIDs quando aplicável.

## MVP Passos

1. Backend: adicionar `GET /agenda/my-appointments` (+ validações) e incluir no `agendaService`.
2. Frontend: atualizar `AgendaSummary.jsx` para usar `getMyAppointments` e exibir médico do `slot.medico`.
3. Backend: criar `PatientTagEntry` (modelo, controlador e rotas) para salvar tags do paciente.
4. Frontend: `patientInputService` e integração no `Profile.jsx` (salvar peso, altura e tags em notas no formato `#TAG: valor`).
5. Documentar conectores em comentários nos arquivos criados.

## Próximos (fora do escopo imediato)

- Página detalhada do perfil do médico com fluxo de agendamento.
- FHIR mapeamento para `PatientTagEntry` (Observation / QuestionnaireResponse).
- Relatórios/analítica que unem `Record` (profissional) e `PatientTagEntry` (paciente) por tag.