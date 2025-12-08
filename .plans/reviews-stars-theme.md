# Plano: Ajustes nas Estrelas e Bordas das Avaliações

## Objetivo
- Tornar as estrelas do input inicialmente vazias e, ao selecionar, aplicar a cor de acento do tema.
- Alterar estrelas exibidas em `<span>` para usar `text-accent` (verde no dark, azul no bright).
- Suavizar contornos de `div`, `li` e `textarea` na área de avaliações com tom esverdeado no dark, mantendo bright ok.

## Contexto & Arquitetura
- Tema central usa tokens em `frontend/src/themes.css` e `frontend/src/index.css`.
- Tailwind configura `colors.accent` em `frontend/tailwind.config.js` (consome `--accent`).
- Overrides de borda sutil (tinta do acento) existem em `frontend/src/overrides.css` via classe utilitária `theme-border`.

## Integração Map
- **Arquivo**: `frontend/src/pages/Patient/components/DoctorReviews.jsx`
  - **Conecta a**:
    - `services/marketplaceService.js` para buscar/criar avaliações.
    - `tailwind.config.js` (`colors.accent`) e `themes.css` (`--accent`) para cor temática.
    - `overrides.css` utilitário `theme-border` para bordas sutis.
  - **Data Flow**:
    1. Monta componente → busca reviews públicos.
    2. Interação de estrelas (radiogroup) → atualiza `rating`.
    3. Envio do formulário → cria review e atualiza lista.

## Hooks & Dependências
- **Triggers**: Interação do usuário nas estrelas (hover/click) e envio do formulário.
- **Dependências**: Tokens de tema `--accent`, classes Tailwind `text-accent`, `border-theme-border`, utilitário `theme-border`.
- **Side Effects**: Nenhum efeito colateral fora do componente; somente impacto visual.

## Plano de Implementação (MVP)
1. Substituir `text-yellow-500` por `text-accent` em todas as estrelas (`Stars`, spans da lista, hover do input).
2. Tornar o `RatingInput` acessível com estrelas vazias por padrão:
   - Alterar `useState(5)` → `useState(0)`.
   - Renderizar `★` quando selecionado/hover e `☆` quando vazio.
   - Aplicar `text-accent` para selecionados; `text-muted-foreground` para vazios.
3. Suavizar bordas:
   - Trocar `border-theme-muted` por `border-theme-border theme-border` em `li` e `textarea`.
   - Adicionar `theme-border` ao card de média.

## Riscos & Mitigações
- **Risco**: classes não mapeadas (`border-theme-muted`).
  - **Mitigação**: usar `border-theme-border` + `theme-border` já suportadas pelo sistema.
- **Risco**: amarelo persistente em dark.
  - **Mitigação**: `text-accent` usa `--accent` (teal/verde no dark), substitui o amarelo.
- **Risco**: acessibilidade do radiogroup.
  - **Mitigação**: manter `role="radiogroup"`, `role="radio"`, `aria-checked` e foco em botão.

## Verificação
- Validar visual no modo dark e bright: estrelas vazias inicialmente; seleção em verde (dark) / azul (bright).
- Confirmar bordas discretas com leve tom do acento (utilitário `theme-border`).
- Testar envio de avaliação e atualização da lista.

## Critérios de Aceite
- Estrelas do input iniciam vazias (0/5) e mudam para cor de acento ao selecionar.
- Spans de estrelas aparecem na cor temática (verde no dark).
- Bordas de `div/li/textarea` ficam sutis e esverdeadas no dark, sem alterar bright.