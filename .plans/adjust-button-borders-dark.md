# Ajuste de contornos de buttons no modo dark

Objetivo: Remover contornos com cor do tema dos `button` no dark e manter bordas transparentes, preservando bordas sutis apenas em cards.

## Plano
- Limitar a regra de borda sutil no dark a `.bg-card.border`.
- Adicionar exceção para `button.rounded-lg.border` no dark (exceto `.btn-outline`), forçando `border-color: transparent`.
- Validar visualmente os três botões (menu do usuário, alternar sidebar direita/esquerda) e páginas principais.

## Integração Map
- **Novo/Alterado**: `frontend/src/overrides.css`
- **Conecta-se a**:
  - Contêineres de cards (`.bg-card.border`) em telas de dashboard/perfil/reviews
  - Botões de toolbar e navegação (header/sidebars), classes `button.rounded-lg.border`
- **Fluxo de Dados**:
  1. UI renderiza buttons/cards com classes utilitárias
  2. CSS override aplica cor de borda apenas em cards no dark
  3. Exceção mantém bordas de buttons transparentes

## Hooks & Dependências
- **Triggers**: Tema dark habilitado (`.dark-mode` aplicado na raiz)
- **Dependências**: Variável `--accent-rgb` para tonalidade teal em cards
- **Efeitos colaterais**: Nenhum impacto em `btn-outline` by design; inputs/focus rings não alterados

## QA
- Verificar header e sidebars: bordas dos três buttons devem estar transparentes
- Cards/painéis: bordas discretas teal persistem apenas em `.bg-card.border`