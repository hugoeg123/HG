# Services

## api.js

**Descrição**: Cliente HTTP centralizado para comunicação com o backend.

**Funcionalidades**:
Configuração base do Axios com interceptors
Autenticação automática via tokens
Tratamento centralizado de erros
Endpoints para todas as entidades (pacientes, registros, alertas, etc.)

**Conectores**:
**Backend**: Integra com `backend/src/routes/` (todos os endpoints)
**Frontend**: Usado por todos os componentes que precisam de dados
**Store**: Integra com `store/authStore.js` para tokens de autenticação

**Endpoints Disponíveis**:
```javascript
// Autenticação
POST /auth/login
POST /auth/register
POST /auth/refresh
POST /auth/logout

// Pacientes
GET /patients
POST /patients
GET /patients/:id
PUT /patients/:id
DELETE /patients/:id

// Registros Médicos
GET /records
POST /records
GET /records/:id
PUT /records/:id
DELETE /records/:id
GET /patients/:id/records

// Alertas
GET /alerts
POST /alerts
PUT /alerts/:id
DELETE /alerts/:id

// Templates
GET /templates
POST /templates
PUT /templates/:id
DELETE /templates/:id

// Relatórios
GET /reports/dashboard
GET /reports/patients
GET /reports/records
```

## socket.js

**Descrição**: Cliente WebSocket para comunicação em tempo real.

**Funcionalidades**:
Conexão persistente com o servidor
Escuta de eventos em tempo real
Reconexão automática em caso de falha
Emissão de eventos para o servidor

**Conectores**:
**Backend**: Integra com `backend/src/services/socket.service.js`
**Frontend**: Usado por componentes que precisam de atualizações em tempo real
**Store**: Pode atualizar stores automaticamente com novos dados

**Eventos Disponíveis**:
```javascript
// Eventos de entrada (do servidor)
'patient:created'
'patient:updated'
'patient:deleted'
'record:created'
'record:updated'
'record:deleted'
'alert:created'
'alert:updated'
'notification:new'

// Eventos de saída (para o servidor)
'join:room'
'leave:room'
'typing:start'
'typing:stop'
```

**Uso**:
```javascript
import { socket } from '../services/socket';

// Escutar eventos
socket.on('patient:created', (patient) => {
  // Atualizar store ou componente
});

// Emitir eventos
socket.emit('join:room', { roomId: 'patients' });
```

## Configuração de Segurança

**HTTPS**: Sempre usar HTTPS em produção
**CORS**: Configurado no backend para domínios específicos
**Rate Limiting**: Implementado no backend
**Timeout**: Configurado para 30 segundos por padrão

## Dependências

**Axios**: Cliente HTTP para requisições REST
**Socket.io-client**: Cliente WebSocket para comunicação em tempo real
**Zustand**: Integração com stores para estado global

## Tratamento de Erros

**Network Error**: Falha de conexão com o servidor
**401 Unauthorized**: Token inválido ou expirado
**403 Forbidden**: Acesso negado
**404 Not Found**: Recurso não encontrado
**500 Internal Server Error**: Erro interno do servidor

**Exponential Backoff**: Para falhas de rede
**Token Refresh**: Para erros 401
**Circuit Breaker**: Para múltiplas falhas consecutivas

## Otimizações

**Request Deduplication**: Evita requisições duplicadas
**Response Caching**: Cache de respostas por tempo limitado
**Optimistic Updates**: Atualização otimista da UI

**Search Queries**: Debounce de 300ms para pesquisas
**Auto-save**: Debounce de 1s para salvamento automático

## Autenticação

**JWT Tokens**: Armazenados de forma segura
**Token Refresh**: Renovação automática antes da expiração
**Logout Automático**: Em caso de token inválido

**Input Sanitization**: Sanitização de dados antes do envio
**CSRF Protection**: Proteção contra ataques CSRF
**XSS Prevention**: Prevenção de ataques XSS

## Interceptors

```javascript
// Request Interceptor
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await refreshToken();
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

## Testes

**MSW (Mock Service Worker)**: Para mock de APIs em testes
**Socket.io Mock**: Para testes de WebSocket
**Error Scenarios**: Testes de cenários de erro

```javascript
// Exemplo de teste
describe('API Service', () => {
  test('should fetch patients', async () => {
    const patients = await api.getPatients();
    expect(patients).toBeDefined();
  });
});
```

## Debug

**Network Tab**: Verificar requisições no DevTools
**Console Logs**: Logs detalhados em desenvolvimento
**Error Boundary**: Captura de erros em componentes