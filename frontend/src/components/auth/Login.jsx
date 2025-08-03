import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';
import { FaEnvelope, FaLock } from 'react-icons/fa';

/**
 * Login component - Formulário de login
 * 
 * @component
 * @example
 * return (
 *   <Login />
 * )
 */
const Login = () => {
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
      const success = await login(formData.email, formData.password);
      if (success) {
        toast.success('Login realizado com sucesso!', {
          description: 'Redirecionando para o dashboard...'
        });
        navigate('/');
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
        
        <div className="relative">
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <FaEnvelope className="absolute left-3 top-9" />
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-3 py-2 border border-color-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
            autoComplete="email"
          />
        </div>
        
        <div className="relative">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Senha
          </label>
          <FaLock className="absolute left-3 top-9" />
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-3 py-2 border border-color-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
            autoComplete="current-password"
          />
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-primary hover:bg-primary-hover rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Entrando...' : 'Acessar Sistema'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center text-sm text-gray-400">
        Não é cadastrado?{' '}
        <Link to="/register" className="text-purple-500 hover:text-purple-400 transition-colors duration-200">
          Cadastre-se como profissional
        </Link>
      </div>
    </div>
  );
};

export default Login;