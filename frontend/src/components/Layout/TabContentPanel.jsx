import React from 'react';
import { cn } from '../../lib/utils';

/**
 * TabContentPanel component - Reusable container for all RightSidebar tab content
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.title - Tab title to display
 * @param {React.ReactNode} props.children - Tab content to render
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.showTitle=true] - Whether to show the title
 * 
 * @example
 * return (
 *   <TabContentPanel title="Chat IA">
 *     <AIAssistant />
 *   </TabContentPanel>
 * )
 * 
 * Integra com: RightSidebar.jsx para layout consistente de todas as abas
 * 
 * IA prompt: Adicionar suporte a ações customizadas no header (botões, filtros)
 */
const TabContentPanel = ({ 
  title, 
  children, 
  className = '', 
  showTitle = true,
  actions
}) => {
  return (
    <div className={cn(
      "h-full flex flex-col bg-theme-background",
      className
    )}>
      {/* Header with title */}
      {showTitle && title && (
        <div className="border-b border-gray-700/30 px-4 py-3 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">
            {title}
          </h3>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
};

export default TabContentPanel;

// Conector: Usado em RightSidebar.jsx para padronizar layout de todas as abas
// Hook: Centraliza controle de estilo - mudanças aqui afetam todas as abas