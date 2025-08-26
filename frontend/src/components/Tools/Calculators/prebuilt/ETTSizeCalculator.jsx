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
import { Copy, Calculator, Stethoscope, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ETTSizeCalculator - Calculadora de Tamanho de Tubo Endotraqueal
 * 
 * This component calculates appropriate endotracheal tube size for pediatric
 * and adult patients using established formulas and clinical guidelines.
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
 * <ETTSizeCalculator 
 *   open={showHardcodedCalculator === 'ett-size-calculator'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Calculation example
 * // Input: age=4 years, cuffed=false
 * // Output: ettSize=5.0mm, depth=15cm, alternatives=[4.5, 5.5]
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function ETTSizeCalculator({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    calculationMethod: 'age', // 'age' | 'weight' | 'height'
    age: '',
    weight: '',
    height: '',
    cuffed: 'uncuffed', // 'cuffed' | 'uncuffed'
    isAdult: false
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  /**
   * Validates input parameters for ETT size calculation
   * 
   * @returns {boolean} True if all inputs are valid
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (inputs.calculationMethod === 'age') {
      if (!inputs.age || parseFloat(inputs.age) < 0 || parseFloat(inputs.age) > 18) {
        newErrors.age = 'Idade deve estar entre 0 e 18 anos';
      }
    } else if (inputs.calculationMethod === 'weight') {
      if (!inputs.weight || parseFloat(inputs.weight) <= 0 || parseFloat(inputs.weight) > 100) {
        newErrors.weight = 'Peso deve estar entre 0,1 e 100 kg';
      }
    } else if (inputs.calculationMethod === 'height') {
      if (!inputs.height || parseFloat(inputs.height) < 30 || parseFloat(inputs.height) > 200) {
        newErrors.height = 'Altura deve estar entre 30 e 200 cm';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Calculates ETT size using various pediatric formulas
   * 
   * @returns {Object} Calculated results with clinical recommendations
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      let ettSize = 0;
      let depth = 0;
      let calculationUsed = '';
      
      // Adult calculation (>8 years or >25kg)
      if (inputs.isAdult || (inputs.age && parseFloat(inputs.age) > 8) || (inputs.weight && parseFloat(inputs.weight) > 25)) {
        ettSize = inputs.cuffed === 'cuffed' ? 7.5 : 8.0; // Standard adult sizes
        depth = 21; // Standard adult depth
        calculationUsed = 'Padrão adulto';
      } else {
        // Pediatric calculations
        if (inputs.calculationMethod === 'age') {
          const age = parseFloat(inputs.age);
          
          if (age < 1) {
            // Neonatal/infant formula
            ettSize = inputs.cuffed === 'cuffed' ? 3.0 : 3.5;
            depth = 9 + age * 0.5;
            calculationUsed = 'Fórmula neonatal';
          } else {
            // Standard pediatric formula: (age/4) + 4
            ettSize = inputs.cuffed === 'cuffed' 
              ? (age / 4) + 3.5 
              : (age / 4) + 4;
            depth = (age / 2) + 12;
            calculationUsed = 'Fórmula pediátrica por idade';
          }
        } else if (inputs.calculationMethod === 'weight') {
          const weight = parseFloat(inputs.weight);
          
          if (weight < 3) {
            ettSize = 3.0;
            depth = 9;
            calculationUsed = 'Peso neonatal';
          } else if (weight < 10) {
            ettSize = inputs.cuffed === 'cuffed' 
              ? 3.5 + (weight - 3) * 0.2
              : 4.0 + (weight - 3) * 0.2;
            depth = 9 + weight * 0.5;
            calculationUsed = 'Fórmula pediátrica por peso';
          } else {
            ettSize = inputs.cuffed === 'cuffed' 
              ? 4.5 + (weight - 10) * 0.1
              : 5.0 + (weight - 10) * 0.1;
            depth = 12 + weight * 0.3;
            calculationUsed = 'Fórmula pediátrica por peso';
          }
        } else if (inputs.calculationMethod === 'height') {
          const height = parseFloat(inputs.height);
          
          // Height-based formula (less common but useful)
          ettSize = inputs.cuffed === 'cuffed'
            ? (height / 20) + 2.5
            : (height / 20) + 3;
          depth = height / 10 + 5;
          calculationUsed = 'Fórmula por altura';
        }
      }
      
      // Round to nearest 0.5
      ettSize = Math.round(ettSize * 2) / 2;
      depth = Math.round(depth);
      
      // Calculate alternative sizes
      const alternatives = [
        Math.max(2.5, ettSize - 0.5),
        ettSize + 0.5
      ].filter(size => size >= 2.5 && size <= 10);
      
      // Determine age group and specific recommendations
      let ageGroup = '';
      let specificRecommendations = [];
      
      if (inputs.age) {
        const age = parseFloat(inputs.age);
        if (age < 0.25) {
          ageGroup = 'Neonato (< 3 meses)';
          specificRecommendations = [
            'Preferir tubos sem cuff em neonatos',
            'Considerar tubo 2.5-3.0mm para prematuros',
            'Profundidade: ponta do tubo 1-2cm acima da carina',
            'Confirmar posição com RX tórax'
          ];
        } else if (age < 2) {
          ageGroup = 'Lactente (3m - 2a)';
          specificRecommendations = [
            'Tubos sem cuff são preferíveis até 8 anos',
            'Monitorar vazamento ao redor do tubo',
            'Pressão de cuff < 20 cmH2O se usar tubo com cuff',
            'Ter tamanhos alternativos disponíveis'
          ];
        } else if (age < 8) {
          ageGroup = 'Pré-escolar (2-8a)';
          specificRecommendations = [
            'Transição para tubos com cuff após 8 anos',
            'Fórmula clássica: (idade/4) + 4',
            'Profundidade: (idade/2) + 12 cm',
            'Sempre ter 0.5mm menor e maior disponível'
          ];
        } else {
          ageGroup = 'Escolar/Adolescente (>8a)';
          specificRecommendations = [
            'Tubos com cuff são apropriados',
            'Pressão de cuff 15-20 cmH2O',
            'Considerar tamanho adulto se >12 anos',
            'Profundidade padrão: 21cm (adulto)'
          ];
        }
      }
      
      // Clinical considerations
      const clinicalConsiderations = [
        'Sempre ter tamanhos 0.5mm menor e maior disponíveis',
        'Confirmar posição com ausculta bilateral',
        'Verificar vazamento adequado (10-25 cmH2O)',
        'Considerar videolaringoscopia em casos difíceis',
        'Monitorar pressão de cuff se tubo com cuff',
        'Confirmar com capnografia e RX tórax'
      ];
      
      // Emergency considerations
      const emergencyConsiderations = [
        'Em emergência, começar com tamanho calculado',
        'Se resistência, tentar 0.5mm menor',
        'Se vazamento excessivo, tentar 0.5mm maior',
        'Não forçar passagem - risco de trauma',
        'Considerar dispositivos supraglóticos se falha',
        'Ter plano de via aérea difícil sempre pronto'
      ];
      
      // Equipment checklist
      const equipmentChecklist = [
        `Tubo ${ettSize}mm (principal)`,
        `Tubos ${alternatives[0]}mm e ${alternatives[1]}mm (alternativos)`,
        'Laringoscópio com lâminas apropriadas',
        'Aspirador funcionante',
        'Capnógrafo',
        'Estetoscópio',
        inputs.cuffed === 'cuffed' ? 'Seringa para cuff' : 'Não aplicável (sem cuff)',
        'Medicações para intubação'
      ];
      
      const calculatedResults = {
        ettSize: ettSize.toFixed(1),
        depth: depth.toString(),
        alternatives,
        calculationUsed,
        ageGroup,
        cuffType: inputs.cuffed === 'cuffed' ? 'Com cuff' : 'Sem cuff',
        specificRecommendations,
        clinicalConsiderations,
        emergencyConsiderations,
        equipmentChecklist
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
      calculationMethod: 'age',
      age: '',
      weight: '',
      height: '',
      cuffed: 'uncuffed',
      isAdult: false
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `Calculadora de Tubo Endotraqueal - Resultados:\n`;
    
    if (inputs.calculationMethod === 'age') {
      resultText += `Idade: ${inputs.age} anos\n`;
    } else if (inputs.calculationMethod === 'weight') {
      resultText += `Peso: ${inputs.weight} kg\n`;
    } else {
      resultText += `Altura: ${inputs.height} cm\n`;
    }
    
    resultText += `Tipo: ${results.cuffType}\n\n`;
    resultText += `Tamanho recomendado: ${results.ettSize} mm\n`;
    resultText += `Profundidade: ${results.depth} cm\n`;
    resultText += `Tamanhos alternativos: ${results.alternatives.join(', ')} mm\n`;
    resultText += `Método: ${results.calculationUsed}\n\n`;
    
    if (results.ageGroup) {
      resultText += `Grupo etário: ${results.ageGroup}\n\n`;
    }
    
    resultText += `Recomendações específicas:\n${results.specificRecommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    resultText += `Considerações clínicas:\n${results.clinicalConsiderations.map(c => `• ${c}`).join('\n')}\n\n`;
    resultText += `Lista de equipamentos:\n${results.equipmentChecklist.map(e => `• ${e}`).join('\n')}\n\n`;
    resultText += `Calculado em: ${new Date().toLocaleString('pt-BR')}`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results, inputs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Calculadora de Tamanho de Tubo Endotraqueal
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Método de Cálculo:</Label>
                <RadioGroup
                  value={inputs.calculationMethod}
                  onValueChange={(value) => setInputs(prev => ({ ...prev, calculationMethod: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="age" id="age" />
                    <Label htmlFor="age">Por idade (mais comum)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weight" id="weight" />
                    <Label htmlFor="weight">Por peso</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="height" id="height" />
                    <Label htmlFor="height">Por altura</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {inputs.calculationMethod === 'age' && (
                <div className="space-y-2">
                  <Label htmlFor="ageInput">Idade (anos)</Label>
                  <Input
                    id="ageInput"
                    type="number"
                    value={inputs.age}
                    onChange={(e) => setInputs(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Ex: 4"
                    min="0"
                    max="18"
                    step="0.1"
                    className={errors.age ? 'border-red-500' : ''}
                  />
                  {errors.age && (
                    <p className="text-sm text-red-500">{errors.age}</p>
                  )}
                </div>
              )}
              
              {inputs.calculationMethod === 'weight' && (
                <div className="space-y-2">
                  <Label htmlFor="weightInput">Peso (kg)</Label>
                  <Input
                    id="weightInput"
                    type="number"
                    value={inputs.weight}
                    onChange={(e) => setInputs(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="Ex: 15"
                    min="0.1"
                    max="100"
                    step="0.1"
                    className={errors.weight ? 'border-red-500' : ''}
                  />
                  {errors.weight && (
                    <p className="text-sm text-red-500">{errors.weight}</p>
                  )}
                </div>
              )}
              
              {inputs.calculationMethod === 'height' && (
                <div className="space-y-2">
                  <Label htmlFor="heightInput">Altura (cm)</Label>
                  <Input
                    id="heightInput"
                    type="number"
                    value={inputs.height}
                    onChange={(e) => setInputs(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="Ex: 100"
                    min="30"
                    max="200"
                    step="1"
                    className={errors.height ? 'border-red-500' : ''}
                  />
                  {errors.height && (
                    <p className="text-sm text-red-500">{errors.height}</p>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                <Label>Tipo de Tubo:</Label>
                <RadioGroup
                  value={inputs.cuffed}
                  onValueChange={(value) => setInputs(prev => ({ ...prev, cuffed: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="uncuffed" id="uncuffed" />
                    <Label htmlFor="uncuffed">Sem cuff (padrão pediátrico <8a)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cuffed" id="cuffed" />
                    <Label htmlFor="cuffed">Com cuff (>8a ou indicação específica)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Fórmulas Pediátricas:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Sem cuff:</strong> (idade ÷ 4) + 4 mm</li>
                  <li>• <strong>Com cuff:</strong> (idade ÷ 4) + 3,5 mm</li>
                  <li>• <strong>Profundidade:</strong> (idade ÷ 2) + 12 cm</li>
                  <li>• <strong>Neonatos:</strong> 2,5-3,5 mm</li>
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
                    <div className="calculator-result calculator-result-info">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Tamanho Recomendado:</span>
                        <span className="font-bold">{results.ettSize} mm</span>
                      </div>
                    </div>
                    
                    <div className="calculator-result calculator-result-success">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Profundidade:</span>
                        <span className="font-bold">{results.depth} cm</span>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Tamanhos Alternativos:</span>
                        <span className="font-bold">{results.alternatives.join(', ')} mm</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Method and Type */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Método:</span>
                      <Badge variant="outline">{results.calculationUsed}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Tipo:</span>
                      <Badge variant="outline">{results.cuffType}</Badge>
                    </div>
                    
                    {results.ageGroup && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Grupo Etário:</span>
                        <Badge variant="outline">{results.ageGroup}</Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Specific Recommendations */}
                  {results.specificRecommendations.length > 0 && (
                    <div className="calculator-result calculator-result-warning">
                      <h4 className="font-semibold mb-2">Recomendações Específicas:</h4>
                      <ul className="text-sm space-y-1">
                        {results.specificRecommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Clinical Considerations */}
                  <div className="calculator-result calculator-result-success">
                    <h4 className="font-semibold mb-2">Considerações Clínicas:</h4>
                    <ul className="text-sm space-y-1">
                      {results.clinicalConsiderations.map((consideration, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{consideration}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Emergency Considerations */}
                  <div className="calculator-result calculator-result-danger">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Considerações de Emergência:
                    </h4>
                    <ul className="text-sm space-y-1">
                      {results.emergencyConsiderations.map((consideration, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{consideration}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Equipment Checklist */}
                  <div className="calculator-result calculator-result-info">
                    <h4 className="font-semibold mb-2">Lista de Equipamentos:</h4>
                    <ul className="text-sm space-y-1">
                      {results.equipmentChecklist.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{item}</span>
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
                <h4 className="font-semibold mb-2">Fórmulas Pediátricas:</h4>
                <div className="space-y-2">
                  <code className="bg-muted p-2 rounded block text-sm">
                    Tubo sem cuff: (idade em anos ÷ 4) + 4 mm
                  </code>
                  <code className="bg-muted p-2 rounded block text-sm">
                    Tubo com cuff: (idade em anos ÷ 4) + 3,5 mm
                  </code>
                  <code className="bg-muted p-2 rounded block text-sm">
                    Profundidade: (idade em anos ÷ 2) + 12 cm
                  </code>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interpretação:</h4>
                <p className="text-sm text-muted-foreground">
                  As fórmulas pediátricas são baseadas no crescimento proporcional das vias aéreas com a idade. 
                  Tubos sem cuff são tradicionalmente preferidos em crianças <8 anos devido ao formato cônico
              da laringe pediátrica. Tubos com cuff podem ser usados com pressões baixas (<20 cmH2O) 
                  quando indicado clinicamente.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Considerações Especiais:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Neonatos:</strong> Tubos 2,5-3,5mm baseados no peso</li>
                  <li>• <strong>Prematuros:</strong> Considerar tubos 2,0-2,5mm</li>
                  <li>• <strong>Síndrome de Down:</strong> Usar tamanho menor</li>
                  <li>• <strong>Laringomalácia:</strong> Pode necessitar tamanho menor</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pediatric Advanced Life Support (PALS) 2020</li>
                  <li>• European Resuscitation Council Guidelines 2021</li>
                  <li>• Sociedade Brasileira de Pediatria - Reanimação 2022</li>
                  <li>• Difficult Airway Society Pediatric Guidelines</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default ETTSizeCalculator;
