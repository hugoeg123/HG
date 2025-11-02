# Plano: Alinhar fundos no modo dark com a navbar

Objetivo: Corrigir conflitos de escopo e duplicidade de estilos de fundo em modo dark. Os `div` relevantes devem usar o mesmo fundo da top navbar (classe `bg-theme-background`) na coluna central e nas colunas laterais.

Escopo:
- Remover estilos inline de fundo que causam duplicidade/conflito.
- Desativar o utilitário `themeFill` apenas no modo dark para evitar preenchimentos derivados.
- Padronizar `MarkingModeConfig` para usar `bg-theme-background` em seus blocos informativos no modo dark.

Implementação:
- `frontend/src/utils/themeFill.js`: Adicionar suporte a `data-fill-disable-in-dark` e limpar estilos caso ativo.
- `frontend/src/components/Layout/MainLayout.jsx`: Trocar `data-fill-disable-in-light` por `data-fill-disable-in-dark="true"` no contêiner principal.
- `frontend/src/components/MarkingModeConfig.jsx`: Remover `style` inline de fundo em modo dark e aplicar classe `bg-theme-background` com `border-theme-border` e texto neutro.

Validação:
- Build dev e abrir preview (`http://localhost:3000/`).
- Alternar para modo dark e verificar que os `div` alvo possuem `bg-theme-background` sem sobrescrita inline.
- Conferir que não há mais duplicidade de fundo nem variações indesejadas.

## Integration Map
- **New/Updated Files**:
  - `frontend/src/utils/themeFill.js`
  - `frontend/src/components/Layout/MainLayout.jsx`
  - `frontend/src/components/MarkingModeConfig.jsx`
- **Connects To**:
  - `MainLayout.jsx` → `utils/themeFill.js` via atributos `data-fill-*`
  - `Navbar.jsx` fornece referência visual de `bg-theme-background`
- **Data Flow**:
  1. Navbar define o fundo padrão via tokens de tema
  2. MainLayout desativa preenchimentos derivados em dark
  3. MarkingModeConfig usa `bg-theme-background` no bloco descritivo
  4. UI reflete fundo uniforme nas colunas

## Hooks & Dependencies
- **Triggers**: Toggle de tema, renderização de MarkingModeConfig
- **Dependencies**: Variáveis de tema (`--theme-background`), classes `bg-theme-background`
- **Side Effects**: Remoção de inline styles evita conflitos com utilitários Tailwind