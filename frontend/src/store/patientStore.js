import { create } from 'zustand';
import api from '../services/api';
import { recordService } from '../services/api';

/**
 * Request cache to prevent duplicate API calls
 * Hook: Prevents ERR_INSUFFICIENT_RESOURCES by caching recent requests
 */
const requestCache = new Map();
const CACHE_DURATION = 5000; // 5 seconds

/**
 * Active requests tracker to prevent duplicate simultaneous calls
 * Connector: Integrates with all API methods to prevent resource exhaustion
 */
const activeRequests = new Map();

/**
 * Utility functions for request management
 * Hook: Prevents duplicate requests and implements caching
 */
const getCacheKey = (method, url, params = {}) => {
  return `${method}:${url}:${JSON.stringify(params)}`;
};

const getCachedResponse = (cacheKey) => {
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedResponse = (cacheKey, data) => {
  requestCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

const getActiveRequest = (requestKey) => {
  return activeRequests.get(requestKey);
};

const setActiveRequest = (requestKey, promise) => {
  activeRequests.set(requestKey, promise);
  promise.finally(() => {
    activeRequests.delete(requestKey);
  });
  return promise;
};

import { useAuthStore } from './authStore';

/**
 * Store para gerenciamento de pacientes e registros médicos
 * 
 * @example
 * const { patients, currentPatient, fetchPatients } = usePatientStore();
 * 
 * Hook: Exportado em store/patientStore.js e usado em LeftSidebar.jsx, PatientDetail.jsx e RecordEditor.jsx
 */
const usePatientStore = create((set, get) => ({
  // Estado
  patients: [],
  currentPatient: null,
  currentRecord: null,
  dashboardData: null,
  isLoading: false,
  error: null,
  retryCount: 0,
  maxRetries: 3,
  
  // Ações
  fetchPatients: async (useCache = true) => {
    set({ isLoading: true, error: null });
    
    // Tentar carregar do cache primeiro
    if (useCache) {
      try {
        const cachedPatients = localStorage.getItem('patients');
        if (cachedPatients) {
          const patients = JSON.parse(cachedPatients);
          set({ patients, isLoading: false });
          // Continuar carregando dados atualizados em background
        }
      } catch (error) {
        console.warn('Erro ao carregar cache de pacientes:', error);
        localStorage.removeItem('patients');
      }
    }
    
    try {
      const response = await api.get('/patients');
      const rawPatients = response.data.patients || response.data || [];
      
      // Validar e normalizar dados dos pacientes
      const patients = Array.isArray(rawPatients) ? rawPatients.map(patient => ({
        id: patient?.id || null,
        name: patient?.name || 'Sem Nome',
        // Normalize birthDate/dateOfBirth - backend uses dateOfBirth, frontend uses birthDate
        birthDate: patient?.birthDate || patient?.dateOfBirth || null,
        gender: patient?.gender || null,
        phone: patient?.phone || null,
        email: patient?.email || null,
        address: patient?.address || null,
        recordNumber: patient?.recordNumber || null,
        insurancePlan: patient?.insurancePlan || null,
        observations: patient?.observations || null,
        records: Array.isArray(patient?.records) ? patient.records : [],
        ...patient
      })) : [];
      
      // Reset retry count on success
      set({ patients, isLoading: false, retryCount: 0 });
      
      // Salvar no cache
      localStorage.setItem('patients', JSON.stringify(patients));
      
      return patients;
    } catch (error) {
      const currentState = get();
      
      if (error.response && error.response.status === 401) {
        console.log('401 detectado, logout');
        
        // Incrementar contador de tentativas
        const newRetryCount = currentState.retryCount + 1;
        
        if (newRetryCount >= currentState.maxRetries) {
          console.log(`Máximo de ${currentState.maxRetries} tentativas atingido, fazendo logout`);
          useAuthStore.getState().logout();
          set({ retryCount: 0, isLoading: false, error: 'Sessão expirada' });
        } else {
          console.log(`Tentativa ${newRetryCount} de ${currentState.maxRetries}`);
          set({ retryCount: newRetryCount, isLoading: false });
        }
      } else {
        console.error('Erro ao buscar pacientes:', error);
        set({
          error: error.response?.data?.message || 'Erro ao carregar pacientes',
          isLoading: false,
          patients: []
        });
      }
      return [];
    }
  },
  
  fetchPatientById: async (patientId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/patients/${patientId}`);
      const rawPatient = response.data;
      
      // Validar e normalizar dados do paciente
      const currentPatient = rawPatient ? {
        id: rawPatient?.id || null,
        name: rawPatient?.name || 'Sem Nome',
        // Normalize birthDate/dateOfBirth - backend uses dateOfBirth, frontend uses birthDate
        birthDate: rawPatient?.birthDate || rawPatient?.dateOfBirth || null,
        gender: rawPatient?.gender || null,
        phone: rawPatient?.phone || null,
        email: rawPatient?.email || null,
        address: rawPatient?.address || null,
        recordNumber: rawPatient?.recordNumber || null,
        insurancePlan: rawPatient?.insurancePlan || null,
        observations: rawPatient?.observations || null,
        records: Array.isArray(rawPatient?.records) ? rawPatient.records : [],
        ...rawPatient
      } : null;
      
      set({ currentPatient, isLoading: false });
      return currentPatient;
    } catch (error) {
      console.error(`Erro ao buscar paciente ${patientId}:`, error);
      set({ 
        error: error.response?.data?.message || 'Erro ao carregar dados do paciente', 
        isLoading: false,
        currentPatient: null,
        records: [] // Clear records as well when patient fails to load
      });
      return null;
    }
  },
  
  createPatient: async (patientData) => {
    // Prevent multiple simultaneous patient creation
    const requestKey = `create-patient-${JSON.stringify(patientData)}`;
    const activeRequest = getActiveRequest(requestKey);
    if (activeRequest) {
      console.log('Patient creation already in progress');
      return activeRequest;
    }
    
    set({ isLoading: true, error: null });
    
    const requestPromise = (async () => {
      // Gerar ID temporário para atualização otimista
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const tempPatient = {
        ...patientData,
        id: tempId,
        isTemporary: true,
        createdAt: new Date().toISOString()
      };
      
      // Atualização otimista - adicionar paciente temporário à UI
      set(state => ({
        patients: [...state.patients, tempPatient],
        currentPatient: tempPatient,
        isLoading: false
      }));
      
      try {
        const response = await api.post('/patients', patientData);
        const realPatient = response.data;
        
        // Substituir paciente temporário pelo real
        set(state => ({
          patients: state.patients.map(p => 
            p.id === tempId ? realPatient : p
          ),
          currentPatient: state.currentPatient?.id === tempId 
            ? realPatient 
            : state.currentPatient,
          isLoading: false,
          error: null
        }));
        
        // Atualizar cache
        localStorage.setItem('patients', JSON.stringify(get().patients));
        
        // Clear dashboard cache for new patient
        const dashboardCacheKey = getCacheKey('GET', `/patients/${realPatient.id}/dashboard`);
        requestCache.delete(dashboardCacheKey);
        
        return realPatient;
      } catch (error) {
        console.error('Erro ao criar paciente:', error);
        
        // Rollback - remover paciente temporário em caso de erro
        set(state => ({
          patients: state.patients.filter(p => p.id !== tempId),
          currentPatient: state.currentPatient?.id === tempId 
            ? null 
            : state.currentPatient,
          error: error.response?.data?.message || 'Erro ao criar paciente', 
          isLoading: false 
        }));
        
        throw error;
      }
    })();
    
    return setActiveRequest(requestKey, requestPromise);
  },
  
  updatePatient: async (patientId, patientData) => {
    // Validar ID do paciente
    if (!patientId || patientId === 'undefined') {
      console.error('Erro: ID do paciente não encontrado');
      set({ error: 'ID do paciente não encontrado' });
      return null;
    }
    
    // Verificar se é um paciente temporário
    const currentState = get();
    const isTemporary = patientId.startsWith('temp-');
    
    // Atualização otimista - atualizar UI primeiro
    const optimisticPatients = currentState.patients.map(p => 
      p.id === patientId ? { ...p, ...patientData } : p
    );
    const optimisticCurrentPatient = currentState.currentPatient?.id === patientId 
      ? { ...currentState.currentPatient, ...patientData }
      : currentState.currentPatient;
    
    set({ 
      patients: optimisticPatients,
      currentPatient: optimisticCurrentPatient,
      isLoading: true, 
      error: null 
    });
    
    try {
      let response;
      
      if (isTemporary) {
        // Se for temporário, criar novo paciente no backend
        const fullPatientData = {
          ...currentState.currentPatient,
          ...patientData
        };
        delete fullPatientData.id;
        delete fullPatientData.isTemporary;
        
        response = await api.post('/patients', fullPatientData);
        const realPatient = response.data;
        
        // Substituir paciente temporário pelo real
        set(state => ({
          patients: state.patients.map(p => 
            p.id === patientId ? realPatient : p
          ),
          currentPatient: state.currentPatient?.id === patientId 
            ? realPatient 
            : state.currentPatient,
          isLoading: false
        }));
      } else {
        // Atualizar paciente existente
        response = await api.put(`/patients/${patientId}`, patientData);
        
        // Confirmar atualização com dados do servidor
        set(state => ({
          patients: state.patients.map(p => 
            p.id === patientId ? response.data : p
          ),
          currentPatient: state.currentPatient?.id === patientId 
            ? response.data 
            : state.currentPatient,
          isLoading: false
        }));
      }
      
      // Cache no localStorage
      localStorage.setItem('patients', JSON.stringify(get().patients));
      
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar paciente ${patientId}:`, error);
      
      // Rollback - reverter para estado anterior
      set({ 
        patients: currentState.patients,
        currentPatient: currentState.currentPatient,
        error: error.response?.data?.message || 'Erro ao atualizar paciente', 
        isLoading: false 
      });
      
      return null;
    }
  },
  
  deletePatient: async (patientId) => {
    // Validar ID do paciente
    if (!patientId || patientId === 'undefined') {
      console.error('Erro: ID do paciente não encontrado');
      set({ error: 'ID do paciente não encontrado' });
      return false;
    }
    
    // Verificar se é um paciente temporário
    const isTemporary = patientId.startsWith('temp-');
    
    // Atualização otimista - remover da UI primeiro
    const currentState = get();
    const optimisticPatients = currentState.patients.filter(p => p.id !== patientId);
    const optimisticCurrentPatient = currentState.currentPatient?.id === patientId 
      ? null 
      : currentState.currentPatient;
    
    set({ 
      patients: optimisticPatients,
      currentPatient: optimisticCurrentPatient,
      isLoading: true, 
      error: null 
    });
    
    try {
      if (isTemporary) {
        // Se for temporário, apenas remover da UI (não precisa chamar API)
        set({ isLoading: false });
      } else {
        // Excluir paciente real do backend
        await api.delete(`/patients/${patientId}`);
        set({ isLoading: false });
        
        // Refresh patient list to ensure consistency with server
        // Hook: Ensures UI reflects actual server state after deletion
        try {
          await get().fetchPatients(false); // Force refresh without cache
        } catch (fetchError) {
          console.warn('Failed to refresh patient list after deletion:', fetchError);
        }
      }
      
      // Atualizar cache no localStorage
      localStorage.setItem('patients', JSON.stringify(get().patients));
      
      return true;
    } catch (error) {
      console.error(`Erro ao excluir paciente ${patientId}:`, error);
      
      // Rollback - restaurar paciente na lista
      set({ 
        patients: currentState.patients,
        currentPatient: currentState.currentPatient,
        error: error.response?.data?.message || 'Erro ao excluir paciente', 
        isLoading: false 
      });
      
      return false;
    }
  },
  
  searchPatients: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const response = await patientService.search(query);
      const rawPatients = response.data.patients || response.data || [];
      
      // Validar e normalizar dados dos pacientes
      const patients = Array.isArray(rawPatients) ? rawPatients.map(patient => ({
        id: patient?.id || null,
        name: patient?.name || 'Sem Nome',
        birthDate: patient?.birthDate || null,
        gender: patient?.gender || null,
        phone: patient?.phone || null,
        email: patient?.email || null,
        address: patient?.address || null,
        recordNumber: patient?.recordNumber || null,
        insurancePlan: patient?.insurancePlan || null,
        observations: patient?.observations || null,
        records: Array.isArray(patient?.records) ? patient.records : [],
        ...patient
      })) : [];
      
      set({ patients, isLoading: false });
      return patients;
    } catch (error) {
      console.error(`Erro ao pesquisar pacientes com query "${query}":`, error);
      set({ 
        error: error.response?.data?.message || 'Erro ao pesquisar pacientes', 
        isLoading: false,
        patients: []
      });
      return [];
    }
  },
  
  // Gerenciamento de registros médicos
  fetchPatientRecords: async (patientId) => {
    // Validar ID do paciente
    if (!patientId) {
      console.error('Erro ao buscar registros: ID do paciente não fornecido');
      set({ error: 'ID do paciente não encontrado', isLoading: false });
      return [];
    }
    
    // Verificar se recordService está disponível
    if (typeof recordService === 'undefined' || !recordService || !recordService.getByPatient) {
      console.error('Erro: recordService não está definido ou não possui método getByPatient');
      set({ error: 'Serviço de registros indisponível', isLoading: false });
      return [];
    }
    
    set({ isLoading: true, error: null });
    try {
      const response = await recordService.getByPatient(patientId);
      
      // Garantir que response.data é um array
      const records = Array.isArray(response?.data) ? response.data : [];
      
      // Atualizar os registros do paciente atual
      set(state => {
        if (state.currentPatient?.id === patientId) {
          return {
            currentPatient: {
              ...state.currentPatient,
              records: records
            },
            isLoading: false
          };
        }
        return { isLoading: false };
      });
      
      return records;
    } catch (error) {
      console.error(`Erro ao buscar registros do paciente ${patientId}:`, error);
      set({ 
        error: error.response?.data?.message || 'Erro ao carregar registros médicos', 
        isLoading: false 
      });
      return [];
    }
  },
  
  fetchRecordById: async (recordId) => {
    // Validar ID do registro
    if (!recordId) {
      console.error('Erro ao buscar registro: ID do registro não fornecido');
      set({ error: 'ID do registro não encontrado', isLoading: false });
      return null;
    }
    
    // Verificar se recordService está disponível
    if (typeof recordService === 'undefined' || !recordService || !recordService.getById) {
      console.error('Erro: recordService não está definido ou não possui método getById');
      set({ error: 'Serviço de registros indisponível', isLoading: false });
      return null;
    }
    
    set({ isLoading: true, error: null });
    try {
      const response = await recordService.getById(recordId);
      const record = response?.data || null;
      set({ currentRecord: record, isLoading: false });
      return record;
    } catch (error) {
      console.error(`Erro ao buscar registro ${recordId}:`, error);
      set({ 
        error: error.response?.data?.message || 'Erro ao carregar registro médico', 
        isLoading: false 
      });
      return null;
    }
  },
  
  createRecord: async (recordData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/records', recordData);
      
      // Adicionar o novo registro à lista de registros do paciente
      set(state => {
        if (state.currentPatient?.id === recordData.patientId) {
          const updatedRecords = state.currentPatient.records 
            ? [...state.currentPatient.records, response.data]
            : [response.data];
            
          return {
            currentPatient: {
              ...state.currentPatient,
              records: updatedRecords
            },
            currentRecord: response.data,
            isLoading: false
          };
        }
        return { 
          currentRecord: response.data,
          isLoading: false 
        };
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao criar registro médico:', error);
      set({ 
        error: error.response?.data?.message || 'Erro ao criar registro médico', 
        isLoading: false 
      });
      return null;
    }
  },
  
  updateRecord: async (recordId, recordData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/records/${recordId}`, recordData);
      
      // Atualizar o registro na lista de registros do paciente
      set(state => {
        // Atualizar o registro atual
        const updatedCurrentRecord = state.currentRecord?.id === recordId 
          ? response.data 
          : state.currentRecord;
          
        // Se temos um paciente atual e o registro pertence a ele
        if (state.currentPatient && state.currentPatient.records) {
          const updatedRecords = state.currentPatient.records.map(r => 
            r.id === recordId ? response.data : r
          );
          
          return {
            currentPatient: {
              ...state.currentPatient,
              records: updatedRecords
            },
            currentRecord: updatedCurrentRecord,
            isLoading: false
          };
        }
        
        return { 
          currentRecord: updatedCurrentRecord,
          isLoading: false 
        };
      });
      
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar registro ${recordId}:`, error);
      set({ 
        error: error.response?.data?.message || 'Erro ao atualizar registro médico', 
        isLoading: false 
      });
      return null;
    }
  },
  
  deleteRecord: async (recordId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.delete(`/records/${recordId}`);
      
      // Remover o registro da lista de registros do paciente
      set(state => {
        // Limpar o registro atual se for o mesmo
        const updatedCurrentRecord = state.currentRecord?.id === recordId 
          ? null 
          : state.currentRecord;
          
        // Se temos um paciente atual com registros
        if (state.currentPatient && state.currentPatient.records) {
          const updatedRecords = state.currentPatient.records.filter(r => r.id !== recordId);
          
          return {
            currentPatient: {
              ...state.currentPatient,
              records: updatedRecords
            },
            currentRecord: updatedCurrentRecord,
            isLoading: false
          };
        }
        
        return { 
          currentRecord: updatedCurrentRecord,
          isLoading: false 
        };
      });
      
      return true;
    } catch (error) {
      console.error(`Erro ao excluir registro ${recordId}:`, error);
      set({ 
        error: error.response?.data?.message || 'Erro ao excluir registro médico', 
        isLoading: false 
      });
      return false;
    }
  },
  
  // Dashboard
  fetchPatientDashboard: async (patientId, options = {}) => {
    if (!patientId || patientId === 'undefined') {
      console.error('Erro: ID do paciente não encontrado para dashboard');
      set({ error: 'ID do paciente não encontrado' });
      return null;
    }
    
    // Check cache first (unless force refresh is requested)
    const cacheKey = getCacheKey('GET', `/patients/${patientId}/dashboard`);
    const cachedData = getCachedResponse(cacheKey);
    if (cachedData && !options.forceRefresh) {
      console.debug('Using cached dashboard data for patient:', patientId);
      set({ 
        dashboardData: cachedData,
        isLoading: false,
        error: null
      });
      return cachedData;
    }
    
    // Check if request is already in progress
    const requestKey = `dashboard-${patientId}`;
    const activeRequest = getActiveRequest(requestKey);
    if (activeRequest) {
      console.log('Dashboard request already in progress for patient:', patientId);
      return activeRequest;
    }
    
    set({ isLoading: true, error: null });
    
    const requestPromise = (async () => {
      try {
        const response = await api.get(`/patients/${patientId}/dashboard`, options);
        const dashboardData = response.data;
        
        const processedData = {
          historico: Array.isArray(dashboardData?.historico) ? dashboardData.historico : [],
          investigacao: Array.isArray(dashboardData?.investigacao) ? dashboardData.investigacao : [],
          planos: Array.isArray(dashboardData?.planos) ? dashboardData.planos : [],
          ...dashboardData
        };
        
        // Cache the response
        setCachedResponse(cacheKey, processedData);
        
        set({ 
          dashboardData: processedData, 
          isLoading: false,
          error: null
        });
        
        return processedData;
      } catch (error) {
        // Don't set error state if request was aborted (expected behavior)
        if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          console.debug('Dashboard request was canceled (expected behavior)');
          set({ isLoading: false }); // Reset loading state on cancellation
          return null;
        }
        
        console.error(`Erro ao buscar dashboard do paciente ${patientId}:`, error);
        set({ 
          error: error.response?.data?.message || 'Erro ao carregar dashboard do paciente', 
          isLoading: false,
          dashboardData: null
        });
        throw error;
      } finally {
        // Fallback safety to ensure loading is always reset
        const currentState = get();
        if (currentState.isLoading) {
          set({ isLoading: false });
        }
      }
    })();
    
    return setActiveRequest(requestKey, requestPromise);
  },
  
  // Chat context for AI integration
  chatContext: '',
  
  // Utilitários
  setCurrentPatient: (patient) => {
    // Hook: Type validation to prevent rendering crashes
    if (patient && typeof patient === 'object' && !Array.isArray(patient)) {
      set({ currentPatient: patient });
    } else {
      console.warn('Invalid patient object passed to setCurrentPatient:', patient);
      set({ currentPatient: null });
    }
  },
  setCurrentRecord: (record) => set({ currentRecord: record }),
  clearCurrentPatient: () => set({ currentPatient: null, currentRecord: null, dashboardData: null }),
  clearCurrentRecord: () => set({ currentRecord: null }),
  clearError: () => set({ error: null }),
  // Hook: Force reset loading state to prevent stuck UI
  forceResetLoading: () => set({ isLoading: false }),
  
  // AI Chat Integration
  setChatContext: (content) => {
    // Hook: Integrates with AIAssistant.jsx to add section content to chat
    if (typeof content === 'string' && content.trim()) {
      set({ chatContext: content.trim() });
    }
  },
  clearChatContext: () => set({ chatContext: '' }),
}));

export { usePatientStore };

// Conector: Integra com LeftSidebar.jsx, PatientDetail.jsx e RecordEditor.jsx para gerenciamento de estado