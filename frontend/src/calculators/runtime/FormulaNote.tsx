import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Calculator } from 'lucide-react';

/**
 * FormulaNote Component - Exibe fórmulas matemáticas das calculadoras
 * 
 * Integrates with:
 * - components/ui/card para layout consistente
 * - CalculatorShell.tsx como componente filho
 * 
 * @component
 * @param {Object} props
 * @param {string} props.formula - Fórmula matemática a ser exibida
 * @param {string} props.title - Título opcional para a seção
 * @param {string} props.className - Classes CSS adicionais
 * 
 * @example
 * return (
 *   <FormulaNote 
 *     formula="gtt/min = (dose × kg × fator) / conc_(mcg/mL)"
 *     title="Fórmula de Conversão"
 *   />
 * )
 * 
 * Hook: Componente informativo para rastreabilidade clínica
 * IA prompt: Adicionar renderização LaTeX e validação de sintaxe matemática
 */
interface FormulaNoteProps {
  formula: string;
  title?: string;
  className?: string;
}

export const FormulaNote: React.FC<FormulaNoteProps> = ({
  formula,
  title = 'Fórmula',
  className = ''
}) => {
  return (
    <Card className={`bg-theme-surface border-theme-border ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Calculator className="h-4 w-4 text-teal-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-teal-300 mb-2">{title}:</h4>
            <div className="bg-gray-900/50 rounded-md p-3 border border-gray-700/30">
              <code className="text-sm text-gray-200 font-mono break-all">
                {formula}
              </code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormulaNote;

// Connector: Usado em CalculatorShell.tsx para exibir fórmulas
// Hook: Componente informativo para transparência de cálculos