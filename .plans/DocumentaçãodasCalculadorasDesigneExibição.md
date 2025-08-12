


          
Vou buscar informações sobre as calculadoras no frontend para entender sua estrutura, design e funcionamento visual.
        
            
toolName: search_codebase
            
status: success
          
query: calculadoras de infusão, componentes de calculadora, design e layout visual, cores, efeitos visuais, aba lateral, exibição ao clicar em usar
          
Agora vou buscar informações sobre o CalculatorCard para entender como as calculadoras são exibidas na aba lateral.
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\hgari\OneDrive\Área de Trabalho\HG1\frontend\src\components\Tools\CalculatorCard.jsx
          
Vou ver o restante do CalculatorCard para entender completamente sua estrutura visual.
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\hgari\OneDrive\Área de Trabalho\HG1\frontend\src\components\Tools\CalculatorCard.jsx
          
Agora vou buscar informações sobre as calculadoras pré-construídas (ConversaoGotejamento) para entender seu design específico.
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\hgari\OneDrive\Área de Trabalho\HG1\frontend\src\components\Tools\prebuilt\ConversaoGotejamento.jsx
          
Vou ver mais do arquivo ConversaoGotejamento para entender a estrutura visual completa.
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\hgari\OneDrive\Área de Trabalho\HG1\frontend\src\components\Tools\prebuilt\ConversaoGotejamento.jsx
          
Vou buscar informações sobre os estilos CSS e cores utilizadas no projeto para completar a documentação.
        
            
toolName: search_codebase
            
status: success
          
query: estilos CSS, cores do tema, classes Tailwind, bg-theme-background, bg-theme-surface, bg-theme-card, esquema de cores
          
Agora vou buscar informações sobre o tailwind.config.js para entender as configurações de tema personalizadas.
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\hgari\OneDrive\Área de Trabalho\HG1\frontend\tailwind.config.js
          
# Documentação das Calculadoras - Design e Exibição

## Visão Geral

As calculadoras no Health Guardian seguem um sistema de design consistente baseado em um esquema de cores escuro com acentos em tons de teal/verde-azulado. O sistema é composto por três tipos principais de calculadoras: **dinâmicas** (criadas pelo usuário), **pré-construídas** (hardcoded) e **modais** de edição.

## Estrutura Visual na Aba Lateral

### Layout Principal (`Calculators.jsx`)

**Container Principal:**
- Classe: `calculator-container h-full flex flex-col`
- Background: Herda `bg-theme-background` (#1a1e23)
- Layout: Flexbox vertical ocupando altura total

**Header com Busca e Filtros:**
```css
/* Campo de busca */
.input {
  background: bg-theme-card (#22262b)
  border: border-gray-700/30
  text: text-white
  placeholder: placeholder-gray-500
  focus: ring-teal-500/50 border-teal-500/50
}

/* Badges de categoria */
.badge-active {
  background: bg-teal-600
  text: text-white
  hover: hover:bg-teal-700
}

.badge-inactive {
  background: bg-gray-700
  text: text-gray-300
  hover: hover:bg-gray-600
}
```

**Botão "Nova Calculadora":**
- Classe: `bg-teal-600 hover:bg-teal-700 text-white`
- Ícone: SVG de "+" com `h-5 w-5 mr-2`
- Posicionamento: `flex justify-end mb-4`

### Grid de Calculadoras

**Layout Responsivo:**
```css
.grid {
  grid-template-columns: repeat(1, minmax(0, 1fr)); /* Mobile */
  grid-template-columns: repeat(2, minmax(0, 1fr)); /* md: Tablet */
  grid-template-columns: repeat(3, minmax(0, 1fr)); /* lg: Desktop */
  gap: 1rem; /* gap-4 */
}
```

## Cards de Calculadora (`CalculatorCard.jsx`)

### Estrutura do Card

**Container Principal:**
```css
.calculator-card {
  background: bg-theme-card (#22262b)
  border: border-gray-700
  hover: hover:border-gray-600
  transition: transition-colors
  cursor: cursor-pointer
}
```

**Header do Card:**
- **Ícone por Categoria:**
  - Cardiologia: Ícone de coração (`text-red-400`)
  - Endocrinologia: Ícone de termômetro (`text-yellow-400`)
  - Conversões: Ícone de setas (`text-blue-400`)
  - Geral: Ícone de calculadora (`text-teal-400`)
  - Pessoal: `text-teal-300`

- **Efeito Hover:** `group-hover:scale-110 transition-transform`

**Badge de Categoria:**
```css
.category-badge {
  background: bg-gray-700
  text: text-gray-300
  font-size: text-xs
  margin-top: mt-1
}
```

**Botão "Usar":**
```css
.use-button {
  background: btn btn-primary
  width: w-full
  size: sm
  icon: h-4 w-4 mr-2 (ícone de calculadora)
}
```

### Indicadores Visuais

**Calculadoras Pessoais:**
- Indicador "Usado recentemente" com ícone de relógio
- Cor: `text-gray-500`
- Tamanho: `text-xs`

**Contador de Entradas:**
- Ícone de documento
- Texto: "X entrada(s)" ou "X campo(s)"
- Cor: `text-gray-500`

## Modal de Calculadora (`CalculatorModal.jsx`)

### Container do Modal

```css
.modal-overlay {
  position: fixed
  inset: 0
  background: bg-black/50
  backdrop-filter: backdrop-blur-sm
  z-index: 50
}

.modal-content {
  background: bg-theme-background (#1a1e23)
  border: border-gray-700/50
  border-radius: rounded-lg
  box-shadow: shadow-xl
  max-width: max-w-2xl
  max-height: max-h-[90vh]
  overflow-y: auto
}
```

### Header do Modal

**Título:**
- Classe: `text-xl font-semibold text-white`
- Conteúdo: Nome da calculadora ou "Nova Calculadora"

**Botões de Modo:**
```css
.mode-button-active {
  background: bg-teal-600
  text: text-white
}

.mode-button-inactive {
  background: bg-gray-700/50
  text: text-gray-300
  hover: hover:bg-gray-600
}
```

### Modo "Usar" (Visualização)

**Campos de Entrada:**
```css
.input-field {
  background: bg-theme-surface (#1C1C1F)
  border: border-gray-600
  text: text-white
  placeholder: placeholder-gray-500
}
```

**Área de Resultados:**
```css
.result-container {
  background: bg-teal-900/20
  border: border-teal-700/50
  border-radius: rounded-lg
  padding: p-4
}

.result-value {
  color: text-teal-300
  font-size: text-2xl
  font-weight: font-bold
}

.result-unit {
  color: text-teal-400
  font-size: text-lg
}
```

**Passos do Cálculo:**
```css
.calculation-steps {
  color: text-teal-300
  font-family: font-mono
  font-size: text-sm
}
```

**Avisos de Dados Faltantes:**
```css
.missing-data-warning {
  background: bg-yellow-900/20
  border: border-yellow-700/50
  color: text-yellow-300 (título)
  color: text-yellow-200 (lista)
}
```

## Calculadoras Pré-construídas

### ConversaoGotejamento (`ConversaoGotejamento.jsx`)

**Modal Específico:**
```css
.dialog-content {
  max-width: max-w-3xl
  background: bg-theme-background
  border: border-gray-700
}
```

**Card de Instruções:**
```css
.instructions-card {
  background: bg-gray-800/50
  border: border-gray-700
}
```

**Abas de Navegação:**
```css
.tabs-list {
  background: bg-gray-700
}

.tab-active {
  background: bg-teal-600
  color: text-white
}
```

**Valores Copiáveis:**
```css
.copyable-value {
  background: bg-gray-800/30
  border: border rounded-xl
  padding: px-3 py-2
}

.copy-button {
  background: hover:bg-gray-700
  variant: ghost
}
```

**Botão "Gota" (Tap Mode):**
```css
.tap-button {
  background: bg-teal-600
  hover: hover:bg-teal-700
  color: text-white
  font-weight: font-bold
  font-size: text-xl
  padding: px-8 py-4
}
```

### ConversaoMcgKgMin (`ConversaoMcgKgMin.jsx`)

**Estrutura Similar:**
- Mesmo padrão de modal e abas
- Campos de entrada com `bg-theme-surface border-gray-600`
- Labels com `text-white`
- Placeholders específicos para cada campo

## Esquema de Cores Unificado

### Cores Principais do Tema

```css
/* Backgrounds */
--theme-background: #1a1e23  /* Fundo principal */
--theme-surface: #1C1C1F     /* Painéis distintos */
--theme-card: #22262b        /* Cards e inputs */
--theme-border: #374151      /* Bordas padrão */

/* Cores de Destaque */
--teal-600: #0d9488         /* Botões primários */
--teal-700: #0f766e         /* Hover primário */
--teal-400: #2dd4bf         /* Texto de destaque */
--teal-300: #5eead4         /* Texto secundário */

/* Cores de Status */
--gray-700: #374151         /* Elementos inativos */
--gray-600: #4b5563         /* Hover inativo */
--gray-400: #9ca3af         /* Texto secundário */
--gray-300: #d1d5db         /* Texto terciário */
```

### Aplicação por Categoria

**Cardiologia:** `text-red-400` (#f87171)
**Endocrinologia:** `text-yellow-400` (#fbbf24)
**Conversões:** `text-blue-400` (#60a5fa)
**Geral:** `text-teal-400` (#2dd4bf)
**Pessoal:** `text-teal-300` (#5eead4)

## Efeitos e Transições

### Animações Padrão

```css
/* Transições suaves */
.transition-colors { transition: color 150ms ease-in-out }
.transition-all { transition: all 200ms ease-in-out }

/* Hover effects */
.group-hover\:scale-110 { transform: scale(1.1) }

/* Focus states */
.focus\:ring-2 { box-shadow: 0 0 0 2px rgba(ring-color, 0.5) }
.focus\:ring-teal-500\/50 { --ring-color: #14b8a6 }
```

### Estados Interativos

**Hover:**
- Cards: `hover:border-gray-600`
- Botões: `hover:bg-teal-700`
- Ícones: `hover:scale-110`

**Focus:**
- Inputs: `focus:ring-teal-500/50 focus:border-teal-500/50`
- Botões: `focus:ring-2 focus:ring-offset-2`

**Active:**
- Abas: `bg-teal-600 text-white`
- Badges: `bg-teal-600 text-white`

## Responsividade

### Breakpoints

```css
/* Mobile First */
grid-cols-1          /* < 768px */
md:grid-cols-2       /* 768px+ */
lg:grid-cols-3       /* 1024px+ */

/* Spacing Responsivo */
gap-4                /* 1rem em todos os tamanhos */
p-4                  /* 1rem padding */
max-w-3xl            /* Máximo 48rem para modais */
```

### Adaptações Mobile

- Grid de calculadoras: 1 coluna
- Modal: `max-h-[90vh]` com scroll
- Botões: Tamanho mínimo `h-10`
- Texto: Mínimo `text-sm`

## Integração com Sistema de Design

### Conectores

- **CSS Global:** `index.css` define variáveis e classes base
- **Tailwind Config:** `tailwind.config.js` estende cores tema
- **Componentes UI:** Pasta `components/ui/` fornece primitivos
- **Store:** `calculatorStore.js` gerencia estado das calculadoras

### Hooks de Extensão

- **Novas Categorias:** Adicionar em `getIconForCategory()` e `getCategoryColor()`
- **Novos Temas:** Estender variáveis CSS em `:root`
- **Animações:** Usar classes Tailwind ou CSS customizado
- **Responsividade:** Seguir padrão mobile-first com breakpoints md/lg

Esta documentação serve como guia completo para manter consistência visual e facilitar futuras extensões do sistema de calculadoras.
        