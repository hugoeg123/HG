import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../ui/card';
import { Label } from '../../../ui/label';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { RadioGroup, RadioGroupItem } from '../../../ui/radio-group';
import { Copy, Calculator, Droplets, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

/**
 * AnionGap - Anion Gap Calculator
 * 
 * This component calculates the anion gap for assessment of acid-base
 * disorders and metabolic acidosis evaluation in critically ill patients.
 * 
 * Integrates with:
 * - Calculators.jsx via hardcodedCalculators array
 * - Dialog component for modal display
 * - Cards for structured layout
 * 
 * @param {boolean} open - Controls modal visibility
 * @param {function} onOpenChange - Callback for modal state changes
 * 
 * @example
 * // Basic usage in Calculators.jsx
 * <AnionGap 
 *   open={showHardcodedCalculator === 'anion-gap'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Calculation example
 * // Input: sodium=140, chloride=100, bicarbonate=24
 * // Output: anionGap=16, interpretation="Normal"
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function AnionGap({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    sodium: '',
    chloride: '',
    bicarbonate: '',
    potassium: '',
    includeK: false,
    albumin: '',
    phosphate: '',
    lactate: '',
    ketones: ''
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  /**
   * Validates input parameters for anion gap calculation
   * 
   * @returns {boolean} True if all required inputs are provided
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.sodium) {
      newErrors.sodium = 'Sódio é obrigatório';
    } else if (inputs.sodium < 120 || inputs.sodium > 160) {
      newErrors.sodium = 'Sódio deve estar entre 120 e 160 mEq/L';
    }
    
    if (!inputs.chloride) {
      newErrors.chloride = 'Cloreto é obrigatório';
    } else if (inputs.chloride < 80 || inputs.chloride > 120) {
      newErrors.chloride = 'Cloreto deve estar entre 80 e 120 mEq/L';
    }
    
    if (!inputs.bicarbonate) {
      newErrors.bicarbonate = 'Bicarbonato é obrigatório';
    } else if (inputs.bicarbonate < 5 || inputs.bicarbonate > 40) {
      newErrors.bicarbonate = 'Bicarbonato deve estar entre 5 e 40 mEq/L';
    }
    
    if (inputs.includeK && !inputs.potassium) {
      newErrors.potassium = 'Potássio é obrigatório quando incluído no cálculo';
    } else if (inputs.potassium && (inputs.potassium < 2.0 || inputs.potassium > 7.0)) {
      newErrors.potassium = 'Potássio deve estar entre 2.0 e 7.0 mEq/L';
    }
    
    if (inputs.albumin && (inputs.albumin < 1.0 || inputs.albumin > 6.0)) {
      newErrors.albumin = 'Albumina deve estar entre 1.0 e 6.0 g/dL';
    }
    
    if (inputs.phosphate && (inputs.phosphate < 1.0 || inputs.phosphate > 10.0)) {
      newErrors.phosphate = 'Fosfato deve estar entre 1.0 e 10.0 mg/dL';
    }
    
    if (inputs.lactate && (inputs.lactate < 0.5 || inputs.lactate > 20.0)) {
      newErrors.lactate = 'Lactato deve estar entre 0.5 e 20.0 mmol/L';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Calculates anion gap and provides clinical interpretation
   * 
   * @returns {Object} Calculation results with clinical interpretation
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      const sodium = parseFloat(inputs.sodium);
      const chloride = parseFloat(inputs.chloride);
      const bicarbonate = parseFloat(inputs.bicarbonate);
      const potassium = inputs.potassium ? parseFloat(inputs.potassium) : 0;
      
      // Calculate anion gap
      let anionGap;
      if (inputs.includeK && potassium > 0) {
        anionGap = Math.round(((sodium + potassium) - (chloride + bicarbonate)) * 10) / 10;
      } else {
        anionGap = Math.round((sodium - (chloride + bicarbonate)) * 10) / 10;
      }
      
      // Calculate albumin-corrected anion gap if albumin provided
      let correctedAnionGap = null;
      let albuminCorrection = '';
      if (inputs.albumin) {
        const albumin = parseFloat(inputs.albumin);
        // For every 1 g/dL decrease in albumin below 4.0, add 2.5 to anion gap
        const correction = (4.0 - albumin) * 2.5;
        correctedAnionGap = Math.round((anionGap + correction) * 10) / 10;
        albuminCorrection = `Corrigido para albumina: ${correctedAnionGap} mEq/L`;
      }
      
      // Determine normal ranges based on method
      let normalRange;
      let highThreshold;
      if (inputs.includeK) {
        normalRange = '12-20 mEq/L';
        highThreshold = 20;
      } else {
        normalRange = '8-16 mEq/L';
        highThreshold = 16;
      }
      
      // Clinical interpretation
      let interpretation = '';
      let severity = '';
      let severityColor = '';
      let clinicalSignificance = '';
      let recommendations = [];
      
      const gapToEvaluate = correctedAnionGap || anionGap;
      
      if (gapToEvaluate <= (highThreshold - 4)) {
        interpretation = 'Gap aniônico baixo';
        severity = 'BAIXO';
        severityColor = 'text-blue-200';
        clinicalSignificance = 'Gap aniônico reduzido. Pode indicar hipoalbuminemia, intoxicação por lítio, ou erro laboratorial.';
        recommendations = [
          'Verificar resultados laboratoriais',
          'Avaliar níveis de albumina',
          'Investigar intoxicação por lítio/brometo',
          'Considerar erro de coleta/processamento',
          'Avaliar hipercalcemia/hipermagnesemia'
        ];
      } else if (gapToEvaluate <= highThreshold) {
        interpretation = 'Gap aniônico normal';
        severity = 'NORMAL';
        severityColor = 'text-green-200';
        clinicalSignificance = 'Gap aniônico dentro dos limites normais. Equilíbrio ácido-base preservado.';
        recommendations = [
          'Monitoramento de rotina',
          'Avaliar contexto clínico',
          'Considerar outros parâmetros ácido-base',
          'Manter vigilância em pacientes críticos'
        ];
      } else if (gapToEvaluate <= (highThreshold + 8)) {
        interpretation = 'Gap aniônico elevado (leve)';
        severity = 'LEVE';
        severityColor = 'text-amber-200';
        clinicalSignificance = 'Elevação leve do gap aniônico. Pode indicar acidose metabólica com gap aumentado.';
        recommendations = [
          'Investigar causa da acidose metabólica',
          'Avaliar gasometria arterial',
          'Dosagem de lactato e cetonas',
          'Função renal (ureia, creatinina)',
          'Investigar intoxicações',
          'Monitoramento seriado'
        ];
      } else if (gapToEvaluate <= (highThreshold + 16)) {
        interpretation = 'Gap aniônico elevado (moderado)';
        severity = 'MODERADO';
        severityColor = 'text-orange-200';
        clinicalSignificance = 'Elevação moderada do gap aniônico. Acidose metabólica significativa com gap aumentado.';
        recommendations = [
          'Gasometria arterial urgente',
          'Investigação imediata da causa',
          'Lactato, cetonas, função renal',
          'Considerar cetoacidose diabética',
          'Avaliar choque/hipoperfusão',
          'Investigar intoxicações (metanol, etilenoglicol)',
          'Correção da causa subjacente'
        ];
      } else {
        interpretation = 'Gap aniônico severamente elevado';
        severity = 'GRAVE';
        severityColor = 'text-red-200';
        clinicalSignificance = 'Gap aniônico muito elevado. Acidose metabólica grave com risco de vida.';
        recommendations = [
          'URGENTE: Gasometria arterial imediata',
          'Investigação e tratamento emergencial',
          'Considerar hemodiálise se intoxicação',
          'Suporte intensivo imediato',
          'Correção agressiva da causa',
          'Monitoramento contínuo',
          'Consulta nefrológica/toxicológica'
        ];
      }
      
      // Differential diagnosis based on anion gap level
      let differentialDiagnosis = [];
      if (gapToEvaluate > highThreshold) {
        differentialDiagnosis = [
          {
            category: 'Acidose Láctica',
            causes: [
              'Choque (cardiogênico, séptico, hipovolêmico)',
              'Hipoxemia severa',
              'Convulsões prolongadas',
              'Exercício intenso',
              'Medicações (metformina, nucleosídeos)'
            ]
          },
          {
            category: 'Cetoacidose',
            causes: [
              'Cetoacidose diabética',
              'Cetoacidose alcoólica',
              'Jejum prolongado',
              'Dieta cetogênica extrema'
            ]
          },
          {
            category: 'Insuficiência Renal',
            causes: [
              'Insuficiência renal aguda',
              'Doença renal crônica avançada',
              'Acidose tubular renal tipo 4'
            ]
          },
          {
            category: 'Intoxicações',
            causes: [
              'Metanol (anticongelante)',
              'Etilenoglicol (anticongelante)',
              'Salicilatos (aspirina)',
              'Isoniazida',
              'Ferro'
            ]
          },
          {
            category: 'Outras Causas',
            causes: [
              'Rabdomiólise',
              'Síndrome de lise tumoral',
              'Acidose D-láctica',
              'Piroglutâmica (paracetamol crônico)'
            ]
          }
        ];
      }
      
      // Calculate delta gap if bicarbonate is low
      let deltaGap = null;
      let deltaGapInterpretation = '';
      if (bicarbonate < 22 && gapToEvaluate > highThreshold) {
        const expectedBicarb = 24; // Normal bicarbonate
        const normalGap = inputs.includeK ? 16 : 12; // Normal anion gap
        deltaGap = Math.round(((gapToEvaluate - normalGap) - (expectedBicarb - bicarbonate)) * 10) / 10;
        
        if (deltaGap > 6) {
          deltaGapInterpretation = 'Alcalose metabólica concomitante';
        } else if (deltaGap < -6) {
          deltaGapInterpretation = 'Acidose hiperclorêmica concomitante';
        } else {
          deltaGapInterpretation = 'Acidose metabólica pura com gap aumentado';
        }
      }
      
      // Laboratory workup recommendations
      const laboratoryWorkup = [
        'Gasometria arterial completa',
        'Eletrólitos completos (Na, K, Cl, HCO3)',
        'Função renal (ureia, creatinina)',
        'Glicemia e cetonas (sangue/urina)',
        'Lactato sérico',
        'Albumina sérica',
        'Osmolalidade sérica e urinária',
        'Gap osmolar se suspeita de intoxicação'
      ];
      
      // Additional tests based on clinical suspicion
      const additionalTests = [
        'Salicilatos se suspeita de intoxicação',
        'Metanol/etilenoglicol se gap osmolar elevado',
        'CPK se suspeita de rabdomiólise',
        'Ácido úrico se síndrome de lise tumoral',
        'Função hepática se cetoacidose alcoólica',
        'Hemogasometria venosa se não disponível arterial'
      ];
      
      // Treatment considerations
      const treatmentConsiderations = [
        'Tratar a causa subjacente (prioridade)',
        'Bicarbonato apenas se pH <7.1 e instabilidade',
        'Correção de eletrólitos (K+, Mg2+, PO4)',
        'Suporte hemodinâmico se necessário',
        'Hemodiálise se intoxicação ou IRA severa',
        'Monitoramento seriado do gap aniônico'
      ];
      
      const calculatedResults = {
        sodium,
        chloride,
        bicarbonate,
        potassium: potassium || null,
        includeK: inputs.includeK,
        anionGap,
        correctedAnionGap,
        albuminCorrection,
        normalRange,
        interpretation,
        severity,
        severityColor,
        clinicalSignificance,
        recommendations,
        differentialDiagnosis,
        deltaGap,
        deltaGapInterpretation,
        laboratoryWorkup,
        additionalTests,
        treatmentConsiderations,
        calculationDate: new Date().toLocaleString('pt-BR')
      };
      
      setResults(calculatedResults);
    } catch (error) {
      toast.error('Erro no cálculo: ' + error.message);
    }
  }, [inputs, validateInputs]);

  /**
   * Clears all input fields and results
   */
  const clearForm = useCallback(() => {
    setInputs({
      sodium: '',
      chloride: '',
      bicarbonate: '',
      potassium: '',
      includeK: false,
      albumin: '',
      phosphate: '',
      lactate: '',
      ketones: ''
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `Gap Aniônico - Resultados:\n`;
    resultText += `Data/Hora: ${results.calculationDate}\n\n`;
    
    resultText += `ELETRÓLITOS:\n`;
    resultText += `Na+: ${results.sodium} mEq/L\n`;
    resultText += `Cl-: ${results.chloride} mEq/L\n`;
    resultText += `HCO3-: ${results.bicarbonate} mEq/L\n`;
    if (results.potassium) {
      resultText += `K+: ${results.potassium} mEq/L\n`;
    }
    resultText += `\n`;
    
    resultText += `RESULTADO:\n`;
    resultText += `Gap Aniônico: ${results.anionGap} mEq/L\n`;
    if (results.correctedAnionGap) {
      resultText += `${results.albuminCorrection}\n`;
    }
    resultText += `Faixa Normal: ${results.normalRange}\n`;
    resultText += `Interpretação: ${results.interpretation}\n`;
    resultText += `Gravidade: ${results.severity}\n\n`;
    
    if (results.deltaGap !== null) {
      resultText += `Delta Gap: ${results.deltaGap}\n`;
      resultText += `Interpretação: ${results.deltaGapInterpretation}\n\n`;
    }
    
    resultText += `Significado Clínico:\n${results.clinicalSignificance}\n\n`;
    resultText += `Recomendações:\n${results.recommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    resultText += `Investigação Laboratorial:\n${results.laboratoryWorkup.map(l => `• ${l}`).join('\n')}\n\n`;
    resultText += `Avaliado por: [Nome do profissional]`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Gap Aniônico (Anion Gap)
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Eletrólitos Séricos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Required Electrolytes */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-200">Eletrólitos Obrigatórios</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sodium" className="text-sm font-medium">
                      Sódio (Na+) mEq/L *
                    </Label>
                    <input
                      id="sodium"
                      type="number"
                      value={inputs.sodium}
                      onChange={(e) => setInputs(prev => ({ ...prev, sodium: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 140"
                      min="120"
                      max="160"
                      step="0.1"
                    />
                    {errors.sodium && (
                      <p className="text-sm text-red-500">{errors.sodium}</p>
                    )}
                    <p className="text-xs text-gray-400">Normal: 135-145 mEq/L</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="chloride" className="text-sm font-medium">
                      Cloreto (Cl-) mEq/L *
                    </Label>
                    <input
                      id="chloride"
                      type="number"
                      value={inputs.chloride}
                      onChange={(e) => setInputs(prev => ({ ...prev, chloride: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 100"
                      min="80"
                      max="120"
                      step="0.1"
                    />
                    {errors.chloride && (
                      <p className="text-sm text-red-500">{errors.chloride}</p>
                    )}
                    <p className="text-xs text-gray-400">Normal: 98-107 mEq/L</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bicarbonate" className="text-sm font-medium">
                      Bicarbonato (HCO3-) mEq/L *
                    </Label>
                    <input
                      id="bicarbonate"
                      type="number"
                      value={inputs.bicarbonate}
                      onChange={(e) => setInputs(prev => ({ ...prev, bicarbonate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 24"
                      min="5"
                      max="40"
                      step="0.1"
                    />
                    {errors.bicarbonate && (
                      <p className="text-sm text-red-500">{errors.bicarbonate}</p>
                    )}
                    <p className="text-xs text-gray-400">Normal: 22-28 mEq/L</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        id="include-k"
                        checked={inputs.includeK}
                        onChange={(e) => setInputs(prev => ({ ...prev, includeK: e.target.checked }))}
                        className="text-blue-600"
                      />
                      <Label htmlFor="include-k" className="text-sm font-medium">
                        Incluir Potássio no cálculo
                      </Label>
                    </div>
                    <input
                      id="potassium"
                      type="number"
                      value={inputs.potassium}
                      onChange={(e) => setInputs(prev => ({ ...prev, potassium: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 4.0"
                      min="2.0"
                      max="7.0"
                      step="0.1"
                      disabled={!inputs.includeK}
                    />
                    {errors.potassium && (
                      <p className="text-sm text-red-500">{errors.potassium}</p>
                    )}
                    <p className="text-xs text-gray-400">Normal: 3.5-5.0 mEq/L</p>
                  </div>
                </div>
              </div>
              
              {/* Optional Parameters */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3 text-gray-200">Parâmetros Opcionais</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="albumin" className="text-sm font-medium">
                      Albumina (g/dL)
                    </Label>
                    <input
                      id="albumin"
                      type="number"
                      value={inputs.albumin}
                      onChange={(e) => setInputs(prev => ({ ...prev, albumin: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 3.5"
                      min="1.0"
                      max="6.0"
                      step="0.1"
                    />
                    {errors.albumin && (
                      <p className="text-sm text-red-500">{errors.albumin}</p>
                    )}
                    <p className="text-xs text-gray-400">Para correção do gap (Normal: 3.5-5.0)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lactate" className="text-sm font-medium">
                      Lactato (mmol/L)
                    </Label>
                    <input
                      id="lactate"
                      type="number"
                      value={inputs.lactate}
                      onChange={(e) => setInputs(prev => ({ ...prev, lactate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 2.0"
                      min="0.5"
                      max="20.0"
                      step="0.1"
                    />
                    {errors.lactate && (
                      <p className="text-sm text-red-500">{errors.lactate}</p>
                    )}
                    <p className="text-xs text-gray-400">Normal: 0.5-2.2 mmol/L</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={calculate} className="flex-1">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular
                </Button>
                <Button variant="outline" onClick={clearForm}>
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Results Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Resultado do Cálculo
                {results && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyResults}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results ? (
                <div className="space-y-4">
                  {/* Main Result */}
                  <div className="p-4 rounded-lg border bg-blue-900/20 border-blue-700/50">
                    <div className="text-center mb-3">
                      <span className="text-3xl font-bold text-blue-200">
                        {results.anionGap}
                      </span>
                      <p className="text-sm text-blue-300 mt-1">mEq/L</p>
                    </div>
                    
                    {results.correctedAnionGap && (
                      <div className="text-center mb-3 p-2 bg-blue-900/30 rounded border border-blue-700/50">
                        <p className="text-sm text-blue-200">{results.albuminCorrection}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-200">Fórmula:</span>
                        <p className="text-blue-300">
                          {results.includeK ? '(Na + K) - (Cl + HCO3)' : 'Na - (Cl + HCO3)'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-200">Normal:</span>
                        <p className="text-blue-300">{results.normalRange}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Interpretation */}
                  <div className={`p-4 rounded-lg border ${
                    results.severity === 'NORMAL' ? 'bg-green-900/20 border-green-700/50' :
                    results.severity === 'BAIXO' ? 'bg-blue-900/20 border-blue-700/50' :
                    results.severity === 'LEVE' ? 'bg-amber-900/20 border-amber-700/50' :
                    results.severity === 'MODERADO' ? 'bg-orange-900/20 border-orange-700/50' :
                    'bg-red-900/20 border-red-700/50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-lg ${results.severityColor}`}>
                        {results.interpretation}
                      </span>
                      <Badge className={`${
                        results.severity === 'NORMAL' ? 'bg-green-900/30 text-green-200 border border-green-700/50' :
                        results.severity === 'BAIXO' ? 'bg-blue-900/30 text-blue-200 border border-blue-700/50' :
                        results.severity === 'LEVE' ? 'bg-amber-900/30 text-amber-200 border border-amber-700/50' :
                        results.severity === 'MODERADO' ? 'bg-orange-900/30 text-orange-200 border border-orange-700/50' :
                        'bg-red-900/30 text-red-200 border border-red-700/50'
                      }`}>
                        {results.severity}
                      </Badge>
                    </div>
                    <p className="text-sm opacity-90">{results.clinicalSignificance}</p>
                  </div>
                  
                  {/* Delta Gap */}
                  {results.deltaGap !== null && (
                    <div className="p-3 rounded-lg border bg-purple-900/20 border-purple-700/50">
                      <h4 className="font-semibold text-purple-200 mb-2">Delta Gap:</h4>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-lg font-bold text-purple-200">{results.deltaGap}</span>
                        <span className="text-sm text-purple-300">mEq/L</span>
                      </div>
                      <p className="text-sm text-purple-200">{results.deltaGapInterpretation}</p>
                    </div>
                  )}
                  
                  {/* Clinical Recommendations */}
                  <div className="p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
                    <h4 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
                      {results.severity === 'GRAVE' && <AlertTriangle className="h-4 w-4" />}
                      Recomendações Clínicas:
                    </h4>
                    <ul className="text-sm text-blue-300 space-y-1">
                      {results.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Laboratory Workup */}
                  <div className="p-3 rounded-lg border bg-green-900/20 border-green-700/50">
                    <h4 className="font-semibold text-green-200 mb-2">Investigação Laboratorial:</h4>
                    <ul className="text-sm text-green-300 space-y-1">
                      {results.laboratoryWorkup.map((lab, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{lab}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Treatment Considerations */}
                  <div className="p-3 rounded-lg border bg-gray-800/50 border-gray-600/50">
                    <h4 className="font-semibold text-gray-200 mb-2">Considerações Terapêuticas:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {results.treatmentConsiderations.map((treatment, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{treatment}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Insira os eletrólitos e clique em "Calcular"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Differential Diagnosis */}
        {results && results.differentialDiagnosis.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Diagnóstico Diferencial - Gap Aniônico Elevado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.differentialDiagnosis.map((category, index) => (
                  <div key={index}>
                    <h4 className="font-semibold mb-3 text-red-200">{category.category}:</h4>
                    <ul className="text-sm text-red-300 space-y-1">
                      {category.causes.map((cause, causeIndex) => (
                        <li key={causeIndex} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Additional Tests */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Exames Adicionais Conforme Suspeita Clínica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                {results.additionalTests.map((test, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{test}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        
        {/* Reference Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações de Referência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Fórmulas do Gap Aniônico:</h4>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Tradicional:</strong> Na+ - (Cl- + HCO3-) = 8-16 mEq/L</li>
                    <li>• <strong>Com Potássio:</strong> (Na+ + K+) - (Cl- + HCO3-) = 12-20 mEq/L</li>
                    <li>• <strong>Corrigido:</strong> Gap + 2.5 × (4.0 - Albumina)</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Mnemônico MUDPILES (Gap Elevado):</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>M</strong>etanol, <strong>U</strong>remia</li>
                  <li>• <strong>D</strong>iabetes (cetoacidose), <strong>P</strong>araldeído</li>
                  <li>• <strong>I</strong>soniazida, <strong>L</strong>actato</li>
                  <li>• <strong>E</strong>tilenoglicol, <strong>S</strong>alicilatos</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Delta Gap:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Δ Gap = (Gap atual - Gap normal) - (HCO3 normal - HCO3 atual)</li>
                  <li>• &gt;6: Alcalose metabólica concomitante</li>
                  <li>• &lt;-6: Acidose hiperclorêmica concomitante</li>
                  <li>• -6 a +6: Acidose com gap pura</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Kraut JA, Madias NE. Serum anion gap: its uses and limitations. Clin J Am Soc Nephrol 2007</li>
                  <li>• Emmett M, Narins RG. Clinical use of the anion gap. Medicine 1977</li>
                  <li>• Diretrizes SBN - Distúrbios Ácido-Base</li>
                  <li>• KDIGO Clinical Practice Guidelines</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default AnionGap;
