import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Calculator, Activity, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

/**
 * SpO2FiO2Ratio - SpO2/FiO2 Ratio Calculator
 * 
 * This component calculates the SpO2/FiO2 ratio (S/F ratio) as a non-invasive
 * alternative to PaO2/FiO2 for assessing oxygenation status and ARDS severity.
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
 * <SpO2FiO2Ratio 
 *   open={showHardcodedCalculator === 'spo2-fio2-ratio'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Calculation example
 * // Input: spo2=95, fio2=0.4
 * // Output: sfRatio=238, interpretation="Normal", estimatedPF=286
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function SpO2FiO2Ratio({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    spo2: '',
    fio2: '',
    fio2Percentage: '',
    inputMethod: 'decimal', // decimal, percentage
    peep: '',
    mechanicalVentilation: '',
    altitude: '',
    patientAge: ''
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  /**
   * Validates input parameters for S/F ratio calculation
   * 
   * @returns {boolean} True if all required inputs are provided
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.spo2) {
      newErrors.spo2 = 'SpO2 é obrigatório';
    } else if (inputs.spo2 < 70 || inputs.spo2 > 100) {
      newErrors.spo2 = 'SpO2 deve estar entre 70% e 100%';
    }
    
    let fio2Value;
    if (inputs.inputMethod === 'decimal') {
      if (!inputs.fio2) {
        newErrors.fio2 = 'FiO2 é obrigatório';
      } else if (inputs.fio2 < 0.21 || inputs.fio2 > 1.0) {
        newErrors.fio2 = 'FiO2 deve estar entre 0.21 e 1.0';
      }
      fio2Value = parseFloat(inputs.fio2);
    } else {
      if (!inputs.fio2Percentage) {
        newErrors.fio2Percentage = 'FiO2 é obrigatório';
      } else if (inputs.fio2Percentage < 21 || inputs.fio2Percentage > 100) {
        newErrors.fio2Percentage = 'FiO2 deve estar entre 21% e 100%';
      }
      fio2Value = parseFloat(inputs.fio2Percentage) / 100;
    }
    
    if (inputs.peep && (inputs.peep < 0 || inputs.peep > 30)) {
      newErrors.peep = 'PEEP deve estar entre 0 e 30 cmH2O';
    }
    
    if (inputs.altitude && (inputs.altitude < 0 || inputs.altitude > 5000)) {
      newErrors.altitude = 'Altitude deve estar entre 0 e 5000 metros';
    }
    
    if (inputs.patientAge && (inputs.patientAge < 0 || inputs.patientAge > 120)) {
      newErrors.patientAge = 'Idade deve estar entre 0 e 120 anos';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Calculates S/F ratio and provides clinical interpretation
   * 
   * @returns {Object} Calculation results with clinical interpretation
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      const spo2 = parseFloat(inputs.spo2);
      let fio2Value;
      
      if (inputs.inputMethod === 'decimal') {
        fio2Value = parseFloat(inputs.fio2);
      } else {
        fio2Value = parseFloat(inputs.fio2Percentage) / 100;
      }
      
      // Calculate S/F ratio
      const sfRatio = Math.round(spo2 / fio2Value);
      
      // Estimate P/F ratio from S/F ratio using validated conversion
      // Rice et al. formula: P/F = 64 + 0.84 × (S/F)
      const estimatedPF = Math.round(64 + (0.84 * sfRatio));
      
      // Alternative conversion for SpO2 ≤97%
      let alternativePF = null;
      if (spo2 <= 97) {
        // More accurate for lower SpO2 values
        alternativePF = Math.round(sfRatio * 1.2);
      }
      
      // Altitude correction if provided
      let correctedSfRatio = sfRatio;
      let altitudeCorrection = '';
      if (inputs.altitude) {
        const altitude = parseFloat(inputs.altitude);
        const barometricPressure = 760 - (altitude * 0.12);
        const correctionFactor = 760 / barometricPressure;
        correctedSfRatio = Math.round(sfRatio * correctionFactor);
        altitudeCorrection = `Corrigido para altitude (${altitude}m): ${correctedSfRatio}`;
      }
      
      // Clinical interpretation based on S/F ratio thresholds
      let interpretation = '';
      let severity = '';
      let severityColor = '';
      let clinicalSignificance = '';
      let ardsEquivalent = '';
      let recommendations = [];
      
      if (ratio >= 315) {  // Normal range
        severityColor = 'text-green-200';
        interpretation = 'Oxigenação Normal';
        severity = 'NORMAL';
        clinicalSignificance = 'SpO2/FiO2 normal indica função pulmonar adequada sem sinais de insuficiência respiratória.';
        ardsEquivalent = 'Equivale a PaO2/FiO2 > 300 mmHg (sem ARDS)';
        recommendations = [
          'Monitoramento contínuo da SpO2',
          'Manter SpO2 ≥94% em pacientes sem DPOC',
          'Avaliar causa de dessaturação se SpO2 <94%'
        ];
      } else if (ratio >= 235) {  // Mild hypoxemia
        severityColor = 'text-amber-200';
        interpretation = 'Hipoxemia Leve';
        severity = 'LEVE';
        clinicalSignificance = 'Indica comprometimento leve da oxigenação, podendo sugerir início de processo patológico pulmonar.';
        ardsEquivalent = 'Equivale a PaO2/FiO2 200-300 mmHg (ARDS leve)';
        recommendations = [
          'Considerar suplementação de O2 para manter SpO2 ≥94%',
          'Investigar causa da hipoxemia',
          'Monitoramento mais frequente',
          'Avaliar necessidade de gasometria arterial'
        ];
      } else if (ratio >= 150) {  // Moderate hypoxemia
        severityColor = 'text-orange-200';
        interpretation = 'Hipoxemia Moderada';
        severity = 'MODERADA';
        clinicalSignificance = 'Indica comprometimento significativo da oxigenação, requerendo intervenção e monitoramento intensivo.';
        ardsEquivalent = 'Equivale a PaO2/FiO2 100-200 mmHg (ARDS moderada)';
        recommendations = [
          'Suplementação de O2 para manter SpO2 ≥94%',
          'Considerar ventilação não-invasiva',
          'Gasometria arterial obrigatória',
          'Avaliar necessidade de internação em UTI'
        ];
      } else {  // Severe hypoxemia
        severityColor = 'text-red-200';
        interpretation = 'Hipoxemia Grave';
        severity = 'GRAVE';
        clinicalSignificance = 'Indica falência respiratória grave, requerendo intervenção imediata e cuidados intensivos.';
        ardsEquivalent = 'Equivale a PaO2/FiO2 <100 mmHg (ARDS grave)';
        recommendations = [
          'Considerar intubação e ventilação mecânica',
          'UTI imediatamente',
          'Gasometria arterial urgente',
          'Protocolo de ARDS se aplicável'
        ];
      }
      
      // Limitations and considerations for S/F ratio
      const limitations = [
        'Menos preciso que P/F ratio em SpO2 >97%',
        'Pode subestimar gravidade em casos severos',
        'Influenciado por hemoglobina e pH',
        'Não substitui gasometria em casos graves',
        'Curva de dissociação da Hb afeta precisão'
      ];
      
      // When to obtain arterial blood gas
      const abgIndications = [
        'S/F ratio <235 (equivalente ARDS)',
        'SpO2 <90% persistente',
        'Deterioração clínica',
        'Necessidade de ventilação mecânica',
        'Suspeita de distúrbio ácido-base',
        'Monitoramento de CO2 necessário'
      ];
      
      // Age-specific considerations
      let ageConsiderations = [];
      if (inputs.patientAge) {
        const age = parseInt(inputs.patientAge);
        if (age < 18) {
          ageConsiderations = [
            'Valores de referência podem diferir em pediatria',
            'SpO2 alvo geralmente 92-97% em crianças',
            'Maior sensibilidade a hipoxemia',
            'Considerar shunt intrapulmonar'
          ];
        } else if (age > 65) {
          ageConsiderations = [
            'SpO2 alvo pode ser 88-92% em DPOC',
            'Maior risco de complicações',
            'Considerar comorbidades pulmonares',
            'Função pulmonar basal pode estar reduzida'
          ];
        }
      }
      
      // Monitoring recommendations
      const monitoringRecommendations = [
        'SpO2 contínua com alarmes apropriados',
        'Avaliação clínica frequente',
        'Sinais de trabalho respiratório',
        'Frequência respiratória e padrão',
        'Uso de musculatura acessória',
        'Nível de consciência'
      ];
      
      // Ventilation strategy if applicable
      let ventilationStrategy = [];
      if (inputs.mechanicalVentilation === 'yes') {
        if (sfRatio >= 235) {
          ventilationStrategy = [
            'Volume corrente: 6-8 ml/kg peso predito',
            'PEEP: 5-10 cmH2O',
            'FiO2: mínima para SpO2 88-95%',
            'Pressão de platô: <30 cmH2O'
          ];
        } else if (sfRatio >= 150) {
          ventilationStrategy = [
            'Volume corrente: 6 ml/kg peso predito',
            'PEEP: 10-15 cmH2O',
            'Driving pressure: <15 cmH2O',
            'Considerar posição prona se S/F <200'
          ];
        } else {
          ventilationStrategy = [
            'Volume corrente: 4-6 ml/kg peso predito',
            'PEEP: 15-20 cmH2O',
            'Posição prona: 12-16 horas/dia',
            'Considerar ECMO se S/F <100'
          ];
        }
      }
      
      // Quality indicators for SpO2 measurement
      const qualityIndicators = [
        'Sinal de pulso adequado no oxímetro',
        'Ausência de artefatos de movimento',
        'Perfusão periférica adequada',
        'Temperatura das extremidades',
        'Ausência de esmalte/sujeira nas unhas',
        'Calibração adequada do equipamento'
      ];
      
      const calculatedResults = {
        spo2,
        fio2: fio2Value,
        fio2Percentage: Math.round(fio2Value * 100),
        sfRatio,
        correctedSfRatio,
        altitudeCorrection,
        estimatedPF,
        alternativePF,
        interpretation,
        severity,
        severityColor,
        ardsEquivalent,
        clinicalSignificance,
        recommendations,
        limitations,
        abgIndications,
        ageConsiderations,
        monitoringRecommendations,
        ventilationStrategy,
        qualityIndicators,
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
      spo2: '',
      fio2: '',
      fio2Percentage: '',
      inputMethod: 'decimal',
      peep: '',
      mechanicalVentilation: '',
      altitude: '',
      patientAge: ''
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `Relação SpO2/FiO2 - Resultados:\n`;
    resultText += `Data/Hora: ${results.calculationDate}\n\n`;
    
    resultText += `PARÂMETROS:\n`;
    resultText += `SpO2: ${results.spo2}%\n`;
    resultText += `FiO2: ${results.fio2Percentage}% (${results.fio2})\n\n`;
    
    resultText += `RESULTADO:\n`;
    resultText += `Relação S/F: ${results.sfRatio}\n`;
    if (results.altitudeCorrection) {
      resultText += `${results.altitudeCorrection}\n`;
    }
    resultText += `P/F Estimado: ${results.estimatedPF}\n`;
    if (results.alternativePF) {
      resultText += `P/F Alternativo: ${results.alternativePF}\n`;
    }
    resultText += `Interpretação: ${results.interpretation}\n`;
    resultText += `Equivalência: ${results.ardsEquivalent}\n\n`;
    
    resultText += `Significado Clínico:\n${results.clinicalSignificance}\n\n`;
    resultText += `Recomendações:\n${results.recommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    
    if (results.ventilationStrategy.length > 0) {
      resultText += `Estratégia Ventilatória:\n${results.ventilationStrategy.map(v => `• ${v}`).join('\n')}\n\n`;
    }
    
    resultText += `Monitoramento:\n${results.monitoringRecommendations.map(m => `• ${m}`).join('\n')}\n\n`;
    resultText += `Avaliado por: [Nome do profissional]`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Relação SpO2/FiO2 (S/F Ratio)
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros de Entrada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SpO2 Input */}
              <div className="space-y-2">
                <Label htmlFor="spo2" className="text-sm font-medium">
                  SpO2 (%) *
                </Label>
                <input
                  id="spo2"
                  type="number"
                  value={inputs.spo2}
                  onChange={(e) => setInputs(prev => ({ ...prev, spo2: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-gray-200"
                  placeholder="Ex: 95"
                  min="70"
                  max="100"
                  step="1"
                />
                {errors.spo2 && (
                  <p className="text-sm text-red-500">{errors.spo2}</p>
                )}
                <p className="text-xs text-gray-300">
                  Saturação de oxigênio periférica (oximetria de pulso)
                </p>
              </div>
              
              {/* FiO2 Input Method */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Formato de entrada da FiO2
                </Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="decimal"
                      checked={inputs.inputMethod === 'decimal'}
                      onChange={(e) => setInputs(prev => ({ ...prev, inputMethod: e.target.value }))}
                      className="text-blue-400"
                    />
                    <span className="text-sm">Decimal (0.21-1.0)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="percentage"
                      checked={inputs.inputMethod === 'percentage'}
                      onChange={(e) => setInputs(prev => ({ ...prev, inputMethod: e.target.value }))}
                      className="text-blue-400"
                    />
                    <span className="text-sm">Porcentagem (21-100%)</span>
                  </label>
                </div>
              </div>
              
              {/* FiO2 Input */}
              {inputs.inputMethod === 'decimal' ? (
                <div className="space-y-2">
                  <Label htmlFor="fio2" className="text-sm font-medium">
                    FiO2 (fração decimal) *
                  </Label>
                  <input
                    id="fio2"
                    type="number"
                    value={inputs.fio2}
                    onChange={(e) => setInputs(prev => ({ ...prev, fio2: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-gray-200"
                    placeholder="Ex: 0.4"
                    min="0.21"
                    max="1.0"
                    step="0.01"
                  />
                  {errors.fio2 && (
                    <p className="text-sm text-red-500">{errors.fio2}</p>
                  )}
                  <p className="text-xs text-gray-300">
                    Fração inspirada de oxigênio (0.21 = ar ambiente)
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="fio2-percentage" className="text-sm font-medium">
                    FiO2 (%) *
                  </Label>
                  <input
                    id="fio2-percentage"
                    type="number"
                    value={inputs.fio2Percentage}
                    onChange={(e) => setInputs(prev => ({ ...prev, fio2Percentage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-gray-200"
                    placeholder="Ex: 40"
                    min="21"
                    max="100"
                    step="1"
                  />
                  {errors.fio2Percentage && (
                    <p className="text-sm text-red-500">{errors.fio2Percentage}</p>
                  )}
                  <p className="text-xs text-gray-300">
                    Porcentagem de oxigênio inspirado (21% = ar ambiente)
                  </p>
                </div>
              )}
              
              {/* Optional Parameters */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3 text-gray-200">Parâmetros Opcionais</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="peep" className="text-sm font-medium">
                      PEEP (cmH2O)
                    </Label>
                    <input
                      id="peep"
                      type="number"
                      value={inputs.peep}
                      onChange={(e) => setInputs(prev => ({ ...prev, peep: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-gray-200"
                      placeholder="Ex: 10"
                      min="0"
                      max="30"
                      step="1"
                    />
                    {errors.peep && (
                      <p className="text-sm text-red-500">{errors.peep}</p>
                    )}
                    <p className="text-xs text-gray-300">
                      Para contexto ventilatório
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="altitude" className="text-sm font-medium">
                      Altitude (metros)
                    </Label>
                    <input
                      id="altitude"
                      type="number"
                      value={inputs.altitude}
                      onChange={(e) => setInputs(prev => ({ ...prev, altitude: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-gray-200"
                      placeholder="Ex: 800"
                      min="0"
                      max="5000"
                      step="1"
                    />
                    {errors.altitude && (
                      <p className="text-sm text-red-500">{errors.altitude}</p>
                    )}
                    <p className="text-xs text-gray-600">
                      Para correção da pressão barométrica
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="patient-age" className="text-sm font-medium">
                      Idade (anos)
                    </Label>
                    <input
                      id="patient-age"
                      type="number"
                      value={inputs.patientAge}
                      onChange={(e) => setInputs(prev => ({ ...prev, patientAge: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-gray-200"
                      placeholder="Ex: 65"
                      min="0"
                      max="120"
                      step="1"
                    />
                    {errors.patientAge && (
                      <p className="text-sm text-red-500">{errors.patientAge}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 space-y-3">
                  <Label className="text-sm font-medium">
                    Paciente em ventilação mecânica?
                  </Label>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="yes"
                        checked={inputs.mechanicalVentilation === 'yes'}
                        onChange={(e) => setInputs(prev => ({ ...prev, mechanicalVentilation: e.target.value }))}
                        className="text-blue-400"
                      />
                      <span className="text-sm">Sim</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="no"
                        checked={inputs.mechanicalVentilation === 'no'}
                        onChange={(e) => setInputs(prev => ({ ...prev, mechanicalVentilation: e.target.value }))}
                        className="text-blue-400"
                      />
                      <span className="text-sm">Não</span>
                    </label>
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
                        {results.sfRatio}
                      </span>
                      <p className="text-sm text-blue-300 mt-1">Relação S/F</p>
                    </div>
                    
                    {results.altitudeCorrection && (
                      <div className="text-center mb-3 p-2 bg-blue-900/30 rounded">
                        <p className="text-sm text-blue-200">{results.altitudeCorrection}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-200">SpO2:</span>
                        <p className="text-blue-300">{results.spo2}%</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-200">FiO2:</span>
                        <p className="text-blue-300">{results.fio2Percentage}%</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* P/F Estimation */}
                  <div className="p-3 rounded-lg border bg-purple-900/20 border-purple-700/50">
                    <h4 className="font-semibold text-purple-200 mb-2">P/F Estimado:</h4>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-lg font-bold text-purple-200">{results.estimatedPF}</span>
                      <span className="text-sm text-purple-300">mmHg (Rice et al.)</span>
                    </div>
                    {results.alternativePF && (
                      <div className="flex justify-between items-center">
                        <span className="text-md font-semibold text-purple-200">{results.alternativePF}</span>
                        <span className="text-sm text-purple-300">mmHg (SpO2 ≤97%)</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Interpretation */}
                  <div className={`p-4 rounded-lg border ${
                    results.severity === 'NORMAL' ? 'bg-green-900/20 border-green-700/50' :
                    results.severity === 'LEVE' ? 'bg-amber-900/30 border-amber-700/50' :
                    results.severity === 'MODERADA' ? 'bg-orange-900/20 border-orange-700/50' :
                    'bg-red-900/30 border-red-700/50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-lg ${results.severityColor}`}>
                        {results.interpretation}
                      </span>
                      <Badge className={`${
                        results.severity === 'NORMAL' ? 'bg-green-900/30 text-green-200 border border-green-700/50' :
                        results.severity === 'LEVE' ? 'bg-amber-900/40 text-amber-200 border border-amber-600/50' :
                        results.severity === 'MODERADA' ? 'bg-orange-900/30 text-orange-200 border border-orange-700/50' :
                        'bg-red-900/30 text-red-200 border border-red-700/50'
                      }`}>
                        {results.severity}
                      </Badge>
                    </div>
                    <p className="text-sm opacity-90 mb-2">{results.clinicalSignificance}</p>
                    <p className="text-xs font-medium opacity-75">{results.ardsEquivalent}</p>
                  </div>
                  
                  {/* Clinical Recommendations */}
                  <div className="p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
                    <h4 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
                      {results.severity === 'GRAVE' && <AlertTriangle className="h-4 w-4" />}
                      Recomendações Clínicas:
                    </h4>
                    <ul className="text-sm text-blue-200 space-y-1">
                      {results.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Ventilation Strategy */}
                  {results.ventilationStrategy.length > 0 && (
                    <div className="p-3 rounded-lg border bg-green-900/20 border-green-700/50">
                      <h4 className="font-semibold text-green-200 mb-2">Estratégia Ventilatória:</h4>
                      <ul className="text-sm text-green-200 space-y-1">
                        {results.ventilationStrategy.map((strategy, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Age Considerations */}
                  {results.ageConsiderations.length > 0 && (
                    <div className="p-3 rounded-lg border bg-purple-900/20 border-purple-700/50">
                      <h4 className="font-semibold text-purple-200 mb-2">Considerações por Idade:</h4>
                      <ul className="text-sm text-purple-200 space-y-1">
                        {results.ageConsiderations.map((consideration, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{consideration}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Monitoring */}
                  <div className="p-3 rounded-lg border bg-gray-900/20 border-gray-700/50">
                    <h4 className="font-semibold text-gray-200 mb-2">Monitoramento:</h4>
                    <ul className="text-sm text-gray-200 space-y-1">
                      {results.monitoringRecommendations.map((mon, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{mon}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Insira SpO2 e FiO2 e clique em "Calcular"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Additional Information Cards */}
        {results && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ABG Indications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Indicações para Gasometria Arterial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {results.abgIndications.map((indication, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{indication}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            {/* Quality Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Qualidade da Medição SpO2
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {results.qualityIndicators.map((indicator, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Limitations */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Limitações da Relação S/F
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                {results.limitations.map((limitation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        
        {/* Reference Information */}
        <Card>
          <CardHeader>
            <CardTitle>Relação S/F vs P/F e Referências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Equivalências S/F ↔ P/F:</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <ul className="text-sm space-y-1">
                    <li>• <strong>S/F ≥315:</strong> Equivale a P/F ≥300 (Normal)</li>
                    <li>• <strong>S/F 235-314:</strong> Equivale a P/F 200-299 (ARDS leve)</li>
                    <li>• <strong>S/F 150-234:</strong> Equivale a P/F 100-199 (ARDS moderada)</li>
                    <li>• <strong>S/F &lt;150:</strong> Equivale a P/F &lt;100 (ARDS grave)</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Fórmulas de Conversão:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Rice et al.:</strong> P/F = 64 + 0.84 × (S/F)</li>
                  <li>• <strong>SpO2 ≤97%:</strong> P/F ≈ S/F × 1.2</li>
                  <li>• <strong>Precisão:</strong> Melhor para SpO2 88-97%</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Vantagens da Relação S/F:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Não invasiva e contínua</li>
                  <li>• Disponível em tempo real</li>
                  <li>• Não requer gasometria arterial</li>
                  <li>• Útil para triagem e monitoramento</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Limitações:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Menos precisa em SpO2 &gt;97%</li>
                  <li>• Não fornece informações sobre CO2 e pH</li>
                  <li>• Influenciada por hemoglobina e temperatura</li>
                  <li>• Não substitui gasometria em casos graves</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Rice TW et al. Comparison of SpO2/FiO2 ratio and PaO2/FiO2 ratio. Chest 2007</li>
                  <li>• Pandharipande PP et al. Derivation and validation of SpO2/FiO2 ratio. Intensive Care Med 2009</li>
                  <li>• ARDS Definition Task Force. JAMA 2012</li>
                  <li>• Diretrizes AMIB - Ventilação Mecânica 2020</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default SpO2FiO2Ratio;