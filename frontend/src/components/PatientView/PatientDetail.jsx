import { useState } from 'react';
import { usePatientStore } from '../../store/patientStore';

/**
 * PatientDetail component - Exibe e permite editar detalhes do paciente
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.patient - Objeto do paciente
 * @param {Function} props.onUpdate - Callback após atualização do paciente
 * 
 * @example
 * return (
 *   <PatientDetail 
 *     patient={patientObj}
 *     onUpdate={handlePatientUpdate}
 *   />
 * )
 * 
 * Integra com: store/patientStore.js para gerenciamento de dados do paciente
 * 
 * IA prompt: Adicionar suporte para histórico de alergias e medicamentos
 */
const PatientDetail = ({ patient, onUpdate }) => {
  const { updatePatient, isLoading } = usePatientStore();
  
  // Validar e definir valores padrão para os dados do paciente
  const patientData = {
    name: patient?.name || '',
    birthDate: patient?.birthDate || '',
    gender: patient?.gender || '',
    phone: patient?.phone || '',
    email: patient?.email || '',
    address: patient?.address || '',
    recordNumber: patient?.recordNumber || '',
    healthInsurance: patient?.healthInsurance || '',
    notes: patient?.notes || ''
  };
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(patientData);
  
  // Calcular idade a partir da data de nascimento
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      if (isNaN(birth.getTime())) return null;
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age >= 0 ? age : null;
    } catch (error) {
      console.error('Erro ao calcular idade:', error);
      return null;
    }
  };
  
  // Manipular mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Mapear valores de gênero do frontend para backend
  const mapGenderToBackend = (frontendGender) => {
    const genderMap = {
      'Masculino': 'masculino',
      'Feminino': 'feminino', 
      'Outro': 'outro'
    };
    return genderMap[frontendGender] || 'não informado';
  };

  // Mapear valores de gênero do backend para frontend
  const mapGenderToFrontend = (backendGender) => {
    const genderMap = {
      'masculino': 'Masculino',
      'feminino': 'Feminino',
      'outro': 'Outro',
      'não informado': ''
    };
    return genderMap[backendGender] || '';
  };
  
  // Iniciar edição
  const handleEdit = () => {
    setIsEditing(true);
    // Mapear dados do backend para o frontend
    setFormData({
      ...patientData,
      gender: mapGenderToFrontend(patientData.gender),
      birthDate: patientData.dateOfBirth ? patientData.dateOfBirth.split('T')[0] : ''
    });
  };
  
  // Cancelar edição
  const handleCancel = () => {
    setIsEditing(false);
  };
  
  // Salvar alterações
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Mapear dados do frontend para o backend
      const backendData = {
        ...formData,
        gender: mapGenderToBackend(formData.gender)
      };
      
      await updatePatient(patient.id, backendData);
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
    }
  };
  
  // Modo de visualização
  if (!isEditing) {
    return (
      <div className="patient-detail bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Detalhes do Paciente</h3>
          <button
            onClick={handleEdit}
            className="btn btn-sm btn-outline"
          >
            Editar
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-gray-400 text-sm">Nome</h4>
            <p className="text-white">{patientData.name || '-'}</p>
          </div>
          
          <div>
            <h4 className="text-gray-400 text-sm">Data de Nascimento</h4>
            <p className="text-white">
              {patientData.birthDate ? (
                <>
                  {new Date(patientData.birthDate).toLocaleDateString('pt-BR')}
                  {' '}
                  <span className="text-gray-400">({calculateAge(patientData.birthDate) !== null ? `${calculateAge(patientData.birthDate)} anos` : 'Não calculável'})</span>
                </>
              ) : '-'}
            </p>
          </div>
          
          <div>
            <h4 className="text-gray-400 text-sm">Gênero</h4>
            <p className="text-white">{patientData.gender || '-'}</p>
          </div>
          
          <div>
            <h4 className="text-gray-400 text-sm">Telefone</h4>
            <p className="text-white">{patientData.phone || '-'}</p>
          </div>
          
          <div>
            <h4 className="text-gray-400 text-sm">Email</h4>
            <p className="text-white">{patientData.email || '-'}</p>
          </div>
          
          <div>
            <h4 className="text-gray-400 text-sm">Endereço</h4>
            <p className="text-white">{patientData.address || '-'}</p>
          </div>
          
          <div>
            <h4 className="text-gray-400 text-sm">Número do Prontuário</h4>
            <p className="text-white">{patientData.recordNumber || '-'}</p>
          </div>
          
          <div>
            <h4 className="text-gray-400 text-sm">Plano de Saúde</h4>
            <p className="text-white">{patientData.healthInsurance || '-'}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="text-gray-400 text-sm">Observações</h4>
          <p className="text-white whitespace-pre-wrap">{patientData.notes || '-'}</p>
        </div>
      </div>
    );
  }
  
  // Modo de edição
  return (
    <div className="patient-detail bg-gray-800 rounded-lg p-4">
      <h3 className="text-xl font-semibold text-white mb-4">Editar Paciente</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 mb-1">Nome</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Data de Nascimento</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Gênero</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="input w-full"
            >
              <option value="">Selecione</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Telefone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Endereço</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Número do Prontuário</label>
            <input
              type="text"
              name="recordNumber"
              value={formData.recordNumber}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Plano de Saúde</label>
            <input
              type="text"
              name="healthInsurance"
              value={formData.healthInsurance}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-gray-300 mb-1">Observações</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="input w-full h-24"
          ></textarea>
        </div>
        
        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientDetail;

// Conector: Integra com PatientView/index.jsx para exibição de detalhes do paciente e store/patientStore.js para persistência de dados