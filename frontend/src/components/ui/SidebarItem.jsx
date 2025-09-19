import React from 'react';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';

/**
 * SidebarItem component - Componente reutilizável para itens de barras laterais
 * 
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isActive - Se o item está ativo/selecionado
 * @param {string} props.title - Título principal do item
 * @param {string} [props.subtitle] - Subtítulo opcional
 * @param {React.ReactNode} [props.icon] - Ícone opcional
 * @param {Function} props.onClick - Função chamada ao clicar no item
 * @param {string} [props.className] - Classes CSS adicionais
 * @param {React.ReactNode} [props.children] - Conteúdo adicional
 * @param {boolean} [props.disabled=false] - Se o item está desabilitado
 * 
 * @example
 * return (
 *   <SidebarItem 
 *     isActive={selectedId === item.id}
 *     title="João Silva"
 *     subtitle="30 anos"
 *     icon={<UserIcon />}
 *     onClick={() => handleSelect(item.id)}
 *   />
 * )
 * 
 * Integra com: LeftSidebar.jsx e KnowledgeBase.jsx para consistência visual
 * 
 * IA prompt: Adicionar suporte a badges, notificações e estados de loading
 */
const SidebarItem = ({ 
  isActive = false,
  title,
  subtitle,
  icon,
  onClick,
  className = '',
  children,
  disabled = false,
  ...props
}) => {
  const { isDarkMode } = useThemeStore();

  // Base container + theme-aware text color
  const baseClasses = "bg-theme-card border border-theme-border rounded-lg p-3 transition-all duration-200 cursor-pointer";
  const textClasses = isDarkMode ? "text-gray-300" : "text-gray-700";
  
  // Hover should lighten bg and adjust text per theme
  const hoverClasses = isDarkMode 
    ? "hover:bg-theme-surface hover:text-white"
    : "hover:bg-theme-surface hover:text-gray-900";
  
  // Active state must define border, bg and text per theme
  const activeClasses = isActive 
    ? (isDarkMode
        ? "border-teal-500 bg-teal-600/20 text-teal-300"
        : "border-blue-500 bg-blue-600/10 text-blue-700")
    : "";
  
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        baseClasses,
        textClasses,
        hoverClasses,
        activeClasses,
        // Disabled state
        disabled && "opacity-50 cursor-not-allowed hover:bg-theme-card",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {icon && (
          <div className={cn(
            "flex-shrink-0 transition-colors duration-200",
            isActive 
              ? (isDarkMode ? "text-teal-300" : "text-blue-600")
              : (isDarkMode ? "text-gray-400" : "text-gray-500")
          )}>
            {icon}
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-medium text-base transition-colors truncate">
            {title}
          </h3>
          
          {/* Subtitle */}
          {subtitle && (
            <p className={cn(
              "text-sm mt-1 leading-relaxed truncate",
              isDarkMode ? "text-gray-300" : "text-gray-600"
            )}>
              {subtitle}
            </p>
          )}
          
          {/* Additional children content */}
          {children && (
            <div className="mt-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarItem;

// Conector: Usado em LeftSidebar.jsx para itens de pacientes e KnowledgeBase.jsx para artigos
// Hook: Centraliza estilo de itens de sidebar - mudanças aqui afetam toda a interface