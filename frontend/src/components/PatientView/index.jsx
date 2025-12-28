import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, MapPin, Phone, Mail, Edit2, Save, X } from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';
import PatientDetail from './PatientDetail';
import HybridEditor from './HybridEditor';
import RecordsList from './RecordsList';
import ExportOptions from './ExportOptions';
import PatientDashboard from './PatientDashboard';
import RecordViewer from './RecordViewer';

/**
 * PatientView component - Exibe e gerencia a visualização detalhada de um paciente
 * 
 * @component
 * @example
 * return (
 *   <PatientView />
 * )
 * 
 * Integra com: store/patientStore.js para dados do paciente, services/api.js para chamadas à API,
 * components/Tools/Calculators.jsx para calculadoras médicas
 * 
 * IA prompt: Adicionar visualização de histórico de consultas com timeline
 */
const PatientView = () => {
  const { id, recordId } = useParams();
  const navigate = useNavigate();
  const { 
    currentPatient, 
    isLoading, 
    error, 
    fetchPatientById, 
    fetchPatientRecords,
    updatePatient,
    clearCurrentPatient,
    clearCurrentRecord,
    currentRecord,
    setCurrentRecord,
    setChatContext,
    viewMode,
    setViewMode,
    fetchRecordById
  } = usePatientStore();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false);
  const [editedBirthDate, setEditedBirthDate] = useState('');
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [editedGender, setEditedGender] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [showDashboard, setShowDashboard] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  // viewMode is now managed by the store

  // Load patient data when component mounts
  // Hook: Removed store functions from dependencies to prevent infinite loop
  // since Zustand functions are recreated on each render
  useEffect(() => {
    if (!id) return;
    console.log('PatientView: Carregando dados do paciente:', id);
    
    // Clear current record when navigating to a different patient
    clearCurrentRecord();
    
    // Clear current patient if we are switching patients to avoid stale data
    // and ensure the loading spinner is shown correctly
    if (currentPatient?.id !== id) {
      clearCurrentPatient();
    }

    // Sequenciar chamadas para evitar condição de corrida
    const load = async () => {
      try {
        await fetchPatientById(id);
        console.log('PatientView: Paciente carregado, buscando registros...');
        const recs = await fetchPatientRecords(id);
        console.log('PatientView: Registros carregados:', recs?.length || 0);
      } catch (error) {
        console.error('PatientView: Erro ao carregar paciente/records:', error);
      }
    };
    load();
  }, [id]);

  // Hook: Validate currentPatient to prevent rendering crashes
  useEffect(() => {
    if (currentPatient && (typeof currentPatient !== 'object' || Array.isArray(currentPatient))) {
      console.warn('Invalid currentPatient detected, clearing state:', currentPatient);
      clearCurrentPatient();
    }
  }, [currentPatient, clearCurrentPatient]);

  // Hook: Detect if patient is new (no records)
  useEffect(() => {
    if (currentPatient && Array.isArray(currentPatient.records)) {
      const hasNoRecords = currentPatient.records.length === 0;
      setIsNewPatient(hasNoRecords);
      
      // REMOVED: Auto-switch to editor. We want to show the dashboard even for new patients.
      // The dashboard handles empty states and provides the "Create Record" button.
      setShowDashboard(true);
      setShowEditor(false);
    }
  }, [currentPatient]);

  // Handle record selection from sidebar
  useEffect(() => {
    if (currentRecord) {
      setViewMode('viewer');
      setShowEditor(false);
    }
  }, [currentRecord, setViewMode]);

  // React to recordId in URL: fetch and show the record viewer when present
  useEffect(() => {
    if (!recordId) {
       // If no recordId is present in URL, ensure we are not in viewer mode (unless editing new)
       if (viewMode === 'viewer') {
           setViewMode('dashboard');
           clearCurrentRecord();
       }
       return;
    }

    if (!currentRecord || String(currentRecord.id) !== String(recordId)) {
      fetchRecordById(recordId)
        .then(() => {
          setViewMode('viewer');
          setShowEditor(false);
        })
        .catch((e) => {
          console.error('Erro ao carregar registro pela URL:', e);
          // If record not found, fallback to dashboard
          navigate(`/patients/${id}`);
        });
    } else {
      setViewMode('viewer');
      setShowEditor(false);
    }
  }, [recordId, id]);

  // Handle new record creation
  const handleNewRecord = (recordType = 'anamnese') => {
    setActiveTab(recordType);
    setShowEditor(true);
    setViewMode('editor');
    setCurrentRecord(null); // Clear any selected record
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    setViewMode('dashboard');
    setShowEditor(false);
    setCurrentRecord(null);
    // Ensure URL reflects dashboard (remove recordId from route)
    // Connector: Navigates back to /patients/:id so useEffect with recordId does not re-open viewer
    navigate(`/patients/${id}`, { replace: true });
  };

  // Handle sending content to chat
   const handleSendToChat = (content) => {
     setChatContext(content);
     // You can add additional logic here to focus on chat input
   };

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Handle key press for inline editing
  const handleKeyPress = (e, saveFunction) => {
    if (e.key === 'Enter') {
      saveFunction();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setIsEditingBirthDate(false);
      setIsEditingGender(false);
    }
  };

  // Handle save name
  const handleSaveName = async () => {
    if (editedName.trim() && editedName !== currentPatient?.name) {
      try {
        await updatePatient(id, { name: editedName.trim() });
        // updatePatient já atualiza o estado, não precisa de fetchPatientById
      } catch (error) {
        console.error('Erro ao atualizar nome:', error);
      }
    }
    setIsEditingName(false);
  };

  // Handle save birth date
  const handleSaveBirthDate = async () => {
    if (editedBirthDate && editedBirthDate !== currentPatient?.birthDate) {
      try {
        // Backend expects dateOfBirth, not birthDate
        await updatePatient(id, { dateOfBirth: editedBirthDate });
        // updatePatient já atualiza o estado, não precisa de fetchPatientById
      } catch (error) {
        console.error('Erro ao atualizar data de nascimento:', error);
      }
    }
    setIsEditingBirthDate(false);
  };

  // Handle save gender
  const handleSaveGender = async () => {
    if (editedGender && editedGender !== currentPatient?.gender) {
      try {
        await updatePatient(id, { gender: editedGender });
        // updatePatient já atualiza o estado, não precisa de fetchPatientById
      } catch (error) {
        console.error('Erro ao atualizar gênero:', error);
      }
    }
    setIsEditingGender(false);
  };

  // Handle edit patient
  const handleEditPatient = () => {
    navigate(`/patients/${id}/edit`);
  };

  // Definição das abas
  const tabs = [
    { id: 'details', label: 'Detalhes' },
    { id: 'anamnese', label: 'Anamnese' },
    { id: 'exames', label: 'Exames Físicos' },
    { id: 'investigacao', label: 'Investigação' },
    { id: 'diagnostico', label: 'Diagnóstico' },
    { id: 'plano', label: 'Plano' }
  ];
  
  // Renderizar estado de carregamento
  // Show full screen loader only if we don't have the patient yet AND we are loading.
  // If we have the patient but are loading (e.g. dashboard data or records), let the child components handle their own loading states.
  if (isLoading && !currentPatient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Renderizar mensagem de erro
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 m-4">
        <h3 className="text-xl font-bold mb-2 text-red-400">Erro ao carregar dados</h3>
        <p className="text-red-300 mb-4">
          {typeof error === 'string' ? error : 'Não foi possível carregar os dados deste paciente. Verifique se você tem permissão ou tente novamente.'}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-danger"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }
  
  // Renderizar mensagem se não houver paciente
  if (!currentPatient) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-6 m-4">
        <h3 className="text-xl font-bold mb-2 text-yellow-400">Paciente não encontrado</h3>
        <p className="text-yellow-300 mb-4">O paciente solicitado não foi encontrado ou não está disponível.</p>
        <button 
          onClick={() => navigate('/patients')} 
          className="btn btn-warning"
        >
          Voltar à Lista de Pacientes
        </button>
      </div>
    );
  }

  // Validar dados do paciente antes de renderizar
  const patientName = currentPatient?.name || 'Sem Nome';
  const patientId = currentPatient?.id || 'N/A';
  const patientGender = currentPatient?.gender || null;
  const patientBirthDate = currentPatient?.birthDate || null;
  const patientRecordNumber = currentPatient?.recordNumber || null;

  return (
    <div className="patient-view-container h-full flex flex-col">
      {/* Record viewer mode */}
      {viewMode === 'viewer' && currentRecord && (
        <RecordViewer
          record={currentRecord}
          onBack={handleBackToDashboard}
          onSendToChat={handleSendToChat}
        />
      )}

      {/* Editor mode */}
      {(viewMode === 'editor' || showEditor) && (
        <div className="space-y-4">
          {/* Navigation Header */}
          <div className="flex items-center justify-between bg-theme-card p-4 rounded-lg border border-theme-border">
            {/* Bloco de informações do paciente (avatar e nome) - Esquerda */}
            <div className="flex items-center">
              <div className="avatar placeholder mr-4">
                <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center">
                  <span className="text-xl">{patientName.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{patientName}</h2>
                <p className="text-gray-300">
                  {isNewPatient ? 'Primeiro Registro Médico' : 'Novo Registro Médico'}
                </p>
              </div>
            </div>

            {/* Botão "Voltar ao Dashboard" - Direita */}
            <button
              onClick={handleBackToDashboard}
              className="px-3 py-1 bg-theme-card text-white rounded hover:bg-theme-card/80 transition-colors"
            >
              ← Voltar ao Dashboard
            </button>
          </div>
          
          <HybridEditor 
            patientId={id} 
            recordType={activeTab}
            title={`${isNewPatient ? 'Primeiro' : 'Novo'} ${tabs.find(t => t.id === activeTab)?.label || 'Registro'}`}
            onSave={() => {
              fetchPatientRecords(id);
              // Always return to dashboard after save
              handleBackToDashboard();
              if (isNewPatient) {
                setIsNewPatient(false);
              }
            }}
            onCancel={handleBackToDashboard}
          />
        </div>
      )}

      {/* New patient welcome screen - DISABLED: Prefer standard dashboard
      {isNewPatient && viewMode === 'dashboard' && (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">
              Bem-vindo, {patientName}!
            </h2>
            <p className="text-gray-400 mb-6">
              Este é um novo paciente. Comece criando seu primeiro registro médico.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleNewRecord('anamnese')}
                className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Criar Anamnese
              </button>
              <button
                onClick={() => handleNewRecord('exame-fisico')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Criar Exame Físico
              </button>
              <button
                onClick={() => handleNewRecord('evolucao')}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Criar Evolução
              </button>
            </div>
          </div>
        </div>
      )}
      */}
      
      {/* Default dashboard view */}
      {viewMode === 'dashboard' && (
        <PatientDashboard 
          key={`dashboard-${id}`}
          patientId={id} 
          onNewRecord={handleNewRecord}
        />
      )}
      
      {/* Details tab content */}
      {activeTab === 'details' && !showDashboard && !showEditor && (
        <div className="space-y-4">
          <PatientDetail 
            patient={currentPatient} 
            onUpdate={() => fetchPatientById(id)}
          />
          <ExportOptions patientId={id} />
        </div>
      )}
    </div>
  );
};

export default PatientView;

// Conector: Integra com App.jsx para roteamento, LeftSidebar.jsx para navegação e RecordEditor.jsx para edição de registros