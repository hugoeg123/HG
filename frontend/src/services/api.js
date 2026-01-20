import axios from 'axios';

// Enable debug logging via env: set VITE_DEBUG_API=true to see detailed logs
const DEBUG_API = Boolean(import.meta.env.VITE_DEBUG_API);

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
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
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
      if (DEBUG_API) {
        console.log('Token adicionado ao header:', token.substring(0, 20) + '...');
      }
      return config;
    }

    // Fallback: tentar obter do localStorage do Zustand
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        // Verificar se o storage não é um objeto serializado incorretamente
        const parsed = JSON.parse(authStorage);
        const zustandState = parsed?.state;
        const storedToken = zustandState?.token;
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`;
          if (DEBUG_API) {
            console.log('Token do Zustand adicionado ao header:', storedToken.substring(0, 20) + '...');
          }
          return config;
        }
      } catch (_) {
        // Ignorar erros de parse silenciosamente
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

function retryRequest(error) {
  const config = error.config;
  config.__retryCount = config.__retryCount || 0;

  if (config.__retryCount < 3) {
    config.__retryCount += 1;
    const delay = Math.pow(2, config.__retryCount) * 1000; // 2s, 4s, 8s
    if (DEBUG_API) {
      console.warn(`Retrying request in ${delay}ms (attempt ${config.__retryCount}/3):`, config.url);
    }

    return new Promise(resolve => {
      setTimeout(() => {
        resolve(requestThrottler.throttle(() => api(config)));
      }, delay);
    });
  }

  return Promise.reject(error);
}

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

        if (DEBUG_API) {
          console.warn(`Rate limited (429), retrying in ${delay}ms (attempt ${config.__retryCount}/3):`, config.url);
        }

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
      if (DEBUG_API) {
        console.warn('Network error detected, attempting retry:', error.message);
      }
      return retryRequest(error);
    }

    // Handle server errors (5xx) with retry
    if (error.response && error.response.status >= 500) {
      if (DEBUG_API) {
        console.warn('Server error detected, attempting retry:', error.response.status);
      }
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
      if (DEBUG_API) {
        console.debug('Request canceled (expected behavior):', error.config?.url);
      }
      return Promise.reject(error);
    }

    // Log error details for debugging (excluding expected cancellations)
    if (DEBUG_API && error.response?.status !== 401) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        code: error.code,
        message: error.message
      });
    }

    return Promise.reject(error);
  }
);

/**
 * Throttled API wrapper
 * Hook: All API calls go through throttling to prevent rate limiting
 * Exception: Auth requests bypass throttling for better UX
 */
const throttledApi = {
  get: (url, config = {}) => {
    const key = getSingleFlightKey(url, config);
    // Auth requests bypass throttling
    if (url.includes('/auth/')) {
      if (DEBUG_API) {
        console.log('API: Auth GET detected, bypassing throttling:', url);
      }
      return runSingleFlight(key, () => api.get(url, config));
    }
    return runSingleFlight(key, () => requestThrottler.throttle(() => api.get(url, config)));
  },
  post: (url, data, config) => {
    // Auth requests bypass throttling
    if (url.includes('/auth/')) {
      if (DEBUG_API) {
        console.log('API: Auth request detected, bypassing throttling:', url);
      }
      return api.post(url, data, config);
    }
    return requestThrottler.throttle(() => api.post(url, data, config));
  },
  put: (url, data, config) => {
    // Auth requests bypass throttling
    if (url.includes('/auth/')) {
      if (DEBUG_API) {
        console.log('API: Auth request detected, bypassing throttling:', url);
      }
      return api.put(url, data, config);
    }
    return requestThrottler.throttle(() => api.put(url, data, config));
  },
  delete: (url, config) => {
    // Auth requests bypass throttling
    if (url.includes('/auth/')) {
      if (DEBUG_API) {
        console.log('API: Auth request detected, bypassing throttling:', url);
      }
      return api.delete(url, config);
    }
    return requestThrottler.throttle(() => api.delete(url, config));
  },
  patch: (url, data, config) => {
    // Auth requests bypass throttling
    if (url.includes('/auth/')) {
      if (DEBUG_API) {
        console.log('API: Auth request detected, bypassing throttling:', url);
      }
      return api.patch(url, data, config);
    }
    return requestThrottler.throttle(() => api.patch(url, data, config));
  }
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
  getAll: (config = {}) => throttledApi.get('/alerts', config),
  getById: (id) => throttledApi.get(`/alerts/${id}`),
  create: (data) => throttledApi.post('/alerts', data),
  update: (id, data) => throttledApi.put(`/alerts/${id}`, data),
  delete: (id) => throttledApi.delete(`/alerts/${id}`),
  markAsRead: (id) => throttledApi.put(`/alerts/${id}/read`),
  markAllAsRead: () => throttledApi.put('/alerts/mark-all-read'),
  markAsDone: (id) => throttledApi.put(`/alerts/${id}/read`),
};

export const aiService = {
  chat: (message, patientId) => throttledApi.post('/ai/chat', { message, patientId }),
};

// Patient Input Service
// Connector: Integrates with /api/patient-inputs endpoints for patient self-reported data
export const patientInputService = {
  listMy: (params) => throttledApi.get('/patient-inputs', { params }),
  getById: (id) => throttledApi.get(`/patient-inputs/${id}`),
  create: (data) => throttledApi.post('/patient-inputs', data),
};

/**
 * Profile Service
 * Connector: Integrates with /api/patients/:id/profile endpoints
 */
export const profileService = {
  getProfile: (patientId) => throttledApi.get(`/patients/${patientId}/profile`),
  addAnthropometrics: (patientId, data) => throttledApi.post(`/patients/${patientId}/anthropometrics`, data),
  addLifestyle: (patientId, data) => throttledApi.post(`/patients/${patientId}/lifestyle`, data),
  addCondition: (patientId, data) => throttledApi.post(`/patients/${patientId}/conditions`, data),
  updateCondition: (patientId, conditionId, data) => throttledApi.put(`/patients/${patientId}/conditions/${conditionId}`, data),
  addVitalSigns: (patientId, data) => throttledApi.post(`/patients/${patientId}/vital-signs`, data),
};

/**
 * Tag History Service
 * Connector: Consumes `/tag-history/:tagKey` for aggregated timeline
 */
export const tagHistoryService = {
  get: (tagKey, params = {}) => throttledApi.get(`/tag-history/${encodeURIComponent(tagKey)}`, { params })
};

export const agendaService = {
  getSlots: (params) => throttledApi.get('/agenda/slots', { params }),
  createSlot: (data) => throttledApi.post('/agenda/slots', data),
  updateSlot: (id, data) => throttledApi.put(`/agenda/slots/${id}`, data),
  deleteSlot: (id) => throttledApi.delete(`/agenda/slots/${id}`),
  getAppointments: (params) => throttledApi.get('/agenda/appointments', { params }),
  getMyAppointments: (params) => throttledApi.get('/agenda/my-appointments', { params }),
  createAppointment: (data) => throttledApi.post('/agenda/appointments', data),
  updateAppointment: (id, data) => throttledApi.put(`/agenda/appointments/${id}`, data),
  deleteAppointment: (id) => throttledApi.delete(`/agenda/appointments/${id}`),
};

export const exportService = {
  exportToPdf: (patientId) => throttledApi.get(`/export/pdf/${patientId}`, { responseType: 'blob' }),
  exportToCsv: (patientId) => throttledApi.get(`/export/csv/${patientId}`, { responseType: 'blob' }),
  exportToFhir: (patientId) => throttledApi.get(`/export/fhir/${patientId}`, { responseType: 'blob' }),
};

// Single-flight map to deduplicate concurrent GETs for the same resource
const SINGLE_FLIGHT_ENABLED = true;
const singleFlightMap = new Map();
const getSingleFlightKey = (url, config = {}) => {
  const params = config?.params ? JSON.stringify(config.params) : '';
  return `${url}::${params}`;
};
const runSingleFlight = (key, requestFactory) => {
  if (!SINGLE_FLIGHT_ENABLED) return requestFactory();
  if (singleFlightMap.has(key)) {
    return singleFlightMap.get(key);
  }
  const p = requestFactory()
    .finally(() => {
      singleFlightMap.delete(key);
    });
  singleFlightMap.set(key, p);
  return p;
};
