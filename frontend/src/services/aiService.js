import api from './api';

const aiService = {
    // Context Management
    getContext: async () => {
        const response = await api.get('/ai/context');
        return response.data;
    },

    addContext: async (item) => {
        const response = await api.post('/ai/context', item);
        return response.data;
    },

    removeContext: async (id) => {
        const response = await api.delete(`/ai/context/${id}`);
        return response.data;
    },

    clearContext: async () => {
        const response = await api.delete('/ai/context');
        return response.data;
    },

    // Chat
    chat: async (message, model = 'gpt-4') => {
        const response = await api.post('/ai/chat', { message, model });
        return response.data;
    }
};

export default aiService;
