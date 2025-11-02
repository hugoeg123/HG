import React, { useState, useRef, useEffect } from 'react';
import { useTimeSlotStore } from '../stores/timeSlotStore';
import { usePatientStore } from '../store/patientStore.js';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
// Badge removido em favor de botões de ação no painel rápido
import MarkingModeConfig from './MarkingModeConfig';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * WeeklyTimeGrid Component
 *
 * Integrates with:
 * - stores/timeSlotStore.js for slots, duration/interval, appointments
 * - store/patientStore.js for patient list and quick-create
 * - LeftSidebar.jsx indirectly via patientStore state (no modifications here)
 *
 * Connector: Slot overlay panel adapts by slot status (available/booked)
 */
const WeeklyTimeGrid = ({ selectedDate }) => {
  const {
    timeSlots,
    selectedWeek,
    isCreatingSlot,
    draggedSlot,
    getCenteredWeekDays,
    getSlotsForDay,
    addManualSlot,
    setIsCreatingSlot,
    setDraggedSlot,
    checkConflicts,
    timeRanges,
    loadSlotsForWeek,
    createSlotInBackend,
    createSlotsFromRangeInBackend,
    createSlotsFromRangeWithSettings,
    updateSlotInBackend,
    deleteSlotInBackend,
    createAppointmentForSlot,
    confirmAppointmentPatientForSlot,
    cancelAppointmentForSlot,
    markingMode,
    setMarkingMode,
    setAppointmentDuration,
    setIntervalBetween,
    availabilitySettings,
    setSelectedWeek,
    appointmentDuration,
    intervalBetween
  } = useTimeSlotStore();

  // Pacientes para agendar
  const { patients, fetchPatients, createPatient, currentPatient } = usePatientStore();
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  useEffect(() => { fetchPatients?.(true); }, [fetchPatients]);

  // Use centered week days instead of traditional week view
  const weekDays = getCenteredWeekDays();
  // Helper para comparar dias com segurança
  const toDateSafe = (d) => (d instanceof Date ? d : new Date(d));
  const isSameDay = (a, b) => {
    const da = toDateSafe(a);
    const db = toDateSafe(b);
    if (!(da instanceof Date) || Number.isNaN(da.getTime()) || !(db instanceof Date) || Number.isNaN(db.getTime())) {
      return false;
    }
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  };
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const gridRef = useRef(null);
  const headerRef = useRef(null);
  const dayHeaderRefs = useRef([]);
  const adjacentPanelRef = useRef(null); // div justaposta acima da grid
  const [dayColumns, setDayColumns] = useState([]);
  const [timelineOffsetTop, setTimelineOffsetTop] = useState(0);
  const [rowHeight, setRowHeight] = useState(22);
  
  const PIXEL_NUDGE = 0.5;
  const getOverlayOffsetTop = () => timelineOffsetTop;

  const getPreviewSlot = () => {
    if (!dragStart || !dragEnd) return null;
    const s = dragStart.minutes;
    const e = dragEnd.minutes;
    if (Math.abs(e - s) < GRID_STEP_MINUTES) return null;
    
    const startMin = Math.min(s, e);
    const endMin = Math.max(s, e);
    
    return {
      dayIndex: dragStart.dayIndex,
      sSnap: snapToStep(startMin, 'start'),
      eSnap: snapToStep(endMin, 'end')
    };
  };
  // Seleção de slots (sempre slot-a-slot)
  const [selectedSlotIds, setSelectedSlotIds] = useState(new Set());
  const [previewSlot, setPreviewSlot] = useState(null);
  // Painel rápido: modos de exibição conforme status do slot
  const [panelMode, setPanelMode] = useState('available'); // 'available' | 'booking'
  // Toggle do painel de Configurações de Marcação
  const [showMarkingConfig, setShowMarkingConfig] = useState(false);
  // Sincronizar modo de marcação com a visibilidade do painel para evitar warnings
  useEffect(() => {
    if (showMarkingConfig) {
      if (!markingMode) setMarkingMode('availability');
    } else {
      if (markingMode) setMarkingMode(null);
    }
  }, [showMarkingConfig]);
  // Seleção exclusiva quando em modo Agendar/Appointment
  useEffect(() => {
    if (markingMode === 'booking' || markingMode === 'appointment') {
      setSelectedSlotIds(prev => {
        if (prev.size <= 1) return prev;
        const first = [...prev][0];
        return new Set([first]);
      });
    }
  }, [markingMode]);

  useEffect(() => {
    // Carregar slots da semana ao alterar semana selecionada
    loadSlotsForWeek();
  }, [selectedWeek, loadSlotsForWeek]);

  // Bidirectional sync: refresh weekly view on global slot updates
  useEffect(() => {
    const handler = (e) => {
      const action = e?.detail?.action;
      // Evitar recarregar imediatamente após criação, pois já adicionamos localmente
      if (action === 'update' || action === 'delete') {
        loadSlotsForWeek();
      }
    };
    window.addEventListener('timeSlotsUpdated', handler);
    return () => window.removeEventListener('timeSlotsUpdated', handler);
  }, [loadSlotsForWeek]);

  // Slot selecionado atual (primeiro da seleção)
  const selectedSlot = React.useMemo(() => {
    const firstId = selectedSlotIds && selectedSlotIds.size > 0 ? [...selectedSlotIds][0] : null;
    return firstId ? timeSlots.find(s => s.id === firstId) : null;
  }, [selectedSlotIds, timeSlots]);

  // Ajustar modo do painel conforme status do slot
  useEffect(() => {
    if (selectedSlot) {
      setPanelMode(selectedSlot.status === 'available' ? 'available' : 'booking');
    }
  }, [selectedSlot]);

  // Handlers do painel rápido
  const handleAgendarSelected = async () => {
    if (!selectedSlot) return;
    // No modo "booking" permitimos salvar o agendamento mesmo se o slot já estiver marcado como 'booked'
    if (panelMode === 'available' && selectedSlot.status !== 'available') {
      alert('Slot não está disponível para agendar.');
      return;
    }

    try {
      // Prioridade: importado > seleção > digitado
      const imported = currentPatient && currentPatient.id ? currentPatient : null;
      let patientId = null;
      let notes = '';
      const todayStr = new Date().toISOString().split('T')[0];

      if (imported) {
        patientId = imported.id;
        notes = imported?.name || '';
      } else if (selectedPatientId) {
        patientId = selectedPatientId;
        const selectedPatient = Array.isArray(patients) ? patients.find(p => String(p.id) === String(selectedPatientId)) : null;
        notes = selectedPatient?.name || (patientName || '').trim();
      } else {
        notes = (patientName || '').trim();
        if (!notes) {
          alert('Informe o nome ou selecione um paciente.');
          return;
        }
        // Criar paciente rapidamente com o nome informado
        const created = await createPatient({ 
          name: notes,
          dateOfBirth: todayStr,
          gender: 'não informado'
        });
        if (!created?.id) {
          alert('Falha ao criar paciente com o nome informado.');
          return;
        }
        patientId = created.id;
      }

      const res = await createAppointmentForSlot(selectedSlot.id, patientId, notes);
      if (!res?.success) {
        alert(`Falha ao agendar: ${res?.error || 'erro desconhecido'}`);
      } else {
        // Limpar seleção e inputs
        setSelectedSlotIds(new Set());
        setPatientName('');
        setSelectedPatientId('');
      }
    } catch (e) {
      alert(`Erro ao agendar: ${e?.message || 'erro desconhecido'}`);
    }
  };
  // Configurar consulta: atualiza duração/intervalo (endTime) sem alterar paciente
  const handleConfirmSelected = async () => {
    if (!selectedSlot) return;
    try {
      // Atualizar apenas endTime com base na duração atual
      const [sh, sm] = (selectedSlot.startTime || '00:00').split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      const newEndMinutes = startMinutes + Math.max(5, parseInt(appointmentDuration || 0, 10));
      const eh = Math.floor(newEndMinutes / 60);
      const em = newEndMinutes % 60;
      const endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

      const res = await updateSlotInBackend(selectedSlot.id, { endTime });
      if (!res?.success) {
        alert(`Falha ao atualizar duração: ${res?.error || 'erro desconhecido'}`);
        return;
      }
      // Ocultar painel
      setSelectedSlotIds(new Set());
    } catch (e) {
      alert(`Erro ao confirmar: ${e?.message || 'erro desconhecido'}`);
    }
  };

  // Confirmar Nome do paciente para slot agendado (atualiza appointment com paciente real)
  const handleConfirmPatientName = async () => {
    if (!selectedSlot || selectedSlot.status !== 'booked') return;
    try {
      // Prioridade: importado > seleção > digitado
      const imported = currentPatient && currentPatient.id ? currentPatient : null;
      let patientId = null;
      let notes = '';
      const todayStr = new Date().toISOString().split('T')[0];

      if (imported) {
        patientId = imported.id;
        notes = imported?.name || '';
      } else if (selectedPatientId) {
        patientId = selectedPatientId;
        const selectedPatient = Array.isArray(patients) ? patients.find(p => String(p.id) === String(selectedPatientId)) : null;
        notes = selectedPatient?.name || (patientName || '').trim();
      } else {
        notes = (patientName || '').trim();
        if (!notes) {
          alert('Informe o nome ou selecione um paciente.');
          return;
        }
        // Criar paciente rapidamente com o nome informado
        const created = await createPatient({ 
          name: notes,
          dateOfBirth: todayStr,
          gender: 'não informado'
        });
        if (!created?.id) {
          alert('Falha ao criar paciente com o nome informado.');
          return;
        }
        patientId = created.id;
      }

      const res = await confirmAppointmentPatientForSlot(selectedSlot.id, patientId, notes);
      if (!res?.success) {
        alert(`Falha ao confirmar nome: ${res?.error || 'erro desconhecido'}`);
      } else {
        setSelectedSlotIds(new Set());
        setPatientName('');
        setSelectedPatientId('');
      }
    } catch (e) {
      alert(`Erro ao confirmar nome: ${e?.message || 'erro desconhecido'}`);
    }
  };
  // Iniciar fluxo de agendamento: marcar o slot como agendado e mostrar opções de paciente
  const handleStartBookingMode = async () => {
    if (!selectedSlot) return;
    try {
      // Fluxo corrigido: criar appointment primeiro quando o slot está disponível.
      // O backend atualiza o slot para 'booked' automaticamente ao criar o appointment.
      if (selectedSlot.status === 'available') {
        try {
          const placeholder = await createPatient({ name: 'Sem Nome', placeholder: true });
          if (placeholder?.id) {
            const appt = await createAppointmentForSlot(selectedSlot.id, placeholder.id, 'Sem Nome');
            if (!appt?.success) {
              alert(`Falha ao iniciar agendamento: ${appt?.error || 'erro desconhecido'}`);
              return;
            }
          } else {
            alert('Falha ao criar paciente placeholder');
            return;
          }
        } catch (err) {
          alert(`Erro ao preparar placeholder de agendamento: ${err?.message || 'erro desconhecido'}`);
          return;
        }
      }
      // Se já estiver 'booked', apenas entrar no modo de confirmação do paciente
      setPanelMode('booking');
    } catch (e) {
      alert(`Erro ao alternar: ${e?.message || 'erro desconhecido'}`);
    }
  };
  const handleExcluirSelected = async () => {
    if (!selectedSlot) return;
    if (!window.confirm('Tem certeza que deseja excluir este horário?')) return;
    const res = await deleteSlotInBackend(selectedSlot.id);
    if (!res?.success) {
      alert(`Falha ao excluir: ${res?.error || 'erro desconhecido'}`);
    } else {
      setSelectedSlotIds(new Set());
    }
  };

  const handleDisponibilizarSelected = async () => {
    if (!selectedSlot) return;
    const res = await cancelAppointmentForSlot(selectedSlot.id);
    if (!res?.success) {
      alert(`Falha ao disponibilizar: ${res?.error || 'erro desconhecido'}`);
    } else {
      setSelectedSlotIds(new Set());
    }
  };

  // Alinhamento vertical da overlay: iniciar no topo da grid (sem offset)
  useEffect(() => {
    const measureLayout = () => {
      // Overlay deve começar em 0 dentro da grid; manter cálculo das colunas
      setTimelineOffsetTop(0);
      const cols = weekDays.map((_, idx) => {
        const el = dayHeaderRefs.current[idx];
        if (!el || !gridRef.current) return { left: 0, width: 0 };
        const rect = el.getBoundingClientRect();
        const gRect = gridRef.current.getBoundingClientRect();
        return { left: rect.left - gRect.left, width: rect.width };
      });
      setDayColumns(cols);
    };

    // Medir inicialmente e em redimensionamento
    measureLayout();
    const ro = new ResizeObserver(() => measureLayout());
    if (headerRef.current) ro.observe(headerRef.current);
    if (gridRef.current) ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, [selectedWeek, rowHeight]);

  const GRID_START_MINUTES = 0; // 00:00
  const GRID_END_MINUTES   = 24 * 60; // 24:00
  const GRID_STEP_MINUTES  = Math.min(Math.max((availabilitySettings?.timeStep || 30), 5), 60);
  const CELL_ROWS = Math.ceil((GRID_END_MINUTES - GRID_START_MINUTES) / GRID_STEP_MINUTES);
  const LINE_COUNT = CELL_ROWS + 1; // linhas de vértice

  const GAP_PX = 0; // sem espaço entre colunas de dia
  const TIME_COL_PX = 60; // largura coluna de horário

  const GRID_TEMPLATE = `${TIME_COL_PX}px repeat(7, 1fr)`;



  // Efeito de zoom na grade com Ctrl + Roda do mouse
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setRowHeight(rh => {
          const next = Math.max(16, Math.min(40, rh + (e.deltaY > 0 ? -2 : 2)));
          return next;
        });
      }
    };
    const gridEl = gridRef.current;
    if (!gridEl) return;
    gridEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      gridEl.removeEventListener('wheel', handleWheel);
    };
  }, []);


  const toLabel = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // Helper local para converter minutos em "HH:mm"
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
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

  // Helper local para converter 'HH:mm' em minutos
  const timeToMinutes = (time) => {
    if (typeof time !== 'string') return 0;
    const [hoursStr, minutesStr] = time.split(':');
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
    return hours * 60 + minutes;
  };

  const getTimeFromPosition = (clientY, snapMode = 'nearest') => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const y = clientY - rect.top;
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
    if (!markingMode) return;

    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Ignorar clique fora das colunas de dias
    if (x < TIME_COL_PX) return;

    const relX = x - TIME_COL_PX;
    const colWidth = (gridRef.current.clientWidth - TIME_COL_PX) / 7;
    const targetDayIndex = Math.floor(relX / colWidth);

    const relY = Math.max(0, y);
    const minutesFromStart = GRID_START_MINUTES + Math.floor(relY / rowHeight) * GRID_STEP_MINUTES;

    setDragStart({ dayIndex: targetDayIndex, minutes: minutesFromStart });
    setDragEnd({ dayIndex: targetDayIndex, minutes: minutesFromStart });
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !dragStart) return;
    const rect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const relY = Math.max(0, y);
    const minutesFromStart = GRID_START_MINUTES + Math.floor(relY / rowHeight) * GRID_STEP_MINUTES;
    setDragEnd({ dayIndex: dragStart.dayIndex, minutes: minutesFromStart });
    
    // Update preview slot
    const preview = getPreviewSlot();
    setPreviewSlot(preview);
  };

  const handleMouseUp = async () => {
    if (!isDragging || !dragStart || !dragEnd) return;
    setIsDragging(false);

    const s = dragStart.minutes;
    const e = dragEnd.minutes;
    if (Math.abs(e - s) < GRID_STEP_MINUTES) return;

    const startMin = Math.min(s, e);
    const endMin   = Math.max(s, e);

    const sSnap = snapToStep(startMin, 'start');
    const eSnap = snapToStep(endMin,   'end');

    const startTime = minutesToTime(sSnap);
    const endTime   = minutesToTime(eSnap);
    const dayDate   = weekDays[dragStart.dayIndex];
    const dateStr   = format(dayDate, 'yyyy-MM-dd');

    if (markingMode === 'availability') {
      // Use store helper to create multiple slots honoring duration/interval
      const startDateObj = new Date(`${dateStr}T${minutesToTime(sSnap)}:00`);
      const endDateObj = new Date(`${dateStr}T${minutesToTime(eSnap)}:00`);
      createSlotsFromRangeWithSettings(weekDays[dragStart.dayIndex], startDateObj, endDateObj, 'available');
    } else if (markingMode === 'booking' || markingMode === 'appointment') {
      // Correção: não marcar 'booked' sem appointment no backend.
      // Criar appointment com placeholder se o slot estiver disponível.
      const selectedId = [...selectedSlotIds][0];
      const selected = timeSlots.find(s => s.id === selectedId);
      if (selected && selected.date === dateStr) {
        if (selected.status === 'available') {
          try {
            const placeholder = await createPatient({ 
              name: 'Sem Nome', 
              placeholder: true,
              dateOfBirth: new Date().toISOString().split('T')[0],
              gender: 'não informado'
            });
            if (placeholder?.id) {
              const appt = await createAppointmentForSlot(selected.id, placeholder.id, 'Sem Nome');
              if (!appt?.success) {
                alert(`Falha ao agendar placeholder: ${appt?.error || 'erro desconhecido'}`);
              }
            } else {
              alert('Falha ao criar paciente placeholder');
            }
          } catch (err) {
            alert(`Erro ao preparar placeholder: ${err?.message || 'erro desconhecido'}`);
          }
        }
        // Se já estiver 'booked', não fazer nada aqui; confirmações acontecem pelo painel
      } else {
        console.warn('Nenhum slot selecionado no dia para agendar.');
      }
    }

    setDragStart(null);
    setDragEnd(null);
    setPreviewSlot(null);
  };

  const createSlotsFromSelection = (day, startDate, endDate) => {
    const duration = endDate.getTime() - startDate.getTime();
    const count = Math.ceil(duration / (GRID_STEP_MINUTES * 60 * 1000));

    const slotsToCreate = [];
    let currentStart = new Date(startDate);

    for (let i = 0; i < count; i++) {
      const currentEnd = new Date(currentStart.getTime() + GRID_STEP_MINUTES * 60 * 1000);
      slotsToCreate.push({ start: currentStart, end: currentEnd, status: 'available' });
      currentStart = currentEnd;
    }

    createSlotsBatchInBackend(day, slotsToCreate);
  };

  const createSlotsBatchInBackend = async (day, slotsToCreate) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    for (const slot of slotsToCreate) {
      await createSlotInBackend({ date: dateStr, startTime: slot.start, endTime: slot.end, status: slot.status });
    }
  };

  const toggleSelectSlot = (slot) => {
    setSelectedSlotIds(prev => {
      // No modo Agendar/Appointment, permitir apenas um selecionado por vez
      if (markingMode === 'booking' || markingMode === 'appointment') {
        const next = new Set();
        if (!prev.has(slot.id)) next.add(slot.id);
        return next;
      }
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

  const isDarkModeUI = document.documentElement.classList.contains('dark-mode');
  // const lineColor = isDarkModeUI ? '#22C55E' : '#3B82F6';

  return (

    <Card className={`w-full border-theme-border ${isDarkModeUI ? 'bg-theme-card' : 'bg-[#DDDDDD]'}`}>

      <CardContent className="p-0">
        <div
          ref={headerRef}
          className=""
        >
          {/* Centered Navigation Header */}
          <div className="flex items-center justify-center gap-4 mb-4 px-4 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { const d = new Date(selectedWeek); d.setDate(d.getDate() - 1); setSelectedWeek(d); }}
              aria-label="Dia anterior"
              className="hover:bg-theme-hover"
            >
              ←
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-theme-text">
                {(() => { const sw = (selectedWeek instanceof Date) ? selectedWeek : new Date(selectedWeek); return !Number.isNaN(sw.getTime()) ? format(sw, 'MMMM yyyy', { locale: ptBR }) : ''; })()}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { const d = new Date(selectedWeek); d.setDate(d.getDate() + 1); setSelectedWeek(d); }}
              aria-label="Próximo dia"
              className="hover:bg-theme-hover"
            >
              →
            </Button>
          </div>

          {/* Botão: Criar horário (mostra/oculta Configurações de Marcação) */}
          <div className="flex items-center justify-center mb-2 px-4">
            <Button
              aria-expanded={showMarkingConfig}
              onClick={() => setShowMarkingConfig(prev => !prev)}
        className={`${isDarkModeUI ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} px-4 py-2 rounded-md font-medium shadow-sm`}
            >
              Criar horário
            </Button>
          </div>

          {/* Configurações de Marcação: agora acima dos cabeçalhos de dia */}
          {showMarkingConfig && (
            <div className="mb-2 px-4">
              <MarkingModeConfig
                appointmentDuration={appointmentDuration}
                setAppointmentDuration={setAppointmentDuration}
                intervalBetween={intervalBetween}
                setIntervalBetween={setIntervalBetween}
                markingMode={markingMode}
                setMarkingMode={setMarkingMode}
                isDarkModeUI={isDarkModeUI}
              />
            </div>
          )}

          {/* Today button row */}
          <div
            className="grid items-center mb-2"
            style={{ gridTemplateColumns: GRID_TEMPLATE, columnGap: '0px' }}
          >
            <div />
            {weekDays.map((date, idx) => {
              const isToday = isSameDay(date, new Date());
              const isSelected = isSameDay(date, selectedWeek);
              return (
                <div
                  key={`today-row-${idx}`}
                  className="flex justify-center"
                >
                  {isToday && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedWeek(new Date())}
                      className="bg-theme-accent text-white hover:bg-theme-accent/80"
                    >
                      Hoje
                    </Button>
                  )}
                  {isSelected && !isToday && (
                    <div className="w-2 h-2 rounded-full bg-theme-accent"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Day headers with centered navigation */}
          <div
            className="grid items-center mb-0"
            style={{ gridTemplateColumns: GRID_TEMPLATE, columnGap: '0px' }}
          >
            <div className="text-sm font-medium text-theme-text-secondary px-2">
              Horário
            </div>
            {weekDays.map((date, dayIndex) => {
              const isSelected = isSameDay(date, selectedWeek);
              const isToday = isSameDay(date, new Date());
              const isEvenCol = dayIndex % 2 === 0;
              
              let bgColor;
              let borderClass = '';
              
              if (isDarkModeUI) {
        bgColor = isEvenCol ? 'var(--color-header-col-even-dark)' : 'var(--color-header-col-odd-dark)';
        if (isToday) {
          // Destaque para a coluna de Hoje em dark mode
          bgColor = 'var(--color-header-col-center-dark)';
          borderClass = 'ring-2 ring-theme-accent';
        }
              } else {
                bgColor = isEvenCol ? '#F3F3F3' : '#E9E9E9';
                if (isToday) {
                  // Destaque para a coluna de Hoje em light mode
                  bgColor = '#2563EB';
                  borderClass = 'ring-2 ring-blue-400';
                }
              }

              return (
                <div
                  key={`day-header-${dayIndex}`}
                  ref={(el) => { dayHeaderRefs.current[dayIndex] = el; }}
                  className={`relative flex items-center justify-center ${borderClass}`}
                  style={{ backgroundColor: bgColor }}
                >
                  <button
                    onClick={() => setSelectedWeek(date)}
                    className={`flex flex-col items-center justify-center px-3 py-2 h-16 rounded-none text-sm font-medium transition-all border-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-ring_outline focus:ring-offset-theme-background ${
                      isSelected ? 'bg-theme-accent text-white' : 'text-theme-text-secondary hover:bg-theme-hover'
                    } ${isToday ? 'text-white' : ''}`}
                    aria-pressed={isSelected}
                  >
                    <span className="text-xs leading-tight">
                      {date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                    </span>
                    <span className="text-base font-semibold leading-tight">
                      {format(date, 'dd')}
                    </span>
                    {isToday && (
                      <span className="text-xs opacity-75">Hoje</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* (Painel movido acima: ver bloco após botão "Criar horário") */}
        </div>

        {/* Painel rápido: duração e intervalo quando há slot selecionado */}
        {selectedSlotIds && selectedSlotIds.size > 0 && (
          <div
            ref={adjacentPanelRef}
            className={`${isDarkModeUI ? 'bg-theme-surface' : 'bg-white'} mx-auto mb-0 w-full max-w-[1100px] border border-theme-border rounded-md px-3 py-2 space-y-2`}
            style={{ pointerEvents: 'auto' }}
          >
            {/* Linha 1: duração/intervalo + Confirmar */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-medium text-theme-text">
                Configurar duração da consulta e intervalo
              </span>
              <label className="text-sm text-theme-text">
                Duração (min):
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={appointmentDuration ?? 30}
                  onChange={(e) => setAppointmentDuration(Math.max(5, parseInt(e.target.value || '0')))}
                  className={`ml-2 w-20 px-2 py-1 rounded border border-theme-border ${isDarkModeUI ? 'bg-theme-input text-theme-text' : 'bg-white text-black'}`}
                />
              </label>
              <label className="text-sm text-theme-text">
                Intervalo (min):
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={intervalBetween ?? 0}
                  onChange={(e) => setIntervalBetween(Math.max(0, parseInt(e.target.value || '0')))}
                  className={`ml-2 w-20 px-2 py-1 rounded border border-theme-border ${isDarkModeUI ? 'bg-theme-input text-theme-text' : 'bg-white text-black'}`}
                />
              </label>
              <Button
                size="sm"
                onClick={handleConfirmSelected}
                disabled={!selectedSlot}
                className="bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
              >
                Configurar
              </Button>
            </div>

            {/* Linha 2: dados do paciente (somente para slots agendados) */}
            {selectedSlot?.status === 'booked' && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <label className="text-sm text-theme-text">
                  Nome do paciente:
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Digite o nome"
                    className={`ml-2 w-40 px-2 py-1 rounded border border-theme-border ${isDarkModeUI ? 'bg-theme-input text-theme-text' : 'bg-white text-black'}`}
                  />
                </label>

                <label className="text-sm text-theme-text">
                  Selecionar paciente:
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className={`ml-2 w-44 px-2 py-1 rounded border border-theme-border ${isDarkModeUI ? 'bg-theme-input text-theme-text' : 'bg-white text-black'}`}
                  >
                    <option value="">—</option>
                    {Array.isArray(patients) && patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>

                <Button size="sm" variant="secondary" onClick={() => navigate('/patients/import')}>
                  Importar Paciente
                </Button>
              </div>
            )}

            {/* Linha 3: ações */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {selectedSlot?.status === 'available' && (
                <Button
                  size="sm"
                  onClick={handleStartBookingMode}
                  disabled={!selectedSlot}
                  className="bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  Agendar
                </Button>
              )}

              {selectedSlot?.status === 'booked' && (
                <Button
                  size="sm"
                  onClick={handleConfirmPatientName}
                  disabled={!selectedSlot || (!patientName.trim() && !selectedPatientId)}
                  className="bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  Confirmar Nome
                </Button>
              )}
              {selectedSlot?.status === 'booked' && (
                <Button
                  size="sm"
                  onClick={handleDisponibilizarSelected}
                  disabled={!selectedSlot}
                  className="bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  Disponibilizar
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={handleExcluirSelected} disabled={!selectedSlot}>
                Excluir
              </Button>
            </div>
          </div>
        )}

        <div 
          ref={gridRef}
          className="relative mx-auto max-w-[1200px]"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >

          {/* Linhas de vértice por step - REMOVIDAS PARA O PADRÃO XADREZ */}

          {/* Linhas de tempo (background) */}
          {Array.from({ length: CELL_ROWS }, (_, i) => (
            <div 
              key={`row-${i}`} 
              className="grid" 
               style={{ gridTemplateColumns: GRID_TEMPLATE, columnGap: '0px' }}
            >
              <div
                className="text-right text-xs text-theme-text opacity-70 flex items-center justify-end box-border"
                style={{ height: `${rowHeight}px`, padding: '0 0.5rem', backgroundColor: isDarkModeUI ? (i % 2 === 0 ? '#2D2D2D' : '#252525') : (i % 2 === 0 ? '#F3F3F3' : '#FFFFFF') }}
              >
                {toLabel(GRID_START_MINUTES + i * GRID_STEP_MINUTES)}
              </div>
              {weekDays.map((day, dayIndex) => {
                const isEvenRow = i % 2 === 0;
                const isEvenCol = dayIndex % 2 === 0;
                const isToday = isSameDay(day, new Date());
                let bgColor;
                
                if (isDarkModeUI) {
                  // Dark mode: unify palette using theme tokens and accent
                  if (isToday) {
                    // Coluna de Hoje usa accent tint (consistente com header)
                    bgColor = 'var(--color-header-col-center-dark)';
                  } else {
                    // Other days: even/odd columns use dark grid tokens
                    if (isEvenCol) {
                      bgColor = isEvenRow ? 'var(--color-header-col-even-dark)' : 'var(--color-header-col-odd-dark)';
                    } else {
                      bgColor = isEvenRow ? 'var(--color-header-col-odd-dark)' : 'var(--color-header-col-even-dark)';
                    }
                  }
                } else {
                  // Enhanced color system for light mode
                  if (isToday) {
                    // Coluna de Hoje recebe tratamento especial
                    bgColor = isEvenRow ? '#DBEAFE' : '#BFDBFE'; // Tons de azul
                  } else {
                    // Other days
                    if (isEvenRow) {
                      bgColor = isEvenCol ? '#F3F3F3' : '#E9E9E9';
                    } else {
                      bgColor = isEvenCol ? '#E9E9E9' : '#F3F3F3';
                    }
                  }
                }

                return (
                  <div
                    key={`${dayIndex}-${i}`}
                    className={`relative ${markingMode ? 'cursor-crosshair' : 'cursor-default'} hover:bg-theme-surface transition-colors box-border`}
                    style={{ height: `${rowHeight}px`, backgroundColor: bgColor }}
                    onMouseDown={(e) => handleMouseDown(dayIndex, e)}
                  />
                );
              })}
            </div>
          ))}

          {/* Overlay de slots: exibe disponíveis/agendados em cada dia */}
          <div
            className="absolute z-10"
            style={{ left: `${TIME_COL_PX}px`, right: 0, top: '0px', pointerEvents: 'none' }}
          >
            <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', columnGap: '0px' }}>
              {weekDays.map((day, dayIndex) => (
                <div key={`overlay-day-${dayIndex}`} className="relative" style={{ height: `${CELL_ROWS * rowHeight}px` }}>
                  {timeSlots
                    .filter(slot => {
                      // comparar por string yyyy-MM-dd
                      const slotDate = slot.date;
                      const dayStr = format(day, 'yyyy-MM-dd');
                      return slotDate === dayStr;
                    })
                    .map((slot) => {
                      const { top, height } = getSlotPosition(slot);
                      // Enhanced color system for slots
                      const statusClass =
                        slot.status === 'booked' ? 'slot slot-booked group' :
                        slot.status === 'available' ? 'slot slot-available group' :
                        'slot slot-blocked group';
                      const selectedClass = selectedSlotIds.has(slot.id) ? 'slot-selected' : '';
                      return (
                        <div
                          key={slot.id || `${slot.startTime}-${slot.endTime}-${dayIndex}`}
                          className={`absolute px-2 py-1 text-xs shadow-sm ${statusClass} ${selectedClass}`}
                          style={{ top: `${top}px`, height: `${height}px`, left: '2px', right: '2px', pointerEvents: 'auto' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectSlot(slot);
                          }}
                          title={`${slot.startTime} - ${slot.endTime}`}
                        >
                          <div className="font-medium">
                            {slot.startTime.substring(0,5)} - {slot.endTime.substring(0,5)}
                          </div>
                          {slot.status === 'booked' && (
                            <div className="text-xs opacity-75">
                              {slot?.booking?.patientName ? (
                                slot.booking.patientName
                              ) : (
                                'Agendado'
                              )}
                            </div>
                          )}
                          {slot.status === 'available' && (
                            <div className="text-xs opacity-75">Disponível</div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>

          {/* Preview slot during drag */}
          {previewSlot && (
            <div
              className="absolute z-20 pointer-events-none"
              style={{ 
                // dayColumns[].left já é relativo ao container da grid, não somar TIME_COL_PX novamente
                left: `${(dayColumns[previewSlot.dayIndex]?.left ?? TIME_COL_PX)}px`, 
                width: `${dayColumns[previewSlot.dayIndex]?.width || 0}px`, 
                top: `${Math.round((previewSlot.sSnap - GRID_START_MINUTES) / GRID_STEP_MINUTES) * rowHeight}px`, 
                height: `${Math.max(Math.round((previewSlot.eSnap - previewSlot.sSnap) / GRID_STEP_MINUTES), 1) * rowHeight}px` 
              }}
            >
              <div 
                className={`w-full h-full slot ${
                  markingMode === 'availability' ? 'slot-available' : 'slot-booked'
                }`}
              />
            </div>
          )}

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
                }}
              >
                {/* ... existing code ... */}
              </div>
            </>
          )}

          {/* ... existing code ... */}
        </div>
      </CardContent>

    </Card>
  );
};

export default WeeklyTimeGrid;