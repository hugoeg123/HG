# Plano: Ocultar Controles de Paciente em Slots Agendados pelo Marketplace

Objetivo: Na interface do profissional, ocultar os elementos de seleção/importação de paciente (div) e o botão "Confirmar Nome" quando o slot selecionado já estiver agendado via marketplace pelo paciente (origin = `patient_marketplace`). Esses controles só devem aparecer quando o agendamento tiver sido criado pelo próprio médico (origin = `doctor_manual`) ou quando a origem não estiver definida (legado).

## Integração Map
- **Atualizado**: `frontend/src/components/WeeklyTimeGrid.jsx`
  - Lê `selectedSlot.booking.origin` para decidir visibilidade dos controles.
  - Oculta a linha de dados do paciente e o botão "Confirmar Nome" quando `origin === 'patient_marketplace'`.
- **Reforçado**: `frontend/src/stores/timeSlotStore.js`
  - `loadSlotsForWeek()` mescla `appointments` com slots e injeta `booking.origin` (`patient_marketplace`|`doctor_manual`).
  - `createAppointmentForSlot()` e `confirmAppointmentPatientForSlot()` continuam atualizando `booking.patientName` localmente.

## Data Flow
1. Profissional seleciona um slot.
2. Se `status === 'booked'` e `booking.origin === 'patient_marketplace'`, não mostrar:
   - Campo de nome do paciente, seletor de paciente e botão "Importar Paciente".
   - Botão "Confirmar Nome".
3. Permanecem visíveis: "Configurar", "Disponibilizar" e "Excluir" (conforme aplicável).
4. Se `status === 'booked'` e `origin` não for marketplace (ou ausente), mostrar controles de paciente e permitir "Confirmar Nome".

## Hooks & Dependencies
- **Triggers**: Seleção de slot e renderização do painel rápido em `WeeklyTimeGrid`.
- **Dependencies**: `timeSlotStore` (carrega origem via `agendaService.getAppointments`), `agendaService` (slots/appointments).
- **Side Effects**: Nenhum side-effect novo; apenas mudança de visibilidade.

## Considerações
- Legado: slots antigos sem `origin` são tratados como fluxo do médico (controles visíveis).
- Backend: `agenda.controller.js` define `origin` (`patient_marketplace` para pacientes; `doctor_manual` para médicos).

## Testes
- Selecionar slot agendado pelo marketplace → controles de paciente e "Confirmar Nome" ocultos.
- Selecionar slot agendado pelo médico → controles visíveis e funcionalidade intacta.
- Disponibilizar e Excluir continuam operando em ambos os casos.

## Conectores
- **Connector**: `WeeklyTimeGrid` usa `booking.origin` vindo de `loadSlotsForWeek()` para decisão de UI.
- **Hook**: A visibilidade altera apenas o painel rápido, sem modificar dados.