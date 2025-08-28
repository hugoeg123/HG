import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { BookOpen } from 'lucide-react';

/**
 * ReferenceList Component - Exibe referências bibliográficas das calculadoras
 * 
 * Integrates with:
 * - components/ui/card para layout consistente
 * - CalculatorShell.tsx como componente filho
 * 
 * @component
 * @param {Object} props
 * @param {string[]} props.references - Array de referências bibliográficas
 * @param {string} props.title - Título opcional para a seção
 * @param {string} props.className - Classes CSS adicionais
 * 
 * @example
 * return (
 *   <ReferenceList 
 *     references={[
 *       "Protocolo institucional de infusões",
 *       "Literatura de enfermagem para macro/microgotas"
 *     ]}
 *   />
 * )
 * 
 * Hook: Componente informativo para rastreabilidade clínica
 * IA prompt: Adicionar links para referências online e sistema de citações
 */
interface ReferenceListProps {
  references: string[];
  title?: string;
  className?: string;
}

export const ReferenceList: React.FC<ReferenceListProps> = ({
  references,
  title = 'Referências',
  className = ''
}) => {
  if (!references || references.length === 0) {
    return null;
  }

  return (
    <Card className={`bg-theme-surface border-theme-border ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-300 mb-3">{title}:</h4>
            <ul className="space-y-2">
              {references.map((reference, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-400 font-medium text-sm mt-0.5">
                    {index + 1}.
                  </span>
                  <span className="text-sm text-gray-300 leading-relaxed">
                    {reference}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferenceList;

// Connector: Usado em CalculatorShell.tsx para exibir referências
// Hook: Componente informativo para responsabilidade clínica