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
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Checkbox } from '../../../ui/checkbox';
import { Copy, Calculator, AlertTriangle, Activity } from 'lucide-react';
import { toast } from 'sonner';

/**
 * qSOFA - Quick Sequential Organ Failure Assessment
 * 
 * This component calculates the qSOFA score for rapid sepsis screening
 * outside the ICU setting, providing quick risk stratification.
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
 * <qSOFA 
 *   open={showHardcodedCalculator === 'qsofa'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Calculation example
 * // Input: respiratoryRate=24, systolicBP=95, alteredMental=true
 * // Output: score=3, risk='Alto risco', recommendation='Avaliar para sepsis'
 * 
 * @author Health Guardian Team
 * @since Sprint 3
 * @version 1.0.0
 */
function qSOFA({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    respiratoryRate: '',
    systolicBP: '',
    alteredMental: false
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  /**
   * Validates input parameters for qSOFA calculation
   * 
   * @returns {boolean} True if all inputs are valid
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.respiratoryRate || parseFloat(inputs.respiratoryRate) < 0 || parseFloat(inputs.respiratoryRate) > 60) {
      newErrors.respiratoryRate = 'Frequência respiratória deve estar entre 0 e 60 irpm';
    }
    
    if (!inputs.systolicBP || parseFloat(inputs.systolicBP) < 50 || parseFloat(inputs.systolicBP) > 250) {
      newErrors.systolicBP = 'Pressão arterial sistólica deve estar entre 50 e 250 mmHg';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Performs the qSOFA score calculation
   * 
   * @returns {Object} Calculated results with clinical interpretation
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      const respiratoryRate = parseFloat(inputs.respiratoryRate);
      const systolicBP = parseFloat(inputs.systolicBP);
      const alteredMental = inputs.alteredMental;
      
      // qSOFA scoring criteria
      let score = 0;
      const criteria = [];
      
      // Respiratory rate ≥ 22/min
      if (respiratoryRate >= 22) {
        score += 1;
        criteria.push('Frequência respiratória ≥ 22 irpm');
      }
      
      // Systolic blood pressure ≤ 100 mmHg
      if (systolicBP <= 100) {
        score += 1;
        criteria.push('Pressão arterial sistólica ≤ 100 mmHg');
      }
      
      // Altered mental status
      if (alteredMental) {
        score += 1;
        criteria.push('Alteração do nível de consciência');
      }
      
      // Risk stratification and recommendations
      let riskLevel = '';
      let riskColor = '';
      let recommendations = [];
      let urgency = '';
      
      if (score === 0) {
        riskLevel = 'Baixo risco';
        riskColor = 'text-green-200';
        urgency = 'Rotina';
        recommendations = [
          'Risco baixo para sepsis',
          'Continuar cuidados de rotina',
          'Monitorar sinais vitais conforme protocolo',
          'Reavaliar se houver deterioração clínica'
        ];
      } else if (score === 1) {
        riskLevel = 'Risco intermediário';
        riskColor = 'text-amber-200';
        urgency = 'Atenção';
        recommendations = [
          'Risco intermediário para sepsis',
          'Monitorização mais frequente',
          'Considerar investigação adicional',
          'Reavaliar em 1-2 horas',
          'Estar atento para deterioração'
        ];
      } else {
        riskLevel = 'Alto risco';
        riskColor = 'text-amber-200';
        urgency = 'URGENTE';
        recommendations = [
          'ALTO RISCO PARA SEPSIS - Avaliação urgente necessária',
          'Iniciar bundle de sepsis imediatamente',
          'Colher culturas antes dos antibióticos',
          'Considerar lactato sérico',
          'Avaliar necessidade de UTI',
          'Monitorização contínua'
        ];
      }
      
      // Clinical context and monitoring
      const clinicalContext = [
        'qSOFA é uma ferramenta de triagem, não diagnóstica',
        'Score ≥ 2 indica maior risco de mortalidade',
        'Deve ser usado em conjunto com julgamento clínico',
        'Não substitui critérios SOFA completos em UTI',
        'Reavaliar regularmente durante internação'
      ];
      
      // Additional monitoring parameters
      const monitoringParameters = [
        'Sinais vitais a cada 15-30 minutos se score ≥ 2',
        'Débito urinário horário',
        'Perfusão periférica e enchimento capilar',
        'Nível de consciência (Glasgow Coma Scale)',
        'Temperatura corporal',
        'Saturação de oxigênio'
      ];
      
      const calculatedResults = {
        score,
        maxScore: 3,
        criteria,
        riskLevel,
        riskColor,
        urgency,
        recommendations,
        clinicalContext,
        monitoringParameters,
        interpretation: score >= 2 ? 'Positivo para alto risco' : 'Negativo para alto risco'
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
      respiratoryRate: '',
      systolicBP: '',
      alteredMental: false
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `qSOFA (Quick SOFA) - Resultados:\n`;
    resultText += `Frequência respiratória: ${inputs.respiratoryRate} irpm\n`;
    resultText += `Pressão arterial sistólica: ${inputs.systolicBP} mmHg\n`;
    resultText += `Alteração mental: ${inputs.alteredMental ? 'Sim' : 'Não'}\n\n`;
    resultText += `Score qSOFA: ${results.score}/${results.maxScore}\n`;
    resultText += `Interpretação: ${results.interpretation}\n`;
    resultText += `Nível de risco: ${results.riskLevel}\n`;
    resultText += `Urgência: ${results.urgency}\n\n`;
    
    if (results.criteria.length > 0) {
      resultText += `Critérios presentes:\n${results.criteria.map(c => `• ${c}`).join('\n')}\n\n`;
    }
    
    resultText += `Recomendações:\n${results.recommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    resultText += `Calculado em: ${new Date().toLocaleString('pt-BR')}`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results, inputs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            qSOFA - Quick Sequential Organ Failure Assessment
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros Clínicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="respiratoryRate">Frequência Respiratória (irpm)</Label>
                <Input
                  id="respiratoryRate"
                  type="number"
                  value={inputs.respiratoryRate}
                  onChange={(e) => setInputs(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                  placeholder="Ex: 20"
                  min="0"
                  max="60"
                  step="1"
                  className={errors.respiratoryRate ? 'border-red-500' : ''}
                />
                {errors.respiratoryRate && (
                  <p className="text-sm text-red-500">{errors.respiratoryRate}</p>
                )}
                <p className="text-xs text-muted-foreground">Critério: ≥ 22 irpm = 1 ponto</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="systolicBP">Pressão Arterial Sistólica (mmHg)</Label>
                <Input
                  id="systolicBP"
                  type="number"
                  value={inputs.systolicBP}
                  onChange={(e) => setInputs(prev => ({ ...prev, systolicBP: e.target.value }))}
                  placeholder="Ex: 120"
                  min="50"
                  max="250"
                  step="1"
                  className={errors.systolicBP ? 'border-red-500' : ''}
                />
                {errors.systolicBP && (
                  <p className="text-sm text-red-500">{errors.systolicBP}</p>
                )}
                <p className="text-xs text-muted-foreground">Critério: ≤ 100 mmHg = 1 ponto</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="alteredMental"
                  checked={inputs.alteredMental}
                  onCheckedChange={(checked) => setInputs(prev => ({ ...prev, alteredMental: checked }))}
                />
                <Label htmlFor="alteredMental">Alteração do nível de consciência</Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">Critério: Presente = 1 ponto</p>
              
              <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-700/50">
          <h4 className="font-semibold text-blue-200 mb-2">Critérios qSOFA:</h4>
          <ul className="text-sm text-blue-300 space-y-1">
                  <li>• <strong>Frequência respiratória:</strong> ≥ 22 irpm</li>
                  <li>• <strong>Pressão arterial sistólica:</strong> ≤ 100 mmHg</li>
                  <li>• <strong>Alteração mental:</strong> Glasgow &lt; 15 ou confusão</li>
                </ul>
                <p className="text-xs text-blue-300 mt-2">Score ≥ 2 = Alto risco para sepsis</p>
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
            <div className="text-3xl font-bold text-blue-200">{results.score}</div>
            <div className="text-sm text-blue-300">de {results.maxScore} pontos</div>
            <div className="text-lg font-semibold text-blue-200 mt-2">{results.interpretation}</div>
                    </div>
                  </div>
                  
                  {/* Risk Level */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Nível de Risco:</span>
                    <Badge className={results.riskColor}>
                      {results.riskLevel}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Urgência:</span>
                    <Badge className={results.score >= 2 ? 'bg-red-900/30 text-red-200 border border-red-700/50' : 'bg-green-900/30 text-green-200 border border-green-700/50'}>
                      {results.urgency}
                    </Badge>
                  </div>
                  
                  {/* Criteria Present */}
                  {results.criteria.length > 0 && (
                    <div className="p-3 rounded-lg border bg-yellow-900/20 border-yellow-700/50">
          <h4 className="font-semibold text-yellow-200 mb-2">Critérios Presentes:</h4>
          <ul className="text-sm text-yellow-300 space-y-1">
                        {results.criteria.map((criterion, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{criterion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Recommendations */}
                  <div className={`p-3 rounded-lg border ${
                    results.score >= 2 
                      ? 'bg-red-900/20 border-red-700/50' 
                      : 'bg-green-900/20 border-green-700/50'
                  }`}>
                    <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                      results.score >= 2 ? 'text-red-200' : 'text-green-200'
                    }`}>
                      {results.score >= 2 && <AlertTriangle className="h-4 w-4" />}
                      Recomendações:
                    </h4>
                    <ul className={`text-sm space-y-1 ${
                      results.score >= 2 ? 'text-red-300' : 'text-green-300'
                    }`}>
                      {results.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Monitoring Parameters */}
                  <div className="p-3 rounded-lg border bg-purple-900/20 border-purple-700/50">
                    <h4 className="font-semibold text-purple-200 mb-2">Monitorização:</h4>
                    <ul className="text-sm text-purple-300 space-y-1">
                      {results.monitoringParameters.map((param, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{param}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Clinical Context */}
                  <div className="p-3 rounded-lg border bg-amber-900/20 border-amber-700/50">
                    <h4 className="font-semibold text-amber-200 mb-2">Contexto Clínico:</h4>
                    <ul className="text-sm text-amber-300 space-y-1">
                      {results.clinicalContext.map((context, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{context}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Preencha os campos e clique em "Calcular"
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
                <h4 className="font-semibold mb-2">qSOFA (Quick SOFA):</h4>
                <p className="text-sm text-muted-foreground">
                  O qSOFA é uma ferramenta de triagem rápida para identificar pacientes com 
                  suspeita de infecção que têm maior risco de desfechos adversos fora da UTI. 
                  Um score ≥ 2 indica maior probabilidade de mortalidade hospitalar prolongada 
                  ou morte.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Indicações:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Triagem rápida de sepsis em enfermarias</li>
                  <li>• Avaliação inicial no pronto-socorro</li>
                  <li>• Monitorização de pacientes com infecção</li>
                  <li>• Identificação de deterioração clínica</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Limitações:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Não substitui o julgamento clínico</li>
                  <li>• Menos sensível que SOFA completo</li>
                  <li>• Não deve ser usado isoladamente</li>
                  <li>• Requer contexto clínico adequado</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Singer M, et al. JAMA. 2016;315(8):801-810</li>
                  <li>• Seymour CW, et al. JAMA. 2016;315(8):762-774</li>
                  <li>• Surviving Sepsis Campaign Guidelines 2021</li>
                  <li>• ILAS (Instituto Latino Americano de Sepse)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default qSOFA;
