import axios from 'axios';

/**
 * Request throttling and queue management
 * Hook: Prevents rate limiting by controlling concurrent requests
 */
class RequestThrottler {
  constructor(maxConcurrent = 5, delayBetweenRequests = 100) {
    this.maxConcurrent = maxConcurrent;
    this.delayBetweenRequests = delayBetweenRequests;
    this.activeRequests = 0;
    this.requestQueue = [];
    this.lastRequestTime = 0;
  }

  async throttle(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.activeRequests >= this.maxConcurrent || this.requestQueue.length === 0) {
      return;
    }

    const { requestFn, resolve, reject } = this.requestQueue.shift();
    this.activeRequests++;

    // Ensure minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.delayBetweenRequests) {
      await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.activeRequests--;
      // Process next request in queue
      setTimeout(() => this.processQueue(), 10);
    }
  }
}

const requestThrottler = new RequestThrottler(3, 200); // Max 3 concurrent, 200ms between requests

/**
 * API configuration with timeout, retry logic and resource management
 * 
 * Connector: Used by all store services for HTTP requests
 * Hook: Implements automatic retry, timeout and throttling to prevent rate limiting
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds timeout to prevent hanging requests
  headers: {
    'Content-Type': 'application/json',
  },
  maxRedirects: 3,
});

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(
  (config) => {
    // Primeiro, verificar se já existe um token no header (configurado pelo authStore)
    if (config.headers.Authorization) {
      return config;
    }
    
    // Tentar obter token do window.healthGuardianUtils se disponível
    const token = window.healthGuardianUtils?.getToken() || 
                  localStorage.getItem('hg_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token adicionado ao header:', token.substring(0, 20) + '...');
      return config;
    }
    
    // Fallback: tentar obter do localStorage do Zustand
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
          console.log('Token do Zustand adicionado ao header:', parsedAuth.state.token.substring(0, 20) + '...');
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

/**
 * Retry configuration for failed requests
 * Hook: Prevents ERR_INSUFFICIENT_RESOURCES by implementing exponential backoff
 */
const retryRequest = async (error) => {
  const config = error.config;
  
  // Don't retry if we've already retried too many times
  if (!config || config.__retryCount >= 3) {
    return Promise.reject(error);
  }
  
  // Initialize retry count
  config.__retryCount = config.__retryCount || 0;
  config.__retryCount += 1;
  
  // Only retry on network errors or 5xx server errors
  const shouldRetry = (
    !error.response || 
    error.response.status >= 500 ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'NETWORK_ERROR'
  );
  
  if (!shouldRetry) {
    return Promise.reject(error);
  }
  
  // Exponential backoff: 1s, 2s, 4s
  const delay = Math.pow(2, config.__retryCount - 1) * 1000;
  
  console.log(`Retrying request (attempt ${config.__retryCount}/3) after ${delay}ms:`, config.url);
  
  return new Promise(resolve => {
    setTimeout(() => resolve(api(config)), delay);
  });
};

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle rate limiting (429) with exponential backoff
    if (error.response && error.response.status === 429) {
      const config = error.config;
      config.__retryCount = config.__retryCount || 0;
      
      if (config.__retryCount < 3) {
        config.__retryCount += 1;
        const delay = Math.pow(2, config.__retryCount) * 1000; // 2s, 4s, 8s
        
        console.warn(`Rate limited (429), retrying in ${delay}ms (attempt ${config.__retryCount}/3):`, config.url);
        
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(requestThrottler.throttle(() => api(config)));
          }, delay);
        });
      }
    }
    
    // Handle network and resource errors with retry
    if (
      error.code === 'ECONNABORTED' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'NETWORK_ERROR' ||
      (!error.response && error.request)
    ) {
      console.warn('Network error detected, attempting retry:', error.message);
      return retryRequest(error);
    }
    
    // Handle server errors (5xx) with retry
    if (error.response && error.response.status >= 500) {
      console.warn('Server error detected, attempting retry:', error.response.status);
      return retryRequest(error);
    }
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isOnLoginPage = window.location.pathname === '/login';
      
      if (!isLoginRequest && !isOnLoginPage) {
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('hg_token');
        window.location.href = '/login';
      }
    }
    
    // Don't log cancellation errors as they are expected behavior
    if (error.code === 'ERR_CANCELED' || error.name === 'AbortError') {
      console.debug('Request canceled (expected behavior):', error.config?.url);
      return Promise.reject(error);
    }
    
    // Log error details for debugging (excluding expected cancellations)
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      code: error.code,
      message: error.message
    });
    
    return Promise.reject(error);
  }
);

/**
 * Throttled API wrapper
 * Hook: All API calls go through throttling to prevent rate limiting
 * Exception: Auth requests bypass throttling for better UX
 */
const throttledApi = {
  get: (url, config) => {
    // Auth requests bypass throttling
    if (url.includes('/auth/')) {
      console.log('API: Auth request detected, bypassing throttling:', url);
      return api.get(url, config);
    }
    return requestThrottler.throttle(() => api.get(url, config));
  },
  post: (url, data, config) => {
    // Auth requests bypass throttling
    if (url.includes('/auth/')) {
      console.log('API: Auth request detected, bypassing throttling:', url);
      return api.post(url, data, config);
    }
    return requestThrottler.throttle(() => api.post(url, data, config));
  },
  put: (url, data, config) => requestThrottler.throttle(() => api.put(url, data, config)),
  delete: (url, config) => requestThrottler.throttle(() => api.delete(url, config)),
  patch: (url, data, config) => requestThrottler.throttle(() => api.patch(url, data, config))
};

export default throttledApi;
export { api as rawApi }; // Export raw API for special cases

// Serviços específicos com throttling integrado
// Hook: All services use throttled API to prevent rate limiting
export const patientService = {
  getAll: (params) => throttledApi.get('/patients', { params }),
  getById: (id) => throttledApi.get(`/patients/${id}`),
  create: (data) => throttledApi.post('/patients', data),
  update: (id, data) => throttledApi.put(`/patients/${id}`, data),
  delete: (id) => throttledApi.delete(`/patients/${id}`),
  search: (query) => throttledApi.get(`/patients/search?q=${query}`),
};

export const recordService = {
  getByPatient: (patientId) => throttledApi.get(`/records/patient/${patientId}`),
  getById: (id) => throttledApi.get(`/records/${id}`),
  create: (data) => throttledApi.post('/records', data),
  update: (id, data) => throttledApi.put(`/records/${id}`, data),
  delete: (id) => throttledApi.delete(`/records/${id}`),
};

export const tagService = {
  getAll: () => throttledApi.get('/tags'),
  create: (data) => throttledApi.post('/tags', data),
  update: (id, data) => throttledApi.put(`/tags/${id}`, data),
  delete: (id) => throttledApi.delete(`/tags/${id}`),
};

export const calculatorService = {
  getAll: () => throttledApi.get('/calculators'),
  getById: (id) => throttledApi.get(`/calculators/${id}`),
  create: (data) => throttledApi.post('/calculators', data),
  update: (id, data) => throttledApi.put(`/calculators/${id}`, data),
  delete: (id) => throttledApi.delete(`/calculators/${id}`),
  search: (query) => throttledApi.get(`/calculators/search?q=${query}`),
};

/**
 * Dynamic Calculator Service - Handles dynamic calculator operations
 * 
 * Integrates with:
 * - backend/src/routes/dynamic-calculator.routes.js for API endpoints
 * - backend/src/controllers/DynamicCalculatorController.js for business logic
 * - Used by frontend components for dynamic calculator functionality
 * 
 * Hook: Provides interface for dynamic calculators and unit conversions
 */
export const dynamicCalculatorService = {
  // Calculator operations
  listCalculators: () => throttledApi.get('/dynamic-calculators'),
  getCalculatorSchema: (calculatorId) => throttledApi.get(`/dynamic-calculators/${calculatorId}`),
  calculate: (calculatorId, inputs) => throttledApi.post(`/dynamic-calculators/${calculatorId}/calculate`, inputs),
  reloadSchemas: () => throttledApi.post('/dynamic-calculators/reload'),
  
  // Unit conversion operations
  convertUnits: (conversionData) => throttledApi.post('/dynamic-calculators/convert/units', conversionData),
  getUnits: (dimension = null) => {
    const endpoint = dimension ? `/dynamic-calculators/units/${dimension}` : '/dynamic-calculators/units';
    return throttledApi.get(endpoint);
  },
  
  // Analyte operations
  getAnalytes: (analyte = null) => {
    const endpoint = analyte ? `/dynamic-calculators/analytes/${analyte}` : '/dynamic-calculators/analytes';
    return throttledApi.get(endpoint);
  },
  getAnalyteDetails: (analyte) => throttledApi.get(`/dynamic-calculators/analytes/${analyte}/details`),
  
  // Validation
  validateConversion: (validationData) => throttledApi.post('/dynamic-calculators/validate', validationData),
};

// Connector: Used by dynamic calculator components for API communication

export const templateService = {
  getAll: () => throttledApi.get('/templates'),
  getById: (id) => throttledApi.get(`/templates/${id}`),
  getByType: (type) => throttledApi.get(`/templates/type/${type}`),
  create: (data) => throttledApi.post('/templates', data),
  update: (id, data) => throttledApi.put(`/templates/${id}`, data),
  delete: (id) => throttledApi.delete(`/templates/${id}`),
  search: (query) => throttledApi.get(`/templates/search?q=${query}`),
};

export const alertService = {
  getAll: () => throttledApi.get('/alerts'),
  getById: (id) => throttledApi.get(`/alerts/${id}`),
  create: (data) => throttledApi.post('/alerts', data),
  update: (id, data) => throttledApi.put(`/alerts/${id}`, data),
  delete: (id) => throttledApi.delete(`/alerts/${id}`),
  markAsDone: (id) => throttledApi.put(`/alerts/${id}`, { status: 'completed' }),
};

export const aiService = {
  chat: (message, patientId) => throttledApi.post('/ai/chat', { message, patientId }),
  getSuggestions: (patientId) => throttledApi.get(`/ai/suggestions/${patientId}`),
};

export const exportService = {
  exportToPdf: (patientId) => throttledApi.get(`/export/pdf/${patientId}`, { responseType: 'blob' }),
  exportToCsv: (patientId) => throttledApi.get(`/export/csv/${patientId}`, { responseType: 'blob' }),
  exportToFhir: (patientId) => throttledApi.get(`/export/fhir/${patientId}`, { responseType: 'blob' }),
};