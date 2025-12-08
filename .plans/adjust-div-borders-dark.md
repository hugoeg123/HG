# Bordas discretas e esverdeadas (modo dark)

Objetivo: tornar o contorno dos principais `div` (cards/painéis) mais discreto e com leve tom esverdeado (teal) no modo dark, sem afetar o modo claro e sem alterar componentes React.

## Estado atual
- Tokens de tema já definidos em `frontend/src/index.css` (`--accent`, `--accent-rgb`, `--theme-border`).
- Utilitário `.theme-border` em `frontend/src/overrides.css` já aplica bordas com `accent` em alguns lugares (ex.: `components/ui/card.tsx`).
- Muitas estruturas no app usam `div.rounded-lg.border.bg-card` (padrão shadcn/ui), sem `theme-border` explícito.

## Plano
1. Adicionar regra de baixo impacto em `frontend/src/overrides.css` para `.dark-mode .bg-card.border` e `.dark-mode .rounded-lg.border` com `border-color: rgb(var(--accent-rgb) / 0.22)`. 
2. Manter o modo claro inalterado (sem alteração de `border-color`).
3. Evitar mudanças em variáveis globais (`--theme-border`) para não impactar inputs, listas e mensagens.
4. Validar visualmente em páginas com múltiplos cards: Resumo, Agenda, Informações de Saúde, Editar Perfil, Histórico.

## Integração Map
- **Novo ajuste**: `frontend/src/overrides.css` (regras `.dark-mode .bg-card.border`, `.dark-mode .rounded-lg.border`).
- **Conecta a**:
  - `frontend/src/components/ui/card.tsx`: complementa `.theme-border` para casos fora do componente.
  - Páginas que usam shadcn tokens (`bg-card`, `text-card-foreground`) sem utilitários adicionais.
- **Fluxo de dados**: não há JS; CSS consome `--accent-rgb` e aplica alpha.

## Hooks & Dependências
- **Triggers**: Quando `html`/`body` possuem `.dark-mode` (já implementado em App.jsx), as novas regras entram em vigor.
- **Dependências**: `--accent-rgb` definido em `index.css/themes.css` (teal no dark), Tailwind utilitário `border` para largura.
- **Side Effects**: Bordas de `div` com `border` tornam-se levemente teal; inputs e componentes com classes específicas de borda (`border-gray-700/30`, `border-theme-border`) continuam inalterados.

## Critérios de aceitação
- Em dark: bordas dos cards ficam discretas (1px), com leve tom teal e menos saturação que conteúdo.
- Em bright: visual permanece idêntico ao atual.
- Sem regressões em foco/hover; foco continua usando `focus-visible:ring-accent/50` quando aplicável.

## Testes/Validação
- Abrir preview e verificar cartões: Resumo, Agenda, Informações de Saúde, Editar Perfil, Histórico.
- Verificar contraste com fundo (`bg-theme-card`) e legibilidade dos títulos.
- Checar que componentes com utilitários específicos (inputs, alerts, calculadoras) permanecem com suas bordas próprias.

## Riscos e mitigação
- Risco: regra muito ampla atingir elementos não desejados. Mitigação: escopo `bg-card.border` e `rounded-lg.border` apenas em `.dark-mode`.
- Risco: conflito de especificidade. Mitigação: usar `!important` apenas para `border-color` nessas regras.

## Próximos passos (opcional)
- Caso necessário, ajustar o alpha (`0.18–0.24`) para adequar ao nível de sutileza.
- Introduzir utilitário `.soft-border` para uso pontual onde o escopo automático não atinja.