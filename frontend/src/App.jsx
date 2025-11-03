/**
 * Componente principal da aplicação
 * 
 * Gerencia o roteamento e o layout principal da aplicação
 * 
 * Integra com: services/api.js para autenticação, store/authStore.js para estado de autenticação,
 * store/themeStore.js para gerenciamento do tema
 */

import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useThemeStore } from './store/themeStore';
import { useCalculatorStore } from './store/calculatorStore';

// Error Handling & Notifications
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';

// Layouts
import MainLayout from './components/Layout/MainLayout';
import AuthLayout from './components/Layout/AuthLayout';
import PatientSidebar from './components/Layout/PatientSidebar';

// Páginas
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import RegisterPatient from './components/auth/RegisterPatient';
import Dashboard from './components/Dashboard';
import PatientView from './components/PatientView';
import NewPatient from './components/PatientView/NewPatient';
import NotFound from './components/NotFound';

// Páginas de Calculadoras
import CalculatorsIndex from './pages/calculators/CalculatorsIndex';
import GotejamentoPage from './pages/calculators/GotejamentoPage';
import McgKgMinGttMinPage from './pages/calculators/McgKgMinGttMinPage';

// Página de Perfil
import Profile from './pages/Profile';
import Agenda from './pages/Agenda';
import DoctorsList from './pages/Marketplace/DoctorsList';
import PatientProfile from './pages/Patient/Profile';

// Componente de rota protegida
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isDarkMode } = useThemeStore();
  const { seedCalculators, getAll } = useCalculatorStore();
  
  // Verificar autenticação ao iniciar
  // Hook: Autenticação é verificada em ProtectedRoute para evitar duplicidades
  useEffect(() => {
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
    const add = (el, ...cls) => cls.forEach((c) => el.classList.add(c));
    const remove = (el, ...cls) => cls.forEach((c) => el.classList.remove(c));
    if (isDarkMode) {
      add(html, 'dark', 'dark-mode', 'theme-dark-teal');
      remove(html, 'light-mode', 'theme-light-ice');
      add(body, 'dark', 'dark-mode', 'theme-dark-teal');
      remove(body, 'light-mode', 'theme-light-ice');
    } else {
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
          {/* Login Paciente (default) */}
          <Route element={<AuthLayout role="patient" />}>
            <Route path="/login" element={<Login role="patient" />} />
            <Route path="/register-patient" element={<RegisterPatient />} />
          </Route>

        {/* Login Profissional (aliases) e Registro */}
        <Route element={<AuthLayout role="medico" />}> 
            <Route path="/loginpro" element={<Login role="medico" />} />
            <Route path="/loginmed" element={<Login role="medico" />} />
            <Route path="/register" element={<Register />} />
          </Route>
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
            <Route path="/profile" element={
              <ErrorBoundary fallbackTitle="Erro no Perfil" showDetails={true}>
                <Profile />
              </ErrorBoundary>
            } />
            <Route path="/agenda" element={
              <ErrorBoundary fallbackTitle="Erro na Agenda" showDetails={true}>
                <Agenda />
              </ErrorBoundary>
            } />
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
          {/* Agrupamento específico para perfil do paciente com sidebar customizada */}
          <Route element={
            <ProtectedRoute>
              <MainLayout leftSidebarComponent={PatientSidebar} />
            </ProtectedRoute>
          }>
            <Route path="/patient/profile" element={
              <ErrorBoundary fallbackTitle="Erro no Perfil do Paciente" showDetails={true}>
                <PatientProfile />
              </ErrorBoundary>
            } />
          </Route>
          {/* Marketplace Público */}
          <Route path="/marketplace" element={<DoctorsList />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;