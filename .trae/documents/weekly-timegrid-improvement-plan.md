# WeeklyTimeGrid Component Improvement Plan

## 1. Requirements Analysis

### 1.1 Core Requirements
- **Navigation**: Selected day always centered with day-by-day arrow navigation
- **Theming**: Green theme for dark mode, blue theme for bright mode with transparency
- **Color Coding**: Light shades for available slots, dark shades for booked appointments
- **Marking Modes**: Only one mode active at a time (disponibilizar horarios vs agendar paciente)
- **Input Fields**: Duration (default 30min) and interval (default 0min) inputs when marking mode active
- **Bidirectional Sync**: Slots created via drag-and-drop must reflect in daily agenda divs and vice versa

### 1.2 Technical Requirements
- Support both dark and bright themes
- Maintain existing drag-and-drop functionality
- Integrate with existing timeSlotStore
- Preserve current performance characteristics
- Ensure backward compatibility

## 2. Current Component Analysis

### 2.1 WeeklyTimeGrid.jsx Structure
- **State Management**: Uses useTimeSlotStore for global state
- **Grid System**: 24-hour grid with configurable step intervals
- **Drag & Drop**: Mouse-based time slot creation
- **Navigation**: Week-based navigation (currently)
- **Theming**: Basic dark/light mode support

### 2.2 timeSlotStore.js Capabilities
- Slot CRUD operations
- Week/day management
- Conflict detection
- Backend integration
- Availability settings

### 2.3 Existing Issues Identified
1. Week-based navigation instead of day-centered
2. Fixed color scheme without transparency
3. No visual distinction between marking modes
4. Missing configuration UI for duration/interval
5. Limited integration with daily agenda components

## 3. Implementation Plan

### 3.1 Navigation System Refactoring

#### Current State
- Week-based navigation with previous/next week buttons
- Selected week stored in store

#### Target State
- Day-centered navigation with 7-day view
- Selected day always in center (position 3)
- Arrow buttons move one day at a time
- Visual indicators for current position

#### Implementation Steps
```javascript
// New navigation logic
const getWeekDays = () => {
  const centerDay = new Date(selectedWeek);
  const days = [];
  for (let i = -3; i <= 3; i++) {
    const day = new Date(centerDay);
    day.setDate(centerDay.getDate() + i);
    days.push(day);
  }
  return days;
};

// Update selectedWeek when navigating
const navigateDay = (direction) => {
  setSelectedWeek(prev => {
    const newDate = new Date(prev);
    newDate.setDate(newDate.getDate() + direction);
    return newDate;
  });
};
```

### 3.2 Enhanced Color System

#### Dark Mode (Green Theme)
- Available slots: `bg-green-500/30 border-green-400/50 text-green-100`
- Booked slots: `bg-green-700/50 border-green-600/70 text-green-100`
- Preview available: `bg-green-400/20 border-green-300/40`
- Preview booked: `bg-green-600/40 border-green-500/60`

#### Light Mode (Blue Theme)
- Available slots: `bg-blue-300/40 border-blue-400/60 text-blue-900`
- Booked slots: `bg-blue-600/60 border-blue-700/80 text-white`
- Preview available: `bg-blue-200/30 border-blue-300/50`
- Preview booked: `bg-blue-500/50 border-blue-600/70`

#### Implementation
```javascript
const getSlotColors = (status, isPreview = false) => {
  const prefix = isPreview ? 'preview-' : '';
  
  if (isDarkMode) {
    const colors = {
      'available': 'bg-green-500/30 border-green-400/50 text-green-100',
      'booked': 'bg-green-700/50 border-green-600/70 text-green-100',
      'preview-available': 'bg-green-400/20 border-green-300/40',
      'preview-booked': 'bg-green-600/40 border-green-500/60'
    };
    return colors[prefix + status];
  } else {
    const colors = {
      'available': 'bg-blue-300/40 border-blue-400/60 text-blue-900',
      'booked': 'bg-blue-600/60 border-blue-700/80 text-white',
      'preview-available': 'bg-blue-200/30 border-blue-300/50',
      'preview-booked': 'bg-blue-500/50 border-blue-600/70'
    };
    return colors[prefix + status];
  }
};
```

### 3.3 Marking Mode Configuration

#### New Component: MarkingModeConfig
```jsx
const MarkingModeConfig = ({ isDarkMode }) => {
  const { markingMode, setMarkingMode, appointmentDuration, setAppointmentDuration, intervalBetween, setIntervalBetween } = useTimeSlotStore();
  
  if (!markingMode) return null;
  
  return (
    <div className={`grid grid-cols-2 gap-4 p-4 mb-4 rounded-lg ${
      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-300'
    }`}>
      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Duração da Consulta (min):
        </label>
        <input
          type="number"
          min="5"
          max="180"
          step="5"
          value={appointmentDuration}
          onChange={(e) => setAppointmentDuration(Number(e.target.value))}
          className={`w-full px-3 py-2 text-sm border rounded-md ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500' 
              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
          }`}
        />
      </div>
      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Intervalo Entre Consultas (min):
        </label>
        <input
          type="number"
          min="0"
          max="60"
          step="5"
          value={intervalBetween}
          onChange={(e) => setIntervalBetween(Number(e.target.value))}
          className={`w-full px-3 py-2 text-sm border rounded-md ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500' 
              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
          }`}
        />
      </div>
    </div>
  );
};
```

### 3.4 Mode Selection Buttons

#### Enhanced Mode Buttons
```jsx
const ModeSelector = ({ isDarkMode }) => {
  const { markingMode, setMarkingMode } = useTimeSlotStore();
  
  const handleModeToggle = (mode) => {
    // Toggle mode or set to null if already selected
    setMarkingMode(markingMode === mode ? null : mode);
  };
  
  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleModeToggle('available')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
          markingMode === 'available'
            ? isDarkMode
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-blue-500 text-white shadow-lg'
            : isDarkMode
              ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        Disponibilizar Horários
      </button>
      <button
        onClick={() => handleModeToggle('booked')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
          markingMode === 'booked'
            ? isDarkMode
              ? 'bg-green-700 text-white shadow-lg'
              : 'bg-blue-600 text-white shadow-lg'
            : isDarkMode
              ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        Agendar Paciente
      </button>
    </div>
  );
};
```

### 3.5 Store Enhancements

#### New Store Properties
```javascript
// Add to timeSlotStore.js
const useTimeSlotStore = create((set, get) => ({
  // ... existing properties ...
  
  // New properties for enhanced functionality
  appointmentDuration: 30,
  intervalBetween: 0,
  
  // New actions
  setAppointmentDuration: (duration) => set({ appointmentDuration: duration }),
  setIntervalBetween: (interval) => set({ intervalBetween: interval }),
  
  // Enhanced slot creation with duration and interval
  createSlotsFromRange: async (day, startDate, endDate, mode) => {
    const { appointmentDuration, intervalBetween } = get();
    const totalDuration = appointmentDuration + intervalBetween;
    const totalMinutes = (endDate.getTime() - startDate.getTime()) / (60 * 1000);
    
    if (totalDuration === 0) return;
    
    const count = Math.floor(totalMinutes / totalDuration);
    let currentStart = new Date(startDate);
    
    // Remove conflicting slots if booking
    if (mode === 'booked') {
      const dayStr = formatDate(day);
      const conflictingSlots = get().timeSlots.filter(slot => {
        if (slot.date !== dayStr) return false;
        const slotStart = timeToMinutes(slot.startTime);
        const slotEnd = timeToMinutes(slot.endTime);
        const rangeStart = timeToMinutes(startDate.toTimeString().slice(0, 5));
        const rangeEnd = timeToMinutes(endDate.toTimeString().slice(0, 5));
        return (slotStart < rangeEnd && slotEnd > rangeStart);
      });
      conflictingSlots.forEach(slot => get().removeSlot(slot.id));
    }
    
    // Create slots with proper duration and intervals
    for (let i = 0; i < count; i++) {
      const appointmentEnd = new Date(currentStart.getTime() + appointmentDuration * 60 * 1000);
      
      await get().createSlotInBackend({
        date: day,
        start: currentStart,
        end: appointmentEnd,
        status: mode,
        patientName: mode === 'booked' ? 'Paciente' : ''
      });
      
      currentStart = new Date(appointmentEnd.getTime() + intervalBetween * 60 * 1000);
    }
  }
}));
```

### 3.6 Bidirectional Synchronization

#### Integration with Daily Agenda Components
```javascript
// Enhanced slot creation that triggers external updates
const createSlotInBackend = async (slotData) => {
  const newSlot = {
    id: generateId(),
    date: formatDate(slotData.date),
    startTime: slotData.start.toTimeString().slice(0, 5),
    endTime: slotData.end.toTimeString().slice(0, 5),
    status: slotData.status || 'available',
    patientName: slotData.patientName || ''
  };
  
  // Update local state
  set(state => ({
    timeSlots: [...state.timeSlots, newSlot]
  }));
  
  // Trigger external update event
  window.dispatchEvent(new CustomEvent('timeSlotsUpdated', {
    detail: { action: 'create', slot: newSlot }
  }));
  
  return newSlot;
};

// Listen for external updates
useEffect(() => {
  const handleExternalUpdate = (event) => {
    const { action, slot } = event.detail;
    if (action === 'create') {
      // Slot was created externally, update if not already present
      set(state => {
        const exists = state.timeSlots.some(s => s.id === slot.id);
        if (!exists) {
          return { timeSlots: [...state.timeSlots, slot] };
        }
        return state;
      });
    }
  };
  
  window.addEventListener('timeSlotsUpdated', handleExternalUpdate);
  return () => window.removeEventListener('timeSlotsUpdated', handleExternalUpdate);
}, []);
```

### 3.7 Enhanced Preview System

#### Improved Preview with Duration/Interval Support
```javascript
const getPreviewSlots = () => {
  if (!previewSlot) return [];
  
  const { appointmentDuration, intervalBetween } = get();
  const totalDuration = appointmentDuration + intervalBetween;
  if (totalDuration === 0) return [];
  
  const totalMinutes = previewSlot.eSnap - previewSlot.sSnap;
  const count = Math.floor(totalMinutes / totalDuration);
  
  const slots = [];
  let currentStart = previewSlot.sSnap;
  
  for (let i = 0; i < count; i++) {
    const currentEnd = currentStart + appointmentDuration;
    slots.push({
      start: currentStart,
      end: currentEnd,
      gapEnd: currentEnd + intervalBetween
    });
    currentStart = currentEnd + intervalBetween;
  }
  
  return slots;
};

// Render preview slots with proper styling
{previewSlots.map((preview, idx) => {
  const top = (preview.start / GRID_STEP_MINUTES) * rowHeight;
  const height = ((preview.end - preview.start) / GRID_STEP_MINUTES) * rowHeight;
  
  return (
    <div
      key={`preview-${idx}`}
      className={`absolute rounded-sm border-2 border-dashed ${
        markingMode === 'available'
          ? isDarkMode
            ? 'bg-green-400/20 border-green-300'
            : 'bg-blue-200/30 border-blue-300'
          : isDarkMode
            ? 'bg-green-600/40 border-green-500'
            : 'bg-blue-500/50 border-blue-600'
      }`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: '2px',
        right: '2px'
      }}
    />
  );
})}
```

## 4. Component Structure Updates

### 4.1 Main Component Layout
```jsx
const WeeklyTimeGrid = ({ selectedDate }) => {
  // ... existing setup ...
  
  return (
    <Card className={`w-full ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>
      <CardContent className="p-4">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-4">
          <DayNavigation isDarkMode={isDarkMode} />
          <ModeSelector isDarkMode={isDarkMode} />
          <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        </div>
        
        {/* Configuration Panel */}
        <MarkingModeConfig isDarkMode={isDarkMode} />
        
        {/* Day Headers */}
        <DayHeaders weekDays={weekDays} isDarkMode={isDarkMode} />
        
        {/* Time Grid */}
        <TimeGrid 
          isDarkMode={isDarkMode}
          weekDays={weekDays}
          // ... other props ...
        />
      </CardContent>
    </Card>
  );
};
```

### 4.2 Sub-components
1. **DayNavigation**: Handles centered day navigation
2. **ModeSelector**: Manages marking mode selection
3. **ThemeToggle**: Dark/light mode switch
4. **MarkingModeConfig**: Duration/interval inputs
5. **DayHeaders**: Enhanced day header display
6. **TimeGrid**: Main grid with slots and previews

## 5. Testing Strategy

### 5.1 Unit Tests
- Navigation logic (day centering)
- Color scheme application
- Duration/interval calculations
- Mode switching behavior
- Preview slot generation

### 5.2 Integration Tests
- Bidirectional synchronization
- Drag-and-drop with new settings
- Theme switching persistence
- External component updates

### 5.3 User Experience Tests
- Visual feedback for different modes
- Responsive behavior
- Accessibility compliance
- Performance under load

## 6. Deployment Considerations

### 6.1 Backward Compatibility
- Maintain existing API contracts
- Graceful degradation for older browsers
- Migration path for existing data

### 6.2 Performance
- Optimize re-renders with React.memo
- Use CSS transitions for smooth animations
- Implement virtual scrolling if needed

### 6.3 Accessibility
- ARIA labels for interactive elements
- Keyboard navigation support
- High contrast mode support
- Screen reader compatibility

## 7. Future Enhancements

### 7.1 Advanced Features
- Multi-day slot selection
- Recurring appointment patterns
- Resource scheduling (multiple rooms/providers)
- Conflict resolution UI

### 7.2 Integration Improvements
- Real-time synchronization
- Offline capability
- Export/import functionality
- Analytics and reporting