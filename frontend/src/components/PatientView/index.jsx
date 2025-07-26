import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatientStore } from '../../store/patientStore';
import PatientDetail from './PatientDetail';
import RecordEditor from './RecordEditor';
import RecordsList from './RecordsList';
import ExportOptions from './ExportOptions';

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
    currentRecord,
    fetchPatientById, 
    fetchPatientRecords,
    fetchRecordById,
    clearCurrentRecord,
    updatePatient,
    isLoading, 
    error 
  } = usePatientStore();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false);
  const [editedBirthDate, setEditedBirthDate] = useState('');
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [editedGender, setEditedGender] = useState('');


  const handleSaveName = async () => {
    if (!currentPatient?.id) {
      console.error('Erro: ID do paciente não encontrado');
      alert('Erro: Não foi possível identificar o paciente. Tente recarregar a página.');
      return;
    }
    
    if (!editedName?.trim()) {
      console.error('Erro: Nome não pode estar vazio');
      alert('Por favor, insira um nome válido.');
      return;
    }
    
    try {
      const result = await updatePatient(currentPatient.id, { name: editedName.trim() });
      if (result) {
        setIsEditingName(false);
      } else {
        setEditedName(currentPatient.name || '');
        alert('Erro ao salvar o nome. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      setEditedName(currentPatient.name || '');
      alert('Erro ao salvar o nome. Verifique sua conexão e tente novamente.');
    }
  };

  const handleSaveBirthDate = async () => {
    if (!currentPatient?.id) {
      console.error('Erro: ID do paciente não encontrado');
      alert('Erro: Não foi possível identificar o paciente. Tente recarregar a página.');
      return;
    }
    
    try {
      const result = await updatePatient(currentPatient.id, { birthDate: editedBirthDate });
      if (result) {
        setIsEditingBirthDate(false);
      } else {
        setEditedBirthDate(currentPatient.birthDate || '');
        alert('Erro ao salvar a data de nascimento. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao atualizar data de nascimento:', error);
      setEditedBirthDate(currentPatient.birthDate || '');
      alert('Erro ao salvar a data de nascimento. Verifique sua conexão e tente novamente.');
    }
  };

  const handleSaveGender = async () => {
    if (!currentPatient?.id) {
      console.error('Erro: ID do paciente não encontrado');
      alert('Erro: Não foi possível identificar o paciente. Tente recarregar a página.');
      return;
    }
    
    try {
      const result = await updatePatient(currentPatient.id, { gender: editedGender });
      if (result) {
        setIsEditingGender(false);
      } else {
        setEditedGender(currentPatient.gender || '');
        alert('Erro ao salvar o gênero. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao atualizar gênero:', error);
      setEditedGender(currentPatient.gender || '');
      alert('Erro ao salvar o gênero. Verifique sua conexão e tente novamente.');
    }
  };

  const handleKeyPress = (e, saveFunction) => {
    if (e.key === 'Enter') {
      saveFunction();
    }
  };
  
  /**
   * Função para lidar com a edição completa dos dados do paciente
   * Integra com: store/patientStore.js para atualização de dados
   * Hook: Pode ser expandida para abrir modal de edição ou navegar para página dedicada
   */
  const handleEditPatient = () => {
    // Por enquanto, implementação simples que permite edição inline dos campos principais
    // TODO: Implementar modal de edição completa ou navegação para página de edição
    console.log('Editando paciente:', currentPatient?.id);
    
    // Ativar modo de edição para todos os campos principais
    if (!isEditingName && !isEditingBirthDate && !isEditingGender) {
      setIsEditingName(true);
      setEditedName(currentPatient?.name || '');
    }
  };

  const [activeTab, setActiveTab] = useState('anamnese');
  const [showEditor, setShowEditor] = useState(false);
  
  // Carregar dados do paciente
  useEffect(() => {
    if (id && id !== 'undefined' && id.trim() !== '') {
      fetchPatientById(id);
      fetchPatientRecords(id);
    } else if (!id) {
      console.warn('ID do paciente não fornecido na URL');
    }
    
    return () => {
      clearCurrentRecord();
    };
  }, [id, fetchPatientById, fetchPatientRecords, clearCurrentRecord]);
  
  // Função para mudar a aba ativa
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Função para abrir um registro específico
  const handleOpenRecord = (recordId) => {
    if (!recordId || recordId === 'undefined') {
      console.error('Erro: ID do registro não fornecido');
      return;
    }
    fetchRecordById(recordId);
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
      <div className="text-danger p-4">
        <h3 className="text-xl font-bold mb-2">Erro ao carregar dados</h3>
        <p>{error}</p>
      </div>
    );
  }
  
  // Renderizar mensagem se não houver paciente
  if (!currentPatient) {
    return (
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">Paciente não encontrado</h3>
        <p>O paciente solicitado não foi encontrado ou não está disponível.</p>
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
      {/* Cabeçalho do paciente */}
      <div className="patient-header bg-dark-lighter p-4 rounded-lg mb-4 border border-dark-light">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="avatar placeholder mr-4">
              <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center">
                <span className="text-xl">{patientName.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleSaveName)}
                    onBlur={handleSaveName}
                    className="input input-bordered mr-2"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="btn btn-sm btn-primary mr-1"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="btn btn-sm btn-ghost"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <h2 className="text-xl font-bold text-white flex items-center">
                  {patientName}
                  <button
                    onClick={() => {
                      setIsEditingName(true);
                      setEditedName(patientName);
                    }}
                    className="btn btn-ghost btn-xs ml-2 hover:bg-primary hover:text-white transition-colors"
                    title="Editar nome"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  {/* Idade editável */}
                  {isEditingBirthDate ? (
                    <div className="ml-2 flex items-center">
                      <input
                        type="date"
                        value={editedBirthDate}
                        onChange={(e) => setEditedBirthDate(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, handleSaveBirthDate)}
                        className="input input-bordered input-xs w-32 mr-1"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveBirthDate}
                        className="btn btn-xs btn-primary mr-1"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setIsEditingBirthDate(false)}
                        className="btn btn-xs btn-ghost"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="ml-2 flex items-center group">
                      {patientBirthDate ? (
                        <>
                          {(() => {
                            const today = new Date();
                            const birth = new Date(patientBirthDate);
                            let age = today.getFullYear() - birth.getFullYear();
                            const monthDiff = today.getMonth() - birth.getMonth();
                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                              age--;
                            }
                            return `${age} anos`;
                          })()} 
                          <button
                            onClick={() => {
                              setIsEditingBirthDate(true);
                              setEditedBirthDate(patientBirthDate);
                            }}
                            className="btn btn-ghost btn-xs ml-1 opacity-70 hover:opacity-100 hover:bg-primary hover:text-white transition-all"
                            title="Editar data de nascimento"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-400">Idade não informada</span>
                          <button
                            onClick={() => {
                              setIsEditingBirthDate(true);
                              setEditedBirthDate('');
                            }}
                            className="btn btn-ghost btn-xs ml-1 opacity-70 hover:opacity-100 hover:bg-primary hover:text-white transition-all"
                            title="Adicionar data de nascimento"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </>
                      )}
                    </span>
                  )}
                </h2>
              )}
              <div className="text-gray-400 text-sm flex items-center">
                <span className="mr-3">ID: {patientId}</span>
                {/* Gênero editável */}
                {isEditingGender ? (
                  <div className="mr-3 flex items-center">
                    <select
                      value={editedGender}
                      onChange={(e) => setEditedGender(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, handleSaveGender)}
                      className="select select-bordered select-xs w-24 mr-1"
                      autoFocus
                    >
                      <option value="">Selecione</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Outro">Outro</option>
                    </select>
                    <button
                      onClick={handleSaveGender}
                      className="btn btn-xs btn-primary mr-1"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setIsEditingGender(false)}
                      className="btn btn-xs btn-ghost"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="mr-3 flex items-center group">
                    {patientGender ? (
                      <>
                        {patientGender === 'Masculino' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ) : patientGender === 'Feminino' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                        {patientGender}
                        <button
                          onClick={() => {
                            setIsEditingGender(true);
                            setEditedGender(patientGender);
                          }}
                          className="btn btn-ghost btn-xs ml-1 opacity-70 hover:opacity-100 hover:bg-primary hover:text-white transition-all"
                          title="Editar gênero"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-400">Gênero não informado</span>
                        <button
                          onClick={() => {
                            setIsEditingGender(true);
                            setEditedGender('');
                          }}
                          className="btn btn-ghost btn-xs ml-1 opacity-70 hover:opacity-100 hover:bg-primary hover:text-white transition-all"
                          title="Adicionar gênero"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </>
                    )}
                  </span>
                )}
                {patientRecordNumber && (
                  <span>Prontuário: {patientRecordNumber}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={handleEditPatient}
              className="btn btn-sm btn-outline flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Editar Dados
            </button>
<ExportOptions patientId={id} />
          </div>
        </div>
      </div>
      
      {/* Seção centralizada para Nova Consulta */}
      <div className="flex justify-center mb-6">
        <button 
          onClick={() => {
            clearCurrentRecord();
            setShowEditor(true);
            setActiveTab('anamnese');
          }} 
          className="btn btn-lg btn-primary flex items-center shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nova Consulta / Registro
        </button>
      </div>

      {/* Abas de navegação */}
      <div className="tabs tabs-boxed mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'anamnese' && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Anamnese</h3>
            
            <div className="flex justify-between mb-4">
              <button
                onClick={() => {
                  clearCurrentRecord();
                  setShowEditor(!showEditor);
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {showEditor ? 'Cancelar' : 'Nova Anamnese'}
              </button>
            </div>
            
            <RecordsList 
              patientId={id} 
              recordType="anamnese" 
              onRecordSelect={() => setShowEditor(false)}
            />
            
            <div className="space-y-4">
              {currentRecord && currentRecord.type === 'anamnese' ? (
                <div className="bg-gray-700 p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-white">{currentRecord.title || 'Anamnese'}</h4>
                    <span className="text-xs text-gray-400">
                      {new Date(currentRecord.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-300">
                    {currentRecord.content}
                  </div>
                  {currentRecord.tags && currentRecord.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {currentRecord.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 bg-blue-900 text-blue-200 text-xs rounded-full"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : showEditor ? (
                <RecordEditor 
                  patientId={id} 
                  recordType="anamnese" 
                  title="Nova Anamnese"
                  onSave={() => {
                    fetchPatientRecords(id);
                    setShowEditor(false);
                  }}
                />
              ) : null}
            </div>
          </div>
        )}
        
        {activeTab === 'exames' && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Exames Físicos</h3>
            
            <div className="flex justify-between mb-4">
              <button
                onClick={() => {
                  clearCurrentRecord();
                  setShowEditor(!showEditor);
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {showEditor ? 'Cancelar' : 'Novo Exame Físico'}
              </button>
            </div>
            
            <RecordsList 
              patientId={id} 
              recordType="exames" 
              onRecordSelect={() => setShowEditor(false)}
            />
            
            <div className="space-y-4">
              {currentRecord && currentRecord.type === 'exames' ? (
                <div className="bg-gray-700 p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-white">{currentRecord.title || 'Exame Físico'}</h4>
                    <span className="text-xs text-gray-400">
                      {new Date(currentRecord.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-300">
                    {currentRecord.content}
                  </div>
                  {currentRecord.tags && currentRecord.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {currentRecord.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 bg-blue-900 text-blue-200 text-xs rounded-full"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : showEditor ? (
                <RecordEditor 
                  patientId={id} 
                  recordType="exames" 
                  title="Novo Exame Físico"
                  onSave={() => {
                    fetchPatientRecords(id);
                    setShowEditor(false);
                  }}
                />
              ) : null}
            </div>
          </div>
        )}
        
        {activeTab === 'investigacao' && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Investigação</h3>
            
            <div className="flex justify-between mb-4">
              <button
                onClick={() => {
                  clearCurrentRecord();
                  setShowEditor(!showEditor);
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {showEditor ? 'Cancelar' : 'Nova Investigação'}
              </button>
            </div>
            
            <RecordsList 
              patientId={id} 
              recordType="investigacao" 
              onRecordSelect={() => setShowEditor(false)}
            />
            
            <div className="space-y-4">
              {currentRecord && currentRecord.type === 'investigacao' ? (
                <div className="bg-gray-700 p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-white">{currentRecord.title || 'Investigação'}</h4>
                    <span className="text-xs text-gray-400">
                      {new Date(currentRecord.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-300">
                    {currentRecord.content}
                  </div>
                  {currentRecord.tags && currentRecord.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {currentRecord.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 bg-blue-900 text-blue-200 text-xs rounded-full"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : showEditor ? (
                <RecordEditor 
                  patientId={id} 
                  recordType="investigacao" 
                  title="Nova Investigação"
                  onSave={() => {
                    fetchPatientRecords(id);
                    setShowEditor(false);
                  }}
                />
              ) : null}
            </div>
          </div>
        )}
        
        {activeTab === 'diagnostico' && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Diagnóstico</h3>
            
            <div className="flex justify-between mb-4">
              <button
                onClick={() => {
                  clearCurrentRecord();
                  setShowEditor(!showEditor);
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {showEditor ? 'Cancelar' : 'Novo Diagnóstico'}
              </button>
            </div>
            
            <RecordsList 
              patientId={id} 
              recordType="diagnostico" 
              onRecordSelect={() => setShowEditor(false)}
            />
            
            <div className="space-y-4">
              {currentRecord && currentRecord.type === 'diagnostico' ? (
                <div className="bg-gray-700 p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-white">{currentRecord.title || 'Diagnóstico'}</h4>
                    <span className="text-xs text-gray-400">
                      {new Date(currentRecord.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-300">
                    {currentRecord.content}
                  </div>
                  {currentRecord.tags && currentRecord.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {currentRecord.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 bg-blue-900 text-blue-200 text-xs rounded-full"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : showEditor ? (
                <RecordEditor 
                  patientId={id} 
                  recordType="diagnostico" 
                  title="Novo Diagnóstico"
                  onSave={() => {
                    fetchPatientRecords(id);
                    setShowEditor(false);
                  }}
                />
              ) : null}
            </div>
          </div>
        )}
        
        {activeTab === 'plano' && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Plano</h3>
            
            <div className="flex justify-between mb-4">
              <button
                onClick={() => {
                  clearCurrentRecord();
                  setShowEditor(!showEditor);
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {showEditor ? 'Cancelar' : 'Novo Plano Terapêutico'}
              </button>
            </div>
            
            <RecordsList 
              patientId={id} 
              recordType="plano" 
              onRecordSelect={() => setShowEditor(false)}
            />
            
            <div className="space-y-4">
              {currentRecord && currentRecord.type === 'plano' ? (
                <div className="bg-gray-700 p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-white">{currentRecord.title || 'Plano Terapêutico'}</h4>
                    <span className="text-xs text-gray-400">
                      {new Date(currentRecord.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-300">
                    {currentRecord.content}
                  </div>
                  {currentRecord.tags && currentRecord.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {currentRecord.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 bg-blue-900 text-blue-200 text-xs rounded-full"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : showEditor ? (
                <RecordEditor 
                  patientId={id} 
                  recordType="plano" 
                  title="Novo Plano Terapêutico"
                  onSave={() => {
                    fetchPatientRecords(id);
                    setShowEditor(false);
                  }}
                />
              ) : null}
            </div>
          </div>
        )}
        
        {activeTab === 'details' && (
          <div className="space-y-4">
            <PatientDetail 
              patient={currentPatient} 
              onUpdate={() => fetchPatientById(id)}
            />
            <ExportOptions patientId={id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientView;

// Conector: Integra com App.jsx para roteamento, LeftSidebar.jsx para navegação e RecordEditor.jsx para edição de registros