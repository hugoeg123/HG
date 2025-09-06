# 🎨 Frontend - Health Guardian

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Componentes Principais](#-componentes-principais)
- [Gerenciamento de Estado](#-gerenciamento-de-estado)
- [Roteamento](#-roteamento)
- [Fluxos de Navegação](#-fluxos-de-navegação)
- [Hooks Customizados](#-hooks-customizados)
- [Serviços](#-serviços)
- [Utilitários](#-utilitários)
- [Configuração](#-configuração)
- [Desenvolvimento](#-desenvolvimento)

## 🎯 Visão Geral

O frontend do Health Guardian é uma aplicação React moderna construída com:

- **React 18**: Framework principal
- **Vite**: Build tool e dev server
- **Tailwind CSS**: Framework de estilização
- **Zustand**: Gerenciamento de estado
- **React Router**: Roteamento SPA
- **TypeScript**: Tipagem estática (parcial)

### Características Principais

- ✅ **Responsivo**: Design adaptável para desktop e mobile
- ✅ **Modular**: Componentes reutilizáveis e bem organizados
- ✅ **Performático**: Lazy loading e otimizações
- ✅ **Acessível**: Seguindo padrões de acessibilidade
- ✅ **Testável**: Estrutura preparada para testes

## 🏗️ Arquitetura

### Padrão de Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │    │     Stores      │    │    Services     │
│                 │    │                 │    │                 │
│ • UI Components │◄──►│ • Zustand       │◄──►│ • API Client    │
│ • Pages         │    │ • Local State   │    │ • Validation    │
│ • Layouts       │    │ • Computed      │    │ • Utils         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Backend API   │
                    │                 │
                    │ • REST Endpoints│
                    │ • Authentication│
                    │ • Data Persistence│
                    └─────────────────┘
```

### Fluxo de Dados

1. **Componente** dispara ação
2. **Store** (Zustand) atualiza estado
3. **Service** faz chamada à API
4. **Backend** processa e retorna dados
5. **Store** atualiza com novos dados
6. **Componente** re-renderiza automaticamente

## 📁 Estrutura de Pastas

```
src/
├── components/          # Componentes reutilizáveis
│   ├── AI/             # Componentes relacionados à IA
│   ├── Layout/         # Layouts e estruturas
│   ├── PatientView/    # Visualização de pacientes
│   ├── Tools/          # Ferramentas e calculadoras
│   ├── auth/           # Autenticação
│   └── ui/             # Componentes de UI básicos
├── pages/              # Páginas da aplicação
├── store/              # Gerenciamento de estado (Zustand)
├── services/           # Serviços e APIs
├── hooks/              # Hooks customizados
├── lib/                # Bibliotecas e utilitários
├── utils/              # Funções utilitárias
├── core/               # Lógica de negócio central
├── data/               # Dados estáticos e schemas
├── features/           # Features organizadas por domínio
└── shared/             # Código compartilhado
```

### Convenções de Nomenclatura

- **Componentes**: PascalCase (`PatientCard.jsx`)
- **Hooks**: camelCase com prefixo `use` (`usePatientData.js`)
- **Stores**: camelCase com sufixo `Store` (`patientStore.js`)
- **Services**: camelCase com sufixo `Service` (`apiService.js`)
- **Utils**: camelCase (`formatDate.js`)

## 🧩 Componentes Principais

### Layout Components

#### `Layout/MainLayout.jsx`
```javascript
/**
 * Layout principal da aplicação
 * 
 * Integrates with:
 * - authStore.js para estado de autenticação
 * - themeStore.js para tema dark/light
 * - Router para navegação
 */
```

**Responsabilidades:**
- Header com navegação
- Sidebar com menu
- Área de conteúdo principal
- Footer

#### `Layout/Sidebar.jsx`
```javascript
/**
 * Sidebar de navegação
 * 
 * Connector: Integra com React Router para navegação
 * Hook: Usado em MainLayout.jsx
 */
```

### Dashboard Components

#### `Dashboard.jsx`
```javascript
/**
 * Dashboard principal do sistema
 * 
 * Integrates with:
 * - patientStore.js para dados de pacientes
 * - services/api.js para chamadas à API
 * - PatientView/ componentes para visualização
 */
```

**Features:**
- Resumo de pacientes
- Estatísticas rápidas
- Ações rápidas
- Navegação para outras seções

### Patient Components

#### `PatientView/PatientList.jsx`
```javascript
/**
 * Lista de pacientes com filtros
 * 
 * Connector: Usa patientStore para estado global
 * Hook: Integra com useDebounce para busca otimizada
 */
```

#### `PatientView/PatientCard.jsx`
```javascript
/**
 * Card individual de paciente
 * 
 * Integrates with:
 * - PatientList.jsx como item da lista
 * - Router para navegação para detalhes
 */
```

### Tools Components

#### `Tools/Calculator/CalculatorGallery.jsx`
```javascript
/**
 * Galeria de calculadoras médicas
 * 
 * Connector: Integra com calculatorStore.js
 * Hook: Usado em pages/calculators/
 */
```

## 🗄️ Gerenciamento de Estado

### Zustand Stores

#### `authStore.js`
```javascript
/**
 * Gerencia autenticação e sessão do usuário
 * 
 * State:
 * - user: dados do usuário logado
 * - token: JWT token
 * - isAuthenticated: status de autenticação
 * 
 * Actions:
 * - login(credentials)
 * - logout()
 * - refreshToken()
 */
```

#### `patientStore.js`
```javascript
/**
 * Gerencia dados de pacientes
 * 
 * Connector: Integra com services/api.js
 * Hook: Usado em PatientView/ componentes
 */
```

#### `calculatorStore.js`
```javascript
/**
 * Gerencia calculadoras médicas
 * 
 * State:
 * - calculators: lista de calculadoras
 * - currentCalculator: calculadora ativa
 * - results: resultados de cálculos
 */
```

### Estado Local vs Global

**Estado Global (Zustand):**
- Dados de usuário autenticado
- Lista de pacientes
- Configurações da aplicação
- Cache de dados da API

**Estado Local (useState):**
- Estados de formulários
- UI temporária (modals, dropdowns)
- Dados específicos de componente

## 🛣️ Roteamento

### Estrutura de Rotas

```javascript
// App.jsx
const routes = [
  {
    path: '/',
    element: <Dashboard />,
    protected: true
  },
  {
    path: '/patients',
    element: <PatientList />,
    protected: true
  },
  {
    path: '/patients/:id',
    element: <PatientDetails />,
    protected: true
  },
  {
    path: '/calculators',
    element: <CalculatorGallery />,
    protected: true
  },
  {
    path: '/login',
    element: <Login />,
    protected: false
  }
];
```

### Proteção de Rotas

```javascript
/**
 * ProtectedRoute.jsx
 * 
 * Connector: Integra com authStore para verificar autenticação
 * Hook: Usado em App.jsx para proteger rotas
 */
```

## 🔄 Fluxos de Navegação

### Fluxo de Autenticação

```
1. Usuário acessa aplicação
2. ProtectedRoute verifica autenticação
3. Se não autenticado → Redireciona para /login
4. Login bem-sucedido → Atualiza authStore
5. Redireciona para dashboard
```

### Fluxo de Pacientes

```
1. Dashboard → "Ver Pacientes"
2. PatientList carrega dados via patientStore
3. Filtros/busca atualizam lista em tempo real
4. Click em paciente → Navega para /patients/:id
5. PatientDetails carrega dados específicos
```

### Fluxo de Calculadoras

```
1. Menu → "Calculadoras"
2. CalculatorGallery exibe cards
3. Filtros por categoria
4. Click em calculadora → Abre modal/página
5. Preenche dados → Calcula resultado
6. Salva no histórico (calculatorStore)
```

## 🎣 Hooks Customizados

### `useDebounce.js`
```javascript
/**
 * Hook para debounce de valores
 * 
 * Usage: Busca em tempo real sem spam de requests
 * Connector: Usado em PatientList, CalculatorGallery
 */
```

### `useAbortController.js`
```javascript
/**
 * Hook para cancelar requests HTTP
 * 
 * Usage: Evita race conditions em componentes
 * Hook: Integra com services/api.js
 */
```

### `useCompute.js`
```javascript
/**
 * Hook para cálculos médicos
 * 
 * Connector: Integra com core/ para lógica de cálculos
 * Usage: Calculadoras médicas
 */
```

## 🔧 Serviços

### `services/api.js`
```javascript
/**
 * Cliente HTTP principal
 * 
 * Features:
 * - Interceptors para auth
 * - Error handling
 * - Request/response logging
 * 
 * Connector: Usado por todos os stores
 */
```

### `services/ValidationService.js`
```javascript
/**
 * Validação de dados médicos
 * 
 * Integrates with:
 * - PhysiologicalRanges.js para ranges normais
 * - CustomValidators.js para validações específicas
 */
```

## 🛠️ Utilitários

### `utils/tagUtils.js`
```javascript
/**
 * Utilitários para sistema de tags
 * 
 * Functions:
 * - parseTag(tagString)
 * - validateTag(tag)
 * - formatTag(tag)
 */
```

### `lib/utils.js`
```javascript
/**
 * Utilitários gerais
 * 
 * Functions:
 * - formatDate(date)
 * - formatCurrency(value)
 * - debounce(func, delay)
 */
```

## ⚙️ Configuração

### `vite.config.js`
```javascript
// Configuração do Vite
export default {
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5001'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}
```

### `tailwind.config.js`
```javascript
// Configuração do Tailwind
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#64748B'
      }
    }
  }
}
```

## 🚀 Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia dev server
npm run dev:debug        # Dev server com debug
npm run dev -- --port 3002  # Porta específica

# Build
npm run build            # Build para produção
npm run preview          # Preview do build

# Testes
npm test                 # Executa testes
npm run test:coverage    # Cobertura de testes

# Linting
npm run lint             # ESLint
npm run lint:fix         # Fix automático
```

### Padrões de Desenvolvimento

#### Estrutura de Componente
```javascript
/**
 * ComponentName.jsx
 * 
 * Description: Breve descrição do componente
 * 
 * Integrates with:
 * - store/someStore.js para estado
 * - services/api.js para dados
 * 
 * Props:
 * - prop1: string - Descrição
 * - prop2: object - Descrição
 */

import React from 'react';
import { useStore } from '../store/someStore';

const ComponentName = ({ prop1, prop2 }) => {
  // Hooks
  const { data, actions } = useStore();
  
  // Event handlers
  const handleClick = () => {
    // Implementation
  };
  
  // Render
  return (
    <div className="component-container">
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

#### Padrões de CSS
```javascript
// Use classes Tailwind consistentes
const styles = {
  container: 'flex flex-col space-y-4 p-6',
  card: 'bg-white rounded-lg shadow-md p-4',
  button: 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded',
  input: 'border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2'
};
```

### Performance

#### Lazy Loading
```javascript
// Lazy loading de páginas
const PatientDetails = lazy(() => import('./pages/PatientDetails'));

// Lazy loading de componentes pesados
const CalculatorEngine = lazy(() => import('./components/CalculatorEngine'));
```

#### Memoização
```javascript
// Memoize componentes pesados
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* Render pesado */}</div>;
});

// Memoize callbacks
const handleClick = useCallback(() => {
  // Handler logic
}, [dependency]);
```

---

## 📚 Recursos Adicionais

- **Storybook**: Documentação de componentes (em desenvolvimento)
- **Testing**: Jest + React Testing Library
- **TypeScript**: Migração gradual em andamento
- **PWA**: Service Worker para cache offline (planejado)

> **💡 Dica**: Para informações específicas sobre componentes individuais, consulte os arquivos README.md em cada pasta de componentes.