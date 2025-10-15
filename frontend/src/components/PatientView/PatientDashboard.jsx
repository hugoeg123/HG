import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientStore } from '../../store/patientStore';
import { useDebounce } from '../../hooks/useDebounce';
import { useMultipleAbortControllers } from '../../hooks/useAbortController';
import { useToast } from '../ui/Toast';
// Card components removed - using simple divs for better styling control
import { parseSections } from '../../shared/parser.js';
import { normalizeTags, getTagLabel, formatTagForDisplay } from '../../utils/tagUtils';
import { 
  PlusCircle, 
  UserCircle, 
  FileText, 
  AlertTriangle, 
  Pill, 
  HeartPulse, 
  Microscope, 
  Clock, 
  Target, 
  TestTube, 
  ArrowRight, 
  Search, 
  Beaker, 
  NotebookPen, 
  History, 
  Edit2, 
  Save, 
  X 
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

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
  const navigate = useNavigate();
  const iconMap = {
    'Consulta': <FileText size={18}/>,
    'Pedido de Exame': <Beaker size={18}/>,
    'Resultado de Exame': <Microscope size={18}/>,
    'Prescrição': <Pill size={18}/>,
    'Orientação': <NotebookPen size={18}/>,
    'Registro Médico': <FileText size={18}/>
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

  // 🔁 Padrão: Navegação correta usando useNavigate
  const handleItemClick = () => {
    if (item.recordId) {
      // Get patientId from the current URL or context
      const currentPath = window.location.pathname;
      // Allow UUIDs and other IDs with hyphens: capture until next slash
      const patientIdMatch = currentPath.match(/\/patients\/([^/]+)/);
      const patientId = patientIdMatch ? patientIdMatch[1] : item.patientId;
      
      if (patientId) {
        navigate(`/patients/${patientId}/records/${item.recordId}`);
      } else {
        console.warn('PatientId not found for navigation');
      }
    } else if (item.recordLink) {
      // Remove leading slash if present to avoid double slash
      const cleanLink = item.recordLink.startsWith('/') ? item.recordLink.slice(1) : item.recordLink;
      navigate(`/${cleanLink}`);
    }
  };

  const isClickable = item.recordLink || item.recordId;

  // Get tag colors based on category
  const getTagColor = (tagCode) => {
    const code = tagCode?.toUpperCase() || '';
    if (code.includes('DIAGNOSTICO') || code.includes('DX')) {
      return 'bg-red-600/20 text-red-300 border-red-500/30';
    } else if (code.includes('MEDICAMENTO') || code.includes('PRESCRICAO')) {
      return 'bg-blue-600/20 text-blue-300 border-blue-500/30';
    } else if (code.includes('EXAME') || code.includes('LABORATORIO')) {
      return 'bg-purple-600/20 text-purple-300 border-purple-500/30';
    } else if (code.includes('PLANO') || code.includes('CONDUTA')) {
      return 'bg-green-600/20 text-green-300 border-green-500/30';
    }
    return 'bg-teal-600/20 text-teal-300 border-teal-500/30';
  };

  return (
    <div className="relative pl-8 py-2 group">
      <div className="absolute left-0 top-4 w-px h-full theme-border"></div>
      <div className="absolute left-[-5px] top-4 w-4 h-4 theme-border rounded-full border-4 border-theme-background group-hover:bg-teal-500 transition-colors"></div>
      <div 
        className={`theme-card p-3 sm:p-4 rounded-lg border theme-border transition-all hover:border-teal-500/50 hover:bg-theme-surface ${
          isClickable ? 'cursor-pointer' : ''
        }`}
        onClick={isClickable ? handleItemClick : undefined}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleItemClick(); } : undefined}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
          <div className="flex-1">
            <p className="text-xs sm:text-sm theme-text-secondary">{safeText(item.data)} às {safeText(item.hora)} • {safeText(item.contexto)}</p>
            <div className="flex items-start gap-2 mt-1">
              <h3 className="font-semibold text-sm sm:text-base theme-text-primary flex-1">
                {safeText(item.title || item.descricao)}
              </h3>
              {isClickable && (
                <ArrowRight size={14} className="text-teal-400 mt-1 flex-shrink-0" aria-hidden="true" />
              )}
            </div>
            {item.content && item.content !== item.descricao && (
              <p className="text-xs theme-text-secondary mt-2 line-clamp-2">
                {item.content.substring(0, 200)}{item.content.length > 200 ? '...' : ''}
              </p>
            )}
            <p className="text-xs theme-text-muted mt-1">
            Registrado por: {safeText(item.doctorName) || 'Médico não identificado'}
            {item.doctorCRM && ` (CRM: ${item.doctorCRM})`}
          </p>
            
            {/* Display all tags as spans */}
            {item.allTags && item.allTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.allTags
                  .filter((tag) => {
                    const label = (tag?.name || tag?.code || '').toString().trim();
                    return Boolean(label);
                  })
                  .map((tag, index) => {
                    const tagDisplay = formatTagForDisplay(tag, 'default');
                    const tagCode = (tagDisplay?.code || '').toString().trim();
                    const tagLabel = getTagLabel(tag);
                    if (!tagCode) return null;
                    return (
                      <span 
                        key={`${item.recordId || item.id || 'item'}-tag-${index}`}
                        className={`inline-flex items-center px-2.5 py-0.5 text-[11px] sm:text-xs leading-4 font-semibold uppercase tracking-wide rounded whitespace-nowrap ${
                          ['HDA','QP'].includes(tagCode)
                            ? 'bg-teal-600/25 text-teal-200 border border-teal-400/50'
                            : 'bg-teal-600/20 text-teal-300 border border-teal-500/40'
                        }`}
                        title={tagLabel}
                      >
                        {tagCode}
                      </span>
                    );
                  })}
              </div>
            )}
            
            {/* Fallback for single tag (backward compatibility) */}
            {!item.allTags && item.tag && (
              (() => {
                const label = (item.tag?.name || item.tag?.code || '').toString().trim();
                if (!label) return null;
                return (
                  <span className={`inline-block mt-2 px-2 py-1 text-[11px] sm:text-xs font-medium uppercase rounded border whitespace-nowrap ${getTagColor(item.tag?.code)}`}>
                    {label}
                  </span>
                );
              })()
            )}
          </div>
          <div className="text-teal-400 flex-shrink-0 mt-1 self-start sm:self-auto" title={safeText(item.tipo)}>
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
  // Accept both string and number, normalize to string for routing
  const safePatientId = (typeof patientId === 'string' || typeof patientId === 'number') ? String(patientId) : '';
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
  
  // Parse records by category - 1 card per complete record
  const parsedRecordsByCategory = useMemo(() => {
    if (!safeCurrentPatient?.records || !Array.isArray(safeCurrentPatient.records)) {
      return {
        timeline: [],
        investigacao: [],
        planos: []
      };
    }

    const categorizedData = {
      timeline: [],
      investigacao: [],
      planos: []
    };

    // Process each record as a complete unit
    safeCurrentPatient.records.forEach(record => {
      if (!record.content) return;

      try {
        // Extract all tags from the record content
        const allTags = [];
        const sections = parseSections(record.content);
        
        // Collect all tags from all sections
        sections.forEach(section => {
          if (section.tag) {
            allTags.push(section.tag);
          }
        });

        // Determine primary category based on tags
        let primaryCategory = 'timeline';
        const tagCodes = allTags.map(tag => tag.code?.toUpperCase() || '').join(' ');
        
        if (tagCodes.includes('INVESTIGACAO') || tagCodes.includes('EXAME') || 
            tagCodes.includes('LABORATORIO') || tagCodes.includes('IMAGEM') ||
            tagCodes.includes('DIAGNOSTICO') || tagCodes.includes('DX')) {
          primaryCategory = 'investigacao';
        } else if (tagCodes.includes('PLANO') || tagCodes.includes('CONDUTA') || 
                   tagCodes.includes('TRATAMENTO') || tagCodes.includes('MEDICAMENTO') ||
                   tagCodes.includes('PRESCRICAO')) {
          primaryCategory = 'planos';
        }
        
        const recordData = {
          id: record.id,
          recordId: record.id,
          title: `Registro Médico - ${new Date(record.createdAt || record.date).toLocaleDateString('pt-BR')}`,
          content: record.content,
          allTags: allTags,
          tags: allTags,
          createdAt: record.createdAt || record.date || null,
          data: record.createdAt ? new Date(record.createdAt).toLocaleDateString('pt-BR') : (record.date ? new Date(record.date).toLocaleDateString('pt-BR') : 'Data não disponível'),
          hora: record.createdAt ? new Date(record.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : (record.date ? new Date(record.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'),
          contexto: record.context || 'Registro Médico',
          doctorName: record.doctorName || null,
          doctorCRM: record.doctorCRM || null,
          medico: record.doctorName 
            ? `${record.doctorName}${record.doctorCRM ? ` (CRM: ${record.doctorCRM})` : ''}`
            : 'Médico',
          tipo: 'Registro Médico',
          descricao: record.content.substring(0, 150) + (record.content.length > 150 ? '...' : ''),
          recordLink: `/records/${record.id}`
        };

        categorizedData[primaryCategory].push(recordData);
        
      } catch (error) {
        console.warn('Error parsing record:', error);
        // Fallback: add entire record to timeline
        categorizedData.timeline.push({
          id: record.id,
          recordId: record.id,
          title: 'Registro Médico',
          content: record.content,
          allTags: [],
          data: record.createdAt ? new Date(record.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível',
          hora: record.createdAt ? new Date(record.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
          contexto: record.context || 'Registro Médico',
          medico: record.doctorName 
            ? `${record.doctorName}${record.doctorCRM ? ` (CRM: ${record.doctorCRM})` : ''}`
            : 'Médico não identificado',
          tipo: 'Registro Médico',
          descricao: record.content.substring(0, 150) + (record.content.length > 150 ? '...' : ''),
          recordLink: `/records/${record.id}`
        });
      }
    });

    // Sort by date (newest first)
    Object.keys(categorizedData).forEach(category => {
      categorizedData[category].sort((a, b) => {
        const dateA = safeCurrentPatient.records.find(r => r.id === a.recordId)?.createdAt;
        const dateB = safeCurrentPatient.records.find(r => r.id === b.recordId)?.createdAt;
        return new Date(dateB) - new Date(dateA);
      });
    });

    return categorizedData;
  }, [safeCurrentPatient?.records]);

  // Usar dados reais do store ou fallback para dados vazios
  const realData = {
    sinaisVitais: dashboardData?.sinaisVitais || {
      pressao: { valor: '--', status: 'warning', timestamp: '--' },
      temperatura: { valor: '--', status: 'warning', timestamp: '--' },
      saturacao: { valor: '--', status: 'warning', timestamp: '--' },
      frequencia: { valor: '--', status: 'warning', timestamp: '--' }
    },
    timeline: [...(dashboardData?.historicoConsultas || []), ...parsedRecordsByCategory.timeline],
    investigacao: [...(dashboardData?.investigacoesEmAndamento || []), ...parsedRecordsByCategory.investigacao],
    planos: [...(dashboardData?.planos || []), ...parsedRecordsByCategory.planos],
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
      <div className="min-h-screen bg-theme-background text-gray-300 font-sans p-2 sm:p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-theme-surface p-6 rounded-lg border border-gray-800">
            <p className="text-gray-500">Nenhum paciente selecionado</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-theme-background text-gray-300 font-sans p-2 sm:p-4 lg:p-6 xl:p-8">
      <div className="max-w-7xl mx-auto w-full">
        <header className="flex flex-col sm:flex-row items-start sm:items-center pb-3 sm:pb-4 mb-4 sm:mb-6 lg:mb-8 border-b border-gray-800 gap-3 sm:gap-4">
          <UserCircle size={40} className="text-teal-400 sm:mr-4 sm:w-12 sm:h-12"/>
          <div className="flex-1 w-full sm:w-auto">
            {/* Nome do Paciente - Editável */}
            <div className="flex items-center gap-2 mb-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, handleSaveName, handleCancelNameEdit)}
                    className="text-lg sm:text-xl lg:text-2xl font-bold bg-theme-card text-gray-100 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-teal-500 w-full sm:w-auto"
                    placeholder="Nome do paciente"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 sm:p-2 text-green-400 hover:text-green-300 transition-colors"
                    title="Salvar nome"
                  >
                    <Save size={14} className="sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={handleCancelNameEdit}
                    className="p-1 sm:p-2 text-red-400 hover:text-red-300 transition-colors"
                    title="Cancelar edição"
                  >
                    <X size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-100">
                    {typeof safeCurrentPatient?.name === 'string' ? safeCurrentPatient.name : 'Sem Nome'}
                  </h1>
                  <button
                    onClick={handleEditName}
                    className="p-1 sm:p-2 text-gray-400 hover:text-teal-400 transition-colors"
                    title="Editar nome"
                  >
                    <Edit2 size={14} className="sm:w-4 sm:h-4" />
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500">
              <span>ID: {typeof safeCurrentPatient?.id === 'string' || typeof safeCurrentPatient?.id === 'number' ? safeCurrentPatient.id : 'N/A'}</span>
              <span className="hidden sm:inline">|</span>
              <span>Prontuário: {typeof safeCurrentPatient?.recordNumber === 'string' || typeof safeCurrentPatient?.recordNumber === 'number' ? safeCurrentPatient.recordNumber : 'N/A'}</span>
              {safeCurrentPatient?.birthDate && (
                <>
                  <span className="hidden sm:inline">|</span>
                  <span>Nascimento: {new Date(safeCurrentPatient.birthDate).toLocaleDateString('pt-BR')}</span>
                </>
              )}
            </div>
          </div>
        </header>
        
        {/* Layout Flexbox Fluido - Adapta-se às barras laterais */}
        <main className="flex flex-col xl:flex-row gap-4 sm:gap-6 xl:gap-8">
          
          {/* Painel Principal - Flexbox com flex-grow para ocupar espaço disponível */}
          <div className="flex-1 space-y-4 sm:space-y-6 order-1 xl:order-1 min-w-0 overflow-hidden">
    
               <div className="patient-dashboard-panel p-3 sm:p-4 rounded-lg border border-gray-700/30 flex flex-col gap-3 sm:gap-4 bg-theme-background overflow-hidden">
              {/* Navegação de Abas Responsiva */}
              <div className="flex items-center justify-center overflow-x-auto">
                <div className="flex flex-row items-stretch gap-1 sm:gap-2 p-0 bg-theme-card rounded-lg min-w-max">
                  <button
                    onClick={() => setActiveTab('historico')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 border min-w-[80px] sm:min-w-[100px] md:min-w-[120px] h-[32px] sm:h-[36px] md:h-[40px] justify-center whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-theme-background ${
                      activeTab === 'historico'
                        ? 'border-teal-600 border-2 bg-teal-600/20 text-teal-300'
                        : 'bg-theme-card text-gray-300 hover:bg-theme-surface hover:text-white border-transparent'
                    }`}
                  >
                    <History size={14} className="sm:w-4 sm:h-4 flex-shrink-0"/>
                    <span className="hidden sm:inline">Timeline</span>
                    <span className="sm:hidden">Hist</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('investigacao')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 border min-w-[80px] sm:min-w-[100px] md:min-w-[120px] h-[32px] sm:h-[36px] md:h-[40px] justify-center whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-theme-background ${
                      activeTab === 'investigacao'
                        ? 'border-teal-600 border-2 bg-teal-600/20 text-teal-300'
                        : 'bg-theme-card text-gray-300 hover:bg-theme-surface hover:text-white border-transparent'
                    }`}
                  >
                    <Beaker size={14} className="sm:w-4 sm:h-4 flex-shrink-0"/>
                    <span className="hidden sm:inline">Exames</span>
                    <span className="sm:hidden">Inv</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('planos')}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 border min-w-[80px] sm:min-w-[100px] md:min-w-[120px] h-[32px] sm:h-[36px] md:h-[40px] justify-center whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-theme-background ${
                      activeTab === 'planos'
                        ? 'border-teal-600 border-2 bg-teal-600/20 text-teal-300'
                        : 'bg-theme-card text-gray-300 hover:bg-theme-surface hover:text-white border-transparent'
                    }`}
                  >
                    <NotebookPen size={14} className="sm:w-4 sm:h-4 flex-shrink-0"/>
                    <span className="hidden sm:inline">Planos</span>
                    <span className="sm:hidden">Pln</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 px-2 sm:px-0">
                <div className="relative flex-1 min-w-0">
                  <Search size={16} className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-500 sm:w-[18px] sm:h-[18px] flex-shrink-0"/>
                  <input 
                    type="text"
                    placeholder="Buscar na linha do tempo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-theme-card border border-gray-600 rounded-lg px-3 sm:px-4 py-2 pl-9 sm:pl-10 text-sm sm:text-base text-gray-100 placeholder-gray-400 focus:outline-none focus:border-teal-500 min-w-0"
                  />
                </div>
                <button className="px-3 sm:px-4 py-2 bg-theme-card text-gray-300 rounded-lg hover:bg-theme-surface hover:text-white transition-colors flex items-center gap-2 text-sm sm:text-base justify-center border border-transparent hover:border-teal-500/30 whitespace-nowrap flex-shrink-0">
                  <Search size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Filtros</span>
                  <span className="sm:hidden">Filtrar</span>
                </button>
              </div>
            </div>

            <div className="space-y-0 min-h-[300px] sm:min-h-[400px] overflow-hidden">
              {activeTab === 'historico' && (
                filteredData.length === 0 ? (
                  <div className="text-center py-8 sm:py-16 text-gray-500 px-4">
                    <p className="text-sm sm:text-base">Nenhum item encontrado.</p>
                    <p className="text-xs sm:text-sm mt-1">Tente ajustar sua busca ou o filtro de abas.</p>
                  </div>
                ) : (
                  <HistoryList data={filteredData} patientId={safePatientId} />
                )
              )}
              {activeTab === 'investigacao' && (
                filteredData.length === 0 ? (
                  <div className="text-center py-8 sm:py-16 text-gray-500 px-4">
                    <p className="text-sm sm:text-base">Nenhum item encontrado.</p>
                    <p className="text-xs sm:text-sm mt-1">Tente ajustar sua busca ou o filtro de abas.</p>
                  </div>
                ) : (
                  <InvestigationList data={filteredData} patientId={safePatientId} />
                )
              )}
              {activeTab === 'planos' && (
                filteredData.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <p>Nenhum item encontrado.</p>
                    <p className="text-sm">Tente ajustar sua busca ou o filtro de abas.</p>
                  </div>
                ) : (
                  <PlansList data={filteredData} patientId={safePatientId} />
                )
              )}
            </div>
          </div>

          {/* Sidebar Direita - Largura fixa em telas grandes, flex-shrink-0 */}
          <aside className="lg:w-80 xl:w-96 flex-shrink-0 space-y-4 sm:space-y-6 xl:space-y-8 order-2 lg:order-2">
            <button 
              onClick={safeOnNewRecord}
              className="w-full font-bold py-2 sm:py-3 flex items-center justify-center gap-2 text-sm sm:text-base bg-teal-600/20 text-teal-300 hover:bg-teal-600/40 hover:text-teal-100 border border-teal-500/30 hover:border-teal-400/50 rounded-lg transition-all duration-200"
            >
              <PlusCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> 
              <span className="hidden md:inline">Iniciar Novo Registro</span>
              <span className="md:hidden">Novo Registro</span>
            </button>
            
            <div className="patient-dashboard-card bg-theme-card p-3 sm:p-4 rounded-lg border border-gray-800 transition-all hover:border-teal-500/50 hover:bg-theme-card/80 cursor-pointer">
              <h3 className="font-semibold text-base sm:text-lg theme-text-primary mb-3 sm:mb-4">Sinais Vitais Recentes</h3>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="text-center animate-pulse">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div className="w-4 h-4 theme-bg-secondary rounded"></div>
                        <div className="w-6 h-3 theme-bg-secondary rounded"></div>
                      </div>
                      <div className="h-5 theme-bg-secondary rounded w-12 mx-auto mb-1"></div>
                      <div className="h-3 theme-bg-card rounded w-16 mx-auto"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <HeartPulse size={16} className="text-red-400"/>
                      <span className="text-xs theme-text-secondary">PA</span>
                    </div>
                    <p className={`font-semibold ${statusColors[realData.sinaisVitais.pressao.status]}`}>
                      {realData.sinaisVitais.pressao.valor}
                    </p>
                    <p className="text-xs theme-text-muted">{realData.sinaisVitais.pressao.timestamp}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Target size={16} className="text-teal-400"/>
                      <span className="text-xs theme-text-secondary">Temp</span>
                    </div>
                    <p className={`font-semibold ${statusColors[realData.sinaisVitais.temperatura.status]}`}>
                      {realData.sinaisVitais.temperatura.valor}
                    </p>
                    <p className="text-xs theme-text-muted">{realData.sinaisVitais.temperatura.timestamp}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <TestTube size={16} className="text-green-400"/>
                      <span className="text-xs theme-text-secondary">SpO2</span>
                    </div>
                    <p className={`font-semibold ${statusColors[realData.sinaisVitais.saturacao.status]}`}>
                      {realData.sinaisVitais.saturacao.valor}
                    </p>
                    <p className="text-xs theme-text-muted">{realData.sinaisVitais.saturacao.timestamp}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Clock size={16} className="text-teal-400"/>
                      <span className="text-xs theme-text-secondary">FC</span>
                    </div>
                    <p className={`font-semibold ${statusColors[realData.sinaisVitais.frequencia.status]}`}>
                      {realData.sinaisVitais.frequencia.valor}
                    </p>
                    <p className="text-xs theme-text-muted">{realData.sinaisVitais.frequencia.timestamp}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="patient-dashboard-card bg-theme-card p-3 sm:p-5 rounded-lg border border-theme-border">
              <h3 className="font-semibold text-base sm:text-lg theme-text-primary mb-3 sm:mb-4">Plano Terapêutico Ativo</h3>
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
            </div>

            <div className="patient-dashboard-card bg-theme-card p-3 sm:p-5 rounded-lg border border-theme-border">
              <h3 className="font-semibold text-base sm:text-lg theme-text-primary mb-3 sm:mb-4">Resumo Clínico</h3>
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
            </div>
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
const HistoryList = ({ data, patientId }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  if (!data || data.length === 0) {
    return (
      <Card className="patient-dashboard-card">
        <CardContent className="p-6 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum registro histórico encontrado</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className={`absolute left-4 top-0 bottom-0 w-px ${isDarkMode ? 'bg-teal-800/50' : 'bg-blue-700/30'} pointer-events-none`} aria-hidden="true"></div>
      <ul className="space-y-4">
        {data.map((record) => (
          <li
            key={record.id}
            className="relative pl-8 cursor-pointer"
            onClick={() => navigate(`/patients/${patientId}/records/${record.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(`/patients/${patientId}/records/${record.id}`);
              }
            }}
          >
            {/* Timeline bullet */}
            <div className={`absolute left-[14px] top-5 h-2 w-2 rounded-full ${isDarkMode ? 'bg-teal-400 ring-2 ring-teal-900' : 'bg-blue-500 ring-2 ring-blue-900/30'} pointer-events-none`} aria-hidden="true"></div>
            <RecordCard record={record} type="historico" patientId={patientId} />
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * InvestigationList Component - Lista de investigações
 * 
 * Connector: Renders investigation records from dashboard API
 */
const InvestigationList = ({ data, patientId }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  if (!data || data.length === 0) {
    return (
      <Card className="patient-dashboard-card">
        <CardContent className="p-6 text-center text-gray-500">
          <Microscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhuma investigação encontrada</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="relative">
      <div className={`absolute left-4 top-0 bottom-0 w-px ${isDarkMode ? 'bg-teal-800/50' : 'bg-blue-700/30'} pointer-events-none`} aria-hidden="true"></div>
      <ul className="space-y-4">
        {data.map((record) => (
          <li
            key={record.id}
            className="relative pl-8 cursor-pointer"
            onClick={() => navigate(`/patients/${patientId}/records/${record.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(`/patients/${patientId}/records/${record.id}`);
              }
            }}
          >
            <div className={`absolute left-[14px] top-5 h-2 w-2 rounded-full ${isDarkMode ? 'bg-teal-400 ring-2 ring-teal-900' : 'bg-blue-500 ring-2 ring-blue-900/30'} pointer-events-none`} aria-hidden="true"></div>
            <RecordCard record={record} type="investigacao" patientId={patientId} />
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * PlansList Component - Lista de planos terapêuticos
 * 
 * Connector: Renders therapeutic plans from dashboard API
 */
const PlansList = ({ data, patientId }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  if (!data || data.length === 0) {
    return (
      <Card className="patient-dashboard-card">
        <CardContent className="p-6 text-center text-gray-500">
          <NotebookPen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum plano terapêutico encontrado</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="relative">
      <div className={`absolute left-4 top-0 bottom-0 w-px ${isDarkMode ? 'bg-teal-800/50' : 'bg-blue-700/30'} pointer-events-none`} aria-hidden="true"></div>
      <ul className="space-y-4">
        {data.map((record) => (
          <li
            key={record.id}
            className="relative pl-8 cursor-pointer"
            onClick={() => navigate(`/patients/${patientId}/records/${record.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(`/patients/${patientId}/records/${record.id}`);
              }
            }}
          >
            <div className={`absolute left-[14px] top-5 h-2 w-2 rounded-full ${isDarkMode ? 'bg-teal-400 ring-2 ring-teal-900' : 'bg-blue-500 ring-2 ring-blue-900/30'} pointer-events-none`} aria-hidden="true"></div>
            <RecordCard record={record} type="plano" patientId={patientId} />
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * RecordCard Component - Card individual para cada registro
 * 
 * Connector: Reusable component for displaying record data
 */
const RecordCard = ({ record, type, patientId }) => {
  const navigate = useNavigate();
  
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
  
  const handleCardClick = () => {
    if (!record?.id || !patientId) return;
    navigate(`/patients/${patientId}/records/${record.id}`);
  };
  
  // Prefer createdAt, fallback to date/data fields (from backend service)
  const createdAtValue = record?.created_at || record?.createdAt || record?.date || record?.data;
  // Tags source: prefer `tags`, fallback to `allTags`
  const tagsToRender = (Array.isArray(record?.tags) && record.tags.length > 0)
    ? record.tags
    : (Array.isArray(record?.allTags) ? record.allTags : []);
  
  return (
    <div 
      className="patient-dashboard-card bg-theme-card p-3 sm:p-4 rounded-lg border border-gray-800 transition-all hover:border-teal-500/50 hover:bg-theme-card/80 cursor-pointer"
      onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleCardClick();
        }
      }}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-gray-400">
            {formatDate(createdAtValue)} • Registro Médico
          </p>
          <div className="flex items-start gap-2 mt-1">
            <h3 className="font-semibold text-sm sm:text-base text-white flex-1">
              {record.title || `Registro Médico - ${formatDate(createdAtValue)}`}
            </h3>
            <ArrowRight size={14} className="text-teal-400 mt-1 flex-shrink-0" aria-hidden="true" />
          </div>
          
          {(record.doctorName || record.doctorCRM) && (
            <p className="text-xs text-gray-500 mt-1">
              {(() => {
                const name = (record.doctorName || '').toString().trim();
                const crm = (record.doctorCRM ?? '').toString().trim();
                if (name) return `Registrado por: ${crm ? `${name} (CRM ${crm})` : name}`;
                return `Registrado por: ${crm ? `CRM ${crm}` : 'Médico não identificado'}`;
              })()}
            </p>
          )}

          {tagsToRender && tagsToRender.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {normalizeTags(tagsToRender).map((tag, index) => {
                const tagCode = formatTagForDisplay(tag, 'default').code;
                const tagLabel = getTagLabel(tag);
                return (
                  <span
                        key={`${record.id}-tag-${index}`}
                    className={`inline-flex items-center px-2.5 py-0.5 text-[11px] sm:text-xs leading-4 font-semibold uppercase tracking-wide rounded whitespace-nowrap ${
                      ['HDA','QP'].includes(tagCode)
                        ? 'bg-teal-600/25 text-teal-200 border border-teal-400/50'
                        : 'bg-teal-600/20 text-teal-300 border border-teal-500/40'
                    }`}
                    title={tagLabel}
                  >
                    {tagCode}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className="text-teal-400 flex-shrink-0 mt-1 self-start sm:self-auto" title="Registro Médico">
          <FileText size={18} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;

// Connector: Integrates with PatientView/index.jsx as main dashboard component
// Hook: Uses fetchPatientDashboard from patientStore.js for API calls