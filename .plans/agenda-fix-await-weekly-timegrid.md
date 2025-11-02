# Plano: Correção de await em WeeklyTimeGrid.jsx

## Objetivo
- Corrigir erro `[plugin:vite:react-babel] Unexpected reserved word 'await'` causado por uso de `await` dentro de função não assíncrona no `WeeklyTimeGrid.jsx`.

## Análise
- Sintoma: erro em HMR/HOT-RELOAD ao carregar `WeeklyTimeGrid.jsx`.
- Causa: inserimos `await createPatient(...)` e `await createAppointmentForSlot(...)` dentro de `handleMouseUp`, que era definida como função síncrona.
- Impacto: quebra de build/HMR, fluxo de arraste para agendamento indisponível.

## Integração Map
- **Arquivo**: `frontend/src/components/WeeklyTimeGrid.jsx`
  - **Conecta a**: 
    - `frontend/src/stores/timeSlotStore.js` via hooks para `createAppointmentForSlot`, `confirmAppointmentPatientForSlot`, `updateSlotInBackend`.
    - `frontend/src/store/patientStore.js` para `createPatient`.
  - **Data Flow**:
    1. Usuário arrasta na grade → `handleMouseUp` decide ação conforme `markingMode`.
    2. `booking`/`appointment`: cria paciente placeholder e appointment (backend) se slot `available`.
    3. Atualiza estado visual do slot via store e eventos `timeSlotsUpdated`.

## Hooks & Dependências
- **Triggers**: evento de mouse up na grade semanal.
- **Dependências**: `agendaService` através dos stores (`createAppointment`, `getAppointments`).
- **Side Effects**: dispatch de `CustomEvent('timeSlotsUpdated')` e atualizações locais.

## Plano de Implementação
1. Tornar `handleMouseUp` assíncrona (`async`) para permitir `await` interno.
2. Validar no preview que o erro Babel desaparece e o fluxo de arraste funciona.
3. Conferir que o fluxo “confirmar nome” não dispara “Agendamento não encontrado”.

## Validação
- Abrir `http://localhost:3000/` e realizar:
  - Arrastar e soltar em `booking` para criar appointment placeholder sem erro.
  - Confirmar nome com paciente real, sem mensagem de agendamento ausente.

## Observações de Conformidade
- Documentação de integração incluída conforme template.
- Mudança mínima, sem expandir escopo nem adicionar restrições futuras.