/**
 * MAPCalculator - Calculadora de Pressão Arterial Média usando nova arquitetura padronizada
 * 
 * Integrates with:
 * - components/Tools/CalculatorLayout.jsx para interface padronizada
 * - services/ValidationService.js para validação de inputs
 * - data/schemas/map_calculator.json para schema
 * - services/PhysiologicalRanges.js para validação fisiológica
 * 
 * Hook: Exportado em components/Tools/calculators/MAPCalculator.jsx
 * IA prompt: Adicionar integração com monitorização hemodinâmica contínua
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import CalculatorLayout from '../CalculatorLayout';
import { toast } from 'sonner';

/**
 * MAP (Mean Arterial Pressure) Calculator Component
 * 
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {function} props.onOpenChange - Dialog state change handler
 * @param {Object} props.initialInputs - Initial input values
 * @param {Object} props.context - Clinical context
 */
const MAPCalculator = ({ 
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
   * Connector: Integra com data/schemas/map_calculator.json
   */
  const loadCalculatorSchema = async () => {
    try {
      setSchemaLoading(true);
      setError(null);
      
      // Import the schema
      const schemaModule = await import('../../../data/schemas/map_calculator.json');
      setSchema(schemaModule.default || schemaModule);
    } catch (err) {
      console.error('Error loading MAP schema:', err);
      setError('Erro ao carregar configuração da calculadora');
      toast.error('Erro ao carregar calculadora MAP');
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
   * Calculate MAP (Mean Arterial Pressure)
   * @param {Object} calculatorInputs - Input values
   * @param {Object} clinicalContext - Clinical context
   */
  const handleCalculate = async (calculatorInputs, clinicalContext) => {
    try {
      setLoading(true);
      setError(null);
      
      // Extract numeric values
      const systolicBP = parseFloat(calculatorInputs.systolic_bp);
      const diastolicBP = parseFloat(calculatorInputs.diastolic_bp);
      
      // Validate inputs
      if (isNaN(systolicBP) || isNaN(diastolicBP)) {
        throw new Error('Todos os valores devem ser números válidos');
      }
      
      // Clinical validation: diastolic should be less than systolic
      if (diastolicBP >= systolicBP) {
        throw new Error('Pressão diastólica deve ser menor que a sistólica');
      }
      
      // Calculate MAP: DBP + (SBP - DBP)/3
      const map = diastolicBP + (systolicBP - diastolicBP) / 3;
      
      // Determine risk category and interpretation
      const interpretation = getMAPInterpretation(map, systolicBP, diastolicBP);
      
      // Format results
      const calculationResults = {
        outputs: [
          {
            label: 'Pressão Arterial Média (MAP)',
            value: map.toFixed(1),
            unit: 'mmHg',
            description: 'Pressão arterial média calculada'
          },
          {
            label: 'Categoria de Risco',
            value: interpretation.riskCategory,
            unit: '',
            description: 'Classificação baseada no valor da MAP'
          },
          {
            label: 'Pressão de Pulso',
            value: (systolicBP - diastolicBP).toFixed(0),
            unit: 'mmHg',
            description: 'Diferença entre pressão sistólica e diastólica'
          }
        ],
        interpretation: {
          riskLevel: interpretation.riskLevel,
          result: interpretation.result,
          clinicalSignificance: interpretation.clinicalSignificance,
          recommendation: interpretation.recommendation,
          nextSteps: interpretation.nextSteps,
          warnings: interpretation.warnings,
          normalRange: 'MAP normal: 70-100 mmHg'
        },
        rawScore: map,
        inputs: calculatorInputs,
        context: clinicalContext,
        calculatedAt: new Date().toISOString()
      };
      
      setResults(calculationResults);
      toast.success('MAP calculada com sucesso');
      
    } catch (err) {
      console.error('Error calculating MAP:', err);
      setError(err.message || 'Erro ao calcular MAP');
      toast.error('Erro no cálculo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get MAP interpretation based on calculated value
   * @param {number} map - Calculated MAP value
   * @param {number} systolic - Systolic BP
   * @param {number} diastolic - Diastolic BP
   * @returns {Object} Interpretation object
   */
  const getMAPInterpretation = (map, systolic, diastolic) => {
    const pulsePressure = systolic - diastolic;
    
    if (map < 60) {
      return {
        riskLevel: 'critical',
        riskCategory: 'MAP Baixa - Risco Crítico',
        result: 'MAP baixa - risco de hipoperfusão de órgãos vitais',
        clinicalSignificance: 'MAP < 60 mmHg pode comprometer a perfusão de órgãos vitais, especialmente rins e cérebro.',
        recommendation: 'Avaliação hemodinâmica urgente necessária',
        nextSteps: [
          'Verificar volemia e status hídrico',
          'Avaliar função cardíaca (débito cardíaco)',
          'Considerar suporte vasopressor se necessário',
          'Monitorizar débito urinário e lactato sérico'
        ],
        warnings: ['Risco de choque e falência de múltiplos órgãos']
      };
    } else if (map >= 60 && map <= 70) {
      return {
        riskLevel: 'warning',
        riskCategory: 'MAP Limítrofe',
        result: 'MAP limítrofe - requer monitorização cuidadosa',
        clinicalSignificance: 'MAP entre 60-70 mmHg está no limite inferior da normalidade.',
        recommendation: 'Monitorização contínua e avaliação de sinais de hipoperfusão',
        nextSteps: [
          'Avaliar sinais clínicos de hipoperfusão',
          'Monitorizar débito urinário (>0,5 mL/kg/h)',
          'Verificar perfusão periférica e enchimento capilar',
          'Considerar otimização hemodinâmica se sintomático'
        ],
        warnings: pulsePressure < 25 ? ['Pressão de pulso baixa pode indicar baixo débito cardíaco'] : []
      };
    } else if (map > 70 && map <= 100) {
      return {
        riskLevel: 'normal',
        riskCategory: 'MAP Normal',
        result: 'MAP dentro da faixa normal',
        clinicalSignificance: 'MAP adequada para perfusão de órgãos vitais na maioria dos pacientes.',
        recommendation: 'Manter monitorização de rotina',
        nextSteps: [
          'Seguimento conforme protocolo institucional',
          'Manter medidas de suporte conforme necessário'
        ],
        warnings: pulsePressure > 60 ? ['Pressão de pulso elevada pode indicar rigidez arterial'] : []
      };
    } else if (map > 100 && map <= 110) {
      return {
        riskLevel: 'warning',
        riskCategory: 'MAP Elevada',
        result: 'MAP elevada - avaliar necessidade de tratamento',
        clinicalSignificance: 'MAP elevada pode indicar hipertensão arterial.',
        recommendation: 'Avaliar necessidade de tratamento anti-hipertensivo',
        nextSteps: [
          'Confirmar medidas em momentos diferentes',
          'Avaliar presença de lesão de órgão-alvo',
          'Considerar tratamento se hipertensão confirmada',
          'Investigar causas secundárias se apropriado'
        ],
        warnings: ['Risco cardiovascular aumentado se persistente']
      };
    } else {
      return {
        riskLevel: 'critical',
        riskCategory: 'MAP Muito Elevada - Emergência',
        result: 'MAP muito elevada - risco de emergência hipertensiva',
        clinicalSignificance: 'MAP > 110 mmHg pode indicar crise hipertensiva com risco de lesão de órgão-alvo.',
        recommendation: 'Avaliação urgente para emergência hipertensiva',
        nextSteps: [
          'Avaliar sintomas neurológicos (cefaleia, alterações visuais)',
          'Investigar lesão de órgão-alvo (coração, rins, cérebro)',
          'Considerar redução controlada da pressão arterial',
          'Internação em unidade de cuidados intensivos se necessário'
        ],
        warnings: [
          'Risco de AVC, infarto do miocárdio e insuficiência renal aguda',
          'Redução muito rápida da PA pode causar isquemia cerebral'
        ]
      };
    }
  };

  if (schemaLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando Calculadora MAP...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error && !schema) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Erro ao Carregar Calculadora</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-red-600">
            {error}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calculadora de Pressão Arterial Média (MAP)</DialogTitle>
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

export default MAPCalculator;