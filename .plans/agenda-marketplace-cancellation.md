# Plano: Ajustes de Agenda (Marketplace) e Notificações

## Objetivos
- Mapear fluxo de Agendar/Disponibilizar na WeeklyTimeGrid e stores
- Implementar notificação para paciente ao cancelar consulta de origem marketplace
- Adicionar confirmação na UI ao disponibilizar consulta marketplace
- Melhorar robustez do fluxo de Agendar em slots disponíveis (tratamento de erros e atualização)
- Rever visibilidade dos controles de paciente para agendamentos do médico

## Integração Map
- **Frontend**
  - `src/components/WeeklyTimeGrid.jsx`
    - Conecta com `src/stores/timeSlotStore.js` (criação/atualização/cancelamento de appointments e slots)
    - Conecta com `src/store/patientStore.js` (criação/seleção de pacientes)
    - Dados exibidos: `selectedSlot.booking.origin` controla visibilidade de UI (marketplace vs manual)
  - `src/services/agendaService.js`
    - Endpoints: `/agenda/slots`, `/agenda/appointments`, `/agenda/my-appointments`
    - Payloads: `createAppointment({ slot_id, patient_id, notes })`, `updateAppointment(id, { status|notes })`
  - `src/services/api.js`
    - Base URL `http://localhost:5001/api`
    - Intercepta tokens e gerencia retry/throttling

- **Backend**
  - `backend/src/controllers/agenda.controller.js`
    - `createAppointment`: valida auth/ownership, cria com `origin` (patient_marketplace/doctor_manual) e notifica médico
    - `updateAppointment`: atualiza status/notes; libera slot se cancelado; (a ser ampliado) notificar paciente em cancelamento marketplace
  - `backend/src/services/socket.service.js` e `socket.registry.js`
    - `sendToUser(userId, eventName, data)`: envio de notificações em tempo real

## Fluxos & Dependências
1. **Agendar (Doctor Manual)**
   - WeeklyTimeGrid → `handleStartBookingMode` cria paciente placeholder e chama `timeSlotStore.createAppointmentForSlot()`
   - Store usa `agendaService.createAppointment` → backend `createAppointment` (origin: doctor_manual)
   - Backend seta slot `booked` e notifica médico
   - UI muda painel para `booking`; controles de paciente visíveis (não marketplace)

2. **Disponibilizar (Cancelar)**
   - WeeklyTimeGrid → `handleDisponibilizarSelected` → `timeSlotStore.cancelAppointmentForSlot()`
   - Store obtém appointment do intervalo e chama `agendaService.updateAppointment(id, { status: 'cancelled' })`
   - Backend atualiza appointment e slot `available`
   - (Novo) Se `appointment.origin === 'patient_marketplace'`, notifica paciente via socket
   - UI limpa `booking` local e atualiza estado

3. **Confirmar Nome (Atualizar Paciente/Notas)**
   - WeeklyTimeGrid → `handleConfirmPatientName` → `timeSlotStore.confirmAppointmentPatientForSlot()`
   - Store alterna: recriação de appointment se paciente mudou; caso contrário atualiza `notes`
   - UI reflete novo `booking.patientName`

## Hooks & Dependências
- **Triggers**
  - Criação de appointment: `handleStartBookingMode`/`handleAgendarSelected`
  - Cancelamento de appointment: `handleDisponibilizarSelected`
  - Confirmação de paciente: `handleConfirmPatientName`

- **Dependências**
  - Autenticação (tokens via `api.js`)
  - Modelos Sequelize (`Appointment`, `AvailabilitySlot`, `Patient`)
  - Socket Service para notificações

- **Side Effects**
  - Atualiza estado local `timeSlotStore` (status/booking)
  - Emite `window.dispatchEvent('timeSlotsUpdated')` para sincronização
  - Notificações em tempo real (médico já; paciente será adicionado)

## MVP & Etapas
1. Backend: notificar paciente em `updateAppointment` quando `status === 'cancelled'` e `origin === 'patient_marketplace'`
2. Frontend: prompt de confirmação ao cancelar marketplace
3. Store: melhorar tratamento de erro no `createAppointmentForSlot` e recarregar semana após falha
4. Auditoria de visibilidade dos controles de paciente (manter visível se `origin !== 'patient_marketplace'`)

## Testes
- **Integração**: cancelar appointment marketplace e verificar envio de socket para paciente
- **UI**: confirmar que o prompt aparece apenas para marketplace; que controles de paciente aparecem para manual
- **Erro**: simular falha em `createAppointment` e confirmar refresh de semana e mensagem amigável

## Segurança & Compliance
- Sem dados sensíveis na notificação; mensagem genérica com horário
- Sem uso de `eval`; sem execução de código externo

## Observações
- Tamanho de arquivos existente pode exceder 200 linhas (legado); alterações mínimas e documentadas