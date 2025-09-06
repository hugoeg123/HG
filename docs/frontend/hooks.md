# 🎣 Hooks Customizados - Frontend

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Data Hooks](#-data-hooks)
- [UI Hooks](#-ui-hooks)
- [Utility Hooks](#-utility-hooks)
- [Form Hooks](#-form-hooks)
- [Navigation Hooks](#-navigation-hooks)
- [Padrões de Desenvolvimento](#-padrões-de-desenvolvimento)

## 🎯 Visão Geral

Este documento detalha todos os hooks customizados do frontend, suas funcionalidades, parâmetros e exemplos de uso.

### Localização dos Hooks

```
src/hooks/
├── data/
│   ├── useApi.js
│   ├── usePatients.js
│   └── useCalculators.js
├── ui/
│   ├── useModal.js
│   ├── useToast.js
│   └── useTheme.js
├── utils/
│   ├── useDebounce.js
│   ├── useLocalStorage.js
│   └── usePagination.js
└── forms/
    ├── useForm.js
    └── useValidation.js
```

## 📊 Data Hooks

### useApi.js

**Localização**: `src/hooks/data/useApi.js`

**Responsabilidade**: Hook genérico para chamadas de API com estados de loading, error e cache.

```javascript
/**
 * useApi Hook - Gerencia chamadas de API com estados
 * 
 * @param {string} endpoint - Endpoint da API
 * @param {Object} options - Opções da requisição
 * @param {boolean} immediate - Executar imediatamente
 * 
 * Integrates with:
 * - services/api.js para requisições HTTP
 * - utils/cache.js para cache de respostas
 * 
 * Hook: Usado em componentes que fazem requisições
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../../services/api';
import { cacheService } from '../../utils/cache';

const useApi = (endpoint, options = {}, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  
  const {
    method = 'GET',
    params = {},
    body = null,
    cache = false,
    cacheTime = 5 * 60 * 1000, // 5 minutos
    onSuccess,
    onError
  } = options;
  
  const execute = useCallback(async (customParams = {}) => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const finalParams = { ...params, ...customParams };
    const cacheKey = cache ? `${endpoint}_${JSON.stringify(finalParams)}` : null;
    
    // Verificar cache
    if (cache && cacheKey) {
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setError(null);
        return cachedData;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.request({
        url: endpoint,
        method,
        params: finalParams,
        data: body,
        signal: controller.signal
      });
      
      setData(response.data);
      
      // Salvar no cache
      if (cache && cacheKey) {
        cacheService.set(cacheKey, response.data, cacheTime);
      }
      
      onSuccess?.(response.data);
      return response.data;
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Erro na requisição');
        onError?.(err);
      }
      throw err;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [endpoint, method, JSON.stringify(params), body, cache, cacheTime]);
  
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);
  
  useEffect(() => {
    if (immediate) {
      execute();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [execute, immediate]);
  
  return {
    data,
    loading,
    error,
    execute,
    reset
  };
};

export default useApi;
```

**Exemplo de Uso**:

```javascript
// Uso básico
const { data: patients, loading, error } = useApi('/patients');

// Com parâmetros
const { data, execute } = useApi('/patients/search', {
  method: 'GET',
  cache: true
}, false);

// Buscar com parâmetros dinâmicos
const handleSearch = (term) => {
  execute({ q: term });
};
```

---

### usePatients.js

**Localização**: `src/hooks/data/usePatients.js`

**Responsabilidade**: Hook específico para gerenciar dados de pacientes.

```javascript
/**
 * usePatients Hook - Gerencia dados de pacientes
 * 
 * Integrates with:
 * - store/patientStore.js para estado global
 * - services/patientService.js para API
 * - hooks/useApi.js para requisições
 */

import { useCallback } from 'react';
import { usePatientStore } from '../../store/patientStore';
import { patientService } from '../../services/patientService';
import useApi from './useApi';

const usePatients = () => {
  const {
    patients,
    currentPatient,
    totalPages,
    currentPage,
    filters,
    setPatients,
    setCurrentPatient,
    addPatient,
    updatePatient,
    removePatient,
    setFilters,
    setCurrentPage
  } = usePatientStore();
  
  // Buscar lista de pacientes
  const {
    loading: listLoading,
    error: listError,
    execute: fetchPatients
  } = useApi('/patients', {
    method: 'GET',
    cache: true,
    onSuccess: (data) => {
      setPatients(data.results);
    }
  }, false);
  
  // Buscar paciente específico
  const {
    loading: detailLoading,
    error: detailError,
    execute: fetchPatientById
  } = useApi('/patients/:id', {
    method: 'GET',
    cache: true,
    onSuccess: (data) => {
      setCurrentPatient(data);
    }
  }, false);
  
  // Criar novo paciente
  const createPatient = useCallback(async (patientData) => {
    try {
      const newPatient = await patientService.create(patientData);
      addPatient(newPatient);
      return newPatient;
    } catch (error) {
      throw error;
    }
  }, [addPatient]);
  
  // Atualizar paciente
  const editPatient = useCallback(async (id, patientData) => {
    try {
      const updatedPatient = await patientService.update(id, patientData);
      updatePatient(id, updatedPatient);
      return updatedPatient;
    } catch (error) {
      throw error;
    }
  }, [updatePatient]);
  
  // Excluir paciente
  const deletePatient = useCallback(async (id) => {
    try {
      await patientService.delete(id);
      removePatient(id);
    } catch (error) {
      throw error;
    }
  }, [removePatient]);
  
  // Buscar pacientes com filtros
  const searchPatients = useCallback((searchTerm, additionalFilters = {}) => {
    const searchFilters = {
      ...filters,
      ...additionalFilters,
      search: searchTerm
    };
    
    setFilters(searchFilters);
    fetchPatients({ ...searchFilters, page: 1 });
  }, [filters, setFilters, fetchPatients]);
  
  // Carregar página específica
  const loadPage = useCallback((page) => {
    setCurrentPage(page);
    fetchPatients({ ...filters, page });
  }, [filters, setCurrentPage, fetchPatients]);
  
  return {
    // Estado
    patients,
    currentPatient,
    totalPages,
    currentPage,
    filters,
    
    // Loading states
    listLoading,
    detailLoading,
    
    // Errors
    listError,
    detailError,
    
    // Ações
    fetchPatients: () => fetchPatients({ ...filters, page: currentPage }),
    fetchPatientById,
    createPatient,
    editPatient,
    deletePatient,
    searchPatients,
    loadPage,
    setFilters
  };
};

export default usePatients;
```

**Exemplo de Uso**:

```javascript
const PatientList = () => {
  const {
    patients,
    listLoading,
    fetchPatients,
    searchPatients,
    deletePatient
  } = usePatients();
  
  useEffect(() => {
    fetchPatients();
  }, []);
  
  const handleSearch = (term) => {
    searchPatients(term);
  };
  
  const handleDelete = async (id) => {
    await deletePatient(id);
  };
  
  // Render component...
};
```

## 🎨 UI Hooks

### useModal.js

**Localização**: `src/hooks/ui/useModal.js`

**Responsabilidade**: Hook para gerenciar estado de modais.

```javascript
/**
 * useModal Hook - Gerencia estado de modais
 * 
 * @param {boolean} initialOpen - Estado inicial
 * 
 * Hook: Usado em componentes que precisam de modais
 */

import { useState, useCallback } from 'react';

const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [data, setData] = useState(null);
  
  const open = useCallback((modalData = null) => {
    setData(modalData);
    setIsOpen(true);
  }, []);
  
  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);
  
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  return {
    isOpen,
    data,
    open,
    close,
    toggle
  };
};

export default useModal;
```

**Exemplo de Uso**:

```javascript
const PatientForm = () => {
  const deleteModal = useModal();
  const editModal = useModal();
  
  const handleDeleteClick = (patient) => {
    deleteModal.open(patient);
  };
  
  const handleEditClick = (patient) => {
    editModal.open(patient);
  };
  
  return (
    <div>
      {/* Componente */}
      
      <Modal 
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        title="Confirmar Exclusão"
      >
        <p>Deseja excluir {deleteModal.data?.name}?</p>
      </Modal>
    </div>
  );
};
```

---

### useToast.js

**Localização**: `src/hooks/ui/useToast.js`

**Responsabilidade**: Hook para gerenciar notificações toast.

```javascript
/**
 * useToast Hook - Gerencia notificações toast
 * 
 * Integrates with:
 * - store/toastStore.js para estado global
 * - components/ui/Toast.jsx para exibição
 */

import { useCallback } from 'react';
import { useToastStore } from '../../store/toastStore';

const useToast = () => {
  const { addToast, removeToast, clearToasts } = useToastStore();
  
  const toast = useCallback((message, options = {}) => {
    const {
      type = 'info',
      duration = 5000,
      action = null,
      persistent = false
    } = options;
    
    const id = Date.now() + Math.random();
    
    addToast({
      id,
      message,
      type,
      action,
      persistent,
      createdAt: Date.now()
    });
    
    // Auto-remove se não for persistente
    if (!persistent && duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  }, [addToast, removeToast]);
  
  const success = useCallback((message, options = {}) => {
    return toast(message, { ...options, type: 'success' });
  }, [toast]);
  
  const error = useCallback((message, options = {}) => {
    return toast(message, { ...options, type: 'error', duration: 8000 });
  }, [toast]);
  
  const warning = useCallback((message, options = {}) => {
    return toast(message, { ...options, type: 'warning' });
  }, [toast]);
  
  const info = useCallback((message, options = {}) => {
    return toast(message, { ...options, type: 'info' });
  }, [toast]);
  
  return {
    toast,
    success,
    error,
    warning,
    info,
    remove: removeToast,
    clear: clearToasts
  };
};

export default useToast;
```

**Exemplo de Uso**:

```javascript
const PatientForm = () => {
  const { success, error } = useToast();
  
  const handleSubmit = async (data) => {
    try {
      await createPatient(data);
      success('Paciente criado com sucesso!');
    } catch (err) {
      error('Erro ao criar paciente: ' + err.message);
    }
  };
  
  // Render component...
};
```

## 🔧 Utility Hooks

### useDebounce.js

**Localização**: `src/hooks/utils/useDebounce.js`

**Responsabilidade**: Hook para debounce de valores.

```javascript
/**
 * useDebounce Hook - Aplica debounce em valores
 * 
 * @param {any} value - Valor para aplicar debounce
 * @param {number} delay - Delay em millisegundos
 * 
 * Hook: Usado para otimizar buscas e inputs
 */

import { useState, useEffect } from 'react';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

export default useDebounce;
```

**Exemplo de Uso**:

```javascript
const SearchInput = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    if (debouncedSearchTerm) {
      // Fazer busca apenas após 300ms de inatividade
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);
  
  return (
    <input 
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Buscar..."
    />
  );
};
```

---

### useLocalStorage.js

**Localização**: `src/hooks/utils/useLocalStorage.js`

**Responsabilidade**: Hook para sincronizar estado com localStorage.

```javascript
/**
 * useLocalStorage Hook - Sincroniza estado com localStorage
 * 
 * @param {string} key - Chave do localStorage
 * @param {any} initialValue - Valor inicial
 * 
 * Hook: Usado para persistir configurações do usuário
 */

import { useState, useEffect } from 'react';

const useLocalStorage = (key, initialValue) => {
  // Função para ler valor do localStorage
  const readValue = () => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Erro ao ler localStorage key "${key}":`, error);
      return initialValue;
    }
  };
  
  const [storedValue, setStoredValue] = useState(readValue);
  
  // Função para salvar no localStorage
  const setValue = (value) => {
    try {
      // Permitir função como valor
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Erro ao salvar localStorage key "${key}":`, error);
    }
  };
  
  // Escutar mudanças no localStorage de outras abas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Erro ao sincronizar localStorage key "${key}":`, error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);
  
  return [storedValue, setValue];
};

export default useLocalStorage;
```

**Exemplo de Uso**:

```javascript
const UserPreferences = () => {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [language, setLanguage] = useLocalStorage('language', 'pt-BR');
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <div>
      <button onClick={toggleTheme}>
        Tema: {theme}
      </button>
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="pt-BR">Português</option>
        <option value="en-US">English</option>
      </select>
    </div>
  );
};
```

## 📝 Form Hooks

### useForm.js

**Localização**: `src/hooks/forms/useForm.js`

**Responsabilidade**: Hook para gerenciar formulários com validação.

```javascript
/**
 * useForm Hook - Gerencia estado e validação de formulários
 * 
 * @param {Object} initialValues - Valores iniciais
 * @param {Object} validationSchema - Schema de validação
 * @param {Function} onSubmit - Callback de submit
 * 
 * Integrates with:
 * - utils/validation.js para regras de validação
 * - hooks/useValidation.js para validação
 */

import { useState, useCallback } from 'react';
import { useValidation } from './useValidation';

const useForm = (initialValues = {}, validationSchema = {}, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { errors, validate, validateField } = useValidation(validationSchema);
  
  // Atualizar valor de campo
  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Validar campo se já foi tocado
    if (touched[name]) {
      validateField(name, value, values);
    }
  }, [touched, validateField, values]);
  
  // Marcar campo como tocado
  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  }, []);
  
  // Handler para mudança de input
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setValue(name, fieldValue);
  }, [setValue]);
  
  // Handler para blur de input
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setFieldTouched(name, true);
    validateField(name, values[name], values);
  }, [setFieldTouched, validateField, values]);
  
  // Handler para submit
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    
    // Marcar todos os campos como tocados
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    // Validar todos os campos
    const isValid = validate(values);
    
    if (isValid && onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Erro no submit:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validate, onSubmit]);
  
  // Reset do formulário
  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);
  
  // Verificar se formulário é válido
  const isValid = Object.keys(errors).length === 0;
  
  // Verificar se formulário foi modificado
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    setValue,
    setFieldTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset
  };
};

export default useForm;
```

**Exemplo de Uso**:

```javascript
const PatientForm = ({ initialData, onSave }) => {
  const validationSchema = {
    name: {
      required: true,
      minLength: 2
    },
    email: {
      required: true,
      email: true
    },
    age: {
      required: true,
      min: 0,
      max: 150
    }
  };
  
  const {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit
  } = useForm(initialData, validationSchema, onSave);
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          name="name"
          value={values.name || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Nome"
        />
        {touched.name && errors.name && (
          <span className="error">{errors.name}</span>
        )}
      </div>
      
      <div>
        <input
          name="email"
          type="email"
          value={values.email || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Email"
        />
        {touched.email && errors.email && (
          <span className="error">{errors.email}</span>
        )}
      </div>
      
      <button 
        type="submit" 
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
};
```

## 📋 Padrões de Desenvolvimento

### Estrutura de Hook

```javascript
// useCustomHook.js
import { useState, useEffect, useCallback } from 'react';

/**
 * useCustomHook - Descrição do hook
 * 
 * @param {type} param1 - Descrição do parâmetro
 * @param {type} param2 - Descrição do parâmetro
 * 
 * @returns {Object} Objeto com estados e funções
 * 
 * Integrates with:
 * - store/someStore.js para estado global
 * - services/someService.js para lógica
 * 
 * Hook: Usado em ComponentName.jsx
 */
const useCustomHook = (param1, param2) => {
  // 1. Estados locais
  const [state, setState] = useState(initialValue);
  
  // 2. Estados derivados
  const derivedState = useMemo(() => {
    return computeValue(state);
  }, [state]);
  
  // 3. Efeitos
  useEffect(() => {
    // Lógica de efeito
  }, [dependencies]);
  
  // 4. Callbacks
  const handleAction = useCallback(() => {
    // Lógica da ação
  }, [dependencies]);
  
  // 5. Cleanup
  useEffect(() => {
    return () => {
      // Cleanup
    };
  }, []);
  
  // 6. Return
  return {
    // Estados
    state,
    derivedState,
    
    // Ações
    handleAction,
    setState
  };
};

export default useCustomHook;
```

### Convenções de Nomenclatura

```javascript
// Estados
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// Handlers
const handleClick = useCallback(() => {}, []);
const handleSubmit = useCallback(() => {}, []);
const handleChange = useCallback(() => {}, []);

// Flags booleanas
const [isOpen, setIsOpen] = useState(false);
const [isValid, setIsValid] = useState(true);
const [isDirty, setIsDirty] = useState(false);

// Objetos de configuração
const [config, setConfig] = useState({});
const [options, setOptions] = useState({});
const [filters, setFilters] = useState({});
```

### Padrões de Performance

```javascript
// Use useCallback para funções que são passadas como props
const handleClick = useCallback(() => {
  // Lógica
}, [dependencies]);

// Use useMemo para computações custosas
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Use useRef para valores que não devem causar re-render
const timeoutRef = useRef(null);
const previousValueRef = useRef(null);

// Cleanup de efeitos
useEffect(() => {
  const subscription = subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### Padrões de Erro

```javascript
// Tratamento de erro em hooks
const useApiCall = () => {
  const [error, setError] = useState(null);
  
  const execute = useCallback(async () => {
    try {
      setError(null);
      const result = await apiCall();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);
  
  return { execute, error };
};

// Error boundaries em hooks
const useSafeAsync = (asyncFunction) => {
  const [state, setState] = useState({ data: null, error: null, loading: false });
  
  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await asyncFunction(...args);
      setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      setState({ data: null, error, loading: false });
      throw error;
    }
  }, [asyncFunction]);
  
  return { ...state, execute };
};
```

---

> **💡 Dica**: Para exemplos específicos de implementação, consulte os arquivos de hooks no diretório `src/hooks/`.