# Frontend Components Directory

## Visão Geral

Este diretório contém todos os componentes React da aplicação Health Guardian, organizados por funcionalidade e responsabilidade.

## Estrutura de Diretórios

### `/AI/`
- **AIAssistant/**: Componente de chat com assistente de IA
  - Integra com backend via `/api/ai/chat`
  - Utiliza Ollama para processamento de linguagem natural
  - **Conector**: `services/api.js` → `backend/src/routes/ai.routes.js`

### `/Layout/`
- **LeftSidebar.jsx**: Navegação principal e lista de pacientes
- **RightSidebar.jsx**: Painel de ferramentas (Chat, Calculadoras, Alertas, Base de Conhecimento)
- **Conector**: Integra com `store/patientStore.js` para estado global

### `/PatientView/`
- Componentes para visualização e edição de dados de pacientes
- **Conector**: Integra com `backend/src/routes/patient.routes.js`

### `/Tools/`
- **Alerts/**: Sistema de alertas e notificações
- **Calculators/**: Calculadoras médicas e de saúde
- **KnowledgeBase/**: Base de conhecimento e documentação
- **Conector**: Cada ferramenta integra com endpoints específicos do backend

### `/auth/`
- Componentes de autenticação e autorização
- **Conector**: Integra com `backend/src/routes/auth.routes.js`

### `/ui/`
- Componentes de interface reutilizáveis (botões, modais, cards, etc.)
- Baseados em Tailwind CSS e Radix UI
- **Padrão**: Todos os componentes seguem design system consistente

### `/Icons/`
- Ícones customizados e componentes de ícones
- **Conector**: Utiliza Lucide React para ícones padrão

## Componentes Principais

### `Dashboard.jsx`
- Painel principal da aplicação
- **Conector**: Integra com múltiplos stores e serviços

### `ErrorBoundary.jsx`
- Tratamento de erros em nível de componente
- **Hook**: Captura erros e exibe interface de fallback

### `ProtectedRoute.jsx`
- Proteção de rotas baseada em autenticação
- **Conector**: Integra com `store/authStore.js`

### `NotFound.jsx`
- Página de erro 404
- **Hook**: Renderizada quando rota não é encontrada

### `TestLayout.jsx`
- Layout para testes e desenvolvimento
- **Hook**: Usado apenas em ambiente de desenvolvimento

## Padrões de Integração

### Estado Global
- **Zustand Stores**: `authStore.js`, `patientStore.js`, `themeStore.js`
- **Hook**: Componentes consomem estado via hooks customizados

### Comunicação com Backend
- **API Service**: `services/api.js` centraliza todas as chamadas HTTP
- **Socket Service**: `services/socket.js` para comunicação em tempo real
- **Conector**: Componentes → Services → Backend Routes

### Roteamento
- **React Router**: Navegação declarativa entre componentes
- **Conector**: `main.jsx` → `App.jsx` → Componentes de rota

## Hooks Customizados

### `hooks/useAbortController.js`
- Gerenciamento de cancelamento de requisições HTTP
- **Hook**: Previne memory leaks em componentes desmontados

### `hooks/useDebounce.js`
- Debounce para inputs e pesquisas
- **Hook**: Otimiza performance em campos de busca

## Utilitários

### `shared/parser.js`
- Parser para dados médicos e tags estruturadas
- **Conector**: Usado em componentes de entrada de dados

### `utils/clearStorage.js`
- Limpeza de localStorage e sessionStorage
- **Hook**: Executado na inicialização da aplicação

### `lib/utils.ts`
- Utilitários TypeScript para manipulação de classes CSS
- **Conector**: Usado em componentes UI para merge de classes

## Mapa de Integrações

```
Components/
├── Layout/ → store/patientStore.js → backend/patients
├── AI/ → services/api.js → backend/ai
├── Tools/
│   ├── Alerts/ → backend/alerts
│   ├── Calculators/ → backend/calculators
│   └── KnowledgeBase/ → backend/knowledge
├── PatientView/ → backend/patients + records
├── auth/ → store/authStore.js → backend/auth
└── ui/ → Componentes base (sem integração direta)
```

## Dependências Principais

- **React 18+**: Framework base
- **React Router**: Roteamento
- **Zustand**: Gerenciamento de estado
- **Tailwind CSS**: Estilização
- **Radix UI**: Componentes acessíveis
- **Lucide React**: Ícones
- **Axios**: Cliente HTTP (via services/api.js)

## Padrões de Desenvolvimento

### Estrutura de Componente
```javascript
/**
 * ComponentName
 * 
 * Integra com:
 * - services/api.js para chamadas HTTP
 * - store/storeType.js para estado global
 * - components/ui para componentes base
 */
```

### Convenções de Nomenclatura
- **PascalCase**: Nomes de componentes
- **camelCase**: Props e funções
- **kebab-case**: Classes CSS customizadas

### Responsabilidades
- **Componentes UI**: Apenas apresentação, sem lógica de negócio
- **Componentes de Feature**: Lógica específica + integração com backend
- **Layout Components**: Estrutura e navegação

## Hook de Teste

- **Jest + React Testing Library**: Testes unitários em `__tests__/`
- **Cypress**: Testes de integração em `cypress/integration/`
- **Cobertura**: Cada componente deve ter testes correspondentes

## IA Prompt Sugerido

```
IA prompt: "Crie um novo componente React seguindo os padrões estabelecidos, incluindo JSDoc com integrações, hooks de teste e documentação de conectores. Integre com o sistema de stores Zustand e services existentes."
```