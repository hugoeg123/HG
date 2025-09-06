# 🧩 Componentes - Frontend

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Layout Components](#-layout-components)
- [Dashboard Components](#-dashboard-components)
- [Patient Components](#-patient-components)
- [Calculator Components](#-calculator-components)
- [Auth Components](#-auth-components)
- [UI Components](#-ui-components)
- [Padrões de Desenvolvimento](#-padrões-de-desenvolvimento)

## 🎯 Visão Geral

Este documento detalha todos os componentes do frontend, suas responsabilidades, props, e integrações.

### Hierarquia de Componentes

```
App.jsx
├── Router
│   ├── ProtectedRoute
│   │   ├── MainLayout
│   │   │   ├── Header
│   │   │   ├── Sidebar
│   │   │   └── Main Content
│   │   │       ├── Dashboard
│   │   │       ├── PatientView
│   │   │       └── Tools
│   │   └── ErrorBoundary
│   └── Login (unprotected)
└── Global Providers
```

## 🏗️ Layout Components

### MainLayout.jsx

**Localização**: `src/components/Layout/MainLayout.jsx`

**Responsabilidade**: Layout principal da aplicação com header, sidebar e área de conteúdo.

```javascript
/**
 * MainLayout Component
 * 
 * Integrates with:
 * - authStore.js para dados do usuário
 * - themeStore.js para tema dark/light
 * - React Router para navegação
 * 
 * Props: Nenhuma (usa children)
 */

const MainLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <Header user={user} onLogout={logout} onToggleTheme={toggleTheme} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
```

**Estados Internos**:
- `sidebarOpen`: boolean - Controla visibilidade da sidebar em mobile

**Integrações**:
- `authStore`: Dados do usuário e logout
- `themeStore`: Tema da aplicação
- `Router`: Recebe children das rotas

---

### Header.jsx

**Localização**: `src/components/Layout/Header.jsx`

**Responsabilidade**: Cabeçalho com navegação, perfil do usuário e controles.

```javascript
/**
 * Header Component
 * 
 * Props:
 * - user: object - Dados do usuário logado
 * - onLogout: function - Callback para logout
 * - onToggleTheme: function - Callback para alternar tema
 */

const Header = ({ user, onLogout, onToggleTheme }) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <Logo />
          <Navigation />
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle onClick={onToggleTheme} />
          <NotificationBell />
          <UserProfile 
            user={user} 
            onLogout={onLogout}
            menuOpen={profileMenuOpen}
            onToggleMenu={setProfileMenuOpen}
          />
        </div>
      </div>
    </header>
  );
};
```

**Componentes Filhos**:
- `Logo`: Logo da aplicação
- `Navigation`: Menu de navegação principal
- `ThemeToggle`: Botão para alternar tema
- `NotificationBell`: Sino de notificações
- `UserProfile`: Menu do perfil do usuário

---

### Sidebar.jsx

**Localização**: `src/components/Layout/Sidebar.jsx`

**Responsabilidade**: Menu lateral de navegação.

```javascript
/**
 * Sidebar Component
 * 
 * Integrates with:
 * - React Router para navegação
 * - authStore para permissões do usuário
 */

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  
  const menuItems = [
    {
      path: '/',
      icon: HomeIcon,
      label: 'Dashboard',
      permission: 'dashboard.view'
    },
    {
      path: '/patients',
      icon: UsersIcon,
      label: 'Pacientes',
      permission: 'patients.view'
    },
    {
      path: '/calculators',
      icon: CalculatorIcon,
      label: 'Calculadoras',
      permission: 'calculators.use'
    }
  ];
  
  return (
    <aside className="w-64 bg-gray-50 min-h-screen">
      <nav className="p-4">
        {menuItems
          .filter(item => hasPermission(user, item.permission))
          .map(item => (
            <SidebarItem 
              key={item.path}
              {...item}
              active={location.pathname === item.path}
            />
          ))
        }
      </nav>
    </aside>
  );
};
```

## 📊 Dashboard Components

### Dashboard.jsx

**Localização**: `src/components/Dashboard.jsx`

**Responsabilidade**: Página principal com resumo e estatísticas.

```javascript
/**
 * Dashboard Component
 * 
 * Integrates with:
 * - patientStore.js para estatísticas de pacientes
 * - calculatorStore.js para histórico de cálculos
 * - services/api.js para dados em tempo real
 */

const Dashboard = () => {
  const { patients, totalPatients, fetchPatients } = usePatientStore();
  const { recentCalculations } = useCalculatorStore();
  
  useEffect(() => {
    fetchPatients();
  }, []);
  
  return (
    <div className="space-y-6">
      <DashboardHeader />
      <StatsGrid 
        totalPatients={totalPatients}
        recentCalculations={recentCalculations.length}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentPatients patients={patients.slice(0, 5)} />
        <QuickActions />
      </div>
    </div>
  );
};
```

**Componentes Filhos**:
- `DashboardHeader`: Título e breadcrumb
- `StatsGrid`: Cards com estatísticas
- `RecentPatients`: Lista dos pacientes recentes
- `QuickActions`: Botões de ações rápidas

---

### StatsGrid.jsx

**Localização**: `src/components/Dashboard/StatsGrid.jsx`

```javascript
/**
 * StatsGrid Component
 * 
 * Props:
 * - totalPatients: number - Total de pacientes
 * - recentCalculations: number - Cálculos recentes
 * - newRecords: number - Novos registros hoje
 */

const StatsGrid = ({ totalPatients, recentCalculations, newRecords }) => {
  const stats = [
    {
      title: 'Total de Pacientes',
      value: totalPatients,
      icon: UsersIcon,
      color: 'blue',
      trend: '+12%'
    },
    {
      title: 'Cálculos Hoje',
      value: recentCalculations,
      icon: CalculatorIcon,
      color: 'green',
      trend: '+5%'
    },
    {
      title: 'Novos Registros',
      value: newRecords,
      icon: DocumentIcon,
      color: 'purple',
      trend: '+8%'
    }
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map(stat => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
};
```

## 👥 Patient Components

### PatientList.jsx

**Localização**: `src/components/PatientView/PatientList.jsx`

**Responsabilidade**: Lista paginada de pacientes com filtros e busca.

```javascript
/**
 * PatientList Component
 * 
 * Integrates with:
 * - patientStore.js para dados e ações
 * - useDebounce.js para busca otimizada
 * - React Router para navegação
 */

const PatientList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const { 
    patients, 
    loading, 
    totalPages,
    fetchPatients,
    searchPatients 
  } = usePatientStore();
  
  useEffect(() => {
    if (debouncedSearch) {
      searchPatients(debouncedSearch, filters);
    } else {
      fetchPatients(currentPage, filters);
    }
  }, [debouncedSearch, currentPage, filters]);
  
  return (
    <div className="space-y-6">
      <PatientListHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
      />
      
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid gap-4">
            {patients.map(patient => (
              <PatientCard 
                key={patient.id} 
                patient={patient}
                onClick={() => navigate(`/patients/${patient.id}`)}
              />
            ))}
          </div>
          
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};
```

**Estados Internos**:
- `searchTerm`: string - Termo de busca
- `filters`: object - Filtros aplicados
- `currentPage`: number - Página atual

**Hooks Utilizados**:
- `useDebounce`: Para otimizar busca
- `usePatientStore`: Para dados e ações
- `useNavigate`: Para navegação

---

### PatientCard.jsx

**Localização**: `src/components/PatientView/PatientCard.jsx`

```javascript
/**
 * PatientCard Component
 * 
 * Props:
 * - patient: object - Dados do paciente
 * - onClick: function - Callback ao clicar no card
 * - showActions: boolean - Mostrar botões de ação
 */

const PatientCard = ({ patient, onClick, showActions = true }) => {
  const { deletePatient } = usePatientStore();
  
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este paciente?')) {
      await deletePatient(patient.id);
    }
  };
  
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Avatar 
            src={patient.avatar} 
            name={patient.name}
            size="lg"
          />
          <div>
            <h3 className="text-lg font-semibold">{patient.name}</h3>
            <p className="text-gray-600">{patient.email}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>Idade: {patient.age}</span>
              <span>•</span>
              <span>Registros: {patient.recordsCount}</span>
            </div>
          </div>
        </div>
        
        {showActions && (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/patients/${patient.id}/edit`);
              }}
            >
              Editar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              color="red"
              onClick={handleDelete}
            >
              Excluir
            </Button>
          </div>
        )}
      </div>
      
      {patient.lastRecord && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            Último registro: {formatDate(patient.lastRecord.createdAt)}
          </p>
        </div>
      )}
    </div>
  );
};
```

## 🧮 Calculator Components

### CalculatorGallery.jsx

**Localização**: `src/components/Tools/Calculator/CalculatorGallery.jsx`

**Responsabilidade**: Galeria de calculadoras médicas disponíveis.

```javascript
/**
 * CalculatorGallery Component
 * 
 * Integrates with:
 * - calculatorStore.js para lista de calculadoras
 * - useDebounce.js para busca
 */

const CalculatorGallery = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const { 
    calculators, 
    categories,
    loading,
    fetchCalculators 
  } = useCalculatorStore();
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const filteredCalculators = useMemo(() => {
    return calculators.filter(calc => {
      const matchesSearch = !debouncedSearch || 
        calc.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        calc.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        calc.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [calculators, debouncedSearch, selectedCategory]);
  
  return (
    <div className="space-y-6">
      <CalculatorGalleryHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      
      {loading ? (
        <LoadingGrid />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCalculators.map(calculator => (
            <CalculatorCard 
              key={calculator.id}
              calculator={calculator}
              onClick={() => openCalculator(calculator)}
            />
          ))}
        </div>
      )}
      
      {filteredCalculators.length === 0 && (
        <EmptyState 
          title="Nenhuma calculadora encontrada"
          description="Tente ajustar os filtros ou termo de busca"
        />
      )}
    </div>
  );
};
```

---

### CalculatorCard.jsx

**Localização**: `src/components/Tools/Calculator/CalculatorCard.jsx`

```javascript
/**
 * CalculatorCard Component
 * 
 * Props:
 * - calculator: object - Dados da calculadora
 * - onClick: function - Callback ao clicar
 */

const CalculatorCard = ({ calculator, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getCategoryColor(calculator.category)}`}>
            <Icon name={calculator.icon} size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
              {calculator.name}
            </h3>
            <span className="text-sm text-gray-500">
              {calculator.category}
            </span>
          </div>
        </div>
        
        <Badge variant={calculator.complexity}>
          {calculator.complexity}
        </Badge>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {calculator.description}
      </p>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Usado {calculator.usageCount} vezes</span>
        <span>⭐ {calculator.rating}/5</span>
      </div>
    </div>
  );
};
```

## 🔐 Auth Components

### Login.jsx

**Localização**: `src/components/auth/Login.jsx`

**Responsabilidade**: Formulário de login com validação.

```javascript
/**
 * Login Component
 * 
 * Integrates with:
 * - authStore.js para autenticação
 * - React Router para redirecionamento
 */

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <LoginHeader />
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <FormField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
              error={errors.email}
              required
            />
            
            <FormField
              label="Senha"
              type="password"
              value={formData.password}
              onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
              error={errors.password}
              required
            />
          </div>
          
          {errors.general && (
            <Alert variant="error">
              {errors.general}
            </Alert>
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            loading={loading}
          >
            Entrar
          </Button>
        </form>
        
        <LoginFooter />
      </div>
    </div>
  );
};
```

## 🎨 UI Components

### Button.jsx

**Localização**: `src/components/ui/Button.jsx`

```javascript
/**
 * Button Component - Componente base para botões
 * 
 * Props:
 * - variant: 'primary' | 'secondary' | 'outline' | 'ghost'
 * - size: 'sm' | 'md' | 'lg'
 * - loading: boolean
 * - disabled: boolean
 * - children: ReactNode
 */

const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const classes = cn(
    baseClasses,
    variants[variant],
    sizes[size],
    (disabled || loading) && 'opacity-50 cursor-not-allowed',
    className
  );
  
  return (
    <button 
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2" size="sm" />}
      {children}
    </button>
  );
};
```

### Modal.jsx

**Localização**: `src/components/ui/Modal.jsx`

```javascript
/**
 * Modal Component - Modal reutilizável
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - title: string
 * - size: 'sm' | 'md' | 'lg' | 'xl'
 * - children: ReactNode
 */

const Modal = ({ isOpen, onClose, title, size = 'md', children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        <div className={`relative bg-white rounded-lg shadow-xl w-full ${sizes[size]}`}>
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XIcon size={24} />
            </button>
          </div>
          
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 📋 Padrões de Desenvolvimento

### Estrutura de Arquivo

```javascript
// ComponentName.jsx
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/someStore';
import { SomeService } from '../services/SomeService';

/**
 * ComponentName - Descrição do componente
 * 
 * @param {Object} props - Props do componente
 * @param {string} props.prop1 - Descrição da prop
 * @param {function} props.onAction - Callback de ação
 * 
 * Integrates with:
 * - store/someStore.js para estado
 * - services/SomeService.js para lógica
 * 
 * Hook: Usado em ParentComponent.jsx
 */
const ComponentName = ({ prop1, onAction }) => {
  // 1. Hooks de estado
  const [localState, setLocalState] = useState(null);
  
  // 2. Hooks de store
  const { data, actions } = useStore();
  
  // 3. Hooks de efeito
  useEffect(() => {
    // Efeitos de inicialização
  }, []);
  
  // 4. Handlers de evento
  const handleClick = () => {
    // Lógica do handler
  };
  
  // 5. Computações derivadas
  const computedValue = useMemo(() => {
    return data?.someProperty || 'default';
  }, [data]);
  
  // 6. Render
  return (
    <div className="component-container">
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

### Convenções de Props

```javascript
// Props obrigatórias
const Component = ({ requiredProp }) => { /* */ };

// Props opcionais com defaults
const Component = ({ 
  optionalProp = 'default',
  callback = () => {},
  config = {}
}) => { /* */ };

// Props com destructuring
const Component = ({ 
  data: { id, name, ...rest },
  onAction,
  ...otherProps 
}) => { /* */ };
```

### Padrões de Estado

```javascript
// Estado simples
const [value, setValue] = useState('');

// Estado de objeto
const [formData, setFormData] = useState({
  field1: '',
  field2: ''
});

// Atualização de estado de objeto
const updateField = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};

// Estado de loading/error
const [state, setState] = useState({
  data: null,
  loading: false,
  error: null
});
```

### Padrões de Integração

```javascript
// Integração com store
const { data, loading, error, fetchData } = useStore();

// Integração com serviços
const handleSubmit = async (formData) => {
  try {
    const result = await SomeService.create(formData);
    onSuccess(result);
  } catch (error) {
    onError(error.message);
  }
};

// Integração com router
const navigate = useNavigate();
const { id } = useParams();
const location = useLocation();
```

---

> **💡 Dica**: Para exemplos específicos de implementação, consulte os arquivos de componentes no diretório `src/components/`.