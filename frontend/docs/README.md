# Guia de Estilização e Tema do Frontend

## 1. Visão Geral

Este documento serve como a referência definitiva para a estilização e o sistema de temas do projeto. O objetivo é garantir consistência visual, facilitar a manutenção e acelerar o desenvolvimento de novos componentes.

A arquitetura de estilização é baseada em **Tailwind CSS** com um sistema de temas customizado que suporta os modos **claro (light)** e **escuro (dark)**.

**Conector:** A configuração do Tailwind está em `tailwind.config.js` e os arquivos CSS principais estão em `frontend/src`.

## 2. Arquitetura de Estilização

A estilização é gerenciada por três arquivos CSS principais, carregados em `main.jsx`:

1.  **`index.css`**: Contém a base do Tailwind, variáveis de tema e estilos globais. É o arquivo mais extenso e complexo.
2.  **`themes.css`**: Define os *tokens* de acento (`--accent`) para os modos claro e escuro, usados principalmente pelo sistema de componentes `shadcn/ui`.
3.  **`overrides.css`**: Contém *overrides* de alta especificidade para normalizar estilos (ex: substituir amarelos por cores de acento do tema) e aplicar `focus` sutis.

**Gancho de Integração:** Para garantir a precedência correta, os arquivos são importados na seguinte ordem em `main.jsx`: `index.css`, `overrides.css`.

## 3. Sistema de Temas (Light/Dark Mode)

O controle do tema é feito através da classe `.light-mode` ou `.dark-mode` no elemento `<body>`.

### 3.1. Variáveis de Cor Semânticas

O núcleo do sistema de temas são as variáveis CSS semânticas definidas em `index.css`. Elas são a **única fonte de verdade** para as cores da aplicação.

**Dark Mode (Padrão):**
```css
:root, .dark-mode {
  --color-bg-dark: #1C1C1C;       /* Fundo principal (quase preto) */
  --color-bg-light: #2A2A2A;      /* Superfícies e cartões (cinza escuro) */
  --color-border: #3D3D3D;        /* Bordas */
  --color-text-primary: #FFFFFF;  /* Texto principal */
  --color-text-secondary: #B0B0B0;/* Texto secundário */
}
```

**Light Mode:**
```css
.light-mode {
  --color-bg-dark: #DDDDDD;       /* Fundo principal (cinza "sujo") */
  --color-bg-light: #F3F3F3;      /* Superfícies e cartões (cinza claro) */
  --color-border: #CCCCCC;        /* Bordas */
  --color-text-primary: #000000;  /* Texto principal */
  --color-text-secondary: #555555;/* Texto secundário */
}
```

### 3.2. Mapeamento para Tailwind CSS

As variáveis CSS são consumidas no `tailwind.config.js` para criar classes de utilitário semânticas.

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'theme-background': 'var(--color-bg-dark)',
      'theme-surface': 'var(--color-bg-light)',
      'theme-card': 'var(--color-bg-light)',
      'theme-border': 'var(--color-border)',
      // ... e outras
    },
  },
},
```

**Como usar:** Em vez de usar `bg-gray-800` ou `bg-white`, use as classes semânticas:
- `bg-theme-background`
- `bg-theme-surface`
- `text-theme-primary`

## 4. Conflitos e Duplicidades Identificados

A análise revelou vários pontos de atrito que dificultaram a manutenção.

### 4.1. Conflito Principal: `index.css` vs. `tailwind.config.js`

O problema mais crítico é a **duplicidade de fontes de verdade para as cores**.

- **`tailwind.config.js`**: Define um conjunto de cores semânticas (`theme-background`, `theme-surface`, etc.) que deveriam ser a base.
- **`index.css`**:
    1.  **Redefine as mesmas variáveis de tema** (`--theme-background`, `--theme-card`, etc.) com valores diferentes, muitas vezes fixos (`#ffffff`).
    2.  **Cria um *override* de alta especificidade** que força o fundo de todos os elementos dentro de `.light-mode .center-pane` para branco puro, que foi a causa raiz do problema no dashboard.

**Exemplo do Conflito (causa do bug no dashboard):**
```css
/* Em index.css */
.light-mode .center-pane {
  --theme-background: #ffffff; /* Força o fundo para branco */
  --theme-card: #ffffff;       /* Força cartões para branco */
  --theme-surface: #ffffff;    /* Força superfícies para branco */
}
```
Esta regra ignora completamente as cores definidas no `:root` e no `tailwind.config.js`, causando inconsistências.

### 4.2. Cores Legadas e Duplicadas

- **Classes `darkBg` e `lightBg`**: Foram encontradas no `tailwind.config.js` como cores legadas. Embora não estejam mais em uso nos componentes, sua presença no arquivo de configuração pode confundir novos desenvolvedores.
- **Múltiplas Definições de Cinza**: O projeto usa vários tons de cinza (`#1C1C1C`, `#2A2A2A`, `#DDDDDD`, `#F3F3F3`) que nem sempre são aplicados de forma consistente.

### 4.3. `overrides.css`

Este arquivo, embora útil, adiciona uma camada de complexidade. Ele corrige problemas de estilo de forma imperativa, o que pode ser difícil de rastrear. As regras para substituir cores "amarelas" são um bom exemplo de uma correção que poderia ser feita na fonte (ou seja, nos próprios componentes).

## 5. Simplificações e Melhorias Propostas

Para resolver os conflitos e simplificar a estilização:

1.  **Centralizar a Verdade em `index.css`**:
    - O arquivo `index.css` deve ser a **única fonte de verdade** para as variáveis de cor (`--color-bg-dark`, `--color-bg-light`, etc.).
    - Remover todas as redefinições dessas variáveis em seletores mais específicos, como `.light-mode .center-pane`.

2.  **Refatorar `tailwind.config.js`**:
    - O `tailwind.config.js` deve **apenas consumir** as variáveis CSS, sem declarar cores fixas.
    - Remover as cores legadas (`darkBg`, `lightBg`).

3.  **Eliminar Overrides Cirúrgicos**:
    - A correção aplicada para o dashboard (forçar o fundo cinza claro com `!important`) é uma solução temporária.
    - A solução ideal é remover a regra conflitante em `.light-mode .center-pane` para que os componentes herdem a cor de fundo correta naturalmente.

4.  **Consolidar `themes.css`**:
    - O conteúdo de `themes.css` (que define `--accent`) pode ser movido para o topo do `index.css` para reduzir o número de arquivos de estilização.

## 6. Guia de Implementação Futura

Ao desenvolver novos componentes:

- **Use Apenas Classes Semânticas**: Sempre prefira `bg-theme-surface`, `text-theme-primary`, etc.
- **Evite Cores Fixas**: Não use `bg-white`, `bg-black`, ou `bg-gray-200`. Se uma cor não existir no tema, adicione-a como uma variável semântica em `index.css`.
- **Componentes de UI**: Para componentes genéricos (botões, inputs), use as classes de `shadcn/ui` que já estão integradas com o sistema de acento (`--accent`).
- **Verifique a Herança**: Antes de aplicar uma cor de fundo, verifique se o componente pai já não fornece a cor correta através da herança de `bg-theme-background` ou `bg-theme-surface`.

Este guia deve ser mantido atualizado para refletir quaisquer mudanças na arquitetura de estilização.