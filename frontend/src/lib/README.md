# Frontend Lib Directory

## Visão Geral

Este diretório contém bibliotecas, configurações e utilitários de terceiros para a aplicação Health Guardian. O lib organiza integrações com bibliotecas externas, configurações de clientes de API, setup de ferramentas de desenvolvimento e outras dependências que requerem configuração específica.

## Estrutura de Bibliotecas

### Bibliotecas Existentes

#### `utils.js`
**Propósito**: Utilitários gerais e funções auxiliares compartilhadas.

**Funcionalidades**:
- Manipulação de classes CSS
- Merge de objetos e arrays
- Funções de utilidade geral
- Helpers para desenvolvimento

**Conectores**:
- **Components**: Usado em todos os componentes para lógica auxiliar
- **Styles**: Manipulação de classes Tailwind
- **Forms**: Helpers para formulários
- **Utils**: Integração com utilitários específicos

**Exemplo de Uso**:
```javascript
import { cn, clsx, merge, debounce } from '../lib/utils';

const className = cn('base-class', {
  'active-class': isActive,
  'disabled-class': isDisabled
});

const mergedConfig = merge(defaultConfig, userConfig);
const debouncedFn = debounce(callback, 300);
```

#### `api-client.js`
**Propósito**: Cliente HTTP configurado para comunicação com backend.

**Funcionalidades**:
- Configuração do Axios
- Interceptors de request/response
- Tratamento de erros HTTP
- Retry automático
- Timeout configurável

**Conectores**:
- **Services**: Base para todos os serviços de API
- **Auth**: Interceptors de autenticação
- **Store**: Integração com estado global
- **Error**: Tratamento centralizado de erros

**Exemplo de Uso**:
```javascript
import apiClient from '../lib/api-client';

// Requisição GET
const response = await apiClient.get('/patients');

// Requisição POST com dados
const newPatient = await apiClient.post('/patients', patientData);

// Requisição com configuração específica
const data = await apiClient.get('/records', {
  timeout: 10000,
  params: { page: 1, limit: 20 }
});
```

#### `socket-client.js`
**Propósito**: Cliente WebSocket para comunicação em tempo real.

**Funcionalidades**:
- Configuração do Socket.IO
- Gerenciamento de conexão
- Event listeners
- Reconexão automática
- Autenticação via socket

**Conectores**:
- **Services**: Serviço de socket
- **Store**: Atualizações de estado em tempo real
- **Components**: Notificações e updates
- **Auth**: Autenticação de socket

**Exemplo de Uso**:
```javascript
import socketClient from '../lib/socket-client';

// Conectar ao socket
socketClient.connect();

// Escutar eventos
socketClient.on('patient:updated', (data) => {
  updatePatientStore(data);
});

// Emitir eventos
socketClient.emit('join:room', { roomId: 'patients' });

// Desconectar
socketClient.disconnect();
```

#### `validation-schemas.js`
**Propósito**: Esquemas de validação usando Zod ou Yup.

**Funcionalidades**:
- Esquemas de validação tipados
- Validação de formulários
- Transformação de dados
- Mensagens de erro personalizadas

**Conectores**:
- **Forms**: Validação de formulários
- **API**: Validação de dados antes do envio
- **Components**: Feedback de validação
- **Utils**: Integração com validators

**Exemplo de Uso**:
```javascript
import { patientSchema, recordSchema } from '../lib/validation-schemas';

// Validar dados do paciente
const result = patientSchema.safeParse(patientData);
if (!result.success) {
  console.error('Validation errors:', result.error.issues);
}

// Validar e transformar dados
const validatedData = recordSchema.parse(recordData);
```

#### `date-config.js`
**Propósito**: Configuração de bibliotecas de data (date-fns, dayjs).

**Funcionalidades**:
- Configuração de locale
- Formatos de data padrão
- Fusos horários
- Utilitários de data customizados

**Conectores**:
- **Utils**: Formatação de datas
- **Components**: Exibição de datas
- **Forms**: Inputs de data
- **Reports**: Filtros temporais

**Exemplo de Uso**:
```javascript
import { formatDate, parseDate, isValidDate } from '../lib/date-config';

const formattedDate = formatDate(new Date(), 'dd/MM/yyyy');
const parsedDate = parseDate('31/12/2023');
const isValid = isValidDate('2023-12-31');
```

#### `theme-config.js`
**Propósito**: Configuração de tema e estilos da aplicação.

**Funcionalidades**:
- Configuração de cores
- Temas claro/escuro
- Breakpoints responsivos
- Configurações de Tailwind

**Conectores**:
- **Components**: Aplicação de temas
- **Store**: Gerenciamento de tema
- **Styles**: Configurações CSS
- **Utils**: Utilitários de tema

**Exemplo de Uso**:
```javascript
import { getThemeColors, applyTheme, toggleTheme } from '../lib/theme-config';

const colors = getThemeColors('dark');
applyTheme('dark');
toggleTheme();
```

#### `error-handler.js`
**Propósito**: Tratamento centralizado de erros da aplicação.

**Funcionalidades**:
- Captura de erros globais
- Logging de erros
- Notificações de erro
- Retry automático
- Fallbacks de erro

**Conectores**:
- **API**: Tratamento de erros HTTP
- **Components**: Error boundaries
- **Store**: Estado de erro
- **Services**: Logging de erros

**Exemplo de Uso**:
```javascript
import { handleError, logError, showErrorNotification } from '../lib/error-handler';

try {
  await riskyOperation();
} catch (error) {
  handleError(error, {
    context: 'patient-creation',
    showNotification: true,
    retry: true
  });
}
```

#### `storage-config.js`
**Propósito**: Configuração de armazenamento local e sessão.

**Funcionalidades**:
- Wrapper para localStorage/sessionStorage
- Serialização automática
- Expiração de dados
- Compressão de dados
- Fallbacks para cookies

**Conectores**:
- **Auth**: Persistência de tokens
- **Store**: Persistência de estado
- **Settings**: Configurações do usuário
- **Cache**: Armazenamento temporário

**Exemplo de Uso**:
```javascript
import { storage } from '../lib/storage-config';

// Salvar dados com expiração
storage.set('user-preferences', preferences, { expires: '7d' });

// Recuperar dados
const preferences = storage.get('user-preferences');

// Remover dados expirados
storage.cleanup();
```

#### `performance-config.js`
**Propósito**: Configurações de performance e otimização.

**Funcionalidades**:
- Lazy loading de componentes
- Memoização de funções
- Debounce e throttle
- Virtual scrolling
- Code splitting

**Conectores**:
- **Components**: Otimização de renderização
- **Utils**: Funções otimizadas
- **Routes**: Lazy loading de rotas
- **Lists**: Virtual scrolling

**Exemplo de Uso**:
```javascript
import { lazyLoad, memoize, virtualScroll } from '../lib/performance-config';

// Lazy load de componente
const LazyComponent = lazyLoad(() => import('../components/HeavyComponent'));

// Memoização de função custosa
const expensiveFunction = memoize((data) => {
  return heavyCalculation(data);
});

// Virtual scrolling para listas grandes
const VirtualList = virtualScroll({
  itemHeight: 50,
  containerHeight: 400
});
```

#### `analytics-config.js`
**Propósito**: Configuração de analytics e tracking.

**Funcionalidades**:
- Integração com Google Analytics
- Tracking de eventos
- Métricas de performance
- Heatmaps e user behavior

**Conectores**:
- **Components**: Tracking de interações
- **Routes**: Page views
- **Forms**: Conversion tracking
- **Errors**: Error tracking

**Exemplo de Uso**:
```javascript
import { trackEvent, trackPageView, trackError } from '../lib/analytics-config';

// Tracking de evento
trackEvent('patient_created', {
  category: 'patient_management',
  value: 1
});

// Tracking de page view
trackPageView('/patients');

// Tracking de erro
trackError(error, { context: 'form_submission' });
```

## Implementações Detalhadas

### `utils.js`
```javascript
/**
 * Utilitários Gerais da Lib
 * 
 * Conectores:
 * - Usado em components/ para lógica auxiliar
 * - Integra com Tailwind para manipulação de classes
 * - Utilizado em forms/ para helpers
 * 
 * IA prompt: "Estenda os utilitários da lib para incluir [nova funcionalidade], 
 * mantendo compatibilidade com bibliotecas existentes e padrões de código."
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utilitário para combinar classes CSS
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Merge profundo de objetos
export function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

// Verificar se é objeto
export function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Debounce function
export function debounce(func, wait, immediate = false) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle function
export function throttle(func, limit) {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Gerar ID único
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Capitalizar primeira letra
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Truncar texto
export function truncate(str, length = 100, suffix = '...') {
  if (!str || str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
}

// Verificar se está vazio
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// Formatar número com separadores
export function formatNumber(num, options = {}) {
  const {
    locale = 'pt-BR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = options;
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(num);
}

// Converter para slug
export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Copiar para clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback para navegadores mais antigos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackErr) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

// Detectar dispositivo móvel
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Detectar modo escuro do sistema
export function isSystemDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Scroll suave para elemento
export function scrollToElement(elementId, offset = 0) {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.offsetTop - offset;
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  }
}

// Formatar bytes para tamanho legível
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Validar URL
export function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Extrair iniciais do nome
export function getInitials(name, maxLength = 2) {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, maxLength)
    .join('');
}

// Aguardar delay
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry com backoff exponencial
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
}

// Agrupar array por propriedade
export function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
}

// Remover duplicatas de array
export function unique(array, key) {
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }
  
  return [...new Set(array)];
}

// Ordenar array por múltiplas propriedades
export function sortBy(array, ...keys) {
  return array.sort((a, b) => {
    for (const key of keys) {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
}

// Exportar todas as funções
export default {
  cn,
  deepMerge,
  isObject,
  debounce,
  throttle,
  generateId,
  capitalize,
  truncate,
  isEmpty,
  formatNumber,
  slugify,
  copyToClipboard,
  isMobile,
  isSystemDarkMode,
  scrollToElement,
  formatBytes,
  isValidUrl,
  getInitials,
  sleep,
  retryWithBackoff,
  groupBy,
  unique,
  sortBy
};
```

### `api-client.js`
```javascript
/**
 * Cliente de API Configurado
 * 
 * Conectores:
 * - Base para services/api.js
 * - Integra com store/authStore para tokens
 * - Utilizado em error-handler para tratamento
 * 
 * IA prompt: "Configure interceptors adicionais para [nova funcionalidade], 
 * incluindo retry automático, cache e logging de requisições."
 */

import axios from 'axios';
import { toast } from 'sonner';

// Configuração base do cliente
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const DEFAULT_TIMEOUT = 10000;

// Criar instância do axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor de Request
apiClient.interceptors.request.use(
  (config) => {
    // Adicionar token de autenticação
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log da requisição em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        params: config.params
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor de Response
apiClient.interceptors.response.use(
  (response) => {
    // Log da resposta em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    
    return response;
  },
  async (error) => {
    const { response, config } = error;
    
    // Log do erro
    console.error('❌ API Error:', {
      status: response?.status,
      url: config?.url,
      message: error.message,
      data: response?.data
    });
    
    // Tratamento de erros específicos
    switch (response?.status) {
      case 401:
        // Token expirado ou inválido
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        
        // Redirecionar para login se não estiver na página de login
        if (!window.location.pathname.includes('/login')) {
          toast.error('Sessão expirada. Faça login novamente.');
          window.location.href = '/login';
        }
        break;
        
      case 403:
        toast.error('Você não tem permissão para esta ação.');
        break;
        
      case 404:
        toast.error('Recurso não encontrado.');
        break;
        
      case 422:
        // Erro de validação
        const validationErrors = response.data?.errors;
        if (validationErrors) {
          Object.values(validationErrors).forEach(error => {
            toast.error(error);
          });
        } else {
          toast.error('Dados inválidos. Verifique os campos.');
        }
        break;
        
      case 429:
        toast.error('Muitas requisições. Tente novamente em alguns minutos.');
        break;
        
      case 500:
        toast.error('Erro interno do servidor. Tente novamente.');
        break;
        
      default:
        if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
          toast.error('Erro de conexão. Verifique sua internet.');
        } else {
          toast.error('Erro inesperado. Tente novamente.');
        }
    }
    
    return Promise.reject(error);
  }
);

// Função para retry automático
const retryRequest = async (config, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiClient(config);
    } catch (error) {
      lastError = error;
      
      // Não fazer retry para erros 4xx (exceto 429)
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
        throw error;
      }
      
      if (i === maxRetries - 1) {
        throw lastError;
      }
      
      // Aguardar antes do próximo retry
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

// Métodos de conveniência
const api = {
  // GET request
  get: (url, config = {}) => {
    return apiClient.get(url, config);
  },
  
  // POST request
  post: (url, data = {}, config = {}) => {
    return apiClient.post(url, data, config);
  },
  
  // PUT request
  put: (url, data = {}, config = {}) => {
    return apiClient.put(url, data, config);
  },
  
  // PATCH request
  patch: (url, data = {}, config = {}) => {
    return apiClient.patch(url, data, config);
  },
  
  // DELETE request
  delete: (url, config = {}) => {
    return apiClient.delete(url, config);
  },
  
  // Upload de arquivo
  upload: (url, file, onProgress = null, config = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers
      },
      onUploadProgress: onProgress
    });
  },
  
  // Download de arquivo
  download: async (url, filename, config = {}) => {
    const response = await apiClient.get(url, {
      ...config,
      responseType: 'blob'
    });
    
    // Criar link para download
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    return response;
  },
  
  // Request com retry
  withRetry: (config, maxRetries = 3, delay = 1000) => {
    return retryRequest(config, maxRetries, delay);
  },
  
  // Cancelar requisições
  cancelToken: () => {
    return axios.CancelToken.source();
  },
  
  // Verificar se erro é de cancelamento
  isCancel: (error) => {
    return axios.isCancel(error);
  }
};

// Exportar cliente configurado
export default api;
export { apiClient };
```

### `socket-client.js`
```javascript
/**
 * Cliente WebSocket Configurado
 * 
 * Conectores:
 * - Usado em services/socket.js
 * - Integra com store/ para updates em tempo real
 * - Utilizado em components/ para notificações
 * 
 * IA prompt: "Configure eventos de socket para [nova funcionalidade], 
 * incluindo autenticação, rooms e tratamento de reconexão."
 */

import { io } from 'socket.io-client';
import { toast } from 'sonner';

// Configuração do socket
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
const RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 1000;

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = RECONNECTION_ATTEMPTS;
  }
  
  // Conectar ao socket
  connect(options = {}) {
    if (this.socket?.connected) {
      console.log('Socket já está conectado');
      return;
    }
    
    const token = localStorage.getItem('auth_token');
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: RECONNECTION_DELAY,
      ...options
    });
    
    this.setupEventListeners();
    
    if (import.meta.env.DEV) {
      console.log('🔌 Conectando ao socket:', SOCKET_URL);
    }
  }
  
  // Configurar event listeners padrão
  setupEventListeners() {
    // Conexão estabelecida
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      if (import.meta.env.DEV) {
        console.log('✅ Socket conectado:', this.socket.id);
      }
      
      // Emitir evento de autenticação
      const token = localStorage.getItem('auth_token');
      if (token) {
        this.emit('authenticate', { token });
      }
    });
    
    // Desconexão
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      
      if (import.meta.env.DEV) {
        console.log('❌ Socket desconectado:', reason);
      }
      
      if (reason === 'io server disconnect') {
        // Reconectar manualmente se o servidor desconectou
        this.socket.connect();
      }
    });
    
    // Erro de conexão
    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão do socket:', error);
      
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Não foi possível conectar ao servidor em tempo real.');
      }
    });
    
    // Reconexão
    this.socket.on('reconnect', (attemptNumber) => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      if (import.meta.env.DEV) {
        console.log('🔄 Socket reconectado após', attemptNumber, 'tentativas');
      }
      
      toast.success('Conexão em tempo real restabelecida.');
    });
    
    // Tentativa de reconexão
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      if (import.meta.env.DEV) {
        console.log('🔄 Tentativa de reconexão:', attemptNumber);
      }
    });
    
    // Falha na reconexão
    this.socket.on('reconnect_failed', () => {
      console.error('❌ Falha na reconexão do socket');
      toast.error('Não foi possível restabelecer a conexão em tempo real.');
    });
    
    // Autenticação bem-sucedida
    this.socket.on('authenticated', (data) => {
      if (import.meta.env.DEV) {
        console.log('🔐 Socket autenticado:', data);
      }
    });
    
    // Erro de autenticação
    this.socket.on('authentication_error', (error) => {
      console.error('❌ Erro de autenticação do socket:', error);
      
      // Tentar reautenticar com token atualizado
      const token = localStorage.getItem('auth_token');
      if (token) {
        this.emit('authenticate', { token });
      }
    });
  }
  
  // Emitir evento
  emit(event, data = {}) {
    if (!this.socket) {
      console.warn('Socket não está conectado');
      return;
    }
    
    this.socket.emit(event, data);
    
    if (import.meta.env.DEV) {
      console.log('📤 Socket emit:', event, data);
    }
  }
  
  // Escutar evento
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket não está conectado');
      return;
    }
    
    this.socket.on(event, callback);
    
    // Armazenar listener para cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    if (import.meta.env.DEV) {
      console.log('👂 Socket listener adicionado:', event);
    }
  }
  
  // Remover listener
  off(event, callback) {
    if (!this.socket) {
      return;
    }
    
    this.socket.off(event, callback);
    
    // Remover do mapa de listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
    
    if (import.meta.env.DEV) {
      console.log('🔇 Socket listener removido:', event);
    }
  }
  
  // Entrar em uma sala
  joinRoom(room) {
    this.emit('join:room', { room });
    
    if (import.meta.env.DEV) {
      console.log('🏠 Entrando na sala:', room);
    }
  }
  
  // Sair de uma sala
  leaveRoom(room) {
    this.emit('leave:room', { room });
    
    if (import.meta.env.DEV) {
      console.log('🚪 Saindo da sala:', room);
    }
  }
  
  // Desconectar
  disconnect() {
    if (this.socket) {
      // Remover todos os listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket.off(event, callback);
        });
      });
      this.listeners.clear();
      
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      
      if (import.meta.env.DEV) {
        console.log('🔌 Socket desconectado manualmente');
      }
    }
  }
  
  // Verificar status da conexão
  isSocketConnected() {
    return this.socket?.connected || false;
  }
  
  // Obter ID do socket
  getSocketId() {
    return this.socket?.id || null;
  }
}

// Criar instância singleton
const socketClient = new SocketClient();

// Exportar instância
export default socketClient;
export { SocketClient };
```

## Mapa de Integrações

```
lib/
├── utils.js
│   ├── → components/ (lógica auxiliar)
│   ├── → styles/ (manipulação de classes)
│   ├── → forms/ (helpers)
│   └── → utils/ (integração com utilitários)
│
├── api-client.js
│   ├── → services/ (base para APIs)
│   ├── → auth/ (interceptors)
│   ├── → store/ (estado global)
│   └── → error/ (tratamento)
│
├── socket-client.js
│   ├── → services/socket (comunicação real-time)
│   ├── → store/ (updates de estado)
│   ├── → components/ (notificações)
│   └── → auth/ (autenticação)
│
├── validation-schemas.js
│   ├── → forms/ (validação)
│   ├── → api/ (validação pré-envio)
│   ├── → components/ (feedback)
│   └── → utils/ (validators)
│
├── date-config.js
│   ├── → utils/ (formatação)
│   ├── → components/ (exibição)
│   ├── → forms/ (inputs)
│   └── → reports/ (filtros)
│
├── theme-config.js
│   ├── → components/ (aplicação)
│   ├── → store/ (gerenciamento)
│   ├── → styles/ (configurações)
│   └── → utils/ (utilitários)
│
├── error-handler.js
│   ├── → api/ (erros HTTP)
│   ├── → components/ (boundaries)
│   ├── → store/ (estado de erro)
│   └── → services/ (logging)
│
├── storage-config.js
│   ├── → auth/ (tokens)
│   ├── → store/ (persistência)
│   ├── → settings/ (configurações)
│   └── → cache/ (temporário)
│
├── performance-config.js
│   ├── → components/ (otimização)
│   ├── → utils/ (funções otimizadas)
│   ├── → routes/ (lazy loading)
│   └── → lists/ (virtual scrolling)
│
└── analytics-config.js
    ├── → components/ (tracking)
    ├── → routes/ (page views)
    ├── → forms/ (conversions)
    └── → errors/ (error tracking)
```

## Dependências

- **axios**: Cliente HTTP
- **socket.io-client**: WebSocket client
- **clsx**: Manipulação de classes CSS
- **tailwind-merge**: Merge de classes Tailwind
- **zod**: Validação de esquemas
- **date-fns**: Manipulação de datas
- **sonner**: Notificações toast

## Hook de Teste

### Cobertura de Testes
```javascript
// Hook: Testa integração completa das bibliotecas
const testLibIntegration = async () => {
  // Testar cliente de API
  // Testar cliente de socket
  // Testar utilitários
  // Testar configurações
  // Testar integração com componentes
};
```

## IA Prompt Sugerido

```
IA prompt: "Configure nova biblioteca [nome] na pasta lib/, incluindo setup, configuração, integração com componentes existentes e documentação de uso. Siga os padrões estabelecidos e adicione tratamento de erros."
```

## Boas Práticas

### 1. Configuração
- Centralizar configurações em arquivos específicos
- Usar variáveis de ambiente para configurações sensíveis
- Documentar todas as opções de configuração

### 2. Error Handling
- Implementar tratamento de erro robusto
- Fornecer fallbacks para funcionalidades críticas
- Logar erros para debugging

### 3. Performance
- Implementar lazy loading quando apropriado
- Usar memoização para operações custosas
- Otimizar bundle size

### 4. Manutenibilidade
- Manter APIs consistentes
- Documentar mudanças breaking
- Versionar configurações

## Troubleshooting

### Problemas Comuns
1. **API Timeout**: Verificar configurações de timeout
2. **Socket Desconectado**: Verificar configurações de reconexão
3. **Validação Falhando**: Verificar esquemas e tipos
4. **Performance Lenta**: Implementar otimizações

### Debug
- **Network Tab**: Verificar requisições HTTP
- **Console Logs**: Logs de desenvolvimento
- **Socket Events**: Monitorar eventos de socket
- **Performance Profiler**: Identificar gargalos