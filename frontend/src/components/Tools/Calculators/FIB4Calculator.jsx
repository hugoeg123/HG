/**
 * FIB4Calculator - Calculadora FIB-4 Score usando nova arquitetura padronizada
 * 
 * Integrates with:
 * - components/Tools/CalculatorLayout.jsx para interface padronizada
 * - services/ValidationService.js para validação de inputs
 * - backend/src/core/calculators/fib4_score.json para schema
 * - services/api.js para comunicação com backend
 * 
 * Hook: Exportado em components/Tools/calculators/FIB4Calculator.jsx
 * IA prompt: Adicionar integração com elastografia hepática e outros scores de fibrose
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import CalculatorLayout from '../CalculatorLayout';
import { dynamicCalculatorService } from '../../../services/api';
import { toast } from 'sonner';

/**
 * FIB-4 Score Calculator Component
 * 
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {function} props.onOpenChange - Dialog state change handler
 * @param {Object} props.initialInputs - Initial input values
 * @param {Object} props.context - Clinical context (age, sex, etc.)
 */
const FIB4Calculator = ({ 
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
   * Load calculator schema from backend
   * Connector: Integra com backend/src/core/calculators/fib4_score.json
   */
  const loadCalculatorSchema = async () => {
    try {
      setSchemaLoading(true);
      setError(null);
      
      // For now, use the local schema until backend integration is complete
      const localSchema = await import('../../../../backend/src/core/calculators/fib4_score.json');
      setSchema(localSchema.default || localSchema);
    } catch (err) {
      console.error('Error loading FIB-4 schema:', err);
      setError('Erro ao carregar configuração da calculadora');
      toast.error('Erro ao carregar calculadora FIB-4');
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
   * Calculate FIB-4 score
   * @param {Object} calculatorInputs - Input values
   * @param {Object} clinicalContext - Clinical context
   */
  const handleCalculate = async (calculatorInputs, clinicalContext) => {
    try {
      setLoading(true);
      setError(null);
      
      // Extract numeric values
      const age = parseFloat(calculatorInputs.age);
      const ast = parseFloat(calculatorInputs.ast);
      const alt = parseFloat(calculatorInputs.alt);
      const platelets = parseFloat(calculatorInputs.platelets);
      
      // Validate inputs
      if (isNaN(age) || isNaN(ast) || isNaN(alt) || isNaN(platelets)) {
        throw new Error('Todos os valores devem ser números válidos');
      }
      
      if (alt <= 0) {
        throw new Error('ALT deve ser maior que zero para evitar divisão por zero');
      }
      
      if (platelets <= 0) {
        throw new Error('Contagem de plaquetas deve ser maior que zero');
      }
      
      // Calculate FIB-4 score: (age × AST) / (platelets × √ALT)
      const fib4Score = (age * ast) / (platelets * Math.sqrt(alt));
      
      // Determine risk category and interpretation
      const interpretation = getFIB4Interpretation(fib4Score, age);
      
      // Format results
      const calculationResults = {
        outputs: [
          {
            label: 'FIB-4 Score',
            value: fib4Score.toFixed(2),
            unit: '',
            description: 'Índice FIB-4 calculado'
          },
          {
            label: 'Categoria de Risco',
            value: interpretation.riskCategory,
            unit: '',
            description: 'Classificação do risco de fibrose avançada'
          },
          {
            label: 'Probabilidade de Fibrose Avançada',
            value: interpretation.probability,
            unit: '',
            description: 'Estimativa baseada no score'
          }
        ],
        interpretation: {
          riskLevel: interpretation.riskLevel,
          result: interpretation.result,
          clinicalSignificance: interpretation.clinicalSignificance,
          recommendation: interpretation.recommendation,
          nextSteps: interpretation.nextSteps,
          warnings: interpretation.warnings,
          probability: interpretation.probability,
          normalRange: interpretation.normalRange
        },
        rawScore: fib4Score,
        inputs: calculatorInputs,
        context: clinicalContext,
        calculatedAt: new Date().toISOString()
      };
      
      setResults(calculationResults);
      toast.success('FIB-4 Score calculado com sucesso');
      
    } catch (err) {
      console.error('Error calculating FIB-4:', err);
      setError(err.message || 'Erro ao calcular FIB-4 Score');
      toast.error('Erro no cálculo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get FIB-4 interpretation based on score and age
   * @param {number} score - FIB-4 score
   * @param {number} age - Patient age
   * @returns {Object} Interpretation object
   */
  const getFIB4Interpretation = (score, age) => {
    const isElderly = age >= 65;
    const lowCutoff = isElderly ? 2.0 : 1.3;
    const highCutoff = 3.25;
    
    if (score < lowCutoff) {
      return {
        riskLevel: 'low',
        riskCategory: 'Baixo Risco',
        result: isElderly ? 
          'Baixo risco de fibrose avançada (ajustado para idade)' : 
          'Baixo risco de fibrose avançada',
        clinicalSignificance: isElderly ?
          'Cutoff ajustado para idade ≥65 anos devido à redução da especificidade.' :
          'VPN de 90% para fibrose avançada (Ishak 4-6). Probabilidade muito baixa de cirrose.',
        recommendation: isElderly ?
          'Seguimento de rotina com monitorização mais frequente devido à idade.' :
          'Seguimento de rotina. Repetir FIB-4 em 2-3 anos se fatores de risco persistirem.',
        nextSteps: isElderly ? [
          'Controlar comorbidades',
          'Seguimento clínico a cada 1-2 anos',
          'Considerar elastografia se outros fatores de risco'
        ] : [
          'Controlar fatores de risco (álcool, diabetes, obesidade)',
          'Seguimento clínico de rotina',
          'Repetir avaliação em 2-3 anos'
        ],
        probability: isElderly ? '< 15%' : '< 10%',
        normalRange: isElderly ? '< 2.0 (≥ 65 anos)' : '< 1.3 (< 65 anos)',
        warnings: isElderly ? [{
          level: 'warning',
          message: 'Cutoff ajustado para idade - especificidade reduzida em idosos',
          action: 'Considerar métodos complementares se dúvida clínica'
        }] : []
      };
    } else if (score <= highCutoff) {
      return {
        riskLevel: 'indeterminate',
        riskCategory: 'Risco Intermediário',
        result: 'Risco intermediário - zona indeterminada',
        clinicalSignificance: 'Score na zona cinzenta. Necessária avaliação adicional para estratificação adequada do risco.',
        recommendation: 'Avaliação complementar com elastografia hepática (FibroScan) ou outros métodos não-invasivos.',
        nextSteps: [
          'Elastografia hepática (FibroScan)',
          'Considerar outros scores (APRI, NFS)',
          'Avaliação hepatológica',
          'Investigar etiologia da hepatopatia'
        ],
        probability: '15-65%',
        normalRange: '1.3-3.25 (zona indeterminada)',
        warnings: [{
          level: 'warning',
          message: 'Score na zona indeterminada - necessária avaliação adicional',
          action: 'Realizar elastografia hepática ou outros métodos não-invasivos'
        }]
      };
    } else {
      return {
        riskLevel: 'high',
        riskCategory: 'Alto Risco',
        result: 'Alto risco de fibrose avançada',
        clinicalSignificance: 'VPP de 65% para fibrose avançada. Alta probabilidade de cirrose ou fibrose significativa.',
        recommendation: 'Encaminhamento para hepatologista. Investigação de complicações da cirrose e rastreamento de carcinoma hepatocelular.',
        nextSteps: [
          'Encaminhamento urgente para hepatologista',
          'Ultrassom abdominal + AFP (rastreamento CHC)',
          'Endoscopia digestiva alta (rastreamento varizes)',
          'Avaliação de descompensação hepática',
          'Considerar biópsia hepática se indicada'
        ],
        probability: '> 65%',
        normalRange: '> 3.25 (alto risco)',
        warnings: [{
          level: 'critical',
          message: 'Alto risco de fibrose avançada - necessário seguimento especializado',
          action: 'Encaminhamento para hepatologista e rastreamento de complicações'
        }]
      };
    }
  };

  if (schemaLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-white">
              Carregando FIB-4 Calculator...
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-white">
            FIB-4 Score - Avaliação de Fibrose Hepática
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <CalculatorLayout
            schema={schema}
            onCalculate={handleCalculate}
            results={results}
            loading={loading}
            error={error}
            initialInputs={inputs}
            onInputChange={handleInputChange}
            context={context}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FIB4Calculator;