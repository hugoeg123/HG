# Bugfix: Disponibilizar cancela marketplace sem confirmação

## Contexto
- Ao clicar em **Disponibilizar** em um slot com origem `patient_marketplace`, a consulta é cancelada e o slot fica disponível antes mesmo do usuário clicar em **OK** ou **Cancelar** na confirmação.
- Isso indica dependência de `window.confirm` com comportamento não bloqueante em ambiente atual.

## Integração Map
- **Novo Arquivo**: `frontend/src/components/ui/ConfirmDialog.jsx`
  - **Conecta** a: `frontend/src/components/WeeklyTimeGrid.jsx` via import
  - **UI**: Usa `components/ui/dialog.tsx` para modal
- **Alterado**: `frontend/src/components/WeeklyTimeGrid.jsx`
  - **Conecta** a: `frontend/src/stores/timeSlotStore.js` → `cancelAppointmentForSlot`
  - **Data Flow**:
    1. Clique em Disponibilizar
    2. Se marketplace → abre `ConfirmDialog` (estado controlado)
    3. Usuário escolhe OK → chama `cancelAppointmentForSlot(slotId, { allowMarketplace: true })`
    4. Usuário escolhe Cancelar/fecha → não faz nada
- **Mantido**: `frontend/src/stores/timeSlotStore.js`
  - Guarda de segurança: exige `allowMarketplace` quando origem `patient_marketplace`

## Hooks & Dependências
- **Triggers**: Clique no botão "Disponibilizar" com slot agendado
- **Dependências**: `Dialog` UI radix (arquivo `components/ui/dialog.tsx`), `Button`
- **Side Effects**: Nenhum side-effect antes da confirmação; somente após OK

## Estratégia de Correção (Robusta)
1. Remover uso de `window.confirm` e adotar **modal controlado** (`ConfirmDialog.jsx`).
2. Salvar `slotId` no momento do clique (estado `confirmSlotId`).
3. Invocar `cancelAppointmentForSlot(confirmSlotId, { allowMarketplace: true })` somente após **OK**.
4. Tratar fechamento por overlay/ESC como **Cancelar** (seguro).
5. Manter guarda no store para evitar chamadas indevidas.

## Testes Manuais
- Marketplace:
  - Clicar Disponibilizar → modal abre; **Cancelar** → slot permanece booked; nenhuma notificação.
  - **OK** → slot vira available e paciente notificado pelo backend.
- Não-marketplace:
  - Clicar Disponibilizar → slot vira available sem modal.

## Conformidade
- Documentação de conectores e hooks incluída.
- Mudança minimal e modular; não altera fluxos não relacionados.