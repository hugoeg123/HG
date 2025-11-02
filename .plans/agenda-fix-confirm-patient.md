# Plano: Correção do fluxo “Confirmar Nome” na Agenda

Objetivo: Eliminar o erro “Falha ao confirmar nome: Agendamento não encontrado para o slot” e garantir que o nome selecionado/digitado apareça no visual “Agendado”.

## Diagnóstico
- Slots estavam sendo marcados localmente como `booked` sem existir `Appointment` no backend.
- A busca de appointments por intervalo não encontrava registro correspondente, gerando o erro.
- Em alguns pontos o frontend forçava `status` na criação de slots, causando divergência de estado com o backend.

## Ações Implementadas
1. Store: `confirmAppointmentPatientForSlot`
   - Recuperação: se não existir appointment no backend para o slot, liberar o slot (`available`) e recriar o appointment com o paciente e notas.
   - Troca de paciente: como o backend não permite atualizar `patient_id` diretamente, exclui o appointment e recria com o novo paciente.
   - Atualização de notas: quando `patient_id` não muda, atualiza apenas `notes`.

2. Store: `createAppointmentForSlot`
   - Restringe criação a slots `available` (alinhado às regras do backend).
   - Atualiza `booking.patientName` localmente com o conteúdo de `notes` para o visual “Agendado”.

3. Store: `createSlotsFromRangeWithSettings`
   - Passa a criar slots sempre como `available` (sem marcar `booked` localmente).
   - Mantém remoção de conflitos quando em modos “booking/appointment”, sem produzir estados incorretos.

4. Store: `createSlotInBackend`
   - Ignora `slot.status` vindo do frontend; usa sempre o `status` retornado pelo backend para evitar discrepâncias.

5. Componente: `WeeklyTimeGrid.jsx`
   - `handleAgendarSelected` e `handleConfirmPatientName`: se o paciente vier do `select` e não houver nome digitado, usa o nome selecionado como `notes` para aparecer em “Agendado”.
   - `handleStartBookingMode`: cria primeiro um appointment com paciente placeholder quando o slot está `available`.

## Integration Map
- Novo/Atualizado:
  - `frontend/src/stores/timeSlotStore.js`
    - Conecta com `frontend/src/services/agendaService.js` (CRUD de slots/appointments).
    - Conecta com `frontend/src/components/WeeklyTimeGrid.jsx` (handlers de agendamento/confirmar nome).
  - `frontend/src/components/WeeklyTimeGrid.jsx`
    - Conecta com `store/patientStore.js` para criar/selecionar pacientes.

## Data Flow
1. Usuário seleciona slot → painel rápido.
2. “Agendar”: cria `Appointment` no backend quando `slot.status === 'available'`.
3. “Confirmar Nome”: busca appointment por intervalo do slot; se não existir, recupera (libera slot e recria). Se paciente mudou, recria; senão, atualiza `notes`.
4. Atualização local: `slot.status = 'booked'` e `slot.booking.patientName = notes` para refletir no visual “Agendado”.

## Hooks & Dependencies
- Triggers:
  - Botões “Agendar”, “Confirmar Nome”, “Disponibilizar” em `WeeklyTimeGrid.jsx`.
  - Eventos `timeSlotsUpdated` para sincronização visual.
- Dependencies:
  - `agendaService` (`createSlot`, `updateSlot`, `createAppointment`, `getAppointments`, `updateAppointment`, `deleteAppointment`).
  - `patientStore` (`fetchPatients`, `createPatient`).
- Side Effects:
  - Atualização de estado local e disparo de eventos para re-render.
  - Liberar/cancelar appointments conforme regras de backend.

## Notas de Conformidade
- FHIR: nenhum impacto direto; fluxo de agenda não exporta dados FHIR.
- Segurança: sem uso de `eval()`; apenas chamadas de API e atualização de estado.
- Logs/Erros: mensagens de erro mais claras para o usuário ao tentar criar/confirmar agendamentos.

## Testes sugeridos
- Criar slot `available` → “Agendar” com paciente selecionado → visualizar “Agendado • Nome”.
- “Confirmar Nome” em slot `booked` sem appointment (forçado) → deve recuperar e mostrar o nome.
- Troca de paciente via “Confirmar Nome” → recria appointment e reflete novo nome.

## Resumo
Correções eliminam estados locais inconsistentes, alinham as operações ao backend e garantem que o visual “Agendado” apresente o nome do paciente selecionado/digitado, resolvendo o erro relatado.