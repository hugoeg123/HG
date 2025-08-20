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
import { Copy, Calculator, FileText, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ChildPugh - Child-Pugh Score Calculator
 * 
 * This component calculates the Child-Pugh score for assessing
 * liver function and prognosis in patients with cirrhosis.
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
 * <ChildPugh 
 *   open={showHardcodedCalculator === 'child-pugh'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Calculation example
 * // Input: bilirubin=2.5, albumin=3.0, inr=1.8, ascites="moderate", encephalopathy="grade1"
 * // Output: score=8, class="B", interpretation="Moderada"
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function ChildPugh({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    bilirubin: '',
    albumin: '',
    inr: '',
    ascites: '',
    encephalopathy: '',
    units: 'mg_dl' // mg_dl, umol_l
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Child-Pugh scoring criteria
  const scoringCriteria = {
    bilirubin: {
      mg_dl: [
        { range: '<2.0', points: 1, description: 'Normal' },
        { range: '2.0-3.0', points: 2, description: 'Leve elevação' },
        { range: '>3.0', points: 3, description: 'Elevação significativa' }
      ],
      umol_l: [
        { range: '<34', points: 1, description: 'Normal' },
        { range: '34-51', points: 2, description: 'Leve elevação' },
        { range: '>51', points: 3, description: 'Elevação significativa' }
      ]
    },
    albumin: [
      { range: '>3.5', points: 1, description: 'Normal' },
      { range: '2.8-3.5', points: 2, description: 'Redução leve' },
      { range: '<2.8', points: 3, description: 'Redução significativa' }
    ],
    inr: [
      { range: '<1.7', points: 1, description: 'Normal' },
      { range: '1.7-2.3', points: 2, description: 'Prolongamento leve' },
      { range: '>2.3', points: 3, description: 'Prolongamento significativo' }
    ],
    ascites: [
      { value: 'none', points: 1, description: 'Ausente' },
      { value: 'mild', points: 2, description: 'Leve (controlada com diuréticos)' },
      { value: 'moderate', points: 3, description: 'Moderada/Severa (refratária)' }
    ],
    encephalopathy: [
      { value: 'none', points: 1, description: 'Ausente' },
      { value: 'grade1', points: 2, description: 'Grau I-II (leve)' },
      { value: 'grade3', points: 3, description: 'Grau III-IV (severa)' }
    ]
  };

  /**
   * Validates input parameters for Child-Pugh calculation
   * 
   * @returns {boolean} True if all required inputs are provided
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.bilirubin) {
      newErrors.bilirubin = 'Bilirrubina é obrigatória';
    } else {
      const bilirubin = parseFloat(inputs.bilirubin);
      if (inputs.units === 'mg_dl') {
        if (bilirubin < 0.1 || bilirubin > 50) {
          newErrors.bilirubin = 'Bilirrubina deve estar entre 0.1 e 50 mg/dL';
        }
      } else {
        if (bilirubin < 2 || bilirubin > 850) {
          newErrors.bilirubin = 'Bilirrubina deve estar entre 2 e 850 μmol/L';
        }
      }
    }
    
    if (!inputs.albumin) {
      newErrors.albumin = 'Albumina é obrigatória';
    } else if (inputs.albumin < 1.0 || inputs.albumin > 6.0) {
      newErrors.albumin = 'Albumina deve estar entre 1.0 e 6.0 g/dL';
    }
    
    if (!inputs.inr) {
      newErrors.inr = 'INR é obrigatório';
    } else if (inputs.inr < 0.8 || inputs.inr > 10.0) {
      newErrors.inr = 'INR deve estar entre 0.8 e 10.0';
    }
    
    if (!inputs.ascites) {
      newErrors.ascites = 'Avaliação de ascite é obrigatória';
    }
    
    if (!inputs.encephalopathy) {
      newErrors.encephalopathy = 'Avaliação de encefalopatia é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Calculates Child-Pugh score and provides clinical interpretation
   * 
   * @returns {Object} Calculation results with clinical interpretation
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      const bilirubin = parseFloat(inputs.bilirubin);
      const albumin = parseFloat(inputs.albumin);
      const inr = parseFloat(inputs.inr);
      
      // Calculate points for each parameter
      let bilirubinPoints = 1;
      let albuminPoints = 1;
      let inrPoints = 1;
      let ascitesPoints = 1;
      let encephalopathyPoints = 1;
      
      // Bilirubin scoring
      const bilirubinCriteria = scoringCriteria.bilirubin[inputs.units];
      if (inputs.units === 'mg_dl') {
        if (bilirubin >= 3.0) bilirubinPoints = 3;
        else if (bilirubin >= 2.0) bilirubinPoints = 2;
        else bilirubinPoints = 1;
      } else {
        if (bilirubin > 51) bilirubinPoints = 3;
        else if (bilirubin >= 34) bilirubinPoints = 2;
        else bilirubinPoints = 1;
      }
      
      // Albumin scoring
      if (albumin < 2.8) albuminPoints = 3;
      else if (albumin <= 3.5) albuminPoints = 2;
      else albuminPoints = 1;
      
      // INR scoring
      if (inr > 2.3) inrPoints = 3;
      else if (inr >= 1.7) inrPoints = 2;
      else inrPoints = 1;
      
      // Ascites scoring
      const ascitesItem = scoringCriteria.ascites.find(item => item.value === inputs.ascites);
      ascitesPoints = ascitesItem ? ascitesItem.points : 1;
      
      // Encephalopathy scoring
      const encephalopathyItem = scoringCriteria.encephalopathy.find(item => item.value === inputs.encephalopathy);
      encephalopathyPoints = encephalopathyItem ? encephalopathyItem.points : 1;
      
      // Calculate total score
      const totalScore = bilirubinPoints + albuminPoints + inrPoints + ascitesPoints + encephalopathyPoints;
      
      // Determine Child-Pugh class
      let childPughClass = '';
      let interpretation = '';
      let severityColor = '';
      let oneYearSurvival = '';
      let twoYearSurvival = '';
      let clinicalSignificance = '';
      let recommendations = [];
      
      if (totalScore <= 6) {
        childPughClass = 'A';
        interpretation = 'Função hepática compensada';
        severityColor = 'text-green-700';
        oneYearSurvival = '95-100%';
        twoYearSurvival = '85-90%';
        clinicalSignificance = 'Cirrose compensada. Bom prognóstico a curto prazo.';
        recommendations = [
          'Seguimento ambulatorial regular',
          'Rastreamento de varizes esofágicas',
          'Vigilância para hepatocarcinoma',
          'Vacinação para hepatite A e B',
          'Evitar hepatotóxicos',
          'Considerar tratamento da causa base'
        ];
      } else if (totalScore <= 9) {
        childPughClass = 'B';
        interpretation = 'Disfunção hepática moderada';
        severityColor = 'text-orange-700';
        oneYearSurvival = '80-85%';
        twoYearSurvival = '60-70%';
        clinicalSignificance = 'Cirrose descompensada. Prognóstico intermediário.';
        recommendations = [
          'Seguimento especializado frequente',
          'Profilaxia primária/secundária de varizes',
          'Rastreamento intensivo de CHC',
          'Avaliação para transplante hepático',
          'Manejo de complicações da cirrose',
          'Cuidados nutricionais especializados'
        ];
      } else {
        childPughClass = 'C';
        interpretation = 'Disfunção hepática severa';
        severityColor = 'text-red-700';
        oneYearSurvival = '45-65%';
        twoYearSurvival = '35-50%';
        clinicalSignificance = 'Cirrose descompensada severa. Prognóstico reservado.';
        recommendations = [
          'URGENTE: Avaliação para transplante',
          'Cuidados paliativos se não candidato',
          'Manejo intensivo de complicações',
          'Profilaxia secundária obrigatória',
          'Suporte nutricional intensivo',
          'Cuidados de fim de vida se apropriado'
        ];
      }
      
      // Surgical risk assessment
      let surgicalRisk = '';
      let surgicalMortality = '';
      if (childPughClass === 'A') {
        surgicalRisk = 'Baixo';
        surgicalMortality = '<5%';
      } else if (childPughClass === 'B') {
        surgicalRisk = 'Moderado';
        surgicalMortality = '10-15%';
      } else {
        surgicalRisk = 'Alto';
        surgicalMortality = '>25%';
      }
      
      // Complications to monitor
      const complications = [
        'Hemorragia digestiva por varizes',
        'Encefalopatia hepática',
        'Ascite e síndrome hepatorrenal',
        'Peritonite bacteriana espontânea',
        'Hepatocarcinoma',
        'Insuficiência hepática aguda sobre crônica'
      ];
      
      // Monitoring recommendations
      const monitoringRecommendations = [
        'Função hepática a cada 3-6 meses',
        'Endoscopia digestiva alta anual',
        'Ultrassom + AFP a cada 6 meses',
        'Avaliação nutricional regular',
        'Monitoramento de complicações',
        'Reavaliação do Child-Pugh periodicamente'
      ];
      
      // Contraindications and precautions
      const contraindications = [
        'Evitar AINEs e hepatotóxicos',
        'Cuidado com sedativos (encefalopatia)',
        'Ajuste de doses medicamentosas',
        'Evitar procedimentos invasivos desnecessários',
        'Cuidado com sobrecarga de sódio',
        'Monitorar interações medicamentosas'
      ];
      
      // Transplant evaluation criteria
      let transplantEvaluation = [];
      if (childPughClass === 'B' || childPughClass === 'C') {
        transplantEvaluation = [
          'Avaliação multidisciplinar para transplante',
          'Cálculo do MELD score complementar',
          'Avaliação de contraindicações',
          'Suporte psicossocial',
          'Otimização do estado nutricional',
          'Tratamento de comorbidades'
        ];
      }
      
      // Parameter breakdown for documentation
      const parameterBreakdown = {
        bilirubin: {
          value: bilirubin,
          unit: inputs.units === 'mg_dl' ? 'mg/dL' : 'μmol/L',
          points: bilirubinPoints,
          interpretation: bilirubinCriteria.find(c => c.points === bilirubinPoints)?.description || ''
        },
        albumin: {
          value: albumin,
          unit: 'g/dL',
          points: albuminPoints,
          interpretation: scoringCriteria.albumin.find(c => c.points === albuminPoints)?.description || ''
        },
        inr: {
          value: inr,
          unit: '',
          points: inrPoints,
          interpretation: scoringCriteria.inr.find(c => c.points === inrPoints)?.description || ''
        },
        ascites: {
          value: inputs.ascites,
          points: ascitesPoints,
          interpretation: ascitesItem?.description || ''
        },
        encephalopathy: {
          value: inputs.encephalopathy,
          points: encephalopathyPoints,
          interpretation: encephalopathyItem?.description || ''
        }
      };
      
      const calculatedResults = {
        totalScore,
        childPughClass,
        interpretation,
        severityColor,
        oneYearSurvival,
        twoYearSurvival,
        clinicalSignificance,
        surgicalRisk,
        surgicalMortality,
        recommendations,
        complications,
        monitoringRecommendations,
        contraindications,
        transplantEvaluation,
        parameterBreakdown,
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
      bilirubin: '',
      albumin: '',
      inr: '',
      ascites: '',
      encephalopathy: '',
      units: 'mg_dl'
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `Child-Pugh Score - Resultados:\n`;
    resultText += `Data/Hora: ${results.calculationDate}\n\n`;
    
    resultText += `PARÂMETROS:\n`;
    resultText += `Bilirrubina: ${results.parameterBreakdown.bilirubin.value} ${results.parameterBreakdown.bilirubin.unit} (${results.parameterBreakdown.bilirubin.points} pontos)\n`;
    resultText += `Albumina: ${results.parameterBreakdown.albumin.value} ${results.parameterBreakdown.albumin.unit} (${results.parameterBreakdown.albumin.points} pontos)\n`;
    resultText += `INR: ${results.parameterBreakdown.inr.value} (${results.parameterBreakdown.inr.points} pontos)\n`;
    resultText += `Ascite: ${results.parameterBreakdown.ascites.interpretation} (${results.parameterBreakdown.ascites.points} pontos)\n`;
    resultText += `Encefalopatia: ${results.parameterBreakdown.encephalopathy.interpretation} (${results.parameterBreakdown.encephalopathy.points} pontos)\n\n`;
    
    resultText += `RESULTADO:\n`;
    resultText += `Score Total: ${results.totalScore} pontos\n`;
    resultText += `Classe Child-Pugh: ${results.childPughClass}\n`;
    resultText += `Interpretação: ${results.interpretation}\n`;
    resultText += `Sobrevida 1 ano: ${results.oneYearSurvival}\n`;
    resultText += `Sobrevida 2 anos: ${results.twoYearSurvival}\n`;
    resultText += `Risco Cirúrgico: ${results.surgicalRisk} (${results.surgicalMortality})\n\n`;
    
    resultText += `Significado Clínico:\n${results.clinicalSignificance}\n\n`;
    resultText += `Recomendações:\n${results.recommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    
    if (results.transplantEvaluation.length > 0) {
      resultText += `Avaliação para Transplante:\n${results.transplantEvaluation.map(t => `• ${t}`).join('\n')}\n\n`;
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
            <FileText className="h-5 w-5" />
            Child-Pugh Score
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros Clínicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Units Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Unidade da Bilirrubina
                </Label>
                <RadioGroup
                  value={inputs.units}
                  onValueChange={(value) => setInputs(prev => ({ ...prev, units: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mg_dl" id="units-mg" />
                    <Label htmlFor="units-mg" className="text-sm">
                      mg/dL (padrão brasileiro)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="umol_l" id="units-umol" />
                    <Label htmlFor="units-umol" className="text-sm">
                      μmol/L (padrão internacional)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Laboratory Parameters */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Parâmetros Laboratoriais</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bilirubin" className="text-sm font-medium">
                      Bilirrubina Total ({inputs.units === 'mg_dl' ? 'mg/dL' : 'μmol/L'}) *
                    </Label>
                    <input
                      id="bilirubin"
                      type="number"
                      value={inputs.bilirubin}
                      onChange={(e) => setInputs(prev => ({ ...prev, bilirubin: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={inputs.units === 'mg_dl' ? 'Ex: 2.5' : 'Ex: 43'}
                      min={inputs.units === 'mg_dl' ? '0.1' : '2'}
                      max={inputs.units === 'mg_dl' ? '50' : '850'}
                      step="0.1"
                    />
                    {errors.bilirubin && (
                      <p className="text-sm text-red-500">{errors.bilirubin}</p>
                    )}
                    <p className="text-xs text-gray-600">
                      Normal: {inputs.units === 'mg_dl' ? '<1.2 mg/dL' : '<21 μmol/L'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="albumin" className="text-sm font-medium">
                      Albumina (g/dL) *
                    </Label>
                    <input
                      id="albumin"
                      type="number"
                      value={inputs.albumin}
                      onChange={(e) => setInputs(prev => ({ ...prev, albumin: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 3.0"
                      min="1.0"
                      max="6.0"
                      step="0.1"
                    />
                    {errors.albumin && (
                      <p className="text-sm text-red-500">{errors.albumin}</p>
                    )}
                    <p className="text-xs text-gray-600">Normal: 3.5-5.0 g/dL</p>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="inr" className="text-sm font-medium">
                      INR (International Normalized Ratio) *
                    </Label>
                    <input
                      id="inr"
                      type="number"
                      value={inputs.inr}
                      onChange={(e) => setInputs(prev => ({ ...prev, inr: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 1.8"
                      min="0.8"
                      max="10.0"
                      step="0.1"
                    />
                    {errors.inr && (
                      <p className="text-sm text-red-500">{errors.inr}</p>
                    )}
                    <p className="text-xs text-gray-600">Normal: 0.8-1.2</p>
                  </div>
                </div>
              </div>
              
              {/* Clinical Parameters */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Parâmetros Clínicos</h4>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Ascite *
                    </Label>
                    <RadioGroup
                      value={inputs.ascites}
                      onValueChange={(value) => setInputs(prev => ({ ...prev, ascites: value }))}
                    >
                      {scoringCriteria.ascites.map((item) => (
                        <div key={item.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={item.value} id={`ascites-${item.value}`} />
                          <Label htmlFor={`ascites-${item.value}`} className="text-sm">
                            {item.description} ({item.points} ponto{item.points > 1 ? 's' : ''})
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {errors.ascites && (
                      <p className="text-sm text-red-500">{errors.ascites}</p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Encefalopatia Hepática *
                    </Label>
                    <RadioGroup
                      value={inputs.encephalopathy}
                      onValueChange={(value) => setInputs(prev => ({ ...prev, encephalopathy: value }))}
                    >
                      {scoringCriteria.encephalopathy.map((item) => (
                        <div key={item.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={item.value} id={`enceph-${item.value}`} />
                          <Label htmlFor={`enceph-${item.value}`} className="text-sm">
                            {item.description} ({item.points} ponto{item.points > 1 ? 's' : ''})
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {errors.encephalopathy && (
                      <p className="text-sm text-red-500">{errors.encephalopathy}</p>
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
                      <div className="flex items-center justify-center gap-4">
                        <span className="text-3xl font-bold text-blue-200">
                          {results.totalScore}
                        </span>
                        <span className="text-2xl font-bold text-blue-300">
                          Classe {results.childPughClass}
                        </span>
                      </div>
                      <p className="text-sm text-blue-300 mt-1">Child-Pugh Score</p>
                    </div>
                  </div>
                  
                  {/* Parameter Breakdown */}
                  <div className="p-3 rounded-lg border bg-gray-800/50 border-gray-600/50">
                    <h4 className="font-semibold text-gray-200 mb-3">Detalhamento dos Parâmetros:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Bilirrubina:</span>
                        <div className="text-right">
                          <span className="font-medium">{results.parameterBreakdown.bilirubin.value} {results.parameterBreakdown.bilirubin.unit}</span>
                          <Badge className="ml-2 bg-blue-900/30 text-blue-200 border border-blue-700/50">{results.parameterBreakdown.bilirubin.points} pts</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Albumina:</span>
                        <div className="text-right">
                          <span className="font-medium">{results.parameterBreakdown.albumin.value} {results.parameterBreakdown.albumin.unit}</span>
                          <Badge className="ml-2 bg-blue-900/30 text-blue-200 border border-blue-700/50">{results.parameterBreakdown.albumin.points} pts</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>INR:</span>
                        <div className="text-right">
                          <span className="font-medium">{results.parameterBreakdown.inr.value}</span>
                          <Badge className="ml-2 bg-blue-900/30 text-blue-200 border border-blue-700/50">{results.parameterBreakdown.inr.points} pts</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Ascite:</span>
                        <div className="text-right">
                          <span className="font-medium">{results.parameterBreakdown.ascites.interpretation}</span>
                          <Badge className="ml-2 bg-blue-900/30 text-blue-200 border border-blue-700/50">{results.parameterBreakdown.ascites.points} pts</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Encefalopatia:</span>
                        <div className="text-right">
                          <span className="font-medium">{results.parameterBreakdown.encephalopathy.interpretation}</span>
                          <Badge className="ml-2 bg-blue-900/30 text-blue-200 border border-blue-700/50">{results.parameterBreakdown.encephalopathy.points} pts</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Interpretation */}
                  <div className={`p-4 rounded-lg border ${
                    results.childPughClass === 'A' ? 'bg-green-900/20 border-green-700/50' :
                    results.childPughClass === 'B' ? 'bg-orange-900/20 border-orange-700/50' :
                    'bg-red-900/20 border-red-700/50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-lg ${results.severityColor}`}>
                        {results.interpretation}
                      </span>
                      <Badge className={`${
                        results.childPughClass === 'A' ? 'bg-green-900/30 text-green-200 border border-green-700/50' :
                        results.childPughClass === 'B' ? 'bg-orange-900/30 text-orange-200 border border-orange-700/50' :
                        'bg-red-900/30 text-red-200 border border-red-700/50'
                      }`}>
                        Classe {results.childPughClass}
                      </Badge>
                    </div>
                    <p className="text-sm opacity-90 mb-3">{results.clinicalSignificance}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Sobrevida 1 ano:</span>
                        <p>{results.oneYearSurvival}</p>
                      </div>
                      <div>
                        <span className="font-medium">Sobrevida 2 anos:</span>
                        <p>{results.twoYearSurvival}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Surgical Risk */}
                  <div className="p-3 rounded-lg border bg-purple-900/20 border-purple-700/50">
                    <h4 className="font-semibold text-purple-200 mb-2">Risco Cirúrgico:</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-purple-300">{results.surgicalRisk}</span>
                      <span className="text-sm text-purple-400">Mortalidade: {results.surgicalMortality}</span>
                    </div>
                  </div>
                  
                  {/* Clinical Recommendations */}
                  <div className="p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
                    <h4 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
                      {results.childPughClass === 'C' && <AlertTriangle className="h-4 w-4" />}
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
                  
                  {/* Transplant Evaluation */}
                  {results.transplantEvaluation.length > 0 && (
                    <div className="p-3 rounded-lg border bg-red-900/20 border-red-700/50">
                      <h4 className="font-semibold text-red-200 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Avaliação para Transplante:
                      </h4>
                      <ul className="text-sm text-red-300 space-y-1">
                        {results.transplantEvaluation.map((eval, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{eval}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Monitoring */}
                  <div className="p-3 rounded-lg border bg-gray-800/50 border-gray-600/50">
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
                  Preencha todos os parâmetros e clique em "Calcular"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Complications and Contraindications */}
        {results && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            
            {/* Contraindications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Contraindicações e Precauções
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {results.contraindications.map((contra, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{contra}</span>
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
            <CardTitle>Child-Pugh Score - Informações de Referência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Classificação por Pontuação:</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Classe A:</strong> 5-6 pontos (compensada)</li>
                    <li>• <strong>Classe B:</strong> 7-9 pontos (descompensada moderada)</li>
                    <li>• <strong>Classe C:</strong> 10-15 pontos (descompensada severa)</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Graus de Encefalopatia Hepática:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Grau 0:</strong> Normal</li>
                  <li>• <strong>Grau I:</strong> Alterações sutis de personalidade</li>
                  <li>• <strong>Grau II:</strong> Letargia, desorientação temporal</li>
                  <li>• <strong>Grau III:</strong> Confusão, desorientação espacial</li>
                  <li>• <strong>Grau IV:</strong> Coma</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Limitações do Score:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Subjetividade na avaliação de ascite e encefalopatia</li>
                  <li>• Não considera função renal</li>
                  <li>• MELD score pode ser mais preciso para transplante</li>
                  <li>• Não aplicável em hepatite fulminante</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Child CG, Turcotte JG. Surgery and portal hypertension. Major Probl Clin Surg 1964</li>
                  <li>• Pugh RN et al. Transection of the oesophagus for bleeding oesophageal varices. Br J Surg 1973</li>
                  <li>• EASL Clinical Practice Guidelines: Management of hepatocellular carcinoma</li>
                  <li>• Diretrizes SBH - Sociedade Brasileira de Hepatologia</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default ChildPugh;