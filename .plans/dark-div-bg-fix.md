# Plano: Correção de fundos indesejados no modo dark (agenda)

## Objetivo
Substituir fundos esverdeados indesejados em elementos do modo dark pela cor de fundo da coluna central da página da agenda, garantindo consistência visual com o grid central.

## Escopo
- Componente: `frontend/src/components/MarkingModeConfig.jsx`
- Alvo: caixas informativas (divs) que exibem fundo esverdeado/azulado no modo dark.

## Integração
### Integration Map
- **Arquivo**: `frontend/src/components/MarkingModeConfig.jsx`
- **Conecta com**:
  - `frontend/src/index.css` via tokens `--color-header-col-center-dark` (coluna central da agenda)
  - `frontend/src/components/WeeklyTimeGrid.jsx` que já usa os mesmos tokens no grid
- **Fluxo de Dados**:
  1. Usuário alterna modo de marcação
  2. UI exibe descrição em um `div`
  3. No modo dark, o fundo deste `div` usará `var(--color-header-col-center-dark)`

## Hooks & Dependencies
- **Triggers**: render do `MarkingModeConfig` quando `markingMode`/`isDarkModeUI` mudam
- **Dependências**: token CSS `--color-header-col-center-dark` definido em `index.css`
- **Side Effects**: unificação do esquema de cores, removendo fundos verdes no dark

## Passos
1. Ajustar o `div` de descrição no `MarkingModeConfig` para usar `backgroundColor: var(--color-header-col-center-dark)` quando `isDarkModeUI` for true.
2. Manter bordas e textos com classes neutras (`border-theme-border`, `text-gray-200`).
3. Validar em preview no navegador.

## Testes
- Verificar no modo dark que os dois estados de descrição (Disponibilizar/Agendar) renderizam com fundo igual ao da coluna central do grid.
- Validar contraste de texto e legibilidade.