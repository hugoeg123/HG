import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Label } from '../../../ui/label';
import { RadioGroup, RadioGroupItem } from '../../../ui/radio-group';
import { Button } from '../../../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../../../ui/alert';
import { Badge } from '../../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../ui/dialog';
import { Copy, Heart, Info, Calculator } from 'lucide-react';

/**
 * HEART Score Calculator - Avaliação de risco para dor torácica (MACE em 6 semanas)
 * 
 * Integrates with:
 * - components/Tools/Calculators.jsx para seleção e exibição
 * - store/calculatorStore.js para definição da calculadora
 * 
 * Hook: Exportado como componente HEART para uso em Calculators.jsx
 * IA prompt: Adicionar integração com protocolos de dor torácica e guidelines ACS
 */

const HEART = ({ open, onOpenChange }) => {
  const [inputs, setInputs] = useState({
    historyPts: null,
    ecgPts: null,
    agePts: null,
    riskPts: null,
    troponinPts: null,
  });

  const [results, setResults] = useState(null);

  // Compute HEART score and classification
  const computeHeart = (input) => {
    if (!input) return null;
    const vals = Object.values(input);
    if (vals.some(v => v === null)) return null;
    
    const score = vals.reduce((a, b) => a + (b || 0), 0);
    
    let riskBand, riskPercentRange, riskLevel;
    if (score <= 3) {
      riskBand = 'low';
      riskPercentRange = '0,9–1,7%';
      riskLevel = 'Baixo (0–3)';
    } else if (score <= 6) {
      riskBand = 'moderate';
      riskPercentRange = '12–16,6%';
      riskLevel = 'Moderado (4–6)';
    } else {
      riskBand = 'high';
      riskPercentRange = '50–65%';
      riskLevel = 'Alto (≥7)';
    }

    const advice = getAdvice(riskBand);
    const recommendations = getRecommendations(riskBand);
    const structuredNote = generateStructuredNote(score, riskLevel, riskPercentRange, advice);

    return {
      score,
      riskBand,
      riskPercentRange,
      riskLevel,
      advice,
      recommendations,
      structuredNote
    };
  };

  const getAdvice = (riskBand) => {
    switch (riskBand) {
      case 'low':
        return 'Alta hospitalar segura com seguimento ambulatorial em 72h';
      case 'moderate':
        return 'Observação hospitalar com troponinas seriadas e estratificação';
      case 'high':
        return 'Manejo agressivo com estratégia invasiva precoce';
      default:
        return '';
    }
  };

  const getRecommendations = (riskBand) => {
    const common = [
      'Não aplicar em STEMI, hipotensão ou SCA confirmada',
      'Considerar contexto clínico completo',
      'Reavaliar se mudança no quadro clínico'
    ];

    switch (riskBand) {
      case 'low':
        return [
          ...common,
          'Alta hospitalar segura possível',
          'Seguimento ambulatorial em 72h',
          'Orientações sobre sinais de alarme',
          'Considerar teste ergométrico ambulatorial'
        ];
      case 'moderate':
        return [
          ...common,
          'Observação hospitalar recomendada',
          'Troponinas seriadas (0, 3, 6h)',
          'ECG seriados',
          'Considerar ecocardiograma',
          'Estratificação não invasiva se estável'
        ];
      case 'high':
        return [
          ...common,
          'Internação obrigatória',
          'Antiagregação dupla se não contraindicada',
          'Anticoagulação',
          'Estratégia invasiva precoce (&lt;24h)',
          'Considerar transferência para hemodinâmica'
        ];
      default:
        return common;
    }
  };

  const generateStructuredNote = (score, riskLevel, riskPercentRange, advice) => {
    const date = new Date().toLocaleDateString('pt-BR');
    return `HEART Score — ${date}\nEscore: ${score} → ${riskLevel} — Risco MACE (6 semanas): ${riskPercentRange}\nConduta sugerida: ${advice}\nObs.: não aplicar em STEMI/hipotensão/diagnóstico confirmado de SCA.\nRef.: Six et al., Neth Heart J 2008.`;
  };

  const calculate = () => {
    const result = computeHeart(inputs);
    setResults(result);
  };

  const clearForm = () => {
    setInputs({
      historyPts: null,
      ecgPts: null,
      agePts: null,
      riskPts: null,
      troponinPts: null,
    });
    setResults(null);
  };

  const copyResults = async () => {
    if (!results) return;
    try {
      await navigator.clipboard.writeText(results.structuredNote);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseInt(value) }));
  };

  const isComplete = Object.values(inputs).every(v => v !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            HEART Score — Dor torácica (MACE em 6 semanas)
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Critérios HEART</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* História */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">História Clínica:</Label>
                <RadioGroup 
                  value={inputs.historyPts?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('historyPts', value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="history-2" />
                    <Label htmlFor="history-2">Suspeita alta (2 pontos)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="history-1" />
                    <Label htmlFor="history-1">Suspeita moderada (1 ponto)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="history-0" />
                    <Label htmlFor="history-0">Suspeita baixa (0 pontos)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* ECG */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">ECG:</Label>
                <RadioGroup 
                  value={inputs.ecgPts?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('ecgPts', value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="ecg-2" />
                    <Label htmlFor="ecg-2">Infra-ST significativo (2 pontos)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="ecg-1" />
                    <Label htmlFor="ecg-1">Distúrbio inespecífico de repolarização (1 ponto)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="ecg-0" />
                    <Label htmlFor="ecg-0">Normal (0 pontos)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Idade */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Idade:</Label>
                <RadioGroup 
                  value={inputs.agePts?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('agePts', value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="age-2" />
                    <Label htmlFor="age-2">≥ 65 anos (2 pontos)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="age-1" />
                    <Label htmlFor="age-1">45–65 anos (1 ponto)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="age-0" />
                    <Label htmlFor="age-0">&lt; 45 anos (0 pontos)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Fatores de Risco */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Fatores de Risco:
                  <Info className="h-4 w-4 text-muted-foreground" title="FR: hipercolesterolemia, HAS, DM, tabagismo, história familiar, obesidade (IMC>30) ou DAC conhecida" />
                </Label>
                <RadioGroup 
                  value={inputs.riskPts?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('riskPts', value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="risk-2" />
                    <Label htmlFor="risk-2">≥3 FR ou DAC/DA aterosclerótica conhecida (2 pontos)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="risk-1" />
                    <Label htmlFor="risk-1">1–2 fatores de risco (1 ponto)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="risk-0" />
                    <Label htmlFor="risk-0">Sem fatores de risco (0 pontos)</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">FR: hipercolesterolemia, HAS, DM, tabagismo, história familiar, obesidade (IMC&gt;30)</p>
              </div>

              {/* Troponina */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Troponina:</Label>
                <RadioGroup 
                  value={inputs.troponinPts?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('troponinPts', value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="troponin-2" />
                    <Label htmlFor="troponin-2">≥ 3× limite superior de referência (2 pontos)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="troponin-1" />
                    <Label htmlFor="troponin-1">1–3× limite superior de referência (1 ponto)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="troponin-0" />
                    <Label htmlFor="troponin-0">Normal (0 pontos)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={calculate} className="flex-1" disabled={!isComplete}>
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
                      <div className="text-3xl font-bold text-blue-200">{results.score}</div>
                      <div className="text-sm text-blue-300">de 10 pontos</div>
                      <div className="text-lg font-semibold text-blue-200 mt-2">{results.riskLevel}</div>
                    </div>
                  </div>
                  
                  {/* Risk Assessment */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border bg-gray-800/50 border-gray-600/50">
                      <div className="text-center">
                        <div className="font-medium text-gray-200">Risco MACE</div>
                        <div className="text-lg font-bold text-gray-200">{results.riskPercentRange}</div>
                        <div className="text-xs text-gray-400">6 semanas</div>
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg border ${
                      results.riskBand === 'high' 
                        ? 'bg-red-900/30 border-red-700/50' 
                        : results.riskBand === 'moderate'
                        ? 'bg-amber-900/30 border-amber-700/50'
                        : 'bg-green-900/20 border-green-700/50'
                    }`}>
                      <div className="text-center">
                        <div className={`font-medium ${
                          results.riskBand === 'high' ? 'text-red-200' : 
                          results.riskBand === 'moderate' ? 'text-amber-200' : 'text-green-200'
                        }`}>Estratificação</div>
                        <Badge className={`${
                          results.riskBand === 'high' ? 'bg-red-600' : 
                          results.riskBand === 'moderate' ? 'bg-amber-600' : 'bg-green-600'
                        }`}>
                          {results.riskBand === 'high' ? 'Alto' : 
                           results.riskBand === 'moderate' ? 'Moderado' : 'Baixo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Clinical Action */}
                  <div className={`p-3 rounded-lg border ${
                    results.riskBand === 'high' 
                      ? 'bg-red-900/30 border-red-700/50' 
                      : results.riskBand === 'moderate'
                      ? 'bg-amber-900/30 border-amber-700/50'
                      : 'bg-green-900/20 border-green-700/50'
                  }`}>
                    <h4 className={`font-semibold mb-2 ${
                      results.riskBand === 'high' ? 'text-red-200' : 
                      results.riskBand === 'moderate' ? 'text-amber-200' : 'text-green-200'
                    }`}>
                      Conduta Recomendada:
                    </h4>
                    <p className={`text-sm ${
                      results.riskBand === 'high' ? 'text-red-300' : 
                      results.riskBand === 'moderate' ? 'text-amber-300' : 'text-green-300'
                    }`}>
                      {results.advice}
                    </p>
                  </div>
                  
                  {/* Recommendations */}
                  <div className={`p-3 rounded-lg border ${
                    results.riskBand === 'high' 
                      ? 'bg-red-900/30 border-red-700/50' 
                      : results.riskBand === 'moderate'
                      ? 'bg-amber-900/30 border-amber-700/50'
                      : 'bg-green-900/20 border-green-700/50'
                  }`}>
                    <h4 className={`font-semibold mb-2 ${
                      results.riskBand === 'high' ? 'text-red-200' : 
                      results.riskBand === 'moderate' ? 'text-amber-200' : 'text-green-200'
                    }`}>
                      Recomendações Específicas:
                    </h4>
                    <ul className={`text-sm space-y-1 ${
                      results.riskBand === 'high' ? 'text-red-300' : 
                      results.riskBand === 'moderate' ? 'text-amber-300' : 'text-green-300'
                    }`}>
                      {results.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                !isComplete ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Dados Incompletos</AlertTitle>
                    <AlertDescription>
                      Selecione uma opção em cada critério para calcular o HEART Score.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Clique em "Calcular" para ver os resultados
                  </p>
                )
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
                <h4 className="font-semibold mb-2">HEART Score:</h4>
                <p className="text-sm text-muted-foreground">
                  O HEART Score estima o risco de eventos cardiovasculares maiores (MACE) 
                  em 6 semanas para pacientes com dor torácica aguda na emergência. 
                  Não deve ser aplicado em STEMI, hipotensão ou SCA já confirmada.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interpretação:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>0–3 pontos:</strong> Baixo risco (0,9–1,7% MACE em 6 semanas)</li>
                  <li>• <strong>4–6 pontos:</strong> Risco moderado (12–16,6% MACE em 6 semanas)</li>
                  <li>• <strong>≥7 pontos:</strong> Alto risco (50–65% MACE em 6 semanas)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Fatores de Risco:</h4>
                <p className="text-sm text-muted-foreground">
                  Hipercolesterolemia, hipertensão arterial, diabetes mellitus, 
                  tabagismo, história familiar de DAC, obesidade (IMC &gt; 30 kg/m²) 
                  ou doença arterial coronariana/aterosclerótica conhecida.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Six AJ, et al. Neth Heart J. 2008;16(6):191-6</li>
                  <li>• Backus BE, et al. BMJ. 2013;347:f4222</li>
                  <li>• ESC Guidelines for NSTE-ACS 2020</li>
                  <li>• AHA/ACC Guideline for Chest Pain 2021</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default HEART;

// Conector: Integra com Calculators.jsx para seleção e exibição da calculadora HEART
