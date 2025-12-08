# Plano: Agenda do Paciente

## Objetivo
Criar uma agenda mensal do paciente (em botões) que liste suas consultas agendadas e futuros eventos, inspirada na Agenda do Profissional e alinhada com estilos existentes.

## Escopo
- Componente React `PatientAgenda` com calendário mensal e lista diária.
- Integração com `agendaService.getMyAppointments` para filtrar por mês.
- Integração na aba "agenda" de `pages/Patient/Profile.jsx`.
- Reuso de estilos: `agenda-styles.css` (classes `.calendar-day`, `.calendar-bars`, etc.).
- Adaptação para tema claro/escuro via tokens (`bg-theme-card`, `border-theme-border`).

## Integration Map
- New File: `frontend/src/pages/Patient/components/PatientAgenda.jsx`
- Connects To:
  - `frontend/src/services/agendaService.js` via `getMyAppointments({ status, start, end })`
  - `frontend/src/pages/Patient/Profile.jsx` (aba "agenda")
  - `frontend/src/src/agenda-styles.css` (estilos do calendário)
- Data Flow:
  1. Usuário abre `/patient/profile?tab=agenda`.
  2. `PatientAgenda` calcula intervalo `[start, end)` do mês visível.
  3. Chama `agendaService.getMyAppointments` e agrupa por dia.
  4. Renderiza contadores por dia; clique no dia preenche lista diária.

## Hooks & Dependencies
- Triggers: Mudança de mês; clique no dia.
- Dependencies: Autenticação paciente; endpoint `/agenda/my-appointments` com filtros `start/end/status`.
- Side Effects: Navegação para marketplace via botão "Detalhes" (placeholder).

## Estilos e UI
- Reusar classes: `.calendar-day`, `.in-month`, `.out-month`, `.is-selected`, `.is-today`, `.calendar-bars`, `.bar-scheduled`.
- Títulos e controles com `Card`, `Button`, ícones `lucide-react` (`CalendarDays`, `ChevronLeft`, `ChevronRight`).

## MVP
1. Renderizar grade mensal com 42 células (6x7), dias fora do mês.
2. Carregar agendamentos do paciente para mês atual; agrupar por `YYYY-MM-DD`.
3. Contador simples por dia com barra `bar-scheduled`.
4. Lista de compromissos do dia selecionado (título, hora, médico).
5. Integrar na aba "agenda" do `Profile.jsx`.

## Iterações Futuras
- Eventos não-médicos (vacinas, exames, lembretes de medicamentos).
- Ações rápidas no dia: reagendar/cancelar.
- Filtros por status (booked, completed, canceled).
- Integração com FHIR para exportação de eventos.

## Compliance & Documentação
- Conectores documentados no componente (`JSDoc`).
- Evitar arquivos > 200 linhas (componente mantém ~190 linhas).
- Seguir tokens de tema; sem estilos inline.