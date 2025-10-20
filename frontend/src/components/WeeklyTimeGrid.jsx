import React, { useState, useRef, useEffect } from 'react';
import { useTimeSlotStore } from '../stores/timeSlotStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

const WeeklyTimeGrid = ({ selectedDate }) => {
  const {
    timeSlots,
    selectedWeek,
    isCreatingSlot,
    draggedSlot,
    getWeekDays,
    getSlotsForDay,
    addManualSlot,
    setIsCreatingSlot,
    setDraggedSlot,
    checkConflicts,
    timeRanges,
    loadSlotsForWeek,
    createSlotInBackend,
    markingMode,
    setMarkingMode,
    removeSlot,
    updateSlotStatus,
    updateSlotBooking,
    bookSlot,
    updateSlotInBackend,
    availabilitySettings
  } = useTimeSlotStore();

  // Corrige ReferenceError: weekDays is not defined
  const weekDays = getWeekDays();
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const gridRef = useRef(null);
  const headerRef = useRef(null);
  const dayHeaderRefs = useRef([]);
  const [dayColumns, setDayColumns] = useState([]);
  const [timelineOffsetTop, setTimelineOffsetTop] = useState(0);
  // Seleção de slots (sempre slot-a-slot)
  const [selectedSlotIds, setSelectedSlotIds] = useState(new Set());

  useEffect(() => {
    // Carregar slots da semana ao alterar semana selecionada
    loadSlotsForWeek();
  }, [selectedWeek, loadSlotsForWeek]);

  // Medir altura do header e colunas (left/width) para alinhar overlays
  useEffect(() => {
    const measureHeader = () => {
      if (headerRef.current) {
        const headerRect = headerRef.current.getBoundingClientRect();
        const gridRect = gridRef.current?.getBoundingClientRect();
        if (gridRect) {
          // Precisão: offset = bottom do header relativo ao topo do grid
          setTimelineOffsetTop(headerRect.bottom - gridRect.top);
        }
      }
    };

    const measureColumns = () => {
      if (!gridRef.current || !headerRef.current) return;
      const gridRect = gridRef.current.getBoundingClientRect();
      const cols = (dayHeaderRefs.current || []).map((el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left - gridRect.left, width: r.width };
      });
      setDayColumns(cols);
    };

    measureHeader();
    measureColumns();
    window.addEventListener('resize', measureHeader);
    window.addEventListener('resize', measureColumns);
    return () => {
      window.removeEventListener('resize', measureHeader);
      window.removeEventListener('resize', measureColumns);
    };
  }, []);

  useEffect(() => {
    // Limpar seleção ao trocar modo de marcação
    setSelectedSlotIds(new Set());
  }, [markingMode]);

  // Dinâmica de resolução da grade baseada no dia selecionado
  const GRID_START_MINUTES = 0; // início às 00:00
  const GRID_END_MINUTES = 24 * 60; // fim às 24:00
  const PIXELS_PER_MINUTE = 40 / 30; // mantém escala visual existente (40px por 30min)
  const selectedDayOfWeek = selectedDate ? selectedDate.getDay() : null;
  const activeRangesForSelectedDay = selectedDayOfWeek != null
    ? (timeRanges[selectedDayOfWeek] || []).filter(r => r.isActive !== false)
    : [];
  // Fonte única de verdade para passo da grade
  const GRID_STEP_MINUTES = Math.min(Math.max((availabilitySettings?.timeStep || 15), 5), 60);
  const rowHeight = GRID_STEP_MINUTES * PIXELS_PER_MINUTE // Removido Math.round para precisão exata;
  const TIME_COL_PX = 76;
  const GAP_PX = 1;
  const GRID_TEMPLATE = `${TIME_COL_PX}px repeat(7, 1fr)`;
  const CELL_ROWS = Math.floor((GRID_END_MINUTES - GRID_START_MINUTES) / GRID_STEP_MINUTES);
  const LINE_COUNT = CELL_ROWS + 1;
  const PIXEL_NUDGE = 0.5;
  const toLabel = (minutes) => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Helper: usar o MESMO offset para overlay/linhas e cálculo do mouse
  const getOverlayOffsetTop = () => timelineOffsetTop + PIXEL_NUDGE;
  const EPS = 1e-6;
  const pxToMinutes = (yPx) => (yPx / rowHeight) * GRID_STEP_MINUTES;
  const getMinutesFromPosition = (clientY, snap = 'nearest') => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const y = clientY - rect.top - getOverlayOffsetTop();
    if (y < 0) return null;
    const raw = GRID_START_MINUTES + pxToMinutes(y);
    let snapped;
    if (snap === 'start') {
      snapped = Math.floor((raw + EPS) / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
    } else if (snap === 'end') {
      snapped = Math.ceil((raw - EPS) / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
    } else {
      snapped = Math.round(raw / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
    }
    return Math.max(GRID_START_MINUTES, Math.min(GRID_END_MINUTES, snapped));
  };
  const getSlotStyle = (slot, isSelected) => {
    const base = 'slot';
    const statusClass =
      slot.status === 'booked' ? 'slot-booked' :
      slot.status === 'available' ? 'slot-available' :
      'slot-blocked';
    const selectedClass = isSelected ? 'slot-selected' : '';
    return `${base} ${statusClass} ${selectedClass}`.trim();
  };

  const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (totalMinutes) => {
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const snapToStep = (minutes, mode = 'nearest') => {
    if (mode === 'start') {
      // Para início: arredondar para baixo (floor)
      return Math.floor(minutes / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
    } else if (mode === 'end') {
      // Para fim: arredondar para cima (ceil)
      return Math.ceil(minutes / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
    } else {
      // Para nearest: arredondar para o mais próximo
      return Math.round(minutes / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
    }
  };

  const getTimeFromPosition = (clientY, snapMode = 'nearest') => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const y = clientY - rect.top - timelineOffsetTop;
    if (y < 0) return null;
    // Converter posição em índice de step usando altura real da linha
    const stepIndex = Math.floor(y / rowHeight);
    const stepIndexSafe = Math.max(0, Math.min(CELL_ROWS, stepIndex));
    const minutesFromStart = GRID_START_MINUTES + stepIndexSafe * GRID_STEP_MINUTES;
    const snapped = snapToStep(minutesFromStart, snapMode);
    const clamped = Math.max(GRID_START_MINUTES, Math.min(GRID_END_MINUTES, snapped));
    return minutesToTime(clamped);
  };

  const getSlotPosition = (slot) => {
    const startMinutes = timeToMinutes(slot.startTime);
    const endMinutes = timeToMinutes(slot.endTime);
  
    const sSnap = snapToStep(startMinutes, 'start');
    const eSnap = snapToStep(endMinutes, 'end');
  
    // SINCRONIZAR com sistema de grid: usar rowHeight em vez de PIXELS_PER_MINUTE
    const startIdx = Math.round((sSnap - GRID_START_MINUTES) / GRID_STEP_MINUTES);
    const endIdx = Math.round((eSnap - GRID_START_MINUTES) / GRID_STEP_MINUTES);
    
    const top = startIdx * rowHeight; // Usar rowHeight real, não PIXELS_PER_MINUTE
    const height = Math.max(endIdx - startIdx, 1) * rowHeight;
  
    return { top, height, sSnap, eSnap };
  };

  // NOVO: posição dos slots em índices de grid (vertical) e linhas explícitas
  const getSlotGridPos = (slot) => {
    const step = GRID_STEP_MINUTES;
    const startMin = timeToMinutes(slot.startTime);
    const endMin = timeToMinutes(slot.endTime);
    const sSnap = snapToStep(startMin, 'start');
    const eSnap = snapToStep(endMin, 'end');
    
    // CORREÇÃO: usar os minutos snapped para calcular índices, não os originais
    const sIdx = Math.max(0, Math.min(CELL_ROWS - 1, Math.round((sSnap - GRID_START_MINUTES) / step)));
    const eIdx = Math.max(0, Math.min(CELL_ROWS, Math.round((eSnap - GRID_START_MINUTES) / step)));
    const span = Math.max(1, eIdx - sIdx);
    
    // Retornar também as linhas do CSS grid (1-based)
    // CORREÇÃO: CSS Grid usa end exclusivo, então +1 para incluir a linha final
    const sLine = sIdx + 1;
    const eLine = eIdx + 2; // +2 porque eIdx já é +1 e precisamos de mais +1 para inclusão
    
    return { sIdx, eIdx, span, sSnap, eSnap, sLine, eLine };
  };

  const handleMouseDown = (dayIndex, e) => {
    if (e.target !== e.currentTarget) return;
    if (!markingMode) return; // não inicia arrasto sem modo ativo
    const m = getMinutesFromPosition(e.clientY, 'start');
    if (m == null) return;
    setDragStart({ dayIndex, minutes: m });
    setDragEnd({ dayIndex, minutes: m });
    setIsDragging(true);
    setIsCreatingSlot(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !dragStart) return;
    const m = getMinutesFromPosition(e.clientY, 'end');
    if (m == null) return;
    setDragEnd({ dayIndex: dragStart.dayIndex, minutes: m });
  };

  const handleMouseUp = async () => {
    if (!markingMode) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      setIsCreatingSlot(false);
      return;
    }
    if (!isDragging || !dragStart || !dragEnd) return;
    
    const sMin = dragStart.minutes;
    const eMin = dragEnd.minutes;
    
    if (Math.abs(eMin - sMin) < GRID_STEP_MINUTES) {
      // Mínimo igual ao passo da grade
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      setIsCreatingSlot(false);
      return;
    }
    
    const startMin = Math.min(sMin, eMin);
    const endMin   = Math.max(sMin, eMin);

    // snap consistente
    const sSnap = snapToStep(startMin, 'start');
    const eSnap = snapToStep(endMin,   'end');
    
    const startTime = minutesToTime(sSnap);
    const endTime   = minutesToTime(eSnap);
    
    const weekDay = weekDays[dragStart.dayIndex];
    const dateStr = format(weekDay, 'yyyy-MM-dd');
    
    const newSlot = {
      date: dateStr,
      startTime,
      endTime,
      modality: ['presencial'],
      status: markingMode === 'booking' ? 'booked' : 'available',
      booking: markingMode === 'booking' ? { patientName: 'sem nome' } : null
    };
    
    // Verificar conflitos
    const conflicts = checkConflicts(newSlot);

    if (markingMode === 'booking') {
      const hardConflicts = conflicts.filter(c => c.status === 'booked' || c.status === 'blocked');
      if (hardConflicts.length > 0) {
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        setIsCreatingSlot(false);
        return;
      }
    }

    try {
      if (markingMode === 'booking') {
        await bookSlot(newSlot);
      } else {
        await addManualSlot(newSlot);
        await createSlotInBackend(newSlot);
      }
    } catch (error) {
      console.error('Erro ao criar slot:', error);
    } finally {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      setIsCreatingSlot(false);
    }
  };

  const handleSlotClick = (slot, e) => {
    e.stopPropagation();
    // Seleção simples por slot com destaque
    setSelectedSlotIds(prev => {
      const next = new Set(prev);
      if (next.has(slot.id)) {
        next.delete(slot.id);
      } else {
        next.add(slot.id);
      }
      return next;
    });
  };

  const formatWeekDay = (date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'short', 
      day: 'numeric',
      month: 'short'
    });
  };

  const getPreviewSlot = () => {
    if (!dragStart || !dragEnd) return null;
    const s = dragStart.minutes;
    const e = dragEnd.minutes;
    if (Math.abs(e - s) < GRID_STEP_MINUTES) return null;

    const startMin = Math.min(s, e);
    const endMin   = Math.max(s, e);

    // snap consistente com blocos
    const sSnap = snapToStep(startMin, 'start');
    const eSnap = snapToStep(endMin,   'end');

    return { sSnap, eSnap, dayIndex: dragStart.dayIndex };
  };

  const previewSlot = getPreviewSlot();
  const isDarkModeUI = document.documentElement.classList.contains('dark-mode');

  return (
    <Card className="w-full bg-theme-card border-theme-border">

      <CardContent>
        <div 
          ref={gridRef}
          className="relative"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >

          {/* Linhas de vértice por step */}
          <div className="pointer-events-none absolute right-0" style={{ top: `${getOverlayOffsetTop()}px`, left: `${TIME_COL_PX + GAP_PX}px` }}>
            {Array.from({ length: LINE_COUNT }, (_, i) => {
              const m = GRID_START_MINUTES + i * GRID_STEP_MINUTES;
              const isMajor = (m % 60) === 0;
              return (
                <div
                  key={`v-${i}`}
                  style={{ 
                    position: 'absolute', 
                    left: 0, 
                    right: 0, 
                    top: `${i * rowHeight}px`,
                    borderTop: isMajor ? '1px solid #334155' : '1px dashed rgba(51, 65, 85, 0.7)'
                  }}
                />
              );
            })}
          </div>

          {/* Linhas de tempo (background) */}
          {Array.from({ length: CELL_ROWS }, (_, i) => (
            <div 
              key={`row-${i}`} 
              className="grid bg-theme-border" 
              style={{ gridTemplateColumns: GRID_TEMPLATE, columnGap: `${GAP_PX}px` }}
            >
              <div
                className="bg-theme-surface text-right text-xs text-theme-text opacity-70 flex items-center justify-end box-border"
                style={{ height: `${rowHeight}px`, padding: '0 0.5rem' }}
              >
                {toLabel(GRID_START_MINUTES + i * GRID_STEP_MINUTES)}
              </div>
              {weekDays.map((day, dayIndex) => (
                <div
                  key={`${dayIndex}-${i}`}
                  className={`bg-theme-card relative ${markingMode ? 'cursor-crosshair' : 'cursor-default'} hover:bg-theme-surface transition-colors box-border`}
                  style={{ height: `${rowHeight}px` }}
                  onMouseDown={(e) => handleMouseDown(dayIndex, e)}
                />
              ))}
            </div>
          ))}

          {/* SISTEMA DE DEBUG COMPLETO */}
          {false && ( // DESATIVAR DEBUG - MOSTRA REFERÊNCIAS EXATAS
            <>
              {/* Linhas de referência do grid */}
              <div
                className="absolute z-30 pointer-events-none"
                style={{
                  left: `${TIME_COL_PX + GAP_PX}px`,
                  right: 0,
                  top: `${getOverlayOffsetTop()}px`,
                  bottom: 0,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gridTemplateRows: `repeat(${CELL_ROWS}, ${rowHeight}px)`,
                  columnGap: `${GAP_PX}px`,
                }}
              >
                {Array.from({ length: CELL_ROWS }, (_, i) => (
                  <div
                    key={`debug-${i}`}
                    className="border-t-2 border-red-500 opacity-75"
                    style={{
                      gridColumn: '1 / -1',
                      gridRow: i + 1,
                    }}
                  >
                    <span className="text-red-600 text-xs bg-yellow-200 px-1 font-bold">
                      {toLabel(GRID_START_MINUTES + i * GRID_STEP_MINUTES)}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Marcadores de posição para slots */}
              <div
                className="absolute z-25 pointer-events-none"
                style={{
                  left: 0,
                  right: 0,
                  top: `${getOverlayOffsetTop()}px`,
                  bottom: 0,
                }}
              >
                {/* Marcadores de debug removidos para evitar conflito visual com slots reais */}
              </div>
            </>
          )}

          {/* Overlay único em CSS Grid (eventos + preview) */}
          <div
            className="absolute z-10 pointer-events-none"
            style={{
              left: 0,
              right: 0,
              top: `${getOverlayOffsetTop()}px`,
              bottom: 0,
              display: 'grid',
              gridTemplateColumns: GRID_TEMPLATE,
              gridTemplateRows: `repeat(${CELL_ROWS}, ${rowHeight}px)`,
              columnGap: `${GAP_PX}px`,
            }}
          >
            {weekDays.map((day, dayIndex) => {
              const slots = getSlotsForDay(day);
              const isDarkMode = document.documentElement.classList.contains('dark-mode');
              return slots.map((slot) => {
                const pos = getSlotGridPos(slot);
                const isSelected = selectedSlotIds.has(slot.id);
                return (
                  <div
                    key={slot.id}
                    className={`${getSlotStyle(slot, isSelected)} pointer-events-auto`}
                    style={{
                      gridColumn: dayIndex + 2, // 1 = horários, 2..8 = dias
                      gridRow: `${pos.sLine} / ${pos.eLine}`
                    }}
                    onClick={(e) => handleSlotClick(slot, e)}
                  >
                    <div className="p-1 h-full flex flex-col justify-between">
                      <div className="text-xs font-medium truncate">
                        {minutesToTime(pos.sSnap)} - {minutesToTime(pos.eSnap)}
                      </div>
                      {slot.modality && slot.modality.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {slot.modality.map((mod) => (
                            <Badge key={mod} variant="outline" className="text-xs">
                              {mod === 'presencial' ? 'Pres' : mod === 'telemedicina' ? 'Tele' : 'Dom'}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })}

            {previewSlot && (() => {
              // Usar a mesma função getSlotGridPos para consistência total
              const previewPos = getSlotGridPos({
                startTime: minutesToTime(previewSlot.sSnap),
                endTime: minutesToTime(previewSlot.eSnap)
              });
              return (
                <div
                  className="rounded-md pointer-events-none"
                  style={{
                    gridColumn: previewSlot.dayIndex + 2,
                    gridRow: `${previewPos.sLine} / ${previewPos.eLine}`,
                    background: 'rgba(16, 185, 129, 0.35)',
                    border: '2px solid rgba(16, 185, 129, 0.8)',
                  }}
                />
              );
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyTimeGrid;