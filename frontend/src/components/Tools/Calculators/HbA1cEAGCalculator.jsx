/**
 * HbA1cEAGCalculator - Calculadora de Glicemia Média Estimada a partir da HbA1c usando nova arquitetura padronizada
 * 
 * Integrates with:
 * - components/Tools/CalculatorLayout.jsx para interface padronizada
 * - services/ValidationService.js para validação de inputs
 * - data/schemas/hba1c_eag_calculator.json para schema
 * - services/PhysiologicalRanges.js para validação fisiológica
 * 
 * Hook: Exportado em components/Tools/calculators/HbA1cEAGCalculator.jsx
 * IA prompt: Adicionar integração com monitorização glicêmica contínua e variabilidade glicêmica
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import CalculatorLayout from '../CalculatorLayout';
import { toast } from 'sonner';

/**
 * HbA1c to Estimated Average Glucose (eAG) Calculator Component
 * 
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {function} props.onOpenChange - Dialog state change handler
 * @param {Object} props.initialInputs - Initial input values
 * @param {Object} props.context - Clinical context (age, pregnancy, etc.)
 */
const HbA1cEAGCalculator = ({ 
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
   * Connector: Integra com data/schemas/hba1c_eag_calculator.json
   */
  const loadCalculatorSchema = async () => {
    try {
      setSchemaLoading(true);
      setError(null);
      
      // Import the schema
      const schemaModule = await import('../../../data/schemas/hba1c_eag_calculator.json');
      setSchema(schemaModule.default || schemaModule);
    } catch (err) {
      console.error('Error loading HbA1c eAG schema:', err);
      setError('Erro ao carregar configuração da calculadora');
      toast.error('Erro ao carregar calculadora HbA1c/eAG');
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
   * Calculate eAG from HbA1c using ADAG formula
   * @param {Object} calculatorInputs - Input values
   * @param {Object} clinicalContext - Clinical context
   */
  const handleCalculate = async (calculatorInputs, clinicalContext) => {
    try {
      setLoading(true);
      setError(null);
      
      // Extract numeric values
      const hba1cPercent = parseFloat(calculatorInputs.hba1c_percent);
      
      // Validate inputs
      if (isNaN(hba1cPercent)) {
        throw new Error('HbA1c deve ser um número válido');
      }
      
      if (hba1cPercent < 4.0 || hba1cPercent > 20.0) {
        throw new Error('HbA1c deve estar entre 4.0% e 20.0%');
      }
      
      // Calculate eAG using ADAG formula: eAG = 28.7 × HbA1c - 46.7
      const eagMgDl = 28.7 * hba1cPercent - 46.7;
      const eagMmolL = eagMgDl / 18.0;
      
      // Determine interpretation and target
      const interpretation = getHbA1cInterpretation(hba1cPercent, clinicalContext);
      
      // Format results
      const calculationResults = {
        outputs: [
          {
            label: 'Glicemia Média Estimada (eAG)',
            value: `${eagMgDl.toFixed(0)} mg/dL`,
            unit: '',
            description: 'Glicemia média estimada baseada na HbA1c'
          },
          {
            label: 'eAG em mmol/L',
            value: `${eagMmolL.toFixed(1)} mmol/L`,
            unit: '',
            description: 'Glicemia média estimada em unidades internacionais'
          },
          {
            label: 'Classificação',
            value: interpretation.classification,
            unit: '',
            description: 'Classificação do controle glicêmico'
          },
          {
            label: 'Meta Recomendada',
            value: interpretation.targetHbA1c,
            unit: '',
            description: 'Meta de HbA1c para este paciente'
          }
        ],
        interpretation: {
          riskLevel: interpretation.riskLevel,
          result: interpretation.result,
          clinicalSignificance: interpretation.clinicalSignificance,
          recommendation: interpretation.recommendation,
          nextSteps: interpretation.nextSteps,
          warnings: interpretation.warnings,
          normalRange: 'HbA1c normal: <5.7%; Meta diabetes: <7.0%',
          targetInfo: interpretation.targetInfo
        },
        rawScore: hba1cPercent,
        eagMgDl: eagMgDl,
        eagMmolL: eagMmolL,
        inputs: calculatorInputs,
        context: clinicalContext,
        calculatedAt: new Date().toISOString()
      };
      
      setResults(calculationResults);
      toast.success('eAG calculada com sucesso');
      
    } catch (err) {
      console.error('Error calculating eAG:', err);
      setError(err.message || 'Erro ao calcular eAG');
      toast.error('Erro no cálculo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get HbA1c interpretation based on value and clinical context
   * @param {number} hba1c - HbA1c percentage
   * @param {Object} context - Clinical context (age, pregnancy, etc.)
   * @returns {Object} Interpretation object
   */
  const getHbA1cInterpretation = (hba1c, context) => {
    const isElderly = context.age && context.age >= 65;
    const isPregnant = context.pregnancy === true;
    const isFrail = context.frail === true;
    
    // Determine target based on population
    let targetHbA1c = '<7.0%';
    let targetInfo = 'Meta padrão para adultos diabéticos';
    
    if (isPregnant) {
      targetHbA1c = '<6.0%';
      targetInfo = 'Meta mais rigorosa durante a gravidez';
    } else if (isFrail) {
      targetHbA1c = '<8.0%';
      targetInfo = 'Meta menos rigorosa para pacientes frágeis';
    } else if (isElderly) {
      targetHbA1c = '<7.5%';
      targetInfo = 'Meta ajustada para idosos saudáveis';
    }
    
    if (hba1c < 5.7) {
      return {
        riskLevel: 'normal',
        classification: 'Normal',
        result: 'Metabolismo normal da glicose',
        clinicalSignificance: 'HbA1c <5.7% indica ausência de diabetes e pré-diabetes.',
        recommendation: 'Manter estilo de vida saudável',
        nextSteps: [
          'Rastreamento anual se fatores de risco presentes',
          'Manter dieta equilibrada',
          'Atividade física regular (150 min/semana)',
          'Controle do peso corporal'
        ],
        warnings: [],
        targetHbA1c: 'Manter <5.7%',
        targetInfo: 'Prevenção primária do diabetes'
      };
    } else if (hba1c >= 5.7 && hba1c <= 6.4) {
      return {
        riskLevel: 'warning',
        classification: 'Pré-diabetes',
        result: 'Risco aumentado de desenvolver diabetes tipo 2',
        clinicalSignificance: 'HbA1c 5.7-6.4% indica pré-diabetes com risco de progressão para diabetes.',
        recommendation: 'Intervenção intensiva no estilo de vida',
        nextSteps: [
          'Programa estruturado de prevenção de diabetes',
          'Perda de peso de 5-10% do peso corporal',
          'Atividade física regular (150 min/semana)',
          'Dieta com redução de carboidratos refinados',
          'Reavaliação da HbA1c em 6 meses',
          'Considerar metformina se alto risco'
        ],
        warnings: ['Risco de 25% de desenvolver diabetes em 3-5 anos'],
        targetHbA1c: 'Meta: <5.7%',
        targetInfo: 'Reversão do pré-diabetes'
      };
    } else if (hba1c >= 6.5 && hba1c < 7.0) {
      return {
        riskLevel: 'controlled',
        classification: 'Diabetes com bom controle',
        result: 'Controle glicêmico adequado',
        clinicalSignificance: `HbA1c ${hba1c.toFixed(1)}% está dentro da meta recomendada para a maioria dos diabéticos.`,
        recommendation: 'Manter tratamento atual e monitorização',
        nextSteps: [
          'Manter medicações e doses atuais',
          'Reavaliação da HbA1c em 3-6 meses',
          'Rastreamento anual de complicações',
          'Educação continuada em diabetes',
          'Monitorização da pressão arterial e lipídios'
        ],
        warnings: [],
        targetHbA1c,
        targetInfo
      };
    } else if (hba1c >= 7.0 && hba1c < 8.0) {
      return {
        riskLevel: 'suboptimal',
        classification: 'Diabetes com controle inadequado',
        result: 'Necessita intensificação do tratamento',
        clinicalSignificance: `HbA1c ${hba1c.toFixed(1)}% está acima da meta, aumentando o risco de complicações.`,
        recommendation: 'Intensificar tratamento antidiabético',
        nextSteps: [
          'Revisar adesão ao tratamento atual',
          'Intensificar medicações orais',
          'Considerar início de insulina se não em uso',
          'Educação em automonitorização',
          'Reavaliação em 3 meses',
          'Avaliar barreiras ao controle glicêmico'
        ],
        warnings: ['Risco aumentado de complicações microvasculares'],
        targetHbA1c,
        targetInfo
      };
    } else if (hba1c >= 8.0 && hba1c < 10.0) {
      return {
        riskLevel: 'poor',
        classification: 'Diabetes com controle ruim',
        result: 'Controle inadequado com risco elevado',
        clinicalSignificance: `HbA1c ${hba1c.toFixed(1)}% indica controle inadequado com risco significativo de complicações.`,
        recommendation: 'Revisão urgente e intensificação do tratamento',
        nextSteps: [
          'Avaliação detalhada de adesão e barreiras',
          'Intensificação medicamentosa imediata',
          'Início ou ajuste de insulina',
          'Encaminhamento ao endocrinologista',
          'Rastreamento de complicações',
          'Educação intensiva em diabetes',
          'Reavaliação em 1-2 meses'
        ],
        warnings: [
          'Alto risco de complicações microvasculares',
          'Risco aumentado de complicações macrovasculares'
        ],
        targetHbA1c,
        targetInfo
      };
    } else {
      return {
        riskLevel: 'critical',
        classification: 'Diabetes severamente descompensado',
        result: 'Descompensação severa - intervenção imediata',
        clinicalSignificance: `HbA1c ${hba1c.toFixed(1)}% indica descompensação severa com alto risco de complicações agudas e crônicas.`,
        recommendation: 'Intervenção imediata e acompanhamento especializado',
        nextSteps: [
          'Avaliação de emergência para cetoacidose',
          'Início imediato de insulina',
          'Encaminhamento urgente ao endocrinologista',
          'Considerar hospitalização se sintomas severos',
          'Educação intensiva e suporte familiar',
          'Reavaliação semanal inicial',
          'Investigar causas da descompensação'
        ],
        warnings: [
          'Risco muito alto de complicações agudas',
          'Risco elevado de cetoacidose diabética',
          'Complicações crônicas podem estar presentes'
        ],
        targetHbA1c,
        targetInfo
      };
    }
  };

  if (schemaLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando Calculadora HbA1c/eAG...</DialogTitle>
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
          <DialogTitle>Calculadora de Glicemia Média Estimada (eAG)</DialogTitle>
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

export default HbA1cEAGCalculator;