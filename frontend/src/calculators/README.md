# Sistema de Calculadoras Dinâmicas

Sistema completo de calculadoras médicas baseado em schemas JSON, implementado conforme os planos de orientação.

## Arquitetura

### Runtime Components (`runtime/`)

- **`CalculatorShell.tsx`** - Shell principal com card/modal, título, tabs, inputs e outputs
- **`DynamicCalculator.tsx`** - Renderizador dinâmico baseado em schema JSON
- **`CalcInput.tsx`** - Input wrapper com validação e estilo emerald focus
- **`CopyableValue.tsx`** - Componente para valores copiáveis com toast
- **`TapCounter.tsx`** - Contador de tap para gotejamento manual
- **`FormulaNote.tsx`** - Componente para exibir fórmulas
- **`ReferenceList.tsx`** - Lista de referências bibliográficas

### Hooks

- **`useCompute.js`** - Hook para avaliação local de expressions matemáticas
  - Suporte a operadores ternários
  - Sandbox seguro com MathJS
  - Debounce automático
  - Formatação PT-BR

### Estilos

- **Emerald Focus** - Realce esverdeado translúcido nos inputs ativos
  - Classes: `.emerald-focus`
  - Efeitos: `focus:ring-emerald-600/50 focus:border-emerald-600/50 bg-emerald-500/10`
  - Consistente com identidade visual do app

## Schemas JSON

### Estrutura Padrão

```json
{
  "id": "categoria.nome",
  "version": "1.0.0",
  "title": "Título da Calculadora",
  "description": "Descrição detalhada",
  "category": "Categoria",
  "ui": {
    "tabs": [...],
    "placeholders": {...},
    "highlightStyle": "emerald-focus",
    "tap": {
      "targetField": "campo",
      "enabled": true
    }
  },
  "fields": {...},
  "expressions": {...},
  "disclaimer": "Texto de disclaimer",
  "references": [...]
}
```

### Schemas Implementados

1. **`infusion_drops_mlh.json`** - Conversão gotas/min ↔ mL/h
2. **`infusion_mcgkgmin_gttmin.json`** - Conversão mcg/kg/min ↔ gtt/min

## Páginas de Exemplo

- **`GotejamentoPage.tsx`** - Calculadora de gotejamento simples
- **`McgKgMinGttMinPage.tsx`** - Calculadora de dose por peso

## Características

### UX/UI Padronizado

- Cards centrais com tema dark
- Tabs bidirecionais para conversões
- "Como usar" contextual por tab
- Botões de copiar em todos os resultados
- Tooltips informativos
- Placeholders em português

### Funcionalidades

- **Cálculo Reativo** - Atualização automática onChange
- **Tap Counter** - Contador manual para gotejamento
- **Validação** - Ranges mínimos/máximos por campo
- **Formatação PT-BR** - Vírgula como separador decimal
- **Acessibilidade** - WCAG 2.1 AA compliant

### Segurança

- Sandbox MathJS sem funções perigosas
- Validação de entrada
- Disclaimers clínicos obrigatórios
- Versionamento de schemas

## Integração

### Mapa de Conexões

```
DynamicCalculator.tsx
├── CalculatorShell.tsx (UI container)
├── CalcInput.tsx (inputs com emerald-focus)
├── CopyableValue.tsx (outputs copiáveis)
├── TapCounter.tsx (contador manual)
├── useCompute.js (engine de cálculo)
└── Schema JSON (configuração)
```

### Hooks de Integração

- **Store Integration**: Compatível com `calculatorStore.js` existente
- **Theme Integration**: Usa classes semânticas `theme-*`
- **Component Integration**: Reutiliza componentes shadcn/ui
- **Router Integration**: Páginas standalone para React Router

## Uso

### Criar Nova Calculadora

1. Criar schema JSON em `data/schemas/`
2. Criar página em `pages/calculators/`
3. Importar `DynamicCalculator` e passar schema
4. Adicionar rota no sistema de navegação

### Exemplo Básico

```tsx
import { DynamicCalculator } from '../../calculators/runtime';

const MinhaCalculadora = () => {
  const schema = { /* schema JSON */ };
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <DynamicCalculator schema={schema} />
    </div>
  );
};
```

## Próximos Passos

- [ ] Integração com backend API
- [ ] Histórico de cálculos
- [ ] Presets de medicamentos
- [ ] Validação de ranges médicos
- [ ] Exportação de resultados
- [ ] Testes automatizados

## Connector

Este sistema integra com:
- `store/calculatorStore.js` - Persistência de valores
- `components/ui/*` - Componentes shadcn
- `hooks/useCompute.js` - Engine de cálculo
- `index.css` - Estilos emerald-focus

## Hook

Sistema completo de calculadoras dinâmicas baseado em JSON schemas, mantendo identidade visual e padrões de UX do Health Guardian.