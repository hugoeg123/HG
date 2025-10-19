import api from './api.js';

// Agenda Service: Slots and Appointments
// Uses throttled API client with auth interceptors

const buildQuery = (params = {}) => ({ params });

export const agendaService = {
  // Availability Slots
  getSlots: ({ start, end, status, modality } = {}) => {
    return api.get('/agenda/slots', buildQuery({ start, end, status, modality }));
  },
  createSlot: ({ start_time, end_time, modality, location, notes }) => {
    return api.post('/agenda/slots', { start_time, end_time, modality, location, notes });
  },
  updateSlot: (id, data) => {
    return api.put(`/agenda/slots/${id}`, data);
  },
  deleteSlot: (id) => {
    return api.delete(`/agenda/slots/${id}`);
  },

  // Appointments
  getAppointments: ({ status, patientId, start, end } = {}) => {
    return api.get('/agenda/appointments', buildQuery({ status, patientId, start, end }));
  },
  createAppointment: ({ slot_id, patient_id, notes }) => {
    return api.post('/agenda/appointments', { slot_id, patient_id, notes });
  },
  updateAppointment: (id, data) => {
    return api.put(`/agenda/appointments/${id}`, data);
  },
  deleteAppointment: (id) => {
    return api.delete(`/agenda/appointments/${id}`);
  }
};

export default agendaService;