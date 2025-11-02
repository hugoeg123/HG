# Ajuste de cores da agenda no modo dark

## Objetivo
- Reduzir a quantidade de tons de verde no grid da agenda em modo dark.
- Melhor traduzir o mapeamento do modo bright (azuis) para o dark, usando um único tom de accent no dark e neutros para o fundo.

## Estado atual (resumo)
- Vários tons `emerald`/`green` são usados no dark (ex.: `#16A34A`, `ring-green-400`, `emerald-500/600`, `emerald-900/100`).
- O bright usa majoritariamente azuis (`#2563EB`, `ring-blue-400`).
- O `WeeklyTimeGrid.jsx` referencia variáveis `--color-header-col-even-dark/odd-dark` que não estão definidas em CSS.

## Proposta de mudança
1. **Tokens/variáveis de tema (index.css)**
   - Definir variáveis para cabeçalhos do grid no dark:
     - `--color-header-col-even-dark`: cinza neutro para colunas pares.
     - `--color-header-col-odd-dark`: cinza neutro para colunas ímpares.
     - `--color-header-col-center-dark`: accent com transparência para destacar o dia central.
     - `--grid-ring-color-dark`: cor do "ring" baseada em `--accent`.
   - Adicionar utilitário `.ring-theme-accent` para usar o accent como cor de ring via Tailwind.

2. **WeeklyTimeGrid.jsx**
   - Trocar o destaque do dia central de `#16A34A` para `hsl(var(--accent) / 0.22)`.
   - Trocar `ring-green-400` por `ring-theme-accent`.
   - Manter cinzas neutros para alternância par/ímpar via variáveis.

3. **agenda-styles.css**
   - Unificar `emerald` → `teal` ou variável accent.
   - Usar `--accent` para ring e fundo selecionado com transparência.
   - Reduzir a paleta a dois usos principais: fundo neutro + único accent.

## Integração Map
- **Novos tokens**: `frontend/src/index.css`
  - Conecta com `WeeklyTimeGrid.jsx` via uso de `var(--color-header-col-*-dark)` e `.ring-theme-accent`.
  - Conecta com `frontend/src/styles/agenda-styles.css` para seleção de dias e barras.
- **Componente**: `frontend/src/components/WeeklyTimeGrid.jsx`
  - Usa as variáveis e utilitário para estilização do cabeçalho da grade.

## Hooks & Dependências
- **Triggers**: Alternância de tema (classes `dark-mode`/`light-mode`).
- **Dependências**: `index.css`, `agenda-styles.css`, `WeeklyTimeGrid.jsx`.
- **Side Effects**: Aparência do grid mais consistente; menos tons de verde distintos no dark.

## MVP & Validação
- Aplicar mudanças mínimas necessárias nos três arquivos.
- Abrir preview e validar visualmente:
  - Destaque do dia central no dark usa um único accent.
  - Colunas pares/ímpares no dark usam cinzas neutros.
  - Seleção de dia e barras (scheduled/available) no dark usam `teal` (ou accent) em vez de múltiplos `emerald`.

## Próximos passos (se necessário)
- Mapear usos residuais de `emerald-*` fora da agenda e considerar migração para accent.
- Ajustar contraste AA/AAA se necessário.