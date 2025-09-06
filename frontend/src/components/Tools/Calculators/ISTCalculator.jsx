/**
 * ISTCalculator - Calculadora do Índice de Saturação de Transferrina usando nova arquitetura padronizada
 * 
 * Integrates with:
 * - components/Tools/CalculatorLayout.jsx para interface padronizada
 * - services/ValidationService.js para validação de inputs
 * - data/schemas/ist_calculator.json para schema
 * - services/PhysiologicalRanges.js para validação fisiológica
 * 
 * Hook: Exportado em components/Tools/calculators/ISTCalculator.jsx
 * IA prompt: Adicionar integração com receptor solúvel de transferrina e hepcidina
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import CalculatorLayout from '../CalculatorLayout';
import { toast } from 'sonner';

/**
 * IST (Iron Saturation Index / Transferrin Saturation) Calculator Component
 * 
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {function} props.onOpenChange - Dialog state change handler
 * @param {Object} props.initialInputs - Initial input values
 * @param {Object} props.context - Clinical context (sex, age, etc.)
 */
const ISTCalculator = ({ 
  open, 
  onOpenChange, 
  initialInputs = {},
  context = {} 
}) => {
  const [schema, setSchema] = useState(null);
  const [inputs, setInputs] = useState(initialInputs);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(true);

  // Load calculator schema on mount
  useEffect(() => {
    loadCalculatorSchema();
  }, []);

  // Update inputs when initialInputs change
  useEffect(() => {
    setInputs(prev => ({ ...prev, ...initialInputs }));
  }, [initialInputs]);

  /**
   * Load calculator schema
   * Connector: Integra com data/schemas/ist_calculator.json
   */
  const loadCalculatorSchema = async () => {
    try {
      setSchemaLoading(true);
      setError(null);
      
      // Import the schema
      const schemaModule = await import('../../../data/schemas/ist_calculator.json');
      setSchema(schemaModule.default || schemaModule);
    } catch (err) {
      console.error('Error loading IST schema:', err);
      setError('Erro ao carregar configuração da calculadora');
      toast.error('Erro ao carregar calculadora IST');
    } finally {
      setSchemaLoading(false);
    }
  };

  /**
   * Handle input changes
   * @param {string} inputKey - Input field key
   * @param {*} value - New value
   * @param {Object} allInputs - All current inputs
   */
  const handleInputChange = (inputKey, value, allInputs) => {
    setInputs(allInputs);
    
    // Clear results when inputs change
    if (results) {
      setResults(null);
    }
    
    // Clear any previous errors
    if (error) {
      setError(null);
    }
  };

  /**
   * Calculate IST (Iron Saturation Index)
   * @param {Object} calculatorInputs - Input values
   * @param {Object} clinicalContext - Clinical context
   */
  const handleCalculate = async (calculatorInputs, clinicalContext) => {
    try {
      setLoading(true);
      setError(null);
      
      // Extract numeric values
      const serumIron = parseFloat(calculatorInputs.serum_iron);
      const tibc = parseFloat(calculatorInputs.tibc);
      
      // Validate inputs
      if (isNaN(serumIron) || isNaN(tibc)) {
        throw new Error('Todos os valores devem ser números válidos');
      }
      
      if (tibc <= 0) {
        throw new Error('CTLF deve ser maior que zero');
      }
      
      // Clinical validation: TIBC should be greater than serum iron
      if (serumIron >= tibc) {
        throw new Error('CTLF deve ser maior que o ferro sérico. Verificar valores.');
      }
      
      // Calculate IST: (Serum Iron / TIBC) × 100
      const istPercent = (serumIron / tibc) * 100;
      
      // Calculate additional parameters
      const uibc = tibc - serumIron; // Unsaturated Iron Binding Capacity
      
      // Determine interpretation
      const interpretation = getISTInterpretation(istPercent, serumIron, tibc, clinicalContext);
      
      // Format results
      const calculationResults = {
        outputs: [
          {
            label: 'Índice de Saturação de Transferrina (IST)',
            value: `${istPercent.toFixed(1)}%`,
            unit: '',
            description: 'Percentual de saturação da transferrina'
          },
          {
            label: 'Interpretação',
            value: interpretation.result,
            unit: '',
            description: 'Classificação do status do ferro'
          },
          {
            label: 'Capacidade de Ligação Não Saturada (UIBC)',
            value: `${uibc.toFixed(0)} μg/dL`,
            unit: '',
            description: 'Capacidade restante de ligação do ferro'
          },
          {
            label: 'Razão Ferro/CTLF',
            value: (serumIron / tibc).toFixed(3),
            unit: '',
            description: 'Razão direta entre ferro sérico e CTLF'
          }
        ],
        interpretation: {
          riskLevel: interpretation.riskLevel,
          result: interpretation.result,
          clinicalSignificance: interpretation.clinicalSignificance,
          recommendation: interpretation.recommendation,
          nextSteps: interpretation.nextSteps,
          associatedFindings: interpretation.associatedFindings,
          additionalTests: interpretation.additionalTests,
          warnings: interpretation.warnings,
          normalRange: 'IST normal: 20-45%'
        },
        rawScore: istPercent,
        uibc: uibc,
        inputs: calculatorInputs,
        context: clinicalContext,
        calculatedAt: new Date().toISOString()
      };
      
      setResults(calculationResults);
      toast.success('IST calculado com sucesso');
      
    } catch (err) {
      console.error('Error calculating IST:', err);
      setError(err.message || 'Erro ao calcular IST');
      toast.error('Erro no cálculo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get IST interpretation based on calculated value and clinical context
   * @param {number} ist - IST percentage
   * @param {number} serumIron - Serum iron level
   * @param {number} tibc - Total iron binding capacity
   * @param {Object} context - Clinical context
   * @returns {Object} Interpretation object
   */
  const getISTInterpretation = (ist, serumIron, tibc, context) => {
    const isMale = context.sex === 'male';
    const isChild = context.age && context.age < 18;
    
    // Determine normal ranges based on demographics
    const normalIronRange = isMale ? '65-175 μg/dL' : 
                           isChild ? '50-120 μg/dL' : '50-170 μg/dL';
    
    if (ist < 16) {
      return {
        riskLevel: 'critical',
        result: 'Deficiência de Ferro Severa',
        clinicalSignificance: `IST ${ist.toFixed(1)}% indica deficiência de ferro severa com depleção completa dos estoques. Anemia ferropriva provável.`,
        recommendation: 'Reposição imediata de ferro e investigação da causa',
        nextSteps: [
          'Iniciar reposição de ferro (oral 100-200mg/dia ou parenteral se má absorção)',
          'Hemograma completo com índices eritrocitários',
          'Dosagem de ferritina sérica (esperado <15 ng/mL)',
          'Investigar sangramento (pesquisa de sangue oculto nas fezes)',
          'Considerar endoscopia digestiva se >50 anos ou sintomas',
          'Avaliação ginecológica em mulheres (menorragia)',
          'Reavaliação em 4-6 semanas'
        ],
        associatedFindings: [
          'Anemia microcítica hipocroma',
          'Ferritina muito baixa (<15 ng/mL)',
          'CTLF elevada (>400 μg/dL)',
          'RDW elevado',
          'Possível coiloníquia (unhas em colher)'
        ],
        additionalTests: [
          'Ferritina sérica',
          'Receptor solúvel de transferrina',
          'Pesquisa de sangue oculto nas fezes',
          'Endoscopia digestiva',
          'Avaliação de má absorção se indicado'
        ],
        warnings: ['Risco de anemia severa e sintomas sistêmicos']
      };
    } else if (ist >= 16 && ist < 20) {
      return {
        riskLevel: 'warning',
        result: 'Deficiência de Ferro Leve a Moderada',
        clinicalSignificance: `IST ${ist.toFixed(1)}% sugere deficiencia de ferro inicial ou depletacao dos estoques sem anemia estabelecida.`,
        recommendation: 'Reposição de ferro e monitoramento',
        nextSteps: [
          'Reposição de ferro oral (100mg/dia)',
          'Hemograma de controle em 4 semanas',
          'Dosagem de ferritina sérica',
          'Investigar possíveis causas de perda'
        ],
        associatedFindings: [
          'Ferritina baixa (15-30 ng/mL)',
          'CTLF ligeiramente elevada',
          'Possível anemia leve'
        ],
        additionalTests: [
          'Ferritina sérica',
          'Hemograma completo'
        ],
        warnings: ['Monitorar evolução para anemia']
      };
    } else if (ist >= 20 && ist <= 45) {
      return {
        riskLevel: 'normal',
        result: 'Status de Ferro Normal',
        clinicalSignificance: `IST ${ist.toFixed(1)}% está dentro da faixa normal, indicando equilíbrio adequado entre ferro sérico e capacidade de transporte.`,
        recommendation: 'Manter status atual',
        nextSteps: [
          'Monitoramento de rotina',
          'Manter dieta equilibrada'
        ],
        associatedFindings: [
          'Ferritina normal (30-300 ng/mL)',
          'CTLF normal (250-400 μg/dL)'
        ],
        additionalTests: [],
        warnings: []
      };
    } else {
      return {
        riskLevel: 'warning',
        result: 'Sobrecarga de Ferro',
        clinicalSignificance: `IST ${ist.toFixed(1)}% sugere sobrecarga de ferro. Investigar hemocromatose ou outras causas.`,
        recommendation: 'Investigação de sobrecarga de ferro',
        nextSteps: [
          'Dosagem de ferritina sérica',
          'Teste genético para hemocromatose (HFE)',
          'Avaliação hepática',
          'Considerar flebotomia terapêutica'
        ],
        associatedFindings: [
          'Ferritina elevada (>300 ng/mL)',
          'Possível hepatomegalia',
          'Alterações hepáticas'
        ],
        additionalTests: [
          'Ferritina sérica',
          'Enzimas hepáticas',
          'Teste genético HFE',
          'RM hepática T2*'
        ],
        warnings: ['Risco de dano hepático e cardíaco']
      };
    }
  };

  // Show loading state while schema loads
  if (schemaLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando Calculadora IST...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show error state if schema failed to load
  if (error && !schema) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Erro na Calculadora IST</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadCalculatorSchema}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Tentar Novamente
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calculadora IST - Índice de Saturação de Transferrina</DialogTitle>
        </DialogHeader>
        
        {schema && (
          <CalculatorLayout
            schema={schema}
            inputs={inputs}
            results={results}
            loading={loading}
            error={error}
            onInputChange={handleInputChange}
            onCalculate={handleCalculate}
            context={context}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ISTCalculator;

// Conector: Integra com Calculators.jsx para exibição na interface principal