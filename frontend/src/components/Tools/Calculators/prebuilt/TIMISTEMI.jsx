import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Label } from '../../../ui/label';
import { RadioGroup, RadioGroupItem } from '../../../ui/radio-group';
import { Checkbox } from '../../../ui/checkbox';
import { Button } from '../../../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../../../ui/alert';
import { Badge } from '../../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../ui/dialog';
import { Copy, Heart, Info, Calculator } from 'lucide-react';

/**
 * TIMI STEMI Calculator - Avaliação de risco de mortalidade em 30 dias para STEMI
 * 
 * Integrates with:
 * - components/Tools/Calculators.jsx para seleção e exibição
 * - store/calculatorStore.js para definição da calculadora
 * 
 * Hook: Exportado como componente TIMISTEMI para uso em Calculators.jsx
 * IA prompt: Adicionar integração com protocolos de reperfusão e tempo porta-balão
 */

const TIMISTEMI = ({ open, onOpenChange }) => {
  const [inputs, setInputs] = useState({
    hxDMHTNAngina: false,
    sbpLt100: false,
    hrGt100: false,
    killipIItoIV: false,
    weightLt67: false,
    anteriorSTEorNewLBBB: false,
    timeToTxGt4h: false,
    ageCat: null,
  });

  const [results, setResults] = useState(null);

  // Mortality mapping table
  const MORTALITY_MAP = {
    0: '0.8%',
    1: '1.6%',
    2: '2.2%',
    3: '4.4%',
    4: '7.3%',
    5: '12%',
    6: '16%',
    7: '23%',
    8: '27%'
  };

  const scoreToMortality = (score) => {
    return score >= 9 ? '36%' : (MORTALITY_MAP[score] || '—');
  };

  // Compute TIMI STEMI score and classification
  const computeTimiStemi = (input) => {
    if (!input || input.ageCat === null) return null;
    
    const agePts = input.ageCat === 'lt65' ? 0 : input.ageCat === '65to74' ? 2 : 3;
    
    const score = agePts +
      (input.hxDMHTNAngina ? 1 : 0) +
      (input.sbpLt100 ? 3 : 0) +
      (input.hrGt100 ? 2 : 0) +
      (input.killipIItoIV ? 2 : 0) +
      (input.weightLt67 ? 1 : 0) +
      (input.anteriorSTEorNewLBBB ? 1 : 0) +
      (input.timeToTxGt4h ? 1 : 0);

    const mortalityPercent = scoreToMortality(score);
    const advice = getAdvice(score);
    const recommendations = getRecommendations(score);
    const structuredNote = generateStructuredNote(score, mortalityPercent, advice, input);

    return {
      score,
      mortalityPercent,
      advice,
      recommendations,
      structuredNote
    };
  };

  const getAdvice = (score) => {
    if (score <= 2) {
      return 'Baixo risco de mortalidade. Manter estratégia de reperfusão padrão.';
    } else if (score <= 4) {
      return 'Risco moderado. Otimizar tempo de reperfusão e suporte clínico.';
    } else if (score <= 6) {
      return 'Risco moderado-alto. Considerar suporte intensivo e monitorização.';
    } else {
      return 'Alto risco de mortalidade. Suporte intensivo e estratégia agressiva.';
    }
  };

  const getRecommendations = (score) => {
    const common = [
      'Aplicar apenas em pacientes elegíveis à fibrinólise',
      'Interpretar no contexto clínico atual',
      'Não substitui julgamento clínico'
    ];

    if (score <= 2) {
      return [
        ...common,
        'Estratégia de reperfusão padrão',
        'Monitorização clínica de rotina',
        'Alta precoce se sem complicações',
        'Seguimento ambulatorial em 7-14 dias'
      ];
    } else if (score <= 4) {
      return [
        ...common,
        'Otimizar tempo porta-balão/porta-agulha',
        'Monitorização hemodinâmica',
        'Considerar ICP primária se disponível',
        'Observação hospitalar estendida'
      ];
    } else if (score <= 6) {
      return [
        ...common,
        'Priorizar ICP primária',
        'Suporte inotrópico se necessário',
        'Monitorização em UTI/UCO',
        'Ecocardiograma precoce',
        'Considerar dispositivos de assistência'
      ];
    } else {
      return [
        ...common,
        'Estratégia invasiva urgente',
        'Suporte hemodinâmico agressivo',
        'UTI cardiológica obrigatória',
        'Considerar balão intra-aórtico',
        'Avaliar choque cardiogênico',
        'Considerar transferência para centro terciário'
      ];
    }
  };

  const generateStructuredNote = (score, mortalityPercent, advice, input) => {
    const date = new Date().toLocaleDateString('pt-BR');
    const ageText = input.ageCat === 'lt65' ? '&lt;65' : input.ageCat === '65to74' ? '65–74' : '≥75';
    
    return `TIMI STEMI — ${date}\nCritérios: HX(DM/HA/angina) ${input.hxDMHTNAngina ? 'Sim' : 'Não'}; PAS&lt;100 ${input.sbpLt100 ? 'Sim' : 'Não'}; FC&gt;100 ${input.hrGt100 ? 'Sim' : 'Não'}; Killip II–IV ${input.killipIItoIV ? 'Sim' : 'Não'}; Peso&lt;67 ${input.weightLt67 ? 'Sim' : 'Não'}; Ant. STE/novo BRE ${input.anteriorSTEorNewLBBB ? 'Sim' : 'Não'}; ΔT&gt;4h ${input.timeToTxGt4h ? 'Sim' : 'Não'}; Idade ${ageText}\nEscore: ${score} | Mortalidade estimada (30d): ${mortalityPercent}\nConduta sugerida: ${advice}\nObservação: escore derivado em população candidata a fibrinólise; interpretar no contexto clínico atual e disponibilidade de ICP.\nRef.: Morrow et al., Circulation 2000.`;
  };

  const calculate = () => {
    const result = computeTimiStemi(inputs);
    setResults(result);
  };

  const clearForm = () => {
    setInputs({
      hxDMHTNAngina: false,
      sbpLt100: false,
      hrGt100: false,
      killipIItoIV: false,
      weightLt67: false,
      anteriorSTEorNewLBBB: false,
      timeToTxGt4h: false,
      ageCat: null,
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

  const handleCheckboxChange = (field, checked) => {
    setInputs(prev => ({ ...prev, [field]: checked }));
  };

  const handleAgeChange = (value) => {
    setInputs(prev => ({ ...prev, ageCat: value }));
  };

  const isComplete = inputs.ageCat !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            TIMI STEMI — Mortalidade em 30 dias
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Critérios TIMI STEMI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">Marque os critérios que se aplicam:</Label>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hx"
                      checked={inputs.hxDMHTNAngina}
                      onCheckedChange={(checked) => handleCheckboxChange('hxDMHTNAngina', checked)}
                    />
                    <Label htmlFor="hx">História de diabetes, hipertensão ou angina (1 ponto)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sbp"
                      checked={inputs.sbpLt100}
                      onCheckedChange={(checked) => handleCheckboxChange('sbpLt100', checked)}
                    />
                    <Label htmlFor="sbp">PA sistólica &lt; 100 mmHg (3 pontos)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hr"
                      checked={inputs.hrGt100}
                      onCheckedChange={(checked) => handleCheckboxChange('hrGt100', checked)}
                    />
                    <Label htmlFor="hr">FC &gt; 100 bpm (2 pontos)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="killip"
                      checked={inputs.killipIItoIV}
                      onCheckedChange={(checked) => handleCheckboxChange('killipIItoIV', checked)}
                    />
                    <Label htmlFor="killip">Killip classe II–IV (2 pontos)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="weight"
                      checked={inputs.weightLt67}
                      onCheckedChange={(checked) => handleCheckboxChange('weightLt67', checked)}
                    />
                    <Label htmlFor="weight">Peso &lt; 67 kg (1 ponto)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ste"
                      checked={inputs.anteriorSTEorNewLBBB}
                      onCheckedChange={(checked) => handleCheckboxChange('anteriorSTEorNewLBBB', checked)}
                    />
                    <Label htmlFor="ste">Supra de ST em parede anterior ou BRE novo (1 ponto)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="time"
                      checked={inputs.timeToTxGt4h}
                      onCheckedChange={(checked) => handleCheckboxChange('timeToTxGt4h', checked)}
                    />
                    <Label htmlFor="time">ΔT (tempo até tratamento) &gt; 4 horas (1 ponto)</Label>
                  </div>
                </div>
              </div>

              {/* Idade */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Idade:</Label>
                <RadioGroup 
                  value={inputs.ageCat || ''} 
                  onValueChange={handleAgeChange}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lt65" id="age-lt65" />
                    <Label htmlFor="age-lt65">&lt; 65 anos (0 pontos)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="65to74" id="age-65to74" />
                    <Label htmlFor="age-65to74">65 – 74 anos (2 pontos)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ge75" id="age-ge75" />
                    <Label htmlFor="age-ge75">≥ 75 anos (3 pontos)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-700/50">
                <h4 className="font-semibold text-blue-200 mb-2">Contexto de Uso:</h4>
                <p className="text-sm text-blue-300">
                  Aplicar em pacientes com STEMI elegíveis à fibrinólise. 
                  Complementar à avaliação clínica, não substitui julgamento médico.
                </p>
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
                      <div className="text-sm text-blue-300">de 14 pontos</div>
                    </div>
                  </div>
                  
                  {/* Mortality Risk */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border bg-red-900/30 border-red-700/50">
                      <div className="text-center">
                        <div className="font-medium text-red-200">Mortalidade</div>
                        <div className="text-2xl font-bold text-red-200">{results.mortalityPercent}</div>
                        <div className="text-xs text-red-400">30 dias</div>
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg border ${
                      results.score <= 2 
                        ? 'bg-green-900/20 border-green-700/50' 
                        : results.score <= 4
                        ? 'bg-amber-900/30 border-amber-700/50'
                        : results.score <= 6
                        ? 'bg-orange-900/30 border-orange-700/50'
                        : 'bg-red-900/30 border-red-700/50'
                    }`}>
                      <div className="text-center">
                        <div className={`font-medium ${
                          results.score <= 2 ? 'text-green-200' : 
                          results.score <= 4 ? 'text-amber-200' :
                          results.score <= 6 ? 'text-orange-200' : 'text-red-200'
                        }`}>Estratificação</div>
                        <Badge className={`${
                          results.score <= 2 ? 'bg-green-600' : 
                          results.score <= 4 ? 'bg-amber-600' :
                          results.score <= 6 ? 'bg-orange-600' : 'bg-red-600'
                        }`}>
                          {results.score <= 2 ? 'Baixo' : 
                           results.score <= 4 ? 'Moderado' :
                           results.score <= 6 ? 'Moderado-Alto' : 'Alto'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Clinical Action */}
                  <div className={`p-3 rounded-lg border ${
                    results.score <= 2 
                      ? 'bg-green-900/20 border-green-700/50' 
                      : results.score <= 4
                      ? 'bg-amber-900/30 border-amber-700/50'
                      : results.score <= 6
                      ? 'bg-orange-900/30 border-orange-700/50'
                      : 'bg-red-900/30 border-red-700/50'
                  }`}>
                    <h4 className={`font-semibold mb-2 ${
                      results.score <= 2 ? 'text-green-200' : 
                      results.score <= 4 ? 'text-amber-200' :
                      results.score <= 6 ? 'text-orange-200' : 'text-red-200'
                    }`}>
                      Conduta Recomendada:
                    </h4>
                    <p className={`text-sm ${
                      results.score <= 2 ? 'text-green-300' : 
                      results.score <= 4 ? 'text-amber-300' :
                      results.score <= 6 ? 'text-orange-300' : 'text-red-300'
                    }`}>
                      {results.advice}
                    </p>
                  </div>
                  
                  {/* Recommendations */}
                  <div className={`p-3 rounded-lg border ${
                    results.score <= 2 
                      ? 'bg-green-900/20 border-green-700/50' 
                      : results.score <= 4
                      ? 'bg-amber-900/30 border-amber-700/50'
                      : results.score <= 6
                      ? 'bg-orange-900/30 border-orange-700/50'
                      : 'bg-red-900/30 border-red-700/50'
                  }`}>
                    <h4 className={`font-semibold mb-2 ${
                      results.score <= 2 ? 'text-green-200' : 
                      results.score <= 4 ? 'text-amber-200' :
                      results.score <= 6 ? 'text-orange-200' : 'text-red-200'
                    }`}>
                      Recomendações Específicas:
                    </h4>
                    <ul className={`text-sm space-y-1 ${
                      results.score <= 2 ? 'text-green-300' : 
                      results.score <= 4 ? 'text-amber-300' :
                      results.score <= 6 ? 'text-orange-300' : 'text-red-300'
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
                      Selecione a idade para calcular o TIMI STEMI Score.
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
                <h4 className="font-semibold mb-2">TIMI STEMI Score:</h4>
                <p className="text-sm text-muted-foreground">
                  O TIMI STEMI estima risco de mortalidade em 30 dias na apresentação 
                  de IAM com supra (STEMI). Desenvolvido em pacientes elegíveis à 
                  fibrinólise, deve ser interpretado no contexto clínico atual.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Tabela de Mortalidade (30 dias):</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>• <strong>0 pontos:</strong> 0,8%</div>
                  <div>• <strong>1 ponto:</strong> 1,6%</div>
                  <div>• <strong>2 pontos:</strong> 2,2%</div>
                  <div>• <strong>3 pontos:</strong> 4,4%</div>
                  <div>• <strong>4 pontos:</strong> 7,3%</div>
                  <div>• <strong>5 pontos:</strong> 12%</div>
                  <div>• <strong>6 pontos:</strong> 16%</div>
                  <div>• <strong>7 pontos:</strong> 23%</div>
                  <div>• <strong>8 pontos:</strong> 27%</div>
                  <div>• <strong>≥9 pontos:</strong> 36%</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Contexto de Aplicação:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pacientes com STEMI elegíveis à fibrinólise</li>
                  <li>• Complementar à estratégia de reperfusão</li>
                  <li>• Não substitui julgamento clínico</li>
                  <li>• Considerar disponibilidade de ICP primária</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Morrow DA, et al. Circulation. 2000;102:2031-2037</li>
                  <li>• ESC Guidelines for STEMI 2017</li>
                  <li>• AHA/ACC Guideline for STEMI 2013</li>
                  <li>• Diretrizes Brasileiras de Cardiologia - SCA 2020</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default TIMISTEMI;

// Conector: Integra com Calculators.jsx para seleção e exibição da calculadora TIMI STEMI
