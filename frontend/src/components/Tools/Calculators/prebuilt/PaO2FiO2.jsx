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
import { Copy, Calculator, Lung, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

/**
 * PaO2FiO2 - PaO2/FiO2 Ratio Calculator
 * 
 * This component calculates the PaO2/FiO2 ratio (P/F ratio) for assessing
 * oxygenation status and severity of acute lung injury/ARDS.
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
 * <PaO2FiO2 
 *   open={showHardcodedCalculator === 'pao2-fio2'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Calculation example
 * // Input: pao2=80, fio2=0.4
 * // Output: pfRatio=200, interpretation="ARDS leve"
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function PaO2FiO2({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    pao2: '',
    fio2: '',
    fio2Percentage: '',
    inputMethod: 'decimal', // decimal, percentage
    altitude: '',
    peep: '',
    patientWeight: '',
    mechanicalVentilation: ''
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  /**
   * Validates input parameters for P/F ratio calculation
   * 
   * @returns {boolean} True if all required inputs are provided
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.pao2) {
      newErrors.pao2 = 'PaO2 é obrigatório';
    } else if (inputs.pao2 < 20 || inputs.pao2 > 600) {
      newErrors.pao2 = 'PaO2 deve estar entre 20 e 600 mmHg';
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
    
    if (inputs.altitude && (inputs.altitude < 0 || inputs.altitude > 5000)) {
      newErrors.altitude = 'Altitude deve estar entre 0 e 5000 metros';
    }
    
    if (inputs.peep && (inputs.peep < 0 || inputs.peep > 30)) {
      newErrors.peep = 'PEEP deve estar entre 0 e 30 cmH2O';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Calculates P/F ratio and provides clinical interpretation
   * 
   * @returns {Object} Calculation results with clinical interpretation
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      const pao2 = parseFloat(inputs.pao2);
      let fio2Value;
      
      if (inputs.inputMethod === 'decimal') {
        fio2Value = parseFloat(inputs.fio2);
      } else {
        fio2Value = parseFloat(inputs.fio2Percentage) / 100;
      }
      
      // Calculate P/F ratio
      const pfRatio = Math.round(pao2 / fio2Value);
      
      // Altitude correction if provided
      let correctedPfRatio = pfRatio;
      let altitudeCorrection = '';
      if (inputs.altitude) {
        const altitude = parseFloat(inputs.altitude);
        // Barometric pressure decreases ~12 mmHg per 100m elevation
        const barometricPressure = 760 - (altitude * 0.12);
        const correctionFactor = 760 / barometricPressure;
        correctedPfRatio = Math.round(pfRatio * correctionFactor);
        altitudeCorrection = `Corrigido para altitude (${altitude}m): ${correctedPfRatio}`;
      }
      
      // Clinical interpretation based on Berlin Definition for ARDS
      let interpretation = '';
      let severity = '';
      let severityColor = '';
      let clinicalSignificance = '';
      let recommendations = [];
      
      if (pfRatio >= 300) {
        interpretation = 'Oxigenação normal';
        severity = 'NORMAL';
        severityColor = 'text-green-200';
        clinicalSignificance = 'Função pulmonar preservada. Oxigenação adequada.';
        recommendations = [
          'Manter cuidados de rotina',
          'Monitoramento padrão',
          'Considerar desmame de O2 se aplicável',
          'Mobilização precoce'
        ];
      } else if (pfRatio >= 200) {
        interpretation = 'ARDS leve';
        severity = 'LEVE';
        severityColor = 'text-amber-200';
        clinicalSignificance = 'Lesão pulmonar aguda leve. Requer monitoramento e suporte.';
        recommendations = [
          'Ventilação protetora (Vt 6-8 ml/kg)',
          'PEEP otimizado (5-10 cmH2O)',
          'Monitoramento frequente de gasometria',
          'Investigar e tratar causa subjacente',
          'Considerar posição prona se deterioração',
          'Evitar sobrecarga hídrica'
        ];
      } else if (pfRatio >= 100) {
        interpretation = 'ARDS moderada';
        severity = 'MODERADA';
        severityColor = 'text-orange-200';
        clinicalSignificance = 'Lesão pulmonar significativa. Requer cuidados intensivos.';
        recommendations = [
          'Ventilação protetora rigorosa (Vt 6 ml/kg)',
          'PEEP elevado (10-15 cmH2O)',
          'Considerar posição prona (12-16h/dia)',
          'Bloqueador neuromuscular se necessário',
          'Monitoramento hemodinâmico',
          'Balanço hídrico negativo',
          'Sedação adequada',
          'Prevenção de complicações'
        ];
      } else {
        interpretation = 'ARDS grave';
        severity = 'GRAVE';
        severityColor = 'text-red-200';
        clinicalSignificance = 'Lesão pulmonar severa. Risco de vida elevado.';
        recommendations = [
          'Ventilação protetora ultra-rigorosa',
          'PEEP alto (15-20 cmH2O)',
          'Posição prona obrigatória',
          'Bloqueador neuromuscular',
          'Considerar ECMO se disponível',
          'Óxido nítrico inalatório',
          'Corticosteroides se ARDS persistente',
          'Suporte hemodinâmico',
          'Cuidados de fim de vida se apropriado'
        ];
      }
      
      // Additional assessments
      let oxygenationIndex = null;
      let oxygenationIndexInterpretation = '';
      if (inputs.peep) {
        const peep = parseFloat(inputs.peep);
        oxygenationIndex = Math.round((fio2Value * 100 * (peep + 5)) / pao2 * 100) / 100;
        
        if (oxygenationIndex < 4) {
          oxygenationIndexInterpretation = 'Baixo (bom prognóstico)';
        } else if (oxygenationIndex < 8) {
          oxygenationIndexInterpretation = 'Moderado';
        } else if (oxygenationIndex < 16) {
          oxygenationIndexInterpretation = 'Alto (prognóstico reservado)';
        } else {
          oxygenationIndexInterpretation = 'Muito alto (considerar ECMO)';
        }
      }
      
      // Ventilation strategy recommendations
      let ventilationStrategy = [];
      if (inputs.mechanicalVentilation === 'yes') {
        if (pfRatio >= 200) {
          ventilationStrategy = [
            'Volume corrente: 6-8 ml/kg peso predito',
            'Pressão de platô: <30 cmH2O',
            'PEEP: 5-10 cmH2O',
            'FiO2: mínima para SpO2 88-95%'
          ];
        } else if (pfRatio >= 100) {
          ventilationStrategy = [
            'Volume corrente: 6 ml/kg peso predito',
            'Pressão de platô: <30 cmH2O',
            'PEEP: 10-15 cmH2O (tabela PEEP/FiO2)',
            'Posição prona: considerar se P/F <150',
            'Driving pressure: <15 cmH2O'
          ];
        } else {
          ventilationStrategy = [
            'Volume corrente: 4-6 ml/kg peso predito',
            'Pressão de platô: <30 cmH2O',
            'PEEP: 15-20 cmH2O',
            'Posição prona: 12-16 horas/dia',
            'Bloqueador neuromuscular: primeiras 48h',
            'Considerar ECMO se P/F <80'
          ];
        }
      }
      
      // Monitoring recommendations
      const monitoringRecommendations = [
        'Gasometria arterial a cada 4-6 horas',
        'Radiografia de tórax diária',
        'Monitoramento contínuo de SpO2',
        'Pressões ventilatórias (Pplatô, PEEP, ΔP)',
        'Balanço hídrico rigoroso',
        'Sinais de barotrauma/volutrauma'
      ];
      
      // Prognostic factors
      const prognosticFactors = [
        'P/F ratio <100: mortalidade ~45%',
        'P/F ratio 100-200: mortalidade ~25%',
        'P/F ratio >200: mortalidade ~15%',
        'Idade >65 anos: pior prognóstico',
        'Comorbidades: diabetes, IRC, cardiopatia',
        'Causa da ARDS: pneumonia vs trauma'
      ];
      
      // Complications to monitor
      const complications = [
        'Pneumotórax/pneumomediastino',
        'Infecção associada à ventilação',
        'Fraqueza muscular adquirida na UTI',
        'Fibrose pulmonar',
        'Disfunção de múltiplos órgãos',
        'Tromboembolismo pulmonar'
      ];
      
      const calculatedResults = {
        pao2,
        fio2: fio2Value,
        fio2Percentage: Math.round(fio2Value * 100),
        pfRatio,
        correctedPfRatio,
        altitudeCorrection,
        interpretation,
        severity,
        severityColor,
        clinicalSignificance,
        recommendations,
        oxygenationIndex,
        oxygenationIndexInterpretation,
        ventilationStrategy,
        monitoringRecommendations,
        prognosticFactors,
        complications,
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
      pao2: '',
      fio2: '',
      fio2Percentage: '',
      inputMethod: 'decimal',
      altitude: '',
      peep: '',
      patientWeight: '',
      mechanicalVentilation: ''
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `Relação PaO2/FiO2 - Resultados:\n`;
    resultText += `Data/Hora: ${results.calculationDate}\n\n`;
    
    resultText += `PARÂMETROS:\n`;
    resultText += `PaO2: ${results.pao2} mmHg\n`;
    resultText += `FiO2: ${results.fio2Percentage}% (${results.fio2})\n\n`;
    
    resultText += `RESULTADO:\n`;
    resultText += `Relação P/F: ${results.pfRatio}\n`;
    if (results.altitudeCorrection) {
      resultText += `${results.altitudeCorrection}\n`;
    }
    resultText += `Interpretação: ${results.interpretation}\n`;
    resultText += `Gravidade: ${results.severity}\n\n`;
    
    if (results.oxygenationIndex) {
      resultText += `Índice de Oxigenação: ${results.oxygenationIndex} (${results.oxygenationIndexInterpretation})\n\n`;
    }
    
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
            <Lung className="h-5 w-5" />
            Relação PaO2/FiO2 (P/F Ratio)
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros de Entrada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PaO2 Input */}
              <div className="space-y-2">
                <Label htmlFor="pao2" className="text-sm font-medium">
                  PaO2 (mmHg) *
                </Label>
                <input
                  id="pao2"
                  type="number"
                  value={inputs.pao2}
                  onChange={(e) => setInputs(prev => ({ ...prev, pao2: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-gray-200"
                  placeholder="Ex: 80"
                  min="20"
                  max="600"
                  step="0.1"
                />
                {errors.pao2 && (
                  <p className="text-sm text-red-500">{errors.pao2}</p>
                )}
                <p className="text-xs text-gray-300">
                  Pressão parcial de oxigênio no sangue arterial
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
                      Para cálculo do Índice de Oxigenação
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
                    <p className="text-xs text-gray-300">
                      Para correção da pressão barométrica
                    </p>
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
                        {results.pfRatio}
                      </span>
                      <p className="text-sm text-blue-300 mt-1">Relação P/F</p>
                    </div>
                    
                    {results.altitudeCorrection && (
                      <div className="text-center mb-3 p-2 bg-blue-100 rounded">
                        <p className="text-sm text-blue-300">{results.altitudeCorrection}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-300">PaO2:</span>
                        <p className="text-blue-300">{results.pao2} mmHg</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-200">FiO2:</span>
                        <p className="text-blue-300">{results.fio2Percentage}%</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Interpretation */}
                  <div className={`p-4 rounded-lg border ${
                    results.severity === 'NORMAL' ? 'bg-green-900/20 border-green-700/50' :
                    results.severity === 'LEVE' ? 'bg-amber-900/30 border-amber-700/50' :
                    results.severity === 'MODERADA' ? 'bg-orange-900/20 border-orange-700/50' :
                    'bg-red-900/20 border-red-700/50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-lg ${results.severityColor}`}>
                        {results.interpretation}
                      </span>
                      <Badge className={`${
                        results.severity === 'NORMAL' ? 'bg-green-900/20 border border-green-700/50 text-green-200' :
                        results.severity === 'LEVE' ? 'bg-amber-900/30 border border-amber-700/50 text-amber-200' :
                        results.severity === 'MODERADA' ? 'bg-orange-900/20 border border-orange-700/50 text-orange-200' :
                        'bg-red-900/20 border border-red-700/50 text-red-200'
                      }`}>
                        {results.severity}
                      </Badge>
                    </div>
                    <p className="text-sm opacity-90">{results.clinicalSignificance}</p>
                  </div>
                  
                  {/* Oxygenation Index */}
                  {results.oxygenationIndex && (
                    <div className="p-3 rounded-lg border bg-purple-900/20 border-purple-700/50">
                      <h4 className="font-semibold text-purple-200 mb-2">Índice de Oxigenação:</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-purple-300">{results.oxygenationIndex}</span>
                        <span className="text-sm text-purple-300">{results.oxygenationIndexInterpretation}</span>
                      </div>
                      <p className="text-xs text-purple-300 mt-1">
                        OI = (FiO2 × MAP × 100) / PaO2
                      </p>
                    </div>
                  )}
                  
                  {/* Clinical Recommendations */}
                  <div className="p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
                    <h4 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
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
                  
                  {/* Ventilation Strategy */}
                  {results.ventilationStrategy.length > 0 && (
                    <div className="p-3 rounded-lg border bg-green-900/20 border-green-700/50">
                      <h4 className="font-semibold text-green-200 mb-2">Estratégia Ventilatória:</h4>
                      <ul className="text-sm text-green-300 space-y-1">
                        {results.ventilationStrategy.map((strategy, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Monitoring */}
                  <div className="p-3 rounded-lg border bg-gray-900/20 border-gray-700/50">
                    <h4 className="font-semibold text-gray-200 mb-2">Monitoramento:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
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
                  Insira PaO2 e FiO2 e clique em "Calcular"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Additional Information Cards */}
        {results && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prognostic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Fatores Prognósticos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {results.prognosticFactors.map((factor, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            {/* Complications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Complicações a Monitorar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {results.complications.map((comp, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{comp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Reference Information */}
        <Card>
          <CardHeader>
            <CardTitle>Definição de Berlin para ARDS e Referências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Critérios de Berlin (2012):</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <ul className="text-sm space-y-1">
                    <li>• <strong>ARDS Leve:</strong> P/F 200-300 mmHg (PEEP ≥5 cmH2O)</li>
                    <li>• <strong>ARDS Moderada:</strong> P/F 100-200 mmHg (PEEP ≥5 cmH2O)</li>
                    <li>• <strong>ARDS Grave:</strong> P/F ≤100 mmHg (PEEP ≥5 cmH2O)</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Outros Critérios:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Início agudo (dentro de 1 semana)</li>
                  <li>• Infiltrados bilaterais na radiografia</li>
                  <li>• Não explicado por insuficiência cardíaca</li>
                  <li>• PEEP mínimo de 5 cmH2O</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Limitações:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Varia com FiO2 e PEEP utilizados</li>
                  <li>• Influenciado pela altitude</li>
                  <li>• Não considera comorbidades</li>
                  <li>• Melhor interpretado em contexto clínico</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• ARDS Definition Task Force. JAMA 2012</li>
                  <li>• Surviving Sepsis Campaign Guidelines 2021</li>
                  <li>• ESICM/SCCM Clinical Practice Guidelines</li>
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

export default PaO2FiO2;