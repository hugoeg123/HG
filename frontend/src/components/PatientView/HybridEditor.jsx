import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plus, Hash, Save, ChevronDown, ChevronRight, BookText, Stethoscope, FlaskConical, ClipboardList, Pill, X, UserCircle, Sparkles } from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';
import { tagService, templateService } from '../../services/api';
import { parseSections } from '../../../../shared/parser.js';
import { useDebounce } from '../../hooks/useDebounce';
import SectionBlock from './SectionBlock';

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
  
  const { createRecord, updateRecord, isLoading } = usePatientStore();
  
  // Core editor state
  const [editorContent, setEditorContent] = useState('');
  const [isSegmented, setIsSegmented] = useState(true);
  const [availableTags, setAvailableTags] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Tag management state
  const [openCategories, setOpenCategories] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTag, setNewTag] = useState({ code: '', name: '', category: 'Anamnese' });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState(safeTitle);
  
  // Performance optimization
  const debouncedContent = useDebounce(editorContent, 300);
  const sectionRefs = useRef({});
  
  // Initial text for new records
  const initialText = '#QP: \n\n#HDA: \n\n#SV: \n>>PA: \n>>FC: ';
  
  // Categories configuration
  const categoriesConfig = {
    'Anamnese': { icon: <BookText size={16} />, order: 1 },
    'Exame Físico': { icon: <Stethoscope size={16} />, order: 2 },
    'Investigação': { icon: <FlaskConical size={16} />, order: 3 },
    'Diagnóstico': { icon: <ClipboardList size={16} />, order: 4 },
    'Plano': { icon: <Pill size={16} />, order: 5 },
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
  
  // Group tags by category
  const groupedTags = useMemo(() => {
    const grouped = Object.fromEntries(
      Object.keys(categoriesConfig).map(cat => [cat, { main: [], subs: {} }])
    );
    
    if (Array.isArray(availableTags)) {
      availableTags.forEach(tag => {
        if (!tag) return;
        const category = tag.category || tag.categoria || 'Anamnese';
        if (!grouped[category]) {
          grouped[category] = { main: [], subs: {} };
        }
        
        if (tag.parentId) {
          if (!grouped[category].subs[tag.parentId]) {
            grouped[category].subs[tag.parentId] = [];
          }
          grouped[category].subs[tag.parentId].push(tag);
        } else {
          grouped[category].main.push(tag);
        }
      });
    }
    
    return grouped;
  }, [availableTags, categoriesConfig]);
  
  // Parse content into sections
  const sections = useMemo(() => {
    if (!editorContent.trim()) return [];
    
    try {
      // Split by double newlines for sections
      const sectionTexts = editorContent.split('\n\n').filter(text => text.trim());
      return sectionTexts.map((content, index) => ({
        id: `s_${Date.now()}_${index}`,
        content: content.trim()
      }));
    } catch (error) {
      console.error('Error parsing sections:', error);
      return [{ id: `s_${Date.now()}`, content: editorContent }];
    }
  }, [editorContent]);
  
  // Load initial data
  // Hook: Ensures state consistency and prevents rendering crashes
  useEffect(() => {
    if (safeRecord) {
      setEditorContent(safeRecord.content || '');
      // Ensure title is always a valid string
      setEditableTitle(typeof safeRecord.title === 'string' ? safeRecord.title : safeTitle);
    } else {
      setEditorContent(initialText);
      setEditableTitle(safeTitle);
    }
  }, [safeRecord, initialText, safeTitle]);
  
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
  
  // Handle view toggle
  const handleToggleView = useCallback(() => {
    setIsSegmented(prev => !prev);
  }, []);
  
  // Handle text change with debounce
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
      
      const currentSectionIndex = sections.findIndex(s => s.id === sectionId);
      const updatedSections = [...sections];
      
      // Update current section
      updatedSections[currentSectionIndex] = {
        ...updatedSections[currentSectionIndex],
        content: contentBefore.trim()
      };
      
      // Add new section
      const newSection = {
        id: `s_${Date.now()}`,
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
    } else {
      // Normal content update
      const updatedSections = sections.map(s => 
        s.id === sectionId ? { ...s, content: newContent } : s
      );
      const newEditorContent = updatedSections.map(s => s.content).join('\n\n');
      setEditorContent(newEditorContent);
    }
  }, [isSegmented, sections]);
  
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
  
  // Handle create tag
  const handleCreateTag = useCallback(() => {
    if (!newTag.code || !newTag.name) return;
    
    const finalTagCode = (newTag.code.startsWith('#') || newTag.code.startsWith('>>')) 
      ? newTag.code 
      : `#${newTag.code}`;
    
    const newTagData = {
      id: `t_${Date.now()}`,
      code: finalTagCode.toUpperCase(),
      name: newTag.name,
      category: newTag.category
    };
    
    setAvailableTags(prev => [...prev, newTagData]);
    setNewTag({ code: '', name: '', category: 'Anamnese' });
    setIsModalOpen(false);
  }, [newTag]);
  
  // Handle save
  const handleSave = useCallback(async () => {
    try {
      const recordData = {
        title: safeTitle,
        content: editorContent,
        patientId: safePatientId,
        type: safeRecordType,
        tags: [] // Will be populated by backend parser
      };
      
      if (safeRecord) {
        await updateRecord(safeRecord.id, recordData);
      } else {
        await createRecord(recordData);
      }
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving record:', error);
    }
  }, [editorContent, safeTitle, safePatientId, safeRecordType, safeRecord, updateRecord, createRecord, onSave]);
  
  // Handle add to chat
  const handleAddToChat = useCallback((content) => {
    console.log('--- ADICIONANDO AO CHAT ---', content);
    // TODO: Integrate with AI chat in future story
  }, []);
  
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-[#1a1d21] text-gray-300 font-sans">
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
        {/* Tag Toolbar */}
        <div className="w-full bg-[#22262b] p-4 rounded-xl mb-6">
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ease-in-out hover:from-teal-600 hover:to-cyan-600 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 transform hover:-translate-y-0.5 mb-4"
          >
            <Plus size={18} /> Criar Nova Tag
          </button>
          
          <div className="space-y-2">
            {Object.entries(categoriesConfig)
              .sort(([, a], [, b]) => a.order - b.order)
              .map(([category]) => (
                <div key={category}>
                  <button 
                    onClick={() => setOpenCategories(prev => ({
                      ...prev, 
                      [category]: !prev[category]
                    }))}
                    className="w-full flex justify-between items-center p-2 text-gray-300 font-semibold rounded-md hover:bg-gray-700/60"
                  >
                    <span className="flex items-center gap-2">
                      {categoriesConfig[category].icon} {category}
                    </span>
                    {openCategories[category] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  
                  {openCategories[category] && (
                    <div className="pl-4 pt-2 space-y-2">
                      {groupedTags[category]?.main?.map(tag => (
                        <div key={tag.id || tag.code || tag.codigo}>
                          <button 
                            onClick={() => insertTag(tag.code || tag.codigo)}
                            className="w-full text-left p-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded flex items-center gap-2" 
                            title={`Inserir: ${tag.name || tag.nome || 'Tag sem nome'}`}
                          >
                            <Hash size={14} className="text-teal-400"/> {tag.name || tag.nome || 'Tag sem nome'}
                          </button>
                        </div>
                      )) || []}
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </div>

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
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                className="w-full h-96 p-4 bg-[#22262b] border border-gray-700 rounded-xl text-gray-300 placeholder-gray-500 resize-y focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                placeholder="Digite o registro completo aqui..."
              />
            </div>
          )}
        </div>
      </main>

      {/* Create Tag Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#22262b] p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-200">Criar Nova Tag</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-white"
              >
                <X size={24}/>
              </button>
            </div>
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Código (Ex: #TAG ou >>SUB)" 
                value={newTag.code} 
                onChange={(e) => setNewTag({ ...newTag, code: e.target.value })} 
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white" 
              />
              <input 
                type="text" 
                placeholder="Nome (Ex: Exame Físico)" 
                value={newTag.name} 
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })} 
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white" 
              />
              <select 
                value={newTag.category} 
                onChange={(e) => setNewTag({ ...newTag, category: e.target.value })} 
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                {Object.keys(categoriesConfig).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button 
                onClick={handleCreateTag} 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-lg"
              >
                Criar Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HybridEditor;