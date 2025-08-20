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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Copy, Calculator, Target, Info } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Ideal Body Weight Calculator - Peso Corporal Ideal (Fórmula de Robinson)
 * 
 * Integrates with:
 * - Calculators.jsx via hardcodedCalculators array
 * - Dialog component for modal display
 * - Cards for structured layout
 * 
 * @param {boolean} open - Controls modal visibility
 * @param {function} onOpenChange - Callback for modal state changes
 */
function IdealBodyWeight({ open, onOpenChange }) {
  // State management
  const [inputs, setInputs] = useState({
    height: '',
    sex: '',
    currentWeight: ''
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Validation function
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.height || parseFloat(inputs.height) <= 0) {
      newErrors.height = 'Altura deve ser maior que 0 cm';
    }
    
    if (parseFloat(inputs.height) > 300) {
      newErrors.height = 'Altura deve ser em centímetros (ex: 175)';
    }
    
    if (!inputs.sex) {
      newErrors.sex = 'Selecione o sexo';
    }
    
    if (inputs.currentWeight && parseFloat(inputs.currentWeight) <= 0) {
      newErrors.currentWeight = 'Peso atual deve ser maior que 0 kg';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  // Calculation function
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      const height = parseFloat(inputs.height);
      const sex = inputs.sex;
      const currentWeight = inputs.currentWeight ? parseFloat(inputs.currentWeight) : null;
      
      // Convert height to centimeters if needed
      const heightCm = height > 3 ? height : height * 100;
      
      let idealWeight;
      
      // Robinson Formula (1983) - most commonly used
      if (sex === 'male') {
        // Men: 52 kg + 1.9 kg per inch over 5 feet
        const inches = heightCm / 2.54;
        const inchesOver5Feet = Math.max(0, inches - 60);
        idealWeight = 52 + (1.9 * inchesOver5Feet);
      } else {
        // Women: 49 kg + 1.7 kg per inch over 5 feet
        const inches = heightCm / 2.54;
        const inchesOver5Feet = Math.max(0, inches - 60);
        idealWeight = 49 + (1.7 * inchesOver5Feet);
      }
      
      // Calculate range (±10%)
      const minWeight = idealWeight * 0.9;
      const maxWeight = idealWeight * 1.1;
      
      let comparison = null;
      let interpretation = `Peso ideal calculado pela fórmula de Robinson. Faixa normal: ±10% (${minWeight.toFixed(1)} - ${maxWeight.toFixed(1)} kg).`;
      let status = 'normal';
      
      if (currentWeight && currentWeight > 0) {
        const percentDiff = ((currentWeight - idealWeight) / idealWeight) * 100;
        comparison = {
          current: currentWeight,
          difference: currentWeight - idealWeight,
          percentDiff: percentDiff,
          status: Math.abs(percentDiff) <= 10 ? 'ideal' : 
                  percentDiff > 10 ? 'above' : 'below'
        };
        
        if (comparison.status === 'ideal') {
          interpretation = 'Peso atual dentro da faixa ideal. Mantenha hábitos saudáveis.';
          status = 'normal';
        } else if (comparison.status === 'above') {
          interpretation = `Peso atual ${percentDiff.toFixed(1)}% acima do ideal. Considere orientação nutricional.`;
          status = 'warning';
        } else {
          interpretation = `Peso atual ${Math.abs(percentDiff).toFixed(1)}% abaixo do ideal. Avalie necessidade de ganho de peso.`;
          status = 'info';
        }
      }
      
      const calculatedResults = {
        idealWeight: idealWeight.toFixed(1),
        minWeight: minWeight.toFixed(1),
        maxWeight: maxWeight.toFixed(1),
        heightCm: heightCm.toFixed(0),
        sex,
        comparison,
        interpretation,
        status
      };
      
      setResults(calculatedResults);
    } catch (error) {
      toast.error('Erro no cálculo: ' + error.message);
    }
  }, [inputs, validateInputs]);

  // Clear function
  const clearForm = useCallback(() => {
    setInputs({
      height: '',
      sex: '',
      currentWeight: ''
    });
    setResults(null);
    setErrors({});
  }, []);

  // Copy function
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `
Peso Corporal Ideal (Robinson):
Peso ideal: ${results.idealWeight} kg
Faixa normal: ${results.minWeight} - ${results.maxWeight} kg
Altura: ${results.heightCm} cm
Sexo: ${results.sex === 'male' ? 'Masculino' : 'Feminino'}
`;
    
    if (results.comparison) {
      resultText += `Peso atual: ${results.comparison.current} kg
Diferença: ${results.comparison.difference > 0 ? '+' : ''}${results.comparison.difference.toFixed(1)} kg (${results.comparison.percentDiff > 0 ? '+' : ''}${results.comparison.percentDiff.toFixed(1)}%)
`;
    }
    
    resultText += `Interpretação: ${results.interpretation}

Calculado em: ${new Date().toLocaleString('pt-BR')}`;
    
    navigator.clipboard.writeText(resultText.trim());
    toast.success('Resultados copiados!');
  }, [results]);

  // Result colors based on status
  const getResultColor = (status) => {
    const colors = {
      normal: 'text-green-200 bg-green-900/20 border-green-700/50',
      warning: 'text-yellow-200 bg-yellow-900/20 border-yellow-700/50',
      danger: 'text-red-200 bg-red-900/20 border-red-700/50',
      info: 'text-blue-200 bg-blue-900/20 border-blue-700/50'
    };
    return colors[status] || colors.normal;
  };

  // Get comparison badge
  const getComparisonBadge = (comparison) => {
    if (!comparison) return null;
    
    const { status, percentDiff } = comparison;
    
    if (status === 'ideal') {
      return <Badge className="text-green-200 bg-green-900/30 border border-green-700/50">Peso Ideal</Badge>;
    } else if (status === 'above') {
      return <Badge className="text-red-200 bg-red-900/30 border border-red-700/50">+{percentDiff.toFixed(1)}% acima</Badge>;
    } else {
      return <Badge className="text-blue-200 bg-blue-900/30 border border-blue-700/50">{Math.abs(percentDiff).toFixed(1)}% abaixo</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Peso Corporal Ideal (Robinson)
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Dados de Entrada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={inputs.height}
                    onChange={(e) => setInputs(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="Ex: 175"
                    step="1"
                    min="0"
                    className={errors.height ? 'border-red-500' : ''}
                  />
                  {errors.height && (
                    <p className="text-sm text-red-500">{errors.height}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sex">Sexo</Label>
                  <Select 
                    value={inputs.sex} 
                    onValueChange={(value) => setInputs(prev => ({ ...prev, sex: value }))}
                  >
                    <SelectTrigger className={errors.sex ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.sex && (
                    <p className="text-sm text-red-500">{errors.sex}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentWeight">Peso Atual (kg) - Opcional</Label>
                <Input
                  id="currentWeight"
                  type="number"
                  value={inputs.currentWeight}
                  onChange={(e) => setInputs(prev => ({ ...prev, currentWeight: e.target.value }))}
                  placeholder="Ex: 70"
                  step="0.1"
                  min="0"
                  className={errors.currentWeight ? 'border-red-500' : ''}
                />
                {errors.currentWeight && (
                  <p className="text-sm text-red-500">{errors.currentWeight}</p>
                )}
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
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-gray-200">
                      {results.idealWeight}
                      <span className="text-lg font-normal text-gray-300 ml-2">kg</span>
                    </div>
                    <div className="text-sm text-gray-300">
                      Faixa ideal: {results.minWeight} - {results.maxWeight} kg
                    </div>
                    
                    {results.comparison && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-300">
                          Peso atual: {results.comparison.current} kg
                        </div>
                        {getComparisonBadge(results.comparison)}
                        <div className="text-xs text-gray-400">
                          Diferença: {results.comparison.difference > 0 ? '+' : ''}{results.comparison.difference.toFixed(1)} kg
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${getResultColor(results.status)}`}>
                    <h4 className="font-semibold mb-2">Interpretação:</h4>
                    <p className="text-sm">{results.interpretation}</p>
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
        
        {/* Formula and References Card */}
        <Card>
          <CardHeader>
            <CardTitle>Fórmula e Referências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Fórmula de Robinson (1983):</h4>
                <div className="bg-muted p-3 rounded space-y-1">
                  <code className="block">♂ Homens: 52 + 1,9 × (altura(pol) - 60)</code>
                  <code className="block">♀ Mulheres: 49 + 1,7 × (altura(pol) - 60)</code>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Características da Fórmula:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <div>• Amplamente utilizada em medicina</div>
                    <div>• Baseada em dados populacionais</div>
                    <div>• Faixa de ±10% considerada normal</div>
                  </div>
                  <div className="space-y-1">
                    <div>• Útil para dosagem de medicamentos</div>
                    <div>• Padrão em UTI e emergência</div>
                    <div>• Considera diferenças entre sexos</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Aplicações Clínicas:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Dosagem de medicamentos por peso</li>
                  <li>• Avaliação nutricional</li>
                  <li>• Planejamento dietético</li>
                  <li>• Cálculos de ventilação mecânica</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Limitações:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Não considera composição corporal</li>
                  <li>• Baseada em população caucasiana</li>
                  <li>• Pode não ser adequada para atletas</li>
                  <li>• Limitada para idades extremas</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Robinson JD, et al. Determination of ideal body weight. Am J Hosp Pharm. 1983</li>
                  <li>• Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974</li>
                  <li>• Sociedade Brasileira de Nutrição Parenteral e Enteral</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default IdealBodyWeight;