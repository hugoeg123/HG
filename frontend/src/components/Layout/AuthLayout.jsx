import { Outlet, useLocation } from 'react-router-dom';

/**
 * AuthLayout component - Layout para páginas de autenticação
 * 
 * @component
 * @example
 * return (
 *   <AuthLayout />
 * )
 */
const AuthLayout = () => {
  const location = useLocation();
  const isRegisterPage = location.pathname === '/register';
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-6 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Health Guardian</h1>
          <p>Sistema de Prontuário Eletrônico</p>
          {isRegisterPage ? (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-1">Cadastro de Profissional</h2>
              <p className="text-sm">Preencha os dados para criar sua conta profissional</p>
            </div>
          ) : (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-1">Acesso Profissional</h2>
              <p className="text-sm">Faça login para acessar o sistema</p>
            </div>
          )}
        </div>
        
        {/* Renderiza as rotas filhas (Login/Register) */}
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;