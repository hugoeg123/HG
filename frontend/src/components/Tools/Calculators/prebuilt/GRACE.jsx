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
 * GRACE Score Calculator - Avaliação de risco em síndrome coronariana aguda
 * 
 * Integrates with:
 * - components/Tools/Calculators.jsx para seleção e exibição
 * - store/calculatorStore.js para definição da calculadora
 * 
 * Hook: Exportado como componente GRACE para uso em Calculators.jsx
 * IA prompt: Adicionar integração com GRACE 2.0 para percentuais individualizados
 */

const GRACE = ({ open, onOpenChange }) => {
  const [inputs, setInputs] = useState({
    killipPts: null,
    sbpPts: null,
    hrPts: null,
    agePts: null,
    creatPts: null,
    arrestPts: null,
    stDeviationPts: null,
    markersPts: null,
  });

  const [results, setResults] = useState(null);

  // Compute GRACE score and classification
  const computeGrace = (input) => {
    if (!input) return null;
    const vals = Object.values(input);
    if (vals.some(v => v === null)) return null;
    
    const score = vals.reduce((a, b) => a + (b || 0), 0);
    
    let riskBand, riskLevel;
    if (score <= 108) {
      riskBand = 'low';
      riskLevel = 'Baixo (≤108)';
    } else if (score <= 140) {
      riskBand = 'intermediate';
      riskLevel = 'Médio (109–140)';
    } else {
      riskBand = 'high';
      riskLevel = 'Alto (≥141)';
    }

    const advice = getAdvice(riskBand, score);
    const recommendations = getRecommendations(riskBand);
    const structuredNote = generateStructuredNote(score, riskLevel, advice);

    return {
      score,
      riskBand,
      riskLevel,
      advice,
      recommendations,
      structuredNote
    };
  };

  const getAdvice = (riskBand, score) => {
    switch (riskBand) {
      case 'low':
        return 'Baixo risco intra-hospitalar. Estratégia conservadora inicial adequada.';
      case 'intermediate':
        return 'Risco intermediário. Considerar estratificação adicional e observação.';
      case 'high':
        return `Alto risco (GRACE ${score > 140 ? '>140' : '≥141'}). Indicada estratégia invasiva precoce.`;
      default:
        return '';
    }
  };

  const getRecommendations = (riskBand) => {
    const common = [
      'Aplicar apenas em pacientes com SCA confirmada',
      'Considerar contexto clínico completo',
      'Reavaliar periodicamente durante internação'
    ];

    switch (riskBand) {
      case 'low':
        return [
          ...common,
          'Estratégia conservadora inicial',
          'Monitorização clínica e laboratorial',
          'Considerar alta precoce se estável',
          'Estratificação não invasiva (teste ergométrico/eco stress)'
        ];
      case 'intermediate':
        return [
          ...common,
          'Observação hospitalar prolongada',
          'Estratificação de risco adicional',
          'Considerar cateterismo se instabilidade',
          'Otimização da terapia médica'
        ];
      case 'high':
        return [
          ...common,
          'Estratégia invasiva precoce (&lt;24h)',
          'Antiagregação dupla se não contraindicada',
          'Anticoagulação plena',
          'Considerar transferência para centro terciário',
          'Monitorização intensiva'
        ];
      default:
        return common;
    }
  };

  const generateStructuredNote = (score, riskLevel, advice) => {
    const date = new Date().toLocaleDateString('pt-BR');
    return `GRACE 1.0 — ${date}\nEscore total: ${score} → ${riskLevel}\nConduta sugerida: ${advice}\nObs.: este é o modelo de pontos do GRACE 1.0; considerar GRACE 2.0 para probabilidade (%) personalizada se disponível.\nRef.: GRACE (BMJ 2006) e diretrizes ACS.`;
  };

  const calculate = () => {
    const result = computeGrace(inputs);
    setResults(result);
  };

  const clearForm = () => {
    setInputs({
      killipPts: null,
      sbpPts: null,
      hrPts: null,
      agePts: null,
      creatPts: null,
      arrestPts: null,
      stDeviationPts: null,
      markersPts: null,
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            GRACE 1.0 — Risco em Síndrome Coronariana Aguda
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Variáveis GRACE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Killip */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Classe de Killip:</Label>
                <RadioGroup 
                  value={inputs.killipPts?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('killipPts', value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="killip-0" />
                    <Label htmlFor="killip-0">I - Sem IC (0 pontos)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="20" id="killip-20" />
                    <Label htmlFor="killip-20">II - Estertores ou turgência (20 pontos)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="39" id="killip-39" />
                    <Label htmlFor="killip-39">III - Edema agudo de pulmão (39 pontos)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="59" id="killip-59" />
                    <Label htmlFor="killip-59">IV - Choque cardiogênico (59 pontos)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Pressão Sistólica */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Pressão Sistólica (mmHg):</Label>
                <RadioGroup 
                  value={inputs.sbpPts?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('sbpPts', value)}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="58" id="sbp-58" />
                    <Label htmlFor="sbp-58">≤80 (58 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="53" id="sbp-53" />
                    <Label htmlFor="sbp-53">80-99 (53 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="43" id="sbp-43" />
                    <Label htmlFor="sbp-43">100-119 (43 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="34" id="sbp-34" />
                    <Label htmlFor="sbp-34">120-139 (34 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="24" id="sbp-24" />
                    <Label htmlFor="sbp-24">140-159 (24 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="10" id="sbp-10" />
                    <Label htmlFor="sbp-10">160-199 (10 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="sbp-0" />
                    <Label htmlFor="sbp-0">≥200 (0 pts)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Frequência Cardíaca */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Frequência Cardíaca (bpm):</Label>
                <RadioGroup 
                  value={inputs.hrPts?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('hrPts', value)}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="hr-0" />
                    <Label htmlFor="hr-0">≤50 (0 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="hr-3" />
                    <Label htmlFor="hr-3">50-69 (3 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="9" id="hr-9" />
                    <Label htmlFor="hr-9">70-89 (9 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="15" id="hr-15" />
                    <Label htmlFor="hr-15">90-109 (15 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="24" id="hr-24" />
                    <Label htmlFor="hr-24">110-149 (24 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="38" id="hr-38" />
                    <Label htmlFor="hr-38">150-199 (38 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="46" id="hr-46" />
                    <Label htmlFor="hr-46">≥200 (46 pts)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Idade */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Idade (anos):</Label>
                <RadioGroup 
                  value={inputs.agePts?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('agePts', value)}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="age-0" />
                    <Label htmlFor="age-0">≤30 (0 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="8" id="age-8" />
                    <Label htmlFor="age-8">30-39 (8 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="25" id="age-25" />
                    <Label htmlFor="age-25">40-49 (25 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="41" id="age-41" />
                    <Label htmlFor="age-41">50-59 (41 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="58" id="age-58" />
                    <Label htmlFor="age-58">60-69 (58 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="75" id="age-75" />
                    <Label htmlFor="age-75">70-79 (75 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="91" id="age-91" />
                    <Label htmlFor="age-91">80-89 (91 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="100" id="age-100" />
                    <Label htmlFor="age-100">≥90 (100 pts)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Creatinina */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Creatinina (mg/dL):</Label>
                <RadioGroup 
                  value={inputs.creatPts?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('creatPts', value)}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="creat-1" />
                    <Label htmlFor="creat-1">0-0,39 (1 pt)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="4" id="creat-4" />
                    <Label htmlFor="creat-4">0,40-0,79 (4 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="7" id="creat-7" />
                    <Label htmlFor="creat-7">0,80-1,19 (7 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="10" id="creat-10" />
                    <Label htmlFor="creat-10">1,20-1,59 (10 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="13" id="creat-13" />
                    <Label htmlFor="creat-13">1,60-1,99 (13 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="21" id="creat-21" />
                    <Label htmlFor="creat-21">2,00-3,99 (21 pts)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="28" id="creat-28" />
                    <Label htmlFor="creat-28">≥4 (28 pts)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* PCR à admissão */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">PCR à admissão:</Label>
                <RadioGroup 
                  value={inputs.arrestPts?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('arrestPts', value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="39" id="arrest-39" />
                    <Label htmlFor="arrest-39">Presente (39 pontos)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="arrest-0" />
                    <Label htmlFor="arrest-0">Ausente (0 pontos)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Desvio do ST */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Desvio do segmento ST:</Label>
                <RadioGroup 
                  value={inputs.stDeviationPts?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('stDeviationPts', value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="39" id="st-39" />
                    <Label htmlFor="st-39">Presente (39 pontos)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="st-0" />
                    <Label htmlFor="st-0">Ausente (0 pontos)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Marcadores */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Marcadores de necrose miocárdica:</Label>
                <RadioGroup 
                  value={inputs.markersPts?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('markersPts', value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="14" id="markers-14" />
                    <Label htmlFor="markers-14">Presente (14 pontos)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="markers-0" />
                    <Label htmlFor="markers-0">Ausente (0 pontos)</Label>
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
                      <div className="text-sm text-blue-300">pontos</div>
                      <div className="text-lg font-semibold text-blue-200 mt-2">{results.riskLevel}</div>
                    </div>
                  </div>
                  
                  {/* Risk Assessment */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className={`p-3 rounded-lg border ${
                      results.riskBand === 'high' 
                        ? 'bg-red-900/30 border-red-700/50' 
                        : results.riskBand === 'intermediate'
                        ? 'bg-amber-900/30 border-amber-700/50'
                        : 'bg-green-900/20 border-green-700/50'
                    }`}>
                      <div className="text-center">
                        <div className={`font-medium ${
                          results.riskBand === 'high' ? 'text-red-200' : 
                          results.riskBand === 'intermediate' ? 'text-amber-200' : 'text-green-200'
                        }`}>Estratificação de Risco</div>
                        <Badge className={`${
                          results.riskBand === 'high' ? 'bg-red-600' : 
                          results.riskBand === 'intermediate' ? 'bg-amber-600' : 'bg-green-600'
                        }`}>
                          {results.riskBand === 'high' ? 'Alto Risco' : 
                           results.riskBand === 'intermediate' ? 'Risco Intermediário' : 'Baixo Risco'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Clinical Action */}
                  <div className={`p-3 rounded-lg border ${
                    results.riskBand === 'high' 
                      ? 'bg-red-900/30 border-red-700/50' 
                      : results.riskBand === 'intermediate'
                      ? 'bg-amber-900/30 border-amber-700/50'
                      : 'bg-green-900/20 border-green-700/50'
                  }`}>
                    <h4 className={`font-semibold mb-2 ${
                      results.riskBand === 'high' ? 'text-red-200' : 
                      results.riskBand === 'intermediate' ? 'text-amber-200' : 'text-green-200'
                    }`}>
                      Conduta Recomendada:
                    </h4>
                    <p className={`text-sm ${
                      results.riskBand === 'high' ? 'text-red-300' : 
                      results.riskBand === 'intermediate' ? 'text-amber-300' : 'text-green-300'
                    }`}>
                      {results.advice}
                    </p>
                  </div>
                  
                  {/* Recommendations */}
                  <div className={`p-3 rounded-lg border ${
                    results.riskBand === 'high' 
                      ? 'bg-red-900/30 border-red-700/50' 
                      : results.riskBand === 'intermediate'
                      ? 'bg-amber-900/30 border-amber-700/50'
                      : 'bg-green-900/20 border-green-700/50'
                  }`}>
                    <h4 className={`font-semibold mb-2 ${
                      results.riskBand === 'high' ? 'text-red-200' : 
                      results.riskBand === 'intermediate' ? 'text-amber-200' : 'text-green-200'
                    }`}>
                      Recomendações Específicas:
                    </h4>
                    <ul className={`text-sm space-y-1 ${
                      results.riskBand === 'high' ? 'text-red-300' : 
                      results.riskBand === 'intermediate' ? 'text-amber-300' : 'text-green-300'
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
                      Selecione uma opção em cada critério para calcular o GRACE Score.
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
                <h4 className="font-semibold mb-2">GRACE Score:</h4>
                <p className="text-sm text-muted-foreground">
                  O GRACE 1.0 estima risco intra-hospitalar em pacientes com síndrome 
                  coronariana aguda usando variáveis da apresentação. O corte &gt;140 
                  indica alto risco e pode orientar estratégia invasiva precoce.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interpretação:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>≤108 pontos:</strong> Baixo risco intra-hospitalar</li>
                  <li>• <strong>109–140 pontos:</strong> Risco intermediário</li>
                  <li>• <strong>≥141 pontos:</strong> Alto risco - considerar estratégia invasiva precoce</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Limitações:</h4>
                <p className="text-sm text-muted-foreground">
                  Este é o modelo de pontos do GRACE 1.0. Para probabilidades 
                  percentuais individualizadas, considerar GRACE 2.0 se disponível.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Fox KA, et al. BMJ. 2006;333(7560):177</li>
                  <li>• Granger CB, et al. JAMA. 2003;289(8):953-9</li>
                  <li>• ESC Guidelines for NSTE-ACS 2020</li>
                  <li>• AHA/ACC Guideline for NSTE-ACS 2014</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default GRACE;

// Conector: Integra com Calculators.jsx para seleção e exibição da calculadora GRACE
