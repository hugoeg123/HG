import { create } from 'zustand';
import { patientService } from '../services/patientService';
import { recordService } from '../services/recordService';
import { normalizePatient, eqId } from '../utils/patientUtils';
import { useAuthStore } from './authStore';

/**
 * Request cache to prevent duplicate API calls
 */
const requestCache = new Map();
const CACHE_DURATION = 5000; // 5 seconds

/**
 * Active requests tracker to prevent duplicate simultaneous calls
 */
const activeRequests = new Map();

/**
 * Utility functions for request management
 */
const getCacheKey = (method, url, params = {}) => {
  return `${method}:${url}:${JSON.stringify(params)}`;
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

/**
 * Store para gerenciamento de pacientes e registros médicos
 */
const usePatientStore = create((set, get) => ({
  // Estado
  patients: [],
  currentPatient: null,
  currentRecord: null,
  dashboardData: null,
  dashboardAbortController: null,
  viewMode: 'dashboard',
  chatContext: null,
  isLoading: false,
  error: null,
  retryCount: 0,
  maxRetries: 3,

  // Ações
  setViewMode: (mode) => set({ viewMode: mode }),
  setChatContext: (context) => set({ chatContext: context }),
  setCurrentPatient: (patient) => set({ currentPatient: patient }),
  setCurrentRecord: (record) => set({ currentRecord: record }),

  fetchPatients: async (useCache = true, options = {}) => {
    set({ isLoading: true, error: null });

    // Tentar carregar do cache primeiro
    if (useCache) {
      try {
        const cachedPatients = localStorage.getItem('patients');
        if (cachedPatients) {
          const patients = JSON.parse(cachedPatients);
          set({ patients, isLoading: false });
        }
      } catch (error) {
        console.warn('Erro ao carregar cache de pacientes:', error);
        localStorage.removeItem('patients');
      }
    }

    try {
      const response = await patientService.getAll();
      const rawPatients = response.data.patients || response.data || [];

      // Validar e normalizar dados dos pacientes
      const patients = Array.isArray(rawPatients) ? rawPatients.map(normalizePatient) : [];

      // Carregar registros para cada paciente (opcional)
      const prefetchRecords = options?.prefetchRecords === true;
      let patientsWithRecords = patients;

      if (prefetchRecords) {
        patientsWithRecords = await Promise.all(
          patients.map(async (patient) => {
            if (patient.recordCount > 0) {
              try {
                const cachedRecords = get().loadRecordsFromCache(patient.id);
                if (cachedRecords.length > 0) {
                  return { ...patient, records: cachedRecords };
                }
                const recordsResponse = await recordService.getByPatient(patient.id);
                const records = Array.isArray(recordsResponse?.data?.records) ? recordsResponse.data.records : [];
                get().saveRecordsToCache(patient.id, records);
                return { ...patient, records };
              } catch (error) {
                console.warn(`Erro ao carregar registros do paciente ${patient.id}:`, error);
              }
            }
            return patient;
          })
        );
      }

      set({ patients: patientsWithRecords, isLoading: false, retryCount: 0 });
      localStorage.setItem('patients', JSON.stringify(patientsWithRecords));
      return patientsWithRecords;
    } catch (error) {
      const currentState = get();
      if (error.response && error.response.status === 401) {
        const newRetryCount = currentState.retryCount + 1;
        if (newRetryCount >= currentState.maxRetries) {
          useAuthStore.getState().logout();
          set({ retryCount: 0, isLoading: false, error: 'Sessão expirada' });
        } else {
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
      const response = await patientService.getById(patientId);
      const rawPatient = response.data;

      // Preserva registros já carregados
      const existingCurrent = get().currentPatient;
      const existingForThisId = existingCurrent && eqId(existingCurrent.id, patientId)
        ? (Array.isArray(existingCurrent.records) ? existingCurrent.records : [])
        : [];
      const cachedRecords = get().loadRecordsFromCache(patientId);
      const preferredRecords = Array.isArray(rawPatient?.records) && rawPatient.records.length > 0
        ? rawPatient.records
        : (cachedRecords && cachedRecords.length > 0 ? cachedRecords : existingForThisId);

      const currentPatient = rawPatient ? {
        ...normalizePatient(rawPatient),
        records: preferredRecords,
      } : null;

      set({ currentPatient, isLoading: false });
      return currentPatient;
    } catch (error) {
      console.error(`Erro ao buscar paciente ${patientId}:`, error);
      if (error.response?.status === 404) {
        try {
          await get().fetchPatients(false);
        } catch (refreshError) {
          console.error('Erro ao atualizar cache após 404:', refreshError);
        }
      }
      set({
        error: error.response?.data?.message || 'Erro ao carregar dados do paciente',
        isLoading: false,
        currentPatient: null,
        records: []
      });
      return null;
    }
  },

  createPatient: async (patientData) => {
    const requestKey = `create-patient-${JSON.stringify(patientData)}`;
    const activeRequest = getActiveRequest(requestKey);
    if (activeRequest) return activeRequest;

    set({ isLoading: true, error: null });

    const requestPromise = (async () => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const tempPatient = {
        ...patientData,
        id: tempId,
        isTemporary: true,
        createdAt: new Date().toISOString()
      };

      set(state => ({
        patients: [...state.patients, tempPatient],
        currentPatient: tempPatient,
        isLoading: false
      }));

      try {
        const response = await patientService.create(patientData);
        const realPatient = normalizePatient(response.data);

        set(state => ({
          patients: state.patients.map(p => p.id === tempId ? realPatient : p),
          currentPatient: realPatient,
          isLoading: false,
          error: null
        }));

        localStorage.setItem('patients', JSON.stringify(get().patients));
        return realPatient;
      } catch (error) {
        console.error('Erro ao criar paciente:', error);
        set(state => ({
          patients: state.patients.filter(p => p.id !== tempId),
          currentPatient: state.currentPatient?.id === tempId ? null : state.currentPatient,
          error: error.response?.data?.message || 'Erro ao criar paciente',
          isLoading: false
        }));
        throw error;
      }
    })();

    return setActiveRequest(requestKey, requestPromise);
  },

  updatePatient: async (patientId, patientData) => {
    if (!patientId || patientId === 'undefined') {
      set({ error: 'ID do paciente não encontrado' });
      return null;
    }

    const currentState = get();
    const isTemporary = (typeof patientId === 'string') && patientId.startsWith('temp-');

    const optimisticPatientsUpdate = currentState.patients.map(p =>
      eqId(p.id, patientId) ? { ...p, ...patientData } : p
    );
    const optimisticCurrentPatient = eqId(currentState.currentPatient?.id, patientId)
      ? { ...currentState.currentPatient, ...patientData }
      : currentState.currentPatient;

    set({
      patients: optimisticPatientsUpdate,
      currentPatient: optimisticCurrentPatient,
      isLoading: true,
      error: null
    });

    try {
      let response;
      if (isTemporary) {
        const fullPatientData = { ...currentState.currentPatient, ...patientData };
        delete fullPatientData.id;
        delete fullPatientData.isTemporary;
        response = await patientService.create(fullPatientData);
      } else {
        const payload = { ...patientData, dateOfBirth: patientData.birthDate || patientData.dateOfBirth };
        response = await patientService.update(patientId, payload);
      }

      const finalPatient = normalizePatient(response.data);

      set(state => ({
        patients: state.patients.map(p => eqId(p.id, patientId) ? finalPatient : p),
        currentPatient: eqId(state.currentPatient?.id, patientId) ? finalPatient : state.currentPatient,
        isLoading: false
      }));

      localStorage.setItem('patients', JSON.stringify(get().patients));
      return finalPatient;
    } catch (error) {
      console.error(`Erro ao atualizar paciente ${patientId}:`, error);
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
    if (!patientId || patientId === 'undefined') {
      set({ error: 'ID do paciente não encontrado' });
      return false;
    }

    const isTemporary = (typeof patientId === 'string') && patientId.startsWith('temp-');
    const currentState = get();

    set({
      patients: currentState.patients.filter(p => !eqId(p.id, patientId)),
      currentPatient: eqId(currentState.currentPatient?.id, patientId) ? null : currentState.currentPatient,
      isLoading: true,
      error: null
    });

    try {
      if (!isTemporary) {
        await patientService.delete(patientId);
        set({ isLoading: false });
        try {
          await get().fetchPatients(false);
        } catch (fetchError) {
          console.warn('Failed to refresh patient list after deletion:', fetchError);
        }
      } else {
        set({ isLoading: false });
      }

      localStorage.setItem('patients', JSON.stringify(get().patients));
      return true;
    } catch (error) {
      console.error(`Erro ao excluir paciente ${patientId}:`, error);
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
      const patients = Array.isArray(rawPatients) ? rawPatients.map(normalizePatient) : [];
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

  loadRecordsFromCache: (patientId) => {
    try {
      const cacheKey = `patient_${patientId}_records`;
      const cachedRecords = localStorage.getItem(cacheKey);
      if (cachedRecords) {
        const records = JSON.parse(cachedRecords);
        return Array.isArray(records) ? records : [];
      }
    } catch (error) {
      console.warn('Erro ao carregar registros do cache:', error);
    }
    return [];
  },

  saveRecordsToCache: (patientId, records) => {
    try {
      const cacheKey = `patient_${patientId}_records`;
      localStorage.setItem(cacheKey, JSON.stringify(records));
    } catch (error) {
      console.warn('Erro ao salvar registros no cache:', error);
    }
  },

  fetchPatientRecords: async (patientId) => {
    if (!patientId) {
      set({ error: 'ID do paciente não encontrado', isLoading: false });
      return [];
    }

    const cachedRecords = get().loadRecordsFromCache(patientId);
    if (cachedRecords.length > 0) {
      set(state => {
        const updatedPatients = state.patients.map(p => 
          eqId(p.id, patientId) ? { ...p, records: cachedRecords } : p
        );
        
        if (eqId(state.currentPatient?.id, patientId)) {
          return { 
            patients: updatedPatients,
            currentPatient: { ...state.currentPatient, records: cachedRecords } 
          };
        }
        return { patients: updatedPatients };
      });
    }

    set({ isLoading: true, error: null });
    try {
      const response = await recordService.getByPatient(patientId);
      const records = Array.isArray(response?.data?.records) ? response.data.records : [];

      get().saveRecordsToCache(patientId, records);

      set(state => {
        const updatedPatients = state.patients.map(p => 
          eqId(p.id, patientId) ? { ...p, records: records } : p
        );

        if (eqId(state.currentPatient?.id, patientId)) {
          return {
            patients: updatedPatients,
            currentPatient: { ...state.currentPatient, records: records },
            isLoading: false
          };
        }
        return { 
          patients: updatedPatients,
          isLoading: false 
        };
      });

      return records;
    } catch (error) {
      console.error(`Erro ao buscar registros do paciente ${patientId}:`, error);
      set({
        error: error.response?.data?.message || 'Erro ao carregar registros médicos',
        isLoading: false
      });
      return cachedRecords;
    }
  },

  fetchRecordById: async (recordId) => {
    if (!recordId) {
      set({ error: 'ID do registro não encontrado', isLoading: false });
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
    if (!recordData.content?.trim()) return null;

    set({ isLoading: true, error: null });
    try {
      const response = await recordService.create(recordData);

      let newRecord;
      if (response.data && response.data.data) {
        newRecord = response.data.data;
      } else if (response.data && response.data.record) {
        newRecord = response.data.record;
      } else if (response.data && response.data.id) {
        newRecord = response.data;
      } else {
        throw new Error("A resposta da API é inválida ou não contém o registro criado.");
      }

      set((state) => {
        const updatedPatients = state.patients.map(p =>
          eqId(p.id, recordData.patientId)
            ? {
              ...p,
              records: [newRecord, ...(p.records || [])],
              recordCount: (p.recordCount || 0) + 1
            }
            : p
        );

        const updatedCurrentPatient = eqId(state.currentPatient?.id, recordData.patientId)
          ? { ...state.currentPatient, records: [newRecord, ...(state.currentPatient.records || [])] }
          : state.currentPatient;

        const updatedRecords = updatedCurrentPatient?.records || [];
        if (recordData.patientId && updatedRecords.length > 0) {
          get().saveRecordsToCache(recordData.patientId, updatedRecords);
        }

        return {
          patients: updatedPatients,
          currentPatient: updatedCurrentPatient,
          currentRecord: newRecord,
          isLoading: false,
        };
      });

      const dashboardCacheKey = getCacheKey('GET', `/patients/${recordData.patientId}/dashboard`);
      requestCache.delete(dashboardCacheKey);
      localStorage.setItem('patients', JSON.stringify(get().patients));

      return newRecord;
    } catch (error) {
      console.error('❌ Falha crítica ao criar registro:', error);
      set({ error: 'Erro ao salvar o registro.', isLoading: false });
      throw error;
    }
  },

  updateRecord: async (recordId, recordData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await recordService.update(recordId, recordData);
      const updatedRecord = response.data.data || response.data.record || response.data;

      set(state => {
        const updatedCurrentRecord = state.currentRecord?.id === recordId
          ? updatedRecord
          : state.currentRecord;

        const updatedPatients = state.patients.map(p => {
          if (p.records && p.records.some(r => r.id === recordId)) {
            return {
              ...p,
              records: p.records.map(r => r.id === recordId ? updatedRecord : r)
            };
          }
          return p;
        });

        if (state.currentPatient && state.currentPatient.records) {
          const updatedRecords = state.currentPatient.records.map(r =>
            r.id === recordId ? updatedRecord : r
          );

          return {
            patients: updatedPatients,
            currentPatient: { ...state.currentPatient, records: updatedRecords },
            currentRecord: updatedCurrentRecord,
            isLoading: false
          };
        }

        return {
          patients: updatedPatients,
          currentRecord: updatedCurrentRecord,
          isLoading: false
        };
      });

      return updatedRecord;
    } catch (error) {
      console.error(`Erro ao atualizar registro ${recordId}:`, error);
      set({
        error: error.response?.data?.message || 'Erro ao atualizar registro',
        isLoading: false
      });
      return null;
    }
  },

  fetchPatientDashboard: async (patientId, options = {}) => {
    if (!patientId) return null;

    // Cancel previous request if exists
    if (get().dashboardAbortController) {
      get().dashboardAbortController.abort();
    }

    const controller = new AbortController();
    set({ isLoading: true, error: null, dashboardAbortController: controller });

    try {
      // Use signal from options if provided, otherwise use our controller
      const signal = options.signal || controller.signal;

      const response = await patientService.getDashboard(patientId, { signal });
      const dashboardData = response.data;

      set({ 
        dashboardData, 
        isLoading: false, 
        dashboardAbortController: null 
      });

      return dashboardData;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        set({ isLoading: false, dashboardAbortController: null });
        return null;
      }

      console.error(`Erro ao buscar dashboard do paciente ${patientId}:`, error);
      set({ 
        error: error.response?.data?.message || 'Erro ao carregar dashboard', 
        isLoading: false,
        dashboardAbortController: null
      });
      return null;
    }
  },

  clearCurrentRecord: () => {
    set({ currentRecord: null });
  },

  clearCurrentPatient: () => {
    set({ currentPatient: null, records: [], dashboardData: null });
  }
}));

export { usePatientStore };
