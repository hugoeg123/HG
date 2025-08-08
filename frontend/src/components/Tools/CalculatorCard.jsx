import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

/**
 * CalculatorCard component - Displays individual calculator information in card format
 * 
 * @component
 * @param {Object} calculator - Calculator object with name, description, category, inputs, outputs
 * @param {Function} onUse - Callback function when "Usar" button is clicked
 * @example
 * return (
 *   <CalculatorCard 
 *     calculator={{
 *       name: "IMC", 
 *       description: "Calcula índice de massa corporal", 
 *       category: "Geral",
 *       inputs: [{key: 'weight', label: 'Peso'}],
 *       outputs: [{key: 'result', label: 'Resultado'}]
 *     }}
 *     onUse={() => openCalculator(calculator)}
 *   />
 * )
 * 
 * Integrates with:
 * - Calculators.jsx for grid display
 * - CalculatorModal.jsx via onUse callback
 * - store/calculatorStore.js for calculator data structure
 * 
 * IA prompt: Add calculator preview, execution time estimation, and usage analytics
 */
const CalculatorCard = ({ calculator, onUse }) => {
  const getIconForCategory = (category) => {
    // Hook: Mapeia categorias para ícones específicos, extensível para novas categorias médicas
    const icons = {
      'Cardiologia': (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      'Endocrinologia': (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      'Geral': (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    };
    return icons[category] || icons['Geral'];
  };

  const getCategoryColor = (category) => {
    // Hook: Define cores por categoria, sincronizado com tema do Health Guardian
    const colors = {
      'Cardiologia': 'text-red-400',
      'Endocrinologia': 'text-yellow-400',
      'Geral': 'text-teal-400',
    'Pessoal': 'text-teal-300'
    };
    return colors[category] || colors['Geral'];
  };

  return (
    <Card className="bg-theme-card border-gray-700 hover:border-gray-600 transition-colors cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`${getCategoryColor(calculator.category || 'Geral')} group-hover:scale-110 transition-transform`}>
              {getIconForCategory(calculator.category || 'Geral')}
            </div>
            <div className="flex-1">
              <CardTitle className="text-white text-lg font-semibold">
                {calculator.name || 'Calculadora sem nome'}
              </CardTitle>
              {calculator.category && (
                <Badge 
                  variant="secondary" 
                  className="mt-1 bg-gray-700 text-gray-300 text-xs"
                >
                  {calculator.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <CardDescription className="text-gray-400 text-sm leading-relaxed">
          {calculator.description || 'Sem descrição disponível'}
        </CardDescription>
        
        {/* Additional info for personal calculators */}
        {calculator.isPersonal && calculator.lastUsed && (
          <div className="mt-3 text-xs text-gray-500 flex items-center">
            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Usado recentemente
          </div>
        )}
        
        {/* Input count indicator */}
        {calculator.inputs && calculator.inputs.length > 0 && (
          <div className="mt-3 text-xs text-gray-500 flex items-center">
            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {calculator.inputs.length} entrada{calculator.inputs.length !== 1 ? 's' : ''}
          </div>
        )}
        
        {/* Legacy field count support */}
        {calculator.fields && calculator.fields.length > 0 && !calculator.inputs && (
          <div className="mt-3 text-xs text-gray-500 flex items-center">
            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {calculator.fields.length} campo{calculator.fields.length !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            onUse(calculator);
          }}
          className="btn btn-primary w-full"
          size="sm"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M16 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Usar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CalculatorCard;

// Connector: Used in Calculators.jsx for grid rendering, integrates with CalculatorModal.jsx via onUse callback
// Hook: Supports both legacy (fields) and new (inputs/outputs) calculator data structures