# Agenda do Médico — Interface do Paciente (Grid + Calendário)

Objetivo: permitir ao paciente visualizar e “caçar” disponibilidade do profissional em duas formas complementares: grid por dia e calendário mensal com contadores. Esconder slots agendados por outros pacientes; mostrar apenas os seus e os disponíveis.

## Integration Map
- **Página**: `frontend/src/pages/Patient/AgendaPacienteMedico.jsx`
- **Novos Componentes**:
  - `frontend/src/pages/Patient/components/PatientDoctorCalendar.jsx` (calendário mensal)
  - `frontend/src/pages/Patient/components/PatientDoctorTimeGrid.jsx` (grid de horários)
- **Conecta a**:
  - `frontend/src/services/marketplaceService.js` → `getDoctorById`, `getAvailableSlots`
  - `frontend/src/services/agendaService.js` → `getMyAppointments`, `createAppointment`
  - `frontend/src/store/authStore.js` → `user.id`
- **Estilos**:
  - `frontend/src/agenda-styles.css` (reuso das classes do calendário do profissional)

## Data Flow
1. Paciente acessa `/patient/doctor/:id/agenda`.
2. A página carrega: dados do médico, slots públicos do período e “meus agendamentos”.
3. O calendário mensal agrega contagens por dia: `livres` e `meus agendados`.
4. O grid exibe apenas `available` e `booked` se `slot_id` ∈ `meusAgendamentos`.
5. Paciente clica em um dia no calendário → filtra o grid por esse dia.
6. Em slots `available`, ação “Agendar” chama `createAppointment`.

## Hooks & Dependencies
- **Triggers**: Navegação a partir de `DoctorPublicProfile.jsx`.
- **Dependencies**: Autenticação de paciente; endpoints `GET /marketplace/slots`, `GET /agenda/my-appointments`, `POST /agenda/appointments`.
- **Side Effects**: Atualização local do status do slot após sucesso do agendamento.

## Regras de Privacidade e UX
- Ocultar slots `booked` de outros pacientes.
- Destacar “meu agendamento” quando presente.
- Sem criação/edição/exclusão de slots (apenas visualizar e agendar). 

## MVP Detalhado (esta implementação)
- Refatorar página para suportar modo `grid` e `calendário` com toggle.
- Criar componentes desacoplados (<200 linhas cada) com documentação de conectores.
- Carregar `getMyAppointments` e correlacionar por `slot_id`.
- Importar `agenda-styles.css` para visual do calendário.

## Test Hooks
- Verificar que slots agendados por outros não aparecem no grid.
- Garantir que o contador do calendário considera apenas `available` e `meus agendados`.

Última atualização: v2 planejada e pronta para implementação.