# Agenda do Médico — Interface do Paciente

Objetivo: permitir ao paciente visualizar horários disponíveis de um médico específico e realizar o agendamento diretamente pela interface do paciente.

## Integração Map
- **Nova Página**: `frontend/src/pages/Patient/AgendaPacienteMedico.jsx`
- **Rotas**: `App.jsx` → `/patient/doctor/:id/agenda`
- **Serviços**:
  - `frontend/src/services/marketplaceService.js` → `getAvailableSlots({ medico_id, start, end, modality })`
  - `frontend/src/services/agendaService.js` → `createAppointment({ slot_id, patient_id, notes })`
- **Componentes de UI**: `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/input.tsx`
- **Stores**: `store/authStore.js` (capturar `user.id` do paciente)

## Data Flow
1. Paciente navega pelo Marketplace e abre `/patient/doctor/:id`.
2. Clique em “Ver horários” leva a `/patient/doctor/:id/agenda`.
3. Página chama `getAvailableSlots` com `medico_id` e janela de tempo (hoje → +30 dias).
4. Slots são exibidos em grid por dia; cada slot tem ação “Agendar”.
5. Ao clicar, chama `createAppointment` com `{ slot_id, patient_id: auth.user.id }`.
6. Em caso de sucesso, slot é marcado como agendado localmente e feedback é mostrado.

## Hooks & Dependencies
- **Triggers**: Navegação via botão no `DoctorPublicProfile.jsx`.
- **Dependencies**:
  - Autenticação de paciente (`authStore.js`) para obter `user.id` e header `Authorization`.
  - Backend endpoints `/marketplace/slots` (público) e `/agenda/appointments` (autenticado paciente).
  - Tema semântico (`tailwind.config.js` + `button.tsx` variação `primary`).
- **Side Effects**:
  - Criação de agendamento no backend modifica estado do slot; página atualiza UI local.

## Planejamento (MVP)
- Adicionar rota em `App.jsx` para `/patient/doctor/:id/agenda` dentro do bloco protegido do paciente.
- Criar `AgendaPacienteMedico.jsx` com:
  - Header com nome do médico (quando disponível) e filtros simples de data.
  - Grid semanal/diária simplificada mostrando `start_time → end_time`.
  - Botão “Agendar” por slot (usa `primary` para respeitar cor do tema).
  - Mensagens de sucesso/erro e estados de carregamento.
- Ajustar `DoctorPublicProfile.jsx` botão “Ver horários” para navegar à nova rota.
- Substituir select de nota por estrelas acessíveis em `DoctorReviews.jsx`.
- Documentar conectores e hooks em novos/alterados arquivos.

## Janela de Consulta
- Padrão: `start = hoje 00:00`, `end = hoje + 30 dias`.
- Filtro opcional por modalidade (telemedicina, presencial) — MVP pode omitir.

## Erros e Tratamento
- Sem paciente autenticado → exibir aviso e link para login.
- Falha em `createAppointment` → mostrar mensagem clara; não alterar UI local.
- Empty slots → mensagem “Nenhum horário disponível neste período”.

## Critérios de Qualidade
- Arquivos < 200 linhas e com comentários de integração (“Connector/Hook”).
- Navegação consistente com layout do paciente (sidebars/topnav).
- Uso de cor do tema no botão de ação.
- Integração com serviços existentes; nenhuma duplicação de lógica da agenda do médico.

## Testes (leve)
- Verificar que a rota abre para paciente logado.
- Mockar resposta de `getAvailableSlots` e agendar um slot; checar feedback na UI.

---

Última atualização: planejado para implementação imediata (MVP).