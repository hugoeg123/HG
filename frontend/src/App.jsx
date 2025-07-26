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
import TestLayout from './components/TestLayout';

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
  
  // Verificar autenticação ao iniciar
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  // Aplicar classe de tema ao elemento html
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) {
      htmlElement.classList.add('dark-mode');
      htmlElement.classList.remove('light-mode');
    } else {
      htmlElement.classList.add('light-mode');
      htmlElement.classList.remove('dark-mode');
    }
  }, [isDarkMode]);
  
  return (
    <Routes>
      {/* Rota de teste (temporária) */}
      <Route path="/test" element={<TestLayout />} />
      
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
        <Route path="/patients/:id" element={<PatientView />} />
      </Route>
      
      {/* Rota 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;