/**
 * Componente principal da aplicação
 * 
 * Gerencia o roteamento e o layout principal da aplicação
 * 
 * Integra com: services/api.js para autenticação, store/authStore.js para estado de autenticação,
 * store/themeStore.js para gerenciamento do tema
 */

import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { useCalculatorStore } from './store/calculatorStore';

// Error Handling & Notifications
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';

// Layouts
import MainLayout from './components/Layout/MainLayout';
import AuthLayout from './components/Layout/AuthLayout';

// Páginas
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import PatientView from './components/PatientView';
import NewPatient from './components/PatientView/NewPatient';
import NotFound from './components/NotFound';

// Páginas de Calculadoras
import CalculatorsIndex from './pages/calculators/CalculatorsIndex';
import GotejamentoPage from './pages/calculators/GotejamentoPage';
import McgKgMinGttMinPage from './pages/calculators/McgKgMinGttMinPage';

// Componente de rota protegida
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const { checkAuth } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const { seedCalculators, getAll } = useCalculatorStore();
  
  // Verificar autenticação ao iniciar
  // Hook: Removed checkAuth from dependencies to prevent infinite loop
  // since Zustand functions are recreated on each render
  useEffect(() => {
    checkAuth();
    
    // Inicializar calculadoras se necessário
    const calculators = getAll();
    if (calculators.length === 0) {
      seedCalculators();
    }
  }, []);
  
  // Aplicar classe de tema ao elemento html e body
  useEffect(() => {
    /**
     * Theme toggling effect
     *
     * - Preserves legacy classes: .dark-mode /.light-mode
     * - Adds Tailwind dark variant: .dark (required for dark: utilities)
     * - Adds semantic theme classes: .theme-dark-teal / .theme-light-ice
     *
     * Connector: Integrates with index.css variables and Tailwind theme-* utilities
     * IA prompt: "Ensure dark mode remains identical; apply blue-ice mapping on light"
     */
    const html = document.documentElement;
    const body = document.body;

    /** Small helpers to manage multiple classes cleanly */
    const add = (el, ...cls) => cls.forEach((c) => el.classList.add(c));
    const remove = (el, ...cls) => cls.forEach((c) => el.classList.remove(c));

    if (isDarkMode) {
      // Dark mode: keep legacy + enable Tailwind dark variant + semantic theme
      add(html, 'dark', 'dark-mode', 'theme-dark-teal');
      remove(html, 'light-mode', 'theme-light-ice');
      add(body, 'dark', 'dark-mode', 'theme-dark-teal');
      remove(body, 'light-mode', 'theme-light-ice');
    } else {
      // Light ice theme: remove dark classes and apply blue-ice semantic theme
      add(html, 'light-mode', 'theme-light-ice');
      remove(html, 'dark', 'dark-mode', 'theme-dark-teal');
      add(body, 'light-mode', 'theme-light-ice');
      remove(body, 'dark', 'dark-mode', 'theme-dark-teal');
    }
  }, [isDarkMode]);
  
  return (
    <ErrorBoundary fallbackTitle="Erro na Aplicação">
      <ToastProvider>
        <Routes>
          {/* Removed temporary test route */}
          
          {/* Rotas de autenticação */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          
          {/* Rotas protegidas */}
          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients/new" element={<NewPatient />} />
            <Route path="/patients/:id" element={
              <ErrorBoundary fallbackTitle="Erro no Dashboard do Paciente" showDetails={true}>
                <PatientView />
              </ErrorBoundary>
            } />
            <Route path="/patients/:id/records/:recordId" element={
              <ErrorBoundary fallbackTitle="Erro na Visualização do Registro" showDetails={true}>
                <PatientView />
              </ErrorBoundary>
            } />
            
            {/* Rotas de Calculadoras */}
            <Route path="/calculators" element={
              <ErrorBoundary fallbackTitle="Erro nas Calculadoras" showDetails={true}>
                <CalculatorsIndex />
              </ErrorBoundary>
            } />
            <Route path="/calculators/gotejamento" element={
              <ErrorBoundary fallbackTitle="Erro na Calculadora de Gotejamento" showDetails={true}>
                <GotejamentoPage />
              </ErrorBoundary>
            } />
            <Route path="/calculators/mcg-kg-min-gtt" element={
              <ErrorBoundary fallbackTitle="Erro na Calculadora mcg/kg/min" showDetails={true}>
                <McgKgMinGttMinPage />
              </ErrorBoundary>
            } />
          </Route>
          
          {/* Rota 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;