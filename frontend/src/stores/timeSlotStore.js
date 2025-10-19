import { create } from 'zustand';
import agendaService from '../services/agendaService.js';
import { format } from 'date-fns';

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const isValidTimeFormat = (time) => {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
};

const isoToHHMM = (isoString) => {
  const d = new Date(isoString);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

const combineDateAndTimeToISO = (dateStr, timeStr) => {
  // Combine local date and time; backend stores TIMESTAMPTZ
  const iso = new Date(`${dateStr}T${timeStr}:00`).toISOString();
  return iso;
};

// Validation functions
const validateAvailabilitySettings = (settings) => {
  const errors = [];
  
  if (settings.minWorkHour && (settings.minWorkHour < 0 || settings.minWorkHour > 23)) {
    errors.push('Hora de início do trabalho deve estar entre 0 e 23');
  }
  
  if (settings.maxWorkHour && (settings.maxWorkHour < 1 || settings.maxWorkHour > 23)) {
    errors.push('Hora de fim do trabalho deve estar entre 1 e 23');
  }
  
  if (settings.minWorkHour && settings.maxWorkHour && settings.minWorkHour >= settings.maxWorkHour) {
    errors.push('Hora de início deve ser anterior à hora de fim');
  }
  
  if (settings.defaultDuration && (settings.defaultDuration < 15 || settings.defaultDuration > 180)) {
    errors.push('Duração padrão deve estar entre 15 e 180 minutos');
  }
  
  if (settings.defaultInterval && (settings.defaultInterval < 0 || settings.defaultInterval > 60)) {
    errors.push('Intervalo padrão deve estar entre 0 e 60 minutos');
  }
  
  if (settings.timeStep && (settings.timeStep < 5 || settings.timeStep > 60)) {
    errors.push('Passo de tempo deve estar entre 5 e 60 minutos');
  }
  
  if (settings.maxRangesPerDay && (settings.maxRangesPerDay < 1 || settings.maxRangesPerDay > 10)) {
    errors.push('Máximo de faixas por dia deve estar entre 1 e 10');
  }
  
  if (settings.maxAdvanceBooking && (settings.maxAdvanceBooking < 1 || settings.maxAdvanceBooking > 365)) {
    errors.push('Antecedência máxima deve estar entre 1 e 365 dias');
  }
  
  return errors;
};

// Validation helpers and rules
const validateTimeRange = (range, existingRanges = []) => {
  const errors = [];
  
  if (!isValidTimeFormat(range.startTime) || !isValidTimeFormat(range.endTime)) {
    errors.push('Formato de horário inválido');
  }
  
  const startMinutes = timeToMinutes(range.startTime);
  const endMinutes = timeToMinutes(range.endTime);
  
  if (startMinutes >= endMinutes) {
    errors.push('Horário de início deve ser anterior ao horário de fim');
  }
  
  // Permitir 24h (00:00 até 23:59)
  if (startMinutes < 0 || endMinutes > 1440) {
    errors.push('Horários devem estar entre 00:00 e 23:59');
  }
  
  if (range.duration < 15 || range.duration > 180) {
    errors.push('Duração deve estar entre 15 e 180 minutos');
  }
  
  if (range.interval < 0 || range.interval > 60) {
    errors.push('Intervalo deve estar entre 0 e 60 minutos');
  }
  
  if (range.duration % 15 !== 0) {
    errors.push('Duração deve ser múltiplo de 15 minutos');
  }
  
  if (range.interval % 5 !== 0) {
    errors.push('Intervalo deve ser múltiplo de 5 minutos');
  }
  
  // Check for conflicts with existing ranges on the same day
  const dayRanges = existingRanges.filter(r => r.dayOfWeek === range.dayOfWeek && r.id !== range.id);
  for (const existing of dayRanges) {
    const existingStart = timeToMinutes(existing.startTime);
    const existingEnd = timeToMinutes(existing.endTime);
    
    if ((startMinutes < existingEnd && endMinutes > existingStart)) {
      errors.push('Conflito com faixa existente');
      break;
    }
  }
  
  return errors;
};

const validateTimeSlot = (slot, existingSlots = []) => {
  const errors = [];
  
  if (!isValidTimeFormat(slot.startTime) || !isValidTimeFormat(slot.endTime)) {
    errors.push('Formato de horário inválido');
  }
  
  const startMinutes = timeToMinutes(slot.startTime);
  const endMinutes = timeToMinutes(slot.endTime);
  const duration = endMinutes - startMinutes;

  if (!isValidTimeFormat(slot.startTime) || !isValidTimeFormat(slot.endTime)) {
    errors.push('Formato de horário inválido');
  }
  if (startMinutes >= endMinutes) {
    errors.push('Horário de início deve ser anterior ao horário de fim');
  }
  if (startMinutes < 0 || endMinutes > 1440) {
    errors.push('Horários devem estar entre 00:00 e 23:59');
  }
  
  // Remover limite de 4h; apenas garantir mínimo de 15min
  if (duration < 15) {
    errors.push('Duração mínima deve ser de 15 minutos');
  }
  
  // Check for conflicts
  const conflicts = checkTimeConflicts(slot, existingSlots);
  if (conflicts.length > 0) {
    errors.push(`Conflito com ${conflicts.length} slot(s) existente(s)`);
  }
  
  return errors;
};

const checkTimeConflicts = (slot, existingSlots) => {
  const slotStart = timeToMinutes(slot.startTime);
  const slotEnd = timeToMinutes(slot.endTime);
  
  return existingSlots.filter(existing => {
    if (existing.id === slot.id || existing.date !== slot.date) return false;
    if (existing.status === 'cancelled') return false;
    
    const existingStart = timeToMinutes(existing.startTime);
    const existingEnd = timeToMinutes(existing.endTime);
    
    return (slotStart < existingEnd && slotEnd > existingStart);
  });
};

const generateSlotsFromRange = (range, date) => {
  const slots = [];
  const startMinutes = timeToMinutes(range.startTime);
  const endMinutes = timeToMinutes(range.endTime);
  
  let currentTime = startMinutes;
  
  while (currentTime + range.duration <= endMinutes) {
    const slot = {
      id: generateId(),
      date,
      startTime: minutesToTime(currentTime),
      endTime: minutesToTime(currentTime + range.duration),
      modality: range.modalities,
      status: 'available',
      type: 'auto',
      createdBy: 'doctor',
      createdAt: new Date().toISOString(),
      rangeId: range.id
    };
    
    slots.push(slot);
    currentTime += range.duration + range.interval;
  }
  
  return slots;
};

// Initial state
const initialTimeRanges = {
  0: [],
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: []
};

const initialAvailabilitySettings = {
  minWorkHour: 6,      // 06:00
  maxWorkHour: 22,     // 22:00
  defaultDuration: 30, // 30 minutes
  defaultInterval: 15, // 15 minutes
  timeStep: 15,        // 15 minutes
  modalities: ['presencial', 'telemedicina', 'domiciliar'],
  allowOverlap: false,
  autoConfirm: false,
  showWeekends: true,
  maxRangesPerDay: 3,
  maxAdvanceBooking: 30, // 30 days
  workingDays: [1, 2, 3, 4, 5] // Monday to Friday
};

export const useTimeSlotStore = create((set, get) => ({
  // State
  timeRanges: initialTimeRanges,
  timeSlots: [],
  selectedWeek: new Date(),
  viewMode: 'week',
  markingMode: 'availability',
  isCreatingSlot: false,
  draggedSlot: null,
  conflicts: [],
  availabilitySettings: initialAvailabilitySettings,
  settings: initialAvailabilitySettings,
  
  // Computed values
  getWeekDays: () => {
    const weekStart = new Date(get().selectedWeek);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day;
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(diff + i);
      return date;
    });
  },
  
  getSlotsForDay: (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return get().timeSlots.filter(slot => slot.date === dateStr);
  },
  
  // Actions
  addTimeRange: (dayOfWeek, range) => {
    const { timeRanges } = get();
    const existingRanges = timeRanges[dayOfWeek] || [];
    
    const newRange = {
      id: generateId(),
      dayOfWeek,
      startTime: range.startTime,
      endTime: range.endTime,
      duration: range.duration || 30,
      interval: range.interval || 15,
      modalities: range.modalities || ['presencial'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const errors = validateTimeRange(newRange, existingRanges);
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    set({
      timeRanges: {
        ...timeRanges,
        [dayOfWeek]: [...existingRanges, newRange]
      }
    });
    get().saveToLocalStorage();
    return { success: true, range: newRange };
  },
  
  removeTimeRange: (dayOfWeek, rangeId) => {
    const { timeRanges } = get();
    set({
      timeRanges: {
        ...timeRanges,
        [dayOfWeek]: timeRanges[dayOfWeek].filter(range => range.id !== rangeId)
      }
    });
    get().saveToLocalStorage();
  },
  
  generateSlotsFromRanges: () => {
    const { timeRanges, timeSlots } = get();
    const weekDays = get().getWeekDays();
    
    const newSlots = [];
    
    weekDays.forEach(day => {
      const dayOfWeek = day.getDay();
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayRanges = timeRanges[dayOfWeek] || [];
      
      // Remove existing auto-generated slots for this day
      const existingManualSlots = timeSlots.filter(
        slot => slot.date === dateStr && slot.type === 'manual'
      );
      
      dayRanges.forEach(range => {
        if (range.isActive) {
          const rangeSlots = generateSlotsFromRange(range, dateStr);
          newSlots.push(...rangeSlots);
        }
      });
      
      newSlots.push(...existingManualSlots);
    });
    
    set({ timeSlots: newSlots });
    get().saveToLocalStorage();
    return newSlots;
  },
  
  addManualSlot: (slot) => {
    const { timeSlots } = get();
    
    const newSlot = {
      id: generateId(),
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      modality: slot.modality || ['presencial'],
      status: slot.status || 'available',
      type: 'manual',
      createdBy: 'doctor',
      createdAt: new Date().toISOString(),
      booking: slot.booking || null
    };
    
    const errors = validateTimeSlot(newSlot, timeSlots);
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    set({ timeSlots: [...timeSlots, newSlot] });
    get().saveToLocalStorage();
    return { success: true, slot: newSlot };
  },
  
  // Backend integration: load week slots and create slot immediately
  loadSlotsForMonth: async (monthDate) => {
    try {
      const base = monthDate instanceof Date ? monthDate : new Date(get().selectedWeek);
      const start = new Date(base.getFullYear(), base.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      const { data } = await agendaService.getSlots({ start: start.toISOString(), end: end.toISOString(), status: 'available' });
      const loaded = (data || []).map(apiSlot => {
        const startDate = new Date(apiSlot.start_time);
        const endDate = new Date(apiSlot.end_time);
        return {
          id: apiSlot.id,
          date: format(startDate, 'yyyy-MM-dd'),
          startTime: isoToHHMM(apiSlot.start_time),
          endTime: isoToHHMM(apiSlot.end_time),
          modality: [apiSlot.modality],
          status: apiSlot.status,
          type: 'manual',
          createdBy: 'doctor',
          createdAt: new Date(apiSlot.createdAt || startDate).toISOString(),
          booking: null
        };
      });
      const existing = get().timeSlots;
      const byId = new Map(existing.map(s => [s.id, s]));
      loaded.forEach(s => byId.set(s.id, s));
      set({ timeSlots: Array.from(byId.values()) });
      return loaded;
    } catch (err) {
      return [];
    }
  },

  loadSlotsForWeek: async () => {
    try {
      const weekDays = get().getWeekDays();
      const start = new Date(weekDays[0]);
      start.setHours(0, 0, 0, 0);
      const end = new Date(weekDays[6]);
      end.setHours(23, 59, 59, 999);
      const { data } = await agendaService.getSlots({ start: start.toISOString(), end: end.toISOString() });
      const loaded = (data || []).map(apiSlot => {
        const startDate = new Date(apiSlot.start_time);
        const endDate = new Date(apiSlot.end_time);
        return {
          id: apiSlot.id,
          date: format(startDate, 'yyyy-MM-dd'),
          startTime: isoToHHMM(apiSlot.start_time),
          endTime: isoToHHMM(apiSlot.end_time),
          modality: [apiSlot.modality],
          status: apiSlot.status,
          type: 'manual',
          createdBy: 'doctor',
          createdAt: new Date(apiSlot.createdAt || startDate).toISOString(),
          booking: null
        };
      });
      const existing = get().timeSlots;
      const weekDateKeys = weekDays.map(d => format(d, 'yyyy-MM-dd'));
      const keep = existing.filter(s => !weekDateKeys.includes(s.date));
      const byId = new Map(keep.map(s => [s.id, s]));
      loaded.forEach(s => byId.set(s.id, s));
      set({ timeSlots: Array.from(byId.values()) });
      return loaded;
    } catch (err) {
      return [];
    }
  },

  createSlotInBackend: async (slot) => {
    try {
      const modalityValue = Array.isArray(slot.modality) ? (slot.modality[0] || 'presencial') : (slot.modality || 'presencial');
      const payload = {
        start_time: combineDateAndTimeToISO(slot.date, slot.startTime),
        end_time: combineDateAndTimeToISO(slot.date, slot.endTime),
        modality: modalityValue,
      };
      if (typeof slot.location === 'string' && slot.location.trim().length > 0) {
        payload.location = slot.location;
      }
      if (typeof slot.notes === 'string' && slot.notes.trim().length > 0) {
        payload.notes = slot.notes;
      }
      const { data } = await agendaService.createSlot(payload);
      // Map created slot to local format and append
      const newSlot = {
        id: data.id,
        date: format(new Date(data.start_time), 'yyyy-MM-dd'),
        startTime: isoToHHMM(data.start_time),
        endTime: isoToHHMM(data.end_time),
        modality: [data.modality],
        status: slot.status || data.status,
        type: 'manual',
        createdBy: 'doctor',
        createdAt: new Date(data.createdAt || Date.now()).toISOString(),
        booking: slot.booking || null
      };
      const { timeSlots } = get();
      set({ timeSlots: [...timeSlots, newSlot] });
      get().saveToLocalStorage();
      return { success: true, slot: newSlot };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.map(e => e.msg).join('; ') : null) || 'Falha ao criar slot';
      return { success: false, error: errorMessage };
    }
  },

  // Atualizar slot no backend e refletir localmente
  updateSlotInBackend: async (slotId, updates) => {
    try {
      const { timeSlots } = get();
      const current = timeSlots.find(s => s.id === slotId);
      if (!current) return { success: false, error: 'Slot não encontrado' };

      const payload = {};
      if (updates.status) payload.status = updates.status;
      if (updates.startTime || updates.endTime) {
        const start = updates.startTime || current.startTime;
        const end = updates.endTime || current.endTime;
        payload.start_time = combineDateAndTimeToISO(current.date, start);
        payload.end_time = combineDateAndTimeToISO(current.date, end);
      }
      if (updates.modality) {
        payload.modality = Array.isArray(updates.modality) ? (updates.modality[0] || 'presencial') : updates.modality;
      }
      if (updates.location !== undefined) payload.location = updates.location;
      if (updates.notes !== undefined) payload.notes = updates.notes;

      const { data } = await agendaService.updateSlot(slotId, payload);

      const updatedSlot = {
        id: data.id,
        date: format(new Date(data.start_time), 'yyyy-MM-dd'),
        startTime: isoToHHMM(data.start_time),
        endTime: isoToHHMM(data.end_time),
        modality: [data.modality],
        status: data.status,
        type: current.type,
        createdBy: current.createdBy,
        createdAt: current.createdAt,
        booking: current.booking
      };

      set({ timeSlots: timeSlots.map(s => s.id === slotId ? updatedSlot : s) });
      get().saveToLocalStorage();
      return { success: true, slot: updatedSlot };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.map(e => e.msg).join('; ') : null) || 'Falha ao atualizar slot';
      return { success: false, error: errorMessage };
    }
  },

  // Novo: gerar e salvar slots no backend para uma faixa específica e dia da semana
  createSlotsFromRangeInBackend: async (dayOfWeek, range) => {
    const results = { created: [], errors: [] };
    try {
      const weekDays = get().getWeekDays();
      const { timeSlots } = get();
      for (const day of weekDays) {
        if (day.getDay() !== dayOfWeek) continue;
        const dateStr = format(day, 'yyyy-MM-dd');
        const slotsToCreate = generateSlotsFromRange(range, dateStr);
        for (const slot of slotsToCreate) {
          const conflicts = checkTimeConflicts(slot, timeSlots.concat(results.created));
          if (conflicts.length > 0) {
            results.errors.push({ slot, error: 'Conflito com slot existente' });
            continue;
          }
          const res = await get().createSlotInBackend(slot);
          if (res.success) {
            results.created.push(res.slot);
          } else {
            results.errors.push({ slot, error: res.error || 'Falha ao salvar slot' });
          }
        }
      }
      return results;
    } catch (err) {
      results.errors.push({ error: err?.message || 'Falha inesperada' });
      return results;
    }
  },
  
  removeSlot: (slotId) => {
    const { timeSlots } = get();
    set({ timeSlots: timeSlots.filter(slot => slot.id !== slotId) });
    get().saveToLocalStorage();
  },
  
  updateSlotStatus: (slotId, status) => {
    const { timeSlots } = get();
    set({
      timeSlots: timeSlots.map(slot =>
        slot.id === slotId ? { ...slot, status, updatedAt: new Date().toISOString() } : slot
      )
    });
    get().saveToLocalStorage();
  },

  updateSlotBooking: (slotId, booking) => {
    const { timeSlots } = get();
    set({
      timeSlots: timeSlots.map(slot =>
        slot.id === slotId ? { ...slot, booking, updatedAt: new Date().toISOString() } : slot
      )
    });
    get().saveToLocalStorage();
  },

  bookSlot: (slotId, patientName) => {
    const name = (patientName && patientName.trim().length > 0) ? patientName.trim() : 'sem nome';
    get().updateSlotStatus(slotId, 'booked');
    get().updateSlotBooking(slotId, { patientName: name, createdAt: new Date().toISOString() });
  },

  setMarkingMode: (mode) => {
    // Aceita 'availability', 'booking' e null (estado nenhum)
    if (mode !== 'availability' && mode !== 'booking' && mode !== null) return;
    set({ markingMode: mode });
  },
  checkConflicts: (slot) => {
    const { timeSlots } = get();
    const conflicts = checkTimeConflicts(slot, timeSlots);
    set({ conflicts });
    return conflicts;
  },
  
  setSelectedWeek: (week) => {
    set({ selectedWeek: week });
  },
  
  setViewMode: (mode) => {
    set({ viewMode: mode });
  },
  
  setIsCreatingSlot: (isCreating) => {
    set({ isCreatingSlot: isCreating });
  },
  
  setDraggedSlot: (slot) => {
    set({ draggedSlot: slot });
  },
  
  updateAvailabilitySettings: (settings) => {
    const errors = validateAvailabilitySettings(settings);
    if (errors.length > 0) {
      if (import.meta.env.DEV) {
        console.warn('Erros de validação de configurações (dev):', errors);
      }
      return { success: false, errors };
    }
    
    set({ 
      availabilitySettings: { ...get().availabilitySettings, ...settings },
      settings: { ...get().settings, ...settings },
    });
    get().saveToLocalStorage();
    return { success: true };
  },

  // Alias para compatibilidade com componentes
  updateSettings: (settings) => {
    return get().updateAvailabilitySettings(settings);
  },
  resetSettings: () => {
    set({ availabilitySettings: initialAvailabilitySettings, settings: initialAvailabilitySettings });
  },

  // Limpar todos os slots
  clearAllSlots: () => {
    set({ timeSlots: [], conflicts: [] });
    try {
      const { timeRanges } = get();
      localStorage.setItem('agendaTimeSlots', JSON.stringify({ timeRanges, timeSlots: [] }));
    } catch (e) {
      // noop
    }
  },
  
  // Persistence
  saveToLocalStorage: () => {
    const { timeRanges, timeSlots, availabilitySettings } = get();
    localStorage.setItem('agendaTimeSlots', JSON.stringify({ timeRanges, timeSlots, availabilitySettings }));
  },
  
  loadFromLocalStorage: () => {
    try {
      const data = localStorage.getItem('agendaTimeSlots');
      if (data) {
        const parsed = JSON.parse(data);
        set({
          timeRanges: parsed.timeRanges || initialTimeRanges,
          timeSlots: parsed.timeSlots || [],
          availabilitySettings: parsed.availabilitySettings || initialAvailabilitySettings,
          settings: parsed.availabilitySettings || initialAvailabilitySettings,
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Falha ao carregar agenda do localStorage (dev):', error?.message || error);
      }
    }
  },

  // Exportar dados
  exportData: () => {
    const { timeRanges, timeSlots, availabilitySettings } = get();
    return {
      timeRanges,
      timeSlots,
      availabilitySettings,
      exportedAt: new Date().toISOString()
    };
  },
  
  // Importar dados
  importData: (data) => {
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Dados inválidos para importação' };
    }
    set({
      timeRanges: data.timeRanges || initialTimeRanges,
      timeSlots: Array.isArray(data.timeSlots) ? data.timeSlots : [],
      availabilitySettings: data.availabilitySettings
        ? { ...get().availabilitySettings, ...data.availabilitySettings }
        : get().availabilitySettings,
      settings: data.availabilitySettings
        ? { ...get().settings, ...data.availabilitySettings }
        : get().settings,
    });
    return { success: true };
  },
}));