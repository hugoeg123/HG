# Reviews Stars – Preenchimento e Escurecimento Progressivo

## Objetivo
Corrigir o comportamento das estrelas no componente de avaliações para que:
- Os botões não tenham fundo quadrado (permanecem transparentes).
- Cada estrela SVG tenha contorno com cor do tema e preenchimento claro antes da seleção.
- Ao selecionar N estrelas, as primeiras N fiquem com preenchimento mais escuro (propagação à esquerda → direita).
- Respeite azul no modo claro e verde/teal no modo escuro (via `--accent`).

## Diagnóstico
- Causa raiz: uma regra global em `frontend/src/overrides.css` forçava `fill: none` em `path` dentro de `.button-exception`:
  ```css
  .button-exception svg path { stroke: currentColor; fill: none; }
  ```
  Isso anulava qualquer tentativa de preencher as estrelas via estilo no `svg`, resultando apenas em contornos.

- Complementar: estilos aplicados no `svg` podem não refletir no `path` quando outra regra define `fill: none` diretamente no `path`.

## Solução Implementada
1. CSS global:
   - Relaxada a regra para não forçar `fill: none` globalmente.
   - Adicionada classe opt‑in `.allow-fill` para permitir preenchimento quando necessário:
     ```css
     .button-exception.allow-fill svg path { fill: inherit !important; }
     ```

2. Componente React:
   - `DoctorReviews.jsx`: aplicar `allow-fill` nos botões das estrelas.
   - Mover estilos de cor para o `path` (garantindo aplicação direta):
     - Não selecionado: `hsl(var(--accent) / 0.40)`
     - Selecionado: `hsl(var(--accent) / 1)`
     - Contorno: `hsl(var(--accent) / 1)`

## Integração Map
- **New/Updated Files**:
  - `frontend/src/overrides.css` → ajusta exceções de botões e opt-in para preenchimento.
  - `frontend/src/pages/Patient/components/DoctorReviews.jsx` → aplica classe e estilos no `path`.
- **Connects To**:
  - `frontend/src/index.css` e `frontend/src/themes.css` para tokens `--accent`/`--accent-rgb` (modo claro/escuro).
- **Data Flow**:
  1. Usuário clica numa estrela (1–5).
  2. Estado `rating` é atualizado; `current >= n` define preenchimento escuro.
  3. Exibição acessível via `role="radiogroup"` e `aria-checked`.

## Hooks & Dependencies
- Triggers: Interação de clique/hover nas estrelas.
- Dependências: tokens de tema (`--accent`) e CSS global de exceções.
- Side Effects: Nenhum impacto em outros ícones, pois `allow-fill` é opt-in.

## Testes/Validação
- Preview modo claro/escuro: verificar propagação 4/5 → quatro primeiras com preenchimento escuro.
- Acessibilidade: `aria-checked` atualizado; foco mantém transparência (sem fundo quadrado).

## Notas
- Mantém arquivos < 200 linhas.
- Evita conflito com estilização global de botões através de opt-in.