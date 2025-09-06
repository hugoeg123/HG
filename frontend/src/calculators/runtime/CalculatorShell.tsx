import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Info, Calculator } from 'lucide-react';
import { FormulaNote } from './FormulaNote';
import { ReferenceList } from './ReferenceList';

/**
 * CalculatorShell Component - Shell principal para todas as calculadoras
 * 
 * Integrates with:
 * - components/ui/* para componentes shadcn
 * - FormulaNote.tsx e ReferenceList.tsx para informações
 * - DynamicCalculator.tsx como container principal
 * 
 * @component
 * @param {Object} props
 * @param {string} props.title - Título da calculadora
 * @param {string} props.description - Descrição da calculadora
 * @param {Array} props.tabs - Array de tabs para calculadora bidirecional
 * @param {React.ReactNode} props.children - Conteúdo dos inputs/outputs
 * @param {string} props.disclaimer - Disclaimer clínico
 * @param {Array} props.references - Referências bibliográficas
 * @param {string} props.formulaNote - Nota sobre a fórmula
 * @param {string} props.activeTab - Tab ativa atual
 * @param {Function} props.onTabChange - Callback para mudança de tab
 * 
 * @example
 * return (
 *   <CalculatorShell 
 *     title="Conversão de Gotejamento"
 *     description="Converte entre gotas/min e mL/h"
 *     tabs={[{id: 'tab1', label: 'Conversão'}]}
 *     disclaimer="Esta ferramenta não substitui julgamento clínico."
 *   >
 *     <div>Inputs e outputs aqui</div>
 *   </CalculatorShell>
 * )
 * 
 * Hook: Componente base reutilizável para todas as calculadoras
 * IA prompt: Adicionar suporte a temas personalizados e layouts responsivos
 */
interface CalculatorShellProps {
  title: string;
  description?: string;
  tabs?: Array<{
    id: string;
    label: string;
    howto?: string[];
  }>;
  children: React.ReactNode;
  disclaimer?: string;
  references?: string[];
  formulaNote?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export const CalculatorShell: React.FC<CalculatorShellProps> = ({
  title,
  description,
  tabs = [],
  children,
  disclaimer,
  references = [],
  formulaNote,
  activeTab,
  onTabChange,
  className = ''
}) => {
  const hasTabs = tabs.length > 0;
  const currentTab = tabs.find(tab => tab.id === activeTab) || tabs[0];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Card */}
      <Card className="bg-theme-card border-theme-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Calculator className="h-5 w-5 text-emerald-400" />
            {title}
          </CardTitle>
          {description && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Info className="h-4 w-4" />
              <span>{description}</span>
            </div>
          )}
        </CardHeader>
        
        {/* Como usar - exibido quando há tab ativa */}
        {currentTab?.howto && (
          <CardContent className="pt-0">
            <div className="bg-theme-surface rounded-lg p-4 border border-gray-700/30">
              <h4 className="text-sm font-medium text-emerald-300 mb-2">Como usar:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                {currentTab.howto.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-medium">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Calculator Card */}
      <Card className="bg-theme-card border-theme-border">
        <CardContent className="p-6">
          {hasTabs ? (
            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-theme-surface">
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-300"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-0">
                  {children}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            children
          )}
        </CardContent>
      </Card>

      {/* Formula Note */}
      {formulaNote && (
        <FormulaNote formula={formulaNote} />
      )}

      {/* References and Disclaimer */}
      <div className="space-y-4">
        {references.length > 0 && (
          <ReferenceList references={references} />
        )}
        
        {disclaimer && (
          <Card className="bg-amber-900/20 border-amber-700/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-200">
                  <strong className="text-amber-300">Disclaimer:</strong> {disclaimer}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CalculatorShell;

// Connector: Usado em DynamicCalculator.tsx como container principal
// Hook: Exportado para uso em todas as páginas de calculadoras