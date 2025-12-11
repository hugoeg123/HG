import React, { useState, useMemo } from 'react';
import { Plus, Hash, ChevronDown, ChevronRight, BookText, Stethoscope, FlaskConical, ClipboardList, Pill, X, Activity } from 'lucide-react';

/**
 * TagToolbar Component - Barra de ferramentas para inserção de tags médicas
 * 
 * @component
 * @param {Object} props
 * @param {Array} props.availableTags - Lista de tags disponíveis
 * @param {Function} props.onInsertTag - Callback para inserir tag no editor
 * @param {Function} props.onCreateTag - Callback para criar nova tag
 * @param {Object} props.categoriesConfig - Configuração das categorias
 * 
 * @example
 * return (
 *   <TagToolbar 
 *     availableTags={tags}
 *     onInsertTag={handleInsertTag}
 *     onCreateTag={handleCreateTag}
 *     categoriesConfig={categories}
 *   />
 * )
 * 
 * Integrates with:
 * - HybridEditor.jsx via callbacks de inserção e criação
 * - tagService.js para buscar tags do backend
 * 
 * Hook: Renderizado permanentemente no HybridEditor
 * IA prompt: Adicionar drag-and-drop para reordenar tags por frequência de uso
 */
const TagToolbar = ({ 
  availableTags = [], 
  onInsertTag, 
  onCreateTag,
  categoriesConfig = {}
}) => {
  // State for category expansion and modal
  const [openCategories, setOpenCategories] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTag, setNewTag] = useState({ 
    code: '', 
    name: '', 
    category: 'Anamnese' 
  });

  // Default categories configuration if not provided
  const defaultCategoriesConfig = {
    'Anamnese': { icon: <BookText size={16} />, order: 1 },
    'Exame Físico': { icon: <Stethoscope size={16} />, order: 2 },
    'Investigação': { icon: <FlaskConical size={16} />, order: 3 },
    'Diagnóstico': { icon: <ClipboardList size={16} />, order: 4 },
    'Plano': { icon: <Pill size={16} />, order: 5 },
  };

  const categories = Object.keys(categoriesConfig).length > 0 
    ? categoriesConfig 
    : defaultCategoriesConfig;

  // Group tags by category
  const groupedTags = useMemo(() => {
    const grouped = Object.fromEntries(
      Object.keys(categories).map(cat => [cat, { main: [], subs: {} }])
    );
    
    if (Array.isArray(availableTags)) {
      availableTags.forEach(tag => {
        if (!tag) return;
        const category = tag.category || tag.categoria || 'Anamnese';
        
        // Handle case where category might not exist in config
        if (!grouped[category]) {
           // Fallback to Anamnese
           if (!grouped['Anamnese']) grouped['Anamnese'] = { main: [], subs: {} };
           grouped['Anamnese'].main.push(tag);
           return;
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
  }, [availableTags, categories]);

  // Update categories list to include Sinais Vitais if it has tags but not in config
  // (Though we added it to defaultCategoriesConfig, custom config might override it)
  
  // Handle category toggle

  // Handle category toggle
  const toggleCategory = (category) => {
    setOpenCategories(prev => ({
      ...prev, 
      [category]: !prev[category]
    }));
  };

  // Handle tag insertion
  const handleInsertTag = (tagCode) => {
    if (onInsertTag) {
      onInsertTag(tagCode);
    }
  };

  // Handle create new tag
  const handleCreateTag = () => {
    if (!newTag.code || !newTag.name) return;
    
    const finalTagCode = (newTag.code.startsWith('#') || newTag.code.startsWith('##')) 
      ? newTag.code 
      : `#${newTag.code}`;
    
    const newTagData = {
      id: `t_${Date.now()}`,
      code: finalTagCode.toUpperCase(),
      name: newTag.name,
      category: newTag.category
    };
    
    if (onCreateTag) {
      onCreateTag(newTagData);
    }
    
    // Reset form
    setNewTag({ code: '', name: '', category: 'Anamnese' });
    setIsModalOpen(false);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewTag({ code: '', name: '', category: 'Anamnese' });
  };

  return (
    <>
      {/* Tag Toolbar */}
      <div className="w-full bg-theme-card p-4 rounded-xl mb-6">
        {/* Create New Tag Button */}
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ease-in-out hover:from-teal-600 hover:to-cyan-600 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 transform hover:-translate-y-0.5 mb-4"
          aria-label="Criar nova tag médica"
        >
          <Plus size={18} /> Criar Nova Tag
        </button>
        
        {/* Categories and Tags */}
        <div className="space-y-2">
          {Object.entries(categories)
            .filter(([category]) => category !== 'Sinais Vitais') // Remove Sinais Vitais category button
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([category]) => (
              <div key={category}>
                {/* Category Header */}
                <button 
                  onClick={() => toggleCategory(category)}
                  className="w-full flex justify-between items-center p-2 text-gray-300 font-semibold rounded-md hover:bg-theme-surface transition-colors"
                  aria-expanded={openCategories[category]}
                  aria-controls={`category-${category.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <span className="flex items-center gap-2">
                    {categories[category].icon} {category}
                  </span>
                  {openCategories[category] ? 
                    <ChevronDown size={18} /> : 
                    <ChevronRight size={18} />
                  }
                </button>
                
                {/* Category Tags */}
                {openCategories[category] && (
                  <div 
                    id={`category-${category.replace(/\s+/g, '-').toLowerCase()}`}
                    className="pl-4 pt-2 space-y-2"
                  >
                    {groupedTags[category]?.main?.map(tag => (
                      <div key={tag.id || tag.code || tag.codigo}>
                        <button 
                          onClick={() => handleInsertTag(tag.code || tag.codigo)}
                          className="w-full text-left p-1.5 text-sm text-gray-300 hover:text-white hover:bg-theme-surface rounded flex items-center gap-2 transition-colors" 
                          title={`Inserir: ${tag.name || tag.nome || 'Tag sem nome'}`}
                          aria-label={`Inserir tag ${tag.name || tag.nome || 'sem nome'} no editor`}
                        >
                          <Hash size={14} className="text-teal-400 flex-shrink-0"/> 
                          <span className="truncate">{tag.name || tag.nome || 'Tag sem nome'}</span>
                        </button>
                        
                        {/* Subtags */}
                        {groupedTags[category]?.subs?.[tag.id] && (
                          <div className="ml-4 mt-1 space-y-1">
                            {groupedTags[category].subs[tag.id].map(subtag => (
                              <button
                                key={subtag.id || subtag.code || subtag.codigo}
                                onClick={() => handleInsertTag(subtag.code || subtag.codigo)}
                                className="w-full text-left p-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-theme-surface rounded flex items-center gap-2 transition-colors"
                                title={`Inserir: ${subtag.name || subtag.nome || 'Subtag sem nome'}`}
                                aria-label={`Inserir subtag ${subtag.name || subtag.nome || 'sem nome'} no editor`}
                              >
                                <Hash size={12} className="text-cyan-400 flex-shrink-0"/> 
                                <span className="truncate">{subtag.name || subtag.nome || 'Subtag sem nome'}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )) || []}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>

      {/* Create Tag Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-theme-card p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-200">Criar Nova Tag</h3>
              <button 
                onClick={handleCloseModal} 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Fechar modal"
              >
                <X size={24}/>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="tag-code" className="block text-sm font-medium text-gray-300 mb-1">
                  Código da Tag
                </label>
                <input 
                  id="tag-code"
                  type="text" 
                  placeholder="Ex: #TAG ou ##SUB" 
                  value={newTag.code} 
                  onChange={(e) => setNewTag({ ...newTag, code: e.target.value })} 
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  aria-describedby="tag-code-help"
                />
                <p id="tag-code-help" className="text-xs text-gray-400 mt-1">
                    Use # para tags principais ou ## para subtags
                  </p>
              </div>
              
              <div>
                <label htmlFor="tag-name" className="block text-sm font-medium text-gray-300 mb-1">
                  Nome da Tag
                </label>
                <input 
                  id="tag-name"
                  type="text" 
                  placeholder="Ex: Exame Físico" 
                  value={newTag.name} 
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })} 
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition" 
                />
              </div>
              
              <div>
                <label htmlFor="tag-category" className="block text-sm font-medium text-gray-300 mb-1">
                  Categoria
                </label>
                <select 
                  id="tag-category"
                  value={newTag.category} 
                  onChange={(e) => setNewTag({ ...newTag, category: e.target.value })} 
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                >
                  {Object.keys(categories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={handleCreateTag} 
                disabled={!newTag.code || !newTag.name}
                className="btn btn-primary w-full font-semibold py-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Criar Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Display name for debugging
TagToolbar.displayName = 'TagToolbar';

export default React.memo(TagToolbar);