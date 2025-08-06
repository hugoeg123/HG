import React from 'react';
import { cn } from '../../lib/utils';

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
  // Classes de base com cor do texto para evitar problemas
  const baseClasses = "bg-theme-card text-gray-300 border border-theme-border rounded-lg p-3 transition-all duration-200 cursor-pointer";
  
  // O hover deve clarear o fundo E o texto
  const hoverClasses = "hover:bg-theme-surface hover:text-white";
  
  // O estado ativo deve definir a cor do texto também
  const activeClasses = isActive ? "border-teal-500 bg-teal-600/20 text-teal-300" : "border-theme-border";
  
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        baseClasses,
        hoverClasses,
        activeClasses,
        // Disabled state
        disabled && "opacity-50 cursor-not-allowed hover:bg-theme-card hover:text-gray-300",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {icon && (
          <div className={cn(
            "flex-shrink-0 transition-colors duration-200",
            isActive ? "text-teal-300" : "text-gray-400"
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
            <p className="text-gray-300 text-sm mt-1 leading-relaxed truncate">
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