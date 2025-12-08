# Plano: Ajustar agendamento por paciente e notificações ao médico

## Objetivo
- Permitir que pacientes criem agendamentos (`POST /api/agenda/appointments`) respeitando validações.
- Notificar médicos via Socket.io quando um novo agendamento for criado.
- Adicionar link de Marketplace na barra lateral do paciente.
- Exibir toasts de notificações globais para médicos no layout principal.

## Integração Map
- **Novo Arquivo**: `backend/src/services/socket.registry.js`
  - **Conecta com**: `backend/src/app.js` via registro de serviço (`setSocketService`)
  - **Conecta com**: `backend/src/controllers/agenda.controller.js` via `getSocketService`
- **Alterado**: `backend/src/app.js`
  - **Hook**: Após inicialização do `socket.service`, registra o serviço no `socket.registry`
- **Alterado**: `backend/src/controllers/agenda.controller.js`
  - **Hook**: Em `createAppointment`, autoriza paciente e emite notificação ao médico
- **Alterado**: `frontend/src/components/Layout/PatientSidebar.jsx`
  - **Hook**: Adiciona item de navegação para `/marketplace`
- **Alterado**: `frontend/src/components/Layout/MainLayout.jsx`
  - **Hook**: Assina evento `notification` do socket e exibe toast para médicos

## Fluxo de Dados
1. Usuário (paciente) escolhe `slot` e envia `POST /api/agenda/appointments` com `slot_id` e `patient_id`.
2. Backend valida, cria `Appointment`, atualiza `AvailabilitySlot.status = 'booked'`.
3. Backend emite `sendToUser(medico_id, 'notification', { type: 'appointment:new', ... })` via registro.
4. Frontend (médico) está conectado ao socket e recebe `notification`, exibe toast.
5. Paciente acessa Marketplace via link no `PatientSidebar`.

## Regras de Autorização
- Médico: continua restrição para CRUD de slots e atualização/cancelamento de agendamentos.
- Paciente: pode criar agendamento se `patient_id` do body corresponder ao `req.user.id` e o `slot` estiver `available`.

## Hooks & Dependências
- **Triggers**:
  - `createAppointment` no backend
  - Conexão Socket.io autenticada no frontend (médico)
- **Dependências**:
  - `AvailabilitySlot`, `Appointment`, `Patient` modelos
  - `socket.service` e `socket.registry`
  - `ToastProvider` no `App.jsx`
- **Side Effects**:
  - Atualização de `slot.status` para `booked`
  - Toasts de UI para médicos no frontend

## Testes & Verificações
- Backend: Criar agendamento como paciente autenticado, validar 201 e `slot.status` atualizado.
- Backend: Bloquear criação se `patient_id` != `req.user.id`.
- Frontend: Verificar link Marketplace no perfil do paciente.
- Frontend: Verificar assinatura de `notification` e exibição de toast (com backend em execução).

## MVP e Incrementos
- MVP: autorização no backend + notificação básica + link Marketplace + assinatura de toast.
- Incremento futuro: detalhar payload de notificação, incluir nome do paciente e formato de horário amigável, logs e métricas.