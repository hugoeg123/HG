# Plano de Melhorias - Agenda Médica

## 1. Visão Geral do Projeto

### Objetivo
Aprimorar a experiência frontend da agenda médica com implementação de grid visual de horários, sistema de faixas de atendimento e controle avançado de disponibilidade, mantendo total compatibilidade com os temas claro/escuro existentes.

### Escopo Atual
- Página de agenda em `frontend/src/pages/Agenda.jsx`
- Sistema de temas com variáveis CSS (dark-mode/light-mode)
- Cores: Dark = teal/green, Light = blue
- Armazenamento local em localStorage
- Componentes shadcn/ui integrados

## 2. Análise de Requisitos

### 2.1 Grid Visual de Horários
**Prioridade: Alta**
- Grid semanal com visualização de 7 dias (segunda a domingo)
- Slots de 30 minutos como padrão (configurável)
- Cores diferenciadas para temas:
  - **Light Mode**: Disponíveis = azul claro (#dbeafe), Agendados = azul escuro (#1e3a8a)
  - **Dark Mode**: Disponíveis = verde claro (#115e59), Agendados = verde escuro (#064e3b)
- Interação via clique e arraste para criar novos horários
- Visualização clara de conflitos

### 2.2 Sistema de Faixas de Horário
**Prioridade: Alta**
- Configuração de horário inicial e final por dia da semana
- Suporte a múltiplas faixas por dia
- Validação de sobreposição de faixas
- Configuração de intervalo entre consultas (0-60 minutos)
- Duração padrão da consulta (15-180 minutos)

### 2.3 Modalidades de Atendimento
**Prioridade: Alta**
- Checkboxes múltiplas escolhas:
  - Presencial em consultório
  - Telemedicina
  - Visita domiciliar
- Possibilidade de selecionar múltiplas opções simultâneas
- Identificação visual da modalidade no grid

### 2.4 Diferenciação de Status
**Prioridade: Média**
- Horários disponíveis (livres para agendamento)
- Horários agendados pelo próprio médico
- Horários agendados por pacientes via marketplace
- Sistema de cores e badges para diferenciação

### 2.5 Prevenção de Conflitos
**Prioridade: Alta**
- Validação em tempo real de sobreposição de horários
- Alertas visuais e sonoros para conflitos
- Impedir salvamento de horários conflitantes
- Sugestão de horários alternativos

## 3. Arquitetura Técnica Proposta

### 3.1 Estrutura de Componentes
```
Agenda.jsx (principal)
├── CalendarHeader.jsx
├── MonthlyCalendar.jsx
├── WeeklyTimeGrid.jsx (novo)
│   ├── TimeGridHeader.jsx
│   ├── TimeGridSlot.jsx
│   └── TimeGridControls.jsx
├── TimeSlotConfig.jsx (novo)
└── AvailabilitySettings.jsx (novo)
```

### 3.2 Estado Global com Zustand
```javascript
// timeSlotStore.js
const useTimeSlotStore = create((set, get) => ({
  // Configurações de faixas horárias
  timeRanges: {
    '1': [{ start: '08:00', end: '12:00', interval: 15, duration: 30 }], // Segunda
    '2': [{ start: '14:00', end: '18:00', interval: 15, duration: 30 }], // Terça
    // ... outros dias
  },
  
  // Slots de tempo criados
  timeSlots: [
    {
      id: 'uuid',
      date: '2024-01-15',
      startTime: '08:00',
      endTime: '08:30',
      modality: ['presencial', 'telemedicina'],
      status: 'available', // available, booked, blocked
      bookedBy: null, // { patientId, name, timestamp }
      createdBy: 'doctor_id',
      createdAt: '2024-01-01T10:00:00Z'
    }
  ],
  
  // UI State
  selectedWeek: new Date(),
  viewMode: 'month', // month, week, day
  isCreatingSlot: false,
  draggedSlot: null,
  
  // Actions
  addTimeRange: (day, range) => {},
  removeTimeRange: (day, rangeId) => {},
  generateSlotsFromRanges: () => {},
  addManualSlot: (slot) => {},
  removeSlot: (slotId) => {},
  checkConflicts: (slot) => {},
  validateSlot: (slot) => {}
}));
```

### 3.3 Integração com Tema Existente
```css
/* Variáveis CSS para slots de tempo */
.light-mode {
  --slot-available-bg: #dbeafe;
  --slot-available-border: #93c5fd;
  --slot-booked-bg: #1e3a8a;
  --slot-booked-border: #1e40af;
  --slot-blocked-bg: #f3f4f6;
  --slot-blocked-border: #d1d5db;
}

.dark-mode {
  --slot-available-bg: #115e59;
  --slot-available-border: #14b8a6;
  --slot-booked-bg: #064e3b;
  --slot-booked-border: #047857;
  --slot-blocked-bg: #374151;
  --slot-blocked-border: #4b5563;
}
```

## 4. Estrutura de Dados

### 4.1 Modelo de Faixa de Horário
```typescript
interface TimeRange {
  id: string;
  dayOfWeek: number; // 0-6 (Domingo-Sábado)
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  duration: number;  // minutos (15-180)
  interval: number;  // minutos (0-60)
  modalities: string[]; // ['presencial', 'telemedicina', 'domiciliar']
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 Modelo de Slot de Tempo
```typescript
interface TimeSlot {
  id: string;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  modality: string[];
  status: 'available' | 'booked' | 'blocked' | 'cancelled';
  type: 'auto' | 'manual'; // gerado automaticamente ou criado manualmente
  
  // Relacionamento com paciente (se agendado)
  booking?: {
    patientId: string;
    patientName: string;
    bookingId: string;
    bookedAt: string;
    status: 'confirmed' | 'pending' | 'cancelled';
  };
  
  // Metadados
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  rangeId?: string; // ID da faixa que gerou este slot
}
```

### 4.3 Validações de Negócio
```typescript
class SlotValidator {
  static validateTimeRange(range: TimeRange): ValidationResult {
    // Verificar se startTime < endTime
    // Verificar se duration é múltiplo de 15
    // Verificar se interval é múltiplo de 5
    // Verificar conflitos com outras faixas do mesmo dia
  }
  
  static validateSlot(slot: TimeSlot, existingSlots: TimeSlot[]): ValidationResult {
    // Verificar sobreposição com outros slots
    // Verificar se está dentro de uma faixa válida
    // Verificar se a modalidade é válida
    // Verificar se o status é válido
  }
  
  static checkConflicts(slot: TimeSlot, existingSlots: TimeSlot[]): TimeSlot[] {
    // Retornar lista de slots conflitantes
  }
}
```

## 5. Componentes e Funcionalidades

### 5.1 WeeklyTimeGrid Component
```jsx
const WeeklyTimeGrid = () => {
  const { timeSlots, selectedWeek, isCreatingSlot } = useTimeSlotStore();
  const { isDarkMode } = useThemeStore();
  
  return (
    <div className="weekly-time-grid">
      {/* Header com dias da semana */}
      <TimeGridHeader />
      
      {/* Grid de horários */}
      <div className="grid grid-cols-8 gap-px bg-theme-border">
        {/* Coluna de horas */}
        <TimeLabels />
        
        {/* Colunas dos dias */}
        {weekDays.map((day, index) => (
          <DayColumn 
            key={day}
            dayIndex={index}
            slots={getSlotsForDay(day)}
            onSlotClick={handleSlotClick}
            onSlotDrag={handleSlotDrag}
          />
        ))}
      </div>
      
      {/* Preview do slot sendo criado */}
      {isCreatingSlot && <SlotPreview />}
    </div>
  );
};
```

### 5.2 TimeSlotConfig Component
```jsx
const TimeSlotConfig = () => {
  const { timeRanges, addTimeRange, removeTimeRange } = useTimeSlotStore();
  
  return (
    <Card className="bg-theme-card border-theme-border">
      <CardHeader>
        <CardTitle>Configuração de Faixas Horárias</CardTitle>
      </CardHeader>
      <CardContent>
        {weekDays.map((day, index) => (
          <DayConfigSection
            key={day}
            dayName={day}
            dayIndex={index}
            ranges={timeRanges[index] || []}
            onAddRange={(range) => addTimeRange(index, range)}
            onRemoveRange={(rangeId) => removeTimeRange(index, rangeId)}
          />
        ))}
        
        <Button onClick={generateSlotsFromRanges}>
          Gerar Slots Automaticamente
        </Button>
      </CardContent>
    </Card>
  );
};
```

## 6. Integração com Sistema Existente

### 6.1 Atualização do Estado Global
```javascript
// Atualizar o store existente para incluir time slots
const useGlobalStore = create((set, get) => ({
  ...existingState,
  
  // Integrar com timeSlotStore
  timeSlotStore: useTimeSlotStore.getState(),
  
  // Ações combinadas
  saveAgendaData: () => {
    const { availability, timeSlots } = get();
    localStorage.setItem('agendaData', JSON.stringify({
      availability,
      timeSlots
    }));
  },
  
  loadAgendaData: () => {
    try {
      const data = localStorage.getItem('agendaData');
      if (data) {
        const parsed = JSON.parse(data);
        set({
          availability: parsed.availability || {},
          timeSlots: parsed.timeSlots || []
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados da agenda:', error);
    }
  }
}));
```

### 6.2 Estilos com Tailwind CSS
```css
/* Classes utilitárias para slots */
.slot-available {
  @apply bg-slot-available-bg border-slot-available-border text-slot-available-text;
}

.slot-booked {
  @apply bg-slot-booked-bg border-slot-booked-border text-slot-booked-text;
}

.slot-blocked {
  @apply bg-slot-blocked-bg border-slot-blocked-border text-slot-blocked-text;
}

.slot-creating {
  @apply opacity-75 ring-2 ring-theme-accent;
}

/* Animações */
@keyframes slot-create {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.slot-enter {
  animation: slot-create 0.2s ease-out;
}
```

## 7. Validações e Regras de Negócio

### 7.1 Validações de Horário
```javascript
const validateTimeSlot = (slot, existingSlots) => {
  const errors = [];
  
  // Validar formato de hora
  if (!isValidTimeFormat(slot.startTime) || !isValidTimeFormat(slot.endTime)) {
    errors.push('Formato de horário inválido');
  }
  
  // Validar ordem de horários
  if (slot.startTime >= slot.endTime) {
    errors.push('Horário de início deve ser anterior ao horário de fim');
  }
  
  // Validar sobreposição
  const conflicts = checkTimeConflicts(slot, existingSlots);
  if (conflicts.length > 0) {
    errors.push(`Conflito com ${conflicts.length} slot(s) existente(s)`);
  }
  
  // Validar dentro de faixa permitida
  if (!isWithinAllowedRange(slot)) {
    errors.push('Slot fora das faixas horárias permitidas');
  }
  
  return errors;
};
```

### 7.2 Regras de Negócio
1. **Duração mínima**: 15 minutos
2. **Duração máxima**: 4 horas (240 minutos)
3. **Intervalo mínimo**: 0 minutos
4. **Intervalo máximo**: 60 minutos
5. **Slots devem ser múltiplos de 15 minutos**
6. **Não permitir sobreposição de slots ativos**
7. **Máximo de 3 faixas por dia**
8. **Horário permitido: 06:00 às 22:00**

## 8. Testes Sugeridos

### 8.1 Testes Unitários
```javascript
describe('TimeSlot Validation', () => {
  test('should reject invalid time format', () => {
    const invalidSlot = { startTime: '25:00', endTime: '26:00' };
    expect(validateTimeSlot(invalidSlot)).toContain('Formato inválido');
  });
  
  test('should detect time conflicts', () => {
    const existing = [{ startTime: '08:00', endTime: '09:00' }];
    const newSlot = { startTime: '08:30', endTime: '09:30' };
    expect(checkTimeConflicts(newSlot, existing)).toHaveLength(1);
  });
});
```

### 8.2 Testes de Integração
```javascript
describe('WeeklyTimeGrid Integration', () => {
  test('should create slot on drag', async () => {
    const { getByTestId } = render(<WeeklyTimeGrid />);
    const dayColumn = getByTestId('day-column-0');
    
    // Simular drag and drop
    fireEvent.mouseDown(dayColumn, { clientY: 100 });
    fireEvent.mouseMove(dayColumn, { clientY: 200 });
    fireEvent.mouseUp(dayColumn);
    
    expect(screen.getByTestId('slot-preview')).toBeInTheDocument();
  });
});
```

### 8.3 Testes de Acessibilidade
- Navegação por teclado (Tab, Enter, Escape)
- Anúncios de screen reader para mudanças
- Contraste de cores WCAG 2.1 AA
- Focus indicators visuais

## 9. Considerações de Performance

### 9.1 Otimizações
1. **Virtualização do grid** para muitos slots
2. **Memoização de cálculos de conflito**
3. **Debouncing em validações**
4. **Lazy loading de dados históricos**

### 9.2 Métricas de Performance
- Tempo de renderização inicial < 100ms
- Tempo de validação < 50ms
- Tempo de salvamento < 200ms
- FPS durante interação > 30

## 10. Próximos Passos

### Fase 1: Implementação Básica (1-2 semanas)
1. Criar componentes base do grid visual
2. Implementar sistema de faixas horárias
3. Adicionar validações básicas
4. Integrar com tema existente

### Fase 2: Funcionalidades Avançadas (2-3 semanas)
1. Implementar drag and drop
2. Adicionar múltiplas modalidades
3. Sistema de conflitos inteligente
4. Geração automática de slots

### Fase 3: Polimento e Otimização (1 semana)
1. Animações e transições
2. Testes completos
3. Otimização de performance
4. Documentação final

### Fase 4: Integração com Pacientes (Futuro)
1. Interface para agendamento
2. Notificações de confirmação
3. Sistema de cancelamento
4. Histórico de agendamentos