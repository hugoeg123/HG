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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Copy, Calculator, Heart, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

/**
 * QTcCalculation - QT Interval Correction Calculator
 * 
 * This component calculates corrected QT interval (QTc) using various
 * formulas (Bazett, Fridericia, Framingham, Hodges) for arrhythmia assessment.
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
 * <QTcCalculation 
 *   open={showHardcodedCalculator === 'qtc-calculation'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Calculation example
 * // Input: qtInterval=400, heartRate=75, formula="bazett"
 * // Output: qtcBazett=461, interpretation="Normal"
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function QTcCalculation({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    qtInterval: '',
    heartRate: '',
    rrInterval: '',
    inputMethod: 'hr', // hr, rr
    formula: 'bazett', // bazett, fridericia, framingham, hodges
    patientSex: '',
    patientAge: '',
    medications: ''
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // QTc formulas available
  const qtcFormulas = [
    {
      id: 'bazett',
      name: 'Bazett',
      description: 'QTc = QT / √RR (mais comum, superestima em FC alta)',
      accuracy: 'Boa para FC 60-100 bpm'
    },
    {
      id: 'fridericia',
      name: 'Fridericia',
      description: 'QTc = QT / ∛RR (melhor para FC extremas)',
      accuracy: 'Melhor para taquicardia/bradicardia'
    },
    {
      id: 'framingham',
      name: 'Framingham',
      description: 'QTc = QT + 0.154(1-RR) (linear)',
      accuracy: 'Boa para população geral'
    },
    {
      id: 'hodges',
      name: 'Hodges',
      description: 'QTc = QT + 1.75(FC-60) (baseada em FC)',
      accuracy: 'Simples, baseada em frequência'
    }
  ];

  /**
   * Validates input parameters for QTc calculation
   * 
   * @returns {boolean} True if all required inputs are provided
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.qtInterval) {
      newErrors.qtInterval = 'Intervalo QT é obrigatório';
    } else if (inputs.qtInterval < 200 || inputs.qtInterval > 800) {
      newErrors.qtInterval = 'QT deve estar entre 200 e 800 ms';
    }
    
    if (inputs.inputMethod === 'hr') {
      if (!inputs.heartRate) {
        newErrors.heartRate = 'Frequência cardíaca é obrigatória';
      } else if (inputs.heartRate < 30 || inputs.heartRate > 250) {
        newErrors.heartRate = 'FC deve estar entre 30 e 250 bpm';
      }
    } else {
      if (!inputs.rrInterval) {
        newErrors.rrInterval = 'Intervalo RR é obrigatório';
      } else if (inputs.rrInterval < 240 || inputs.rrInterval > 2000) {
        newErrors.rrInterval = 'RR deve estar entre 240 e 2000 ms';
      }
    }
    
    if (inputs.patientAge && (inputs.patientAge < 0 || inputs.patientAge > 120)) {
      newErrors.patientAge = 'Idade deve estar entre 0 e 120 anos';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Calculates QTc using various formulas and provides clinical interpretation
   * 
   * @returns {Object} Calculation results with clinical interpretation
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      const qtMs = parseFloat(inputs.qtInterval);
      let rrSeconds;
      let heartRate;
      
      // Calculate RR interval and heart rate
      if (inputs.inputMethod === 'hr') {
        heartRate = parseFloat(inputs.heartRate);
        rrSeconds = 60 / heartRate;
      } else {
        const rrMs = parseFloat(inputs.rrInterval);
        rrSeconds = rrMs / 1000;
        heartRate = Math.round(60 / rrSeconds);
      }
      
      // Calculate QTc using different formulas
      const qtcBazett = Math.round(qtMs / Math.sqrt(rrSeconds));
      const qtcFridericia = Math.round(qtMs / Math.pow(rrSeconds, 1/3));
      const qtcFramingham = Math.round(qtMs + 154 * (1 - rrSeconds));
      const qtcHodges = Math.round(qtMs + 1.75 * (heartRate - 60));
      
      // Select primary result based on chosen formula
      let primaryQTc;
      switch (inputs.formula) {
        case 'bazett':
          primaryQTc = qtcBazett;
          break;
        case 'fridericia':
          primaryQTc = qtcFridericia;
          break;
        case 'framingham':
          primaryQTc = qtcFramingham;
          break;
        case 'hodges':
          primaryQTc = qtcHodges;
          break;
        default:
          primaryQTc = qtcBazett;
      }
      
      // Determine normal ranges based on sex
      let normalRange;
      let borderlineRange;
      let prolongedThreshold;
      
      if (inputs.patientSex === 'male') {
        normalRange = '≤430 ms';
        borderlineRange = '431-450 ms';
        prolongedThreshold = 450;
      } else if (inputs.patientSex === 'female') {
        normalRange = '≤450 ms';
        borderlineRange = '451-470 ms';
        prolongedThreshold = 470;
      } else {
        normalRange = '≤440 ms (geral)';
        borderlineRange = '441-460 ms';
        prolongedThreshold = 460;
      }
      
      // Clinical interpretation
      let interpretation = '';
      let riskLevel = '';
      let riskColor = '';
      let clinicalSignificance = '';
      let recommendations = [];
      
      if (primaryQTc <= (prolongedThreshold - 20)) {
        interpretation = 'QTc Normal';
        riskLevel = 'BAIXO';
        riskColor = 'text-green-200';
        clinicalSignificance = 'Intervalo QT dentro dos limites normais. Baixo risco de arritmias.';
        recommendations = [
          'Monitoramento de rotina',
          'Reavaliar se mudança clínica',
          'Cuidado com medicações que prolongam QT',
          'Manter eletrólitos normais'
        ];
      } else if (primaryQTc <= prolongedThreshold) {
        interpretation = 'QTc Limítrofe';
        riskLevel = 'MODERADO';
        riskColor = 'text-amber-200';
        clinicalSignificance = 'Intervalo QT no limite superior. Requer atenção e monitoramento.';
        recommendations = [
          'Monitoramento mais frequente',
          'Revisar medicações em uso',
          'Corrigir distúrbios eletrolíticos',
          'Considerar repetir ECG',
          'Avaliar fatores de risco adicionais'
        ];
      } else if (primaryQTc <= (prolongedThreshold + 50)) {
        interpretation = 'QTc Prolongado';
        riskLevel = 'ALTO';
        riskColor = 'text-orange-200';
        clinicalSignificance = 'Prolongamento significativo do QT. Risco aumentado de Torsades de Pointes.';
        recommendations = [
          'Monitoramento cardíaco contínuo',
          'Suspender medicações que prolongam QT',
          'Corrigir urgentemente eletrólitos (K+, Mg2+, Ca2+)',
          'Considerar antiarrítmicos se necessário',
          'Avaliar necessidade de marca-passo temporário',
          'Evitar outros fatores de risco'
        ];
      } else {
        interpretation = 'QTc Severamente Prolongado';
        riskLevel = 'CRÍTICO';
        riskColor = 'text-red-200';
        clinicalSignificance = 'Prolongamento severo do QT. Alto risco de morte súbita por Torsades de Pointes.';
        recommendations = [
          'URGENTE: Monitoramento cardíaco intensivo',
          'Suspender IMEDIATAMENTE medicações QT+',
          'Correção agressiva de eletrólitos',
          'Considerar marca-passo temporário',
          'Magnésio IV profilático',
          'Preparar para cardioversão se necessário',
          'Consulta cardiológica urgente'
        ];
      }
      
      // Risk factors assessment
      const riskFactors = {
        medications: [
          'Antiarrítmicos (amiodarona, sotalol, quinidina)',
          'Antibióticos (azitromicina, levofloxacino)',
          'Antipsicóticos (haloperidol, quetiapina)',
          'Antidepressivos (citalopram, escitalopram)',
          'Antieméticos (ondansetrona, droperidol)',
          'Antifúngicos (fluconazol, voriconazol)'
        ],
        electrolytes: [
          'Hipocalemia (K+ <3.5 mEq/L)',
          'Hipomagnesemia (Mg2+ <1.8 mg/dL)',
          'Hipocalcemia (Ca2+ <8.5 mg/dL)',
          'Hiponatremia severa'
        ],
        clinical: [
          'Bradicardia (<50 bpm)',
          'Insuficiência cardíaca',
          'Isquemia miocárdica aguda',
          'AVC (especialmente hemorragico)',
          'Hipotermia',
          'Anorexia nervosa'
        ],
        genetic: [
          'Síndrome do QT longo congênito',
          'História familiar de morte súbita',
          'Mutações nos canais iônicos'
        ]
      };
      
      // Monitoring recommendations
      const monitoringRecommendations = [
        'ECG seriados (especialmente após mudanças medicamentosas)',
        'Monitoramento contínuo se QTc >500 ms',
        'Eletrólitos diários em pacientes críticos',
        'Avaliação de sintomas (síncope, palpitações)',
        'Revisão medicamentosa diária',
        'Documentar QTc em prontuário'
      ];
      
      // Emergency management
      const emergencyManagement = [
        'Torsades de Pointes: Magnésio 2g IV em 1-2 min',
        'Se persistir: Cardioversão elétrica',
        'Marca-passo temporário se bradicardia',
        'Isoproterenol se não disponível MP',
        'Evitar antiarrítmicos classe IA e III',
        'Lidocaína pode ser usada se necessário'
      ];
      
      // Age-specific considerations
      let ageConsiderations = [];
      if (inputs.patientAge) {
        const age = parseInt(inputs.patientAge);
        if (age < 18) {
          ageConsiderations = [
            'Valores normais podem ser diferentes em crianças',
            'QTc >460 ms é considerado prolongado em pediatria',
            'Maior sensibilidade a distúrbios eletrolíticos',
            'Considerar síndromes congênitas'
          ];
        } else if (age > 65) {
          ageConsiderations = [
            'Maior risco de prolongamento medicamentoso',
            'Função renal pode afetar clearance de drogas',
            'Maior prevalência de cardiopatias',
            'Polifarmácia aumenta risco de interações'
          ];
        }
      }
      
      const calculatedResults = {
        qtInterval: qtMs,
        heartRate,
        rrInterval: Math.round(rrSeconds * 1000),
        qtcBazett,
        qtcFridericia,
        qtcFramingham,
        qtcHodges,
        primaryQTc,
        selectedFormula: inputs.formula,
        interpretation,
        riskLevel,
        riskColor,
        clinicalSignificance,
        normalRange,
        borderlineRange,
        prolongedThreshold,
        recommendations,
        riskFactors,
        monitoringRecommendations,
        emergencyManagement,
        ageConsiderations,
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
      qtInterval: '',
      heartRate: '',
      rrInterval: '',
      inputMethod: 'hr',
      formula: 'bazett',
      patientSex: '',
      patientAge: '',
      medications: ''
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `Cálculo do QTc - Resultados:\n`;
    resultText += `Data/Hora: ${results.calculationDate}\n\n`;
    
    resultText += `PARÂMETROS:\n`;
    resultText += `QT: ${results.qtInterval} ms\n`;
    resultText += `FC: ${results.heartRate} bpm\n`;
    resultText += `RR: ${results.rrInterval} ms\n\n`;
    
    resultText += `RESULTADOS QTc:\n`;
    resultText += `Bazett: ${results.qtcBazett} ms\n`;
    resultText += `Fridericia: ${results.qtcFridericia} ms\n`;
    resultText += `Framingham: ${results.qtcFramingham} ms\n`;
    resultText += `Hodges: ${results.qtcHodges} ms\n\n`;
    
    resultText += `RESULTADO PRINCIPAL (${results.selectedFormula.toUpperCase()}): ${results.primaryQTc} ms\n`;
    resultText += `Interpretação: ${results.interpretation}\n`;
    resultText += `Risco: ${results.riskLevel}\n\n`;
    
    resultText += `Significado Clínico:\n${results.clinicalSignificance}\n\n`;
    resultText += `Recomendações:\n${results.recommendations.map(r => `• ${r}`).join('\n')}\n\n`;
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
            <Heart className="h-5 w-5" />
            Cálculo do QTc (QT Corrigido)
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros de Entrada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QT Interval */}
              <div className="space-y-2">
                <Label htmlFor="qt-interval" className="text-sm font-medium">
                  Intervalo QT (ms) *
                </Label>
                <input
                  id="qt-interval"
                  type="number"
                  value={inputs.qtInterval}
                  onChange={(e) => setInputs(prev => ({ ...prev, qtInterval: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-gray-200"
                  placeholder="Ex: 400"
                  min="200"
                  max="800"
                  step="1"
                />
                {errors.qtInterval && (
                  <p className="text-sm text-red-500">{errors.qtInterval}</p>
                )}
                <p className="text-xs text-gray-300">
                  Medido do início do QRS ao final da onda T
                </p>
              </div>
              
              {/* Input Method Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Método de entrada
                </Label>
                <RadioGroup
                  value={inputs.inputMethod}
                  onValueChange={(value) => setInputs(prev => ({ ...prev, inputMethod: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hr" id="method-hr" />
                    <Label htmlFor="method-hr" className="text-sm">
                      Frequência Cardíaca (bpm)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rr" id="method-rr" />
                    <Label htmlFor="method-rr" className="text-sm">
                      Intervalo RR (ms)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Heart Rate or RR Interval */}
              {inputs.inputMethod === 'hr' ? (
                <div className="space-y-2">
                  <Label htmlFor="heart-rate" className="text-sm font-medium">
                    Frequência Cardíaca (bpm) *
                  </Label>
                  <input
                    id="heart-rate"
                    type="number"
                    value={inputs.heartRate}
                    onChange={(e) => setInputs(prev => ({ ...prev, heartRate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-gray-200"
                    placeholder="Ex: 75"
                    min="30"
                    max="250"
                    step="1"
                  />
                  {errors.heartRate && (
                    <p className="text-sm text-red-500">{errors.heartRate}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="rr-interval" className="text-sm font-medium">
                    Intervalo RR (ms) *
                  </Label>
                  <input
                    id="rr-interval"
                    type="number"
                    value={inputs.rrInterval}
                    onChange={(e) => setInputs(prev => ({ ...prev, rrInterval: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-gray-200"
                    placeholder="Ex: 800"
                    min="240"
                    max="2000"
                    step="1"
                  />
                  {errors.rrInterval && (
                    <p className="text-sm text-red-500">{errors.rrInterval}</p>
                  )}
                  <p className="text-xs text-gray-300">
                    Intervalo entre duas ondas R consecutivas
                  </p>
                </div>
              )}
              
              {/* Formula Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Fórmula de Correção
                </Label>
                <RadioGroup
                  value={inputs.formula}
                  onValueChange={(value) => setInputs(prev => ({ ...prev, formula: value }))}
                >
                  {qtcFormulas.map((formula) => (
                    <div key={formula.id} className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={formula.id} id={formula.id} />
                        <Label htmlFor={formula.id} className="text-sm font-medium">
                          {formula.name}
                        </Label>
                      </div>
                      <p className="text-xs text-gray-600 ml-6">
                        {formula.description}
                      </p>
                      <p className="text-xs text-blue-600 ml-6">
                        {formula.accuracy}
                      </p>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              {/* Optional Parameters */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3 text-gray-800">Informações Opcionais</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Sexo do Paciente</Label>
                    <RadioGroup
                      value={inputs.patientSex}
                      onValueChange={(value) => setInputs(prev => ({ ...prev, patientSex: value }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="sex-male" />
                        <Label htmlFor="sex-male" className="text-sm">Masculino</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="sex-female" />
                        <Label htmlFor="sex-female" className="text-sm">Feminino</Label>
                      </div>
                    </RadioGroup>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                Resultados do Cálculo
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
                  {/* Main Results */}
                  <div className="p-4 rounded-lg border bg-blue-900/20 border-blue-700/50">
                    <div className="text-center mb-3">
                      <span className="text-3xl font-bold text-blue-200">
                        {results.primaryQTc} ms
                      </span>
                      <p className="text-sm text-blue-300 mt-1">
                        QTc ({results.selectedFormula.charAt(0).toUpperCase() + results.selectedFormula.slice(1)})
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <span className="font-medium text-blue-200">QT:</span>
                        <p className="text-blue-300">{results.qtInterval} ms</p>
                      </div>
                      <div className="text-center">
                        <span className="font-medium text-blue-200">FC:</span>
                        <p className="text-blue-300">{results.heartRate} bpm</p>
                      </div>
                      <div className="text-center">
                        <span className="font-medium text-blue-200">RR:</span>
                        <p className="text-blue-300">{results.rrInterval} ms</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* All QTc Results */}
                  <div className="p-3 rounded-lg border bg-gray-900/30 border-gray-700/50">
                    <h4 className="font-semibold text-gray-200 mb-3">Todas as Fórmulas:</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span>Bazett:</span>
                        <span className="font-medium">{results.qtcBazett} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fridericia:</span>
                        <span className="font-medium">{results.qtcFridericia} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Framingham:</span>
                        <span className="font-medium">{results.qtcFramingham} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hodges:</span>
                        <span className="font-medium">{results.qtcHodges} ms</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Interpretation */}
                  <div className={`p-4 rounded-lg border ${
                    results.riskLevel === 'BAIXO' ? 'bg-green-900/20 border-green-700/50' :
                    results.riskLevel === 'MODERADO' ? 'bg-yellow-900/20 border-yellow-700/50' :
                    results.riskLevel === 'ALTO' ? 'bg-orange-900/20 border-orange-700/50' :
                    'bg-red-900/20 border-red-700/50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-lg ${results.riskColor}`}>
                        {results.interpretation}
                      </span>
                      <Badge className={`${
                        results.riskLevel === 'BAIXO' ? 'bg-green-900/30 text-green-200 border border-green-700/50' :
                        results.riskLevel === 'MODERADO' ? 'bg-yellow-900/30 text-yellow-200 border border-yellow-700/50' :
                        results.riskLevel === 'ALTO' ? 'bg-orange-900/30 text-orange-200 border border-orange-700/50' :
                        'bg-red-900/30 text-red-200 border border-red-700/50'
                      }`}>
                        Risco {results.riskLevel}
                      </Badge>
                    </div>
                    <p className="text-sm opacity-90 mb-2">{results.clinicalSignificance}</p>
                    <div className="text-xs opacity-75">
                      <p>Normal: {results.normalRange}</p>
                      <p>Limítrofe: {results.borderlineRange}</p>
                      <p>Prolongado: &gt;{results.prolongedThreshold} ms</p>
                    </div>
                  </div>
                  
                  {/* Clinical Recommendations */}
                  <div className="p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
                    <h4 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
                      {results.riskLevel === 'CRÍTICO' && <AlertTriangle className="h-4 w-4" />}
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
                  
                  {/* Age-specific considerations */}
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
                  <div className="p-3 rounded-lg border bg-gray-900/30 border-gray-700/50">
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
                  Insira QT e FC/RR e clique em "Calcular"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Risk Factors and Emergency Management */}
        {results && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Fatores de Risco para Prolongamento do QT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-red-800">Medicações:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {results.riskFactors.medications.map((med, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{med}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-orange-800">Distúrbios Eletrolíticos:</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {results.riskFactors.electrolytes.map((elec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{elec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-yellow-800">Condições Clínicas:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {results.riskFactors.clinical.map((clin, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{clin}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Emergency Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Manejo de Emergência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg border bg-red-50 border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">Torsades de Pointes:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {results.emergencyManagement.map((emergency, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{emergency}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Prevenção:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Manter K+ &gt;4.0 mEq/L</li>
                      <li>• Manter Mg2+ &gt;2.0 mg/dL</li>
                      <li>• Evitar bradicardia &lt;50 bpm</li>
                      <li>• Revisar medicações diariamente</li>
                      <li>• ECG antes de iniciar drogas QT+</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Reference Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Informações sobre Fórmulas e Referências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Comparação das Fórmulas:</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Bazett:</strong> Mais usada, mas superestima em taquicardia</li>
                    <li>• <strong>Fridericia:</strong> Melhor para FC extremas (&lt;60 ou &gt;100 bpm)</li>
                    <li>• <strong>Framingham:</strong> Desenvolvida em população geral</li>
                    <li>• <strong>Hodges:</strong> Simples, baseada apenas na FC</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Valores de Referência:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Homens:</strong> Normal ≤430 ms, Prolongado &gt;450 ms</li>
                  <li>• <strong>Mulheres:</strong> Normal ≤450 ms, Prolongado &gt;470 ms</li>
                  <li>• <strong>Crianças:</strong> Prolongado &gt;460 ms</li>
                  <li>• <strong>Risco alto:</strong> QTc &gt;500 ms</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Limitações:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Medição manual do QT pode variar</li>
                  <li>• Diferentes derivações podem ter valores diferentes</li>
                  <li>• Arritmias podem afetar a precisão</li>
                  <li>• Considerar contexto clínico sempre</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• AHA/ACC/HRS Guidelines for Management of Arrhythmias</li>
                  <li>• ESC Guidelines on Ventricular Arrhythmias</li>
                  <li>• CredibleMeds.org - QT Drug Lists</li>
                  <li>• Diretrizes SBC - Arritmias Cardíacas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default QTcCalculation;


// Mapeamento de severidade para cores no tema escuro
// ... existing code ...

        {/* Interpretação */}
        <div className={`mt-4 p-4 rounded-lg border ${
          results.severity === 'normal' ? 'bg-green-900/20 border-green-700/50' :
          results.severity === 'borderline' ? 'bg-amber-900/30 border-amber-700/50' :
          'bg-red-900/30 border-red-700/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`font-bold ${severityColorMap[results.severity]}`}>{results.interpretation}</span>
            <Badge className={`${
              results.severity === 'normal' ? 'bg-green-900/30 text-green-200 border border-green-700/50' :
              results.severity === 'borderline' ? 'bg-amber-900/40 text-amber-200 border border-amber-600/50' :
              'bg-red-900/30 text-red-200 border border-red-700/50'
            }`}>
              {results.severityLabel}
            </Badge>
          </div>
          <p className="text-sm opacity-90">{results.clinicalNotes}</p>
        </div>

        {/* Alertas de Risco */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border bg-purple-900/20 border-purple-700/50">
            <h5 className="font-semibold text-purple-200 mb-1">Riscos Associados</h5>
            <ul className="text-sm text-purple-200 space-y-1">
              {results.riskList.map((item, idx) => (
                <li key={idx} className="flex items-start"><span className="mr-2">•</span><span>{item}</span></li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-lg border bg-gray-900/20 border-gray-700/50">
            <h5 className="font-semibold text-gray-200 mb-1">Conduta</h5>
            <ul className="text-sm text-gray-200 space-y-1">
              {results.managementList.map((item, idx) => (
                <li key={idx} className="flex items-start"><span className="mr-2">•</span><span>{item}</span></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
          <h5 className="font-semibold text-blue-200 mb-1">Fatores de Correção</h5>
          <p className="text-sm text-blue-300">{results.correctionNote}</p>
        </div>

        {/* Informações