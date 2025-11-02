# Plano: Painel da Agenda — Separar "Configurar" e "Confirmar Nome" com Placeholder

Objetivo: Ajustar o painel rápido da agenda para slots agendados, separando claramente a configuração de duração/intervalo da consulta da confirmação do nome do paciente, e evitar erro 400 criando um paciente placeholder "Sem Nome" no fluxo inicial de agendamento via interface médica.

## Integração Map
- **Novo/Reforçado**: `frontend/src/stores/timeSlotStore.js`
  - `confirmAppointmentPatientForSlot(slotId, patientId, notes)`
  - Conecta a `frontend/src/services/agendaService.js` → `updateAppointment`
  - Dispara `window.dispatchEvent('timeSlotsUpdated')` para sincronização visual
- **Atualizado**: `frontend/src/components/WeeklyTimeGrid.jsx`
  - Botões separados:
    - `Configurar` (duração/intervalo) → `updateSlotInBackend({ endTime })`
    - `Confirmar Nome` (paciente) → `confirmAppointmentPatientForSlot(...)`
  - Fluxo de agendamento:
    - `Agendar` (slots disponíveis) → alterna para `booked` e cria placeholder "Sem Nome"
    - `Disponibilizar` (slots agendados) → `cancelAppointmentForSlot`
- **Serviços**: `frontend/src/services/agendaService.js`
  - `createAppointment({ slot_id, patient_id, notes })`
  - `updateAppointment(id, data)`
- **Store de Pacientes**: `frontend/src/store/patientStore.js`
  - `createPatient({ name: 'Sem Nome', placeholder: true })`
  - Usado para criar o paciente placeholder e para criação rápida ao digitar nome

## Data Flow
1. Usuário seleciona slot:
   - `available` → mostra botão `Agendar`
   - `booked` → mostra `Configurar`, campos de paciente e botão `Confirmar Nome`
2. `Agendar`:
   - Atualiza slot para `booked`
   - Cria paciente placeholder "Sem Nome"
   - Cria `appointment` com `patient_id` placeholder para evitar 400
3. `Confirmar Nome`:
   - Usa `selectedPatientId` ou cria paciente com nome digitado
   - Atualiza `appointment` (`patient_id` e `notes`), reflete `booking.patientName`
4. `Configurar`:
   - Ajusta `endTime` com base na duração atual, sem tocar no paciente
5. `Disponibilizar`:
   - Cancela `appointment` (se existir) e restaura slot para `available`

## Hooks & Dependencies
- **Triggers**:
  - Seleção de slot no grid
  - Botões do painel rápido (`Agendar`, `Configurar`, `Confirmar Nome`, `Disponibilizar`)
- **Dependencies**:
  - `agendaService` (slots/appointments)
  - `patientStore` (criação/seleção de pacientes)
  - `window.dispatchEvent('timeSlotsUpdated')` para sincronização e recarga leve
- **Side Effects**:
  - Atualização otimista de `booking.patientName`
  - Evita POST 400 criando `appointment` com paciente placeholder

## Considerações de UX
- **Inspiração**: Utilizar o padrão visual "Sem Nome" com ícone de edição conforme imagem fornecida (não modificar os elementos `button` ou `h1` existentes em outros componentes).
- **Validação**: `Confirmar Nome` desabilitado sem nome e sem paciente selecionado.

## Testes a realizar
- Agendar slot disponível sem selecionar paciente → deve criar placeholder e não retornar 400.
- Em slot agendado, confirmar nome digitando e via seleção de paciente → deve atualizar `appointment`.
- `Configurar` em slot agendado → deve alterar `endTime` sem tocar em `patient_id`.
- `Disponibilizar` → deve cancelar `appointment` e limpar `booking`.