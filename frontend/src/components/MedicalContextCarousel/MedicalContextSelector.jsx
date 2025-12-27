import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Pin, 
  Settings2, 
  ChevronDown, 
  X,
  Plus,
  Trash2,
  Search
} from 'lucide-react';
import { CONTEXTS, TEMPLATES } from './definitions';

/**
 * MedicalContextSelector Component
 * 
 * Handles the selection of the medical context (e.g., UTI, PS) and 
 * the specific tag template (e.g., Systems, SOAP, Flat).
 */
export default function MedicalContextSelector({
  currentContext,
  onNextContext,
  onPrevContext,
  onSelectContext,
  onPinContext,
  isContextPinned,
  
  currentTemplate,
  onSelectTemplate,
  onPinTemplate,
  pinnedTemplateId,
  
  contextIndex,
  totalContexts
}) {
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  
  // Combobox state
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isEditing && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isEditing]);

  const handleTemplateSelect = (tplId) => {
    onSelectTemplate(tplId);
    setIsTemplateMenuOpen(false);
  };
  
  const handleCreateTemplate = () => {
    // Placeholder for future create logic
    console.log("Create new template");
  };

  const handleDeleteTemplate = (id) => {
    // Placeholder for future delete logic
    console.log("Delete template", id);
  };

  const handleContextClick = () => {
    setSearchQuery(''); // Start empty or could start with currentContext.label
    setIsEditing(true);
  };

  const handleContextSelect = (index) => {
    if (onSelectContext) {
      onSelectContext(index);
    }
    setIsEditing(false);
    setSearchQuery('');
  };

  const filteredContexts = CONTEXTS.map((ctx, idx) => ({ ...ctx, originalIndex: idx }))
    .filter(ctx => 
      ctx.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (ctx.description && ctx.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  return (
    <div className="w-full">
      {/* Context Carousel Header */}
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={onPrevContext} 
          className="p-1 text-gray-400 hover:text-teal-300 rounded-full transition-colors"
          title="Contexto Anterior"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="flex flex-col items-center">
          {/* Context Pin */}
          <button
            onClick={onPinContext}
            title={isContextPinned ? "Contexto Padrão (Ao Iniciar)" : "Definir como Contexto Padrão"}
            className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest mb-1 transition-colors ${
              isContextPinned ? 'text-cyan-400' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            <Pin size={10} fill={isContextPinned ? "currentColor" : "none"} />
            {isContextPinned ? "Start Padrão" : "Fixar Contexto"}
          </button>

          <h2 
            className="text-xl font-bold text-gray-100 flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded transition-colors relative"
            onClick={!isEditing ? handleContextClick : undefined}
          >
            {!isEditing ? (
              <>
                {currentContext.label}
              </>
            ) : (
              <div className="relative min-w-[200px]">
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-cyan-500 absolute left-2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => setTimeout(() => setIsEditing(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (filteredContexts.length > 0) {
                          handleContextSelect(filteredContexts[0].originalIndex);
                        }
                      } else if (e.key === 'Escape') {
                        setIsEditing(false);
                      }
                    }}
                    placeholder="Buscar contexto..."
                    className="w-full bg-gray-800 text-white text-sm rounded border border-cyan-500 pl-8 pr-2 py-1 outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                {/* Dropdown Results */}
                <div className="absolute top-full left-0 mt-1 w-full bg-gray-800 border border-gray-700 rounded shadow-xl z-50 max-h-60 overflow-y-auto">
                  {filteredContexts.length > 0 ? (
                    filteredContexts.map((ctx) => (
                      <button
                        key={ctx.id}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-cyan-900/30 hover:text-cyan-400 flex items-center gap-2 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContextSelect(ctx.originalIndex);
                        }}
                      >
                        {ctx.icon && <ctx.icon size={14} />}
                        <span>{ctx.label}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">Nenhum resultado</div>
                  )}
                </div>
              </div>
            )}
          </h2>

          {/* Template Switcher (Dropdown Trigger) */}
          <div className="relative mt-1">
            <button
              onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-gray-800/50 px-2 py-0.5 rounded-full border border-gray-700 transition-colors"
            >
              <Settings2 size={10} />
              <span>Template: <strong className="text-gray-300">{currentTemplate?.label}</strong></span>
              <ChevronDown size={10} />
            </button>

            {/* Dropdown Menu */}
            {isTemplateMenuOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-theme-card border border-gray-700 shadow-xl rounded-lg z-50 overflow-hidden">
                <div className="p-2 bg-gray-800/50 border-b border-gray-700 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Escolher Modelo</span>
                  <div className="flex gap-1">
                      <button onClick={handleCreateTemplate} className="text-gray-400 hover:text-teal-400 p-1" title="Criar novo template"><Plus size={14}/></button>
                      <button onClick={() => setIsTemplateMenuOpen(false)} className="text-gray-400 hover:text-white p-1"><X size={14} /></button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {TEMPLATES.map(t => (
                    <div key={t.id} className="flex items-center border-b border-gray-800 last:border-0 group">
                      <button
                        onClick={() => handleTemplateSelect(t.id)}
                        className={`flex-1 text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/5 ${
                          currentTemplate?.id === t.id ? 'text-cyan-400 bg-white/5' : 'text-gray-400'
                        }`}
                      >
                        {t.icon && <t.icon size={14} />}
                        <div className="flex flex-col">
                            <span>{t.label}</span>
                            <span className="text-[10px] text-gray-600">{t.type}</span>
                        </div>
                      </button>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-2 gap-1">
                        {/* Delete Template (Mock) */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }}
                            className="p-1.5 hover:text-red-400 text-gray-600"
                            title="Excluir template"
                        >
                            <Trash2 size={12} />
                        </button>
                        {/* Local Template Pin */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onPinTemplate(t.id); }}
                            className={`p-1.5 hover:text-cyan-400 ${
                            pinnedTemplateId === t.id ? 'text-cyan-400' : 'text-gray-600'
                            }`}
                            title="Forçar este template globalmente"
                        >
                            <Pin size={12} fill={pinnedTemplateId === t.id ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={onNextContext} 
          className="p-1 text-gray-400 hover:text-teal-300 rounded-full transition-colors"
          title="Próximo Contexto"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-1.5 h-1 mb-2">
        {CONTEXTS.map((_, idx) => (
          <div
            key={idx}
            className={`rounded-full transition-all duration-300 ${
              idx === contextIndex ? 'w-4 bg-cyan-500' : 'w-1 bg-gray-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
