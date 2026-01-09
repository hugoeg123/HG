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
     * Index sample patient (Dev only)
     * @param {Object} patientData 
     */
    indexSample: async (patientData) => {
        const response = await api.post('/retrieval/index-sample', patientData);
        return response.data;
    }
};

export default retrievalService;
