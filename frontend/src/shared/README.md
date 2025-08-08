# Frontend Shared Directory

## Visão Geral

Este diretório contém componentes, utilitários, tipos e recursos compartilhados em toda a aplicação Health Guardian. O shared centraliza elementos reutilizáveis que são utilizados por múltiplos módulos, garantindo consistência e evitando duplicação de código.

## Estrutura de Compartilhamento

### Componentes Compartilhados

#### `Button.jsx`
**Propósito**: Componente de botão reutilizável com variações de estilo.

**Funcionalidades**:
- Múltiplas variantes (primary, secondary, danger, ghost)
- Diferentes tamanhos (sm, md, lg)
- Estados (loading, disabled)
- Ícones opcionais
- Acessibilidade completa

**Conectores**:
- **Forms**: Usado em todos os formulários
- **Modals**: Botões de ação em diálogos
- **Navigation**: Botões de navegação
- **Actions**: Ações de CRUD

**Exemplo de Uso**:
```javascript
import { Button } from '../shared/Button';

<Button 
  variant="primary" 
  size="md" 
  loading={isSubmitting}
  onClick={handleSubmit}
  icon={<SaveIcon />}
>
  Salvar Paciente
</Button>
```

#### `Input.jsx`
**Propósito**: Componente de input reutilizável com validação.

**Funcionalidades**:
- Tipos variados (text, email, password, number)
- Validação em tempo real
- Estados de erro e sucesso
- Labels e placeholders
- Ícones e máscaras

**Conectores**:
- **Forms**: Base para todos os inputs
- **Validation**: Integração com esquemas
- **Auth**: Formulários de login/registro
- **Patient**: Formulários de paciente

**Exemplo de Uso**:
```javascript
import { Input } from '../shared/Input';

<Input
  type="email"
  label="Email do Paciente"
  placeholder="paciente@email.com"
  value={email}
  onChange={setEmail}
  error={emailError}
  required
/>
```

#### `Modal.jsx`
**Propósito**: Componente de modal/dialog reutilizável.

**Funcionalidades**:
- Overlay com backdrop
- Animações de entrada/saída
- Fechamento por ESC ou clique fora
- Diferentes tamanhos
- Acessibilidade (focus trap, ARIA)

**Conectores**:
- **Forms**: Modais de criação/edição
- **Confirmations**: Diálogos de confirmação
- **Alerts**: Exibição de alertas
- **Details**: Visualização de detalhes

**Exemplo de Uso**:
```javascript
import { Modal } from '../shared/Modal';

<Modal
  isOpen={isModalOpen}
  onClose={closeModal}
  title="Novo Paciente"
  size="lg"
>
  <PatientForm onSubmit={handleSubmit} />
</Modal>
```

#### `Table.jsx`
**Propósito**: Componente de tabela reutilizável com funcionalidades avançadas.

**Funcionalidades**:
- Ordenação por colunas
- Paginação integrada
- Filtros e busca
- Seleção de linhas
- Ações por linha
- Responsividade

**Conectores**:
- **Patients**: Lista de pacientes
- **Records**: Lista de registros
- **Templates**: Lista de templates
- **Reports**: Tabelas de relatórios

**Exemplo de Uso**:
```javascript
import { Table } from '../shared/Table';

const columns = [
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'actions', label: 'Ações', render: (row) => <ActionButtons row={row} /> }
];

<Table
  data={patients}
  columns={columns}
  pagination
  searchable
  onRowClick={handleRowClick}
/>
```

#### `Card.jsx`
**Propósito**: Componente de card reutilizável para exibição de conteúdo.

**Funcionalidades**:
- Header, body e footer opcionais
- Diferentes variações de estilo
- Hover effects
- Clickable cards
- Responsive design

**Conectores**:
- **Dashboard**: Cards de métricas
- **Patients**: Cards de paciente
- **Tools**: Cards de ferramentas
- **Alerts**: Cards de alertas

**Exemplo de Uso**:
```javascript
import { Card } from '../shared/Card';

<Card
  title="Pacientes Ativos"
  subtitle="Total de pacientes cadastrados"
  onClick={navigateToPatients}
  hoverable
>
  <div className="text-3xl font-bold">{patientCount}</div>
</Card>
```

#### `Loading.jsx`
**Propósito**: Componentes de loading e skeleton screens.

**Funcionalidades**:
- Spinner animado
- Skeleton screens
- Progress bars
- Diferentes tamanhos
- Overlay loading

**Conectores**:
- **API**: Estados de carregamento
- **Components**: Loading states
- **Navigation**: Carregamento de rotas
- **Forms**: Submissão de formulários

**Exemplo de Uso**:
```javascript
import { Loading, Skeleton } from '../shared/Loading';

// Loading spinner
<Loading size="lg" text="Carregando pacientes..." />

// Skeleton screen
<Skeleton type="card" count={3} />
```

#### `Toast.jsx`
**Propósito**: Sistema de notificações toast.

**Funcionalidades**:
- Diferentes tipos (success, error, warning, info)
- Auto-dismiss configurável
- Posicionamento customizável
- Ações opcionais
- Stack de notificações

**Conectores**:
- **API**: Feedback de operações
- **Forms**: Validação e submissão
- **Auth**: Notificações de login/logout
- **Errors**: Exibição de erros

**Exemplo de Uso**:
```javascript
import { toast } from '../shared/Toast';

// Notificação de sucesso
toast.success('Paciente criado com sucesso!');

// Notificação de erro
toast.error('Erro ao salvar dados.');

// Notificação com ação
toast.warning('Dados não salvos', {
  action: {
    label: 'Salvar',
    onClick: handleSave
  }
});
```

### Utilitários Compartilhados

#### `constants.js`
**Propósito**: Constantes globais da aplicação.

**Funcionalidades**:
- URLs de API
- Configurações padrão
- Enums e tipos
- Mensagens de erro
- Configurações de tema

**Conectores**:
- **API**: URLs e configurações
- **Components**: Valores padrão
- **Validation**: Regras de validação
- **Theme**: Configurações de estilo

**Exemplo de Uso**:
```javascript
import { API_ENDPOINTS, PATIENT_STATUS, ERROR_MESSAGES } from '../shared/constants';

// Usar endpoint
const response = await api.get(API_ENDPOINTS.PATIENTS);

// Usar enum
const status = PATIENT_STATUS.ACTIVE;

// Usar mensagem de erro
const errorMsg = ERROR_MESSAGES.NETWORK_ERROR;
```

#### `types.js`
**Propósito**: Definições de tipos TypeScript/PropTypes.

**Funcionalidades**:
- Tipos de dados
- Interfaces de API
- Props de componentes
- Tipos de estado
- Validações de tipo

**Conectores**:
- **Components**: Tipagem de props
- **API**: Tipagem de responses
- **Store**: Tipagem de estado
- **Forms**: Tipagem de dados

**Exemplo de Uso**:
```javascript
import { PatientType, RecordType, ApiResponse } from '../shared/types';

// Tipagem de componente
const PatientCard = ({ patient }: { patient: PatientType }) => {
  // ...
};

// Tipagem de API
const createPatient = async (data: PatientType): Promise<ApiResponse<PatientType>> => {
  // ...
};
```

#### `validators.js`
**Propósito**: Funções de validação reutilizáveis.

**Funcionalidades**:
- Validação de email
- Validação de CPF/CNPJ
- Validação de telefone
- Validação de datas
- Validação de campos médicos

**Conectores**:
- **Forms**: Validação de inputs
- **API**: Validação pré-envio
- **Components**: Feedback de validação
- **Utils**: Utilitários de validação

**Exemplo de Uso**:
```javascript
import { validateEmail, validateCPF, validatePhone } from '../shared/validators';

// Validar email
const isValidEmail = validateEmail('user@example.com');

// Validar CPF
const isValidCPF = validateCPF('123.456.789-00');

// Validar telefone
const isValidPhone = validatePhone('(11) 99999-9999');
```

#### `formatters.js`
**Propósito**: Funções de formatação de dados.

**Funcionalidades**:
- Formatação de datas
- Formatação de números
- Formatação de moeda
- Formatação de documentos
- Formatação de telefones

**Conectores**:
- **Components**: Exibição de dados
- **Tables**: Formatação de colunas
- **Forms**: Máscaras de input
- **Reports**: Formatação de relatórios

**Exemplo de Uso**:
```javascript
import { formatDate, formatCurrency, formatCPF } from '../shared/formatters';

// Formatar data
const formattedDate = formatDate(new Date(), 'dd/MM/yyyy');

// Formatar moeda
const formattedPrice = formatCurrency(1234.56);

// Formatar CPF
const formattedCPF = formatCPF('12345678900');
```

#### `helpers.js`
**Propósito**: Funções auxiliares gerais.

**Funcionalidades**:
- Manipulação de arrays
- Manipulação de objetos
- Utilitários de string
- Funções matemáticas
- Helpers de DOM

**Conectores**:
- **Components**: Lógica auxiliar
- **Utils**: Funções utilitárias
- **Store**: Manipulação de estado
- **API**: Processamento de dados

**Exemplo de Uso**:
```javascript
import { groupBy, sortBy, debounce, throttle } from '../shared/helpers';

// Agrupar dados
const groupedPatients = groupBy(patients, 'status');

// Ordenar dados
const sortedPatients = sortBy(patients, 'name');

// Debounce function
const debouncedSearch = debounce(handleSearch, 300);
```

### Hooks Compartilhados

#### `useLocalStorage.js`
**Propósito**: Hook para gerenciar localStorage.

**Funcionalidades**:
- Persistência automática
- Sincronização entre tabs
- Serialização JSON
- Valores padrão
- Cleanup automático

**Conectores**:
- **Auth**: Persistir tokens
- **Settings**: Configurações do usuário
- **Theme**: Preferências de tema
- **Forms**: Rascunhos de formulário

**Exemplo de Uso**:
```javascript
import { useLocalStorage } from '../shared/hooks/useLocalStorage';

const [theme, setTheme] = useLocalStorage('theme', 'light');
const [userPrefs, setUserPrefs] = useLocalStorage('userPreferences', {});
```

#### `useDebounce.js`
**Propósito**: Hook para debounce de valores.

**Funcionalidades**:
- Delay configurável
- Cancelamento automático
- Cleanup no unmount
- Múltiplos valores

**Conectores**:
- **Search**: Busca em tempo real
- **Forms**: Validação em tempo real
- **API**: Throttling de requisições
- **Filters**: Filtros dinâmicos

**Exemplo de Uso**:
```javascript
import { useDebounce } from '../shared/hooks/useDebounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearchTerm) {
    performSearch(debouncedSearchTerm);
  }
}, [debouncedSearchTerm]);
```

#### `useClickOutside.js`
**Propósito**: Hook para detectar cliques fora de um elemento.

**Funcionalidades**:
- Detecção de clique externo
- Múltiplas referências
- Callback customizável
- Cleanup automático

**Conectores**:
- **Modals**: Fechar ao clicar fora
- **Dropdowns**: Fechar menus
- **Tooltips**: Ocultar tooltips
- **Popovers**: Controle de visibilidade

**Exemplo de Uso**:
```javascript
import { useClickOutside } from '../shared/hooks/useClickOutside';

const [isOpen, setIsOpen] = useState(false);
const ref = useClickOutside(() => setIsOpen(false));

return (
  <div ref={ref}>
    {isOpen && <Dropdown />}
  </div>
);
```

#### `useKeyboard.js`
**Propósito**: Hook para atalhos de teclado.

**Funcionalidades**:
- Combinações de teclas
- Prevenção de default
- Múltiplos atalhos
- Contexto específico

**Conectores**:
- **Navigation**: Atalhos de navegação
- **Forms**: Atalhos de submissão
- **Modals**: Fechar com ESC
- **Actions**: Ações rápidas

**Exemplo de Uso**:
```javascript
import { useKeyboard } from '../shared/hooks/useKeyboard';

useKeyboard({
  'Ctrl+S': handleSave,
  'Escape': closeModal,
  'Ctrl+N': createNew
});
```

### Contextos Compartilhados

#### `ThemeContext.js`
**Propósito**: Contexto para gerenciamento de tema.

**Funcionalidades**:
- Tema claro/escuro
- Persistência de preferência
- Detecção de tema do sistema
- Transições suaves

**Conectores**:
- **Components**: Aplicação de tema
- **Storage**: Persistência
- **Settings**: Configurações
- **Utils**: Utilitários de tema

**Exemplo de Uso**:
```javascript
import { useTheme } from '../shared/contexts/ThemeContext';

const { theme, toggleTheme, setTheme } = useTheme();

return (
  <button onClick={toggleTheme}>
    {theme === 'dark' ? '🌞' : '🌙'}
  </button>
);
```

#### `NotificationContext.js`
**Propósito**: Contexto para sistema de notificações.

**Funcionalidades**:
- Queue de notificações
- Diferentes tipos
- Auto-dismiss
- Posicionamento

**Conectores**:
- **API**: Feedback de operações
- **Forms**: Notificações de validação
- **Auth**: Notificações de autenticação
- **Errors**: Exibição de erros

**Exemplo de Uso**:
```javascript
import { useNotification } from '../shared/contexts/NotificationContext';

const { showNotification } = useNotification();

const handleSuccess = () => {
  showNotification({
    type: 'success',
    message: 'Operação realizada com sucesso!'
  });
};
```

## Implementações Detalhadas

### `Button.jsx`
```javascript
/**
 * Componente Button Reutilizável
 * 
 * Conectores:
 * - Usado em forms/ para ações de formulário
 * - Utilizado em modals/ para botões de ação
 * - Integra com navigation/ para navegação
 * 
 * IA prompt: "Estenda o componente Button para incluir [nova variante/funcionalidade], 
 * mantendo acessibilidade e consistência visual com o design system."
 */

import React, { forwardRef } from 'react';
import { cn } from '../lib/utils';
import { Loading } from './Loading';

// Variantes do botão
const buttonVariants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline'
};

// Tamanhos do botão
const buttonSizes = {
  sm: 'h-9 rounded-md px-3 text-sm',
  md: 'h-10 px-4 py-2',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10'
};

const Button = forwardRef((
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    children,
    onClick,
    type = 'button',
    ...props
  },
  ref
) => {
  const isDisabled = disabled || loading;
  
  const handleClick = (e) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };
  
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      disabled={isDisabled}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <Loading 
          size="sm" 
          className={cn(
            'mr-2',
            children ? 'mr-2' : 'mr-0'
          )} 
        />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className={cn('mr-2', children ? 'mr-2' : 'mr-0')}>
          {icon}
        </span>
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className={cn('ml-2', children ? 'ml-2' : 'ml-0')}>
          {icon}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants, buttonSizes };
```

### `Input.jsx`
```javascript
/**
 * Componente Input Reutilizável
 * 
 * Conectores:
 * - Base para forms/ em validação de campos
 * - Integra com validation/ para feedback
 * - Usado em auth/ para formulários de login
 * 
 * IA prompt: "Adicione nova funcionalidade de [tipo de input/validação] ao componente Input, 
 * incluindo acessibilidade e integração com sistema de validação."
 */

import React, { forwardRef, useState } from 'react';
import { cn } from '../lib/utils';
import { EyeIcon, EyeOffIcon, AlertCircleIcon, CheckCircleIcon } from 'lucide-react';

const Input = forwardRef((
  {
    className,
    type = 'text',
    label,
    placeholder,
    error,
    success,
    helperText,
    icon,
    iconPosition = 'left',
    required = false,
    disabled = false,
    value,
    onChange,
    onBlur,
    onFocus,
    mask,
    maxLength,
    ...props
  },
  ref
) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success);
  const hasIcon = Boolean(icon);
  const isPassword = type === 'password';
  
  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };
  
  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };
  
  const handleChange = (e) => {
    let { value } = e.target;
    
    // Aplicar máscara se fornecida
    if (mask && value) {
      value = applyMask(value, mask);
    }
    
    // Aplicar maxLength
    if (maxLength && value.length > maxLength) {
      value = value.slice(0, maxLength);
    }
    
    onChange?.(value, e);
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="w-full">
      {label && (
        <label className={cn(
          'block text-sm font-medium mb-2',
          hasError ? 'text-destructive' : 'text-foreground',
          disabled && 'opacity-50'
        )}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {hasIcon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            hasIcon && iconPosition === 'left' && 'pl-10',
            (hasIcon && iconPosition === 'right') || isPassword ? 'pr-10' : '',
            hasError && 'border-destructive focus-visible:ring-destructive',
            hasSuccess && 'border-green-500 focus-visible:ring-green-500',
            isFocused && !hasError && !hasSuccess && 'border-primary',
            className
          )}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {hasIcon && iconPosition === 'right' && !isPassword && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={togglePasswordVisibility}
            tabIndex={-1}
          >
            {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button>
        )}
        
        {hasError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-destructive">
            <AlertCircleIcon size={16} />
          </div>
        )}
        
        {hasSuccess && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
            <CheckCircleIcon size={16} />
          </div>
        )}
      </div>
      
      {(error || success || helperText) && (
        <div className="mt-1 text-sm">
          {error && (
            <p className="text-destructive flex items-center gap-1">
              <AlertCircleIcon size={14} />
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-500 flex items-center gap-1">
              <CheckCircleIcon size={14} />
              {success}
            </p>
          )}
          {helperText && !error && !success && (
            <p className="text-muted-foreground">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

// Função para aplicar máscaras
const applyMask = (value, mask) => {
  const masks = {
    cpf: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
    cnpj: (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'),
    phone: (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'),
    cep: (v) => v.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2'),
    currency: (v) => {
      const num = v.replace(/\D/g, '');
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(num / 100);
    }
  };
  
  return masks[mask] ? masks[mask](value) : value;
};

Input.displayName = 'Input';

export { Input };
```

### `Modal.jsx`
```javascript
/**
 * Componente Modal Reutilizável
 * 
 * Conectores:
 * - Usado em forms/ para modais de criação/edição
 * - Integra com confirmations/ para diálogos
 * - Utilizado em alerts/ para exibição
 * 
 * IA prompt: "Adicione funcionalidade de [nova característica] ao modal, 
 * incluindo animações, acessibilidade e integração com sistema de navegação."
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';
import { XIcon } from 'lucide-react';
import { Button } from './Button';

// Tamanhos do modal
const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  full: 'max-w-full'
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  overlayClassName,
  contentClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
  footer,
  ...props
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  
  // Gerenciar foco
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      
      // Focar no modal quando abrir
      setTimeout(() => {
        if (modalRef.current) {
          const focusableElement = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElement) {
            focusableElement.focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 100);
    } else {
      // Restaurar foco quando fechar
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);
  
  // Gerenciar tecla ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);
  
  // Gerenciar clique no overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };
  
  // Trap focus dentro do modal
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };
  
  if (!isOpen) return null;
  
  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/50 backdrop-blur-sm',
        overlayClassName
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={cn(
          'relative w-full rounded-lg bg-background shadow-lg',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          modalSizes[size],
          className
        )}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={cn(
            'flex items-center justify-between p-6 border-b',
            headerClassName
          )}>
            {title && (
              <h2 
                id="modal-title" 
                className="text-lg font-semibold text-foreground"
              >
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6 rounded-full"
                aria-label="Fechar modal"
              >
                <XIcon size={16} />
              </Button>
            )}
          </div>
        )}
        
        {/* Body */}
        <div className={cn(
          'p-6',
          !title && !showCloseButton && 'pt-6',
          !footer && 'pb-6',
          bodyClassName
        )}>
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className={cn(
            'flex items-center justify-end gap-2 p-6 border-t bg-muted/50',
            footerClassName
          )}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
  
  return createPortal(modalContent, document.body);
};

// Componente de confirmação
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message = 'Tem certeza que deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'destructive',
  loading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-muted-foreground">{message}</p>
    </Modal>
  );
};

export { Modal, ConfirmModal, modalSizes };
```

## Mapa de Integrações

```
shared/
├── components/
│   ├── Button.jsx
│   │   ├── → forms/ (ações de formulário)
│   │   ├── → modals/ (botões de ação)
│   │   ├── → navigation/ (navegação)
│   │   └── → actions/ (CRUD operations)
│   │
│   ├── Input.jsx
│   │   ├── → forms/ (base para inputs)
│   │   ├── → validation/ (feedback)
│   │   ├── → auth/ (login/registro)
│   │   └── → patient/ (formulários)
│   │
│   ├── Modal.jsx
│   │   ├── → forms/ (criação/edição)
│   │   ├── → confirmations/ (diálogos)
│   │   ├── → alerts/ (exibição)
│   │   └── → details/ (visualização)
│   │
│   ├── Table.jsx
│   │   ├── → patients/ (lista)
│   │   ├── → records/ (registros)
│   │   ├── → templates/ (templates)
│   │   └── → reports/ (relatórios)
│   │
│   ├── Card.jsx
│   │   ├── → dashboard/ (métricas)
│   │   ├── → patients/ (cards)
│   │   ├── → tools/ (ferramentas)
│   │   └── → alerts/ (alertas)
│   │
│   ├── Loading.jsx
│   │   ├── → api/ (carregamento)
│   │   ├── → components/ (states)
│   │   ├── → navigation/ (rotas)
│   │   └── → forms/ (submissão)
│   │
│   └── Toast.jsx
│       ├── → api/ (feedback)
│       ├── → forms/ (validação)
│       ├── → auth/ (notificações)
│       └── → errors/ (exibição)
│
├── utils/
│   ├── constants.js
│   │   ├── → api/ (URLs)
│   │   ├── → components/ (valores)
│   │   ├── → validation/ (regras)
│   │   └── → theme/ (configurações)
│   │
│   ├── types.js
│   │   ├── → components/ (props)
│   │   ├── → api/ (responses)
│   │   ├── → store/ (estado)
│   │   └── → forms/ (dados)
│   │
│   ├── validators.js
│   │   ├── → forms/ (inputs)
│   │   ├── → api/ (pré-envio)
│   │   ├── → components/ (feedback)
│   │   └── → utils/ (validação)
│   │
│   ├── formatters.js
│   │   ├── → components/ (exibição)
│   │   ├── → tables/ (colunas)
│   │   ├── → forms/ (máscaras)
│   │   └── → reports/ (relatórios)
│   │
│   └── helpers.js
│       ├── → components/ (lógica)
│       ├── → utils/ (funções)
│       ├── → store/ (estado)
│       └── → api/ (processamento)
│
├── hooks/
│   ├── useLocalStorage.js
│   │   ├── → auth/ (tokens)
│   │   ├── → settings/ (configurações)
│   │   ├── → theme/ (preferências)
│   │   └── → forms/ (rascunhos)
│   │
│   ├── useDebounce.js
│   │   ├── → search/ (busca)
│   │   ├── → forms/ (validação)
│   │   ├── → api/ (throttling)
│   │   └── → filters/ (filtros)
│   │
│   ├── useClickOutside.js
│   │   ├── → modals/ (fechar)
│   │   ├── → dropdowns/ (menus)
│   │   ├── → tooltips/ (ocultar)
│   │   └── → popovers/ (controle)
│   │
│   └── useKeyboard.js
│       ├── → navigation/ (atalhos)
│       ├── → forms/ (submissão)
│       ├── → modals/ (ESC)
│       └── → actions/ (ações)
│
└── contexts/
    ├── ThemeContext.js
    │   ├── → components/ (aplicação)
    │   ├── → storage/ (persistência)
    │   ├── → settings/ (configurações)
    │   └── → utils/ (utilitários)
    │
    └── NotificationContext.js
        ├── → api/ (feedback)
        ├── → forms/ (validação)
        ├── → auth/ (autenticação)
        └── → errors/ (exibição)
```

## Dependências

- **React**: Biblioteca base
- **lucide-react**: Ícones
- **clsx**: Manipulação de classes
- **tailwind-merge**: Merge de classes Tailwind
- **framer-motion**: Animações (opcional)
- **react-hook-form**: Formulários (integração)

## Hook de Teste

### Cobertura de Testes
```javascript
// Hook: Testa integração completa dos componentes shared
const testSharedComponents = async () => {
  // Testar Button com todas as variantes
  // Testar Input com validação
  // Testar Modal com acessibilidade
  // Testar Table com dados
  // Testar hooks customizados
  // Testar contextos
};
```

## IA Prompt Sugerido

```
IA prompt: "Crie novo componente shared [nome] seguindo os padrões estabelecidos, incluindo variantes, acessibilidade, TypeScript, testes e documentação de uso. Integre com sistema de design existente."
```

## Boas Práticas

### 1. Componentes
- Usar forwardRef para componentes que precisam de ref
- Implementar acessibilidade completa (ARIA, keyboard navigation)
- Fornecer variantes e tamanhos consistentes
- Documentar props e uso

### 2. Hooks
- Implementar cleanup adequado
- Fornecer valores padrão sensatos
- Otimizar performance com useMemo/useCallback
- Documentar dependências

### 3. Utilitários
- Manter funções puras quando possível
- Implementar tratamento de erro
- Fornecer tipos TypeScript
- Documentar casos de uso

### 4. Contextos
- Implementar providers com valores padrão
- Otimizar re-renders
- Fornecer hooks de conveniência
- Documentar estado e ações

## Troubleshooting

### Problemas Comuns
1. **Componente não renderiza**: Verificar props obrigatórias
2. **Estilos não aplicam**: Verificar classes Tailwind
3. **Hook não funciona**: Verificar dependências
4. **Contexto undefined**: Verificar Provider

### Debug
- **React DevTools**: Inspecionar componentes e props
- **Console Logs**: Debug de hooks e funções
- **Accessibility Tree**: Verificar acessibilidade
- **Performance Profiler**: Identificar re-renders