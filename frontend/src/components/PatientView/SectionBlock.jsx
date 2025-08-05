import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Hash, ChevronRight } from 'lucide-react';

/**
 * Componente SectionBlock - Renderiza uma seção individual do editor híbrido
 * Otimizado com React.memo para performance
 * 
 * @component
 * @param {Object} section - Seção do editor com id e content
 * @param {Function} onContentChange - Callback para mudanças de conteúdo
 * @param {Function} onAddToChat - Callback para adicionar ao chat da IA
 * @param {Function} onKeyDown - Callback para eventos de teclado
 * @param {Map} tagMap - Mapa de tags disponíveis
 * @param {Object} categoryColors - Cores por categoria
 * 
 * Connector: Integrates with HybridEditor.jsx for section management
 * Hook: Optimized with React.memo to prevent unnecessary re-renders
 */
const SectionBlock = React.memo(({ 
  section, 
  onContentChange, 
  onAddToChat,
  onKeyDown,
  tagMap = {},
  categoryColors = {}
}) => {
  const textareaRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [wasFocused, setWasFocused] = useState(false);

  // Auto-redimensionar textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 60)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [section.content, adjustTextareaHeight]);

  // CORREÇÃO FASE 4: Gerenciar foco após re-renderização
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && wasFocused) {
      // Restaura o foco se o textarea estava focado antes da re-renderização
      textarea.focus();
      setWasFocused(false);
    }
  }, [section.content, wasFocused]);

  // Extract tag and content from section
  const { tagInfo, contentValue } = React.useMemo(() => {
    const content = section.content || '';
    
    // Try to match main tag pattern (#TAG:)
    const mainTagMatch = content.match(/^(#\w+):\s*(.*)$/s);
    if (mainTagMatch) {
      const [, tagCode, value] = mainTagMatch;
      const tag = tagMap.get ? tagMap.get(tagCode) : tagMap[tagCode];
      return {
        tagInfo: {
          code: tagCode,
          name: tag?.name || tag?.nome || tagCode.substring(1) || 'Tag',
          type: 'main',
          category: tag?.category || 'Anamnese'
        },
        contentValue: value.trim()
      };
    }
    
    // Try to match subtag pattern (>>SUBTAG:)
    const subTagMatch = content.match(/^(>>\w+):\s*(.*)$/s);
    if (subTagMatch) {
      const [, tagCode, value] = subTagMatch;
      const tag = tagMap.get ? tagMap.get(tagCode) : tagMap[tagCode];
      return {
        tagInfo: {
          code: tagCode,
          name: tag?.name || tag?.nome || tagCode.substring(2) || 'Subtag',
          type: 'sub',
          category: tag?.category || 'Anamnese'
        },
        contentValue: value.trim()
      };
    }
    
    // Check if content contains multiple lines with tags
    const lines = content.split('\n');
    const firstLine = lines[0] || '';
    const hasTag = firstLine.match(/^(#\w+|>>\w+):\s*/);
    
    if (hasTag) {
      const [, tagCode] = hasTag;
      const tag = tagMap.get ? tagMap.get(tagCode) : tagMap[tagCode];
      return {
        tagInfo: {
          code: tagCode,
          name: tag?.name || tag?.nome || (tagCode.startsWith('#') ? tagCode.substring(1) : tagCode.substring(2)) || 'Tag',
          type: tagCode.startsWith('#') ? 'main' : 'sub',
          category: tag?.category || 'Anamnese'
        },
        contentValue: content
      };
    }
    
    // No tag found, treat as free text
    return {
      tagInfo: {
        code: '',
        name: 'Texto Livre',
        type: 'free',
        category: 'Geral'
      },
      contentValue: content
    };
  }, [section.content, tagMap]);
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height based on scrollHeight with minimum height
      const newHeight = Math.max(textarea.scrollHeight, 60);
      textarea.style.height = `${newHeight}px`;
    }
  }, [section.content]);
  
  // Handle content change
  const handleChange = (e) => {
    const newValue = e.target.value;
    onContentChange(section.id, newValue);
  };
  
  // Handle key down
  const handleKeyDown = (e) => {
    onKeyDown(e, section.id);
  };
  
  // Handle add to chat
  const handleAddToChat = () => {
    onAddToChat(section.content);
  };

  // CORREÇÃO FASE 4: Handlers de foco
  const handleFocus = () => {
    setWasFocused(true);
  };

  const handleBlur = () => {
    setWasFocused(false);
  };
  
  // Get tag display styles
  const getTagStyles = () => {
    const baseStyles = "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium";
    
    switch (tagInfo.type) {
      case 'main':
        return `${baseStyles} bg-teal-600/20 text-teal-300 border border-teal-600/30`;
      case 'sub':
        return `${baseStyles} bg-cyan-600/20 text-cyan-300 border border-cyan-600/30`;
      case 'free':
        return `${baseStyles} bg-gray-600/20 text-gray-300 border border-gray-600/30`;
      default:
        return `${baseStyles} bg-gray-600/20 text-gray-300 border border-gray-600/30`;
    }
  };
  
  // Get category color
  const getCategoryColor = () => {
    const colors = {
      'Anamnese': 'text-teal-400',
      'Exame Físico': 'text-teal-300',
      'Investigação': 'text-cyan-400',
      'Diagnóstico': 'text-teal-500',
      'Plano': 'text-teal-400',
      'Geral': 'text-gray-400'
    };
    return colors[tagInfo.category] || 'text-gray-400';
  };
  
  // Generate aria-label
  const ariaLabel = `Seção de ${tagInfo.name}${tagInfo.category !== 'Geral' ? ` - ${tagInfo.category}` : ''}`;
  
  return (
    <div 
      className="relative group bg-[#22262b] border border-gray-700 rounded-xl p-4 transition-all duration-200 hover:border-gray-600 hover:shadow-lg hover:shadow-teal-500/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Tag Badge */}
          <span className={getTagStyles()}>
            <Hash size={12} />
            {tagInfo.name || 'Tag'}
          </span>
          
          {/* Category Badge */}
          {tagInfo.category !== 'Geral' && (
            <span className={`text-xs ${getCategoryColor()}`}>
              {tagInfo.category}
            </span>
          )}
        </div>
        
        {/* Add to Chat Button */}
        <button
          onClick={handleAddToChat}
          className={`p-1.5 bg-gray-700/50 rounded-full text-teal-400 transition-all duration-200 hover:bg-teal-600/20 hover:text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-[#22262b] ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
          title={`Adicionar "${tagInfo.name}" ao Chat`}
          aria-label={`Adicionar seção ${tagInfo.name} ao chat de IA`}
        >
          <Sparkles size={14} />
        </button>
      </div>
      
      {/* Content Textarea */}
      <textarea
        ref={textareaRef}
        value={section.content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full bg-transparent border-none text-gray-300 placeholder-gray-500 resize-none focus:outline-none focus:ring-0 leading-relaxed"
        placeholder={`Digite o conteúdo para ${tagInfo.name || 'esta seção'}...`}
        aria-label={ariaLabel}
        style={{
          minHeight: '60px',
          fontFamily: 'inherit',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
      />
      
      {/* Visual Indicators */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-500/50 to-cyan-500/50 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      {/* Character Count (for long content) */}
      {section.content && section.content.length > 500 && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
          {section.content.length} chars
        </div>
      )}
    </div>
  );
});

// Display name for debugging
SectionBlock.displayName = 'SectionBlock';

// Memoize component for performance
export default React.memo(SectionBlock, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.section.id === nextProps.section.id &&
    prevProps.section.content === nextProps.section.content &&
    prevProps.tagMap === nextProps.tagMap
  );
});