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
import { RadioGroup, RadioGroupItem } from '../../../ui/radio-group';
import { Copy, Calculator, Droplets, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * EstimatedBloodVolume - Calculadora de Volume Sanguíneo Estimado
 * 
 * This component calculates estimated blood volume based on patient demographics
 * using established formulas for different age groups and clinical scenarios.
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
 * <EstimatedBloodVolume 
 *   open={showHardcodedCalculator === 'estimated-blood-volume'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Calculation example
 * // Input: weight=70kg, age=30, sex=male
 * // Output: bloodVolume=5250mL, allowableLoss=1575mL
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function EstimatedBloodVolume({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    weight: '',
    age: '',
    sex: 'male', // 'male' | 'female'
    clinicalScenario: 'general', // 'general' | 'surgery' | 'trauma' | 'pediatric'
    hematocrit: '' // Optional for more precise calculations
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  /**
   * Validates input parameters for blood volume calculation
   * 
   * @returns {boolean} True if all inputs are valid
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.weight || parseFloat(inputs.weight) <= 0 || parseFloat(inputs.weight) > 300) {
      newErrors.weight = 'Peso deve estar entre 0,1 e 300 kg';
    }
    
    if (!inputs.age || parseFloat(inputs.age) < 0 || parseFloat(inputs.age) > 120) {
      newErrors.age = 'Idade deve estar entre 0 e 120 anos';
    }
    
    if (inputs.hematocrit && (parseFloat(inputs.hematocrit) < 10 || parseFloat(inputs.hematocrit) > 70)) {
      newErrors.hematocrit = 'Hematócrito deve estar entre 10 e 70%';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Calculates estimated blood volume using age and sex-specific formulas
   * 
   * @returns {Object} Calculated results with clinical interpretation
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      const weight = parseFloat(inputs.weight);
      const age = parseFloat(inputs.age);
      const hematocrit = inputs.hematocrit ? parseFloat(inputs.hematocrit) : null;
      
      let bloodVolume = 0;
      let formulaUsed = '';
      
      // Age-specific calculations
      if (age < 0.25) {
        // Neonates (0-3 months)
        bloodVolume = weight * 85; // 85 mL/kg
        formulaUsed = 'Neonatal (85 mL/kg)';
      } else if (age < 1) {
        // Infants (3-12 months)
        bloodVolume = weight * 80; // 80 mL/kg
        formulaUsed = 'Lactente (80 mL/kg)';
      } else if (age < 12) {
        // Children (1-12 years)
        bloodVolume = weight * 75; // 75 mL/kg
        formulaUsed = 'Pediátrico (75 mL/kg)';
      } else if (age < 18) {
        // Adolescents (12-18 years)
        if (inputs.sex === 'male') {
          bloodVolume = weight * 70; // 70 mL/kg
          formulaUsed = 'Adolescente masculino (70 mL/kg)';
        } else {
          bloodVolume = weight * 65; // 65 mL/kg
          formulaUsed = 'Adolescente feminino (65 mL/kg)';
        }
      } else {
        // Adults (>18 years)
        if (inputs.sex === 'male') {
          bloodVolume = weight * 75; // 75 mL/kg
          formulaUsed = 'Adulto masculino (75 mL/kg)';
        } else {
          bloodVolume = weight * 65; // 65 mL/kg
          formulaUsed = 'Adulto feminino (65 mL/kg)';
        }
      }
      
      // Adjust for obesity (BMI considerations if weight seems high for age)
      if (age >= 18 && weight > 100) {
        const adjustmentFactor = 0.9; // Reduce by 10% for obesity
        bloodVolume *= adjustmentFactor;
        formulaUsed += ' (ajustado para obesidade)';
      }
      
      // Calculate plasma volume if hematocrit is provided
      let plasmaVolume = null;
      let redCellVolume = null;
      if (hematocrit) {
        const hct = hematocrit / 100;
        redCellVolume = bloodVolume * hct;
        plasmaVolume = bloodVolume * (1 - hct);
      }
      
      // Calculate allowable blood loss (30% of blood volume)
      const allowableLoss = bloodVolume * 0.3;
      
      // Calculate transfusion thresholds
      const transfusionThresholds = {
        mild: bloodVolume * 0.15,    // 15% loss
        moderate: bloodVolume * 0.30, // 30% loss
        severe: bloodVolume * 0.40    // 40% loss
      };
      
      // Determine age group and specific considerations
      let ageGroup = '';
      let specificConsiderations = [];
      
      if (age < 1) {
        ageGroup = 'Neonato/Lactente';
        specificConsiderations = [
          'Volume sanguíneo proporcionalmente maior que adultos',
          'Menor tolerância à perda sanguínea',
          'Considerar transfusão com perdas &gt; 10%',
          'Monitorar sinais vitais continuamente',
          'Usar produtos sanguíneos irradiados se < 4 meses'
        ];
      } else if (age < 12) {
        ageGroup = 'Pediátrico';
        specificConsiderations = [
          'Compensação cardiovascular eficiente inicialmente',
          'Descompensação pode ser súbita',
          'Considerar transfusão com perdas &gt; 15%',
          'Calcular doses de hemoderivados por peso',
          'Monitorar temperatura corporal'
        ];
      } else if (age < 18) {
        ageGroup = 'Adolescente';
        specificConsiderations = [
          'Capacidade de compensação similar ao adulto',
          'Considerar diferenças hormonais',
          'Atenção para transtornos alimentares',
          'Considerar consentimento para transfusão'
        ];
      } else {
        ageGroup = 'Adulto';
        specificConsiderations = [
          'Tolerância padrão à perda sanguínea',
          'Considerar comorbidades cardiovasculares',
          'Avaliar uso de anticoagulantes',
          'Considerar reserva funcional'
        ];
      }
      
      // Clinical recommendations based on scenario
      let clinicalRecommendations = [];
      
      if (inputs.clinicalScenario === 'surgery') {
        clinicalRecommendations = [
          'Tipagem sanguínea e prova cruzada pré-operatória',
          'Considerar autotransfusão se cirurgia eletiva',
          'Monitorar perdas intraoperatórias',
          'Ter hemoderivados disponíveis se perda esperada &gt; 15%',
          'Considerar agentes hemostáticos'
        ];
      } else if (inputs.clinicalScenario === 'trauma') {
        clinicalRecommendations = [
          'Protocolo de transfusão maciça se indicado',
          'Tipagem O negativo disponível imediatamente',
          'Controle de danos cirúrgico prioritário',
          'Monitorar coagulopatia traumática',
          'Considerar ácido tranexâmico'
        ];
      } else {
        clinicalRecommendations = [
          'Avaliar causa da perda sanguínea',
          'Monitorar sinais vitais e perfusão',
          'Considerar reposição volêmica inicial',
          'Avaliar necessidade de transfusão',
          'Investigar distúrbios de coagulação'
        ];
      }
      
      // Monitoring parameters
      const monitoringParameters = [
        'Pressão arterial e frequência cardíaca',
        'Perfusão periférica e enchimento capilar',
        'Débito urinário',
        'Nível de consciência',
        'Hemoglobina e hematócrito seriados',
        'Lactato sérico',
        'Coagulograma se perda significativa'
      ];
      
      // Transfusion guidelines
      const transfusionGuidelines = [
        `Hemoglobina < 7 g/dL: Considerar transfusão (geral)`,
        `Hemoglobina < 8 g/dL: Considerar se cardiopatia`,
        `Hemoglobina < 10 g/dL: Considerar se sangramento ativo`,
        age < 18 ? 'Pediátrico: Avaliar individualmente' : 'Adulto: Seguir protocolos institucionais',
        'Sempre considerar alternativas à transfusão'
      ];
      
      const calculatedResults = {
        bloodVolume: Math.round(bloodVolume),
        plasmaVolume: plasmaVolume ? Math.round(plasmaVolume) : null,
        redCellVolume: redCellVolume ? Math.round(redCellVolume) : null,
        allowableLoss: Math.round(allowableLoss),
        transfusionThresholds: {
          mild: Math.round(transfusionThresholds.mild),
          moderate: Math.round(transfusionThresholds.moderate),
          severe: Math.round(transfusionThresholds.severe)
        },
        formulaUsed,
        ageGroup,
        specificConsiderations,
        clinicalRecommendations,
        monitoringParameters,
        transfusionGuidelines,
        volumePerKg: Math.round(bloodVolume / weight)
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
      age: '',
      sex: 'male',
      clinicalScenario: 'general',
      hematocrit: ''
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `Volume Sanguíneo Estimado - Resultados:\n`;
    resultText += `Peso: ${inputs.weight} kg\n`;
    resultText += `Idade: ${inputs.age} anos\n`;
    resultText += `Sexo: ${inputs.sex === 'male' ? 'Masculino' : 'Feminino'}\n`;
    if (inputs.hematocrit) {
      resultText += `Hematócrito: ${inputs.hematocrit}%\n`;
    }
    resultText += `\nVolume sanguíneo total: ${results.bloodVolume} mL\n`;
    resultText += `Volume por kg: ${results.volumePerKg} mL/kg\n`;
    
    if (results.plasmaVolume && results.redCellVolume) {
      resultText += `Volume plasmático: ${results.plasmaVolume} mL\n`;
      resultText += `Volume de hemácias: ${results.redCellVolume} mL\n`;
    }
    
    resultText += `\nPerda sanguínea tolerável: ${results.allowableLoss} mL\n`;
    resultText += `\nLimiares de transfusão:\n`;
    resultText += `• Leve (15%): ${results.transfusionThresholds.mild} mL\n`;
    resultText += `• Moderada (30%): ${results.transfusionThresholds.moderate} mL\n`;
    resultText += `• Grave (40%): ${results.transfusionThresholds.severe} mL\n`;
    
    resultText += `\nFórmula utilizada: ${results.formulaUsed}\n`;
    resultText += `Grupo etário: ${results.ageGroup}\n\n`;
    
    resultText += `Recomendações clínicas:\n${results.clinicalRecommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    resultText += `Calculado em: ${new Date().toLocaleString('pt-BR')}`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results, inputs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Calculadora de Volume Sanguíneo Estimado
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
                <Label htmlFor="age">Idade (anos)</Label>
                <Input
                  id="age"
                  type="number"
                  value={inputs.age}
                  onChange={(e) => setInputs(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="Ex: 30"
                  min="0"
                  max="120"
                  step="0.1"
                  className={errors.age ? 'border-red-500' : ''}
                />
                {errors.age && (
                  <p className="text-sm text-red-500">{errors.age}</p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label>Sexo:</Label>
                <RadioGroup
                  value={inputs.sex}
                  onValueChange={(value) => setInputs(prev => ({ ...prev, sex: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Masculino</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Feminino</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-3">
                <Label>Cenário Clínico:</Label>
                <RadioGroup
                  value={inputs.clinicalScenario}
                  onValueChange={(value) => setInputs(prev => ({ ...prev, clinicalScenario: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="general" id="general" />
                    <Label htmlFor="general">Geral</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="surgery" id="surgery" />
                    <Label htmlFor="surgery">Cirúrgico</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="trauma" id="trauma" />
                    <Label htmlFor="trauma">Trauma</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hematocrit">Hematócrito (%) - Opcional</Label>
                <Input
                  id="hematocrit"
                  type="number"
                  value={inputs.hematocrit}
                  onChange={(e) => setInputs(prev => ({ ...prev, hematocrit: e.target.value }))}
                  placeholder="Ex: 40"
                  min="10"
                  max="70"
                  step="0.1"
                  className={errors.hematocrit ? 'border-red-500' : ''}
                />
                {errors.hematocrit && (
                  <p className="text-sm text-red-500">{errors.hematocrit}</p>
                )}
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Volumes por Idade:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Neonatos:</strong> 85 mL/kg</li>
                  <li>• <strong>Lactentes:</strong> 80 mL/kg</li>
                  <li>• <strong>Crianças:</strong> 75 mL/kg</li>
                  <li>• <strong>Adultos:</strong> 75 mL/kg (♂) | 65 mL/kg (♀)</li>
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
                        <span className="font-medium text-blue-800">Volume Sanguíneo Total:</span>
                        <span className="font-bold text-blue-900">{results.bloodVolume} mL</span>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-green-800">Volume por kg:</span>
                        <span className="font-bold text-green-900">{results.volumePerKg} mL/kg</span>
                      </div>
                    </div>
                    
                    {results.plasmaVolume && results.redCellVolume && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                          <div className="text-center">
                            <div className="font-medium text-yellow-800">Volume Plasmático</div>
                            <div className="font-bold text-yellow-900">{results.plasmaVolume} mL</div>
                          </div>
                        </div>
                        
                        <div className="p-3 rounded-lg border bg-red-50 border-red-200">
                          <div className="text-center">
                            <div className="font-medium text-red-800">Volume de Hemácias</div>
                            <div className="font-bold text-red-900">{results.redCellVolume} mL</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-3 rounded-lg border bg-orange-50 border-orange-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-orange-800">Perda Tolerável (30%):</span>
                        <span className="font-bold text-orange-900">{results.allowableLoss} mL</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Method and Age Group */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Fórmula:</span>
                      <Badge variant="outline">{results.formulaUsed}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Grupo Etário:</span>
                      <Badge variant="outline">{results.ageGroup}</Badge>
                    </div>
                  </div>
                  
                  {/* Transfusion Thresholds */}
                  <div className="p-3 rounded-lg border bg-purple-50 border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">Limiares de Perda Sanguínea:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Leve (15%):</span>
                        <span className="font-bold text-purple-900">{results.transfusionThresholds.mild} mL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Moderada (30%):</span>
                        <span className="font-bold text-purple-900">{results.transfusionThresholds.moderate} mL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Grave (40%):</span>
                        <span className="font-bold text-purple-900">{results.transfusionThresholds.severe} mL</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Specific Considerations */}
                  <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">Considerações Específicas:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {results.specificConsiderations.map((consideration, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{consideration}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Clinical Recommendations */}
                  <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Recomendações Clínicas:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      {results.clinicalRecommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Monitoring Parameters */}
                  <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Parâmetros de Monitoramento:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {results.monitoringParameters.map((param, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{param}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Transfusion Guidelines */}
                  <div className="p-3 rounded-lg border bg-red-50 border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Diretrizes de Transfusão:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {results.transfusionGuidelines.map((guideline, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{guideline}</span>
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
            <CardTitle>Fórmulas e Referências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Fórmulas por Idade:</h4>
                <div className="space-y-2">
                  <code className="bg-muted p-2 rounded block text-sm">
                    Neonatos (0-3m): 85 mL/kg
                  </code>
                  <code className="bg-muted p-2 rounded block text-sm">
                    Lactentes (3-12m): 80 mL/kg
                  </code>
                  <code className="bg-muted p-2 rounded block text-sm">
                    Crianças (1-12a): 75 mL/kg
                  </code>
                  <code className="bg-muted p-2 rounded block text-sm">
                    Adultos: 75 mL/kg (♂) | 65 mL/kg (♀)
                  </code>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interpretação:</h4>
                <p className="text-sm text-muted-foreground">
                  O volume sanguíneo estimado é fundamental para avaliar perdas sanguíneas e necessidade de transfusão. 
                  Neonatos e lactentes têm proporcionalmente maior volume sanguíneo por kg, mas menor tolerância 
                  à perda absoluta. A perda de 30% do volume sanguíneo é considerada o limite para compensação 
                  fisiológica em adultos saudáveis.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Fatores de Correção:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Obesidade:</strong> Redução de ~10% do volume calculado</li>
                  <li>• <strong>Desidratação:</strong> Pode reduzir volume plasmático</li>
                  <li>• <strong>Gravidez:</strong> Aumento de ~40% no volume plasmático</li>
                  <li>• <strong>Atletas:</strong> Podem ter volume aumentado</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Advanced Trauma Life Support (ATLS) 2018</li>
                  <li>• Sociedade Brasileira de Anestesiologia - Hemotransfusão</li>
                  <li>• European Guidelines on Perioperative Blood Management</li>
                  <li>• Pediatric Advanced Life Support (PALS) 2020</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default EstimatedBloodVolume;
