import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { usePatientStore } from '../../store/patientStore';
import { Users } from 'lucide-react'; // Importar o ícone Users do lucide-react
import { Plus } from 'lucide-react';
import { Search } from 'lucide-react'; // Importar o ícone Search do lucide-react
import SidebarItem from '../ui/SidebarItem';
import { useThemeStore } from '../../store/themeStore';

/**
 * LeftSidebar component - Displays the patient list and search functionality
 * 
 * @component
 * @example
 * return (
 *   <LeftSidebar collapsed={false} />
 * )
 * 
 * Integra com: services/api.js para calls a /patients/, e store/patientStore.js para usePatientStore
 * 
 * IA prompt: Adicionar filtros avançados por tags e datas de consulta
 */
const LeftSidebar = ({ collapsed }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { id: activePatientId, recordId: activeRecordId } = useParams(); // Get active patient and record IDs from URL
  
  // Usar o store para gerenciar pacientes
  const { patients, isLoading, error, fetchPatients, setCurrentPatient, deletePatient, createPatient, setCurrentRecord, clearCurrentRecord, currentRecord } = usePatientStore();
  const { isDarkMode } = useThemeStore(); // Connector: theme-aware styles for active/hover state

  // Carregar a lista de pacientes
  // Hook: Guard against React.StrictMode double-invocation and duplicate data loads
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (!patients || patients.length === 0) {
      fetchPatients();
    }
  }, []);

  // Quando um registro está ativo (via URL ou store), garantir que o paciente correspondente esteja expandido
  useEffect(() => {
    if ((activeRecordId && String(activeRecordId).length > 0) || currentRecord) {
      setExpandedPatient(activePatientId);
    }
  }, [activeRecordId, currentRecord, activePatientId]);

  // Filtrar pacientes com base na pesquisa
  const filteredPatients = Array.isArray(patients) ? patients.filter(patient => {
    const patientName = patient.name ? patient.name.toLowerCase() : '';
    return patientName.includes(searchQuery.toLowerCase()) || 
           patient.id.toString().includes(searchQuery) ||
           (patient.tags && patient.tags.some(tag => 
             tag.name.toLowerCase().includes(searchQuery.toLowerCase())
           ));
  }) : [];

  // Manipular clique no paciente
  const handlePatientClick = (patient) => {
    if (expandedPatient === patient.id) {
      setExpandedPatient(null);
    } else {
      setExpandedPatient(patient.id);
      // Clear current record when selecting a different patient
      clearCurrentRecord();
      setCurrentPatient(patient);
      navigate(`/patients/${patient.id}`);
    }
  };

  // Mostrar modal de confirmação de exclusão
  const handleDeletePatient = (patient, event) => {
    event.stopPropagation(); // Evitar que o clique propague para o item do paciente
    
    if (!patient || !patient.id || patient.id === 'undefined') {
      console.error('Paciente inválido para exclusão - ID não encontrado');
      alert('Erro: Não foi possível identificar o paciente para exclusão.');
      return;
    }
    
    setPatientToDelete(patient);
    setShowDeleteModal(true);
  };

  // Confirmar exclusão do paciente
  const confirmDeletePatient = async () => {
    if (!patientToDelete || !patientToDelete.id || patientToDelete.id === 'undefined') {
      console.error('Erro: ID do paciente não encontrado para exclusão');
      alert('Erro: Não foi possível identificar o paciente para exclusão.');
      setShowDeleteModal(false);
      setPatientToDelete(null);
      return;
    }
    
    try {
      const success = await deletePatient(patientToDelete.id);
      if (success) {
        // Se o paciente excluído estava sendo visualizado, navegar para a página inicial
        if (location.pathname.includes(`/patients/${patientToDelete.id}`)) {
          navigate('/');
        }
        // Mostrar mensagem de sucesso (deletePatient já atualiza o estado)
        console.log(`Paciente ${patientToDelete.name} excluído com sucesso`);
      } else {
        console.error('Falha ao excluir paciente - operação retornou false');
        alert('Erro ao excluir paciente. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      alert('Erro ao excluir paciente. Verifique sua conexão e tente novamente.');
    } finally {
      setShowDeleteModal(false);
      setPatientToDelete(null);
    }
  };

  // Cancelar exclusão
  const cancelDeletePatient = () => {
    setShowDeleteModal(false);
    setPatientToDelete(null);
  };

  // Manipular clique em um registro específico
  const handleRecordClick = (patientId, recordId) => {
    // Find the record in the current patient's records
    const patient = patients.find(p => p.id === patientId);
    if (patient && patient.records) {
      const record = patient.records.find(r => r.id === recordId);
      if (record) {
        // Set the current record in the store
        setCurrentRecord(record);
        // Navigate to specific record route to keep URL as source of truth
        // Connector: PatientView/index.jsx reacts to /patients/:id/records/:recordId
        navigate(`/patients/${patientId}/records/${recordId}`);
      }
    }
  };

  // Criar novo paciente
  const handleNewPatient = async () => {
    try {
      const newPatient = await createPatient({
        name: 'Sem Nome',
        dateOfBirth: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
        gender: 'não informado',
        email: null,
        phone: null,
        cpf: null,
        street: null,
        city: null,
        state: null,
        zipCode: null,
        country: 'Brasil',
        bloodType: 'Desconhecido',
        allergies: [],
        chronicConditions: [],
        medications: [],
        familyHistory: []
      });
      
      if (newPatient && newPatient.id) {
        // Navegar para o novo paciente (createPatient já atualiza o estado)
        navigate(`/patients/${newPatient.id}`);
      }
    } catch (err) {
      console.error('Erro ao criar paciente:', err);
      alert('Erro ao criar paciente. Tente novamente.');
    }
  };

  // Importar pacientes
  const handleImportPatients = () => {
    navigate('/patients/import');
  };

  return (
    <div className={`left-pane ${collapsed ? 'collapsed' : ''} bg-theme-background`}>
      <div className="p-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-400" />
            Pacientes
          </h2>
          <button
            onClick={handleNewPatient}
            className="p-2 bg-teal-600/20 text-teal-300 hover:bg-teal-600/40 hover:text-teal-100 border border-teal-500/30 hover:border-teal-400/50 rounded-lg transition-all duration-200"
            title="Novo Paciente"
          >
            <Plus className="h-4 w-4 text-teal-400" />
          </button>
        </div>
        
        {/* Campo de pesquisa */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Buscar pacientes..."
            className="w-full pl-10 pr-4 py-2 bg-theme-card border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"
          />
        </div>

        {/* Lista de pacientes */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-4">{error}</div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-gray-400 text-center py-4 flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            {searchQuery ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            <p className="text-sm text-gray-500 mt-2">Clique em "Novo Paciente" para começar</p>
          </div>
        ) : (
          <ul className="patient-list">
            {filteredPatients.map((patient, index) => {
              // Validar dados do paciente
              const patientName = patient?.name || 'Sem Nome';
              const patientId = patient?.id || `temp-patient-${index}-${Date.now()}`;
              
              // Check if this patient is currently active (only use URL as source of truth)
              const isActive = String(patient.id) === String(activePatientId);
              
              return (
                <li key={`patient-${patientId}`} className="mb-2">
                  <SidebarItem
                    isActive={isActive}
                    title={patientName}
                    subtitle={patient.age ? `${patient.age} anos • ${patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Feminino' : 'Não informado'}` : undefined}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 transition-transform ${expandedPatient === patientId ? 'transform rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    }
                    onClick={() => handlePatientClick(patient)}
                    className="relative group"
                  >
                    {/* Additional content */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {patient.records && (
                          <div className="text-teal-400 text-xs mt-1">
                            {patient.records.length} registro(s)
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleDeletePatient(patient, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-theme-card text-gray-300 hover:bg-red-600/20 hover:text-red-300 border border-transparent hover:border-red-500/30 rounded-lg transition-all duration-200"
                        title="Excluir paciente"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </SidebarItem>

                  {/* Registros do paciente (expandidos) */}
                  {expandedPatient === patientId && patient.records && patient.records.length > 0 ? (
                    <ul className="ml-6 mt-1 mb-2 space-y-1">
                      {patient.records.map((record, recordIndex) => {
                        const recordTitle = record?.title || 'Consulta';
                        const recordId = record?.id || `temp-record-${patientId}-${recordIndex}-${Date.now()}`;
                        const recordDate = record?.date || new Date().toISOString();
                        const recordTags = record?.tags || [];

                        // Registro ativo se coincide com o currentRecord do store ou com o recordId da URL
                        const isRecordActive = (
                          record?.id && (
                            (currentRecord?.id && String(currentRecord.id) === String(record.id)) ||
                            (activeRecordId && String(activeRecordId) === String(record.id))
                          )
                        );
                        
                        return (
                          <li key={`record-${recordId}`}>
                            <div
                              className={`p-2 bg-theme-card ${isRecordActive ? (isDarkMode ? 'border-teal-500 bg-teal-600/20 text-teal-300' : 'border-blue-500 bg-blue-600/10 text-blue-700') : (isDarkMode ? 'text-gray-300' : 'text-gray-700')} hover:bg-theme-surface ${isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'} border ${isRecordActive ? (isDarkMode ? 'border-teal-500' : 'border-blue-500') : `border-transparent ${isDarkMode ? 'hover:border-teal-500/30' : 'hover:border-blue-500/30'}`} rounded-md cursor-pointer flex items-center transition-all duration-200`}
                              onClick={() => handleRecordClick(patientId, record.id)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-4 w-4 mr-2 ${isRecordActive ? (isDarkMode ? 'text-teal-300' : 'text-blue-600') : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <div className="flex-1">
                                <div className="text-sm">{recordTitle}</div>
                                <div className="text-xs text-gray-400">
                                  {new Date(recordDate).toLocaleDateString('pt-BR')}
                                </div>
                                {/* Tags */}
                                {recordTags.length > 0 && (
                                  <div className="flex flex-wrap mt-1">
                                    {recordTags.slice(0, 2).map((tag, tagIndex) => {
                                      const tagName = tag?.name || 'Tag';
                                      const tagId = tag?.id || `${recordId}-tag-${tagIndex}`;
                                      
                                      return (
                                        <span
                                          key={`tag-${tagId}-${tagIndex}`}
                                          className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded mr-1"
                                        >
                                          #{tagName}
                                        </span>
                                      );
                                    })}
                                    {recordTags.length > 2 && (
                                      <span key={`more-tags-${recordId}`} className="text-xs text-gray-400">+{recordTags.length - 2}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : expandedPatient === patientId && (
                    <div className="ml-6 mt-1 mb-2 text-sm text-gray-400">
                      Nenhum registro encontrado
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

      </div>
      
      {/* Botões de ação fixos na parte inferior - Centralizados */}
      <div className="fixed-bottom-buttons">
        <button
          onClick={handleNewPatient}
          className="sidebar-button sidebar-button-primary"
          title="Criar novo paciente"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Novo Paciente
        </button>
        <button
          onClick={handleImportPatients}
          className="sidebar-button sidebar-button-secondary"
          title="Importar pacientes"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Importar
        </button>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-600/20 border border-red-600/30 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Confirmar Exclusão</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja excluir o paciente <strong className="text-white">"{patientToDelete?.name || 'Sem Nome'}"</strong>?
              <br /><br />
              <span className="text-red-400">Esta ação não pode ser desfeita e todos os registros médicos associados serão perdidos.</span>
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeletePatient}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeletePatient}
                className="btn btn-danger"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftSidebar;

// Conector: Integra com App.jsx para exibição na interface principal e com PatientDetail.jsx para navegação