# Plano: Agenda do Paciente

Status: MVP para exibição de consultas e eventos pessoais

## Objetivo
Criar uma Agenda do Paciente semelhante à agenda do profissional, reutilizando o calendário mensal com contadores e estilos existentes. A agenda deve mostrar as consultas agendadas do paciente autenticado e abrir espaço para exibir outros eventos no futuro.

## Escopo
- Aba “Agenda” no `pages/Patient/Profile.jsx` passa a renderizar a nova `PatientAgenda`.
- Calendário mensal com contadores (total de compromissos por dia).
- Lista de itens do dia selecionado (consultas e eventos).
- Navegação de mês e seleção de dia.
- Reuso de estilos (`agenda-styles.css`) e padrões de UI atuais.

## Integração Map
- **Novo Arquivo**: `src/pages/Patient/components/PatientAgenda.jsx`
- **Conecta com**:
  - `src/services/agendaService.js` via `getMyAppointments({start, end})` para carregar agendamentos do paciente
  - `src/components/ui/*` (Card, Button) para UI
  - `src/agenda-styles.css` para estilos do calendário mensal
  - `src/pages/Patient/Profile.jsx` (aba `agenda`) para renderização
- **Dados**:
  1. Aba “Agenda” (Profile.jsx) → `PatientAgenda`
  2. `PatientAgenda` chama `agendaService.getMyAppointments` para o mês atual
  3. Agrupa por dia e mostra contadores no calendário
  4. Clique no dia → lista de compromissos desse dia
  5. Futuro: outras fontes de “eventos” poderão ser adicionadas ao mapa de dia

## Hooks & Dependências
- **Triggers**:
  - Montagem do componente: busca agendamentos do mês visível
  - Alteração de mês: refaz consulta com novo intervalo
  - Seleção de dia: atualiza a lista detalhada ao lado/abaixo
- **Dependências**:
  - `agendaService.getMyAppointments` (backend `/api/agenda/my-appointments`)
  - `useAuthStore` indiretamente (interceptors de `api.js` cuidam do token)
  - Estilos globais e `agenda-styles.css`
- **Side Effects**:
  - Nenhum efeito global; somente estado local

## Requisitos de Estilo e Arquitetura
- Manter arquivo < 200 linhas
- Documentar com JSDoc e “Connector/Hook”
- Reutilizar classes `.calendar-day`, `.calendar-bars`, `.bar-scheduled`
- Respeitar tema claro/escuro conforme tokens existentes

## MVP Passos
1. Criar `PatientAgenda.jsx` com calendário mensal e contadores por dia
2. Integrar no `TabsContent value="agenda"` de `Profile.jsx`
3. Buscar dados do mês via `agendaService.getMyAppointments`
4. Exibir lista do dia selecionado com horário, título e profissional
5. Ajustar estilos e acessibilidade (aria-labels básicos)
6. Documentação (JSDoc conectores)

## Próximas Iterações (fora do MVP)
- Eventos adicionais: exames, lembretes de medicação, tarefas de saúde
- Filtros de período e status
- Ações rápidas: reagendar/cancelar direto da agenda
- Integração com histórico (TagDefinition/FHIR)