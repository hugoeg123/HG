# Diagnóstico: Problema de Posicionamento Vertical dos Slots

## 🚨 Problema Reportado
Os slots de horário estão aparecendo **mais abaixo** do que deveriam quando criados:
- Slot criado para 04:30 aparece na posição errada
- Deslocamento vertical inconsistente
- Preview durante drag também desalinhado

## 🔍 Análise do Código Atual

### 1. Constantes de Posicionamento
```javascript
const GRID_START_MINUTES = 0; // 00:00
const GRID_END_MINUTES = 24 * 60; // 24:00
const PIXELS_PER_MINUTE = 40 / 30; // 1.333px por minuto (40px a cada 30min)
```

### 2. Função `getSlotPosition()`
```javascript
const getSlotPosition = (slot) => {
  const startMinutes = timeToMinutes(slot.startTime);
  const endMinutes = timeToMinutes(slot.endTime);
  
  // PROBLEMA: Adicionando timelineOffsetTop aqui causa duplicação
  const top = (startMinutes - GRID_START_MINUTES) * PIXELS_PER_MINUTE + timelineOffsetTop;
  const height = (endMinutes - startMinutes) * PIXELS_PER_MINUTE;
  
  return { top, height };
};
```

### 3. Estrutura HTML/CSS
```javascript
// Container principal com position: relative
<div ref={gridRef} className="relative">
  
  // Header com position: static (dentro do fluxo)
  <div ref={headerRef} className="grid grid-cols-8 gap-px bg-theme-border">
    
  // Overlay dos slots com position: absolute
  <div className="absolute z-10 pointer-events-none" style={{ top: `${timelineOffsetTop}px` }}>
    
    // Slot individual
    <div style={{ top: `${position.top}px`, height: `${position.height}px` }}>
```

## 🎯 Identificação da Causa Raiz

### **PROBLEMA PRINCIPAL**: Duplicação do Offset
1. **Overlay** já está posicionado com `top: timelineOffsetTop`
2. **Cada slot** dentro do overlay recebe NOVAMENTE `+ timelineOffsetTop`
3. **Resultado**: Offset duplicado, slots aparecem mais abaixo

### Cálculo Atual (Com Problema):
```
Posição real = (minutos × pixels_por_minuto) + timelineOffsetTop + timelineOffsetTop
```

### Cálculo Correto Deveria Ser:
```
Posição real = (minutos × pixels_por_minuto) + timelineOffsetTop (apenas no container)
```

## 📋 Plano de Correção

### **Etapa 1: Remover Duplicação do Offset**
- [ ] Modificar `getSlotPosition()` para não adicionar `timelineOffsetTop`
- [ ] Manter `timelineOffsetTop` apenas no container overlay

### **Etapa 2: Verificar Preview Slot**
- [ ] Consistir se preview usa mesmo cálculo que slots reais
- [ ] Aplicar mesma correção ao preview

### **Etapa 3: Testar Drag & Drop**
- [ ] Validar que drag começa na posição correta
- [ ] Verificar que drop posiciona corretamente

### **Etapa 4: Validar Grid de Fundo**
- [ ] Confirmar que linhas de tempo (00:00, 01:00, etc.) estão alinhadas
- [ ] Ajustar `getTimeFromPosition()` se necessário

## 🔧 Implementação Detalhada

### Arquivo: `WeeklyTimeGrid.jsx`

#### **Mudança 1: Corrigir getSlotPosition()**
```javascript
// ANTES (com problema):
const top = (startMinutes - GRID_START_MINUTES) * PIXELS_PER_MINUTE + timelineOffsetTop;

// DEPOIS (correto):
const top = (startMinutes - GRID_START_MINUTES) * PIXELS_PER_MINUTE;
```

#### **Mudança 2: Verificar Preview Slot**
```javascript
// Preview slot já calcula corretamente, mas precisa consistência
style={{
  top: `${(timeToMinutes(previewSlot.startTime) - GRID_START_MINUTES) * PIXELS_PER_MINUTE + timelineOffsetTop}px`,
  // Remove timelineOffsetTop daqui também
}}
```

#### **Mudança 3: Manter Offset apenas no Container**
```javascript
// Container overlay - MANTER assim (correto)
<div className="absolute z-10 pointer-events-none" style={{ top: `${timelineOffsetTop}px` }}>
```

## 🧪 Testes de Validação

### **Teste 1: Criação de Slot Simples**
- Criar slot 00:00-01:00
- Verificar se aparece exatamente no topo do grid (abaixo do header)

### **Teste 2: Slot em Horários Específicos**
- Criar slots para: 04:30, 08:00, 12:00, 18:00
- Validar alinhamento com linhas de fundo

### **Teste 3: Drag & Drop**
- Iniciar drag em 02:00
- Verificar se preview aparece na posição correta
- Soltar e confirmar posição final

### **Teste 4: Múltiplos Slots**
- Criar vários slots no mesmo dia
- Verificar sobreposição e alinhamento

## 📊 Métricas de Sucesso
- ✅ Slots aparecem alinhados com linhas de tempo
- ✅ Preview durante drag posicionado corretamente
- ✅ Sem deslocamento vertical inesperado
- ✅ Drag & drop preciso

## ⚠️ Riscos e Considerações
- **Impacto**: Mudança afeta todo posicionamento de slots
- **Teste necessário**: Todos os modos (availability/booking)
- **Revisão**: Verificar integração com TimeGridSlot component
- **Fallback**: Manter código anterior comentado temporariamente

## 📝 Notas Adicionais
- O problema é puramente de cálculo, não de CSS
- A estrutura HTML está correta
- O offset do header é necessário, mas não deve ser duplicado
- PIXELS_PER_MINUTE parece correto (1.333px/min)