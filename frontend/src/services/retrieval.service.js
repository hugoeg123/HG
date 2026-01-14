import api from './api';

const retrievalService = {
    /**
     * Debug retrieval engine
     * @param {Object} params { query, filters }
     */
    debug: async (params) => {
        const response = await api.post('/retrieval/debug', params);
        return response.data;
    },

    /**
     * Inspect patient documents
     * @param {string} patientId
     */
    inspect: async (patientId) => {
        const response = await api.get(`/retrieval/inspect/${patientId}`);
        return response.data;
    },

    /**
     * Force Re-index for a patient
     * @param {string} patientId
     */
    reindex: async (patientId) => {
        const response = await api.post(`/retrieval/reindex/${patientId}`);
        return response.data;
    },

    /**
     * Index sample patient (Dev only)
     * @param {Object} patientData 
     */
    indexSample: async (patientData) => {
        const response = await api.post('/retrieval/index-sample', patientData);
        return response.data;
    }
};

export default retrievalService;
