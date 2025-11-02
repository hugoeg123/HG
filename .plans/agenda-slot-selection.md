# Plano: Ajustes de Seleção de Slot na Agenda

## Objetivo
Aprimorar o comportamento ao selecionar slots na grade (WeeklyTimeGrid), diferenciando fluxos para slots disponíveis e agendados, com persistência de duração/intervalo, transição para agendado, opções de paciente e exclusão com confirmação.

## Escopo
- Painel rápido (overlay) ao clicar no slot:
  - Slot disponível: mostrar apenas duração e intervalo + ações Confirmar e Agendar; ocultar inputs de paciente.
  - Slot agendado: manter duração/intervalo e exibir opções de paciente (selecionar/importar/criar), disponibilizar e excluir com confirmação.
- Persistir alterações de duração/intervalo e ajustar `endTime` do slot.
- Exibir nome ou iniciais do paciente em slots agendados.
- Confirmar exclusão via prompt.

## Integração Map
- **New/Updated Files**:
  - `frontend/src/features/agenda/WeeklyTimeGrid.jsx` (UI/handlers do painel rápido)
  - `frontend/src/store/timeSlotStore.js` (fluxo de criação de agendamento para slots já marcados como agendados)
  - `frontend/src/services/agendaService.js` (sem alterações esperadas)
- **Connects To**:
  - `useTimeSlotStore` (Zustand): carregar/atualizar slots, criar/cancelar agendamentos
  - `usePatientStore`: buscar lista de pacientes e dados para seleção
  - Backend `/agenda/slots` e `/agenda/appointments`
- **Data Flow**:
  1. Usuário clica em slot → painel rápido abre (modo depende do status do slot)
  2. Ajuste de duração/intervalo → Confirmar salva store + atualiza slot (endTime)
  3. Clicar Agendar (slot disponível) → mudar UI para modo agendado e permitir definir paciente
  4. Selecionar/Importar/Criar paciente → criar appointment no backend
  5. Disponibilizar (slot agendado) → cancelar appointment (se existir) e voltar para disponível
  6. Excluir → confirmar e remover slot

## Hooks & Dependencies
- **Triggers**:
  - Click em `slot overlay` abre painel
  - Botões Confirmar / Agendar / Disponibilizar / Excluir
- **Dependencies**:
  - Stores: `timeSlotStore`, `patientStore`
  - Serviços: `agendaService`
- **Side Effects**:
  - Persistência de duração/intervalo global
  - Atualização de `endTime` do slot selecionado
  - Mudança de `status` do slot e criação/cancelamento de appointments

## Etapas (MVP)
1. Ajustar UI: modos "disponível" e "agendado" no painel rápido (WeeklyTimeGrid)
2. Implementar Confirmar: salvar `appointmentDuration` e `intervalBetween` e atualizar `endTime` do slot
3. Fluxo Agendar: alternar para modo agendado sem inputs de paciente no passo inicial
4. Permitir criar appointment mesmo se slot já estiver com status `booked`
5. Exibir nome/iniciais do paciente no overlay
6. Lixeira (excluir) com `window.confirm`

## Riscos e Mitigações
- Marcar slot como `booked` sem paciente pode divergir do backend: permitir criação de appointment para slots `available` e `booked` (ajuste em store).
- Arquivo WeeklyTimeGrid é extenso (>200 linhas): mudanças serão cirúrgicas para minimizar impacto, deixando refatoração fora do escopo.

## Critérios de Aceitação
- Ao clicar em slot disponível: painel sem inputs de paciente; apenas duração/intervalo + Confirmar/Agendar.
- Confirmar: oculta painel, atualiza slot com nova duração.
- Agendar: painel passa a mostrar seleção/criação/importação de paciente, disponibilizar e excluir com confirmação.
- Slots agendados exibem nome/iniciais do paciente quando disponível.