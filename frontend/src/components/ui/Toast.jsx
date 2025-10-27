import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Toast Notification System
 * 
 * @component
 * Provides toast notifications for user feedback
 * 
 * Features:
 * - Multiple toast types (success, error, warning, info)
 * - Auto-dismiss with configurable duration
 * - Manual dismiss
 * - Queue management
 * - Accessible with ARIA labels
 * 
 * Usage:
 * ```jsx
 * import { useToast } from './components/ui/Toast';
 * 
 * function MyComponent() {
 *   const { toast } = useToast();
 *   
 *   const handleError = () => {
 *     toast.error('Erro ao salvar dados', {
 *       description: 'Verifique sua conexão e tente novamente'
 *     });
 *   };
 * }
 * ```
 * 
 * Integration points:
 * - Used in auth forms for registration/login feedback
 * - API error handling in services/api.js
 * - Dashboard components for user actions
 * 
 * IA prompt: Adicionar suporte a toast persistente e ações customizadas
 */

// Toast types and their configurations
const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    className: 'border-green-200 bg-green-50 text-green-800',
    iconClassName: 'text-green-600'
  },
  error: {
    icon: AlertCircle,
    className: 'border-red-200 bg-red-50 text-red-800',
    iconClassName: 'text-red-600'
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-700/50 bg-amber-900/30 text-amber-200',
    iconClassName: 'text-amber-400'
  },
  info: {
    icon: Info,
    className: 'border-teal-200 bg-teal-50 text-teal-800',
    iconClassName: 'text-teal-600'
  }
};

const DEFAULT_DURATION = 5000; // 5 seconds

// Toast Context
const ToastContext = createContext(null);

/**
 * Individual Toast Component
 */
const ToastItem = ({ toast, onDismiss }) => {
  const { type, title, description, duration, id } = toast;
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id, onDismiss]);

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300 ease-in-out',
        'animate-in slide-in-from-right-full',
        config.className
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.iconClassName)} />
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">
          {title}
        </div>
        {description && (
          <div className="mt-1 text-sm opacity-90">
            {description}
          </div>
        )}
      </div>
      
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Toast Container Component
 */
const ToastContainer = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
      aria-label="Notificações"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

/**
 * Toast Provider Component
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      duration: DEFAULT_DURATION,
      ...toast
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Toast helper methods - usando useMemo para evitar recriações e loops infinitos
  const toast = useMemo(() => ({
    success: (title, options = {}) => addToast({ type: 'success', title, ...options }),
    error: (title, options = {}) => addToast({ type: 'error', title, ...options }),
    warning: (title, options = {}) => addToast({ type: 'warning', title, ...options }),
    info: (title, options = {}) => addToast({ type: 'info', title, ...options }),
    custom: (toast) => addToast(toast),
    dismiss: dismissToast,
    dismissAll
  }), [addToast, dismissToast, dismissAll]);

  const value = {
    toasts,
    toast,
    addToast,
    dismissToast,
    dismissAll
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast notifications
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

/**
 * Utility function for API error handling
 */
export const handleApiError = (error, toast) => {
  const DEBUG_API = Boolean(import.meta.env.VITE_DEBUG_API);
  if (DEBUG_API && error?.response?.status !== 401) {
    console.error('API Error:', error);
  }
  
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 409:
        toast.warning('Conflito de dados', {
          description: data.message || 'Este registro já existe no sistema'
        });
        break;
      case 429:
        toast.warning('Muitas tentativas', {
          description: 'Aguarde um momento antes de tentar novamente'
        });
        break;
      case 401:
        toast.error('Acesso negado', {
          description: 'Faça login novamente para continuar'
        });
        break;
      case 500:
        toast.error('Erro do servidor', {
          description: 'Tente novamente em alguns minutos'
        });
        break;
      default:
        toast.error('Erro na requisição', {
          description: data.message || `Erro ${status}: ${error.message}`
        });
    }
  } else if (error.request) {
    toast.error('Erro de conexão', {
      description: 'Verifique sua conexão com a internet'
    });
  } else {
    toast.error('Erro inesperado', {
      description: error.message
    });
  }
};

export default ToastProvider;