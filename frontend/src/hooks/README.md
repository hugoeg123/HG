# Frontend Hooks Directory

## Visão Geral

Este diretório contém hooks customizados do React para a aplicação Health Guardian. Os hooks encapsulam lógica reutilizável de estado, efeitos colaterais e integrações com APIs, promovendo reutilização de código e separação de responsabilidades.

## Estrutura de Hooks

### Hooks Existentes

#### `useAuth.js`
**Propósito**: Gerenciar autenticação e estado do usuário.

**Funcionalidades**:
- Login/logout de usuários
- Verificação de autenticação
- Gerenciamento de tokens
- Redirecionamento automático

**Conectores**:
- **Store**: Integra com `store/authStore.js`
- **API**: Utiliza `services/api.js` para autenticação
- **Router**: Integra com React Router para redirecionamentos
- **Storage**: Persiste tokens no localStorage

**Uso**:
```javascript
const { user, login, logout, isAuthenticated, loading } = useAuth();
```

#### `usePatients.js`
**Propósito**: Gerenciar dados e operações de pacientes.

**Funcionalidades**:
- CRUD de pacientes
- Busca e filtros
- Paginação
- Cache de dados

**Conectores**:
- **Store**: Integra com `store/patientStore.js`
- **API**: Utiliza `services/api.js` para operações
- **Components**: Usado em `PatientView/` components

**Uso**:
```javascript
const { 
  patients, 
  loading, 
  error, 
  fetchPatients, 
  createPatient, 
  updatePatient, 
  deletePatient 
} = usePatients();
```

#### `useRecords.js`
**Propósito**: Gerenciar registros médicos e operações relacionadas.

**Funcionalidades**:
- CRUD de registros médicos
- Busca por paciente
- Filtros por data/tipo
- Parsing de tags estruturadas

**Conectores**:
- **API**: Utiliza `services/api.js` para operações
- **Components**: Usado em `Tools/` e `PatientView/`
- **AI**: Integra com análises de IA

**Uso**:
```javascript
const { 
  records, 
  loading, 
  fetchRecords, 
  createRecord, 
  updateRecord, 
  parseContent 
} = useRecords(patientId);
```

#### `useWebSocket.js`
**Propósito**: Gerenciar conexões WebSocket para comunicação em tempo real.

**Funcionalidades**:
- Conexão/desconexão automática
- Escuta de eventos
- Envio de mensagens
- Reconexão automática

**Conectores**:
- **Socket**: Utiliza `services/socket.js`
- **Store**: Atualiza stores com dados em tempo real
- **Components**: Usado para notificações e atualizações

**Uso**:
```javascript
const { 
  isConnected, 
  sendMessage, 
  subscribe, 
  unsubscribe 
} = useWebSocket();
```

#### `useLocalStorage.js`
**Propósito**: Gerenciar persistência de dados no localStorage.

**Funcionalidades**:
- Leitura/escrita no localStorage
- Serialização automática
- Sincronização com estado
- Limpeza automática

**Conectores**:
- **Store**: Persiste estado de stores
- **Theme**: Salva preferências de tema
- **Settings**: Persiste configurações do usuário

**Uso**:
```javascript
const [value, setValue, removeValue] = useLocalStorage('key', defaultValue);
```

#### `useDebounce.js`
**Propósito**: Implementar debounce para otimizar performance.

**Funcionalidades**:
- Debounce de valores
- Cancelamento automático
- Configuração de delay

**Conectores**:
- **Search**: Usado em campos de busca
- **API**: Otimiza chamadas de API
- **Forms**: Melhora UX em formulários

**Uso**:
```javascript
const debouncedValue = useDebounce(value, delay);
```

#### `useApi.js`
**Propósito**: Hook genérico para chamadas de API.

**Funcionalidades**:
- Estados de loading/error
- Cache de requisições
- Retry automático
- Cancelamento de requisições

**Conectores**:
- **Services**: Utiliza `services/api.js`
- **Auth**: Integra com autenticação
- **Error**: Tratamento centralizado de erros

**Uso**:
```javascript
const { data, loading, error, refetch } = useApi('/api/endpoint');
```

## Estrutura de Hook Padrão

```javascript
/**
 * Custom Hook: [Nome do Hook]
 * 
 * Propósito: [Descrição da funcionalidade]
 * 
 * Conectores:
 * - Integra com [store/service] para [funcionalidade]
 * - Utiliza [dependência] para [propósito]
 * - Usado em [componentes] para [finalidade]
 * 
 * @param {Object} options - Opções de configuração
 * @returns {Object} Estado e funções do hook
 * 
 * @example
 * const { data, loading, error } = useCustomHook({ option: value });
 * 
 * IA prompt: "Estenda este hook para incluir [funcionalidade específica], 
 * mantendo compatibilidade com uso atual e adicionando [nova capacidade]."
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';
import { api } from '../services/api';

const useCustomHook = (options = {}) => {
  // Estados locais
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs para cleanup
  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);
  
  // Store integration
  const store = useStore();
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Main functionality
  const executeAction = useCallback(async (params) => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const result = await api.someMethod(params, {
        signal: abortControllerRef.current.signal
      });
      
      if (mountedRef.current) {
        setData(result);
        // Update store if needed
        store.updateData(result);
      }
      
    } catch (err) {
      if (mountedRef.current && err.name !== 'AbortError') {
        setError(err.message);
        console.error('Hook error:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [store]);
  
  // Return hook interface
  return {
    data,
    loading,
    error,
    executeAction,
    // Additional utilities
    retry: () => executeAction(options),
    reset: () => {
      setData(null);
      setError(null);
    }
  };
};

export default useCustomHook;
```

## Hooks Específicos

### `useAuth.js`
```javascript
/**
 * Hook de Autenticação
 * 
 * Conectores:
 * - store/authStore.js para estado global
 * - services/api.js para chamadas de login/logout
 * - localStorage para persistência de token
 */

import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { useLocalStorage } from './useLocalStorage';

const useAuth = () => {
  const navigate = useNavigate();
  const { 
    user, 
    isAuthenticated, 
    loading, 
    setUser, 
    setLoading, 
    clearAuth 
  } = useAuthStore();
  
  const [token, setToken, removeToken] = useLocalStorage('auth_token', null);
  
  // Verificar token ao carregar
  useEffect(() => {
    const verifyToken = async () => {
      if (token && !user) {
        try {
          setLoading(true);
          const userData = await api.verifyToken(token);
          setUser(userData);
        } catch (error) {
          console.error('Token inválido:', error);
          removeToken();
          clearAuth();
        } finally {
          setLoading(false);
        }
      }
    };
    
    verifyToken();
  }, [token, user, setUser, setLoading, removeToken, clearAuth]);
  
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      const response = await api.login(credentials);
      
      setToken(response.token);
      setUser(response.user);
      
      // Redirecionar para dashboard
      navigate('/dashboard');
      
      return response;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setToken, setUser, navigate]);
  
  const logout = useCallback(() => {
    removeToken();
    clearAuth();
    navigate('/login');
  }, [removeToken, clearAuth, navigate]);
  
  const updateProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      const updatedUser = await api.updateProfile(profileData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser]);
  
  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateProfile,
    token
  };
};

export default useAuth;
```

### `usePatients.js`
```javascript
/**
 * Hook de Gerenciamento de Pacientes
 * 
 * Conectores:
 * - store/patientStore.js para estado global
 * - services/api.js para operações CRUD
 * - components/PatientView/ para exibição
 */

import { useState, useEffect, useCallback } from 'react';
import { usePatientStore } from '../store/patientStore';
import { api } from '../services/api';
import { useDebounce } from './useDebounce';

const usePatients = () => {
  const {
    patients,
    currentPatient,
    loading,
    error,
    setPatients,
    setCurrentPatient,
    setLoading,
    setError,
    addPatient,
    updatePatient as updatePatientStore,
    removePatient
  } = usePatientStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Buscar pacientes
  const fetchPatients = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        search: debouncedSearch,
        ...filters,
        ...pagination,
        ...options
      };
      
      const response = await api.getPatients(params);
      setPatients(response.data);
      
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar pacientes:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, pagination, setLoading, setError, setPatients]);
  
  // Buscar paciente específico
  const fetchPatient = useCallback(async (patientId) => {
    try {
      setLoading(true);
      const patient = await api.getPatient(patientId);
      setCurrentPatient(patient);
      return patient;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setCurrentPatient]);
  
  // Criar paciente
  const createPatient = useCallback(async (patientData) => {
    try {
      setLoading(true);
      const newPatient = await api.createPatient(patientData);
      addPatient(newPatient);
      return newPatient;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, addPatient]);
  
  // Atualizar paciente
  const updatePatient = useCallback(async (patientId, patientData) => {
    try {
      setLoading(true);
      const updatedPatient = await api.updatePatient(patientId, patientData);
      updatePatientStore(updatedPatient);
      return updatedPatient;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, updatePatientStore]);
  
  // Deletar paciente
  const deletePatient = useCallback(async (patientId) => {
    try {
      setLoading(true);
      await api.deletePatient(patientId);
      removePatient(patientId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, removePatient]);
  
  // Efeito para buscar pacientes quando filtros mudam
  useEffect(() => {
    fetchPatients();
  }, [debouncedSearch, filters, pagination.page]);
  
  return {
    // Estado
    patients,
    currentPatient,
    loading,
    error,
    searchTerm,
    filters,
    pagination,
    
    // Ações
    fetchPatients,
    fetchPatient,
    createPatient,
    updatePatient,
    deletePatient,
    
    // Controles
    setSearchTerm,
    setFilters,
    setPagination,
    
    // Utilitários
    clearError: () => setError(null),
    refreshPatients: () => fetchPatients({ force: true })
  };
};

export default usePatients;
```

### `useWebSocket.js`
```javascript
/**
 * Hook de WebSocket
 * 
 * Conectores:
 * - services/socket.js para conexão WebSocket
 * - store/ para atualizações em tempo real
 * - components/ para notificações
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { socket } from '../services/socket';
import { useAuthStore } from '../store/authStore';

const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const { user } = useAuthStore();
  const listenersRef = useRef(new Map());
  
  // Conectar quando usuário estiver autenticado
  useEffect(() => {
    if (user) {
      socket.connect();
      
      socket.on('connect', () => {
        setIsConnected(true);
        console.log('WebSocket conectado');
        
        // Autenticar socket
        socket.emit('authenticate', { userId: user.id });
      });
      
      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('WebSocket desconectado');
      });
      
      socket.on('error', (error) => {
        console.error('Erro no WebSocket:', error);
      });
      
      // Listener genérico para todas as mensagens
      socket.onAny((event, data) => {
        setLastMessage({ event, data, timestamp: Date.now() });
      });
    }
    
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [user]);
  
  // Subscrever a eventos específicos
  const subscribe = useCallback((event, callback) => {
    if (listenersRef.current.has(event)) {
      socket.off(event, listenersRef.current.get(event));
    }
    
    socket.on(event, callback);
    listenersRef.current.set(event, callback);
    
    return () => {
      socket.off(event, callback);
      listenersRef.current.delete(event);
    };
  }, []);
  
  // Cancelar subscrição
  const unsubscribe = useCallback((event) => {
    if (listenersRef.current.has(event)) {
      socket.off(event, listenersRef.current.get(event));
      listenersRef.current.delete(event);
    }
  }, []);
  
  // Enviar mensagem
  const sendMessage = useCallback((event, data) => {
    if (isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('WebSocket não conectado. Mensagem não enviada:', { event, data });
    }
  }, [isConnected]);
  
  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      listenersRef.current.forEach((callback, event) => {
        socket.off(event, callback);
      });
      listenersRef.current.clear();
    };
  }, []);
  
  return {
    isConnected,
    lastMessage,
    subscribe,
    unsubscribe,
    sendMessage,
    
    // Utilitários
    reconnect: () => socket.connect(),
    disconnect: () => socket.disconnect()
  };
};

export default useWebSocket;
```

### `useApi.js`
```javascript
/**
 * Hook genérico para chamadas de API
 * 
 * Conectores:
 * - services/api.js para requisições HTTP
 * - store/authStore.js para autenticação
 * - Error boundaries para tratamento de erros
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const {
    method = 'GET',
    params = {},
    body = null,
    headers = {},
    cache = true,
    retries = 3,
    retryDelay = 1000,
    immediate = true
  } = options;
  
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());
  const mountedRef = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Gerar chave de cache
  const getCacheKey = useCallback(() => {
    return JSON.stringify({ url, method, params, body });
  }, [url, method, params, body]);
  
  // Executar requisição
  const execute = useCallback(async (overrideOptions = {}) => {
    if (!mountedRef.current) return;
    
    const cacheKey = getCacheKey();
    
    // Verificar cache
    if (cache && method === 'GET' && cacheRef.current.has(cacheKey)) {
      const cachedData = cacheRef.current.get(cacheKey);
      setData(cachedData);
      return cachedData;
    }
    
    let attempt = 0;
    
    while (attempt < retries) {
      try {
        setLoading(true);
        setError(null);
        
        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        abortControllerRef.current = new AbortController();
        
        const requestOptions = {
          method,
          params,
          data: body,
          headers,
          signal: abortControllerRef.current.signal,
          ...overrideOptions
        };
        
        const response = await api.request(url, requestOptions);
        
        if (mountedRef.current) {
          setData(response.data);
          
          // Cache successful GET requests
          if (cache && method === 'GET') {
            cacheRef.current.set(cacheKey, response.data);
          }
        }
        
        return response.data;
        
      } catch (err) {
        attempt++;
        
        if (err.name === 'AbortError') {
          break;
        }
        
        if (attempt >= retries) {
          if (mountedRef.current) {
            setError(err.message || 'Erro na requisição');
            console.error('API Error:', err);
          }
          throw err;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      } finally {
        if (mountedRef.current && attempt >= retries) {
          setLoading(false);
        }
      }
    }
  }, [url, method, params, body, headers, cache, retries, retryDelay, getCacheKey]);
  
  // Auto-execute on mount if immediate is true
  useEffect(() => {
    if (immediate && url) {
      execute();
    }
  }, [immediate, url, execute]);
  
  // Refetch function
  const refetch = useCallback((newOptions = {}) => {
    return execute(newOptions);
  }, [execute]);
  
  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);
  
  return {
    data,
    loading,
    error,
    execute,
    refetch,
    clearCache,
    
    // Utilities
    isIdle: !loading && !error && !data,
    isSuccess: !loading && !error && data !== null,
    isError: !loading && error !== null
  };
};

export default useApi;
```

## Mapa de Integrações

```
hooks/
├── useAuth.js
│   ├── → store/authStore.js (estado global)
│   ├── → services/api.js (login/logout)
│   ├── → localStorage (persistência token)
│   └── → React Router (redirecionamentos)
│
├── usePatients.js
│   ├── → store/patientStore.js (estado global)
│   ├── → services/api.js (CRUD operações)
│   ├── → useDebounce (otimização busca)
│   └── → components/PatientView/ (exibição)
│
├── useRecords.js
│   ├── → services/api.js (operações registros)
│   ├── → components/Tools/ (ferramentas)
│   ├── → AI services (análises)
│   └── → parsing utilities (tags estruturadas)
│
├── useWebSocket.js
│   ├── → services/socket.js (conexão WebSocket)
│   ├── → store/ (atualizações tempo real)
│   ├── → components/ (notificações)
│   └── → auth (autenticação socket)
│
├── useLocalStorage.js
│   ├── → store/ (persistência estado)
│   ├── → theme (preferências)
│   ├── → settings (configurações)
│   └── → auth (tokens)
│
├── useDebounce.js
│   ├── → search (campos busca)
│   ├── → API calls (otimização)
│   └── → forms (UX formulários)
│
└── useApi.js
    ├── → services/api.js (requisições HTTP)
    ├── → auth (autenticação)
    ├── → error handling (tratamento erros)
    └── → cache (otimização performance)
```

## Padrões de Uso

### 1. Hook com Estado Local
```javascript
const useCounter = (initialValue = 0) => {
  const [count, setCount] = useState(initialValue);
  
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);
  
  return { count, increment, decrement, reset };
};
```

### 2. Hook com Efeitos
```javascript
const useDocumentTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};
```

### 3. Hook com Cleanup
```javascript
const useInterval = (callback, delay) => {
  const savedCallback = useRef();
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};
```

### 4. Hook com Store Integration
```javascript
const useTheme = () => {
  const { theme, setTheme } = useThemeStore();
  const [systemTheme, setSystemTheme] = useState('light');
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    const handler = (e) => setSystemTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  
  return {
    theme: effectiveTheme,
    setTheme,
    systemTheme,
    isDark: effectiveTheme === 'dark'
  };
};
```

## Otimização e Performance

### Memoização
```javascript
const useExpensiveCalculation = (data) => {
  return useMemo(() => {
    return data.reduce((acc, item) => {
      // Cálculo complexo
      return acc + item.value * item.multiplier;
    }, 0);
  }, [data]);
};
```

### Debounce e Throttle
```javascript
const useThrottle = (value, limit) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());
  
  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));
    
    return () => clearTimeout(handler);
  }, [value, limit]);
  
  return throttledValue;
};
```

### Lazy Loading
```javascript
const useLazyLoad = (ref, options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      options
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [ref, options, hasLoaded]);
  
  return { isVisible, hasLoaded };
};
```

## Testes de Hooks

### Setup de Teste
```javascript
// tests/hooks/useAuth.test.js
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../src/hooks/useAuth';
import { AuthProvider } from '../../src/store/authStore';

const wrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  test('should login successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password'
      });
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeDefined();
  });
  
  test('should handle login error', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      try {
        await result.current.login({
          email: 'invalid@example.com',
          password: 'wrong'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
    
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

### Mock de Dependências
```javascript
// tests/mocks/api.js
export const mockApi = {
  login: jest.fn(),
  getPatients: jest.fn(),
  createPatient: jest.fn(),
  updatePatient: jest.fn(),
  deletePatient: jest.fn()
};

// tests/hooks/usePatients.test.js
import { renderHook, act } from '@testing-library/react';
import { usePatients } from '../../src/hooks/usePatients';
import { mockApi } from '../mocks/api';

jest.mock('../../src/services/api', () => ({
  api: mockApi
}));

describe('usePatients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should fetch patients on mount', async () => {
    const mockPatients = [{ id: '1', name: 'John Doe' }];
    mockApi.getPatients.mockResolvedValue({ data: mockPatients });
    
    const { result } = renderHook(() => usePatients());
    
    await act(async () => {
      await result.current.fetchPatients();
    });
    
    expect(mockApi.getPatients).toHaveBeenCalled();
    expect(result.current.patients).toEqual(mockPatients);
  });
});
```

## Dependências

- **react**: Hooks básicos (useState, useEffect, etc.)
- **zustand**: Integração com stores
- **react-router-dom**: Navegação e redirecionamentos
- **axios**: Requisições HTTP (via services/api)
- **socket.io-client**: WebSocket (via services/socket)

## Hook de Teste

### Cobertura de Testes
```javascript
// Hook: Testa funcionalidade completa dos hooks customizados
const testHookIntegration = async () => {
  // Testar estados e transições
  // Testar integração com stores
  // Testar cleanup e memory leaks
  // Testar error handling
};
```

## IA Prompt Sugerido

```
IA prompt: "Crie um novo hook customizado para [funcionalidade específica], incluindo gerenciamento de estado, integração com stores, tratamento de erros, cleanup adequado e testes unitários. Siga os padrões estabelecidos e documente todas as integrações."
```

## Boas Práticas

### 1. Naming Convention
- Sempre começar com "use"
- Nome descritivo da funcionalidade
- CamelCase para consistência

### 2. Return Object
```javascript
// ✅ Bom: objeto com propriedades nomeadas
return {
  data,
  loading,
  error,
  refetch
};

// ❌ Evitar: array com posições
return [data, loading, error, refetch];
```

### 3. Cleanup
```javascript
// Sempre limpar recursos
useEffect(() => {
  const subscription = subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### 4. Error Handling
```javascript
// Tratar erros de forma consistente
const [error, setError] = useState(null);

try {
  // operação
} catch (err) {
  setError(err.message);
  console.error('Hook error:', err);
}
```

## Troubleshooting

### Problemas Comuns
1. **Memory Leaks**: Verificar cleanup em useEffect
2. **Stale Closures**: Usar useCallback com dependências corretas
3. **Infinite Loops**: Verificar arrays de dependências
4. **Race Conditions**: Implementar cancelamento de requisições

### Debug
- **React DevTools**: Inspecionar hooks e estado
- **Console Logs**: Adicionar logs para debugging
- **Error Boundaries**: Capturar erros em hooks
- **Performance Profiler**: Identificar re-renders desnecessários