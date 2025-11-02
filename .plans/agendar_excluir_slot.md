## Objetivo
- Permitir configurar um slot em aberto, agendar o horário selecionado (trocando o rótulo "Disponibilizar" por um botão "Agendar") e adicionar a possibilidade de excluir o slot selecionado.

## Integração Map
- **Novo/Alterado**: `frontend/src/stores/timeSlotStore.js`
  - **Conecta a**: `frontend/src/services/agendaService.js` via `deleteSlot(id)` e `updateSlot(id, data)`
  - **Fluxo**: UI aciona store → store chama service → backend atualiza/deleta → store sincroniza estado local
- **Alterado**: `frontend/src/components/WeeklyTimeGrid.jsx`
  - **Conecta a**: `timeSlotStore` para `updateSlotInBackend(slotId, { status: 'booked' })` e `deleteSlotInBackend(slotId)`
  - **Fluxo**: Seleção de slot → painel rápido mostra ações → clique em "Agendar" atualiza status; clique em "Excluir" remove slot.
- **Backend (existente)**: `backend/src/controllers/agenda.controller.js`
  - **Conecta a**: endpoints `/agenda/slots/:id` (PUT/DELETE) já implementados

## Hooks & Dependências
- **Triggers**:
  - Clique no botão "Agendar" no painel rápido quando houver slot selecionado
  - Clique no botão "Excluir" no painel rápido quando houver slot selecionado
- **Dependências**:
  - `agendaService.updateSlot(id, data)` para alteração de status
  - `agendaService.deleteSlot(id)` para remoção
  - Estado global de `timeSlotStore` (lista de slots e seleção)
- **Side Effects**:
  - Dispara evento `timeSlotsUpdated` com `action: 'update' | 'delete'` para sincronização bidirecional
  - Atualiza `localStorage` via `saveToLocalStorage`

## MVP
- Botão "Agendar": atualizar slot selecionado para `status: 'booked'`
- Botão "Excluir": remover slot selecionado (tratamento de erro se backend negar)
- Manter inputs de configuração (duração/intervalo) visíveis e centrados

## Testes & Validação
- Selecionar um slot "available" e clicar em "Agendar" → status muda para "booked" sem erro 409
- Selecionar um slot e clicar em "Excluir" → slot removido da grade; se backend negar (ex.: conflito), exibir mensagem simples
- Verificar alinhamento horizontal do painel e botões

## Observações de Conformidade
- Arquitetura: alterações cirúrgicas, sem ampliar arquivos significativamente
- Documentação: este plano cobre o mapa de integração e hooks, evitando comentários inline
- Segurança: sem uso de `eval`; operações via services com interceptors