# Sistema de Cores Semânticas - Health Guardian

## Visão Geral

Este documento descreve o sistema de cores semânticas implementado no Health Guardian para centralizar o gerenciamento de cores e facilitar futuras modificações de tema.

## Motivação

Antes da refatoração, o projeto utilizava cores hardcoded espalhadas por diversos componentes, dificultando:
- Manutenção e alterações de tema
- Consistência visual
- Escalabilidade do design system

## Sistema de Cores Semânticas

### Paleta Principal

O sistema define 4 cores semânticas principais:

```javascript
// frontend/tailwind.config.js
colors: {
  // --- Semantic Color System ---
  'theme-background': '#1a1e23', // Main background for app body and sidebars
  'theme-surface': '#1C1C1F',    // Panels and distinct content areas
  'theme-card': '#22262b',       // Interactive items: cards, inputs, modals
  'theme-border': '#374151',     // Standard borders
  
  // Existing colors...
}
```

### Mapeamento de Cores

| Cor Hardcoded | Classe Semântica | Uso Recomendado |
|---------------|------------------|------------------|
| `#1a1e23` | `bg-theme-background` | Fundos principais da aplicação e sidebars |
| `#1C1C1F` | `bg-theme-surface` | Painéis e áreas de conteúdo distintas |
| `#22262b` | `bg-theme-card` | Itens interativos: cards, inputs, modais |
| `#374151` | `border-theme-border` | Bordas padrão |

## Guia de Uso

### Classes Tailwind

```css
/* Fundos */
.bg-theme-background  /* Para fundos principais */
.bg-theme-surface     /* Para painéis e seções */
.bg-theme-card        /* Para cards e elementos interativos */

/* Bordas */
.border-theme-border  /* Para bordas padrão */
```

### Exemplos de Implementação

#### Antes (Hardcoded)
```jsx
<div className="bg-[#22262b] border border-gray-700">
  <input className="bg-[#1a1e23]" />
</div>
```

#### Depois (Semântico)
```jsx
<div className="bg-theme-card border border-gray-700">
  <input className="bg-theme-background" />
</div>
```

### Componentes Refatorados

Os seguintes componentes foram atualizados para usar o sistema semântico:

#### Layout Components
- `MainLayout.jsx`
- `LeftSidebar.jsx`
- `RightSidebar.jsx`
- `Navbar.jsx`

#### Patient View Components
- `HybridEditor.jsx`
- `TagToolbar.jsx`
- `SectionBlock.jsx`
- `PatientDashboard.jsx`

#### Dashboard & UI Components
- `Dashboard.jsx`
- `components/ui/card.tsx`
- `components/ui/dialog.tsx`
- `components/ui/input.tsx`
- `components/Tools/CalculatorModal.jsx`

#### Global Styles
- `index.css` - Classes utilitárias atualizadas

## Modificando o Tema

### Alteração Global de Cores

Para alterar uma cor em toda a aplicação:

1. Edite o arquivo `frontend/tailwind.config.js`
2. Modifique o valor da cor desejada:

```javascript
colors: {
  'theme-background': '#2a2e33', // Nova cor de fundo
  // ...
}
```

3. Reinicie o servidor de desenvolvimento
4. A mudança será aplicada automaticamente em todos os componentes

### Teste de Validação

Para validar que o sistema está funcionando:

1. Altere temporariamente uma cor no `tailwind.config.js`
2. Verifique se a mudança é refletida globalmente
3. Reverta a alteração

## Benefícios

### ✅ Manutenibilidade
- Alterações centralizadas no `tailwind.config.js`
- Eliminação de busca manual por cores hardcoded

### ✅ Consistência
- Uso padronizado de cores semânticas
- Redução de inconsistências visuais

### ✅ Escalabilidade
- Fácil adição de novos temas
- Suporte futuro para modo claro/escuro

### ✅ Developer Experience
- Classes mais legíveis e semânticas
- Autocomplete melhorado no IDE

## Diretrizes de Desenvolvimento

### ✅ Fazer
- Use sempre classes semânticas para as cores principais
- Mantenha a consistência com o sistema estabelecido
- Documente novos padrões de cor

### ❌ Evitar
- Cores hardcoded (`bg-[#...]`)
- Inline styles para cores principais
- Criação de novas cores sem documentação

## Estrutura de Arquivos

```
frontend/
├── tailwind.config.js          # Definições das cores semânticas
├── src/
│   ├── index.css              # Classes utilitárias globais
│   └── components/            # Componentes refatorados
└── docs/
    └── REFATORACAO-CORES.md   # Este documento
```

## Histórico de Mudanças

### v1.0.0 - Implementação Inicial
- ✅ Criação do sistema de cores semânticas
- ✅ Refatoração de todos os componentes principais
- ✅ Atualização das classes CSS globais
- ✅ Documentação completa do sistema

---

**Nota**: Este sistema foi implementado com zero mudanças visuais, mantendo a estética dark mode existente enquanto centraliza o controle de cores para futuras modificações.