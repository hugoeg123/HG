# Agenda Profissional — Integração e Estilos

Este documento descreve a arquitetura, integrações e estilos da Agenda Profissional do Health Guardian, incluindo o calendário mensal com contadores e a grade semanal com slots de disponibilidade e agendamentos.

## Componentes e Arquivos
- `src/pages/Agenda.jsx`: Página da Agenda (calendário mensal + controles + grid semanal)
- `src/components/WeeklyTimeGrid.jsx`: Grade semanal com overlay de slots
- `src/components/TimeSlotConfig.jsx`: Configuração de criação de faixas e slots
- `src/components/TimeGridControls.jsx`: Controles de modo e ações rápidas
- `src/themes.css`: Tokens de tema (dark/light), incluindo `--accent` e cores de slots
- `src/agenda-styles.css`: Estilos do calendário mensal e contadores centrados
- `src/slot-styles.css`: Estilos dos slots (available/booked/blocked/selected)
- `src/index.css`: Importa `themes.css`, `agenda-styles.css` e `slot-styles.css` (ordem estrita)

## Integração Map
- Conecta com `src/stores/timeSlotStore.js` para estado de slots, criação, atualização e remoção
- Conecta com `src/store/themeStore.js` para alternância de tema e tokens de cor
- Usa `src/services/api.js` para operações com backend de agenda
- Página `Agenda.jsx` integra `WeeklyTimeGrid`, `TimeSlotConfig` e `TimeGridControls`
- Estilos aplicados via classes utilitárias e camadas Tailwind `@layer components`

## Fluxo de Dados
1. Usuário navega para `/agenda` e seleciona dia/semana
2. `TimeSlotStore` carrega slots da semana e mantém estado local
3. `WeeklyTimeGrid` renderiza slots como overlay por dia (7 colunas)
4. Ações na UI (criar, agendar, confirmar nome, disponibilizar) atualizam estado e chamam API
5. Calendário mensal exibe contadores centrados por dia:
   - `bar-scheduled`: quantidade de agendados
   - `bar-available`: quantidade de livres

## Estilos e Temas
- `themes.css` define tokens HSL e RGB para `--accent` (teal no dark, blue no light)
- `agenda-styles.css`:
  - `.calendar-day` com altura fixa e borda temática
  - `.day-number` grande no canto superior direito
  - `.calendar-bars` ocupa metade inferior do card do dia
  - `.bar-scheduled` e `.bar-available` com cores dependentes do tema
- `slot-styles.css`:
  - `.slot-booked` (teal-900 no dark, blue-900 no light)
  - `.slot-available` (teal-100 no dark, blue-200 no light)
  - `.slot-blocked` (cinzas)
  - `.slot-selected` adiciona `ring` temático

### Ordem de Importação CSS (Obrigatória)
Em `src/index.css`, as declarações `@import` devem vir antes de qualquer outra declaração e antes das diretivas do Tailwind:

```css
/* index.css */
@import './themes.css';
@import './slot-styles.css';
@import './agenda-styles.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

Essa ordem evita erros de PostCSS/Vite e garante que as camadas `@layer components` funcionem corretamente.

## Hooks & Dependências
- Trigger: Navegação para `/agenda` ou mudança de semana/dia
- Dependências: `Zustand`, `Tailwind`, `date-fns`, API de backend
- Efeitos Colaterais: Atualização de slots, renderização de overlay, contadores no calendário

## Validação Visual
- Mensal: Cada dia mostra contadores centralizados (agendados e livres)
- Semanal: Overlay exibe slots com cores temáticas, seleção com `ring`
- Dark/Light: Cores adaptativas via tokens `--accent` e utilitários `theme-*`

## Troubleshooting
- Se os contadores/barras não aparecerem coloridos, verifique:
  - Ordem de `@import` em `index.css`
  - Presença das classes `.dark-mode` ou `.light-mode` no `html`/`body` (controladas por `themeStore` via `App.jsx`)
  - Que `agenda-styles.css` e `slot-styles.css` estão incluídos via `index.css`
  - Cache do dev server (`npm run dev`) reiniciado após mudanças de CSS

### Logs & Solução (4 logs)
- `net::ERR_CONNECTION_REFUSED` ao chamar `http://localhost:5001/api/auth/patient/login`:
  - Causa: backend não iniciado.
  - Solução: iniciar na pasta `backend` com `npm run dev` (porta `5001`).
  - Validação: logs exibem `🚀 Servidor rodando na porta 5001` e `🔗 API: http://localhost:5001/api`.
- Erros de CORS:
  - Causa: origens não incluídas.
  - Solução: `backend/src/app.js` define `allowedOrigins` incluindo `http://localhost:5173`.
- Falta de estilos (barras cinzas/sem cor):
  - Causa: ordem incorreta de `@import` ou ausência das classes `.dark-mode/.light-mode`.
  - Solução: garantir ordem em `index.css` e aplicação das classes via `App.jsx`/`themeStore`.
- Cache do dev server não refletindo mudanças:
  - Solução: reiniciar Vite com `npm run dev -- --strictPort --port 5173`.

## Testes
- `src/components/__tests__/agenda.test.js` valida renderização básica dos componentes
- Recomenda-se testes de integração para `TimeSlotStore` com mocks da API

## Conformidade com Padrões do Projeto
- Arquivos de estilo mantidos sob 200 linhas
- Documentação de conexões e hooks incluída
- Uso de prompts estruturados e tokens de tema seguros

## Integration Hooks
- `src/pages/Agenda.jsx` → usa `services/api.js` para backend
- `backend/src/app.js` ← expõe `/api/*` e Socket.io, CORS para `http://localhost:5173`
- `alerts/services/rules.py` (futuro) ← poderá ser acionado por sinais de agenda