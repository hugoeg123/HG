# Plano: Correção da exibição de horários no grid do paciente

Status: concluído
Data: 2025-11-11

## Objetivo
Ao selecionar um dia com horários livres, exibir corretamente os horários disponíveis no grid inferior para o paciente agendar. Corrigir a compatibilidade entre os dados do endpoint público (`/marketplace/slots`) e o componente `PatientDoctorTimeGrid`.

## Contexto & Diagnóstico
- Fonte de dados: `frontend/src/services/marketplaceService.js#getAvailableSlots` chama `GET /marketplace/slots`.
- Backend: `backend/src/controllers/marketplace.controller.js#listAvailableSlots` retorna apenas slots com `status='available'` e **não inclui** o campo `status` nos atributos.
- Componente afetado: `frontend/src/pages/Patient/components/PatientDoctorTimeGrid.jsx` filtrava por `s.status === 'available'`, resultando em lista vazia quando `status` não estava presente.
- Calendário (`PatientDoctorCalendar.jsx`) contabiliza disponíveis com `status !== 'booked'`, o que funciona mesmo sem `status` (exibe “3 livres”). O grid, porém, não exibia os horários.

## Alteração Planejada
1. Ajustar filtro do `PatientDoctorTimeGrid` para tratar `status` ausente como “available”.
2. Manter lógica para destacar “meus agendamentos” quando presentes (via `bookedByMeSlotIds`).
3. Documentar integração e compatibilidade com endpoint público.

## Integração Map
- **Arquivo Atualizado**: `frontend/src/pages/Patient/components/PatientDoctorTimeGrid.jsx`
- **Conecta a**:
  - `frontend/src/pages/Patient/AgendaPacienteMedico.jsx` (passa `slots`, `selectedDate`, `onBook`)
  - `frontend/src/services/marketplaceService.js#getAvailableSlots` (dados públicos de slots)
  - `frontend/src/services/agendaService.js#createAppointment` (ação de agendar)
- **Fluxo de Dados**:
  1. `AgendaPacienteMedico` carrega slots públicos do médico (intervalo selecionado)
  2. Usuário seleciona um dia no `PatientDoctorCalendar`
  3. `PatientDoctorTimeGrid` filtra slots do dia e exibe horários
  4. Clique em “Agendar” chama `createAppointment`; feedback local e via API

## Hooks & Dependências
- **Triggers**: seleção de dia (`onSelectDate`), alteração de período (`start/end`), carga de slots
- **Dependências**: API Marketplace (pública), API Agenda (autenticada), `authStore` para `user.id`
- **Side Effects**: nenhum extra; mudança apenas de filtro no grid (UI)

## Observações
- MVP: após agendar, o grid marca o slot como `booked`. Para refletir “Seu agendamento” imediatamente, recomenda-se refetch de `getMyAppointments` ou atualização local de `bookedByMeSlotIds`.

## Teste Visual
- Selecionar “12/11/2025” no calendário deve exibir os horários listados com botão “Agendar”.