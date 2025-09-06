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
import { Copy, Calculator, Activity, Info } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Lean Body Weight Calculator - Massa Corporal Magra (Fórmula de Boer)
 * 
 * Integrates with:
 * - Calculators.jsx via hardcodedCalculators array
 * - Dialog component for modal display
 * - Cards for structured layout
 * 
 * @param {boolean} open - Controls modal visibility
 * @param {function} onOpenChange - Callback for modal state changes
 */
function LeanBodyWeight({ open, onOpenChange }) {
  // State management
  const [inputs, setInputs] = useState({
    weight: '',
    height: '',
    sex: ''
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Validation function
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.weight || parseFloat(inputs.weight) <= 0) {
      newErrors.weight = 'Peso deve ser maior que 0 kg';
    }
    
    if (parseFloat(inputs.weight) > 500) {
      newErrors.weight = 'Peso deve ser um valor realista';
    }
    
    if (!inputs.height || parseFloat(inputs.height) <= 0) {
      newErrors.height = 'Altura deve ser maior que 0 cm';
    }
    
    if (parseFloat(inputs.height) > 300) {
      newErrors.height = 'Altura deve ser em centímetros (ex: 175)';
    }
    
    if (!inputs.sex) {
      newErrors.sex = 'Selecione o sexo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  // Calculation function
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      const weight = parseFloat(inputs.weight);
      const height = parseFloat(inputs.height);
      const sex = inputs.sex;
      
      // Convert height to centimeters if needed
      const heightCm = height > 3 ? height : height * 100;
      
      let leanBodyWeight;
      
      // Boer Formula (1984) - most accurate for lean body mass
      if (sex === 'male') {
        // Men: (0.407 × weight) + (0.267 × height) - 19.2
        leanBodyWeight = (0.407 * weight) + (0.267 * heightCm) - 19.2;
      } else {
        // Women: (0.252 × weight) + (0.473 × height) - 48.3
        leanBodyWeight = (0.252 * weight) + (0.473 * heightCm) - 48.3;
      }
      
      // Calculate body fat percentage
      const bodyFatWeight = weight - leanBodyWeight;
      const bodyFatPercentage = (bodyFatWeight / weight) * 100;
      
      // Interpret body fat percentage
      let interpretation = '';
      let status = 'normal';
      
      if (sex === 'male') {
        if (bodyFatPercentage < 6) {
          interpretation = 'Percentual de gordura muito baixo. Pode indicar desnutrição ou overtraining.';
          status = 'danger';
        } else if (bodyFatPercentage <= 13) {
          interpretation = 'Percentual de gordura baixo - típico de atletas.';
          status = 'info';
        } else if (bodyFatPercentage <= 17) {
          interpretation = 'Percentual de gordura normal para homens.';
          status = 'normal';
        } else if (bodyFatPercentage <= 25) {
          interpretation = 'Percentual de gordura ligeiramente elevado.';
          status = 'warning';
        } else {
          interpretation = 'Percentual de gordura elevado. Considere orientação nutricional.';
          status = 'danger';
        }
      } else {
        if (bodyFatPercentage < 16) {
          interpretation = 'Percentual de gordura muito baixo. Pode indicar desnutrição ou overtraining.';
          status = 'danger';
        } else if (bodyFatPercentage <= 20) {
          interpretation = 'Percentual de gordura baixo - típico de atletas.';
          status = 'info';
        } else if (bodyFatPercentage <= 24) {
          interpretation = 'Percentual de gordura normal para mulheres.';
          status = 'normal';
        } else if (bodyFatPercentage <= 31) {
          interpretation = 'Percentual de gordura ligeiramente elevado.';
          status = 'warning';
        } else {
          interpretation = 'Percentual de gordura elevado. Considere orientação nutricional.';
          status = 'danger';
        }
      }
      
      const calculatedResults = {
        leanBodyWeight: leanBodyWeight.toFixed(1),
        bodyFatWeight: bodyFatWeight.toFixed(1),
        bodyFatPercentage: bodyFatPercentage.toFixed(1),
        weight: weight.toFixed(1),
        heightCm: heightCm.toFixed(0),
        sex,
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
      weight: '',
      height: '',
      sex: ''
    });
    setResults(null);
    setErrors({});
  }, []);

  // Copy function
  const copyResults = useCallback(() => {
    if (!results) return;
    
    const resultText = `
Massa Corporal Magra (Boer):
Massa magra: ${results.leanBodyWeight} kg
Massa gorda: ${results.bodyFatWeight} kg (${results.bodyFatPercentage}%)
Peso total: ${results.weight} kg
Altura: ${results.heightCm} cm
Sexo: ${results.sex === 'male' ? 'Masculino' : 'Feminino'}
Interpretação: ${results.interpretation}

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

  // Get body fat status badge
  const getBodyFatBadge = (percentage, sex) => {
    const value = parseFloat(percentage);
    
    if (sex === 'male') {
      if (value < 6) return <Badge className="text-red-200 bg-red-900/30 border border-red-700/50">Muito Baixo</Badge>;
      if (value <= 13) return <Badge className="text-blue-200 bg-blue-900/30 border border-blue-700/50">Atlético</Badge>;
      if (value <= 17) return <Badge className="text-green-200 bg-green-900/30 border border-green-700/50">Normal</Badge>;
      if (value <= 25) return <Badge className="text-yellow-200 bg-yellow-900/30 border border-yellow-700/50">Elevado</Badge>;
      return <Badge className="text-red-200 bg-red-900/30 border border-red-700/50">Muito Elevado</Badge>;
    } else {
      if (value < 16) return <Badge className="text-red-200 bg-red-900/30 border border-red-700/50">Muito Baixo</Badge>;
      if (value <= 20) return <Badge className="text-blue-200 bg-blue-900/30 border border-blue-700/50">Atlético</Badge>;
      if (value <= 24) return <Badge className="text-green-200 bg-green-900/30 border border-green-700/50">Normal</Badge>;
      if (value <= 31) return <Badge className="text-yellow-200 bg-yellow-900/30 border border-yellow-700/50">Elevado</Badge>;
      return <Badge className="text-red-200 bg-red-900/30 border border-red-700/50">Muito Elevado</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Massa Corporal Magra (Boer)
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
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={inputs.weight}
                    onChange={(e) => setInputs(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="Ex: 70"
                    step="0.1"
                    min="0"
                    className={errors.weight ? 'border-red-500' : ''}
                  />
                  {errors.weight && (
                    <p className="text-sm text-red-500">{errors.weight}</p>
                  )}
                </div>
                
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
                      {results.leanBodyWeight}
                      <span className="text-lg font-normal text-gray-300 ml-2">kg</span>
                    </div>
                    <div className="text-sm text-gray-300">
                      Massa Corporal Magra
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-lg font-semibold text-gray-200">
                        {results.bodyFatWeight} kg
                      </div>
                      <div className="text-xs text-gray-300">Massa Gorda</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-semibold text-gray-200">
                        {results.bodyFatPercentage}%
                      </div>
                      <div className="text-xs text-gray-300">% Gordura</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    {getBodyFatBadge(results.bodyFatPercentage, results.sex)}
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
                <h4 className="font-semibold mb-2">Fórmula de Boer (1984):</h4>
                <div className="bg-muted p-3 rounded space-y-1">
                  <code className="block">♂ Homens: (0,407 × peso) + (0,267 × altura) - 19,2</code>
                  <code className="block">♀ Mulheres: (0,252 × peso) + (0,473 × altura) - 48,3</code>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Faixas de Referência (% Gordura):
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Homens:</h5>
                    <div className="text-sm space-y-1">
                      <div>• &lt; 6%: Muito baixo</div>
                      <div>• 6-13%: Atlético</div>
                      <div>• 14-17%: Normal</div>
                      <div>• 18-25%: Elevado</div>
                      <div>• &gt; 25%: Muito elevado</div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Mulheres:</h5>
                    <div className="text-sm space-y-1">
                      <div>• &lt; 16%: Muito baixo</div>
                      <div>• 16-20%: Atlético</div>
                      <div>• 21-24%: Normal</div>
                      <div>• 25-31%: Elevado</div>
                      <div>• &gt; 31%: Muito elevado</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Aplicações Clínicas:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Dosagem de medicamentos lipossolúveis</li>
                  <li>• Avaliação da composição corporal</li>
                  <li>• Planejamento nutricional esportivo</li>
                  <li>• Monitoramento de perda/ganho de peso</li>
                  <li>• Cálculos de gasto energético</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Vantagens da Fórmula de Boer:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Considera peso e altura</li>
                  <li>• Diferencia entre sexos</li>
                  <li>• Validada por bioimpedância</li>
                  <li>• Amplamente aceita clinicamente</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Limitações:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Não considera idade</li>
                  <li>• Pode subestimar em obesos</li>
                  <li>• Baseada em população caucasiana</li>
                  <li>• Não diferencia tipos de tecido magro</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Boer P. Estimated lean body mass as an index for normalization. Am J Kidney Dis. 1984</li>
                  <li>• Janmahasatian S, et al. Quantification of lean bodyweight. Clin Pharmacokinet. 2005</li>
                  <li>• American College of Sports Medicine Guidelines</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default LeanBodyWeight;
