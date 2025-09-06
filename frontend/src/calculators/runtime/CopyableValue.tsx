import React from 'react';
import { Button } from '../../components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

/**
 * CopyableValue Component - Exibe valores com funcionalidade de cópia
 * 
 * Integrates with:
 * - components/ui/button para botão de cópia
 * - components/ui/Toast para notificações
 * - DynamicCalculator.tsx para exibir resultados
 * 
 * @component
 * @param {Object} props
 * @param {string} props.label - Label do valor
 * @param {string|number} props.value - Valor a ser exibido
 * @param {string} props.unit - Unidade de medida
 * @param {number} props.decimals - Casas decimais para formatação
 * @param {string} props.format - Formato de exibição (number, percentage, etc)
 * @param {boolean} props.loading - Se está carregando
 * @param {string} props.className - Classes CSS adicionais
 * @param {Function} props.onCopy - Callback customizado para cópia
 * 
 * @example
 * return (
 *   <CopyableValue
 *     label="Resultado"
 *     value={42.5}
 *     unit="mL/h"
 *     decimals={2}
 *   />
 * )
 * 
 * Hook: Componente para resultados copiáveis com feedback visual
 * IA prompt: Adicionar formatos de exportação e histórico de cópias
 */
interface CopyableValueProps {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  decimals?: number;
  format?: 'number' | 'percentage' | 'currency';
  loading?: boolean;
  className?: string;
  onCopy?: (text: string) => void;
}

export const CopyableValue: React.FC<CopyableValueProps> = ({
  label,
  value,
  unit = '',
  decimals = 2,
  format = 'number',
  loading = false,
  className = '',
  onCopy
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const formatValue = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined || val === '' || isNaN(Number(val))) {
      return '--';
    }

    const numValue = Number(val);
    
    switch (format) {
      case 'percentage':
        return `${numValue.toFixed(decimals)}%`;
      case 'currency':
        return `R$ ${numValue.toFixed(decimals).replace('.', ',')}`;
      case 'number':
      default:
        return numValue.toFixed(decimals).replace('.', ',');
    }
  };

  const formattedValue = formatValue(value);
  const displayText = `${formattedValue}${unit ? ` ${unit}` : ''}`;
  const copyText = `${label}: ${displayText}`;

  const handleCopy = async () => {
    try {
      if (onCopy) {
        onCopy(copyText);
      } else {
        await navigator.clipboard.writeText(copyText);
      }
      
      setCopied(true);
      toast?.success?.('Valor copiado para a área de transferência!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
      toast?.error?.('Erro ao copiar valor');
    }
  };

  const isValidValue = formattedValue !== '--';

  return (
    <div className={`flex items-center justify-between p-4 bg-theme-surface rounded-lg border border-gray-700/30 ${className}`}>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-400 mb-1">{label}</div>
        <div className="flex items-baseline gap-2">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Calculando...</span>
            </div>
          ) : (
            <>
              <span className={`text-lg font-semibold ${
                isValidValue ? 'text-white' : 'text-gray-500'
              }`}>
                {formattedValue}
              </span>
              {unit && isValidValue && (
                <span className="text-sm text-gray-300">{unit}</span>
              )}
            </>
          )}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        disabled={!isValidValue || loading}
        className={`ml-3 h-8 w-8 p-0 transition-colors ${
          copied 
            ? 'text-emerald-400 hover:text-emerald-300' 
            : 'text-gray-400 hover:text-gray-300'
        }`}
        aria-label={`Copiar ${label}`}
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default CopyableValue;

// Connector: Usado em DynamicCalculator.tsx para exibir resultados
// Hook: Componente para valores copiáveis com feedback visual