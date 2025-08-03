import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePatientStore } from '../../store/patientStore';
import { useDebounce } from '../../hooks/useDebounce';
import { useMultipleAbortControllers } from '../../hooks/useAbortController';
import { useToast } from '../ui/Toast';
import { PlusCircle, UserCircle, FileText, AlertTriangle, Pill, HeartPulse, Microscope, Clock, Target, TestTube, ArrowRight, Search, Beaker, NotebookPen, History } from 'lucide-react';

// Tipos de dados para o dashboard
const statusColors = {
  success: 'text-green-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
};

// Componente para cards de informação
const InfoCard = ({ title, children }) => (
  <div className="bg-[#1C1C1F] p-5 rounded-lg border border-gray-800">
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
      <div className="absolute left-[-5px] top-4 w-4 h-4 bg-gray-700 rounded-full border-4 border-[#111113] group-hover:bg-blue-500 transition-colors"></div>
      <div className="bg-[#1C1C1F] p-4 rounded-lg border border-gray-800 transition-all hover:border-blue-500/50 hover:bg-gray-800/20 cursor-pointer">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-sm text-gray-400">{safeText(item.data)} às {safeText(item.hora)} • {safeText(item.contexto)}</p>
            <h3 className="font-semibold text-white mt-1">{safeText(item.descricao)}</h3>
            <p className="text-xs text-gray-500 mt-1">Registrado por: {safeText(item.medico)}</p>
          </div>
          <div className="text-blue-400 flex-shrink-0 mt-1" title={safeText(item.tipo)}>
            {iconMap[safeText(item.tipo)] || <FileText size={18}/>}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * PatientDashboard Component - Dashboard sofisticado do paciente
 * Baseado no mock MockColunaMeioDashPaciente.md
 */
const PatientDashboard = ({ patientId, onNewRecord }) => {
  // Validate props to prevent rendering objects as text
  const safePatientId = typeof patientId === 'string' ? patientId : '';
  const safeOnNewRecord = typeof onNewRecord === 'function' ? onNewRecord : () => {};
  
  const { 
    currentPatient, 
    dashboardData,
    fetchPatientDashboard, 
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
  
  const isMountedRef = useRef(false);
  
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
    timeline: dashboardData?.historico || [],
    investigacao: dashboardData?.investigacao || [],
    planos: dashboardData?.planos || []
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
      <div className="flex items-center justify-center h-64 bg-[#111113] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-400">Carregando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-[#111113] text-white">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white">Erro ao carregar dashboard</h3>
          <p className="text-gray-400 mt-1">{error}</p>
          <button 
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
      <div className="min-h-screen bg-[#111113] text-gray-300 font-sans p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#1C1C1F] p-6 rounded-lg border border-gray-800">
            <p className="text-gray-500">Nenhum paciente selecionado</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#111113] text-gray-300 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center pb-4 mb-8 border-b border-gray-800">
          <UserCircle size={48} className="text-blue-400 mr-4"/>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              {typeof safeCurrentPatient?.name === 'string' ? safeCurrentPatient.name : 'Paciente'}, {typeof patientAge === 'number' ? patientAge : 0} anos
            </h1>
            <p className="text-gray-500">
              ID: {typeof safeCurrentPatient?.id === 'string' || typeof safeCurrentPatient?.id === 'number' ? safeCurrentPatient.id : 'N/A'} | 
              Prontuário: {typeof safeCurrentPatient?.recordNumber === 'string' || typeof safeCurrentPatient?.recordNumber === 'number' ? safeCurrentPatient.recordNumber : 'N/A'}
            </p>
          </div>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1C1C1F] p-2 rounded-lg border border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex items-center gap-2 p-1 bg-gray-900/50 rounded-lg">
                <button
                  onClick={() => setActiveTab('historico')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    activeTab === 'historico'
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                  }`}
                >
                  <History size={16}/>
                  Linha do Tempo
                </button>
                <button
                  onClick={() => setActiveTab('investigacao')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    activeTab === 'investigacao'
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                  }`}
                >
                  <Beaker size={16}/>
                  Investigação
                </button>
                <button
                  onClick={() => setActiveTab('planos')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    activeTab === 'planos'
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                  }`}
                >
                  <NotebookPen size={16}/>
                  Planos e Condutas
                </button>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                <input 
                  type="text"
                  placeholder="Buscar na linha do tempo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-md pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md hover:shadow-blue-500/30 transform hover:-translate-y-px"
            >
              <PlusCircle size={18} /> Iniciar Novo Registro
            </button>
            
            <InfoCard title="Sinais Vitais Recentes">
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
                    <Target size={16} className="text-blue-400"/>
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
                    <Clock size={16} className="text-purple-400"/>
                    <span className="text-xs text-gray-400">FC</span>
                  </div>
                  <p className={`font-semibold ${statusColors[realData.sinaisVitais.frequencia.status]}`}>
                    {realData.sinaisVitais.frequencia.valor}
                  </p>
                  <p className="text-xs text-gray-500">{realData.sinaisVitais.frequencia.timestamp}</p>
                </div>
              </div>
            </InfoCard>
            
            <InfoCard title="Plano Terapêutico Ativo">
              <div className="mb-4">
                <h4 className="font-semibold text-white">Controle de HAS</h4>
                <div className="text-sm mt-2 flex items-center gap-2">
                  <Target size={16} className="text-blue-400"/>
                  <span className="text-gray-400">Meta:</span>
                  <span>PA &lt; 130/80 mmHg</span>
                </div>
                <div className={`text-sm mt-1 flex items-center gap-2 ${statusColors.warning}`}>
                  <ArrowRight size={16}/>
                  <span className="text-gray-400">Status:</span>
                  <span>PA atual: 140/90 mmHg</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white">Controle de Dislipidemia</h4>
                <div className="text-sm mt-2 flex items-center gap-2">
                  <Target size={16} className="text-blue-400"/>
                  <span className="text-gray-400">Meta:</span>
                  <span>LDL &lt; 100 mg/dL</span>
                </div>
                <div className={`text-sm mt-1 flex items-center gap-2 ${statusColors.success}`}>
                  <ArrowRight size={16}/>
                  <span className="text-gray-400">Status:</span>
                  <span>LDL atual: 95 mg/dL</span>
                </div>
              </div>
            </InfoCard>

            <InfoCard title="Resumo Clínico">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-2"><HeartPulse size={16} /> Problemas Ativos</p>
                  <ul className="space-y-1 text-sm list-disc list-inside text-gray-300">
                    <li>Hipertensão Arterial Sistêmica (HAS)</li>
                    <li>Dislipidemia</li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-2"><AlertTriangle size={16} /> Alergias</p>
                  <ul className="space-y-1 text-sm list-disc list-inside text-gray-300">
                    <li>Penicilina</li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-2"><Pill size={16} /> Medicamentos</p>
                  <ul className="space-y-1 text-sm list-disc list-inside text-gray-300">
                    <li>Losartana 50mg</li>
                    <li>Sinvastatina 20mg</li>
                  </ul>
                </div>
              </div>
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
      case 'historico': return 'bg-blue-50 border-blue-200';
      case 'investigacao': return 'bg-green-50 border-green-200';
      case 'planos': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
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