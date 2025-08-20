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
import { Copy, Calculator, Flame, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ParklandFormula - Fórmula de Parkland para Reposição Volêmica em Queimaduras
 * 
 * This component calculates fluid resuscitation requirements for burn patients
 * using the Parkland formula, essential for emergency burn management.
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
 * <ParklandFormula 
 *   open={showHardcodedCalculator === 'parkland-formula'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Calculation example
 * // Input: weight=70kg, burnPercentage=20%, isPediatric=false
 * // Output: totalVolume=5600mL, first8h=2800mL, next16h=2800mL
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function ParklandFormula({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    weight: '',
    burnPercentage: '',
    isPediatric: false,
    injuryTime: '' // Time since injury for calculating remaining time
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  /**
   * Validates input parameters for Parkland formula calculation
   * 
   * @returns {boolean} True if all inputs are valid
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.weight || parseFloat(inputs.weight) <= 0 || parseFloat(inputs.weight) > 300) {
      newErrors.weight = 'Peso deve estar entre 0,1 e 300 kg';
    }
    
    if (!inputs.burnPercentage || parseFloat(inputs.burnPercentage) <= 0 || parseFloat(inputs.burnPercentage) > 100) {
      newErrors.burnPercentage = 'Percentual de queimadura deve estar entre 1 e 100%';
    }
    
    // Additional validation for pediatric patients
    if (inputs.isPediatric && parseFloat(inputs.weight) > 50) {
      newErrors.weight = 'Peso pediátrico geralmente < 50 kg - verificar se é realmente pediátrico';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Performs the Parkland formula calculation
   * 
   * @returns {Object} Calculated results with clinical interpretation
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      const weight = parseFloat(inputs.weight);
      const burnPercentage = parseFloat(inputs.burnPercentage);
      
      // Parkland Formula: 4 mL/kg/%TBSA for adults, 3 mL/kg/%TBSA for pediatric
      const factor = inputs.isPediatric ? 3 : 4;
      
      // Total volume calculation
      const totalVolume = factor * weight * burnPercentage;
      
      // First 8 hours: 50% of total volume
      const first8Hours = totalVolume / 2;
      
      // Next 16 hours: remaining 50%
      const next16Hours = totalVolume / 2;
      
      // Calculate hourly rates
      const rateFirst8h = first8Hours / 8;
      const rateNext16h = next16Hours / 16;
      
      // Calculate time-based recommendations if injury time provided
      let timeBasedRecommendations = [];
      if (inputs.injuryTime) {
        const hoursSinceInjury = parseFloat(inputs.injuryTime);
        if (hoursSinceInjury < 8) {
          const remainingFirst8h = 8 - hoursSinceInjury;
          const volumeRemaining = (remainingFirst8h / 8) * first8Hours;
          timeBasedRecommendations.push(`Restam ${remainingFirst8h.toFixed(1)}h das primeiras 8h`);
          timeBasedRecommendations.push(`Volume restante: ${volumeRemaining.toFixed(0)} mL`);
        } else if (hoursSinceInjury < 24) {
          const remainingNext16h = 24 - hoursSinceInjury;
          const volumeRemaining = (remainingNext16h / 16) * next16Hours;
          timeBasedRecommendations.push(`Restam ${remainingNext16h.toFixed(1)}h das próximas 16h`);
          timeBasedRecommendations.push(`Volume restante: ${volumeRemaining.toFixed(0)} mL`);
        } else {
          timeBasedRecommendations.push('Período inicial de 24h já passou');
          timeBasedRecommendations.push('Avaliar necessidade de fluidos adicionais');
        }
      }
      
      // Determine burn severity and clinical recommendations
      let severity = '';
      let severityColor = '';
      let clinicalRecommendations = [];
      
      if (burnPercentage < 10) {
        severity = 'Leve';
        severityColor = 'text-green-200';
        clinicalRecommendations = [
          'Queimadura leve - considerar tratamento ambulatorial',
          'Hidratação oral pode ser suficiente se tolerada',
          'Monitorar sinais de desidratação'
        ];
      } else if (burnPercentage < 20) {
        severity = 'Moderada';
        severityColor = 'text-amber-200';
        clinicalRecommendations = [
          'Queimadura moderada - internação recomendada',
          'Iniciar reposição IV imediatamente',
          'Monitorar débito urinário de perto'
        ];
      } else if (burnPercentage < 40) {
        severity = 'Grave';
        severityColor = 'text-orange-200';
        clinicalRecommendations = [
          'Queimadura grave - UTI ou centro de queimados',
          'Reposição volêmica agressiva necessária',
          'Monitoramento hemodinâmico contínuo',
          'Considerar cateter vesical para débito urinário'
        ];
      } else {
        severity = 'Crítica';
        severityColor = 'text-red-200';
        clinicalRecommendations = [
          'QUEIMADURA CRÍTICA - Centro de queimados URGENTE',
          'Reposição volêmica massiva necessária',
          'Monitoramento invasivo obrigatório',
          'Risco elevado de choque e falência orgânica',
          'Considerar intubação profilática'
        ];
      }
      
      // Monitoring parameters
      const monitoringParameters = [
        inputs.isPediatric 
          ? 'Débito urinário: 1-2 mL/kg/h (pediátrico)'
          : 'Débito urinário: 0,5-1 mL/kg/h (adulto)',
        'Pressão arterial e frequência cardíaca',
        'Perfusão periférica e enchimento capilar',
        'Nível de consciência',
        'Gasometria arterial e lactato',
        'Eletrólitos e função renal'
      ];
      
      // Additional considerations
      const additionalConsiderations = [
        'Fórmula é apenas ponto de partida - ajustar conforme resposta clínica',
        'Reavaliar necessidade de fluidos a cada 2-4 horas',
        'Considerar albumina após 12-24h se necessário',
        'Atenção para sobrecarga volêmica em idosos/cardiopatas',
        inputs.isPediatric 
          ? 'Crianças têm maior risco de hipoglicemia e hipotermia'
          : 'Adultos podem necessitar ajustes por comorbidades'
      ];
      
      const calculatedResults = {
        totalVolume: totalVolume.toFixed(0),
        first8Hours: first8Hours.toFixed(0),
        next16Hours: next16Hours.toFixed(0),
        rateFirst8h: rateFirst8h.toFixed(1),
        rateNext16h: rateNext16h.toFixed(1),
        factor,
        severity,
        severityColor,
        clinicalRecommendations,
        monitoringParameters,
        additionalConsiderations,
        timeBasedRecommendations,
        targetUrineOutput: inputs.isPediatric 
          ? `${(weight * 1.5).toFixed(0)} mL/h` 
          : `${(weight * 0.75).toFixed(0)} mL/h`
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
      weight: '',
      burnPercentage: '',
      isPediatric: false,
      injuryTime: ''
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `Fórmula de Parkland - Resultados:\n`;
    resultText += `Peso: ${inputs.weight} kg\n`;
    resultText += `Queimadura: ${inputs.burnPercentage}% SCQ\n`;
    resultText += `Paciente: ${inputs.isPediatric ? 'Pediátrico' : 'Adulto'}\n\n`;
    resultText += `Volume total (24h): ${results.totalVolume} mL\n`;
    resultText += `Primeiras 8h: ${results.first8Hours} mL (${results.rateFirst8h} mL/h)\n`;
    resultText += `Próximas 16h: ${results.next16Hours} mL (${results.rateNext16h} mL/h)\n\n`;
    resultText += `Gravidade: ${results.severity}\n`;
    resultText += `Débito urinário alvo: ${results.targetUrineOutput}\n\n`;
    
    if (results.timeBasedRecommendations.length > 0) {
      resultText += `Recomendações temporais:\n${results.timeBasedRecommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    }
    
    resultText += `Recomendações clínicas:\n${results.clinicalRecommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    resultText += `Monitoramento:\n${results.monitoringParameters.map(p => `• ${p}`).join('\n')}\n\n`;
    resultText += `Calculado em: ${new Date().toLocaleString('pt-BR')}`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results, inputs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Fórmula de Parkland - Reposição Volêmica em Queimaduras
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={inputs.weight}
                  onChange={(e) => setInputs(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="Ex: 70"
                  min="0.1"
                  max="300"
                  step="0.1"
                  className={errors.weight ? 'border-red-500' : ''}
                />
                {errors.weight && (
                  <p className="text-sm text-red-500">{errors.weight}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="burnPercentage">Percentual de Queimadura (% SCQ)</Label>
                <Input
                  id="burnPercentage"
                  type="number"
                  value={inputs.burnPercentage}
                  onChange={(e) => setInputs(prev => ({ ...prev, burnPercentage: e.target.value }))}
                  placeholder="Ex: 20"
                  min="1"
                  max="100"
                  step="0.1"
                  className={errors.burnPercentage ? 'border-red-500' : ''}
                />
                {errors.burnPercentage && (
                  <p className="text-sm text-red-500">{errors.burnPercentage}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="injuryTime">Tempo desde a lesão (horas) - Opcional</Label>
                <Input
                  id="injuryTime"
                  type="number"
                  value={inputs.injuryTime}
                  onChange={(e) => setInputs(prev => ({ ...prev, injuryTime: e.target.value }))}
                  placeholder="Ex: 2"
                  min="0"
                  max="48"
                  step="0.1"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPediatric"
                  checked={inputs.isPediatric}
                  onChange={(e) => setInputs(prev => ({ ...prev, isPediatric: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="isPediatric">Paciente pediátrico (fator 3 mL/kg/%SCQ)</Label>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Classificação por Gravidade:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Leve:</strong> &lt; 10% SCQ</li>
                  <li>• <strong>Moderada:</strong> 10-19% SCQ</li>
                  <li>• <strong>Grave:</strong> 20-39% SCQ</li>
                  <li>• <strong>Crítica:</strong> &#8805; 40% SCQ</li>
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
                  {/* Main Results */}
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-800">Volume Total (24h):</span>
                        <span className="font-bold text-blue-900">{results.totalVolume} mL</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                        <div className="text-center">
                          <div className="font-medium text-green-800">Primeiras 8h</div>
                          <div className="font-bold text-green-900">{results.first8Hours} mL</div>
                          <div className="text-sm text-green-700">{results.rateFirst8h} mL/h</div>
                        </div>
                      </div>
                      
                      <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                        <div className="text-center">
                          <div className="font-medium text-yellow-800">Próximas 16h</div>
                          <div className="font-bold text-yellow-900">{results.next16Hours} mL</div>
                          <div className="text-sm text-yellow-700">{results.rateNext16h} mL/h</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Débito Urinário Alvo:</span>
                        <span className="font-bold">{results.targetUrineOutput}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Severity Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Gravidade da Queimadura:</span>
                    <Badge className={results.severityColor}>
                      {results.severity}
                    </Badge>
                  </div>
                  
                  {/* Time-based Recommendations */}
                  {results.timeBasedRecommendations.length > 0 && (
                    <div className="p-3 rounded-lg border bg-purple-50 border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2">Recomendações Temporais:</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        {results.timeBasedRecommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Clinical Recommendations */}
                  <div className="p-3 rounded-lg border bg-orange-50 border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Recomendações Clínicas:
                    </h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {results.clinicalRecommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Monitoring Parameters */}
                  <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Parâmetros de Monitoramento:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      {results.monitoringParameters.map((param, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{param}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Additional Considerations */}
                  <div className="p-3 rounded-lg border bg-gray-50 border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2">Considerações Adicionais:</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
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
                  Preencha os campos e clique em "Calcular"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Formula Card */}
        <Card>
          <CardHeader>
            <CardTitle>Fórmula e Referências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Fórmula de Parkland:</h4>
                <div className="space-y-2">
                  <code className="bg-muted p-2 rounded block text-sm">
                    Volume (mL) = Fator × Peso (kg) × % Superfície Corporal Queimada
                  </code>
                  <code className="bg-muted p-2 rounded block text-sm">
                    Fator: 4 mL/kg/%SCQ (adulto) | 3 mL/kg/%SCQ (pediátrico)
                  </code>
                  <code className="bg-muted p-2 rounded block text-sm">
                    Distribuição: 50% nas primeiras 8h | 50% nas próximas 16h
                  </code>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interpretação Clínica:</h4>
                <p className="text-sm text-muted-foreground">
                  A Fórmula de Parkland é o padrão-ouro para reposição volêmica inicial em queimaduras. 
                  Calcula o volume de cristaloide (Ringer Lactato) necessário nas primeiras 24 horas. 
                  A fórmula é um ponto de partida - ajustes devem ser feitos baseados na resposta clínica, 
                  especialmente o débito urinário e parâmetros hemodinâmicos.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Indicações:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Queimaduras de 2º e 3º grau &gt; 15% SCQ (adulto)</li>
                  <li>• Queimaduras de 2º e 3º grau &gt; 10% SCQ (pediátrico)</li>
                  <li>• Queimaduras elétricas significativas</li>
                  <li>• Queimaduras inalatórias com lesão sistêmica</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Parkland/Baxter Formula - Original 1968</li>
                  <li>• American Burn Association Guidelines 2023</li>
                  <li>• Advanced Burn Life Support (ABLS) Protocol</li>
                  <li>• Sociedade Brasileira de Queimaduras - Diretrizes 2022</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default ParklandFormula;