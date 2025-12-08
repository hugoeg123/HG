# Plano de Restauração — Agenda Profissional (Frontend)

Sintomas observados
- Perda de formatação nos cards do calendário mensal (`.calendar-day`).
- Desaparecimento das cores dos contadores ("agendados" / "livres").
- Slots coloridos da grade semanal (WeeklyTimeGrid) não aparecem.

Hipótese e causa raiz
- O servidor de desenvolvimento reporta erro de CSS: "@import must precede all other statements" em `frontend/src/index.css`.
- Consequência: `themes.css`, `slot-styles.css` e `agenda-styles.css` não são processados, quebrando o tema e as classes utilitárias usadas na Agenda.

## Integração Map
- **Arquivo alvo**: `frontend/src/index.css`
- **Conecta-se a**:
  - `frontend/src/themes.css` — tokens de tema (accent, ring, variáveis semânticas).
  - `frontend/src/slot-styles.css` — classes utilitárias dos slots (`.slot-*`).
  - `frontend/src/agenda-styles.css` — classes dos cards ( `.calendar-day`, `.day-number`, `.bar-*`).
  - `frontend/src/pages/Agenda.jsx` — utiliza `.calendar-day`, `.bar-scheduled`, `.bar-available`.
  - `frontend/src/components/WeeklyTimeGrid.jsx` — utiliza classes e variáveis de tema.

## Fluxo de Dados
1. Usuário acessa Agenda → `Agenda.jsx` renderiza calendário mensal e grade semanal.
2. Estilos são aplicados via classes utilitárias definidas em `agenda-styles.css` e `slot-styles.css`.
3. Variáveis de tema (`themes.css` e `index.css`) controlam cores para dark/light.
4. Se `@import` falha, o CSS não carrega e toda a identidade visual se perde.

## Hooks & Dependências
- **Triggers**: Build de CSS (Vite/PostCSS) ao iniciar `npm run dev`.
- **Dependências**: Tailwind (`@tailwind base/components/utilities`), variáveis do tema em `index.css`, tokens em `themes.css`.
- **Side Effects**: Restauração visual completa dos cards e slots; não altera lógica de estado ou APIs.

## Plano de Ação (Stage-by-Stage)
1. Verificar servidores e abrir previews em `http://localhost:5173` e `http://localhost:5177`.
2. Confirmar erro de ordem de `@import` no terminal do frontend.
3. Corrigir `frontend/src/index.css`: mover `@import './themes.css';`, `@import './slot-styles.css';`, `@import './agenda-styles.css';` para o topo do arquivo, antes de qualquer outra instrução.
4. Recarregar o servidor (auto-reload do Vite) e validar visual:
   - Cards do mês com barras "agendados" e "livres" coloridas.
   - Destaque de `is-selected` e `is-today`.
   - WeeklyTimeGrid exibindo slots com cores de disponibilidade/agendados.
5. Coerência e regressão: conferir globs do Tailwind e ThemeProvider ativos na rota.
6. Documentar integração e manter mudanças mínimas.

## Critérios de Aceite
- Erro de CSS desaparece do terminal.
- Agenda profissional volta a exibir barras coloridas e slots na grade semanal.
- Tema dark/bright permanece consistente (sem `bg-white`/bordas brancas soltas).

## Notas de Compliance
- Arquivos mantidos < 200 linhas (sem alterações estruturais grandes).
- Documentado com "Connector/Hook" nos arquivos de estilo.
- Impacto mínimo, sem novas restrições futuras.