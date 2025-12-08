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

// removed duplicate stub for createSlotsFromRangeWithSettings

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
  
  // New properties for enhanced functionality
  appointmentDuration: 30,
  intervalBetween: 0,
  
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
  
  // New function for centered day navigation
  getCenteredWeekDays: () => {
    // Adaptado: iniciar a partir de selectedWeek (primeira coluna)
    // Connector: WeeklyTimeGrid utiliza esta função para montar as colunas
    // Hook: Destaque visual será aplicado com base em isToday na grid
    const startDay = new Date(get().selectedWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startDay);
      day.setDate(startDay.getDate() + i);
      return day;
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
  
  // New setter functions for appointment duration and interval
  setAppointmentDuration: (duration) => {
    set({ appointmentDuration: duration });
  },
  
  setIntervalBetween: (interval) => {
    set({ intervalBetween: interval });
  },
  
  // Enhanced slot creation with duration and interval support
  createSlotsFromRangeWithSettings: async (day, startDate, endDate, mode) => {
    const { appointmentDuration, intervalBetween, timeSlots } = get();
    const totalDuration = appointmentDuration + intervalBetween;
    const totalMinutes = (endDate.getTime() - startDate.getTime()) / (60 * 1000);
    
    if (totalDuration === 0) return { created: [], errors: [] };
    
    const count = Math.floor(totalMinutes / totalDuration);
    let currentStart = new Date(startDate);
    const results = { created: [], errors: [] };
    
    // Optional: remove conflicting slots when marking as booking/appointment mode
    if (mode === 'booked' || mode === 'appointment') {
      const dayStr = format(day, 'yyyy-MM-dd');
      const conflictingSlots = timeSlots.filter(slot => {
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
      
      const slotData = {
        date: format(day, 'yyyy-MM-dd'),
        startTime: currentStart.toTimeString().slice(0, 5),
        endTime: appointmentEnd.toTimeString().slice(0, 5),
        modality: ['presencial'],
        // Correção: sempre criar como 'available'; backend define status inicial
        status: 'available',
        type: 'manual',
        createdBy: 'doctor',
        booking: null
      };
      
      const result = await get().createSlotInBackend(slotData);
      if (result.success) {
        results.created.push(result.slot);
      } else {
        results.errors.push({ slot: slotData, error: result.error });
      }
      
      currentStart = new Date(appointmentEnd.getTime() + intervalBetween * 60 * 1000);
    }
    
    return results;
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
      // Connector: merge backend slots with appointments to preserve/display patient names
      // Integrates with: agendaService.getSlots, agendaService.getAppointments
      const { data } = await agendaService.getSlots({ start: start.toISOString(), end: end.toISOString() });

      // Fetch appointments in the same range to obtain patient names and origin
      // Connector: Used to display 'Marketplace' badge in TimeGridSlot when origin is patient_marketplace
      let apptMapBySlotId = new Map();
      try {
        const { data: apptData } = await agendaService.getAppointments({ start: start.toISOString(), end: end.toISOString() });
        const appointments = Array.isArray(apptData) ? apptData : (Array.isArray(apptData?.appointments) ? apptData.appointments : []);
        appointments.forEach(appt => {
          const slotId = appt?.slot?.id;
          if (!slotId) return;
          // Prefer booked appointments for display
          if (appt?.status !== 'booked') return;
          const name = (appt?.patient?.name && String(appt.patient.name).trim().length > 0)
            ? String(appt.patient.name).trim()
            : (typeof appt?.notes === 'string' && appt.notes.trim().length > 0 ? appt.notes.trim() : null);
          const origin = typeof appt?.origin === 'string' ? appt.origin : null;
          if (name && !apptMapBySlotId.has(slotId)) {
            apptMapBySlotId.set(slotId, { patientName: name, origin });
          }
        });
      } catch (_) {
        // Ignore appointment load errors; fallback to preserving local booking below
        apptMapBySlotId = new Map();
      }

      // Preserve existing booking info (names) when reloading the week
      const existing = get().timeSlots;
      const existingById = new Map(existing.map(s => [s.id, s]));

      const loaded = (data || []).map(apiSlot => {
        const startDate = new Date(apiSlot.start_time);
        const endDate = new Date(apiSlot.end_time);
        const existingBooking = existingById.get(apiSlot.id)?.booking || null;
        const bookingFromBackend = apptMapBySlotId.get(apiSlot.id) || null;
        const booking = existingBooking
          ? existingBooking
          : (bookingFromBackend ? { ...bookingFromBackend, createdAt: new Date().toISOString() } : null);
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
          booking
        };
      });
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
        // Correção: sempre usar o status retornado pelo backend
        status: data.status,
        type: 'manual',
        createdBy: 'doctor',
        createdAt: new Date(data.createdAt || Date.now()).toISOString(),
        booking: slot.booking || null
      };
      
      // Trigger external update event for bidirectional sync
      window.dispatchEvent(new CustomEvent('timeSlotsUpdated', {
        detail: { action: 'create', slot: newSlot }
      }));
      
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

      // Trigger external update event for bidirectional sync
      window.dispatchEvent(new CustomEvent('timeSlotsUpdated', {
        detail: { action: 'update', slot: updatedSlot }
      }));

      set({ timeSlots: timeSlots.map(s => s.id === slotId ? updatedSlot : s) });
      get().saveToLocalStorage();
      return { success: true, slot: updatedSlot };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.map(e => e.msg).join('; ') : null) || 'Falha ao atualizar slot';
      return { success: false, error: errorMessage };
    }
  },

  // Excluir slot no backend e remover localmente
  deleteSlotInBackend: async (slotId) => {
    try {
      const { timeSlots } = get();
      const current = timeSlots.find(s => s.id === slotId);
      if (!current) return { success: false, error: 'Slot não encontrado' };

      await agendaService.deleteSlot(slotId);

      // Disparar evento de atualização para sincronização bidirecional
      window.dispatchEvent(new CustomEvent('timeSlotsUpdated', {
        detail: { action: 'delete', slot: current }
      }));

      set({ timeSlots: timeSlots.filter(s => s.id !== slotId) });
      get().saveToLocalStorage();
      return { success: true };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.map(e => e.msg).join('; ') : null) || 'Falha ao excluir slot';
      return { success: false, error: errorMessage };
    }
  },

  // Criar agendamento para um slot disponível (backend + estado local)
  /**
   * Connector: Chamado pelo painel rápido em WeeklyTimeGrid.
   * Restrição: somente slots 'available' podem receber novo agendamento (alinhado ao backend).
   */
  createAppointmentForSlot: async (slotId, patientId, notes = '') => {
    try {
      const { timeSlots } = get();
      const current = timeSlots.find(s => s.id === slotId);
      if (!current) return { success: false, error: 'Slot não encontrado' };
      // Backend exige 'available' para criar novo agendamento
      if (current.status !== 'available') {
        return { success: false, error: 'Slot não está disponível para agendamento' };
      }

      // Criar agendamento no backend
      const { data } = await agendaService.createAppointment({ slot_id: slotId, patient_id: patientId, notes });

      // Atualizar estado local para refletir status "booked"
      get().updateSlotStatus(slotId, 'booked');
      // Guardar nome em booking para uso visual (se informado em notes)
      const patientName = (typeof notes === 'string' && notes.trim().length > 0) ? notes.trim() : null;
      if (patientName) {
        get().updateSlotBooking(slotId, { patientName, createdAt: new Date().toISOString() });
      }

      // Disparar evento de atualização para sincronização
      window.dispatchEvent(new CustomEvent('timeSlotsUpdated', {
        detail: { action: 'update', slot: { ...current, status: 'booked' } }
      }));

      return { success: true, appointment: data };
    } catch (err) {
      const isCanceled = err?.code === 'ERR_CANCELED' || err?.message?.includes('canceled');
      const errorMessage = err?.response?.data?.message || (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.map(e => e.msg).join('; ') : null) || (isCanceled ? 'Requisição cancelada' : 'Falha ao criar agendamento');
      // Resincronizar semana após erro para evitar estado inconsistente
      try { await get().loadSlotsForWeek(); } catch (_) {}
      return { success: false, error: errorMessage };
    }
  },

  // Cancelar agendamento do slot (disponibilizar horário)
  /**
   * Connector: Chamado pelo painel rápido em WeeklyTimeGrid (botão "Disponibilizar").
   * Hook: Cancela o appointment (se existir) e atualiza o slot no backend para 'available'.
   * Integrates with: agendaService.getAppointments, agendaService.updateAppointment, updateSlotInBackend → agendaService.updateSlot.
   */
  // Cancelar agendamento do slot (disponibilizar horário)
  /**
   * Connector: Chamado pelo painel rápido em WeeklyTimeGrid (botão "Disponibilizar").
   * Hook: Cancela o appointment (se existir) e atualiza o slot no backend para 'available'.
   * Integrates with: agendaService.getAppointments, agendaService.updateAppointment, updateSlotInBackend → agendaService.updateSlot.
   * Safety: Para origem 'patient_marketplace', exige allowMarketplace=true para evitar cancelamento sem confirmação explícita.
   */
  cancelAppointmentForSlot: async (slotId, options = {}) => {
    try {
      const { timeSlots } = get();
      const current = timeSlots.find(s => s.id === slotId);
      if (!current) return { success: false, error: 'Slot não encontrado' };
      const { allowMarketplace } = options || {};

      // Buscar agendamentos no intervalo do slot para encontrar o correspondente
      const startISO = combineDateAndTimeToISO(current.date, current.startTime);
      const endISO = combineDateAndTimeToISO(current.date, current.endTime);
      let target = null;
      try {
        const { data } = await agendaService.getAppointments({ start: startISO, end: endISO });
        const appointments = Array.isArray(data) ? data : (Array.isArray(data?.appointments) ? data.appointments : []);
        // Encontrar o agendamento atrelado ao slot selecionado e ativo
        target = appointments.find(a => (a?.slot?.id === slotId) && (a?.status === 'booked')) || appointments.find(a => a?.slot?.id === slotId);
      } catch (_) {
        // Se a busca falhar, seguimos para disponibilizar o slot mesmo assim
        target = null;
      }

      // Verificar origem (do appointment ou do estado local) para aplicar segurança
      const origin = (typeof target?.origin === 'string' ? target.origin : null) || (typeof current?.booking?.origin === 'string' ? current.booking.origin : null);
      if (origin === 'patient_marketplace' && allowMarketplace !== true) {
        return { success: false, error: 'Operação não confirmada para consulta do marketplace' };
      }

      // Se houver agendamento, cancelar no backend
      if (target?.id) {
        await agendaService.updateAppointment(target.id, { status: 'cancelled' });
      }

      // Atualizar o slot no backend para 'available' para persistir estado
      const res = await get().updateSlotInBackend(slotId, { status: 'available' });
      if (!res?.success) {
        // Fallback: atualizar somente localmente caso o backend rejeite
        get().updateSlotStatus(slotId, 'available');
      }
      // Limpar qualquer informação de booking local
      get().updateSlotBooking(slotId, null);
      // Disparar evento para sincronização visual
      window.dispatchEvent(new CustomEvent('timeSlotsUpdated', { detail: { action: 'update', slot: { ...current, status: 'available' } } }));

      return { success: true };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.map(e => e.msg).join('; ') : null) || 'Falha ao cancelar agendamento';
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Confirmar/atualizar paciente do agendamento de um slot já agendado.
   * 
   * Connector: Chamado por WeeklyTimeGrid (botão "Confirmar Nome").
   * Hook: Busca o appointment pelo intervalo do slot e atualiza patient_id/notes.
   * Integrates with: agendaService.getAppointments, agendaService.updateAppointment.
   */
  confirmAppointmentPatientForSlot: async (slotId, patientId, notes = '') => {
    try {
      const { timeSlots } = get();
      const current = timeSlots.find(s => s.id === slotId);
      if (!current) return { success: false, error: 'Slot não encontrado' };
      if (current.status !== 'booked') {
        return { success: false, error: 'Slot não está agendado' };
      }

      // Buscar appointment do slot no intervalo
      const startISO = combineDateAndTimeToISO(current.date, current.startTime);
      const endISO = combineDateAndTimeToISO(current.date, current.endTime);
      const { data } = await agendaService.getAppointments({ start: startISO, end: endISO });
      const appointments = Array.isArray(data) ? data : (Array.isArray(data?.appointments) ? data.appointments : []);
      const target = appointments.find(a => a?.slot?.id === slotId);
      if (!target?.id) {
        // Recuperação: sem appointment no backend, recriar diretamente com o paciente
        try {
          // Tentar liberar o slot no backend para permitir criação (se estiver inconsistente)
          await get().updateSlotInBackend(slotId, { status: 'available' });
        } catch (_) {
          // Ignorar erro de liberação; seguimos com tentativa de criação
        }
        try {
          const created = await agendaService.createAppointment({ slot_id: slotId, patient_id: patientId, notes });
          // Refletir localmente
          get().updateSlotStatus(slotId, 'booked');
          const bookingName = (typeof notes === 'string' && notes.trim().length > 0) ? notes.trim() : null;
          if (bookingName) {
            get().updateSlotBooking(slotId, { patientName: bookingName, createdAt: new Date().toISOString() });
          }
          window.dispatchEvent(new CustomEvent('timeSlotsUpdated', { detail: { action: 'update', slot: { ...current, status: 'booked' } } }));
          return { success: true, appointment: created?.data };
        } catch (err) {
          const errorMessage = err?.response?.data?.message || 'Falha ao recriar agendamento para o slot';
          return { success: false, error: errorMessage };
        }
      }

      // Se o paciente mudou, substituir o agendamento por um novo com o paciente atual
      if (target?.patient?.id && target.patient.id !== patientId) {
        try {
          await agendaService.deleteAppointment(target.id);
          const created = await agendaService.createAppointment({ slot_id: slotId, patient_id: patientId, notes });
          // Refletir localmente
          get().updateSlotStatus(slotId, 'booked');
          const bookingName = (typeof notes === 'string' && notes.trim().length > 0) ? notes.trim() : null;
          if (bookingName) {
            get().updateSlotBooking(slotId, { patientName: bookingName, createdAt: new Date().toISOString() });
          }
          window.dispatchEvent(new CustomEvent('timeSlotsUpdated', { detail: { action: 'update', slot: { ...current, status: 'booked' } } }));
          return { success: true, appointment: created?.data };
        } catch (err) {
          const errorMessage = err?.response?.data?.message || 'Falha ao atualizar paciente do agendamento';
          return { success: false, error: errorMessage };
        }
      }

      // Mesmo paciente: apenas atualizar notas se fornecidas
      const payload = {};
      if (typeof notes === 'string' && notes.trim().length > 0) payload.notes = notes.trim();
      if (Object.keys(payload).length > 0) {
        await agendaService.updateAppointment(target.id, payload);
      }

      const bookingName = (typeof notes === 'string' && notes.trim().length > 0)
        ? notes.trim()
        : get().timeSlots.find(s => s.id === slotId)?.booking?.patientName || null;
      get().updateSlotBooking(slotId, bookingName ? { patientName: bookingName, createdAt: new Date().toISOString() } : get().timeSlots.find(s => s.id === slotId)?.booking);

      window.dispatchEvent(new CustomEvent('timeSlotsUpdated', {
        detail: { action: 'update', slot: { ...current } }
      }));

      return { success: true };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.map(e => e.msg).join('; ') : null) || 'Falha ao confirmar paciente do agendamento';
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
    const removedSlot = timeSlots.find(s => s.id === slotId);
    
    // Trigger external update event for bidirectional sync
    if (removedSlot) {
      window.dispatchEvent(new CustomEvent('timeSlotsUpdated', {
        detail: { action: 'delete', slot: removedSlot }
      }));
    }
    
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
    // Garantir sempre um objeto Date válido
    const next = week instanceof Date ? week : new Date(week);
    set({ selectedWeek: next });
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
    const { timeRanges, timeSlots, availabilitySettings, appointmentDuration, intervalBetween } = get();
    localStorage.setItem('agendaTimeSlots', JSON.stringify({ 
      timeRanges, 
      timeSlots, 
      availabilitySettings,
      appointmentDuration,
      intervalBetween
    }));
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
          appointmentDuration: parsed.appointmentDuration || 30,
          intervalBetween: parsed.intervalBetween || 0,
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
    const { timeRanges, timeSlots, availabilitySettings, appointmentDuration, intervalBetween } = get();
    return {
      timeRanges,
      timeSlots,
      availabilitySettings,
      appointmentDuration,
      intervalBetween,
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
      appointmentDuration: data.appointmentDuration || 30,
      intervalBetween: data.intervalBetween || 0,
    });
    return { success: true };
  },
  
  // Removed duplicate createSlotsFromRangeWithSettings (array signature) to retain the correct (day, startDate, endDate, mode) version above.
}));