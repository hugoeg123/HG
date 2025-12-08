import { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * ProtectedRoute
 * 
 * Conectores:
 * - store/authStore.js → checkAuth (verifica sessão e preenche user/token)
 * - App.jsx → usado para agrupar rotas protegidas com RBAC
 * 
 * Política:
 * - Suporta controle de acesso por papel via `allowedRoles`
 * - Redireciona para `roleRedirectTo` quando papel não autorizado
 */
const ProtectedRoute = ({ children, allowedRoles = null, roleRedirectTo = '/login' }) => {
  const { isAuthenticated, checkAuth, token, user } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();
  const hasCheckedRef = useRef(false);
  const [currentRole, setCurrentRole] = useState(null);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const verifyAuth = async () => {
      await checkAuth();
      // Derivar papel do token JWT (mais confiável que depender do user em todos os cenários)
      let role = null;
      try {
        if (token) {
          const payloadBase64 = token.split('.')[1];
          const payloadJson = atob(payloadBase64);
          const payload = JSON.parse(payloadJson);
          role = payload?.role || null;
        }
      } catch (_) {
        // Silenciosamente falha — papel permanecerá null
      }
      // Fallback para user.role se disponível
      if (!role && user && typeof user === 'object') {
        role = user.role || null;
      }
      setCurrentRole(role);
      setIsChecking(false);
    };

    verifyAuth();
    // No deps to avoid duplicate calls under React.StrictMode
  }, []);

  if (isChecking) {
    // Exibir um indicador de carregamento enquanto verifica a autenticação
    return (
      <div className="flex items-center justify-center h-screen bg-theme-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirecionar para a página de login se não estiver autenticado
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se houver restrição por papel e o papel atual não está permitido, redirecionar
  if (allowedRoles && Array.isArray(allowedRoles)) {
    // Quando o papel ainda não foi derivado, manter spinner para evitar flash errado
    if (currentRole === null) {
      return (
        <div className="flex items-center justify-center h-screen bg-theme-background">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      );
    }
    const isAllowed = allowedRoles.includes(currentRole);
    if (!isAllowed) {
      const redirectPath = roleRedirectTo || '/login';
      return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }
  }

  // Renderizar o conteúdo protegido se estiver autenticado
  return children;
};

export default ProtectedRoute;