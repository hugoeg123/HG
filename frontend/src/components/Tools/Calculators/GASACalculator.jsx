/**
 * GASACalculator - Calculadora GASA (Gradiente Albumina Soro-Ascite) usando nova arquitetura padronizada
 * 
 * Integrates with:
 * - components/Tools/CalculatorLayout.jsx para interface padronizada
 * - services/ValidationService.js para validação de inputs
 * - data/schemas/gasa_calculator.json para schema
 * - services/PhysiologicalRanges.js para validação fisiológica
 * 
 * Hook: Exportado em components/Tools/calculators/GASACalculator.jsx
 * IA prompt: Adicionar integração com análise completa do líquido ascítico
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import CalculatorLayout from '../CalculatorLayout';
import { toast } from 'sonner';

/**
 * GASA (Serum-Ascites Albumin Gradient) Calculator Component
 * 
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {function} props.onOpenChange - Dialog state change handler
 * @param {Object} props.initialInputs - Initial input values
 * @param {Object} props.context - Clinical context
 */
const GASACalculator = ({ 
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
   * Connector: Integra com data/schemas/gasa_calculator.json
   */
  const loadCalculatorSchema = async () => {
    try {
      setSchemaLoading(true);
      setError(null);
      
      // Import the schema
      const schemaModule = await import('../../../data/schemas/gasa_calculator.json');
      setSchema(schemaModule.default || schemaModule);
    } catch (err) {
      console.error('Error loading GASA schema:', err);
      setError('Erro ao carregar configuração da calculadora');
      toast.error('Erro ao carregar calculadora GASA');
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
   * Calculate GASA (Serum-Ascites Albumin Gradient)
   * @param {Object} calculatorInputs - Input values
   * @param {Object} clinicalContext - Clinical context
   */
  const handleCalculate = async (calculatorInputs, clinicalContext) => {
    try {
      setLoading(true);
      setError(null);
      
      // Extract numeric values
      const serumAlbumin = parseFloat(calculatorInputs.serum_albumin);
      const ascitesAlbumin = parseFloat(calculatorInputs.ascites_albumin);
      
      // Validate inputs
      if (isNaN(serumAlbumin) || isNaN(ascitesAlbumin)) {
        throw new Error('Todos os valores devem ser números válidos');
      }
      
      // Clinical validation: ascites albumin should be less than serum albumin
      if (ascitesAlbumin >= serumAlbumin) {
        throw new Error('Albumina ascítica deve ser menor que a sérica. Verificar valores.');
      }
      
      // Calculate GASA: Serum Albumin - Ascites Albumin
      const gasa = serumAlbumin - ascitesAlbumin;
      
      // Determine interpretation
      const interpretation = getGASAInterpretation(gasa, serumAlbumin, ascitesAlbumin);
      
      // Format results
      const calculationResults = {
        outputs: [
          {
            label: 'GASA (Gradiente Albumina Soro-Ascite)',
            value: gasa.toFixed(2),
            unit: 'g/dL',
            description: 'Gradiente calculado entre albumina sérica e ascítica'
          },
          {
            label: 'Interpretação',
            value: interpretation.result,
            unit: '',
            description: 'Classificação etiológica da ascite'
          },
          {
            label: 'Probabilidade de Hipertensão Portal',
            value: interpretation.portalHypertensionProbability,
            unit: '',
            description: 'Probabilidade baseada no valor do GASA'
          }
        ],
        interpretation: {
          riskLevel: interpretation.riskLevel,
          result: interpretation.result,
          clinicalSignificance: interpretation.clinicalSignificance,
          recommendation: interpretation.recommendation,
          nextSteps: interpretation.nextSteps,
          etiologies: interpretation.etiologies,
          additionalTests: interpretation.additionalTests,
          warnings: interpretation.warnings,
          normalRange: 'GASA ≥1.1 g/dL = Hipertensão Portal; <1.1 g/dL = Outras causas'
        },
        rawScore: gasa,
        inputs: calculatorInputs,
        context: clinicalContext,
        calculatedAt: new Date().toISOString()
      };
      
      setResults(calculationResults);
      toast.success('GASA calculado com sucesso');
      
    } catch (err) {
      console.error('Error calculating GASA:', err);
      setError(err.message || 'Erro ao calcular GASA');
      toast.error('Erro no cálculo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get GASA interpretation based on calculated value
   * @param {number} gasa - Calculated GASA value
   * @param {number} serumAlbumin - Serum albumin
   * @param {number} ascitesAlbumin - Ascites albumin
   * @returns {Object} Interpretation object
   */
  const getGASAInterpretation = (gasa, serumAlbumin, ascitesAlbumin) => {
    const isHypoalbuminemic = serumAlbumin < 3.5;
    
    if (gasa >= 1.1) {
      return {
        riskLevel: 'high',
        result: 'Hipertensão Portal (GASA ≥1.1 g/dL)',
        portalHypertensionProbability: '97% de probabilidade',
        clinicalSignificance: 'GASA ≥1.1 g/dL indica ascite secundária à hipertensão portal com acurácia de 97%. Este é o mecanismo mais comum de ascite.',
        recommendation: 'Investigar causas de hipertensão portal e avaliar gravidade da hepatopatia',
        nextSteps: [
          'Calcular Child-Pugh Score e MELD Score',
          'Realizar ultrassom com Doppler portal',
          'Endoscopia digestiva alta para pesquisa de varizes',
          'Avaliar função hepática completa',
          'Considerar causas não-cirróticas se cirrose não evidente',
          'Investigar hepatite viral, alcoólica ou autoimune'
        ],
        etiologies: [
          'Cirrose hepática (mais comum - 80% dos casos)',
          'Hepatite alcoólica aguda',
          'Insuficiência cardíaca congestiva',
          'Trombose da veia porta',
          'Síndrome de Budd-Chiari',
          'Esquistossomose mansônica (em áreas endêmicas)'
        ],
        additionalTests: [
          'Child-Pugh Score',
          'MELD Score',
          'Ultrassom com Doppler portal',
          'Endoscopia digestiva alta',
          'Sorologias para hepatites B e C',
          'Marcadores de autoimunidade hepática'
        ],
        warnings: isHypoalbuminemic ? 
          ['Hipoalbuminemia presente - avaliar estado nutricional e síntese hepática'] : []
      };
    } else {
      return {
        riskLevel: 'normal',
        result: 'Sem Hipertensão Portal (GASA <1.1 g/dL)',
        portalHypertensionProbability: 'Baixa probabilidade',
        clinicalSignificance: 'GASA <1.1 g/dL indica ascite não relacionada à hipertensão portal. Investigar outras etiologias.',
        recommendation: 'Investigar causas não-portais de ascite',
        nextSteps: [
          'Análise citológica do líquido ascítico (carcinomatose)',
          'Cultura do líquido ascítico (tuberculose)',
          'Avaliar função renal (síndrome nefrótica)',
          'TC/RM de abdome (neoplasias)',
          'Ecocardiograma (insuficiência cardíaca)',
          'Marcadores tumorais se suspeita oncológica'
        ],
        etiologies: [
          'Carcinomatose peritoneal (mais comum neste grupo)',
          'Síndrome nefrótica',
          'Tuberculose peritoneal',
          'Pancreatite crônica',
          'Hipotireoidismo severo (mixedema)',
          'Síndrome de Meigs',
          'Ascite quilosa (obstrução linfática)'
        ],
        additionalTests: [
          'Citologia oncótica do líquido ascítico',
          'Cultura para BAAR (tuberculose)',
          'TC/RM de abdome e pelve',
          'Marcadores tumorais (CA-125, CEA, CA 19-9)',
          'Função renal completa e proteinúria',
          'Ecocardiograma',
          'TSH e T4 livre'
        ],
        warnings: isHypoalbuminemic ? 
          ['Hipoalbuminemia pode ser causa ou consequência da ascite'] : []
      };
    }
  };

  if (schemaLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando Calculadora GASA...</DialogTitle>
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
          <DialogTitle>Calculadora GASA (Gradiente Albumina Soro-Ascite)</DialogTitle>
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

export default GASACalculator;