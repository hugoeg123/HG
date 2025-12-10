import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Save, X, UserCircle, Sparkles, BookText, Stethoscope, FlaskConical, ClipboardList, Pill, Activity } from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';
import { tagService, templateService } from '../../services/api';
import { parseSections } from '../../shared/parser.js';
import { useDebounce, useDebounceCallback } from '../../hooks/useDebounce';
import SectionBlock from './SectionBlock';
import TagToolbar from './TagToolbar';
import VitalSignEditor from './VitalSignEditor';
import { extractNumericData } from '../../shared/parser.js';
import { calculateSeverity } from '../../lib/vitalSignAlerts.js';
import { emit as emitEvent } from '../../lib/events';

/**
 * HybridEditor Component - Editor híbrido para registros médicos
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.record - Registro médico a ser editado (opcional)
 * @param {string} props.patientId - ID do paciente
 * @param {string} props.recordType - Tipo de registro (anamnese, exames, investigacao, diagnostico, plano)
 * @param {string} props.title - Título padrão para novos registros
 * @param {Function} props.onSave - Callback após salvar o registro (opcional)
 * @param {Function} props.onCancel - Callback para cancelar a edição (opcional)
 * 
 * @example
 * return (
 *   <HybridEditor 
 *     record={recordObj}
 *     patientId="123"
 *     recordType="anamnese"
 *     title="Nova Anamnese"
 *     onSave={handleSave}
 *     onCancel={handleCancel}
 *   />
 * )
 * 
 * Integrates with:
 * - store/patientStore.js for record management
 * - shared/parser.js for tag parsing and section extraction
 * - SectionBlock.jsx for individual section rendering
 * 
 * IA prompt: Expandir para suporte a templates dinâmicos e auto-save
 */
const HybridEditor = ({ record, patientId, recordType = 'anamnese', title = 'Novo Registro', onSave, onCancel }) => {
  // Validate props to prevent rendering objects as text
  const safePatientId = typeof patientId === 'string' ? patientId : '';
  const safeRecordType = typeof recordType === 'string' ? recordType : 'anamnese';
  const safeTitle = typeof title === 'string' ? title : 'Novo Registro';
  
  // Validate record object
  const safeRecord = record && typeof record === 'object' && !Array.isArray(record) ? record : null;
  
  const { createRecord, updateRecord, isLoading, setChatContext } = usePatientStore();
  const { currentPatient } = usePatientStore();
  
  // Core editor state
  const [editorContent, setEditorContent] = useState('');
  const [isSegmented, setIsSegmented] = useState(false); // Default to continuous view
  const [availableTags, setAvailableTags] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // CORREÇÃO: Gerenciamento de estado local para seções com IDs estáveis
  const [sections, setSections] = useState([]);
  const [sectionIdCounter, setSectionIdCounter] = useState(0);
  
  // Tag management state
  const [openCategories, setOpenCategories] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTag, setNewTag] = useState({ code: '', name: '', category: 'Anamnese' });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState(safeTitle);
  
  // Performance optimization
  const debouncedContent = useDebounce(editorContent, 300);
  const sectionRefs = useRef({});
  const lastAlertRef = useRef(null);
  

  
  // Configuração das categorias para cores dos blocos
  const categoryColors = {
    'Anamnese': 'bg-teal-500',
    'Exame Físico': 'bg-teal-400',
    'Investigação': 'bg-cyan-500',
    'Diagnóstico': 'bg-orange-500',
    'Plano': 'bg-red-500',
  };
  
  // Create tag map for quick lookups
  const tagMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(availableTags)) {
      availableTags.forEach(tag => {
        if (tag && (tag.code || tag.codigo)) {
          map.set(tag.code || tag.codigo, {
            name: tag.name || tag.nome || '',
            category: tag.category || tag.categoria || 'Anamnese',
            code: tag.code || tag.codigo
          });
        }
      });
    }
    return map;
  }, [availableTags]);
  
  // Note: groupedTags logic moved to TagToolbar.jsx for better encapsulation
  // Hook: TagToolbar now handles all tag categorization internally
  
  // CORREÇÃO: Função para sincronizar seções com conteúdo do editor
  const syncSectionsFromContent = useCallback((content) => {
    if (!content.trim()) {
      setSections([]);
      return;
    }
    
    try {
      // Split by double newlines for sections
      const sectionTexts = content.split('\n\n').filter(text => text.trim());
      
      setSections(prevSections => {
        // Reutilizar IDs existentes quando possível para manter estabilidade
        const newSections = sectionTexts.map((sectionContent, index) => {
          const existingSection = prevSections[index];
          if (existingSection && existingSection.content === sectionContent.trim()) {
            return existingSection; // Manter seção existente
          }
          
          // Criar nova seção com ID estável
          return {
            id: existingSection?.id || `section_${sectionIdCounter + index}`,
            content: sectionContent.trim()
          };
        });
        
        // Atualizar contador apenas se criamos novas seções
        const newSectionsCount = newSections.filter((_, index) => !prevSections[index]).length;
        if (newSectionsCount > 0) {
          setSectionIdCounter(prev => prev + newSectionsCount);
        }
        
        return newSections;
      });
    } catch (error) {
      console.error('Error parsing sections:', error);
      setSections([{ id: `section_${sectionIdCounter}`, content }]);
      setSectionIdCounter(prev => prev + 1);
    }
  }, [sectionIdCounter]);
  
  // CORREÇÃO: Sincronizar seções quando o conteúdo do editor mudar
  useEffect(() => {
    if (isSegmented) {
      syncSectionsFromContent(editorContent);
    }
  }, [editorContent, isSegmented, syncSectionsFromContent]);
  
  // Load initial data
  // Hook: Ensures state consistency and prevents rendering crashes
  useEffect(() => {
    if (safeRecord) {
      setEditorContent(safeRecord.content || '');
      // Ensure title is always a valid string
      setEditableTitle(typeof safeRecord.title === 'string' ? safeRecord.title : safeTitle);
      // Set segmented view for existing records with content
      setIsSegmented(Boolean(safeRecord.content && safeRecord.content.trim()));
    } else {
      setEditorContent('');
      setEditableTitle(safeTitle);
      setIsSegmented(false);
    }
  }, [safeRecord, safeTitle]);
  
  // Load available tags and templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load tags
        const tagsResponse = await tagService.getAll();
        if (tagsResponse?.data && Array.isArray(tagsResponse.data)) {
          setAvailableTags(tagsResponse.data);
        } else {
          // Use default tags if API fails
          setAvailableTags([
            { id: '1', code: '#QP', name: 'Queixa Principal', category: 'Anamnese' },
            { id: '2', code: '#HDA', name: 'História da Doença Atual', category: 'Anamnese' },
            { id: '3', code: '>>INICIO', name: 'Início dos Sintomas', category: 'Anamnese', parentId: '2' },
            { id: '4', code: '>>CARACTERISTICA', name: 'Característica da Dor', category: 'Anamnese', parentId: '2' },
            { id: '5', code: '#HMP', name: 'Hist. Médica Pregressa', category: 'Anamnese' },
            { id: '6', code: '#SV', name: 'Sinais Vitais', category: 'Exame Físico' },
            { id: '7', code: '>>PA', name: 'Pressão Arterial', category: 'Exame Físico', parentId: '6' },
            { id: '8', code: '>>FC', name: 'Frequência Cardíaca', category: 'Exame Físico', parentId: '6' },
            { id: '9', code: '#EX_LAB', name: 'Exames Laboratoriais', category: 'Investigação' },
            { id: '10', code: '#HD', name: 'Hipótese Diagnóstica', category: 'Diagnóstico' },
            { id: '11', code: '#PL_TX', name: 'Plano Terapêutico', category: 'Plano' },
          ]);
        }
        
        // Load templates
        const templatesResponse = await templateService.getByType(safeRecordType);
        if (templatesResponse?.data && Array.isArray(templatesResponse.data)) {
          setTemplates(templatesResponse.data);
        }
      } catch (error) {
        console.error('Error loading editor data:', error);
      }
    };
    
    fetchData();
  }, [safeRecordType]);

  useEffect(() => {
    const age = (() => {
      const bd = currentPatient?.birthDate || currentPatient?.dateOfBirth;
      if (!bd) return null;
      const today = new Date();
      const birth = new Date(bd);
      let a = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
      return a;
    })();

    if (!debouncedContent) return;

    try {
      const pa = extractNumericData(debouncedContent, 'PA');
      const fc = extractNumericData(debouncedContent, 'FC');
      const fr = extractNumericData(debouncedContent, 'FR');
      const spo2 = extractNumericData(debouncedContent, 'SPO2');
      const temp = extractNumericData(debouncedContent, 'TEMP');

      const vitals = {
        systolic: pa?.sistolica ? Number(pa.sistolica) : undefined,
        diastolic: pa?.diastolica ? Number(pa.diastolica) : undefined,
        heartRate: fc?.frequencia ? Number(fc.frequencia) : undefined,
        respiratoryRate: fr?.frequencia ? Number(fr.frequencia) : undefined,
        spo2: spo2?.valor ? Number(spo2.valor) : undefined,
        temp: temp?.temperatura ? Number(String(temp.temperatura).replace(',', '.')) : undefined
      };

      if (Object.values(vitals).every(v => v === undefined)) return;

      const gender = (currentPatient?.gender || '').toLowerCase();
      const isPregnant = Boolean(currentPatient?.obstetrics?.currentlyPregnant);
      const hasCOPD = Array.isArray(currentPatient?.chronicConditions)
        ? currentPatient.chronicConditions.some(c => String(c.condition_name || c).toLowerCase().includes('dpoc') || String(c.condition_name || c).toLowerCase().includes('copd'))
        : false;

      const alerts = calculateSeverity(vitals, { age: age ?? 25, isPregnant, hasCOPD, onRoomAir: true });
      const key = JSON.stringify(alerts);
      if (alerts.length > 0 && key !== lastAlertRef.current) {
        lastAlertRef.current = key;
        const primary = alerts[0];
        const payload = {
          id: `ephem_${Date.now()}`,
          message: primary.message,
          severity: primary.type === 'emergency' ? 'critical' : 'warning',
          is_read: false,
          created_at: new Date().toISOString(),
          patientId: currentPatient?.id || null
        };
        emitEvent('alert.local', payload);
      }
    } catch (e) {
    }
  }, [debouncedContent, currentPatient]);
  
  // Handle view toggle
  const handleToggleView = useCallback(() => {
    setIsSegmented(prev => !prev);
  }, []);
  
  // CORREÇÃO: Handle text change com estado local das seções para estabilizar foco
  const handleTextChange = useCallback((sectionId, newContent) => {
    if (!isSegmented) {
      setEditorContent(newContent);
      return;
    }
    
    // Check for new section creation (when user types a new tag)
    const mainTagRegex = /\n(#\w+:\s*.*)/;
    const match = newContent.match(mainTagRegex);
    
    if (match && match.index !== undefined) {
      const contentBefore = newContent.substring(0, match.index);
      const newSectionContent = match[1].trim();
      
      setSections(prevSections => {
        const currentSectionIndex = prevSections.findIndex(s => s.id === sectionId);
        const updatedSections = [...prevSections];
        
        // Update current section
        updatedSections[currentSectionIndex] = {
          ...updatedSections[currentSectionIndex],
          content: contentBefore.trim()
        };
        
        // Add new section with stable ID
        const newSection = {
          id: `section_${sectionIdCounter}`,
          content: newSectionContent
        };
        updatedSections.splice(currentSectionIndex + 1, 0, newSection);
        
        // Update editor content
        const newEditorContent = updatedSections.map(s => s.content).join('\n\n');
        setEditorContent(newEditorContent);
        
        // Focus new section
        setTimeout(() => {
          const newSectionRef = sectionRefs.current[newSection.id];
          if (newSectionRef) {
            newSectionRef.focus();
          }
        }, 50);
        
        return updatedSections;
      });
      
      setSectionIdCounter(prev => prev + 1);
    } else {
      // CORREÇÃO: Atualização normal - modifica apenas a seção específica
      setSections(prevSections => 
        prevSections.map(s => 
          s.id === sectionId ? { ...s, content: newContent } : s
        )
      );
      
      // Atualiza o conteúdo do editor de forma reativa
      setSections(currentSections => {
        const newEditorContent = currentSections.map(s => s.content).join('\n\n');
        setEditorContent(newEditorContent);
        return currentSections;
      });
    }
  }, [isSegmented, sectionIdCounter]);
  
  // Debounced version for auto-save functionality
  const debouncedHandleTextChange = useDebounceCallback(handleTextChange, 300);
  
  // Handle key down events
  const handleKeyDown = useCallback((e, sectionId) => {
    if (!isSegmented) return;
    
    const target = e.target;
    if (e.key === 'Backspace' && target.value === '' && sections.length > 1) {
      e.preventDefault();
      
      const currentSectionIndex = sections.findIndex(s => s.id === sectionId);
      if (currentSectionIndex > 0) {
        const previousSection = sections[currentSectionIndex - 1];
        const newSections = sections.filter(s => s.id !== sectionId);
        
        const newEditorContent = newSections.map(s => s.content).join('\n\n');
        setEditorContent(newEditorContent);
        
        // Focus previous section
        setTimeout(() => {
          const prevRef = sectionRefs.current[previousSection.id];
          if (prevRef) {
            prevRef.focus();
            prevRef.setSelectionRange(prevRef.value.length, prevRef.value.length);
          }
        }, 50);
      }
    }
  }, [isSegmented, sections]);
  
  // Insert tag
  const insertTag = useCallback((tagCode) => {
    if (isSegmented) {
      const lastSection = sections[sections.length - 1];
      if (lastSection && lastSection.content.trim() !== '') {
        if (!tagCode.startsWith('>>')) {
          // Create new section for main tags
          const newContent = `${editorContent}\n\n${tagCode}: `;
          setEditorContent(newContent);
        } else {
          // Add subtag to current section
          const updatedContent = `${lastSection.content.trim()}\n${tagCode}: `;
          handleTextChange(lastSection.id, updatedContent);
        }
      } else if (lastSection) {
        handleTextChange(lastSection.id, `${tagCode}: `);
      } else {
        setEditorContent(`${tagCode}: `);
      }
    } else {
      setEditorContent(prev => `${prev.trim()}\n\n${tagCode}: `);
    }
  }, [isSegmented, sections, editorContent, handleTextChange]);
  
  // Handle create tag (callback do TagToolbar)
  const handleCreateTag = useCallback((newTagData) => {
    setAvailableTags(prev => [...prev, newTagData]);
  }, []);
  
  // Handle save
  const handleSave = useCallback(async () => {
    // Validação básica antes de salvar
    if (!editorContent.trim()) {
      console.warn('Conteúdo vazio, salvamento ignorado.');
      return;
    }
    
    if (!safePatientId) {
      console.error('ID do paciente não encontrado');
      return;
    }
    
    try {
      const recordData = {
        title: editableTitle || safeTitle,
        content: editorContent.trim(),
        patientId: safePatientId,
        type: safeRecordType,
        tags: [] // Will be populated by backend parser
      };
      
      console.log('Salvando registro:', { 
        title: recordData.title, 
        contentLength: recordData.content.length,
        patientId: recordData.patientId,
        type: recordData.type
      });
      
      let result;
      if (safeRecord) {
        result = await updateRecord(safeRecord.id, recordData);
        console.log('Registro atualizado com sucesso:', result);
      } else {
        result = await createRecord(recordData);
        console.log('Registro criado com sucesso:', result);
      }
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('❌ Error saving record:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      // Melhor feedback de erro para o usuário
      let userMessage = 'Erro desconhecido ao salvar registro';
      
      if (error.response) {
        // Erro HTTP do servidor
        const status = error.response.status;
        const serverMessage = error.response.data?.message || error.response.data?.error;
        
        if (status === 400) {
          userMessage = serverMessage || 'Dados inválidos. Verifique o conteúdo do registro.';
        } else if (status === 401) {
          userMessage = 'Sessão expirada. Faça login novamente.';
        } else if (status === 403) {
          userMessage = 'Você não tem permissão para salvar este registro.';
        } else if (status === 500) {
          userMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
        } else {
          userMessage = serverMessage || `Erro do servidor (${status})`;
        }
      } else if (error.message) {
        // Erro de validação ou processamento local
        userMessage = error.message;
      }
      
      console.error('❌ Mensagem para o usuário:', userMessage);
      
      // Criar um erro mais informativo para a UI
      const enhancedError = new Error(userMessage);
      enhancedError.originalError = error;
      enhancedError.isUserFriendly = true;
      
      throw enhancedError;
    }
  }, [editorContent, editableTitle, safeTitle, safePatientId, safeRecordType, safeRecord, updateRecord, createRecord, onSave]);
  
  // Handle add to chat
  const handleAddToChat = useCallback((content) => {
    // Hook: Integrates with AIAssistant.jsx via patientStore.setChatContext
    if (content && content.trim()) {
      setChatContext(content.trim());
      console.log('Conteúdo adicionado ao chat da IA:', content.substring(0, 100) + '...');
    }
  }, [setChatContext]);
  
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-theme-background text-gray-300 font-sans">
      {/* Header */}
      <header className="flex items-center pb-4 mb-6 border-b border-gray-700">
        <UserCircle size={48} className="text-teal-400 mr-4"/>
        <div className="flex-1">
          {isEditingTitle ? (
            <input
              type="text"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                } else if (e.key === 'Escape') {
                  setEditableTitle(safeTitle);
                  setIsEditingTitle(false);
                }
              }}
              className="text-2xl font-bold text-gray-100 bg-transparent border-b border-teal-400 focus:outline-none focus:border-teal-300 w-full"
              autoFocus
            />
          ) : (
            <h1 
              className="text-2xl font-bold text-gray-100 cursor-pointer hover:text-teal-300 transition-colors"
              onClick={() => setIsEditingTitle(true)}
              title="Clique para editar o título"
            >
              {editableTitle}
            </h1>
          )}
          <p className="text-gray-400">Tipo: {safeRecordType}</p>
        </div>
      </header>
      
      <main className="flex flex-col items-center w-full">
        {/* Tag Toolbar Component */}
        <TagToolbar 
          availableTags={availableTags}
          onInsertTag={insertTag}
          onCreateTag={handleCreateTag}
          categoriesConfig={{
            'Anamnese': { icon: <BookText size={16} />, order: 1 },
            'Exame Físico': { icon: <Stethoscope size={16} />, order: 2 },
            'Sinais Vitais': { icon: <Activity size={16} />, order: 3 },
            'Investigação': { icon: <FlaskConical size={16} />, order: 4 },
            'Diagnóstico': { icon: <ClipboardList size={16} />, order: 5 },
            'Plano': { icon: <Pill size={16} />, order: 6 },
          }}
        />

        {/* Editor Controls */}
        <div className="w-full space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-300">Registro da Consulta</h2>
            <div className="flex items-center gap-4">
              {/* Toggle Switch */}
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isSegmented ? 'text-teal-400' : 'text-gray-400'}`}>
                  Visão Segmentada
                </span>
                <button 
                  onClick={handleToggleView}
                  role="switch" 
                  aria-checked={isSegmented}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    isSegmented ? 'bg-teal-600' : 'bg-gray-600'
                  }`}
                >
                  <span 
                    aria-hidden="true" 
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isSegmented ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              
              <button 
                onClick={handleSave}
                disabled={isLoading}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save size={16} /> {isLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
          
          {/* Editor Content */}
          {isSegmented ? (
            <div className="w-full space-y-4">
              {sections.map((section) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  tagMap={tagMap}
                  onContentChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  onAddToChat={handleAddToChat}
                  categoryColors={categoryColors}
                  ref={(el) => {
                    if (el) sectionRefs.current[section.id] = el;
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="relative group">
              <button 
                onClick={() => handleAddToChat(editorContent)}
                className="absolute top-2 right-2 p-1.5 bg-gray-700/50 rounded-full text-teal-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" 
                title="Adicionar todo o texto ao Chat"
              >
                <Sparkles size={16} />
              </button>
              <div className="w-full h-96 p-4 bg-theme-card border border-gray-700 rounded-xl text-gray-300 placeholder-gray-500">
                <VitalSignEditor
                  value={editorContent}
                  onChange={(val) => setEditorContent(val)}
                  placeholder="Digite o registro completo aqui..."
                  style={{ height: '100%' }}
                  context={{
                    age: (() => {
                      const bd = currentPatient?.birthDate || currentPatient?.dateOfBirth;
                      if (!bd) return 25;
                      const today = new Date();
                      const birth = new Date(bd);
                      let a = today.getFullYear() - birth.getFullYear();
                      const m = today.getMonth() - birth.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
                      return a;
                    })(),
                    isPregnant: Boolean(currentPatient?.obstetrics?.currentlyPregnant),
                    hasCOPD: Array.isArray(currentPatient?.chronicConditions)
                      ? currentPatient.chronicConditions.some(c => String(c.condition_name || c).toLowerCase().includes('dpoc') || String(c.condition_name || c).toLowerCase().includes('copd'))
                      : false,
                    onRoomAir: true
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>


    </div>
  );
};

export default HybridEditor;
