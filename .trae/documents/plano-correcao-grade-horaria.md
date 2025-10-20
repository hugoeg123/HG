# Plano de Correção - Grade Horária

## Problemas Identificados

### 1. Deslocamento Vertical dos Slots
**Sintoma**: Faixa 04:30-07:15 aparece no meio de 01:15 até 03:45 (deslocada ~3h)
**Causa provável**: Cálculo incorreto da posição vertical ou offset do cabeçalho

### 2. Layout dos Botões
**Sintoma**: Botões lado a lado, grandes e chamativos
**Requisito**: Empilhados verticalmente, menores e discretos

## Análise do Código Atual

### Fatores de Posicionamento Vertical
```javascript
// Em WeeklyTimeGrid.jsx
const PIXELS_PER_MINUTE = 40 / 30; // 40px por 30min = 1.333px/min
const GRID_START_MINUTES = 0; // 00:00

const getSlotPosition = (slot) => {
  const startMinutes = timeToMinutes(slot.startTime);
  const endMinutes = timeToMinutes(slot.endTime);
  
  const top = (startMinutes - GRID_START_MINUTES) * PIXELS_PER_MINUTE;
  const height = (endMinutes - startMinutes) * PIXELS_PER_MINUTE;
  
  return { top, height };
};
```

**Possíveis causas do deslocamento:**
1. `timelineOffsetTop` não sendo aplicado corretamente nos slots
2. `PIXELS_PER_MINUTE` calculado incorretamente
3. Padding/margins não considerados no cálculo
4. Header height measurement impreciso

### Estrutura Atual dos Botões
```jsx
<div className="flex items-center gap-2">
  <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border...">
    {/* checkbox + texto */}
  </button>
  <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border...">
    {/* checkbox + texto */}
  </button>
</div>
```

## Plano de Implementação

### Fase 1: Correção do Deslocamento Vertical

1. **Verificar aplicação do offset**
   - Confirmar que `timelineOffsetTop` está sendo aplicado nos slots
   - Atualizar `getSlotPosition` para incluir offset

2. **Ajustar cálculo de posição**
   ```javascript
   const getSlotPosition = (slot) => {
     const startMinutes = timeToMinutes(slot.startTime);
     const endMinutes = timeToMinutes(slot.endTime);
     
     const top = (startMinutes - GRID_START_MINUTES) * PIXELS_PER_MINUTE + timelineOffsetTop;
     const height = (endMinutes - startMinutes) * PIXELS_PER_MINUTE;
     
     return { top, height };
   };
   ```

3. **Validar medidas do header**
   - Garantir que `headerRef` está capturando altura correta
   - Verificar timing do `useEffect` de medição

### Fase 2: Reorganização dos Botões

1. **Mudar para layout vertical**
   ```jsx
   <div className="flex flex-col items-start gap-1">
     <button className="flex items-center gap-2 px-2 py-1 text-xs rounded border...">
       {/* checkbox + texto em linha única */}
     </button>
     <button className="flex items-center gap-2 px-2 py-1 text-xs rounded border...">
       {/* checkbox + texto em linha única */}
     </button>
   </div>
   ```

2. **Reduzir tamanho visual**
   - Diminuir padding: `px-2 py-1` (de `px-3 py-1.5`)
   - Reduzir fonte: `text-xs` (de tamanho padrão)
   - Checkbox menor: `h-3 w-3` (de `h-4 w-4`)
   - Texto em linha única com `whitespace-nowrap`

### Fase 3: Validação

1. **Testar posicionamento**
   - Criar slot 04:30-07:15
   - Verificar se alinha corretamente com as linhas de grade
   - Testar outros horários (00:00, 12:00, 23:30)

2. **Verificar layout dos botões**
   - Confirmar empilhamento vertical
   - Validar tamanho discreto
   - Testar responsividade

## Integrações a Considerar

### Dependências do Componente
- `useTimeSlotStore` - estado global de slots
- `timeSlotStore` - funções de manipulação
- Sistema de temas (dark/light mode)

### Hooks de Integração
- `useEffect` para medição do header
- `useRef` para referências de elementos
- Event handlers de mouse para drag & drop

## Testes Recomendados

1. **Posicionamento Vertical**
   - Slots em diferentes horários
   - Preview durante drag
   - Diferentes resoluções de tela

2. **Botões**
   - Funcionalidade de toggle
   - Acessibilidade (ARIA)
   - Estados ativo/inativo

## Métricas de Sucesso

- ✅ Slots aparecem na posição correta (±5px de tolerância)
- ✅ Botões empilhados verticalmente
- ✅ Botões com tamanho reduzido (≤ 32px altura)
- ✅ Manter funcionalidade existente
- ✅ Preview alinhado corretamente