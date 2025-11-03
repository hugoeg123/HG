import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../ui/Toast';
import InputField from '../ui/InputField';
import api from '../../services/api';

/**
 * RegisterPatient component - Formulário de cadastro de paciente
 * 
 * Integrates with:
 * - services/api.js para POST /auth/patient/register
 * - backend/src/controllers/auth.controller.js (registerPatient)
 * - pages/Marketplace/DoctorsList.jsx via redirecionamento pós-cadastro
 * 
 * Connector: Envia dados estruturados ao backend para criação do paciente e retorna token
 */
const RegisterPatient = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    dateOfBirth: '', gender: 'masculino', race_color: '', nationality: '',
    street: '', city: '', state: '', zipCode: '', country: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Debug: contar renders sem causar re-render
  const renderCountRef = useRef(0);
  useEffect(() => {
    // Log resumido do elemento ativo a cada render sem usar setState
    // Útil para identificar remounts que roubam o foco
    renderCountRef.current += 1;
    const ae = document.activeElement;
    const aeId = ae?.id || ae?.name || ae?.tagName;
    console.log('[render]', renderCountRef.current, 'activeElement:', aeId);
  });

  // Debug global: observar eventos de foco no documento para detectar capturas de foco
  useEffect(() => {
    const onFocusIn = (e) => {
      const el = e.target;
      console.log('[focusin]', el.name || el.id || el.tagName, '→ active:', document.activeElement?.id || document.activeElement?.name || document.activeElement?.tagName);
    };
    const onFocusOut = (e) => {
      const el = e.target;
      console.log('[focusout]', el.name || el.id || el.tagName, '→ nextActive:', document.activeElement?.id || document.activeElement?.name || document.activeElement?.tagName);
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  // Debug: observar mudanças em formData e elemento ativo
  useEffect(() => {
    const ae = document.activeElement;
    const aeId = ae?.id || ae?.name || ae?.tagName;
    console.log('[formData change]', Object.keys(formData).join(','), 'activeElement:', aeId);
  }, [formData]);

  // Debug: instrumentação temporária de foco/blur para diagnosticar perda de foco
  const handleFocus = (e) => {
    const el = e.target;
    // Log compacto: nome do campo e tipo
    console.log('[focus]', el.name || el.id, {
      tag: el.tagName.toLowerCase(),
      type: el.type,
      active: document.activeElement?.id || document.activeElement?.name || document.activeElement?.tagName
    });
  };
  const handleBlur = (e) => {
    const el = e.target;
    console.log('[blur]', el.name || el.id, {
      tag: el.tagName.toLowerCase(),
      type: el.type,
      nextActive: document.activeElement?.id || document.activeElement?.name || document.activeElement?.tagName
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Senhas não coincidem', { description: 'Verifique senha e confirmação.' });
        return;
      }
      if (!formData.email && !formData.phone) {
        toast.warning('Informe email ou telefone', { description: 'Pelo menos um contato é necessário.' });
        return;
      }
      const payload = { ...formData }; delete payload.confirmPassword;
      await api.post('/auth/patient/register', payload);
      toast.success('Cadastro realizado com sucesso!', { description: 'Faça login para acessar.' });
      navigate('/login', { state: { email: formData.email || formData.phone || '' } });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erro ao realizar cadastro';
      toast.error(msg, { description: 'Verifique os dados e tente novamente.' });
    } finally { setIsLoading(false); }
  };

  // Campo reutilizável: usar componente estável para evitar remontagens e perda de foco

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField id="name" label="Nome completo" required value={formData.name} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField id="email" label="Email" type="email" value={formData.email} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} />
          <InputField id="phone" label="Telefone" type="tel" value={formData.phone} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField id="dateOfBirth" label="Data de Nascimento" type="date" required value={formData.dateOfBirth} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} />
          <div className="space-y-2">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-300">Gênero</label>
            <select id="gender" name="gender" value={formData.gender} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} required className="input">
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              <option value="outro">Outro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField id="password" label="Senha" type="password" required value={formData.password} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} />
          <InputField id="confirmPassword" label="Confirmar Senha" type="password" required value={formData.confirmPassword} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField id="street" label="Rua" value={formData.street} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} />
          <InputField id="city" label="Cidade" value={formData.city} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} />
          <InputField id="state" label="Estado" value={formData.state} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} />
          <InputField id="zipCode" label="CEP" value={formData.zipCode} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} />
          <InputField id="country" label="País" value={formData.country} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="race_color" className="block text-sm font-medium text-gray-300">Raça/Cor</label>
            <select id="race_color" name="race_color" value={formData.race_color} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} className="input">
              <option value="">Selecione</option>
              <option value="branca">Branca</option>
              <option value="preta">Preta</option>
              <option value="parda">Parda</option>
              <option value="amarela">Amarela</option>
              <option value="indigena">Indígena</option>
              <option value="outra">Outra</option>
            </select>
          </div>
          <InputField id="nationality" label="Nacionalidade" value={formData.nationality} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} />
        </div>

        <div className="pt-4">
          <button type="submit" disabled={isLoading} className="btn btn-primary w-full py-3 text-base font-medium">
            {isLoading ? 'Cadastrando...' : 'Criar minha conta'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-gray-400">
        Já tem conta? <Link to="/login" className="text-teal-400 hover:text-teal-300 transition-colors duration-200 font-medium">Acesse o login</Link>
      </div>
    </div>
  );
};

export default RegisterPatient;