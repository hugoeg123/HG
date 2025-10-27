import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Trash2, Edit2 } from 'lucide-react';

// Mock do store para demonstração
const useMockTimeSlotStore = () => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([
    { id: 1, date: '2025-10-20', startTime: '00:00', endTime: '00:30', status: 'available' },
    { id: 2, date: '2025-10-20', startTime: '01:30', endTime: '02:30', status: 'available' },
    { id: 3, date: '2025-10-21', startTime: '00:00', endTime: '00:30', status: 'available' },
    { id: 4, date: '2025-10-21', startTime: '00:45', endTime: '02:15', status: 'booked', patientName: 'João Silva' },
    { id: 5, date: '2025-10-22', startTime: '00:30', endTime: '02:00', status: 'available' },
    { id: 6, date: '2025-10-22', startTime: '01:30', endTime: '01:45', status: 'available' },
    { id: 7, date: '2025-10-23', startTime: '00:30', endTime: '01:00', status: 'available' },
    { id: 8, date: '2025-10-23', startTime: '00:15', endTime: '00:45', status: 'available' },
    { id: 9, date: '2025-10-23', startTime: '01:00', endTime: '02:00', status: 'available' },
    { id: 10, date: '2025-10-24', startTime: '01:00', endTime: '03:00', status: 'booked', patientName: 'Maria Santos' },
    { id: 11, date: '2025-10-26', startTime: '00:00', endTime: '02:15', status: 'available' },
  ]);

  const getWeekDays = () => {
    const start = new Date(selectedWeek);
    // Centralizar: pegar 3 dias antes e 3 dias depois
    start.setDate(start.getDate() - 3);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      return day;
    });
  };

  const createSlotInBackend = async (slotData) => {
    const newSlot = {
      id: Date.now() + Math.random(),
      date: slotData.date.toISOString().split('T')[0],
      startTime: slotData.start.toTimeString().slice(0, 5),
      endTime: slotData.end.toTimeString().slice(0, 5),
      status: slotData.status || 'available',
      patientName: slotData.patientName || ''
    };
    setTimeSlots(prev => [...prev, newSlot]);
    return newSlot;
  };

  const deleteSlot = (slotId) => {
    setTimeSlots(prev => prev.filter(s => s.id !== slotId));
  };

  const updateSlot = (slotId, updates) => {
    setTimeSlots(prev => prev.map(s => s.id === slotId ? { ...s, ...updates } : s));
  };

  return {
    selectedWeek,
    setSelectedWeek,
    timeSlots,
    getWeekDays,
    createSlotInBackend,
    deleteSlot,
    updateSlot,
    availabilitySettings: { timeStep: 15 }
  };
};

const WeeklyTimeGrid = () => {
  const {
    timeSlots,
    selectedWeek,
    getWeekDays,
    setSelectedWeek,
    createSlotInBackend,
    deleteSlot,
    updateSlot,
    availabilitySettings
  } = useMockTimeSlotStore();

  const weekDays = getWeekDays();
  const gridRef = useRef(null);
  const headerRef = useRef(null);
  const dayHeaderRefs = useRef([]);
  
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [timelineOffsetTop, setTimelineOffsetTop] = useState(0);
  const [rowHeight, setRowHeight] = useState(30);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Configurações de marcação
  const [markingMode, setMarkingMode] = useState(null); // null, 'available', 'booked'
  const [appointmentDuration, setAppointmentDuration] = useState(30);
  const [intervalBetween, setIntervalBetween] = useState(0);
  const [editingPatient, setEditingPatient] = useState(null);
  const [patientNameInput, setPatientNameInput] = useState('');

  const GRID_START_MINUTES = 0;
  const GRID_END_MINUTES = 24 * 60;
  const GRID_STEP_MINUTES = Math.min(Math.max((availabilitySettings?.timeStep || 15), 5), 60);
  const CELL_ROWS = Math.ceil((GRID_END_MINUTES - GRID_START_MINUTES) / GRID_STEP_MINUTES);
  const TIME_COL_PX = 60;
  const GRID_TEMPLATE = `${TIME_COL_PX}px repeat(7, 1fr)`;

  const isSameDay = (a, b) => {
    if (!(a instanceof Date) || !(b instanceof Date)) return false;
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const toLabel = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const timeToMinutes = (time) => {
    if (typeof time !== 'string') return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const snapToStep = (min, mode = 'start') => {
    const step = GRID_STEP_MINUTES;
    const base = GRID_START_MINUTES;
    const delta = min - base;
    if (mode === 'start') {
      return base + Math.floor(delta / step) * step;
    }
    return base + Math.ceil(delta / step) * step;
  };

  const getSlotPosition = (slot) => {
    const startMinutes = timeToMinutes(slot.startTime);
    const endMinutes = timeToMinutes(slot.endTime);
    
    const sSnap = snapToStep(startMinutes, 'start');
    const eSnap = snapToStep(endMinutes, 'end');
    
    const startIdx = Math.floor((sSnap - GRID_START_MINUTES) / GRID_STEP_MINUTES);
    const endIdx = Math.ceil((eSnap - GRID_START_MINUTES) / GRID_STEP_MINUTES);
    
    const top = startIdx * rowHeight;
    const height = Math.max((endIdx - startIdx) * rowHeight, rowHeight);
    
    return { top, height };
  };

  useEffect(() => {
    const measureHeader = () => {
      if (headerRef.current && gridRef.current) {
        const headerRect = headerRef.current.getBoundingClientRect();
        const gridRect = gridRef.current.getBoundingClientRect();
        setTimelineOffsetTop(headerRect.bottom - gridRect.top);
      }
    };

    measureHeader();
    const ro = new ResizeObserver(measureHeader);
    if (headerRef.current) ro.observe(headerRef.current);
    if (gridRef.current) ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, [selectedWeek]);

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setRowHeight(rh => Math.max(20, Math.min(60, rh + (e.deltaY > 0 ? -2 : 2))));
      }
    };
    const gridEl = gridRef.current;
    if (gridEl) {
      gridEl.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (gridEl) gridEl.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleMouseDown = (dayIndex, e) => {
    if (!markingMode) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top - timelineOffsetTop;
    const relY = Math.max(0, y);
    const minutesFromStart = GRID_START_MINUTES + Math.floor(relY / rowHeight) * GRID_STEP_MINUTES;
    
    setDragStart({ dayIndex, minutes: minutesFromStart });
    setDragEnd({ dayIndex, minutes: minutesFromStart });
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !dragStart) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top - timelineOffsetTop;
    const relY = Math.max(0, y);
    const minutesFromStart = GRID_START_MINUTES + Math.floor(relY / rowHeight) * GRID_STEP_MINUTES;
    
    setDragEnd({ dayIndex: dragStart.dayIndex, minutes: minutesFromStart });
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) return;
    setIsDragging(false);

    const s = dragStart.minutes;
    const e = dragEnd.minutes;
    
    if (Math.abs(e - s) < GRID_STEP_MINUTES) {
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const startMin = Math.min(s, e);
    const endMin = Math.max(s, e);
    const sSnap = snapToStep(startMin, 'start');
    const eSnap = snapToStep(endMin, 'end');

    const day = weekDays[dragStart.dayIndex];
    const startDate = new Date(day);
    startDate.setHours(Math.floor(sSnap / 60), sSnap % 60, 0, 0);
    
    const endDate = new Date(day);
    endDate.setHours(Math.floor(eSnap / 60), eSnap % 60, 0, 0);

    createSlotsFromSelection(day, startDate, endDate);
    
    setDragStart(null);
    setDragEnd(null);
  };

  const createSlotsFromSelection = async (day, startDate, endDate) => {
    const totalDuration = appointmentDuration + intervalBetween;
    const totalMinutes = (endDate.getTime() - startDate.getTime()) / (60 * 1000);
    
    if (totalDuration === 0) return;
    
    const count = Math.floor(totalMinutes / totalDuration);

    let currentStart = new Date(startDate);
    
    // Remover slots conflitantes se estiver agendando
    if (markingMode === 'booked') {
      const dayStr = formatDate(day);
      const conflictingSlots = timeSlots.filter(slot => {
        if (slot.date !== dayStr) return false;
        const slotStart = timeToMinutes(slot.startTime);
        const slotEnd = timeToMinutes(slot.endTime);
        const rangeStart = timeToMinutes(startDate.toTimeString().slice(0, 5));
        const rangeEnd = timeToMinutes(endDate.toTimeString().slice(0, 5));
        return (slotStart < rangeEnd && slotEnd > rangeStart);
      });
      conflictingSlots.forEach(slot => deleteSlot(slot.id));
    }

    for (let i = 0; i < count; i++) {
      const appointmentEnd = new Date(currentStart.getTime() + appointmentDuration * 60 * 1000);
      
      await createSlotInBackend({
        date: day,
        start: currentStart,
        end: appointmentEnd,
        status: markingMode,
        patientName: markingMode === 'booked' ? 'Paciente' : ''
      });
      
      currentStart = new Date(appointmentEnd.getTime() + intervalBetween * 60 * 1000);
    }
  };

  const handleSlotClick = (slot, e) => {
    e.stopPropagation();
    if (markingMode) return;
    setSelectedSlot(slot);
  };

  const handleDeleteSlot = (slotId) => {
    deleteSlot(slotId);
    setSelectedSlot(null);
  };

  const handleEditPatient = (slot) => {
    setEditingPatient(slot.id);
    setPatientNameInput(slot.patientName || '');
  };

  const handleSavePatientName = (slotId) => {
    updateSlot(slotId, { patientName: patientNameInput });
    setEditingPatient(null);
    setPatientNameInput('');
  };

  const handleMarkBooked = (slotId) => {
    updateSlot(slotId, { status: 'booked', patientName: 'Paciente' });
    setSelectedSlot(null);
  };

  const getPreviewSlot = () => {
    if (!dragStart || !dragEnd || !markingMode) return null;
    
    const s = dragStart.minutes;
    const e = dragEnd.minutes;
    
    if (Math.abs(e - s) < GRID_STEP_MINUTES) return null;

    const startMin = Math.min(s, e);
    const endMin = Math.max(s, e);
    const sSnap = snapToStep(startMin, 'start');
    const eSnap = snapToStep(endMin, 'end');

    return { sSnap, eSnap, dayIndex: dragStart.dayIndex };
  };

  const previewSlot = getPreviewSlot();

  // Calcular previews de slots individuais
  const getPreviewSlots = () => {
    if (!previewSlot) return [];
    
    const slots = [];
    const totalDuration = appointmentDuration + intervalBetween;
    if (totalDuration === 0) return [];
    
    const totalMinutes = previewSlot.eSnap - previewSlot.sSnap;
    const count = Math.floor(totalMinutes / totalDuration);
    
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

  const previewSlots = getPreviewSlots();

  const getSlotColors = (status) => {
    if (isDarkMode) {
      return status === 'available' 
        ? 'bg-green-500/40 border-green-400 text-green-100'
        : 'bg-green-700/50 border-green-600 text-green-100';
    } else {
      return status === 'available'
        ? 'bg-blue-300/50 border-blue-400 text-blue-900'
        : 'bg-blue-600/60 border-blue-700 text-white';
    }
  };

  const getPreviewColors = () => {
    if (isDarkMode) {
      return markingMode === 'available'
        ? 'bg-green-400/30 border-green-300'
        : 'bg-green-600/40 border-green-500';
    } else {
      return markingMode === 'available'
        ? 'bg-blue-200/40 border-blue-300'
        : 'bg-blue-500/50 border-blue-600';
    }
  };

  return (
    <div className="w-full space-y-4">
      <Card className={`border-gray-200 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <CardContent className="p-4">
          <div ref={headerRef}>
            {/* Barra de controles e navegação */}
            <div className="flex items-center justify-between mb-4 gap-4">
              {/* Navegação de Dias */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWeek(prev => {
                    const d = new Date(prev);
                    d.setDate(d.getDate() - 1);
                    return d;
                  })}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1 px-2">
                  {weekDays.map((date, idx) => {
                    const isCenter = idx === 3; // Dia do meio sempre selecionado
                    return (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all ${
                          isCenter 
                            ? isDarkMode ? 'bg-green-500 w-3 h-3' : 'bg-blue-500 w-3 h-3'
                            : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                        }`}
                      />
                    );
                  })}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWeek(prev => {
                    const d = new Date(prev);
                    d.setDate(d.getDate() + 1);
                    return d;
                  })}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Modos de Marcação */}
              <div className="flex gap-2">
                <Button
                  variant={markingMode === 'available' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarkingMode(markingMode === 'available' ? null : 'available')}
                  className={markingMode === 'available' ? (isDarkMode ? 'bg-green-600' : 'bg-blue-500') : ''}
                >
                  Abrir Horários
                </Button>
                <Button
                  variant={markingMode === 'booked' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarkingMode(markingMode === 'booked' ? null : 'booked')}
                  className={markingMode === 'booked' ? (isDarkMode ? 'bg-green-700' : 'bg-blue-600') : ''}
                >
                  Agendar
                </Button>
              </div>

              {/* Toggle Dark Mode */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </Button>
            </div>

            {/* Configurações de Duração */}
            {markingMode && (
              <div className="grid grid-cols-2 gap-4 p-3 mb-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Duração da Consulta (min):</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    step="5"
                    value={appointmentDuration}
                    onChange={(e) => setAppointmentDuration(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm border rounded"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Intervalo Entre Consultas (min):</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    step="5"
                    value={intervalBetween}
                    onChange={(e) => setIntervalBetween(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm border rounded"
                  />
                </div>
              </div>
            )}

            <div className="grid mb-2" style={{ gridTemplateColumns: GRID_TEMPLATE, columnGap: '0px' }}>
              <div className={`text-sm font-medium px-2 py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Horário
              </div>
              {weekDays.map((date, dayIndex) => {
                const isToday = isSameDay(date, new Date());
                const bgColor = isDarkMode
                  ? (dayIndex % 2 === 0 ? '#2D2D2D' : '#252525')
                  : (dayIndex % 2 === 0 ? '#F3F3F3' : '#E9E9E9');
                
                return (
                  <div
                    key={`day-header-${dayIndex}`}
                    ref={(el) => { dayHeaderRefs.current[dayIndex] = el; }}
                    className="flex flex-col items-center justify-center px-2 py-2 rounded-t-lg"
                    style={{ backgroundColor: bgColor }}
                  >
                    <span className={`text-xs capitalize ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </span>
                    <span className={`text-lg font-bold ${isToday ? (isDarkMode ? 'text-green-400' : 'text-blue-600') : (isDarkMode ? 'text-gray-200' : 'text-gray-800')}`}>
                      {date.getDate()}
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {date.toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            ref={gridRef}
            className={`relative border rounded-lg overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {Array.from({ length: CELL_ROWS }, (_, i) => (
              <div key={`row-${i}`} className="grid" style={{ gridTemplateColumns: GRID_TEMPLATE, columnGap: '0px' }}>
                <div
                  className={`text-right text-xs flex items-center justify-end px-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} border-r`}
                  style={{
                    height: `${rowHeight}px`,
                    backgroundColor: isDarkMode 
                      ? (i % 2 === 0 ? '#1F1F1F' : '#171717')
                      : (i % 2 === 0 ? '#F9F9F9' : '#FFFFFF'),
                    color: isDarkMode ? '#9CA3AF' : '#6B7280'
                  }}
                >
                  {toLabel(GRID_START_MINUTES + i * GRID_STEP_MINUTES)}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const isEvenRow = i % 2 === 0;
                  const isEvenCol = dayIndex % 2 === 0;
                  
                  let bgColor;
                  if (isDarkMode) {
                    if (isEvenRow) {
                      bgColor = isEvenCol ? '#1F1F1F' : '#171717';
                    } else {
                      bgColor = isEvenCol ? '#171717' : '#1F1F1F';
                    }
                  } else {
                    if (isEvenRow) {
                      bgColor = isEvenCol ? '#F9F9F9' : '#F3F3F3';
                    } else {
                      bgColor = isEvenCol ? '#F3F3F3' : '#F9F9F9';
                    }
                  }

                  return (
                    <div
                      key={`${dayIndex}-${i}`}
                      className={`relative transition-colors border-r border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} ${
                        markingMode ? 'cursor-crosshair' : 'cursor-default'
                      } ${markingMode ? (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-blue-50') : ''}`}
                      style={{ height: `${rowHeight}px`, backgroundColor: bgColor }}
                      onMouseDown={(e) => handleMouseDown(dayIndex, e)}
                    />
                  );
                })}
              </div>
            ))}

            {/* Preview dos slots sendo criados */}
            {previewSlot && previewSlots.length > 0 && (
              <div
                className="absolute z-20 pointer-events-none"
                style={{
                  left: `${TIME_COL_PX}px`,
                  right: 0,
                  top: `${timelineOffsetTop}px`
                }}
              >
                <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', columnGap: '0px' }}>
                  {weekDays.map((day, dayIndex) => (
                    <div key={`preview-${dayIndex}`} className="relative" style={{ height: `${CELL_ROWS * rowHeight}px` }}>
                      {dayIndex === previewSlot.dayIndex && previewSlots.map((slot, idx) => (
                        <React.Fragment key={idx}>
                          {/* Slot da consulta */}
                          <div
                            className={`absolute border-2 rounded ${getPreviewColors()}`}
                            style={{
                              top: `${(slot.start - GRID_START_MINUTES) / GRID_STEP_MINUTES * rowHeight}px`,
                              height: `${(slot.end - slot.start) / GRID_STEP_MINUTES * rowHeight}px`,
                              left: '2px',
                              right: '2px'
                            }}
                          >
                            <div className="text-xs font-semibold text-center pt-1">
                              {minutesToTime(slot.start)} - {minutesToTime(slot.end)}
                            </div>
                          </div>
                          {/* Gap entre consultas */}
                          {intervalBetween > 0 && (
                            <div
                              className={`absolute border-2 border-dashed rounded ${isDarkMode ? 'border-gray-600 bg-gray-800/20' : 'border-gray-400 bg-gray-300/20'}`}
                              style={{
                                top: `${(slot.end - GRID_START_MINUTES) / GRID_STEP_MINUTES * rowHeight}px`,
                                height: `${intervalBetween / GRID_STEP_MINUTES * rowHeight}px`,
                                left: '2px',
                                right: '2px'
                              }}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overlay dos slots existentes */}
            <div
              className="absolute z-10"
              style={{
                left: `${TIME_COL_PX}px`,
                right: 0,
                top: `${timelineOffsetTop}px`,
                pointerEvents: 'none'
              }}
            >
              <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', columnGap: '0px' }}>
                {weekDays.map((day, dayIndex) => {
                  const dayStr = formatDate(day);
                  const daySlots = timeSlots.filter(slot => slot.date === dayStr);

                  return (
                    <div key={`overlay-day-${dayIndex}`} className="relative" style={{ height: `${CELL_ROWS * rowHeight}px` }}>
                      {daySlots.map((slot) => {
                        const { top, height } = getSlotPosition(slot);
                        const isSelected = selectedSlot?.id === slot.id;
                        const isEditing = editingPatient === slot.id;

                        return (
                          <div
                            key={slot.id}
                            className={`absolute rounded shadow-md px-2 py-1 text-xs font-medium cursor-pointer transition-all border-2 ${getSlotColors(slot.status)} ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              left: '2px',
                              right: '2px',
                              pointerEvents: 'auto'
                            }}
                            onClick={(e) => handleSlotClick(slot, e)}
                            title={`${slot.startTime} - ${slot.endTime} ${slot.status === 'booked' ? `(${slot.patientName})` : ''}`}
                          >
                            <div className="flex flex-col justify-center h-full overflow-hidden">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={patientNameInput}
                                  onChange={(e) => setPatientNameInput(e.target.value)}
                                  onBlur={() => handleSavePatientName(slot.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSavePatientName(slot.id);
                                    if (e.key === 'Escape') { setEditingPatient(null); setPatientNameInput(''); }
                                  }}
                                  className="w-full px-1 py-0.5 text-xs bg-white text-black rounded"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <>
                                  <div className="truncate font-semibold">
                                    {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                                  </div>
                                  {slot.status === 'booked' && slot.patientName && (
                                    <div className="truncate text-xs opacity-90">
                                      {slot.patientName}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Painel de Ações do Slot Selecionado */}
      {selectedSlot && !markingMode && (
        <Card className={`${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">
                Slot Selecionado: {selectedSlot.startTime.substring(0, 5)} - {selectedSlot.endTime.substring(0, 5)}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSlot(null)}
              >
                ✕
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {selectedSlot.status === 'available' && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleMarkBooked(selectedSlot.id)}
                    className={isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                  >
                    ✅ Marcar como Agendado
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSlot(selectedSlot.id)}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Deletar
                  </Button>
                </>
              )}
              
              {selectedSlot.status === 'booked' && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleEditPatient(selectedSlot)}
                    className={isDarkMode ? 'bg-green-700 hover:bg-green-800' : 'bg-blue-700 hover:bg-blue-800'}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Editar Paciente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSlot(selectedSlot.id)}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Deletar
                  </Button>
                </>
              )}
            </div>
            
            {selectedSlot.status === 'booked' && selectedSlot.patientName && (
              <div className={`mt-3 p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="text-sm">
                  <span className="font-medium">Paciente:</span> {selectedSlot.patientName}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card className={`${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Instruções:</h3>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Selecione "Abrir Horários" ou "Agendar" para ativar o modo de marcação</li>
            <li>Arraste na grade para criar múltiplos slots de uma vez</li>
            <li>Configure a duração da consulta e intervalo entre consultas</li>
            <li>Agendar substitui horários livres na área selecionada</li>
            <li>Sem modo selecionado, clique nos slots para editar/deletar</li>
            <li>Use Ctrl + Scroll para fazer zoom na grade</li>
            <li>Use as setas ou os pontos para navegar entre dias</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyTimeGrid;