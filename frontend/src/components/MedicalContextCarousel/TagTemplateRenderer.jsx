import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Hash, 
  Plus 
} from 'lucide-react';
import TagToolbar from '../PatientView/TagToolbar'; // Reusing original component for Flat list

/**
 * TagTemplateRenderer
 * 
 * Renders the list of tags based on the selected template type.
 * All templates now share the same "Collapsible Category -> Tag List" aesthetics.
 */
export default function TagTemplateRenderer({ 
  template, 
  availableTags, 
  onInsertTag, 
  onCreateTag,
  categoriesConfig 
}) {
  const [expandedSections, setExpandedSections] = useState({});

  // Unified Renderer for Structured Lists (SOAP, Systems, Trauma)
  const StructuredListRenderer = ({ template }) => {
    return (
      <div className="space-y-2">
        {template.sections?.map((section, idx) => {
          // Default: Closed by default
          const isOpen = expandedSections[section.title] || false; 
          const toggle = () => setExpandedSections(prev => ({ ...prev, [section.title]: !prev[section.title] }));
          const Icon = section.icon;

          return (
            <div key={idx}>
              {/* Category Header - Mimics TagToolbar Header */}
              <button
                onClick={toggle}
                className="w-full flex justify-between items-center p-2 text-gray-300 font-semibold rounded-md hover:bg-theme-surface transition-colors"
                aria-expanded={isOpen}
              >
                <span className="flex items-center gap-2">
                  {Icon && <Icon size={16} className="text-teal-500" />} 
                  {section.title}
                </span>
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>

              {/* Items List */}
              {isOpen && (
                <div className="pl-4 pt-2 space-y-2">
                  {section.items?.map((item) => (
                    <div key={item.key}>
                      {/* Main Tag Button */}
                      <button
                        onClick={() => onInsertTag(item.key)}
                        className="w-full text-left p-1.5 text-sm text-gray-300 hover:text-white hover:bg-theme-surface rounded flex items-center gap-2 transition-colors"
                        title={`Inserir: ${item.label}`}
                      >
                        <Hash size={14} className="text-teal-400 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>

                      {/* Subitems (Nested Tags) */}
                      {item.subitems && item.subitems.length > 0 && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.subitems.map((sub) => (
                            <button
                              key={sub.key}
                              onClick={() => onInsertTag(sub.key)}
                              className="w-full text-left p-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-theme-surface rounded flex items-center gap-2 transition-colors"
                              title={`Inserir: ${sub.label}`}
                            >
                              <Hash size={12} className="text-cyan-400 flex-shrink-0" />
                              <span className="truncate">{sub.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // --- MAIN RENDER LOGIC ---

  // Legacy/Flat Template -> Reuse TagToolbar
  if (!template || template.type === 'dynamic_kboard') {
    return (
      <TagToolbar 
        availableTags={availableTags}
        onInsertTag={onInsertTag}
        onCreateTag={onCreateTag}
        categoriesConfig={categoriesConfig}
      />
    );
  }

  // All other types (structured_list, checklist, etc) use the Unified Renderer
  return (
    <div className="w-full bg-theme-card p-4 rounded-xl mb-6 border border-gray-700">
       {/* Create New Button (Always visible) */}
       <button
          onClick={() => onCreateTag && onCreateTag()}
          className="w-full mb-4 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-500 hover:to-cyan-600 text-white font-bold px-3 py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-900/50 transition-all transform active:scale-95"
      >
          <Plus size={18} />
          <span>Nova Tag</span>
      </button>

      <StructuredListRenderer template={template} />
    </div>
  );
}
