import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(
  (config) => {
    // Primeiro, verificar se já existe um token no header (configurado pelo authStore)
    if (config.headers.Authorization) {
      return config;
    }
    
    // Se não, tentar obter do localStorage
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        // Verificar se o storage não é um objeto serializado incorretamente
        if (authStorage === '[object Object]') {
          console.warn('Storage de auth corrompido detectado, limpando');
          localStorage.removeItem('auth-storage');
          return config;
        }
        
        // Parse do storage do Zustand
        const parsedAuth = JSON.parse(authStorage);
        
        // Verificar se tem o token no formato do Zustand
        if (parsedAuth && parsedAuth.state && parsedAuth.state.token) {
          config.headers.Authorization = `Bearer ${parsedAuth.state.token}`;
          console.log('Token adicionado ao header:', parsedAuth.state.token.substring(0, 20) + '...');
        }
      } catch (error) {
        console.warn('Storage de auth inválido, limpando:', error);
        // Limpar storage corrompido
        localStorage.removeItem('auth-storage');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratar erros específicos aqui (ex: 401, 403, etc)
    if (!error.response && error.code === 'ECONNREFUSED') {
      console.error('Backend offline');
      return Promise.reject(new Error('Servidor indisponível'));
    }
    if (error.response && error.response.status === 401) {
      // Redirecionar para login ou limpar o estado de autenticação
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Serviços específicos
export const patientService = {
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  search: (query) => api.get(`/patients/search?q=${query}`),
};

export const recordService = {
  getByPatient: (patientId) => api.get(`/records/patient/${patientId}`),
  getById: (id) => api.get(`/records/${id}`),
  create: (data) => api.post('/records', data),
  update: (id, data) => api.put(`/records/${id}`, data),
  delete: (id) => api.delete(`/records/${id}`),
};

export const tagService = {
  getAll: () => api.get('/tags'),
  create: (data) => api.post('/tags', data),
  update: (id, data) => api.put(`/tags/${id}`, data),
  delete: (id) => api.delete(`/tags/${id}`),
};

export const calculatorService = {
  getAll: () => api.get('/calculators'),
  getById: (id) => api.get(`/calculators/${id}`),
  create: (data) => api.post('/calculators', data),
  update: (id, data) => api.put(`/calculators/${id}`, data),
  delete: (id) => api.delete(`/calculators/${id}`),
  search: (query) => api.get(`/calculators/search?q=${query}`),
};

export const templateService = {
  getAll: () => api.get('/templates'),
  getById: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  search: (query) => api.get(`/templates/search?q=${query}`),
};

export const alertService = {
  getAll: () => api.get('/alerts'),
  getById: (id) => api.get(`/alerts/${id}`),
  create: (data) => api.post('/alerts', data),
  update: (id, data) => api.put(`/alerts/${id}`, data),
  delete: (id) => api.delete(`/alerts/${id}`),
};

export const aiService = {
  chat: (message, patientId) => api.post('/ai/chat', { message, patientId }),
  getSuggestions: (patientId) => api.get(`/ai/suggestions/${patientId}`),
};

export const exportService = {
  exportToPdf: (patientId) => api.get(`/export/pdf/${patientId}`, { responseType: 'blob' }),
  exportToCsv: (patientId) => api.get(`/export/csv/${patientId}`, { responseType: 'blob' }),
  exportToFhir: (patientId) => api.get(`/export/fhir/${patientId}`, { responseType: 'blob' }),
};