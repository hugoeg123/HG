import api from './api';

export const patientService = {
    getAll: async (config) => {
        return await api.get('/patients', config);
    },

    getById: async (id, config) => {
        return await api.get(`/patients/${id}`, config);
    },

    create: async (patientData, config) => {
        return await api.post('/patients', patientData, config);
    },

    update: async (id, patientData, config) => {
        return await api.put(`/patients/${id}`, patientData, config);
    },

    delete: async (id, config) => {
        return await api.delete(`/patients/${id}`, config);
    },

    search: async (query, config) => {
        return await api.get(`/patients/search`, { params: { q: query }, ...config });
    },

    getDashboard: async (id, config) => {
        return await api.get(`/patients/${id}/dashboard`, config);
    }
};
