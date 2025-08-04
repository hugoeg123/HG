import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';
import { FaUser, FaEnvelope, FaLock, FaUserMd, FaIdCard, FaStethoscope } from 'react-icons/fa';

/**
 * Register component - Formulário de registro
 * 
 * @component
 * @example
 * return (
 *   <Register />
 * )
 */
const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    professionalType: 'medico',
    professionalId: '',
    specialty: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register, login, error, clearError } = useAuthStore();
  const { toast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpar mensagens de erro ao editar
    if (error) clearError();
    if (passwordError) setPasswordError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar senhas
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Enviar dados para registro
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        professionalType: formData.professionalType,
        professionalId: formData.professionalId || undefined,
        specialty: formData.specialty || undefined
      });
      
      if (result.success) {
        // Registro bem-sucedido, usuário já está autenticado automaticamente
        toast.success('Cadastro realizado com sucesso! Redirecionando...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        // Erro no registro - usar a nova estrutura de retorno
        if (result.isDuplicateEmail || result.status === 409) {
          toast.warning('Este e-mail já está cadastrado. Redirecionando para o login...');
          setTimeout(() => {
            navigate('/login', { state: { email: formData.email } });
          }, 3000);
        } else if (result.status === 429) {
          toast.error('Muitas tentativas. Tente novamente em alguns minutos.');
        } else {
          toast.error(result.error || 'Erro ao realizar cadastro. Tente novamente.');
        }
      }
    } catch (err) {
      console.error('Erro durante registro:', err);
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
            Nome Completo
          </label>
          <FaUser className="absolute left-3 top-9 text-gray-400" />
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Dr. João Silva"
            className="input"
            autoComplete="name"
          />
        </div>
        
        <div className="relative">
          <label htmlFor="professionalType" className="block text-sm font-medium text-gray-300 mb-1">
            Tipo de Profissional
          </label>
          <FaUserMd className="absolute left-3 top-9 text-gray-400" />
          <select
            id="professionalType"
            name="professionalType"
            value={formData.professionalType}
            onChange={handleChange}
            required
            className="input"
          >
            <option value="medico">Médico</option>
            <option value="enfermeiro">Enfermeiro</option>
            <option value="fisioterapeuta">Fisioterapeuta</option>
            <option value="psicologo">Psicólogo</option>
            <option value="nutricionista">Nutricionista</option>
            <option value="farmaceutico">Farmacêutico</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        
        <div className="relative">
          <label htmlFor="professionalId" className="block text-sm font-medium text-gray-300 mb-1">
            Registro Profissional (CRM, COREN, etc.)
          </label>
          <FaIdCard className="absolute left-3 top-9 text-gray-400" />
          <input
            type="text"
            id="professionalId"
            name="professionalId"
            value={formData.professionalId}
            onChange={handleChange}
            placeholder="CRM 12345/SP"
            className="input"
          />
        </div>
        
        <div className="relative">
          <label htmlFor="specialty" className="block text-sm font-medium text-gray-300 mb-1">
            Especialidade
          </label>
          <FaStethoscope className="absolute left-3 top-9 text-gray-400" />
          <input
            type="text"
            id="specialty"
            name="specialty"
            value={formData.specialty}
            onChange={handleChange}
            placeholder="Cardiologia, Clínica Geral, etc."
            className="input"
          />
        </div>
        
        <div className="relative">
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <FaEnvelope className="absolute left-3 top-9 text-gray-400" />
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="joao.silva@example.com"
            className="input"
            autoComplete="email"
          />
        </div>
        
        <div className="relative">
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
            Senha
          </label>
          <FaLock className="absolute left-3 top-9 text-gray-400" />
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="input"
            autoComplete="new-password"
          />
        </div>
        
        <div className="relative">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
            Confirmar Senha
          </label>
          <FaLock className="absolute left-3 top-9 text-gray-400" />
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={6}
            placeholder="••••••••"
            className="input"
            autoComplete="new-password"
          />
          {passwordError && (
            <p className="mt-1 text-sm text-red-500 animate-shake">{passwordError}</p>
          )}
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? 'Cadastrando...' : 'Cadastrar Profissional'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center text-sm text-gray-400">
        Já é cadastrado?{' '}
        <Link to="/login" className="text-teal-500 hover:text-teal-400 transition-colors duration-200">
          Faça login
        </Link>
      </div>
    </div>
  );
};

export default Register;