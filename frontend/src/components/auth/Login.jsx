import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';
import { FaEnvelope, FaLock } from 'react-icons/fa';

/**
 * Login component - Formulário de login
 *
 * Integrates with:
 * - store/authStore.js para autenticação de médicos e pacientes (JWT)
 * - services/api.js para requisições de login
 * - pages/Marketplace/DoctorsList.jsx como landing após login de paciente
 *
 * @component
 * @example
 * return (
 *   <Login />
 * )
 */
const Login = ({ role = 'medico' }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError } = useAuthStore();
  const { toast } = useToast();

  // Pré-preencher email se veio do registro
  useEffect(() => {
    if (location.state?.email) {
      setFormData(prev => ({
        ...prev,
        email: location.state.email
      }));
      
      // Mostrar toast informativo
      toast.info('Email pré-preenchido', {
        description: 'Digite sua senha para fazer login'
      });
    }
  }, [location.state?.email]); // Removido 'toast' da dependência para evitar loop infinito

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Limpar mensagens de erro ao editar
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Autenticação via API para ambos os perfis
      const success = await login(formData.email, formData.password, role);
      if (success) {
        if (role === 'patient') {
          toast.success('Login realizado com sucesso!', {
            description: 'Redirecionando para o Marketplace...'
          });
          navigate('/marketplace');
        } else {
          toast.success('Login realizado com sucesso!', {
            description: 'Redirecionando para o dashboard...'
          });
          navigate('/');
        }
      } else {
        // Tratar diferentes tipos de erro
        if (error && error.includes('401')) {
          toast.error('Credenciais inválidas', {
            description: 'Email ou senha incorretos. Verifique e tente novamente.'
          });
        } else if (error && error.includes('429')) {
          toast.warning('Muitas tentativas', {
            description: 'Aguarde um momento antes de tentar novamente'
          });
        } else {
          toast.error('Erro no login', {
            description: error || 'Verifique suas credenciais e tente novamente'
          });
        }
      }
    } catch (err) {
      console.error('Erro durante login:', err);
      toast.error('Erro inesperado', {
        description: 'Algo deu errado. Tente novamente em alguns minutos.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Errors are now handled by Toast notifications */}
        
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Email
          </label>
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required={role !== 'patient'}
              className="input"
              autoComplete="email"
              placeholder="Digite seu email"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            Senha
          </label>
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input"
              autoComplete="current-password"
              placeholder="Digite sua senha"
            />
          </div>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full py-3 text-base font-medium"
          >
            {isLoading ? 'Entrando...' : 'Acessar Sistema'}
          </button>
        </div>
      </form>
      
      <div className="mt-8 text-center text-sm text-gray-400">
        {role === 'medico' ? (
          <>
            Não é cadastrado?{' '}
            <Link to="/register" className="text-teal-400 hover:text-teal-300 transition-colors duration-200 font-medium">
              Cadastre-se como profissional
            </Link>
            <div className="mt-2">
              É paciente?{' '}
              <Link to="/login" className="text-teal-400 hover:text-teal-300 transition-colors duration-200 font-medium">
                Acesse aqui
              </Link>
            </div>
          </>
        ) : (
          <>
            Não tem conta?{' '}
            <Link to="/register-patient" className="text-teal-400 hover:text-teal-300 transition-colors duration-200 font-medium">
              Cadastre-se como paciente
            </Link>
            <div className="mt-2">
              É profissional?{' '}
              <Link to="/loginpro" className="text-teal-400 hover:text-teal-300 transition-colors duration-200 font-medium">
                Acesse aqui
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;