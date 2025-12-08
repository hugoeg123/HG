import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { usePatientStore } from '../../store/patientStore';
import { Users } from 'lucide-react'; // Importar o ícone Users do lucide-react
import { Plus } from 'lucide-react';
import { Search } from 'lucide-react'; // Importar o ícone Search do lucide-react
import SidebarItem from '../ui/SidebarItem';
import { useThemeStore } from '../../store/themeStore';
import PatientRecordList from '../PatientView/PatientRecordList';
import { useTranslation } from 'react-i18next';

// Connector: Garantir comparações seguras de IDs (string vs number)
const eqId = (a, b) => String(a) === String(b);

/**
 * LeftSidebar component - Displays the patient list and search functionality
 * 
 * @component
 * @example
 * return (
 *   <LeftSidebar collapsed={false} />
 * )
 *
 * Integra com:
 * - services/api.js para calls a /patients/
 * - store/patientStore.js (hooks: setCurrentPatient, fetchPatientRecords)
 * - PatientView/index.jsx via navegação /patients/:id e /patients/:id/records/:recordId
 * Connector: ID normalization (string vs number) via eqId
 * 
 * IA prompt: Adicionar filtros avançados por tags e datas de consulta
 */
const LeftSidebar = ({ collapsed }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { id: activePatientId, recordId: activeRecordId } = useParams(); // Get active patient and record IDs from URL

  // Usar o store para gerenciar pacientes
  const { patients, isLoading, error, fetchPatients, fetchPatientRecords, setCurrentPatient, deletePatient, createPatient, setCurrentRecord, clearCurrentRecord, currentRecord, currentPatient } = usePatientStore();
  const { isDarkMode } = useThemeStore(); // Connector: theme-aware styles for active/hover state

  // Carregar a lista de pacientes
  // Hook: Guard against React.StrictMode double-invocation and duplicate data loads
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (!patients || patients.length === 0) {
      // Desativar prefetch pesado de registros na carga inicial da sidebar
      fetchPatients(true, { prefetchRecords: false });
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
    if (eqId(expandedPatient, patient.id)) {
      setExpandedPatient(null);
    } else {
      setExpandedPatient(patient.id);
      // Clear current record when selecting a different patient
      clearCurrentRecord();
      setCurrentPatient(patient);
      navigate(`/patients/${patient.id}`);
      // Lazy load de registros ao expandir, evitando requisições desnecessárias
      if ((!patient.records || patient.records.length === 0) && (typeof patient.recordCount === 'number' ? patient.recordCount > 0 : true)) {
        fetchPatientRecords(patient.id);
      }
    }
  };

  // Mostrar modal de confirmação de exclusão
  const handleDeletePatient = (patient, event) => {
    if (event) event.stopPropagation(); // Evitar que o clique propague para o item do paciente

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
            {t('layout.patients')}
          </h2>
          <button
            onClick={handleNewPatient}
            className="p-2 bg-teal-600/20 text-teal-300 hover:bg-teal-600/40 hover:text-teal-100 border border-teal-500/30 hover:border-teal-400/50 rounded-lg transition-all duration-200"
            title={t('layout.newPatient')}
          >
            <Plus className="h-4 w-4 text-teal-400" />
          </button>
        </div>

        {/* Campo de pesquisa */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder={t('layout.searchPatients')}
            className="w-full pl-10 pr-4 py-2 bg-theme-card border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"
          />
        </div>

        {/* Lista de pacientes */}
        {(isLoading && (!patients || patients.length === 0)) ? (
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
            {searchQuery ? t('layout.noPatientsFound') : t('layout.noPatientsRegistered')}
            <p className="text-sm text-gray-500 mt-2">{t('layout.clickToStart')}</p>
          </div>
        ) : (
          <PatientRecordList
            patients={filteredPatients}
            activePatientId={activePatientId}
            activeRecordId={activeRecordId || currentRecord?.id}
            onPatientClick={handlePatientClick}
            onRecordClick={handleRecordClick}
            onDeletePatient={handleDeletePatient}
          />
        )}

      </div>

      {/* Botões de ação fixos na parte inferior - Centralizados */}
      <div className="fixed-bottom-buttons">
        <button
          onClick={handleNewPatient}
          className="sidebar-button sidebar-button-primary"
          title={t('layout.newPatient')}
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
          {t('layout.newPatient')}
        </button>
        <button
          onClick={handleImportPatients}
          className="sidebar-button sidebar-button-secondary"
          title={t('layout.import')}
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
          {t('layout.import')}
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
              <h3 className="text-lg font-semibold text-white">{t('layout.confirmDelete')}</h3>
            </div>

            <p className="text-gray-300 mb-6">
              {t('layout.confirmDeleteMessage', { name: patientToDelete?.name || 'Sem Nome' })}
              <br /><br />
              <span className="text-red-400">{t('layout.deleteWarning')}</span>
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeletePatient}
                className="btn btn-secondary"
              >
                {t('layout.cancel')}
              </button>
              <button
                onClick={confirmDeletePatient}
                className="btn btn-danger"
              >
                {t('layout.yesDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftSidebar;