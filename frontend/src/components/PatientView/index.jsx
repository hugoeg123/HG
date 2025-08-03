import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, MapPin, Phone, Mail, Edit2, Save, X } from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';
import PatientDetail from './PatientDetail';
import HybridEditor from './HybridEditor';
import RecordsList from './RecordsList';
import ExportOptions from './ExportOptions';
import PatientDashboard from './PatientDashboard';

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
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    currentPatient, 
    records,
    isLoading, 
    error, 
    fetchPatientById, 
    fetchPatientRecords,
    updatePatient,
    clearCurrentPatient,
    clearCurrentRecord
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

  // Load patient data when component mounts
  // Hook: Removed store functions from dependencies to prevent infinite loop
  // since Zustand functions are recreated on each render
  useEffect(() => {
    if (id) {
      fetchPatientById(id);
      fetchPatientRecords(id);
    }
  }, [id]);

  // Hook: Validate currentPatient to prevent rendering crashes
  useEffect(() => {
    if (currentPatient && (typeof currentPatient !== 'object' || Array.isArray(currentPatient))) {
      console.warn('Invalid currentPatient detected, clearing state:', currentPatient);
      clearCurrentPatient();
    }
  }, [currentPatient, clearCurrentPatient]);

  // Handle new record creation
  const handleNewRecord = (recordType = 'anamnese') => {
    setActiveTab(recordType);
    setShowDashboard(false);
    setShowEditor(true);
    clearCurrentRecord();
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    setShowEditor(false);
    setShowDashboard(true);
    clearCurrentRecord();
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
        await updatePatient(id, { birthDate: editedBirthDate });
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
  if (isLoading) {
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
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
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
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition-colors"
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
      {/* Show Dashboard by default */}
      {showDashboard && !showEditor && (
        <PatientDashboard 
          key={`dashboard-${id}`}
          patientId={id} 
          onNewRecord={handleNewRecord}
        />
      )}
      
      {/* Show Editor when creating new record */}
      {showEditor && !showDashboard && (
        <div className="space-y-4">
          {/* Navigation Header */}
          <div className="flex items-center justify-between bg-dark-lighter p-4 rounded-lg border border-dark-light">
            <div className="flex items-center">
              <button
                onClick={handleBackToDashboard}
                className="mr-4 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                ← Voltar ao Dashboard
              </button>
              <div className="flex items-center">
                <div className="avatar placeholder mr-4">
                  <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center">
                    <span className="text-xl">{patientName.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{patientName}</h2>
                  <p className="text-gray-300">Novo Registro Médico</p>
                </div>
              </div>
            </div>
          </div>
          
          <HybridEditor 
            patientId={id} 
            recordType={activeTab}
            title={`Novo ${tabs.find(t => t.id === activeTab)?.label || 'Registro'}`}
            onSave={() => {
              fetchPatientRecords(id);
              handleBackToDashboard();
            }}
            onCancel={handleBackToDashboard}
          />
        </div>
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