import api from './api';

export const recordService = {
    getByPatient: async (patientId) => {
        return await api.get(`/records/patient/${patientId}`);
    },

    getById: async (recordId) => {
        return await api.get(`/records/${recordId}`);
    },

    create: async (recordData) => {
        return await api.post('/records', recordData);
    },

    update: async (recordId, recordData) => {
        return await api.put(`/records/${recordId}`, recordData);
    },

    delete: async (recordId) => {
        return await api.delete(`/records/${recordId}`);
    }
};
