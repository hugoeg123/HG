import React, { useState, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import { Sparkles, Hash } from 'lucide-react';
import VitalSignEditor from './VitalSignEditor';

/**
 * Componente SectionBlock - Renderiza uma seção individual do editor híbrido
 * Otimizado com React.memo para performance e agora usa CodeMirror via VitalSignEditor
 */
const SectionBlock = React.forwardRef(({
  section,
  onContentChange,
  onAddToChat,
  onKeyDown,
  tagMap = {},
  categoryColors = {}
}, ref) => {
  const editorRef = useRef(null); // Ref para o container do CodeMirror (opcional) ou interno
  const [isHovered, setIsHovered] = useState(false);

  // Expose focus method to parent component (HybridEditor)
  useImperativeHandle(ref, () => ({
    focus: () => {
      // Encontra o elemento editável dentro do componente CodeMirror se possível
      // O VitalSignEditor deve lidar com isso ou focamos no container
      const editorEl = document.querySelector(`[data-section-id="${section.id}"] .cm-content`);
      if (editorEl) editorEl.focus();
    },
    value: section.content // Compatibility prop
  }), [section.id, section.content]);

  // Extract tag and content from section
  const { tagInfo } = React.useMemo(() => {
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

  // Handle content change
  const handleChange = useCallback((newValue) => {
    onContentChange(section.id, newValue);
  }, [section.id, onContentChange]);

  // Handle key down middleware
  const handleKeyDown = (e) => {
    onKeyDown(e, section.id);
  };

  // Handle add to chat
  const handleAddToChat = () => {
    onAddToChat(section.content);
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
      className="relative group bg-theme-card border border-gray-700 rounded-xl p-4 transition-all duration-200 hover:border-gray-600 hover:shadow-lg hover:shadow-teal-500/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-section-id={section.id}
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
          className={`p-1.5 bg-gray-700/50 rounded-full text-teal-400 transition-all duration-200 hover:bg-teal-600/20 hover:text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-theme-card ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
            }`}
          title={`Adicionar "${tagInfo.name}" ao Chat`}
          aria-label={`Adicionar seção ${tagInfo.name} ao chat de IA`}
        >
          <Sparkles size={14} />
        </button>
      </div>

      {/* Vital Sign Editor (CodeMirror) */}
      <div className="min-h-[60px]">
        <VitalSignEditor
          value={section.content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Digite o conteúdo para ${tagInfo.name || 'esta seção'}...`}
        />
      </div>

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

// Optimized comparison function for React.memo to prevent unnecessary re-renders
const areEqual = (prevProps, nextProps) => {
  // Only re-render if section content actually changed
  return (
    prevProps.section.id === nextProps.section.id &&
    prevProps.section.content === nextProps.section.content
    // Skip function comparisons as they may change on every render
    // but functionality remains the same
  );
};

// Export with memoization for performance
export default React.memo(SectionBlock, areEqual);