import React from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './button';

/**
 * CopyableValue Component
 * 
 * A reusable component that displays a label-value pair with copy functionality.
 * Provides visual feedback when copying values to clipboard.
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - The label to display
 * @param {string|number} props.value - The value to display and copy
 * @param {string} [props.suffix=''] - Optional suffix to append to the value
 * @param {string} [props.color='text-white'] - Text color class for the value
 * @param {React.ReactNode} [props.icon=null] - Optional icon to display
 * @param {string} [props.className=''] - Additional CSS classes
 * 
 * @example
 * <CopyableValue 
 *   label="Heart Rate" 
 *   value={75} 
 *   suffix=" bpm" 
 *   color="text-green-400" 
 * />
 * 
 * Connector: Used across multiple calculator components for consistent copy behavior
 * Hook: Integrates with sonner toast for user feedback
 */
function CopyableValue({ 
  label, 
  value, 
  suffix = '', 
  color = 'text-white', 
  icon = null, 
  className = '' 
}) {
  const handleCopy = async () => {
    try {
      const textToCopy = `${value}${suffix}`;
      await navigator.clipboard.writeText(textToCopy);
      toast.success(`${label} copiado: ${textToCopy}`);
    } catch (error) {
      toast.error('Erro ao copiar valor');
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 bg-gray-800 rounded-lg ${className}`}>
      <div className="flex items-center gap-2">
        {icon && <span className={color}>{icon}</span>}
        <span className="text-gray-300">{label}:</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-mono font-semibold ${color}`}>
          {value}{suffix}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 w-8 p-0 hover:bg-gray-700"
          title={`Copiar ${label}`}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default CopyableValue;