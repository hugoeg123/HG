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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Calculator, AlertTriangle, Droplets } from 'lucide-react';
import { toast } from 'sonner';

/**
 * HASBLED - Bleeding Risk Assessment for Anticoagulation
 * 
 * This component calculates the HAS-BLED score for bleeding risk assessment
 * in patients on anticoagulation therapy, particularly with atrial fibrillation.
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
 * <HASBLED 
 *   open={showHardcodedCalculator === 'has-bled'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @author Health Guardian Team
 * @since Sprint 3
 * @version 1.0.0
 */
function HASBLED({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    age: '',
    hypertension: false,
    abnormalRenalFunction: false,
    abnormalLiverFunction: false,
    stroke: false,
    bleedingHistory: false,
    labileINR: false,
    elderlyAge: false, // Will be calculated from age
    drugsAlcohol: false
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  /**
   * Validates input parameters for HAS-BLED calculation
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.age || parseFloat(inputs.age) < 0 || parseFloat(inputs.age) > 120) {
      newErrors.age = 'Idade deve estar entre 0 e 120 anos';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Calculate HAS-BLED score based on bleeding risk factors
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      let totalScore = 0;
      const scoreBreakdown = {};
      const riskFactors = [];
      
      const age = parseFloat(inputs.age);
      
      // Hypertension (1 point)
      if (inputs.hypertension) {
        totalScore += 1;
        scoreBreakdown.hypertension = 1;
        riskFactors.push('Hipertensão arterial (PAS > 160 mmHg)');
      } else {
        scoreBreakdown.hypertension = 0;
      }
      
      // Abnormal renal function (1 point)
      if (inputs.abnormalRenalFunction) {
        totalScore += 1;
        scoreBreakdown.renal = 1;
        riskFactors.push('Função renal anormal (diálise, transplante, creatinina > 2.26 mg/dL)');
      } else {
        scoreBreakdown.renal = 0;
      }
      
      // Abnormal liver function (1 point)
      if (inputs.abnormalLiverFunction) {
        totalScore += 1;
        scoreBreakdown.liver = 1;
        riskFactors.push('Função hepática anormal (cirrose, bilirrubina > 2x normal, AST/ALT > 3x normal)');
      } else {
        scoreBreakdown.liver = 0;
      }
      
      // Stroke (1 point)
      if (inputs.stroke) {
        totalScore += 1;
        scoreBreakdown.stroke = 1;
        riskFactors.push('História de AVC');
      } else {
        scoreBreakdown.stroke = 0;
      }
      
      // Bleeding history or predisposition (1 point)
      if (inputs.bleedingHistory) {
        totalScore += 1;
        scoreBreakdown.bleeding = 1;
        riskFactors.push('História de sangramento ou predisposição');
      } else {
        scoreBreakdown.bleeding = 0;
      }
      
      // Labile INR (1 point)
      if (inputs.labileINR) {
        totalScore += 1;
        scoreBreakdown.inr = 1;
        riskFactors.push('INR lábil (TTR < 60%)');
      } else {
        scoreBreakdown.inr = 0;
      }
      
      // Elderly (age > 65) (1 point)
      let elderlyPoints = 0;
      if (age > 65) {
        elderlyPoints = 1;
        riskFactors.push('Idade > 65 anos');
      }
      scoreBreakdown.elderly = elderlyPoints;
      totalScore += elderlyPoints;
      
      // Drugs/alcohol (1 point)
      if (inputs.drugsAlcohol) {
        totalScore += 1;
        scoreBreakdown.drugs = 1;
        riskFactors.push('Medicamentos (antiplaquetários, AINEs) ou álcool (≥ 8 doses/semana)');
      } else {
        scoreBreakdown.drugs = 0;
      }
      
      // Risk stratification and annual bleeding risk
      let riskLevel = '';
      let riskColor = '';
      let annualBleedingRisk = '';
      let riskDescription = '';
      let clinicalAction = '';
      
      if (totalScore === 0) {
        riskLevel = 'Baixo';
        riskColor = 'text-green-200';
        annualBleedingRisk = '1.13%';
        riskDescription = 'Risco baixo de sangramento maior';
        clinicalAction = 'Anticoagulação recomendada se indicada';
      } else if (totalScore === 1) {
        riskLevel = 'Baixo';
        riskColor = 'text-green-200';
        annualBleedingRisk = '1.02%';
        riskDescription = 'Risco baixo de sangramento maior';
        clinicalAction = 'Anticoagulação recomendada se indicada';
      } else if (totalScore === 2) {
        riskLevel = 'Moderado';
        riskColor = 'text-amber-200';
        annualBleedingRisk = '1.88%';
        riskDescription = 'Risco moderado de sangramento maior';
        clinicalAction = 'Anticoagulação com cautela - considerar fatores modificáveis';
      } else if (totalScore === 3) {
        riskLevel = 'Alto';
        riskColor = 'text-orange-200';
        annualBleedingRisk = '3.74%';
        riskDescription = 'Risco alto de sangramento maior';
        clinicalAction = 'Anticoagulação com muito cuidado - abordar fatores de risco';
      } else {
        riskLevel = 'Muito Alto';
        riskColor = 'text-red-200';
        annualBleedingRisk = '>8%';
        riskDescription = 'Risco muito alto de sangramento maior';
        clinicalAction = 'Considerar alternativas - abordar fatores de risco modificáveis';
      }
      
      // Clinical recommendations based on score
      const clinicalRecommendations = [];
      
      if (totalScore <= 2) {
        clinicalRecommendations.push('Risco de sangramento aceitável');
        clinicalRecommendations.push('Anticoagulação recomendada se CHA₂DS₂-VASc ≥ 2');
        clinicalRecommendations.push('Monitorização regular');
        clinicalRecommendations.push('Educar paciente sobre sinais de sangramento');
      } else {
        clinicalRecommendations.push('Risco elevado de sangramento');
        clinicalRecommendations.push('Reavaliar indicação de anticoagulação');
        clinicalRecommendations.push('Abordar fatores de risco modificáveis');
        clinicalRecommendations.push('Considerar alternativas (oclusão de apêndice atrial)');
        clinicalRecommendations.push('Monitorização mais frequente se anticoagulado');
      }
      
      // Modifiable risk factors
      const modifiableFactors = [];
      if (inputs.hypertension) {
        modifiableFactors.push('Controle rigoroso da pressão arterial (< 140/90 mmHg)');
      }
      if (inputs.labileINR) {
        modifiableFactors.push('Melhorar controle do INR (TTR > 70%) ou considerar DOACs');
      }
      if (inputs.drugsAlcohol) {
        modifiableFactors.push('Suspender antiplaquetários desnecessários e reduzir consumo de álcool');
      }
      if (inputs.abnormalRenalFunction) {
        modifiableFactors.push('Otimizar função renal e ajustar doses de anticoagulantes');
      }
      if (inputs.abnormalLiverFunction) {
        modifiableFactors.push('Tratar doença hepática subjacente');
      }
      
      if (modifiableFactors.length === 0) {
        modifiableFactors.push('Nenhum fator de risco modificável identificado');
      }
      
      // Additional considerations
      const additionalConsiderations = [
        'HAS-BLED não deve ser usado para excluir anticoagulação',
        'Score ≥ 3 indica necessidade de cuidado extra, não contraindicação',
        'Reavaliar periodicamente (fatores podem mudar)',
        'Considerar sempre benefício vs risco (CHA₂DS₂-VASc vs HAS-BLED)',
        'DOACs podem ter menor risco de sangramento intracraniano'
      ];
      
      // Monitoring recommendations
      const monitoringRecommendations = [];
      if (totalScore <= 2) {
        monitoringRecommendations.push('Monitorização padrão');
        monitoringRecommendations.push('Reavaliar HAS-BLED anualmente');
        monitoringRecommendations.push('Educar sobre sinais de sangramento');
      } else {
        monitoringRecommendations.push('Monitorização mais frequente');
        monitoringRecommendations.push('Reavaliar HAS-BLED a cada 6 meses');
        monitoringRecommendations.push('Hemograma regular');
        monitoringRecommendations.push('Função renal e hepática periódicas');
        monitoringRecommendations.push('Orientação detalhada sobre sinais de alerta');
      }
      
      const calculatedResults = {
        totalScore,
        maxScore: 9,
        scoreBreakdown,
        riskFactors,
        riskLevel,
        riskColor,
        riskDescription,
        annualBleedingRisk,
        clinicalAction,
        clinicalRecommendations,
        modifiableFactors,
        additionalConsiderations,
        monitoringRecommendations
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
      age: '',
      hypertension: false,
      abnormalRenalFunction: false,
      abnormalLiverFunction: false,
      stroke: false,
      bleedingHistory: false,
      labileINR: false,
      elderlyAge: false,
      drugsAlcohol: false
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `HAS-BLED Score - Resultados:\n`;
    resultText += `Score Total: ${results.totalScore}/${results.maxScore}\n`;
    resultText += `Risco: ${results.riskLevel}\n`;
    resultText += `Risco anual de sangramento: ${results.annualBleedingRisk}\n`;
    resultText += `Ação clínica: ${results.clinicalAction}\n\n`;
    
    if (results.riskFactors.length > 0) {
      resultText += `Fatores de risco presentes:\n${results.riskFactors.map(f => `• ${f}`).join('\n')}\n\n`;
    }
    
    resultText += `Fatores modificáveis:\n${results.modifiableFactors.map(f => `• ${f}`).join('\n')}\n\n`;
    resultText += `Recomendações:\n${results.clinicalRecommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    resultText += `Calculado em: ${new Date().toLocaleString('pt-BR')}`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="calculator-dialog">
        <DialogHeader className="calculator-dialog-header">
          <DialogTitle className="calculator-dialog-title">
            <Droplets className="h-5 w-5" />
            HAS-BLED - Risco de Sangramento em Anticoagulação
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Fatores de Risco para Sangramento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="age">Idade (anos) *</Label>
                <Input
                  id="age"
                  type="number"
                  value={inputs.age}
                  onChange={(e) => setInputs(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="Ex: 70"
                  className={`calculator-input ${errors.age ? 'border-red-500' : ''}`}
                />
                {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
                <p className="text-xs text-muted-foreground">Idade &gt; 65 anos = 1 ponto</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hypertension"
                    checked={inputs.hypertension}
                    onCheckedChange={(checked) => setInputs(prev => ({ ...prev, hypertension: checked }))}
                  />
                  <Label htmlFor="hypertension">Hipertensão (PAS &gt; 160 mmHg) (1 ponto)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="renal"
                    checked={inputs.abnormalRenalFunction}
                    onCheckedChange={(checked) => setInputs(prev => ({ ...prev, abnormalRenalFunction: checked }))}
                  />
                  <Label htmlFor="renal">Função renal anormal (1 ponto)</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">Diálise, transplante, creatinina &gt; 2.26 mg/dL</p>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="liver"
                    checked={inputs.abnormalLiverFunction}
                    onCheckedChange={(checked) => setInputs(prev => ({ ...prev, abnormalLiverFunction: checked }))}
                  />
                  <Label htmlFor="liver">Função hepática anormal (1 ponto)</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">Cirrose, bilirrubina &gt; 2x normal, AST/ALT &gt; 3x normal</p>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="stroke"
                    checked={inputs.stroke}
                    onCheckedChange={(checked) => setInputs(prev => ({ ...prev, stroke: checked }))}
                  />
                  <Label htmlFor="stroke">História de AVC (1 ponto)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bleeding"
                    checked={inputs.bleedingHistory}
                    onCheckedChange={(checked) => setInputs(prev => ({ ...prev, bleedingHistory: checked }))}
                  />
                  <Label htmlFor="bleeding">História de sangramento ou predisposição (1 ponto)</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">Sangramento maior prévio, anemia, plaquetopenia</p>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inr"
                    checked={inputs.labileINR}
                    onCheckedChange={(checked) => setInputs(prev => ({ ...prev, labileINR: checked }))}
                  />
                  <Label htmlFor="inr">INR lábil (TTR &lt; 60%) (1 ponto)</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">Tempo na faixa terapêutica &lt; 60%</p>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="drugs"
                    checked={inputs.drugsAlcohol}
                    onCheckedChange={(checked) => setInputs(prev => ({ ...prev, drugsAlcohol: checked }))}
                  />
                  <Label htmlFor="drugs">Medicamentos/álcool (1 ponto)</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">Antiplaquetários, AINEs, álcool ≥ 8 doses/semana</p>
              </div>
              
              <div className="bg-red-900/30 p-3 rounded-lg border border-red-700/50">
                <h4 className="font-semibold text-red-200 mb-2">Interpretação:</h4>
                <ul className="text-sm text-red-300 space-y-1">
                  <li>• <strong>0-2 pontos:</strong> Risco baixo-moderado</li>
                  <li>• <strong>≥3 pontos:</strong> Risco alto - cuidado extra</li>
                </ul>
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
                Resultados
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
                  {/* Score Display */}
                  <div className="p-4 rounded-lg border bg-blue-900/20 border-blue-700/50">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-200">{results.totalScore}</div>
                      <div className="text-sm text-blue-300">de {results.maxScore} pontos</div>
                      <div className="text-lg font-semibold text-blue-200 mt-2">{results.riskDescription}</div>
                    </div>
                  </div>
                  
                  {/* Risk Assessment */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border bg-gray-800/50 border-gray-600/50">
                      <div className="text-center">
                        <div className="font-medium text-gray-200">Nível de Risco</div>
                        <Badge className={`bg-blue-900/20 text-blue-200 border-blue-400 ${results.riskColor}`}>
                          {results.riskLevel}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg border bg-red-900/30 border-red-700/50">
                      <div className="text-center">
                        <div className="font-medium text-red-200">Risco Anual</div>
                        <div className="text-lg font-bold text-red-200">{results.annualBleedingRisk}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Clinical Action */}
                  <div className={`p-3 rounded-lg border ${
                    results.totalScore >= 3 
                      ? 'bg-red-900/30 border-red-700/50' 
                      : 'bg-green-900/20 border-green-700/50'
                  }`}>
                    <div className="text-center">
                      <div className={`font-medium ${
                        results.totalScore >= 3 ? 'text-red-200' : 'text-green-200'
                      }`}>
                        Ação Clínica
                      </div>
                      <div className={`text-sm font-semibold ${
                        results.totalScore >= 3 ? 'text-red-300' : 'text-green-300'
                      }`}>
                        {results.clinicalAction}
                      </div>
                    </div>
                  </div>
                  
                  {/* Risk Factors Present */}
                  {results.riskFactors.length > 0 && (
                    <div className="p-3 rounded-lg border bg-purple-900/20 border-purple-700/50">
                      <h4 className="font-semibold text-purple-200 mb-2">Fatores de Risco Presentes:</h4>
                      <ul className="text-sm text-purple-300 space-y-1">
                        {results.riskFactors.map((factor, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Modifiable Factors */}
                  <div className="p-3 rounded-lg border bg-amber-900/20 border-amber-700/50">
                    <h4 className="font-semibold text-amber-200 mb-2">Fatores Modificáveis:</h4>
                    <ul className="text-sm text-amber-300 space-y-1">
                      {results.modifiableFactors.map((factor, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Clinical Recommendations */}
                  <div className={`p-3 rounded-lg border ${
                    results.totalScore >= 3 
                      ? 'bg-red-900/30 border-red-700/50' 
                      : 'bg-green-900/20 border-green-700/50'
                  }`}>
                    <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                      results.totalScore >= 3 ? 'text-red-200' : 'text-green-200'
                    }`}>
                      {results.totalScore >= 3 && <AlertTriangle className="h-4 w-4" />}
                      Recomendações Clínicas:
                    </h4>
                    <ul className={`text-sm space-y-1 ${
                      results.totalScore >= 3 ? 'text-red-300' : 'text-green-300'
                    }`}>
                      {results.clinicalRecommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Monitoring Recommendations */}
                  <div className="p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
                    <h4 className="font-semibold text-blue-200 mb-2">Monitorização:</h4>
                    <ul className="text-sm text-blue-300 space-y-1">
                      {results.monitoringRecommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Additional Considerations */}
                  <div className="p-3 rounded-lg border bg-gray-800/50 border-gray-600/50">
                    <h4 className="font-semibold text-gray-200 mb-2">Considerações Adicionais:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {results.additionalConsiderations.map((consideration, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{consideration}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Preencha a idade e clique em "Calcular"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Reference Card */}
        <Card>
          <CardHeader>
            <CardTitle>Referências e Interpretação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">HAS-BLED Score:</h4>
                <p className="text-sm text-muted-foreground">
                  O HAS-BLED é usado para avaliar o risco de sangramento maior em pacientes 
                  candidatos à anticoagulação, complementando o CHA₂DS₂-VASc na tomada de decisão 
                  sobre anticoagulação em fibrilação atrial.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Componentes do Score:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>H:</strong> Hypertension (HAS não controlada)</li>
                  <li>• <strong>A:</strong> Abnormal renal/liver function (função renal/hepática anormal)</li>
                  <li>• <strong>S:</strong> Stroke (AVC prévio)</li>
                  <li>• <strong>B:</strong> Bleeding (história de sangramento)</li>
                  <li>• <strong>L:</strong> Labile INR (INR lábil)</li>
                  <li>• <strong>E:</strong> Elderly (idade &gt; 65 anos)</li>
                  <li>• <strong>D:</strong> Drugs/alcohol (medicamentos/álcool)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interpretação:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>0-2 pontos:</strong> Risco baixo-moderado de sangramento</li>
                  <li>• <strong>≥3 pontos:</strong> Risco alto - requer cuidado extra</li>
                  <li>• Score alto não contraindica anticoagulação, mas exige cautela</li>
                  <li>• Focar em fatores modificáveis para reduzir risco</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Uso Clínico:</h4>
                <p className="text-sm text-muted-foreground">
                  Deve ser usado em conjunto com CHA₂DS₂-VASc. Geralmente, se CHA₂DS₂-VASc ≥ 2 
                  e HAS-BLED ≤ 2, a anticoagulação é recomendada. HAS-BLED ≥ 3 requer atenção 
                  especial aos fatores modificáveis.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pisters R, et al. Chest. 2010;138(5):1093-100</li>
                  <li>• ESC Guidelines 2020 - Atrial Fibrillation</li>
                  <li>• Lip GY, et al. Am J Med. 2011;124(2):111-7</li>
                  <li>• Diretrizes Brasileiras de Fibrilação Atrial - SBC 2016</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default HASBLED;