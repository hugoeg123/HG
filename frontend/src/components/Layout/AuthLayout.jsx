import { Outlet, useLocation, Link } from 'react-router-dom';

/**
 * AuthLayout component - Layout para páginas de autenticação
 * 
 * @component
 * @example
 * return (
 *   <AuthLayout />
 * )
 */
const AuthLayout = ({ role = 'medico' }) => {
  const location = useLocation();
  const isRegisterPage = location.pathname === '/register' || location.pathname === '/register-patient';
  const isPatient = role === 'patient';
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-theme-background px-4">
      <div className="w-full max-w-md p-8 rounded-lg shadow-lg bg-theme-card border border-theme-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Health Guardian</h1>
          <p className="text-gray-300 mb-4">Sistema de Prontuário Eletrônico</p>
          {isRegisterPage ? (
            <div className="mt-4">
              {isPatient ? (
                <>
                  <h2 className="text-xl font-semibold mb-2 text-gray-200">Cadastro de Paciente</h2>
                  <p className="text-sm text-gray-400">Preencha seus dados para criar sua conta</p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-2 text-gray-200">Cadastro de Profissional</h2>
                  <p className="text-sm text-gray-400">Preencha os dados para criar sua conta profissional</p>
                </>
              )}
            </div>
          ) : (
            <div className="mt-4">
              {isPatient ? (
                <>
                  <h2 className="text-xl font-semibold mb-2 text-gray-200">Acesso Paciente</h2>
                  <p className="text-sm text-gray-400">Faça login para explorar profissionais e agendar consultas</p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-2 text-gray-200">Acesso Profissional</h2>
                  <p className="text-sm text-gray-400">Faça login para acessar sua agenda e pacientes</p>
                </>
              )}
            </div>
          )}
          <div className="mt-3 text-sm">
            {isPatient ? (
              <span className="text-gray-400">É profissional?{' '}
                <Link to="/loginpro" className="text-teal-400 hover:text-teal-300">Acesse aqui</Link>
              </span>
            ) : (
              <span className="text-gray-400">É paciente?{' '}
                <Link to="/login" className="text-teal-400 hover:text-teal-300">Acesse aqui</Link>
              </span>
            )}
          </div>
        </div>
        
        {/* Renderiza as rotas filhas (Login/Register) */}
        <div className="space-y-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;