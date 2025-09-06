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
import { Copy, Calculator, Brain, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * CAMICUScore - Confusion Assessment Method for ICU (CAM-ICU)
 * 
 * This component implements the CAM-ICU assessment tool for detecting
 * delirium in critically ill patients, following validated clinical criteria.
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
 * <CAMICUScore 
 *   open={showHardcodedCalculator === 'cam-icu-score'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Assessment example
 * // Input: feature1=present, feature2=present, feature3=absent, feature4=present
 * // Output: deliriumPresent=true, interpretation="Delirium positivo"
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function CAMICUScore({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    feature1: '', // Acute onset or fluctuating course
    feature2: '', // Inattention
    feature3: '', // Disorganized thinking
    feature4: '', // Altered level of consciousness
    rassScore: '', // Optional RASS score for context
    sedationLevel: 'none' // none, light, moderate, deep
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // CAM-ICU Features definitions
  const camFeatures = [
    {
      id: 'feature1',
      title: 'Característica 1: Início Agudo ou Curso Flutuante',
      description: 'Há evidência de mudança aguda no estado mental em relação ao basal? OU o comportamento (anormal) flutuou durante as últimas 24 horas?',
      examples: [
        'Mudança súbita na cognição',
        'Alterações que vão e vêm durante o dia',
        'Períodos de lucidez alternados com confusão',
        'Relato da família sobre mudança comportamental'
      ]
    },
    {
      id: 'feature2',
      title: 'Característica 2: Desatenção',
      description: 'O paciente tem dificuldade para focar a atenção? (Avaliado através de testes específicos como SAVEAHAART ou contagem regressiva)',
      examples: [
        'Dificuldade em seguir comandos',
        'Facilmente distraído por estímulos irrelevantes',
        'Dificuldade em manter conversação',
        'Erro em testes de atenção (>2 erros)'
      ]
    },
    {
      id: 'feature3',
      title: 'Característica 3: Pensamento Desorganizado',
      description: 'O pensamento do paciente é desorganizado ou incoerente? (Avaliado através de perguntas sim/não e comandos)',
      examples: [
        'Discurso incoerente ou ilógico',
        'Fluxo de ideias não claro',
        'Respostas inadequadas às perguntas',
        'Incapacidade de seguir comandos simples'
      ]
    },
    {
      id: 'feature4',
      title: 'Característica 4: Nível de Consciência Alterado',
      description: 'O nível de consciência do paciente é diferente de alerta? (RASS diferente de 0)',
      examples: [
        'Hipervigilante (RASS +1 a +4)',
        'Sonolento mas desperta (RASS -1 a -3)',
        'Letárgico ou estuporoso',
        'Qualquer alteração do estado de alerta normal'
      ]
    }
  ];

  /**
   * Validates input parameters for CAM-ICU assessment
   * 
   * @returns {boolean} True if all required inputs are provided
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.feature1) {
      newErrors.feature1 = 'Característica 1 deve ser avaliada';
    }
    
    if (!inputs.feature2) {
      newErrors.feature2 = 'Característica 2 deve ser avaliada';
    }
    
    if (!inputs.feature3) {
      newErrors.feature3 = 'Característica 3 deve ser avaliada';
    }
    
    if (!inputs.feature4) {
      newErrors.feature4 = 'Característica 4 deve ser avaliada';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Calculates CAM-ICU result based on the four features
   * 
   * @returns {Object} Assessment results with clinical interpretation
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      // CAM-ICU Algorithm:
      // Delirium is present if:
      // Feature 1 (Acute onset/fluctuating) AND Feature 2 (Inattention) are present
      // AND EITHER Feature 3 (Disorganized thinking) OR Feature 4 (Altered consciousness) is present
      
      const feature1Present = inputs.feature1 === 'present';
      const feature2Present = inputs.feature2 === 'present';
      const feature3Present = inputs.feature3 === 'present';
      const feature4Present = inputs.feature4 === 'present';
      
      const deliriumPresent = feature1Present && feature2Present && (feature3Present || feature4Present);
      
      // Determine delirium subtype if present
      let deliriumSubtype = '';
      if (deliriumPresent) {
        if (inputs.rassScore) {
          const rass = parseInt(inputs.rassScore);
          if (rass > 0) {
            deliriumSubtype = 'Hiperativo';
          } else if (rass < 0) {
            deliriumSubtype = 'Hipoativo';
          } else {
            deliriumSubtype = 'Misto';
          }
        } else {
          deliriumSubtype = 'Não classificado';
        }
      }
      
      // Generate interpretation
      let interpretation = '';
      let interpretationColor = '';
      let urgency = '';
      
      if (deliriumPresent) {
        interpretation = 'CAM-ICU POSITIVO - Delirium presente';
        interpretationColor = 'text-red-700';
        urgency = 'ALTA';
      } else {
        interpretation = 'CAM-ICU NEGATIVO - Delirium ausente';
        interpretationColor = 'text-green-700';
        urgency = 'BAIXA';
      }
      
      // Clinical recommendations based on result
      let clinicalRecommendations = [];
      
      if (deliriumPresent) {
        clinicalRecommendations = [
          'Identificar e tratar causas reversíveis de delirium',
          'Revisar medicações potencialmente deletérias',
          'Implementar medidas não-farmacológicas',
          'Considerar antipsicóticos se agitação severa',
          'Reavaliar diariamente com CAM-ICU',
          'Envolver família no cuidado quando possível',
          'Otimizar ambiente (ciclo sono-vigília, orientação)',
          'Mobilização precoce quando segura'
        ];
      } else {
        clinicalRecommendations = [
          'Manter vigilância para desenvolvimento de delirium',
          'Continuar medidas preventivas',
          'Reavaliar se mudança no estado mental',
          'Manter ambiente terapêutico',
          'Promover sono adequado',
          'Mobilização precoce'
        ];
      }
      
      // Risk factors assessment
      const riskFactors = [
        'Idade avançada (>65 anos)',
        'Demência pré-existente',
        'Gravidade da doença (APACHE II alto)',
        'Sedação profunda',
        'Uso de benzodiazepínicos',
        'Imobilização prolongada',
        'Privação do sono',
        'Distúrbios metabólicos',
        'Infecção/sepse',
        'Hipoxemia'
      ];
      
      // Prevention strategies
      const preventionStrategies = [
        'Minimizar uso de sedativos (especialmente benzodiazepínicos)',
        'Protocolo de sedação com metas claras',
        'Mobilização precoce e fisioterapia',
        'Orientação temporal e espacial frequente',
        'Manter ciclo sono-vigília natural',
        'Controle adequado da dor',
        'Correção de distúrbios metabólicos',
        'Uso de óculos/aparelhos auditivos quando necessário',
        'Presença familiar quando possível',
        'Ambiente calmo e organizado'
      ];
      
      // Monitoring recommendations
      const monitoringRecommendations = [
        'Avaliar CAM-ICU a cada turno (mínimo 2x/dia)',
        'Documentar RASS antes da avaliação CAM-ICU',
        'Registrar fatores precipitantes identificados',
        'Monitorar resposta às intervenções',
        'Avaliar duração do delirium',
        'Acompanhar desfechos funcionais pós-alta'
      ];
      
      // Feature summary for documentation
      const featureSummary = {
        feature1: { present: feature1Present, name: 'Início agudo/flutuante' },
        feature2: { present: feature2Present, name: 'Desatenção' },
        feature3: { present: feature3Present, name: 'Pensamento desorganizado' },
        feature4: { present: feature4Present, name: 'Consciência alterada' }
      };
      
      const calculatedResults = {
        deliriumPresent,
        deliriumSubtype,
        interpretation,
        interpretationColor,
        urgency,
        featureSummary,
        clinicalRecommendations,
        riskFactors,
        preventionStrategies,
        monitoringRecommendations,
        assessmentDate: new Date().toLocaleString('pt-BR')
      };
      
      setResults(calculatedResults);
    } catch (error) {
      toast.error('Erro na avaliação: ' + error.message);
    }
  }, [inputs, validateInputs]);

  /**
   * Clears all input fields and results
   */
  const clearForm = useCallback(() => {
    setInputs({
      feature1: '',
      feature2: '',
      feature3: '',
      feature4: '',
      rassScore: '',
      sedationLevel: 'none'
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies assessment results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `Avaliação CAM-ICU - Resultados:\n`;
    resultText += `Data/Hora: ${results.assessmentDate}\n\n`;
    
    resultText += `RESULTADO: ${results.interpretation}\n`;
    if (results.deliriumSubtype && results.deliriumPresent) {
      resultText += `Subtipo: ${results.deliriumSubtype}\n`;
    }
    resultText += `Urgência: ${results.urgency}\n\n`;
    
    resultText += `Características avaliadas:\n`;
    Object.entries(results.featureSummary).forEach(([key, feature]) => {
      resultText += `• ${feature.name}: ${feature.present ? 'PRESENTE' : 'AUSENTE'}\n`;
    });
    
    if (inputs.rassScore) {
      resultText += `\nRASSScore: ${inputs.rassScore}\n`;
    }
    
    resultText += `\nRecomendações clínicas:\n${results.clinicalRecommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    resultText += `Monitoramento:\n${results.monitoringRecommendations.map(m => `• ${m}`).join('\n')}\n\n`;
    resultText += `Avaliado por: [Nome do profissional]\n`;
    resultText += `Próxima avaliação: [Data/hora]`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results, inputs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            CAM-ICU - Confusion Assessment Method for ICU
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assessment Card */}
          <Card>
            <CardHeader>
              <CardTitle>Avaliação das Características</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {camFeatures.map((feature, index) => (
                <div key={feature.id} className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-800">
                      {feature.title}
                    </Label>
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h5 className="text-xs font-semibold text-blue-800 mb-2">Exemplos:</h5>
                    <ul className="text-xs text-blue-700 space-y-1">
                      {feature.examples.map((example, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <RadioGroup
                    value={inputs[feature.id]}
                    onValueChange={(value) => setInputs(prev => ({ ...prev, [feature.id]: value }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="present" id={`${feature.id}-present`} />
                      <Label htmlFor={`${feature.id}-present`} className="text-green-700 font-medium">
                        Presente
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="absent" id={`${feature.id}-absent`} />
                      <Label htmlFor={`${feature.id}-absent`} className="text-gray-600">
                        Ausente
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {errors[feature.id] && (
                    <p className="text-sm text-red-500">{errors[feature.id]}</p>
                  )}
                  
                  {index < camFeatures.length - 1 && (
                    <hr className="border-gray-200" />
                  )}
                </div>
              ))}
              
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-semibold text-gray-800">
                  Informações Complementares (Opcional)
                </Label>
                
                <div className="space-y-2">
                  <Label htmlFor="rassScore" className="text-sm">RASS Score (-5 a +4):</Label>
                  <input
                    id="rassScore"
                    type="number"
                    value={inputs.rassScore}
                    onChange={(e) => setInputs(prev => ({ ...prev, rassScore: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: -1"
                    min="-5"
                    max="4"
                    step="1"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
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
                  <div className={`p-4 rounded-lg border ${
                    results.deliriumPresent 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-lg ${results.interpretationColor}`}>
                        {results.interpretation}
                      </span>
                      <Badge className={results.deliriumPresent ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        Urgência: {results.urgency}
                      </Badge>
                    </div>
                    
                    {results.deliriumPresent && results.deliriumSubtype && (
                      <p className="text-sm text-red-700">
                        <strong>Subtipo:</strong> {results.deliriumSubtype}
                      </p>
                    )}
                  </div>
                  
                  {/* Feature Summary */}
                  <div className="p-3 rounded-lg border bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-3">Resumo das Características:</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(results.featureSummary).map(([key, feature]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{feature.name}:</span>
                          <Badge className={feature.present ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}>
                            {feature.present ? 'PRESENTE' : 'AUSENTE'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Clinical Recommendations */}
                  <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      {results.deliriumPresent && <AlertTriangle className="h-4 w-4" />}
                      Recomendações Clínicas:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {results.clinicalRecommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Monitoring */}
                  <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Monitoramento:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      {results.monitoringRecommendations.map((mon, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{mon}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Risk Factors */}
                  <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">Fatores de Risco para Delirium:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {results.riskFactors.map((risk, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Prevention Strategies */}
                  <div className="p-3 rounded-lg border bg-purple-50 border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">Estratégias de Prevenção:</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      {results.preventionStrategies.map((strategy, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Complete a avaliação das 4 características e clique em "Avaliar"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Algoritmo CAM-ICU e Referências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Algoritmo de Diagnóstico:</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-mono">
                    <strong>Delirium está PRESENTE se:</strong><br/>
                    Característica 1 (Início agudo/flutuante) = PRESENTE<br/>
                    E<br/>
                    Característica 2 (Desatenção) = PRESENTE<br/>
                    E<br/>
                    [Característica 3 (Pensamento desorganizado) = PRESENTE<br/>
                    OU<br/>
                    Característica 4 (Consciência alterada) = PRESENTE]
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interpretação:</h4>
                <p className="text-sm text-muted-foreground">
                  O CAM-ICU é uma ferramenta validada para detecção de delirium em pacientes críticos. 
                  Deve ser aplicado apenas em pacientes com RASS ≥ -3 (responsivos a estímulo verbal). 
                  A avaliação deve ser realizada a cada turno por profissionais treinados.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Subtipos de Delirium:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Hiperativo:</strong> Agitação, hipervigilância (RASS +1 a +4)</li>
                  <li>• <strong>Hipoativo:</strong> Letargia, retraimento (RASS -1 a -3)</li>
                  <li>• <strong>Misto:</strong> Alternância entre hiper e hipoativo</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Limitações:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Não aplicável em pacientes comatosos (RASS -4 ou -5)</li>
                  <li>• Requer treinamento adequado do avaliador</li>
                  <li>• Pode ser influenciado por sedação</li>
                  <li>• Não diferencia delirium de demência</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ely EW et al. Delirium in mechanically ventilated patients. JAMA 2001</li>
                  <li>• Inouye SK et al. Clarifying confusion: CAM. Ann Intern Med 1990</li>
                  <li>• SCCM Clinical Practice Guidelines - Pain, Agitation, Delirium 2018</li>
                  <li>• Diretrizes AMIB - Dor, Agitação e Delirium 2020</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default CAMICUScore;
