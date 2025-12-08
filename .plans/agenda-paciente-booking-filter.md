# Plano: Ajuste de agendamento do paciente na agenda do médico

Objetivo: impedir tentativas de agendamento em slots não disponíveis (ex.: `blocked`) e reduzir erros genéricos exibidos ao paciente, alinhando o frontend às regras de autorização/estado do backend.

## Diagnóstico
- Backend (`createAppointment`) exige `slot.status === 'available'`; caso contrário responde `400: Slot não está disponível para agendamento`.
- O componente `PatientDoctorTimeGrid.jsx` exibe slots não `booked` (inclui `blocked`) com botão "Agendar", permitindo tentativas inválidas que geram erro.
- A página `AgendaPacienteMedico.jsx` mostra mensagem genérica ao erro, dificultando diagnóstico.

## Ações Planejadas
1. Restringir a lista e o botão "Agendar" apenas para slots `available`.
2. Exibir rótulo informativo para slots `booked` do próprio paciente e ocultar/indicar indisponibilidade para os demais estados.
3. Adicionar log detalhado no `catch` do `handleBook` para inspecionar `status`/`message` retornados pelo backend (sem alterar mensagem exibida ao usuário por enquanto).

## Integration Map
- **Atualizado**: `frontend/src/pages/Patient/components/PatientDoctorTimeGrid.jsx`
  - Conecta-se a `services/agendaService.js` (POST `/agenda/appointments`).
  - Conecta-se a `AgendaPacienteMedico.jsx` via prop `onBook`.
- **Atualizado**: `frontend/src/pages/Patient/AgendaPacienteMedico.jsx`
  - Conecta-se a `store/authStore.js` para obter `user.id`.
  - Conecta-se a `services/agendaService.js` para criar agendamento.
- **Backend de referência**: `backend/src/controllers/agenda.controller.js` (regra: somente slots `available` podem ser agendados).

## Data Flow
1. Usuário seleciona um horário na grade.
2. Se `slot.status === 'available'`, mostra botão "Agendar" → chama `createAppointment({ slot_id, patient_id })`.
3. Sucesso: atualiza estado local (`slot.status = 'booked'`) para feedback imediato.
4. Erro: loga detalhes de `error.response.status` e `error.response.data.message` para diagnóstico.

## Hooks & Dependencies
- **Triggers**: clique no botão "Agendar" dentro de `PatientDoctorTimeGrid`.
- **Dependencies**: `agendaService`, `authStore` (para `patient_id`), `backend` (validação/autorizações).
- **Side Effects**: atualização visual local de `slots` após sucesso.

## Testes sugeridos
- Garantir que slots `blocked` não exibem "Agendar".
- Agendar um slot `available`: deve confirmar sem erro.
- Verificar que agendamentos já criados do próprio paciente aparecem como "Seu agendamento".

## Conformidade e Segurança
- FHIR: sem impacto (fluxo de agenda não exporta dados FHIR).
- Segurança: mantém a validação/autorização no backend; nenhuma execução dinâmica.
- Documentação: comentários de conector/hook mantidos nos componentes editados.

## Resumo
Esta alteração alinha o frontend ao contrato do backend, evitando tentativas inválidas de agendamento e reduzindo mensagens de erro genéricas, com impacto mínimo e melhorias claras de UX.