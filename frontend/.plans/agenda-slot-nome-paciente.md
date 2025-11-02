# Ajuste de exibição do nome do paciente no slot agendado

Objetivo: Quando o nome do paciente é confirmado (via importar, seleção ou digitado), o nome deve aparecer no slot agendado no lugar do rótulo "Agendado".

Decisões
- Prioridade da fonte do nome: importado > seleção > digitado.
- Utilizar `notes` para propagar `patientName` ao backend e estado local (via `timeSlotStore.createAppointmentForSlot` e `confirmAppointmentPatientForSlot`).
- Atualizar renderização em `WeeklyTimeGrid.jsx` e `TimeGridSlot.jsx` para exibir apenas o nome quando disponível.

## Integração Map
- Novo documento: `frontend/.plans/agenda-slot-nome-paciente.md`
- Conecta a:
  - `frontend/src/components/WeeklyTimeGrid.jsx` (handlers de confirmação e renderização)
  - `frontend/src/stores/timeSlotStore.js` (`createAppointmentForSlot`, `confirmAppointmentPatientForSlot`, `updateSlotBooking`)
  - `frontend/src/components/TimeGridSlot.jsx` (indicadores de status)

## Fluxo de Dados
1. Usuário seleciona slot e confirma nome (importado/selecionado/digitado)
2. Handler define `patientId` e `notes` conforme prioridade
3. Backend registra appointment; estado local atualiza `booking.patientName`
4. Grid renderiza o nome no lugar de "Agendado"

## Hooks & Dependências
- Trigger: Clique em botão de confirmar/agendar dentro do painel do slot
- Dependências: `usePatientStore` (inclui `currentPatient`), `timeSlotStore`
- Efeito: Atualiza visual do slot e sincroniza com backend

## Compliance & Segurança
- Sem dados sensíveis no prompt AI
- Sem `eval()`

## Testes sugeridos
- Confirmar nome com paciente importado: nome aparece no slot
- Confirmar com paciente selecionado (sem importado): nome aparece
- Confirmar digitado (sem importado/seleção): nome aparece
- Navegação semanal mantém nomes visíveis para slots agendados