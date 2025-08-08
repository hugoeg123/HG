# Frontend Services Directory

## Visão Geral

Este diretório contém os serviços responsáveis pela comunicação entre o frontend e o backend, incluindo chamadas HTTP e comunicação em tempo real via WebSocket.

## Estrutura de Arquivos

### `api.js`
**Propósito**: Cliente HTTP centralizado para todas as chamadas à API REST do backend.

**Funcionalidades Principais**:
- Configuração base do Axios com interceptors
- Autenticação automática via tokens
- Tratamento centralizado de erros
- Endpoints para todas as entidades (pacientes, registros, alertas, etc.)

**Conectores**:
- **Backend**: Integra com `backend/src/routes/` (todos os endpoints)
- **Frontend**: Usado por todos os componentes que precisam de dados
- **Store**: Integra com `store/authStore.js` para tokens de autenticação

**Endpoints Principais**:
```javascript
// Autenticação
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout

// Pacientes
GET /api/patients
POST /api/patients
GET /api/patients/:id
PUT /api/patients/:id
DELETE /api/patients/:id

// Registros Médicos
GET /api/records
POST /api/records
GET /api/records/:id
PUT /api/records/:id

// Alertas
GET /api/alerts
POST /api/alerts
PUT /api/alerts/:id

// IA Assistant
POST /api/ai/chat
GET /api/ai/models

// Calculadoras
POST /api/calculators/execute
GET /api/calculators/templates

// Tags e Templates
GET /api/tags
POST /api/tags
GET /api/templates
POST /api/templates
```

### `socket.js`
**Propósito**: Cliente WebSocket para comunicação em tempo real com o backend.

**Funcionalidades Principais**:
- Conexão persistente com o servidor
- Escuta de eventos em tempo real
- Reconexão automática em caso de falha
- Emissão de eventos para o servidor

**Conectores**:
- **Backend**: Integra com `backend/src/services/socket.service.js`
- **Frontend**: Usado por componentes que precisam de atualizações em tempo real
- **Store**: Pode atualizar stores automaticamente com novos dados

**Eventos Principais**:
```javascript
// Eventos de Entrada (do servidor)
'alert:new' - Novo alerta criado
'alert:updated' - Alerta atualizado
'patient:updated' - Dados de paciente atualizados
'record:new' - Novo registro médico
'calculation:result' - Resultado de cálculo

// Eventos de Saída (para o servidor)
'join:patient' - Entrar em sala de paciente específico
'leave:patient' - Sair de sala de paciente
'typing:start' - Usuário começou a digitar
'typing:stop' - Usuário parou de digitar
```

## Padrões de Integração

### Configuração da API
```javascript
// Base URL configurada via variável de ambiente
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

// Interceptors para autenticação
api.interceptors.request.use((config) => {
  const token = authStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Tratamento de Erros
```javascript
// Interceptor de resposta para tratamento global de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Uso em Componentes
```javascript
// Exemplo de uso em componente
import { api } from '../services/api';

const PatientComponent = () => {
  const [patients, setPatients] = useState([]);
  
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get('/patients');
        setPatients(response.data);
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
      }
    };
    
    fetchPatients();
  }, []);
};
```

## Configuração de Ambiente

### Variáveis de Ambiente (`.env`)
```env
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
VITE_NODE_ENV=development
```

### Configuração de Produção
- **HTTPS**: Sempre usar HTTPS em produção
- **CORS**: Configurado no backend para domínios específicos
- **Rate Limiting**: Implementado no backend
- **Timeout**: Configurado para 30 segundos por padrão

## Mapa de Integrações

```
services/
├── api.js
│   ├── → backend/src/routes/auth.routes.js
│   ├── → backend/src/routes/patient.routes.js
│   ├── → backend/src/routes/record.routes.js
│   ├── → backend/src/routes/alert.routes.js
│   ├── → backend/src/routes/ai.routes.js
│   ├── → backend/src/routes/calculator.routes.js
│   ├── → backend/src/routes/tag.routes.js
│   └── → backend/src/routes/template.routes.js
│
└── socket.js
    └── → backend/src/services/socket.service.js
```

## Dependências

- **Axios**: Cliente HTTP para requisições REST
- **Socket.io-client**: Cliente WebSocket para comunicação em tempo real
- **Zustand**: Integração com stores para estado global

## Tratamento de Erros

### Tipos de Erro
- **Network Error**: Falha de conexão com o servidor
- **401 Unauthorized**: Token inválido ou expirado
- **403 Forbidden**: Acesso negado
- **404 Not Found**: Recurso não encontrado
- **500 Internal Server Error**: Erro interno do servidor

### Estratégias de Retry
- **Exponential Backoff**: Para falhas de rede
- **Token Refresh**: Para erros 401
- **Circuit Breaker**: Para múltiplas falhas consecutivas

## Performance e Otimização

### Caching
- **Request Deduplication**: Evita requisições duplicadas
- **Response Caching**: Cache de respostas por tempo limitado
- **Optimistic Updates**: Atualização otimista da UI

### Debouncing
- **Search Queries**: Debounce de 300ms para pesquisas
- **Auto-save**: Debounce de 1s para salvamento automático

## Segurança

### Autenticação
- **JWT Tokens**: Armazenados de forma segura
- **Token Refresh**: Renovação automática antes da expiração
- **Logout Automático**: Em caso de token inválido

### Validação
- **Input Sanitization**: Sanitização de dados antes do envio
- **CSRF Protection**: Proteção contra ataques CSRF
- **XSS Prevention**: Prevenção de ataques XSS

## Hook de Teste

### Testes Unitários
```javascript
// Exemplo de teste para api.js
describe('API Service', () => {
  test('should make authenticated requests', async () => {
    // Mock do token
    authStore.getState().setToken('mock-token');
    
    // Mock da resposta
    const mockResponse = { data: [{ id: 1, name: 'Test Patient' }] };
    jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);
    
    // Teste da requisição
    const result = await api.get('/patients');
    expect(result.data).toEqual(mockResponse.data);
  });
});
```

### Testes de Integração
- **MSW (Mock Service Worker)**: Para mock de APIs em testes
- **Socket.io Mock**: Para testes de WebSocket
- **Error Scenarios**: Testes de cenários de erro

## IA Prompt Sugerido

```
IA prompt: "Crie um novo serviço para integração com API externa (ex: FHIR), incluindo autenticação, tratamento de erros e cache. Integre com o sistema de services existente e forneça exemplos de uso e documentação JSDoc."
```

## Troubleshooting

### Problemas Comuns
1. **CORS Error**: Verificar configuração no backend
2. **Network Timeout**: Aumentar timeout ou verificar conectividade
3. **401 Errors**: Verificar validade do token
4. **Socket Disconnection**: Implementar reconexão automática

### Debug
- **Network Tab**: Verificar requisições no DevTools
- **Console Logs**: Logs detalhados em desenvolvimento
- **Error Boundary**: Captura de erros em componentes