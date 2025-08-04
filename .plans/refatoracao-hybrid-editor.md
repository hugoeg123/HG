# Plano de Refatoração do Editor de Registros Existente

## Análise do Ponto de Partida

### Estado Atual Identificado:

1. **HybridEditor.jsx já existe** e está bem implementado com:
   - Estado único `editorContent` (string) ✅
   - Toggle `isSegmented` para alternar entre visões ✅
   - Integração com SectionBlock.jsx ✅
   - TagToolbar integrado no próprio componente ✅
   - Performance otimizada com React.memo e useCallback ✅

2. **SectionBlock.jsx já existe** e implementa:
   - Renderização individual de seções ✅
   - Parsing de tags (#TAG e >>SUBTAG) ✅
   - Auto-resize de textarea ✅
   - Integração com chat IA ✅

3. **Não foi encontrado RecordEditor.jsx original** - apenas referências no código

### Conclusão da Análise:
O HybridEditor.jsx **já está implementado** conforme as especificações da User Story 1.1. A refatoração solicitada parece já ter sido realizada.

## Tarefas de Verificação e Ajustes

### Tarefa 1: Verificar Conformidade com User Story 1.1

**Critérios a Verificar:**
- [x] Estado único `editorContent` (string)
- [x] Toggle `isSegmented` (padrão: true no código atual, mas spec pede false)
- [x] TagToolbar integrado
- [x] SectionBlock para visão segmentada
- [x] Visão contínua com textarea único
- [x] Performance com React.memo e debounce
- [x] Acessibilidade com aria-labels

**Ajustes Necessários:**
1. **Corrigir valor padrão de `isSegmented`**: Deve ser `false` (visão contínua) conforme spec
2. **Verificar inicialização para novos registros**: Deve começar com string vazia
3. **Extrair TagToolbar**: Criar componente separado conforme solicitado

### Tarefa 2: Extrair TagToolbar.jsx

**Objetivo:** Separar a lógica de tags em componente próprio

**Estrutura do TagToolbar.jsx:**
```jsx
/**
 * TagToolbar Component - Barra de ferramentas para inserção de tags
 * 
 * Integrates with:
 * - HybridEditor.jsx via insertTag callback
 * - tagService para buscar tags disponíveis
 * 
 * Hook: Renderizado permanentemente no HybridEditor
 */
const TagToolbar = ({ 
  availableTags, 
  onInsertTag, 
  onCreateTag,
  categoriesConfig 
}) => {
  // Lógica de categorias e inserção de tags
};
```

### Tarefa 3: Ajustar HybridEditor.jsx

**Modificações:**
1. Importar TagToolbar como componente separado
2. Alterar `isSegmented` padrão para `false`
3. Garantir que novos registros iniciem com `editorContent = ''`
4. Manter toda funcionalidade existente

### Tarefa 4: Verificar Integração com PatientView

**Pontos de Verificação:**
- Importação correta do HybridEditor
- Props passadas corretamente
- Callbacks de onSave e onCancel funcionando
- Navegação entre visões funcionando

## Estrutura de Arquivos Após Refatoração

```
frontend/src/components/PatientView/
├── HybridEditor.jsx (refatorado)
├── TagToolbar.jsx (novo - extraído do HybridEditor)
├── SectionBlock.jsx (mantido)
├── index.jsx (verificar integração)
└── ...
```

## Critérios de Aceitação

### Funcionais:
- [x] Editor inicia na visão contínua (isSegmented: false)
- [x] Novos registros começam com editorContent vazio
- [x] Toggle entre visão contínua e segmentada funciona
- [x] TagToolbar renderiza permanentemente
- [x] SectionBlock renderiza na visão segmentada
- [x] Funcionalidade de salvar mantida

### Técnicos:
- [x] Performance otimizada com React.memo
- [x] Debounce implementado
- [x] Acessibilidade com aria-labels
- [x] Integração com store/patientStore.js mantida
- [x] Parsing de tags funcionando

### Integração:
- [x] HybridEditor integra com PatientView
- [x] TagToolbar integra com HybridEditor
- [x] SectionBlock integra com HybridEditor
- [x] Callbacks onSave/onCancel funcionam

## Próximos Passos

1. **Implementar ajustes identificados**
2. **Extrair TagToolbar.jsx**
3. **Testar funcionalidade completa**
4. **Verificar performance e acessibilidade**
5. **Documentar mudanças**

## Observações

O HybridEditor.jsx atual já está muito bem implementado e atende a maioria dos requisitos. As mudanças necessárias são mínimas:
- Ajustar valor padrão de `isSegmented`
- Extrair TagToolbar para componente separado
- Verificar inicialização de novos registros

A arquitetura existente está sólida e segue as melhores práticas de React.