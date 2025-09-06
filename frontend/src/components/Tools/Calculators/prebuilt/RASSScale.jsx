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
import { Copy, Calculator, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * RASSScale - Richmond Agitation-Sedation Scale
 * 
 * This component implements the RASS assessment tool for evaluating
 * sedation and agitation levels in critically ill patients.
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
 * <RASSScale 
 *   open={showHardcodedCalculator === 'rass-scale'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Assessment example
 * // Input: selectedScore=-2
 * // Output: interpretation="Sedação leve", recommendations=[...]
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function RASSScale({ open, onOpenChange }) {
  const [selectedScore, setSelectedScore] = useState('');
  const [results, setResults] = useState(null);
  const [patientInfo, setPatientInfo] = useState({
    mechanicalVentilation: '',
    sedationGoal: '',
    painScore: '',
    deliriumRisk: ''
  });

  // RASS Scale definitions
  const rassLevels = [
    {
      score: '+4',
      term: 'Combativo',
      description: 'Combativo - Claramente combativo, violento, perigo imediato para a equipe',
      assessment: 'Observação direta',
      color: 'bg-red-100 border-red-300 text-red-200',
      urgency: 'CRÍTICA',
      category: 'agitation'
    },
    {
      score: '+3',
      term: 'Muito agitado',
      description: 'Muito agitado - Puxa ou remove tubos/cateteres, agressivo',
      assessment: 'Observação direta',
      color: 'bg-red-100 border-red-300 text-red-800',
      urgency: 'ALTA',
      category: 'agitation'
    },
    {
      score: '+2',
      term: 'Agitado',
      description: 'Agitado - Movimentos não propositais frequentes, luta com ventilador',
      assessment: 'Observação direta',
      color: 'bg-orange-100 border-orange-300 text-orange-200',
      urgency: 'ALTA',
      category: 'agitation'
    },
    {
      score: '+1',
      term: 'Inquieto',
      description: 'Inquieto - Ansioso, apreensivo, mas movimentos não agressivos/vigorosos',
      assessment: 'Observação direta',
      color: 'bg-yellow-100 border-yellow-300 text-yellow-200',
      urgency: 'MODERADA',
      category: 'agitation'
    },
    {
      score: '0',
      term: 'Alerta e calmo',
      description: 'Alerta e calmo - Espontaneamente presta atenção ao cuidador',
      assessment: 'Observação direta',
      color: 'bg-green-100 border-green-300 text-green-200',
      urgency: 'BAIXA',
      category: 'alert'
    },
    {
      score: '-1',
      term: 'Sonolento',
      description: 'Sonolento - Não totalmente alerta, mas tem despertar sustentado (>10 seg) ao chamado',
      assessment: 'Estímulo verbal (chamar pelo nome)',
      color: 'bg-blue-100 border-blue-300 text-blue-200',
      urgency: 'BAIXA',
      category: 'sedation'
    },
    {
      score: '-2',
      term: 'Sedação leve',
      description: 'Sedação leve - Despertar breve (<10 seg) ao chamado',
      assessment: 'Estímulo verbal (chamar pelo nome)',
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      urgency: 'BAIXA',
      category: 'sedation'
    },
    {
      score: '-3',
      term: 'Sedação moderada',
      description: 'Sedação moderada - Movimento ou abertura ocular ao chamado (sem contato visual)',
      assessment: 'Estímulo verbal (chamar pelo nome)',
      color: 'bg-indigo-100 border-indigo-300 text-indigo-200',
      urgency: 'MODERADA',
      category: 'sedation'
    },
    {
      score: '-4',
      term: 'Sedação profunda',
      description: 'Sedação profunda - Sem resposta ao estímulo verbal, mas movimento/abertura ocular ao toque',
      assessment: 'Estímulo físico (toque no ombro)',
      color: 'bg-purple-100 border-purple-300 text-purple-200',
      urgency: 'ALTA',
      category: 'sedation'
    },
    {
      score: '-5',
      term: 'Não responsivo',
      description: 'Não responsivo - Sem resposta ao estímulo verbal ou físico',
      assessment: 'Estímulo físico (toque no ombro)',
      color: 'bg-gray-100 border-gray-300 text-gray-200',
      urgency: 'CRÍTICA',
      category: 'sedation'
    }
  ];

  /**
   * Calculates RASS assessment results and clinical recommendations
   * 
   * @returns {Object} Assessment results with clinical interpretation
   */
  const calculate = useCallback(() => {
    if (!selectedScore) {
      toast.error('Selecione um nível RASS');
      return;
    }
    
    try {
      const selectedLevel = rassLevels.find(level => level.score === selectedScore);
      if (!selectedLevel) {
        throw new Error('Nível RASS inválido');
      }
      
      const score = parseInt(selectedScore.replace('+', ''));
      
      // Generate clinical interpretation
      let clinicalInterpretation = '';
      let targetRecommendations = [];
      let interventionRecommendations = [];
      let monitoringRecommendations = [];
      let riskAssessment = [];
      
      // Agitation levels (+4 to +1)
      if (score > 0) {
        clinicalInterpretation = `Paciente apresenta agitação nível ${selectedLevel.term.toLowerCase()}. Requer intervenção imediata para segurança.`;
        
        targetRecommendations = [
          'Meta RASS: 0 a -1 (alerta e calmo a sonolento)',
          'Priorizar segurança do paciente e equipe',
          'Avaliar causas reversíveis de agitação'
        ];
        
        if (score >= 3) {
          interventionRecommendations = [
            'Contenção física se necessário para segurança',
            'Sedação de resgate (haloperidol, dexmedetomidina)',
            'Avaliar adequação da analgesia',
            'Investigar causas: hipoxemia, dor, delirium, abstinência',
            'Considerar ajuste de ventilação mecânica',
            'Reavaliar em 15-30 minutos após intervenção'
          ];
        } else {
          interventionRecommendations = [
            'Medidas não-farmacológicas primeiro',
            'Orientação e tranquilização verbal',
            'Otimizar controle da dor',
            'Avaliar necessidade de sedação leve',
            'Investigar causas de ansiedade/agitação'
          ];
        }
        
        riskAssessment = [
          'Risco de auto-extubação',
          'Risco de retirada de dispositivos',
          'Risco de lesão para paciente e equipe',
          'Risco de aumento do consumo de O2',
          'Risco de desenvolvimento de delirium'
        ];
      }
      // Alert and calm (0)
      else if (score === 0) {
        clinicalInterpretation = 'Paciente alerta e calmo. Estado ideal para a maioria dos pacientes críticos.';
        
        targetRecommendations = [
          'Manter RASS atual (0)',
          'Estado ideal para desmame ventilatório',
          'Propício para avaliação neurológica'
        ];
        
        interventionRecommendations = [
          'Manter cuidados atuais',
          'Mobilização precoce quando apropriado',
          'Fisioterapia respiratória',
          'Avaliação para desmame ventilatório',
          'Prevenção de delirium'
        ];
        
        riskAssessment = [
          'Baixo risco de complicações',
          'Estado favorável para recuperação',
          'Adequado para procedimentos'
        ];
      }
      // Light sedation (-1 to -2)
      else if (score >= -2) {
        clinicalInterpretation = `Paciente com ${selectedLevel.term.toLowerCase()}. Nível adequado para a maioria dos pacientes ventilados.`;
        
        targetRecommendations = [
          'Meta RASS: -1 a 0 para pacientes ventilados',
          'Adequado para interação e avaliação',
          'Favorável para desmame ventilatório'
        ];
        
        interventionRecommendations = [
          'Manter sedação atual se meta atingida',
          'Considerar redução gradual se meta é mais superficial',
          'Avaliação diária de sedação',
          'Teste de despertar espontâneo',
          'Mobilização precoce'
        ];
        
        riskAssessment = [
          'Baixo risco de complicações',
          'Adequado para a maioria dos procedimentos',
          'Favorável para avaliação neurológica'
        ];
      }
      // Moderate sedation (-3)
      else if (score === -3) {
        clinicalInterpretation = 'Paciente com sedação moderada. Pode ser apropriado em situações específicas.';
        
        targetRecommendations = [
          'Avaliar se sedação profunda é necessária',
          'Meta usual: RASS -1 a 0',
          'Considerar redução gradual'
        ];
        
        interventionRecommendations = [
          'Avaliação diária de sedação obrigatória',
          'Teste de despertar espontâneo',
          'Redução gradual se clinicamente apropriado',
          'Monitorar função respiratória',
          'Prevenção de complicações do imobilismo'
        ];
        
        riskAssessment = [
          'Risco aumentado de delirium',
          'Risco de atrofia muscular',
          'Dificuldade para avaliação neurológica',
          'Pode prolongar ventilação mecânica'
        ];
      }
      // Deep sedation (-4 to -5)
      else {
        clinicalInterpretation = `Paciente com ${selectedLevel.term.toLowerCase()}. Sedação muito profunda, raramente indicada.`;
        
        targetRecommendations = [
          'Reavaliar necessidade de sedação profunda',
          'Meta usual: RASS -1 a 0',
          'Redução gradual urgente se apropriado'
        ];
        
        interventionRecommendations = [
          'Avaliação médica urgente',
          'Investigar indicações para sedação profunda',
          'Redução gradual da sedação',
          'Monitoramento neurológico intensivo',
          'Prevenção de complicações',
          'Fisioterapia passiva'
        ];
        
        riskAssessment = [
          'Alto risco de delirium',
          'Risco de atrofia muscular severa',
          'Impossibilidade de avaliação neurológica',
          'Prolongamento da ventilação mecânica',
          'Risco de complicações cardiovasculares',
          'Aumento da morbimortalidade'
        ];
      }
      
      // General monitoring recommendations
      monitoringRecommendations = [
        'Reavaliar RASS a cada 4 horas ou conforme protocolo',
        'Documentar estímulo utilizado e resposta',
        'Avaliar CAM-ICU se RASS ≥ -3',
        'Monitorar sinais vitais',
        'Avaliar adequação da analgesia',
        'Registrar metas de sedação'
      ];
      
      // Sedation adjustment recommendations based on patient info
      let sedationAdjustments = [];
      if (patientInfo.mechanicalVentilation === 'yes') {
        sedationAdjustments.push('Paciente em VM: meta RASS -1 a 0 para desmame');
      }
      if (patientInfo.sedationGoal) {
        sedationAdjustments.push(`Meta definida: RASS ${patientInfo.sedationGoal}`);
      }
      if (patientInfo.painScore && parseInt(patientInfo.painScore) > 3) {
        sedationAdjustments.push('Dor presente: otimizar analgesia antes de ajustar sedação');
      }
      if (patientInfo.deliriumRisk === 'high') {
        sedationAdjustments.push('Alto risco de delirium: evitar sedação profunda');
      }
      
      // Medication considerations
      const medicationConsiderations = [
        'Dexmedetomidina: preserva despertar, menor risco de delirium',
        'Propofol: início/término rápidos, cuidado com síndrome de infusão',
        'Midazolam: evitar infusão contínua prolongada',
        'Haloperidol: para agitação/delirium, cuidado com QT',
        'Fentanil/morfina: analgesia adequada reduz necessidade de sedação'
      ];
      
      const calculatedResults = {
        selectedScore,
        selectedLevel,
        clinicalInterpretation,
        targetRecommendations,
        interventionRecommendations,
        monitoringRecommendations,
        riskAssessment,
        sedationAdjustments,
        medicationConsiderations,
        assessmentDate: new Date().toLocaleString('pt-BR'),
        urgency: selectedLevel.urgency
      };
      
      setResults(calculatedResults);
    } catch (error) {
      toast.error('Erro na avaliação: ' + error.message);
    }
  }, [selectedScore, patientInfo]);

  /**
   * Clears all input fields and results
   */
  const clearForm = useCallback(() => {
    setSelectedScore('');
    setPatientInfo({
      mechanicalVentilation: '',
      sedationGoal: '',
      painScore: '',
      deliriumRisk: ''
    });
    setResults(null);
  }, []);

  /**
   * Copies assessment results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `Avaliação RASS - Resultados:\n`;
    resultText += `Data/Hora: ${results.assessmentDate}\n\n`;
    
    resultText += `RASS: ${results.selectedScore} - ${results.selectedLevel.term}\n`;
    resultText += `Descrição: ${results.selectedLevel.description}\n`;
    resultText += `Urgência: ${results.urgency}\n\n`;
    
    resultText += `Interpretação Clínica:\n${results.clinicalInterpretation}\n\n`;
    
    resultText += `Metas Recomendadas:\n${results.targetRecommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    resultText += `Intervenções:\n${results.interventionRecommendations.map(i => `• ${i}`).join('\n')}\n\n`;
    resultText += `Monitoramento:\n${results.monitoringRecommendations.map(m => `• ${m}`).join('\n')}\n\n`;
    
    if (results.sedationAdjustments.length > 0) {
      resultText += `Ajustes Específicos:\n${results.sedationAdjustments.map(a => `• ${a}`).join('\n')}\n\n`;
    }
    
    resultText += `Avaliado por: [Nome do profissional]\n`;
    resultText += `Próxima avaliação: [Data/hora]`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            RASS - Richmond Agitation-Sedation Scale
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* RASS Scale Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Escala RASS - Selecione o Nível</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedScore}
                onValueChange={setSelectedScore}
                className="space-y-3"
              >
                {rassLevels.map((level) => (
                  <div key={level.score} className={`p-4 rounded-lg border-2 ${level.color} transition-all hover:shadow-md`}>
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value={level.score} id={level.score} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={level.score} className="cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-lg">
                              RASS {level.score}: {level.term}
                            </span>
                            <Badge className={`${level.urgency === 'CRÍTICA' ? 'bg-red-200 text-red-800' : 
                              level.urgency === 'ALTA' ? 'bg-orange-200 text-orange-800' :
                              level.urgency === 'MODERADA' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                              {level.urgency}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{level.description}</p>
                          <p className="text-xs font-medium opacity-75">
                            <strong>Avaliação:</strong> {level.assessment}
                          </p>
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
              
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold mb-3">Informações Complementares (Opcional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Ventilação Mecânica:</Label>
                    <RadioGroup
                      value={patientInfo.mechanicalVentilation}
                      onValueChange={(value) => setPatientInfo(prev => ({ ...prev, mechanicalVentilation: value }))}
                      className="flex gap-4 mt-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="vm-yes" />
                        <Label htmlFor="vm-yes" className="text-sm">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="vm-no" />
                        <Label htmlFor="vm-no" className="text-sm">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label htmlFor="sedation-goal" className="text-sm font-medium">Meta RASS:</Label>
                    <select
                      id="sedation-goal"
                      value={patientInfo.sedationGoal}
                      onChange={(e) => setPatientInfo(prev => ({ ...prev, sedationGoal: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecionar</option>
                      <option value="0">0 (Alerta)</option>
                      <option value="-1">-1 (Sonolento)</option>
                      <option value="-2">-2 (Sedação leve)</option>
                      <option value="-3">-3 (Sedação moderada)</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="pain-score" className="text-sm font-medium">Escore de Dor (0-10):</Label>
                    <input
                      id="pain-score"
                      type="number"
                      value={patientInfo.painScore}
                      onChange={(e) => setPatientInfo(prev => ({ ...prev, painScore: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="10"
                      placeholder="0-10"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Risco de Delirium:</Label>
                    <RadioGroup
                      value={patientInfo.deliriumRisk}
                      onValueChange={(value) => setPatientInfo(prev => ({ ...prev, deliriumRisk: value }))}
                      className="flex gap-4 mt-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="low" id="delirium-low" />
                        <Label htmlFor="delirium-low" className="text-sm">Baixo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="high" id="delirium-high" />
                        <Label htmlFor="delirium-high" className="text-sm">Alto</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button onClick={calculate} className="flex-1">
                  <Calculator className="h-4 w-4 mr-2" />
                  Avaliar
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
                Resultado da Avaliação
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
                  <div className={`p-4 rounded-lg border ${results.selectedLevel.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">
                        RASS {results.selectedScore}
                      </span>
                      <Badge className={`${
                        results.urgency === 'CRÍTICA' ? 'bg-red-200 text-red-800' : 
                        results.urgency === 'ALTA' ? 'bg-orange-200 text-orange-800' :
                        results.urgency === 'MODERADA' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'
                      }`}>
                        {results.urgency}
                      </Badge>
                    </div>
                    <p className="font-semibold mb-1">{results.selectedLevel.term}</p>
                    <p className="text-sm opacity-90">{results.selectedLevel.description}</p>
                  </div>
                  
                  {/* Clinical Interpretation */}
                  <div className="p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
                    <h4 className="font-semibold text-blue-200 mb-2">Interpretação Clínica:</h4>
                    <p className="text-sm text-blue-200">{results.clinicalInterpretation}</p>
                  </div>
                  
                  {/* Target Recommendations */}
                  <div className="p-3 rounded-lg border bg-green-900/20 border-green-700/50">
                    <h4 className="font-semibold text-green-200 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Metas Recomendadas:
                    </h4>
                    <ul className="text-sm text-green-200 space-y-1">
                      {results.targetRecommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Intervention Recommendations */}
                  <div className="p-3 rounded-lg border bg-orange-900/20 border-orange-700/50">
                    <h4 className="font-semibold text-orange-200 mb-2 flex items-center gap-2">
                      {(results.selectedLevel.category === 'agitation' && parseInt(results.selectedScore.replace('+', '')) >= 3) && 
                        <AlertTriangle className="h-4 w-4" />
                      }
                      Intervenções:
                    </h4>
                    <ul className="text-sm text-orange-200 space-y-1">
                      {results.interventionRecommendations.map((int, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{int}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Risk Assessment */}
                  {results.riskAssessment.length > 0 && (
                    <div className="p-3 rounded-lg border bg-red-900/20 border-red-700/50">
                      <h4 className="font-semibold text-red-200 mb-2">Avaliação de Riscos:</h4>
                      <ul className="text-sm text-red-200 space-y-1">
                        {results.riskAssessment.map((risk, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Specific Adjustments */}
                  {results.sedationAdjustments.length > 0 && (
                    <div className="p-3 rounded-lg border bg-purple-900/20 border-purple-700/50">
                      <h4 className="font-semibold text-purple-200 mb-2">Ajustes Específicos:</h4>
                      <ul className="text-sm text-purple-200 space-y-1">
                        {results.sedationAdjustments.map((adj, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{adj}</span>
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
                  Selecione um nível RASS e clique em "Avaliar"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Information and Medication Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Considerações sobre Medicações</CardTitle>
            </CardHeader>
            <CardContent>
              {results && (
                <div className="space-y-3">
                  {results.medicationConsiderations.map((med, index) => (
                    <div key={index} className="p-2 rounded border-l-4 border-blue-700/50 bg-blue-900/20">
                      <p className="text-sm text-blue-200">{med}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {!results && (
                <div className="space-y-3">
                  <div className="p-2 rounded border-l-4 border-blue-700/50 bg-blue-900/20">
                    <p className="text-sm text-blue-200">Dexmedetomidina: preserva despertar, menor risco de delirium</p>
                  </div>
                  <div className="p-2 rounded border-l-4 border-blue-700/50 bg-blue-900/20">
                    <p className="text-sm text-blue-200">Propofol: início/término rápidos, cuidado com síndrome de infusão</p>
                  </div>
                  <div className="p-2 rounded border-l-4 border-blue-700/50 bg-blue-900/20">
                    <p className="text-sm text-blue-200">Midazolam: evitar infusão contínua prolongada</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Protocolo de Avaliação RASS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Procedimento de Avaliação:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Observe o paciente por 10-15 segundos</li>
                    <li>Se alerta, interagindo = RASS 0</li>
                    <li>Se não alerta, chame pelo nome (até 3 vezes)</li>
                    <li>Se sem resposta verbal, toque no ombro</li>
                    <li>Classifique conforme resposta obtida</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Frequência de Avaliação:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• A cada 4 horas (mínimo)</li>
                    <li>• Após mudanças na sedação</li>
                    <li>• Antes de procedimentos</li>
                    <li>• Conforme protocolo institucional</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Limitações:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Não aplicável em paralisia neuromuscular</li>
                    <li>• Cuidado em deficiência auditiva/visual</li>
                    <li>• Considerar barreiras linguísticas</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Referências:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Sessler CN et al. Am J Respir Crit Care Med 2002</li>
                    <li>• SCCM Clinical Practice Guidelines 2018</li>
                    <li>• Diretrizes AMIB - Sedação 2020</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RASSScale;
