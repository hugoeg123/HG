# Plano de Correção: Posicionamento dos Slots

## 🎯 Objetivo
Corrigir o deslocamento vertical dos slots de horário que estão aparecendo ~2-3 horas abaixo do esperado.

## 📋 Lista de Tarefas

### **Fase 1: Diagnóstico e Preparação** ✅
- [x] Analisar código do WeeklyTimeGrid.jsx
- [x] Identificar duplicação do timelineOffsetTop
- [x] Mapear funções afetadas: getSlotPosition, preview slot

### **Fase 2: Correção do Cálculo de Posicionamento**
- [ ] **Modificar getSlotPosition()** - Remover timelineOffsetTop
- [ ] **Corrigir preview slot** - Remover timelineOffsetTop
- [ ] **Manter offset apenas no container** - Confirmar posição correta

### **Fase 3: Testes e Validação**
- [ ] **Testar criação de slots** em horários específicos
- [ ] **Validar drag & drop** durante criação
- [ ] **Verificar alinhamento** com grid de fundo
- [ ] **Preview com diferentes horários**

### **Fase 4: Otimização e Cleanup**
- [ ] **Remover código comentado** após validação
- [ ] **Documentar mudanças** no código
- [ ] **Atualizar testes** se necessário

## 🔧 Implementação Passo-a-Passo

### **Passo 1: Corrigir getSlotPosition()**
**Arquivo:** `frontend/src/components/WeeklyTimeGrid.jsx`
**Linha:** ~145

```javascript
// ANTES (com erro):
const top = (startMinutes - GRID_START_MINUTES) * PIXELS_PER_MINUTE + timelineOffsetTop;

// DEPOIS (correto):
const top = (startMinutes - GRID_START_MINUTES) * PIXELS_PER_MINUTE;
```

### **Passo 2: Corrigir Preview Slot**
**Linha:** ~485
```javascript
// ANTES:
top: `${(timeToMinutes(previewSlot.startTime) - GRID_START_MINUTES) * PIXELS_PER_MINUTE + timelineOffsetTop}px`,

// DEPOIS:
top: `${(timeToMinutes(previewSlot.startTime) - GRID_START_MINUTES) * PIXELS_PER_MINUTE}px`,
```

### **Passo 3: Verificar Container (Manter assim)**
**Linha:** ~450
```javascript
// MANTER - Já está correto:
style={{ top: `${timelineOffsetTop}px` }}
```

## 🧪 Testes de Validação

### **Teste 1: Slot 00:00-01:00**
- Deve aparecer exatamente no topo (abaixo do header)
- Alinhado com linha 00:00 do grid

### **Teste 2: Slot 04:30-05:30**
- Deve aparecer alinhado com linha 04:30
- Não deve ter deslocamento extra

### **Teste 3: Drag Preview**
- Preview deve seguir mouse precisamente
- Drop deve posicionar corretamente

### **Teste 4: Múltiplos Horários**
- 08:00, 12:00, 18:00, 22:00
- Todos devem alinhar com grid

## 📊 Métricas de Sucesso
- ✅ Slots aparecem na posição correta (±5px)
- ✅ Preview durante drag alinhado
- ✅ Sem deslocamento sistemático
- ✅ Drag & drop funcional

## ⚠️ Precauções
- **Manter código original comentado** temporariamente
- **Testar em diferentes navegadores**
- **Validar com diferentes resoluções**
- **Verificar modo escuro/claro**

## 📝 Documentação
- **Comentar mudanças** no código
- **Atualizar JSDoc** se necessário
- **Registrar em CHANGELOG**