# Frontend Store Directory

## Visão Geral

Este diretório contém os stores Zustand responsáveis pelo gerenciamento de estado global da aplicação Health Guardian. Cada store é especializado em um domínio específico da aplicação.

## Estrutura de Stores

### `authStore.js`
**Propósito**: Gerenciamento de autenticação e autorização de usuários.

**Estado Gerenciado**:
```javascript
{
  user: null,           // Dados do usuário logado
  token: null,          // JWT token de autenticação
  isAuthenticated: false, // Status de autenticação
  isLoading: false,     // Loading state para operações de auth
  error: null           // Mensagens de erro
}
```

**Ações Principais**:
- `login(credentials)`: Autentica usuário
- `logout()`: Remove autenticação e limpa dados
- `register(userData)`: Registra novo usuário
- `refreshToken()`: Renova token de autenticação
- `clearError()`: Limpa mensagens de erro
- `setLoading(status)`: Define estado de loading

**Conectores**:
- **Services**: Integra com `services/api.js` para chamadas de autenticação
- **Components**: Usado em `components/auth/` e `ProtectedRoute.jsx`
- **Persistence**: Token persistido em localStorage
- **Backend**: Integra com `backend/src/routes/auth.routes.js`

### `patientStore.js`
**Propósito**: Gerenciamento de dados de pacientes e registros médicos.

**Estado Gerenciado**:
```javascript
{
  patients: [],           // Lista de pacientes
  currentPatient: null,   // Paciente selecionado
  records: [],           // Registros do paciente atual
  currentRecord: null,   // Registro selecionado
  searchQuery: '',       // Query de busca
  filters: {},          // Filtros aplicados
  isLoading: false,     // Loading state
  error: null,          // Mensagens de erro
  pagination: {         // Dados de paginação
    page: 1,
    limit: 20,
    total: 0
  }
}
```

**Ações Principais**:
- `fetchPatients(params)`: Busca lista de pacientes
- `setCurrentPatient(patient)`: Define paciente ativo
- `createPatient(data)`: Cria novo paciente
- `updatePatient(id, data)`: Atualiza dados do paciente
- `deletePatient(id)`: Remove paciente
- `fetchRecords(patientId)`: Busca registros do paciente
- `createRecord(data)`: Cria novo registro médico
- `updateRecord(id, data)`: Atualiza registro
- `setSearchQuery(query)`: Define query de busca
- `setFilters(filters)`: Aplica filtros
- `clearCurrentPatient()`: Limpa seleção atual

**Conectores**:
- **Services**: Integra com `services/api.js` para operações CRUD
- **Components**: Usado em `PatientView/`, `Layout/LeftSidebar.jsx`
- **Socket**: Recebe atualizações em tempo real via `services/socket.js`
- **Backend**: Integra com `backend/src/routes/patient.routes.js` e `record.routes.js`

### `themeStore.js`
**Propósito**: Gerenciamento de tema e preferências de interface.

**Estado Gerenciado**:
```javascript
{
  theme: 'dark',          // Tema atual (dark/light)
  sidebarCollapsed: false, // Estado da sidebar
  fontSize: 'medium',     // Tamanho da fonte
  language: 'pt-BR',      // Idioma da interface
  notifications: true,    // Notificações habilitadas
  autoSave: true,        // Salvamento automático
  preferences: {}        // Outras preferências do usuário
}
```

**Ações Principais**:
- `setTheme(theme)`: Altera tema da aplicação
- `toggleSidebar()`: Alterna estado da sidebar
- `setFontSize(size)`: Define tamanho da fonte
- `setLanguage(lang)`: Altera idioma
- `toggleNotifications()`: Liga/desliga notificações
- `setPreference(key, value)`: Define preferência específica
- `resetPreferences()`: Restaura configurações padrão

**Conectores**:
- **Components**: Usado em `Layout/` components para UI
- **Persistence**: Preferências salvas em localStorage
- **CSS**: Integra com classes Tailwind para temas
- **i18n**: Pode integrar com sistema de internacionalização

## Padrões de Uso

### Hook Pattern
```javascript
// Uso básico em componente
import { useAuthStore } from '../store/authStore';

const LoginComponent = () => {
  const { login, isLoading, error } = useAuthStore();
  
  const handleLogin = async (credentials) => {
    await login(credentials);
  };
};
```

### Selector Pattern
```javascript
// Uso com seletores para performance
import { usePatientStore } from '../store/patientStore';

const PatientList = () => {
  // Apenas re-renderiza quando patients muda
  const patients = usePatientStore(state => state.patients);
  const fetchPatients = usePatientStore(state => state.fetchPatients);
};
```

### Subscription Pattern
```javascript
// Escuta mudanças no store
import { patientStore } from '../store/patientStore';

// Subscribe para mudanças
const unsubscribe = patientStore.subscribe(
  (state) => state.currentPatient,
  (currentPatient) => {
    console.log('Paciente atual mudou:', currentPatient);
  }
);
```

## Integração com Services

### API Integration
```javascript
// Exemplo de ação que integra com API
const patientStore = create((set, get) => ({
  fetchPatients: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/patients', { params });
      set({ 
        patients: response.data.patients,
        pagination: response.data.pagination,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
    }
  }
}));
```

### Socket Integration
```javascript
// Integração com WebSocket para atualizações em tempo real
import { socket } from '../services/socket';

// Escuta eventos do socket
socket.on('patient:updated', (updatedPatient) => {
  patientStore.getState().updatePatientInList(updatedPatient);
});

socket.on('alert:new', (newAlert) => {
  // Atualizar store de alertas ou notificar usuário
});
```

## Persistência de Dados

### LocalStorage Integration
```javascript
// Middleware para persistir estado
const persistMiddleware = (config) => (set, get, api) =>
  config(
    (...args) => {
      set(...args);
      // Salvar estado relevante no localStorage
      const state = get();
      localStorage.setItem('authState', JSON.stringify({
        token: state.token,
        user: state.user
      }));
    },
    get,
    api
  );
```

### Hydration
```javascript
// Restaurar estado do localStorage na inicialização
const getInitialState = () => {
  try {
    const saved = localStorage.getItem('authState');
    return saved ? JSON.parse(saved) : defaultState;
  } catch {
    return defaultState;
  }
};
```

## Mapa de Integrações

```
store/
├── authStore.js
│   ├── → services/api.js (auth endpoints)
│   ├── → components/auth/ (login, register)
│   ├── → components/ProtectedRoute.jsx
│   └── → localStorage (token persistence)
│
├── patientStore.js
│   ├── → services/api.js (patient/record endpoints)
│   ├── → services/socket.js (real-time updates)
│   ├── → components/PatientView/
│   ├── → components/Layout/LeftSidebar.jsx
│   └── → components/AI/AIAssistant/ (context)
│
└── themeStore.js
    ├── → components/Layout/ (UI preferences)
    ├── → localStorage (preferences persistence)
    └── → CSS classes (theme application)
```

## Middleware e Plugins

### DevTools Integration
```javascript
// Integração com Redux DevTools
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set) => ({
      // store implementation
    }),
    {
      name: 'health-guardian-store'
    }
  )
);
```

### Immer Integration
```javascript
// Uso do Immer para atualizações imutáveis
import { immer } from 'zustand/middleware/immer';

const useStore = create(
  immer((set) => ({
    updatePatient: (id, updates) => set((state) => {
      const patient = state.patients.find(p => p.id === id);
      if (patient) {
        Object.assign(patient, updates);
      }
    })
  }))
);
```

## Performance e Otimização

### Seletores Otimizados
```javascript
// Seletores que evitam re-renders desnecessários
const usePatientNames = () => usePatientStore(
  state => state.patients.map(p => ({ id: p.id, name: p.name })),
  shallow // Comparação shallow para arrays
);
```

### Lazy Loading
```javascript
// Carregamento sob demanda de dados
const usePatientRecords = (patientId) => {
  const records = usePatientStore(state => 
    state.recordsByPatient[patientId] || []
  );
  const fetchRecords = usePatientStore(state => state.fetchRecords);
  
  useEffect(() => {
    if (patientId && records.length === 0) {
      fetchRecords(patientId);
    }
  }, [patientId, records.length, fetchRecords]);
  
  return records;
};
```

## Tratamento de Erros

### Error Boundaries
```javascript
// Store para gerenciar erros globais
const useErrorStore = create((set) => ({
  errors: [],
  addError: (error) => set(state => ({
    errors: [...state.errors, { id: Date.now(), ...error }]
  })),
  removeError: (id) => set(state => ({
    errors: state.errors.filter(e => e.id !== id)
  })),
  clearErrors: () => set({ errors: [] })
}));
```

## Testing

### Unit Tests
```javascript
// Exemplo de teste para store
import { renderHook, act } from '@testing-library/react';
import { usePatientStore } from '../patientStore';

describe('PatientStore', () => {
  test('should add patient to list', () => {
    const { result } = renderHook(() => usePatientStore());
    
    act(() => {
      result.current.addPatient({ id: 1, name: 'Test Patient' });
    });
    
    expect(result.current.patients).toHaveLength(1);
    expect(result.current.patients[0].name).toBe('Test Patient');
  });
});
```

### Integration Tests
```javascript
// Teste de integração com API
import { api } from '../services/api';
import { usePatientStore } from '../store/patientStore';

jest.mock('../services/api');

test('should fetch patients from API', async () => {
  const mockPatients = [{ id: 1, name: 'Test' }];
  api.get.mockResolvedValue({ data: { patients: mockPatients } });
  
  const { result } = renderHook(() => usePatientStore());
  
  await act(async () => {
    await result.current.fetchPatients();
  });
  
  expect(result.current.patients).toEqual(mockPatients);
});
```

## Dependências

- **Zustand**: Biblioteca de gerenciamento de estado
- **Immer**: Para atualizações imutáveis (opcional)
- **Zustand DevTools**: Para debug em desenvolvimento

## Hook de Teste

- **Jest**: Testes unitários para stores
- **React Testing Library**: Testes de hooks
- **MSW**: Mock de APIs para testes de integração

## IA Prompt Sugerido

```
IA prompt: "Crie um novo store Zustand para gerenciar [funcionalidade específica], incluindo ações, seletores, integração com API, persistência e testes. Siga os padrões estabelecidos nos stores existentes."
```

## Troubleshooting

### Problemas Comuns
1. **Re-renders Excessivos**: Usar seletores específicos
2. **Estado Não Persiste**: Verificar middleware de persistência
3. **Memory Leaks**: Limpar subscriptions em useEffect cleanup
4. **Estado Inconsistente**: Verificar atualizações concorrentes

### Debug
- **Zustand DevTools**: Visualizar mudanças de estado
- **React DevTools**: Verificar re-renders
- **Console Logs**: Logs de ações em desenvolvimento