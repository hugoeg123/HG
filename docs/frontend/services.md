# 🔧 Serviços - Frontend

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [API Services](#-api-services)
- [Auth Services](#-auth-services)
- [Data Services](#-data-services)
- [Utility Services](#-utility-services)
- [Cache Services](#-cache-services)
- [Padrões de Desenvolvimento](#-padrões-de-desenvolvimento)

## 🎯 Visão Geral

Este documento detalha todos os serviços do frontend, suas responsabilidades, métodos e integrações com o backend.

### Arquitetura de Serviços

```
src/services/
├── api/
│   ├── apiClient.js      # Cliente HTTP base
│   ├── endpoints.js      # Definição de endpoints
│   └── interceptors.js   # Interceptadores de request/response
├── auth/
│   ├── authService.js    # Autenticação e autorização
│   └── tokenService.js   # Gerenciamento de tokens
├── data/
│   ├── patientService.js # Operações de pacientes
│   ├── recordService.js  # Operações de registros
│   └── calculatorService.js # Operações de calculadoras
├── utils/
│   ├── cacheService.js   # Cache de dados
│   ├── storageService.js # LocalStorage/SessionStorage
│   └── validationService.js # Validações
└── index.js              # Exportações centralizadas
```

## 🌐 API Services

### apiClient.js

**Localização**: `src/services/api/apiClient.js`

**Responsabilidade**: Cliente HTTP base com configurações globais e interceptadores.

```javascript
/**
 * API Client - Cliente HTTP base para comunicação com backend
 * 
 * Integrates with:
 * - backend/api/ para endpoints REST
 * - authService.js para tokens de autenticação
 * - interceptors.js para tratamento global
 * 
 * Connector: Usado por todos os services de dados
 */

import axios from 'axios';
import { authService } from '../auth/authService';
import { setupInterceptors } from './interceptors';

// Configuração base do cliente
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Configurar interceptadores
setupInterceptors(apiClient);

/**
 * Classe ApiClient - Wrapper para operações HTTP
 */
class ApiClient {
  constructor(client) {
    this.client = client;
  }
  
  /**
   * GET request
   * @param {string} url - Endpoint URL
   * @param {Object} config - Configurações adicionais
   */
  async get(url, config = {}) {
    try {
      const response = await this.client.get(url, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * POST request
   * @param {string} url - Endpoint URL
   * @param {Object} data - Dados para envio
   * @param {Object} config - Configurações adicionais
   */
  async post(url, data = {}, config = {}) {
    try {
      const response = await this.client.post(url, data, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * PUT request
   * @param {string} url - Endpoint URL
   * @param {Object} data - Dados para envio
   * @param {Object} config - Configurações adicionais
   */
  async put(url, data = {}, config = {}) {
    try {
      const response = await this.client.put(url, data, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * PATCH request
   * @param {string} url - Endpoint URL
   * @param {Object} data - Dados para envio
   * @param {Object} config - Configurações adicionais
   */
  async patch(url, data = {}, config = {}) {
    try {
      const response = await this.client.patch(url, data, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * DELETE request
   * @param {string} url - Endpoint URL
   * @param {Object} config - Configurações adicionais
   */
  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Upload de arquivo
   * @param {string} url - Endpoint URL
   * @param {FormData} formData - Dados do formulário
   * @param {Function} onProgress - Callback de progresso
   */
  async upload(url, formData, onProgress = null) {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        };
      }
      
      const response = await this.client.post(url, formData, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Request genérico com configuração customizada
   * @param {Object} config - Configuração completa da requisição
   */
  async request(config) {
    try {
      const response = await this.client.request(config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Processa resposta da API
   * @param {Object} response - Resposta do axios
   */
  handleResponse(response) {
    return {
      data: response.data,
      status: response.status,
      headers: response.headers,
      success: response.status >= 200 && response.status < 300
    };
  }
  
  /**
   * Processa erros da API
   * @param {Object} error - Erro do axios
   */
  handleError(error) {
    if (error.response) {
      // Erro de resposta do servidor
      const apiError = new Error(error.response.data?.message || 'Erro na API');
      apiError.status = error.response.status;
      apiError.data = error.response.data;
      return apiError;
    } else if (error.request) {
      // Erro de rede
      const networkError = new Error('Erro de conexão com o servidor');
      networkError.type = 'NETWORK_ERROR';
      return networkError;
    } else {
      // Erro de configuração
      return new Error('Erro na configuração da requisição');
    }
  }
  
  /**
   * Define token de autenticação
   * @param {string} token - Token JWT
   */
  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }
  
  /**
   * Define base URL
   * @param {string} baseURL - URL base da API
   */
  setBaseURL(baseURL) {
    this.client.defaults.baseURL = baseURL;
  }
}

// Instância singleton
const api = new ApiClient(apiClient);

export default api;
export { ApiClient };
```

---

### endpoints.js

**Localização**: `src/services/api/endpoints.js`

**Responsabilidade**: Definição centralizada de todos os endpoints da API.

```javascript
/**
 * API Endpoints - Definição centralizada de endpoints
 * 
 * Connector: Usado por todos os services para URLs consistentes
 */

const API_VERSION = 'v1';

// Base paths
const BASE_PATHS = {
  AUTH: `/auth`,
  PATIENTS: `/patients`,
  RECORDS: `/records`,
  CALCULATORS: `/calculators`,
  USERS: `/users`,
  FILES: `/files`,
  REPORTS: `/reports`
};

// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${BASE_PATHS.AUTH}/login/`,
  LOGOUT: `${BASE_PATHS.AUTH}/logout/`,
  REFRESH: `${BASE_PATHS.AUTH}/refresh/`,
  REGISTER: `${BASE_PATHS.AUTH}/register/`,
  FORGOT_PASSWORD: `${BASE_PATHS.AUTH}/forgot-password/`,
  RESET_PASSWORD: `${BASE_PATHS.AUTH}/reset-password/`,
  VERIFY_EMAIL: `${BASE_PATHS.AUTH}/verify-email/`,
  PROFILE: `${BASE_PATHS.AUTH}/profile/`
};

// Patient endpoints
export const PATIENT_ENDPOINTS = {
  LIST: `${BASE_PATHS.PATIENTS}/`,
  CREATE: `${BASE_PATHS.PATIENTS}/`,
  DETAIL: (id) => `${BASE_PATHS.PATIENTS}/${id}/`,
  UPDATE: (id) => `${BASE_PATHS.PATIENTS}/${id}/`,
  DELETE: (id) => `${BASE_PATHS.PATIENTS}/${id}/`,
  SEARCH: `${BASE_PATHS.PATIENTS}/search/`,
  EXPORT: `${BASE_PATHS.PATIENTS}/export/`,
  BULK_CREATE: `${BASE_PATHS.PATIENTS}/bulk/`,
  BULK_UPDATE: `${BASE_PATHS.PATIENTS}/bulk/`,
  BULK_DELETE: `${BASE_PATHS.PATIENTS}/bulk/`
};

// Record endpoints
export const RECORD_ENDPOINTS = {
  LIST: `${BASE_PATHS.RECORDS}/`,
  CREATE: `${BASE_PATHS.RECORDS}/`,
  DETAIL: (id) => `${BASE_PATHS.RECORDS}/${id}/`,
  UPDATE: (id) => `${BASE_PATHS.RECORDS}/${id}/`,
  DELETE: (id) => `${BASE_PATHS.RECORDS}/${id}/`,
  BY_PATIENT: (patientId) => `${BASE_PATHS.PATIENTS}/${patientId}/records/`,
  SEARCH: `${BASE_PATHS.RECORDS}/search/`,
  EXPORT: `${BASE_PATHS.RECORDS}/export/`,
  FHIR_EXPORT: (id) => `${BASE_PATHS.RECORDS}/${id}/fhir/`,
  TAGS: `${BASE_PATHS.RECORDS}/tags/`,
  PARSE: `${BASE_PATHS.RECORDS}/parse/`
};

// Calculator endpoints
export const CALCULATOR_ENDPOINTS = {
  LIST: `${BASE_PATHS.CALCULATORS}/`,
  DETAIL: (id) => `${BASE_PATHS.CALCULATORS}/${id}/`,
  EXECUTE: (id) => `${BASE_PATHS.CALCULATORS}/${id}/execute/`,
  HISTORY: `${BASE_PATHS.CALCULATORS}/history/`,
  CATEGORIES: `${BASE_PATHS.CALCULATORS}/categories/`,
  SEARCH: `${BASE_PATHS.CALCULATORS}/search/`,
  FAVORITES: `${BASE_PATHS.CALCULATORS}/favorites/`,
  ADD_FAVORITE: (id) => `${BASE_PATHS.CALCULATORS}/${id}/favorite/`,
  REMOVE_FAVORITE: (id) => `${BASE_PATHS.CALCULATORS}/${id}/favorite/`
};

// User endpoints
export const USER_ENDPOINTS = {
  LIST: `${BASE_PATHS.USERS}/`,
  DETAIL: (id) => `${BASE_PATHS.USERS}/${id}/`,
  UPDATE: (id) => `${BASE_PATHS.USERS}/${id}/`,
  CHANGE_PASSWORD: `${BASE_PATHS.USERS}/change-password/`,
  PREFERENCES: `${BASE_PATHS.USERS}/preferences/`,
  ACTIVITY: `${BASE_PATHS.USERS}/activity/`
};

// File endpoints
export const FILE_ENDPOINTS = {
  UPLOAD: `${BASE_PATHS.FILES}/upload/`,
  DOWNLOAD: (id) => `${BASE_PATHS.FILES}/${id}/download/`,
  DELETE: (id) => `${BASE_PATHS.FILES}/${id}/`,
  LIST: `${BASE_PATHS.FILES}/`,
  METADATA: (id) => `${BASE_PATHS.FILES}/${id}/metadata/`
};

// Report endpoints
export const REPORT_ENDPOINTS = {
  DASHBOARD: `${BASE_PATHS.REPORTS}/dashboard/`,
  PATIENTS: `${BASE_PATHS.REPORTS}/patients/`,
  CALCULATORS: `${BASE_PATHS.REPORTS}/calculators/`,
  USAGE: `${BASE_PATHS.REPORTS}/usage/`,
  EXPORT: `${BASE_PATHS.REPORTS}/export/`
};

// Utility function para construir URLs com query params
export const buildUrl = (endpoint, params = {}) => {
  const url = new URL(endpoint, window.location.origin);
  
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  return url.pathname + url.search;
};

// Utility function para substituir parâmetros na URL
export const replaceUrlParams = (endpoint, params = {}) => {
  let url = endpoint;
  
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
};
```

## 🔐 Auth Services

### authService.js

**Localização**: `src/services/auth/authService.js`

**Responsabilidade**: Gerenciamento de autenticação e autorização.

```javascript
/**
 * Auth Service - Gerenciamento de autenticação
 * 
 * Integrates with:
 * - backend/auth/ para endpoints de autenticação
 * - tokenService.js para gerenciamento de tokens
 * - store/authStore.js para estado global
 * 
 * Connector: Usado por components de auth e guards de rota
 */

import api from '../api/apiClient';
import { AUTH_ENDPOINTS } from '../api/endpoints';
import { tokenService } from './tokenService';
import { storageService } from '../utils/storageService';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.permissions = [];
  }
  
  /**
   * Realizar login
   * @param {Object} credentials - Credenciais de login
   * @param {string} credentials.email - Email do usuário
   * @param {string} credentials.password - Senha do usuário
   * @param {boolean} credentials.rememberMe - Lembrar login
   */
  async login(credentials) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.LOGIN, credentials);
      
      const { user, access_token, refresh_token, permissions } = response.data;
      
      // Salvar tokens
      tokenService.setTokens({
        accessToken: access_token,
        refreshToken: refresh_token
      });
      
      // Configurar token no cliente API
      api.setAuthToken(access_token);
      
      // Salvar dados do usuário
      this.currentUser = user;
      this.isAuthenticated = true;
      this.permissions = permissions || [];
      
      // Persistir dados se "lembrar" estiver marcado
      if (credentials.rememberMe) {
        storageService.setLocal('user', user);
        storageService.setLocal('permissions', permissions);
      } else {
        storageService.setSession('user', user);
        storageService.setSession('permissions', permissions);
      }
      
      return { user, permissions };
    } catch (error) {
      throw new Error(error.message || 'Erro ao fazer login');
    }
  }
  
  /**
   * Realizar logout
   */
  async logout() {
    try {
      // Tentar fazer logout no servidor
      await api.post(AUTH_ENDPOINTS.LOGOUT);
    } catch (error) {
      // Continuar mesmo se falhar no servidor
      console.warn('Erro ao fazer logout no servidor:', error);
    } finally {
      // Limpar dados locais
      this.clearAuthData();
    }
  }
  
  /**
   * Registrar novo usuário
   * @param {Object} userData - Dados do usuário
   */
  async register(userData) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.REGISTER, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Erro ao registrar usuário');
    }
  }
  
  /**
   * Solicitar reset de senha
   * @param {string} email - Email do usuário
   */
  async forgotPassword(email) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Erro ao solicitar reset de senha');
    }
  }
  
  /**
   * Resetar senha
   * @param {Object} resetData - Dados do reset
   * @param {string} resetData.token - Token de reset
   * @param {string} resetData.password - Nova senha
   */
  async resetPassword(resetData) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.RESET_PASSWORD, resetData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Erro ao resetar senha');
    }
  }
  
  /**
   * Atualizar perfil do usuário
   * @param {Object} profileData - Dados do perfil
   */
  async updateProfile(profileData) {
    try {
      const response = await api.put(AUTH_ENDPOINTS.PROFILE, profileData);
      
      // Atualizar dados locais
      this.currentUser = { ...this.currentUser, ...response.data };
      
      // Atualizar storage
      const storage = storageService.getLocal('user') ? 'local' : 'session';
      storageService[storage === 'local' ? 'setLocal' : 'setSession']('user', this.currentUser);
      
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Erro ao atualizar perfil');
    }
  }
  
  /**
   * Verificar se usuário tem permissão
   * @param {string} permission - Permissão a verificar
   */
  hasPermission(permission) {
    if (!this.isAuthenticated) return false;
    
    // Super admin tem todas as permissões
    if (this.permissions.includes('*')) return true;
    
    // Verificar permissão específica
    return this.permissions.includes(permission);
  }
  
  /**
   * Verificar se usuário tem alguma das permissões
   * @param {string[]} permissions - Lista de permissões
   */
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }
  
  /**
   * Verificar se usuário tem todas as permissões
   * @param {string[]} permissions - Lista de permissões
   */
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }
  
  /**
   * Inicializar autenticação (verificar tokens salvos)
   */
  async initializeAuth() {
    try {
      const tokens = tokenService.getTokens();
      
      if (!tokens.accessToken) {
        return false;
      }
      
      // Verificar se token ainda é válido
      if (tokenService.isTokenExpired(tokens.accessToken)) {
        // Tentar renovar com refresh token
        if (tokens.refreshToken && !tokenService.isTokenExpired(tokens.refreshToken)) {
          await this.refreshToken();
        } else {
          this.clearAuthData();
          return false;
        }
      }
      
      // Configurar token no cliente API
      api.setAuthToken(tokens.accessToken);
      
      // Recuperar dados do usuário do storage
      const user = storageService.getLocal('user') || storageService.getSession('user');
      const permissions = storageService.getLocal('permissions') || storageService.getSession('permissions');
      
      if (user) {
        this.currentUser = user;
        this.isAuthenticated = true;
        this.permissions = permissions || [];
        return true;
      }
      
      // Se não tem dados do usuário, buscar do servidor
      await this.fetchCurrentUser();
      return true;
      
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error);
      this.clearAuthData();
      return false;
    }
  }
  
  /**
   * Renovar token de acesso
   */
  async refreshToken() {
    try {
      const tokens = tokenService.getTokens();
      
      if (!tokens.refreshToken) {
        throw new Error('Refresh token não encontrado');
      }
      
      const response = await api.post(AUTH_ENDPOINTS.REFRESH, {
        refresh_token: tokens.refreshToken
      });
      
      const { access_token, refresh_token } = response.data;
      
      // Atualizar tokens
      tokenService.setTokens({
        accessToken: access_token,
        refreshToken: refresh_token || tokens.refreshToken
      });
      
      // Configurar novo token no cliente API
      api.setAuthToken(access_token);
      
      return access_token;
    } catch (error) {
      this.clearAuthData();
      throw new Error('Erro ao renovar token');
    }
  }
  
  /**
   * Buscar dados do usuário atual
   */
  async fetchCurrentUser() {
    try {
      const response = await api.get(AUTH_ENDPOINTS.PROFILE);
      
      this.currentUser = response.data.user;
      this.permissions = response.data.permissions || [];
      this.isAuthenticated = true;
      
      return this.currentUser;
    } catch (error) {
      throw new Error('Erro ao buscar dados do usuário');
    }
  }
  
  /**
   * Limpar dados de autenticação
   */
  clearAuthData() {
    // Limpar propriedades
    this.currentUser = null;
    this.isAuthenticated = false;
    this.permissions = [];
    
    // Limpar tokens
    tokenService.clearTokens();
    
    // Limpar storage
    storageService.removeLocal('user');
    storageService.removeLocal('permissions');
    storageService.removeSession('user');
    storageService.removeSession('permissions');
    
    // Remover token do cliente API
    api.setAuthToken(null);
  }
  
  /**
   * Getters para dados do usuário
   */
  getCurrentUser() {
    return this.currentUser;
  }
  
  getPermissions() {
    return this.permissions;
  }
  
  getIsAuthenticated() {
    return this.isAuthenticated;
  }
}

// Instância singleton
const authService = new AuthService();

export { authService };
export default authService;
```

## 📊 Data Services

### patientService.js

**Localização**: `src/services/data/patientService.js`

**Responsabilidade**: Operações CRUD e busca de pacientes.

```javascript
/**
 * Patient Service - Operações de pacientes
 * 
 * Integrates with:
 * - backend/patients/ para API REST
 * - cacheService.js para cache de dados
 * - validationService.js para validações
 * 
 * Connector: Usado por hooks/usePatients.js e components de pacientes
 */

import api from '../api/apiClient';
import { PATIENT_ENDPOINTS, buildUrl } from '../api/endpoints';
import { cacheService } from '../utils/cacheService';
import { validationService } from '../utils/validationService';

class PatientService {
  constructor() {
    this.cachePrefix = 'patient_';
    this.cacheTime = 5 * 60 * 1000; // 5 minutos
  }
  
  /**
   * Buscar lista de pacientes
   * @param {Object} params - Parâmetros de busca
   * @param {number} params.page - Página
   * @param {number} params.limit - Limite por página
   * @param {string} params.search - Termo de busca
   * @param {Object} params.filters - Filtros adicionais
   */
  async getPatients(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        ordering = '-created_at',
        ...filters
      } = params;
      
      const queryParams = {
        page,
        limit,
        search,
        ordering,
        ...filters
      };
      
      // Verificar cache
      const cacheKey = `${this.cachePrefix}list_${JSON.stringify(queryParams)}`;
      const cachedData = cacheService.get(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      const url = buildUrl(PATIENT_ENDPOINTS.LIST, queryParams);
      const response = await api.get(url);
      
      // Salvar no cache
      cacheService.set(cacheKey, response.data, this.cacheTime);
      
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao buscar pacientes: ${error.message}`);
    }
  }
  
  /**
   * Buscar paciente por ID
   * @param {string|number} id - ID do paciente
   */
  async getPatientById(id) {
    try {
      // Verificar cache
      const cacheKey = `${this.cachePrefix}${id}`;
      const cachedData = cacheService.get(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      const response = await api.get(PATIENT_ENDPOINTS.DETAIL(id));
      
      // Salvar no cache
      cacheService.set(cacheKey, response.data, this.cacheTime);
      
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao buscar paciente: ${error.message}`);
    }
  }
  
  /**
   * Criar novo paciente
   * @param {Object} patientData - Dados do paciente
   */
  async createPatient(patientData) {
    try {
      // Validar dados
      const validationErrors = validationService.validatePatient(patientData);
      if (validationErrors.length > 0) {
        throw new Error(`Dados inválidos: ${validationErrors.join(', ')}`);
      }
      
      const response = await api.post(PATIENT_ENDPOINTS.CREATE, patientData);
      
      // Limpar cache da lista
      this.clearListCache();
      
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao criar paciente: ${error.message}`);
    }
  }
  
  /**
   * Atualizar paciente
   * @param {string|number} id - ID do paciente
   * @param {Object} patientData - Dados atualizados
   */
  async updatePatient(id, patientData) {
    try {
      // Validar dados
      const validationErrors = validationService.validatePatient(patientData, true);
      if (validationErrors.length > 0) {
        throw new Error(`Dados inválidos: ${validationErrors.join(', ')}`);
      }
      
      const response = await api.put(PATIENT_ENDPOINTS.UPDATE(id), patientData);
      
      // Atualizar cache
      const cacheKey = `${this.cachePrefix}${id}`;
      cacheService.set(cacheKey, response.data, this.cacheTime);
      
      // Limpar cache da lista
      this.clearListCache();
      
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao atualizar paciente: ${error.message}`);
    }
  }
  
  /**
   * Excluir paciente
   * @param {string|number} id - ID do paciente
   */
  async deletePatient(id) {
    try {
      await api.delete(PATIENT_ENDPOINTS.DELETE(id));
      
      // Limpar cache
      const cacheKey = `${this.cachePrefix}${id}`;
      cacheService.remove(cacheKey);
      this.clearListCache();
      
      return true;
    } catch (error) {
      throw new Error(`Erro ao excluir paciente: ${error.message}`);
    }
  }
  
  /**
   * Buscar pacientes (busca avançada)
   * @param {string} query - Termo de busca
   * @param {Object} filters - Filtros adicionais
   */
  async searchPatients(query, filters = {}) {
    try {
      const params = {
        q: query,
        ...filters
      };
      
      const url = buildUrl(PATIENT_ENDPOINTS.SEARCH, params);
      const response = await api.get(url);
      
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao buscar pacientes: ${error.message}`);
    }
  }
  
  /**
   * Exportar pacientes
   * @param {Object} params - Parâmetros de exportação
   * @param {string} params.format - Formato (csv, xlsx, pdf)
   * @param {Object} params.filters - Filtros
   */
  async exportPatients(params = {}) {
    try {
      const { format = 'csv', ...filters } = params;
      
      const queryParams = {
        format,
        ...filters
      };
      
      const url = buildUrl(PATIENT_ENDPOINTS.EXPORT, queryParams);
      const response = await api.get(url, {
        responseType: 'blob'
      });
      
      // Criar URL para download
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Criar link temporário para download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `pacientes_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL
      window.URL.revokeObjectURL(downloadUrl);
      
      return true;
    } catch (error) {
      throw new Error(`Erro ao exportar pacientes: ${error.message}`);
    }
  }
  
  /**
   * Criar múltiplos pacientes
   * @param {Array} patientsData - Array de dados de pacientes
   */
  async bulkCreatePatients(patientsData) {
    try {
      // Validar todos os pacientes
      const validationErrors = [];
      patientsData.forEach((patient, index) => {
        const errors = validationService.validatePatient(patient);
        if (errors.length > 0) {
          validationErrors.push(`Paciente ${index + 1}: ${errors.join(', ')}`);
        }
      });
      
      if (validationErrors.length > 0) {
        throw new Error(`Dados inválidos:\n${validationErrors.join('\n')}`);
      }
      
      const response = await api.post(PATIENT_ENDPOINTS.BULK_CREATE, {
        patients: patientsData
      });
      
      // Limpar cache da lista
      this.clearListCache();
      
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao criar pacientes em lote: ${error.message}`);
    }
  }
  
  /**
   * Limpar cache da lista de pacientes
   */
  clearListCache() {
    cacheService.clearByPrefix(`${this.cachePrefix}list_`);
  }
  
  /**
   * Limpar todo o cache de pacientes
   */
  clearCache() {
    cacheService.clearByPrefix(this.cachePrefix);
  }
}

// Instância singleton
const patientService = new PatientService();

export { patientService };
export default patientService;
```

## 🔧 Utility Services

### cacheService.js

**Localização**: `src/services/utils/cacheService.js`

**Responsabilidade**: Gerenciamento de cache em memória com TTL.

```javascript
/**
 * Cache Service - Gerenciamento de cache em memória
 * 
 * Connector: Usado por todos os services de dados para otimização
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }
  
  /**
   * Salvar item no cache
   * @param {string} key - Chave do cache
   * @param {any} data - Dados para cachear
   * @param {number} ttl - Time to live em millisegundos
   */
  set(key, data, ttl = 5 * 60 * 1000) {
    // Limpar timer anterior se existir
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    
    // Salvar dados
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Configurar timer para expiração
    const timer = setTimeout(() => {
      this.remove(key);
    }, ttl);
    
    this.timers.set(key, timer);
  }
  
  /**
   * Recuperar item do cache
   * @param {string} key - Chave do cache
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Verificar se expirou
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.remove(key);
      return null;
    }
    
    return item.data;
  }
  
  /**
   * Verificar se item existe no cache
   * @param {string} key - Chave do cache
   */
  has(key) {
    return this.get(key) !== null;
  }
  
  /**
   * Remover item do cache
   * @param {string} key - Chave do cache
   */
  remove(key) {
    // Limpar timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    
    // Remover item
    this.cache.delete(key);
  }
  
  /**
   * Limpar itens por prefixo
   * @param {string} prefix - Prefixo das chaves
   */
  clearByPrefix(prefix) {
    const keysToRemove = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => this.remove(key));
  }
  
  /**
   * Limpar todo o cache
   */
  clear() {
    // Limpar todos os timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.cache.clear();
    this.timers.clear();
  }
  
  /**
   * Obter estatísticas do cache
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memory: this.getMemoryUsage()
    };
  }
  
  /**
   * Estimar uso de memória (aproximado)
   */
  getMemoryUsage() {
    let size = 0;
    
    for (const [key, value] of this.cache.entries()) {
      size += key.length * 2; // String UTF-16
      size += JSON.stringify(value).length * 2;
    }
    
    return size;
  }
}

// Instância singleton
const cacheService = new CacheService();

export { cacheService };
export default cacheService;
```

## 📋 Padrões de Desenvolvimento

### Estrutura de Service

```javascript
// ServiceName.js
import api from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';
import { cacheService } from '../utils/cacheService';

/**
 * ServiceName - Descrição do serviço
 * 
 * Integrates with:
 * - backend/app/ para API REST
 * - cacheService.js para cache
 * 
 * Connector: Usado por hooks/useServiceName.js
 */
class ServiceName {
  constructor() {
    this.cachePrefix = 'service_';
    this.cacheTime = 5 * 60 * 1000;
  }
  
  // Métodos CRUD
  async getItems(params = {}) { /* */ }
  async getItemById(id) { /* */ }
  async createItem(data) { /* */ }
  async updateItem(id, data) { /* */ }
  async deleteItem(id) { /* */ }
  
  // Métodos utilitários
  clearCache() { /* */ }
}

const serviceName = new ServiceName();
export { serviceName };
export default serviceName;
```

### Padrões de Error Handling

```javascript
// Tratamento consistente de erros
async someMethod() {
  try {
    const response = await api.get('/endpoint');
    return response.data;
  } catch (error) {
    // Log do erro
    console.error('Erro em someMethod:', error);
    
    // Throw com mensagem amigável
    throw new Error(`Erro ao executar operação: ${error.message}`);
  }
}

// Validação de parâmetros
async methodWithValidation(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Dados inválidos fornecidos');
  }
  
  const errors = this.validateData(data);
  if (errors.length > 0) {
    throw new Error(`Validação falhou: ${errors.join(', ')}`);
  }
  
  // Continuar com a operação...
}
```

### Padrões de Cache

```javascript
// Cache com verificação
async getCachedData(key, fetchFunction, ttl = this.cacheTime) {
  // Verificar cache primeiro
  const cached = cacheService.get(key);
  if (cached) {
    return cached;
  }
  
  // Buscar dados
  const data = await fetchFunction();
  
  // Salvar no cache
  cacheService.set(key, data, ttl);
  
  return data;
}

// Invalidação de cache
invalidateCache(pattern) {
  if (pattern) {
    cacheService.clearByPrefix(pattern);
  } else {
    cacheService.clearByPrefix(this.cachePrefix);
  }
}
```

---

> **💡 Dica**: Para exemplos específicos de implementação, consulte os arquivos de serviços no diretório `src/services/`.