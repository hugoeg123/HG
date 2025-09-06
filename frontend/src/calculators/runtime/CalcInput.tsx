import React from 'react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { Info } from 'lucide-react';

/**
 * CalcInput Component - Input wrapper com validação e estilo emerald focus
 * 
 * Integrates with:
 * - components/ui/* para componentes shadcn
 * - DynamicCalculator.tsx para renderização de campos
 * - Aplica classes emerald-focus para realce translúcido
 * 
 * @component
 * @param {Object} props
 * @param {string} props.id - ID único do input
 * @param {string} props.label - Label do campo
 * @param {string} props.type - Tipo do input (number, text, select)
 * @param {string|number} props.value - Valor atual
 * @param {Function} props.onChange - Callback de mudança
 * @param {string} props.placeholder - Placeholder do input
 * @param {string} props.unit - Unidade de medida
 * @param {string} props.helper - Texto de ajuda
 * @param {boolean} props.required - Se é obrigatório
 * @param {Array} props.options - Opções para select
 * @param {number} props.min - Valor mínimo
 * @param {number} props.max - Valor máximo
 * @param {number} props.decimals - Casas decimais
 * @param {boolean} props.disabled - Se está desabilitado
 * @param {string} props.error - Mensagem de erro
 * 
 * @example
 * return (
 *   <CalcInput
 *     id="weight"
 *     label="Peso (kg)"
 *     type="number"
 *     value={weight}
 *     onChange={handleWeightChange}
 *     placeholder="Ex: 70"
 *     unit="kg"
 *     min={0.5}
 *     decimals={2}
 *   />
 * )
 * 
 * Hook: Input wrapper com estilo emerald focus e validação
 * IA prompt: Adicionar máscaras de input e validação em tempo real
 */
interface CalcInputProps {
  id: string;
  label: string;
  type?: 'number' | 'text' | 'select';
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  unit?: string;
  helper?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  decimals?: number;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const CalcInput: React.FC<CalcInputProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  unit,
  helper,
  required = false,
  options = [],
  min,
  max,
  decimals,
  disabled = false,
  error,
  className = ''
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    if (type === 'number') {
      // Handle decimal separator (PT-BR format)
      newValue = newValue.replace(',', '.');
      
      // Apply min/max constraints
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue)) {
        if (min !== undefined && numValue < min) return;
        if (max !== undefined && numValue > max) return;
      }
    }
    
    onChange(newValue);
  };

  const handleSelectChange = (newValue: string) => {
    onChange(newValue);
  };

  const formatDisplayValue = (val: string | number): string => {
    if (type === 'number' && typeof val === 'number') {
      return decimals !== undefined ? val.toFixed(decimals).replace('.', ',') : val.toString().replace('.', ',');
    }
    return val.toString();
  };

  const inputClasses = `
    emerald-focus
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Label 
          htmlFor={id} 
          className={`text-sm font-medium text-gray-200 ${
            required ? "after:content-['*'] after:text-red-400 after:ml-1" : ''
          }`}
        >
          {label}
          {unit && <span className="text-gray-400 font-normal ml-1">({unit})</span>}
        </Label>
        
        {helper && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400 hover:text-gray-300 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{helper}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {type === 'select' ? (
        <Select value={value.toString()} onValueChange={handleSelectChange} disabled={disabled}>
          <SelectTrigger className={inputClasses} id={id}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          type={type === 'number' ? 'text' : type}
          value={formatDisplayValue(value)}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          aria-describedby={helper ? `${id}-helper` : undefined}
          aria-invalid={!!error}
          inputMode={type === 'number' ? 'decimal' : undefined}
        />
      )}

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      
      {helper && !error && (
        <p id={`${id}-helper`} className="text-xs text-gray-400">
          {helper}
        </p>
      )}
    </div>
  );
};

export default CalcInput;

// Connector: Usado em DynamicCalculator.tsx para renderizar campos de input
// Hook: Input wrapper com validação e estilo emerald focus