import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePatientStore } from '../../store/patientStore';
import { useDebounce } from '../../hooks/useDebounce';
import { useMultipleAbortControllers } from '../../hooks/useAbortController';
import { useToast } from '../ui/Toast';
import { PlusCircle, UserCircle, FileText, AlertTriangle, Pill, HeartPulse, Microscope, Clock, Target, TestTube, ArrowRight, Search, Beaker, NotebookPen, History, Edit2, Save, X } from 'lucide-react';

// Tipos de dados para o dashboard
const statusColors = {
  success: 'text-green-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
};

// Componente para cards de informação
const InfoCard = ({ title, children }) => (
  <div className="bg-theme-card p-5 rounded-lg border border-gray-800">
    <h3 className="font-semibold text-lg text-white mb-4">{title}</h3>
    {children}
  </div>
);

// Componente para itens da timeline
const TimelineItem = ({ item }) => {
  const iconMap = {
    'Consulta': <FileText size={18}/>,
    'Pedido de Exame': <Beaker size={18}/>,
    'Resultado de Exame': <Microscope size={18}/>,
    'Prescrição': <Pill size={18}/>,
    'Orientação': <NotebookPen size={18}/>,
  };

  // Safe text rendering helper
  const safeText = (value, fallback = 'N/A') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'object') return fallback;
    return String(value);
  };

  // Validate item object
  if (!item || typeof item !== 'object') {
    return (
      <div className="relative pl-8 py-2">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">Erro: Item de timeline inválido</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pl-8 py-2 group">
      <div className="absolute left-0 top-4 w-px h-full bg-gray-700"></div>
      <div className="absolute left-[-5px] top-4 w-4 h-4 bg-gray-700 rounded-full border-4 border-theme-background group-hover:bg-teal-500 transition-colors"></div>
      <div className="bg-theme-card p-4 rounded-lg border border-gray-800 transition-all hover:border-teal-500/50 hover:bg-theme-card/80 cursor-pointer">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-sm text-gray-400">{safeText(item.data)} às {safeText(item.hora)} • {safeText(item.contexto)}</p>
            <h3 className="font-semibold text-white mt-1">{safeText(item.descricao)}</h3>
            <p className="text-xs text-gray-500 mt-1">Registrado por: {safeText(item.medico)}</p>
          </div>
          <div className="text-teal-400 flex-shrink-0 mt-1" title={safeText(item.tipo)}>
            {iconMap[safeText(item.tipo)] || <FileText size={18}/>}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * PatientDashboard Component - Dashboard sofisticado do paciente
 * Displays real-time patient dashboard data from API
 * Integrates with: patientStore for data management
 * Hook: Used in PatientView for displaying patient information
 */
const PatientDashboard = ({ patientId, onNewRecord }) => {
  // Validate props to prevent rendering objects as text
  const safePatientId = typeof patientId === 'string' ? patientId : '';
  const safeOnNewRecord = typeof onNewRecord === 'function' ? onNewRecord : () => {};
  
  const { 
    currentPatient, 
    dashboardData,
    fetchPatientDashboard,
    updatePatient, 
    isLoading, 
    error 
  } = usePatientStore();
  
  // Validate currentPatient to prevent crashes
  const safeCurrentPatient = currentPatient && typeof currentPatient === 'object' && !Array.isArray(currentPatient) ? currentPatient : null;
  
  const [activeTab, setActiveTab] = useState('historico');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { createSignal, abortAll } = useMultipleAbortControllers();
  const { toast } = useToast();
  
  // Estados para edição inline
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false);
  const [editedBirthDate, setEditedBirthDate] = useState('');
  
  const isMountedRef = useRef(false);
  
  // Funções para edição inline
  const handleEditName = () => {
    setEditedName(safeCurrentPatient?.name || '');
    setIsEditingName(true);
  };
  
  const handleSaveName = async () => {
    if (editedName.trim() && editedName !== safeCurrentPatient?.name) {
      try {
        await updatePatient(safePatientId, { name: editedName.trim() });
        toast.success('Nome atualizado com sucesso');
      } catch (error) {
        console.error('Erro ao atualizar nome:', error);
        toast.error('Erro ao atualizar nome');
      }
    }
    setIsEditingName(false);
  };
  
  const handleCancelNameEdit = () => {
    setEditedName('');
    setIsEditingName(false);
  };
  
  const handleEditBirthDate = () => {
    // Converter data para formato yyyy-mm-dd para o input
    const birthDate = safeCurrentPatient?.birthDate;
    if (birthDate) {
      const date = new Date(birthDate);
      const formattedDate = date.toISOString().split('T')[0];
      setEditedBirthDate(formattedDate);
    }
    setIsEditingBirthDate(true);
  };
  
  const handleSaveBirthDate = async () => {
    if (editedBirthDate && editedBirthDate !== safeCurrentPatient?.birthDate) {
      try {
        // Backend expects dateOfBirth, not birthDate
        await updatePatient(safePatientId, { dateOfBirth: editedBirthDate });
        toast.success('Data de nascimento atualizada com sucesso');
        
        // Force refresh dashboard to get updated data
        await fetchPatientDashboard(safePatientId, { forceRefresh: true });
      } catch (error) {
        console.error('Erro ao atualizar data de nascimento:', error);
        toast.error('Erro ao atualizar data de nascimento');
      }
    }
    setIsEditingBirthDate(false);
  };
  
  const handleCancelBirthDateEdit = () => {
    setEditedBirthDate('');
    setIsEditingBirthDate(false);
  };
  
  // Handle key press for inline editing
  const handleKeyPress = (e, saveFunction, cancelFunction) => {
    if (e.key === 'Enter') {
      saveFunction();
    } else if (e.key === 'Escape') {
      cancelFunction();
    }
  };
  
  // Load dashboard data when component mounts
  const loadDashboard = useCallback(async (showToast = false) => {
    if (!safePatientId || !isMountedRef.current) return;
    
    try {
      const signal = createSignal('dashboard');
      await fetchPatientDashboard(safePatientId, { signal });
      
      if (showToast && isMountedRef.current) {
        toast.success('Dashboard atualizado', {
          description: 'Dados do paciente carregados com sucesso'
        });
      }
    } catch (err) {
      // Don't show error for expected cancellations
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        console.debug('Dashboard request canceled (expected behavior)');
        return;
      }
      
      console.error('Erro ao carregar dashboard:', err);
      if (isMountedRef.current) {
        toast.error('Erro ao carregar dashboard', {
          description: 'Não foi possível carregar os dados do paciente'
        });
      }
    }
  }, [safePatientId, createSignal, fetchPatientDashboard, toast]);
  
  // Mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      abortAll();
    };
  }, []);
  
  // Load dashboard when patientId changes
  // Hook: Fixed dependency array to prevent infinite loops
  useEffect(() => {
    if (!safePatientId) return;
    
    console.log('🔍 PatientDashboard loading for patient:', safePatientId);
    loadDashboard();
  }, [safePatientId]); // Removed loadDashboard from dependencies to prevent infinite loop
  
  // Handle retry with force refresh to bypass cache
  const handleRetry = useCallback(() => {
    // Force refresh to bypass cache on retry
    if (safePatientId) {
      const signal = createSignal('dashboard');
      fetchPatientDashboard(safePatientId, { signal, forceRefresh: true })
        .then(() => {
          toast.success('Dashboard atualizado', {
            description: 'Dados do paciente carregados com sucesso'
          });
        })
        .catch(err => {
          if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
            console.error('Erro ao recarregar dashboard:', err);
            toast.error('Erro ao recarregar dashboard');
          }
        });
    }
  }, [safePatientId, createSignal, fetchPatientDashboard, toast]);
  
  // Usar dados reais do store ou fallback para dados vazios
  const realData = {
    sinaisVitais: dashboardData?.sinaisVitais || {
      pressao: { valor: '--', status: 'warning', timestamp: '--' },
      temperatura: { valor: '--', status: 'warning', timestamp: '--' },
      saturacao: { valor: '--', status: 'warning', timestamp: '--' },
      frequencia: { valor: '--', status: 'warning', timestamp: '--' }
    },
    timeline: dashboardData?.historicoConsultas || [],
    investigacao: dashboardData?.investigacoesEmAndamento || [],
    planos: dashboardData?.planos || [],
    problemasAtivos: dashboardData?.problemasAtivos || [],
    alergias: dashboardData?.alergias || [],
    medicamentosEmUso: dashboardData?.medicamentosEmUso || [],
    resultadosRecentes: dashboardData?.resultadosRecentes || []
  };

  // Filter timeline based on search term and active tab
  const filteredData = useMemo(() => {
    let dataToFilter = [];
    
    switch (activeTab) {
      case 'historico':
        dataToFilter = realData.timeline;
        break;
      case 'investigacao':
        dataToFilter = realData.investigacao;
        break;
      case 'planos':
        dataToFilter = realData.planos;
        break;
      default:
        dataToFilter = realData.timeline;
    }
    
    if (!debouncedSearchTerm) return dataToFilter;
    
    return dataToFilter.filter(item => 
      item.descricao?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      item.tipo?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      item.contexto?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      item.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      item.content?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [debouncedSearchTerm, activeTab, realData]);
  
  // Calculate patient age
  const patientAge = useMemo(() => {
    if (!safeCurrentPatient?.birthDate) return null;
    
    const today = new Date();
    const birth = new Date(safeCurrentPatient.birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }, [safeCurrentPatient?.birthDate]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-theme-background text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        <span className="ml-2 text-gray-400">Carregando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-theme-background text-white">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white">Erro ao carregar dashboard</h3>
          <p className="text-gray-400 mt-1">{error}</p>
          <button 
            onClick={handleRetry}
            className="btn btn-primary mt-4"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
  
  // No patient data
  if (!safeCurrentPatient) {
    return (
      <div className="min-h-screen bg-theme-background text-gray-300 font-sans p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-theme-surface p-6 rounded-lg border border-gray-800">
            <p className="text-gray-500">Nenhum paciente selecionado</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-theme-background text-gray-300 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center pb-4 mb-8 border-b border-gray-800">
          <UserCircle size={48} className="text-teal-400 mr-4"/>
          <div className="flex-1">
            {/* Nome do Paciente - Editável */}
            <div className="flex items-center gap-2 mb-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, handleSaveName, handleCancelNameEdit)}
                    className="text-2xl font-bold bg-theme-card text-gray-100 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-teal-500"
                    placeholder="Nome do paciente"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 text-green-400 hover:text-green-300 transition-colors"
                    title="Salvar nome"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={handleCancelNameEdit}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    title="Cancelar edição"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-100">
                    {typeof safeCurrentPatient?.name === 'string' ? safeCurrentPatient.name : 'Sem Nome'}
                  </h1>
                  <button
                    onClick={handleEditName}
                    className="p-1 text-gray-400 hover:text-teal-400 transition-colors"
                    title="Editar nome"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
            </div>
            
            {/* Idade/Data de Nascimento - Editável */}
            <div className="flex items-center gap-4 mb-2">
              {isEditingBirthDate ? (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={editedBirthDate}
                    onChange={(e) => setEditedBirthDate(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, handleSaveBirthDate, handleCancelBirthDateEdit)}
                    className="text-lg bg-theme-card text-gray-100 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-teal-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveBirthDate}
                    className="p-1 text-green-400 hover:text-green-300 transition-colors"
                    title="Salvar data de nascimento"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={handleCancelBirthDateEdit}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    title="Cancelar edição"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">
                    {typeof patientAge === 'number' ? `${patientAge} anos` : '0 anos'}
                  </h2>
                  <button
                    onClick={handleEditBirthDate}
                    className="p-1 text-gray-400 hover:text-teal-400 transition-colors"
                    title="Editar data de nascimento"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
            </div>
            
            {/* Informações do Paciente */}
            <p className="text-gray-500">
              ID: {typeof safeCurrentPatient?.id === 'string' || typeof safeCurrentPatient?.id === 'number' ? safeCurrentPatient.id : 'N/A'} | 
              Prontuário: {typeof safeCurrentPatient?.recordNumber === 'string' || typeof safeCurrentPatient?.recordNumber === 'number' ? safeCurrentPatient.recordNumber : 'N/A'}
              {safeCurrentPatient?.birthDate && (
                <span> | Nascimento: {new Date(safeCurrentPatient.birthDate).toLocaleDateString('pt-BR')}</span>
              )}
            </p>
          </div>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
    
               <div className="p-4 rounded-lg border border-gray-700/30 flex flex-col gap-4 bg-theme-background">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 p-1 bg-theme-card rounded-lg">
                  <button
                    onClick={() => setActiveTab('historico')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 border min-w-[140px] h-[44px] justify-center ${
                      activeTab === 'historico'
                        ? 'bg-teal-600/20 text-teal-400 border-teal-600/30 hover:border-teal-500'
                        : 'text-gray-400 hover:bg-gray-700/20 hover:text-gray-200 border-transparent'
                    }`}
                  >
                    <History size={16}/>
                    Linha do Tempo
                  </button>
                  <button
                    onClick={() => setActiveTab('investigacao')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 border min-w-[140px] h-[44px] justify-center ${
                      activeTab === 'investigacao'
                        ? 'bg-teal-600/20 text-teal-400 border-teal-600/30 hover:border-teal-500'
                        : 'text-gray-400 hover:bg-gray-700/20 hover:text-gray-200 border-transparent'
                    }`}
                  >
                    <Beaker size={16}/>
                    Investigação
                  </button>
                  <button
                    onClick={() => setActiveTab('planos')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 border min-w-[140px] h-[44px] justify-center ${
                      activeTab === 'planos'
                        ? 'bg-teal-600/20 text-teal-400 border-teal-600/30 hover:border-teal-500'
                        : 'text-gray-400 hover:bg-gray-700/20 hover:text-gray-200 border-transparent'
                    }`}
                  >
                    <NotebookPen size={16}/>
                    Planos e Condutas
                  </button>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-md">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                  <input 
                    type="text"
                    placeholder="Buscar na linha do tempo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input text-center"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-0 min-h-[400px]">
              {filteredData.map((item) => <TimelineItem key={item.id} item={item} />)}
              {filteredData.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <p>Nenhum item encontrado.</p>
                  <p className="text-sm">Tente ajustar sua busca ou o filtro de abas.</p>
                </div>
              )}
            </div>
          </div>

          <aside className="lg:col-span-1 space-y-8">
            <button 
              onClick={safeOnNewRecord}
              className="btn btn-primary w-full font-bold py-3 flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:shadow-teal-500/30 transform hover:-translate-y-px"
            >
              <PlusCircle size={18} /> Iniciar Novo Registro
            </button>
            
            <InfoCard title="Sinais Vitais Recentes">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="text-center animate-pulse">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div className="w-4 h-4 bg-gray-700 rounded"></div>
                        <div className="w-6 h-3 bg-gray-700 rounded"></div>
                      </div>
                      <div className="h-5 bg-gray-700 rounded w-12 mx-auto mb-1"></div>
                      <div className="h-3 bg-theme-card rounded w-16 mx-auto"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <HeartPulse size={16} className="text-red-400"/>
                      <span className="text-xs text-gray-400">PA</span>
                    </div>
                    <p className={`font-semibold ${statusColors[realData.sinaisVitais.pressao.status]}`}>
                      {realData.sinaisVitais.pressao.valor}
                    </p>
                    <p className="text-xs text-gray-500">{realData.sinaisVitais.pressao.timestamp}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Target size={16} className="text-teal-400"/>
                      <span className="text-xs text-gray-400">Temp</span>
                    </div>
                    <p className={`font-semibold ${statusColors[realData.sinaisVitais.temperatura.status]}`}>
                      {realData.sinaisVitais.temperatura.valor}
                    </p>
                    <p className="text-xs text-gray-500">{realData.sinaisVitais.temperatura.timestamp}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <TestTube size={16} className="text-green-400"/>
                      <span className="text-xs text-gray-400">SpO2</span>
                    </div>
                    <p className={`font-semibold ${statusColors[realData.sinaisVitais.saturacao.status]}`}>
                      {realData.sinaisVitais.saturacao.valor}
                    </p>
                    <p className="text-xs text-gray-500">{realData.sinaisVitais.saturacao.timestamp}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Clock size={16} className="text-teal-400"/>
                      <span className="text-xs text-gray-400">FC</span>
                    </div>
                    <p className={`font-semibold ${statusColors[realData.sinaisVitais.frequencia.status]}`}>
                      {realData.sinaisVitais.frequencia.valor}
                    </p>
                    <p className="text-xs text-gray-500">{realData.sinaisVitais.frequencia.timestamp}</p>
                  </div>
                </div>
              )}
            </InfoCard>
            
            <InfoCard title="Plano Terapêutico Ativo">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-theme-card rounded w-1/2 mb-1"></div>
                        <div className="h-3 bg-theme-card rounded w-2/3"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-theme-card rounded w-1/2 mb-1"></div>
                        <div className="h-3 bg-theme-card rounded w-3/4"></div>
                  </div>
                </div>
              ) : realData.planos.length > 0 ? (
                <div className="space-y-4">
                  {realData.planos.slice(0, 3).map((plano, index) => (
                    <div key={index} className="mb-4">
                      <h4 className="font-semibold text-white">{plano.titulo || plano.tipo || 'Plano Terapêutico'}</h4>
                      <div className="text-sm mt-2 text-gray-300">
                        {plano.descricao || plano.resumo || 'Sem descrição disponível'}
                      </div>
                      {plano.data && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(plano.data).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target size={24} className="mx-auto mb-2 opacity-50"/>
                  <p>Nenhum plano terapêutico ativo encontrado</p>
                  <p className="text-sm mt-1">Os planos serão exibidos conforme os registros médicos</p>
                </div>
              )}
            </InfoCard>

            <InfoCard title="Resumo Clínico">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="space-y-1">
                      <div className="h-3 bg-theme-card rounded w-3/4"></div>
                      <div className="h-3 bg-theme-card rounded w-2/3"></div>
                      <div className="h-3 bg-theme-card rounded w-4/5"></div>
                    </div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="space-y-1">
                      <div className="h-3 bg-theme-card rounded w-2/3"></div>
                      <div className="h-3 bg-theme-card rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
                    <div className="space-y-1">
                      <div className="h-3 bg-theme-card rounded w-3/4"></div>
                      <div className="h-3 bg-theme-card rounded w-4/5"></div>
                      <div className="h-3 bg-theme-card rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-2"><HeartPulse size={16} /> Problemas Ativos</p>
                    {realData.problemasAtivos.length > 0 ? (
                      <ul className="space-y-1 text-sm list-disc list-inside text-gray-300">
                        {realData.problemasAtivos.slice(0, 5).map((problema, index) => (
                          <li key={index}>
                            {problema.descricao || problema.problema || problema.texto || problema}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">Nenhum problema ativo registrado</p>
                    )}
                  </div>
                  <div className="pt-4 border-t border-gray-800">
                    <p className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-2"><AlertTriangle size={16} /> Alergias</p>
                    {realData.alergias.length > 0 ? (
                      <ul className="space-y-1 text-sm list-disc list-inside text-gray-300">
                        {realData.alergias.slice(0, 5).map((alergia, index) => (
                          <li key={index}>
                            {alergia.descricao || alergia.alergia || alergia.substancia || alergia}
                            {alergia.reacao && ` (${alergia.reacao})`}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">Nenhuma alergia registrada</p>
                    )}
                  </div>
                  <div className="pt-4 border-t border-gray-800">
                    <p className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-2"><Pill size={16} /> Medicamentos</p>
                    {realData.medicamentosEmUso.length > 0 ? (
                      <ul className="space-y-1 text-sm list-disc list-inside text-gray-300">
                        {realData.medicamentosEmUso.slice(0, 8).map((medicamento, index) => (
                          <li key={index}>
                            {medicamento.nome || medicamento.medicamento || medicamento}
                            {medicamento.dose && ` ${medicamento.dose}`}
                            {medicamento.frequencia && ` - ${medicamento.frequencia}`}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">Nenhum medicamento em uso registrado</p>
                    )}
                  </div>
                </div>
              )}
            </InfoCard>
          </aside>
        </main>
      </div>
    </div>
  );
};

/**
 * HistoryList Component - Lista de registros históricos
 * 
 * Connector: Renders historical records from dashboard API
 */
const HistoryList = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum registro histórico encontrado</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {data.map((record) => (
        <RecordCard key={record.id} record={record} type="historico" />
      ))}
    </div>
  );
};

/**
 * InvestigationList Component - Lista de investigações
 * 
 * Connector: Renders investigation records from dashboard API
 */
const InvestigationList = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhuma investigação encontrada</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {data.map((record) => (
        <RecordCard key={record.id} record={record} type="investigacao" />
      ))}
    </div>
  );
};

/**
 * PlansList Component - Lista de planos e condutas
 * 
 * Connector: Renders treatment plans from dashboard API
 */
const PlansList = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum plano ou conduta encontrado</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {data.map((record) => (
        <RecordCard key={record.id} record={record} type="planos" />
      ))}
    </div>
  );
};

/**
 * RecordCard Component - Card individual para cada registro
 * 
 * Connector: Reusable component for displaying record data
 */
const RecordCard = ({ record, type }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'historico': return 'bg-theme-card border-teal-500/30';
        case 'investigacao': return 'bg-theme-card border-teal-500/30';
        case 'planos': return 'bg-theme-card border-teal-500/30';
        default: return 'bg-theme-card border-gray-800';
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Data não informada';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Card className={getTypeColor(type)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {record.title || `Registro ${type}`}
          </CardTitle>
          <span className="text-sm text-gray-500">
            {formatDate(record.created_at || record.createdAt)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {record.content && (
            <div className="text-gray-700 whitespace-pre-wrap">
              {record.content.length > 300 
                ? `${record.content.substring(0, 300)}...` 
                : record.content
              }
            </div>
          )}
          
          {record.tags && record.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {record.tags.map((tag) => (
                <Badge key={tag.id || tag.name} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientDashboard;

// Connector: Integrates with PatientView/index.jsx as main dashboard component
// Hook: Uses fetchPatientDashboard from patientStore.js for API calls