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
import { Copy, Calculator, Scale, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Adjusted Body Weight Calculator - Peso Corporal Ajustado
 * 
 * Integrates with:
 * - Calculators.jsx via hardcodedCalculators array
 * - Dialog component for modal display
 * - Cards for structured layout
 * 
 * @param {boolean} open - Controls modal visibility
 * @param {function} onOpenChange - Callback for modal state changes
 */
function AdjustedBodyWeight({ open, onOpenChange }) {
  // State management
  const [inputs, setInputs] = useState({
    actualWeight: '',
    height: '',
    sex: '',
    correctionFactor: '0.4'
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Validation function
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.actualWeight || parseFloat(inputs.actualWeight) <= 0) {
      newErrors.actualWeight = 'Peso atual deve ser maior que 0 kg';
    }
    
    if (parseFloat(inputs.actualWeight) > 500) {
      newErrors.actualWeight = 'Peso deve ser um valor realista';
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
    
    if (!inputs.correctionFactor || parseFloat(inputs.correctionFactor) < 0 || parseFloat(inputs.correctionFactor) > 1) {
      newErrors.correctionFactor = 'Fator de correção deve estar entre 0 e 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  // Calculation function
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      const actualWeight = parseFloat(inputs.actualWeight);
      const height = parseFloat(inputs.height);
      const sex = inputs.sex;
      const correctionFactor = parseFloat(inputs.correctionFactor);
      
      // Convert height to centimeters if needed
      const heightCm = height > 3 ? height : height * 100;
      
      // Calculate Ideal Body Weight using Robinson formula
      let idealWeight;
      if (sex === 'male') {
        const inches = heightCm / 2.54;
        const inchesOver5Feet = Math.max(0, inches - 60);
        idealWeight = 52 + (1.9 * inchesOver5Feet);
      } else {
        const inches = heightCm / 2.54;
        const inchesOver5Feet = Math.max(0, inches - 60);
        idealWeight = 49 + (1.7 * inchesOver5Feet);
      }
      
      // Calculate BMI
      const heightM = heightCm / 100;
      const bmi = actualWeight / (heightM * heightM);
      
      // Determine if adjustment is needed
      const isObese = bmi >= 30;
      const excessWeight = actualWeight - idealWeight;
      
      let adjustedWeight;
      let interpretation = '';
      let status = 'normal';
      let recommendation = '';
      
      if (isObese && excessWeight > 0) {
        // Calculate adjusted weight: IBW + CF × (actual weight - IBW)
        adjustedWeight = idealWeight + (correctionFactor * excessWeight);
        
        interpretation = `Paciente obeso (IMC ${bmi.toFixed(1)}). Peso ajustado calculado para dosagem de medicamentos.`;
        status = 'warning';
        recommendation = 'Use o peso ajustado para dosagem de medicamentos hidrofílicos e alguns lipofílicos.';
      } else if (actualWeight < idealWeight) {
        // For underweight patients, use actual weight
        adjustedWeight = actualWeight;
        interpretation = `Paciente abaixo do peso ideal. Use o peso atual para dosagens.`;
        status = 'info';
        recommendation = 'Para pacientes abaixo do peso, geralmente usa-se o peso atual.';
      } else {
        // For normal weight patients, use actual weight
        adjustedWeight = actualWeight;
        interpretation = `Peso normal (IMC ${bmi.toFixed(1)}). Ajuste não necessário.`;
        status = 'normal';
        recommendation = 'Para pacientes com peso normal, use o peso atual para dosagens.';
      }
      
      // Calculate percentage difference
      const percentDifference = ((adjustedWeight - actualWeight) / actualWeight) * 100;
      
      const calculatedResults = {
        adjustedWeight: adjustedWeight.toFixed(1),
        actualWeight: actualWeight.toFixed(1),
        idealWeight: idealWeight.toFixed(1),
        bmi: bmi.toFixed(1),
        excessWeight: Math.max(0, excessWeight).toFixed(1),
        percentDifference: percentDifference.toFixed(1),
        correctionFactor: (correctionFactor * 100).toFixed(0),
        heightCm: heightCm.toFixed(0),
        sex,
        isObese,
        interpretation,
        recommendation,
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
      actualWeight: '',
      height: '',
      sex: '',
      correctionFactor: '0.4'
    });
    setResults(null);
    setErrors({});
  }, []);

  // Copy function
  const copyResults = useCallback(() => {
    if (!results) return;
    
    const resultText = `
Peso Corporal Ajustado:
Peso ajustado: ${results.adjustedWeight} kg
Peso atual: ${results.actualWeight} kg
Peso ideal: ${results.idealWeight} kg
IMC: ${results.bmi} kg/m²
Fator de correção: ${results.correctionFactor}%
Altura: ${results.heightCm} cm
Sexo: ${results.sex === 'male' ? 'Masculino' : 'Feminino'}
Interpretação: ${results.interpretation}
Recomendação: ${results.recommendation}

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

  // Get BMI status badge
  const getBMIBadge = (bmi) => {
    const value = parseFloat(bmi);
    
    if (value < 18.5) return <Badge className="text-blue-200 bg-blue-900/30 border border-blue-700/50">Baixo Peso</Badge>;
    if (value < 25) return <Badge className="text-green-200 bg-green-900/30 border border-green-700/50">Normal</Badge>;
    if (value < 30) return <Badge className="text-yellow-200 bg-yellow-900/30 border border-yellow-700/50">Sobrepeso</Badge>;
    if (value < 35) return <Badge className="text-red-200 bg-red-900/30 border border-red-700/50">Obesidade I</Badge>;
    if (value < 40) return <Badge className="text-red-200 bg-red-900/30 border border-red-700/50">Obesidade II</Badge>;
    return <Badge className="text-red-200 bg-red-900/30 border border-red-700/50">Obesidade III</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Peso Corporal Ajustado
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
                  <Label htmlFor="actualWeight">Peso Atual (kg)</Label>
                  <Input
                    id="actualWeight"
                    type="number"
                    value={inputs.actualWeight}
                    onChange={(e) => setInputs(prev => ({ ...prev, actualWeight: e.target.value }))}
                    placeholder="Ex: 120"
                    step="0.1"
                    min="0"
                    className={errors.actualWeight ? 'border-red-500' : ''}
                  />
                  {errors.actualWeight && (
                    <p className="text-sm text-red-500">{errors.actualWeight}</p>
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
              
              <div className="space-y-2">
                <Label htmlFor="correctionFactor">Fator de Correção</Label>
                <Select 
                  value={inputs.correctionFactor} 
                  onValueChange={(value) => setInputs(prev => ({ ...prev, correctionFactor: value }))}
                >
                  <SelectTrigger className={errors.correctionFactor ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.3">0.3 (30%) - Conservador</SelectItem>
                    <SelectItem value="0.4">0.4 (40%) - Padrão</SelectItem>
                    <SelectItem value="0.5">0.5 (50%) - Liberal</SelectItem>
                  </SelectContent>
                </Select>
                {errors.correctionFactor && (
                  <p className="text-sm text-red-500">{errors.correctionFactor}</p>
                )}
                <p className="text-xs text-gray-400">
                  Fator usado para calcular o peso ajustado em pacientes obesos
                </p>
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
                      {results.adjustedWeight}
                      <span className="text-lg font-normal text-gray-300 ml-2">kg</span>
                    </div>
                    <div className="text-sm text-gray-300">
                      Peso Corporal Ajustado
                    </div>
                    
                    {results.isObese && (
                      <div className="flex items-center justify-center gap-2 text-sm text-yellow-200">
                        <AlertTriangle className="h-4 w-4" />
                        Ajuste necessário para obesidade
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-200">
                        {results.actualWeight} kg
                      </div>
                      <div className="text-xs text-gray-300">Peso Atual</div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-200">
                        {results.idealWeight} kg
                      </div>
                      <div className="text-xs text-gray-300">Peso Ideal</div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-200">
                        {results.bmi}
                      </div>
                      <div className="text-xs text-gray-300">IMC</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    {getBMIBadge(results.bmi)}
                  </div>
                  
                  {results.isObese && (
                    <div className="text-center text-sm">
                      <div className="text-gray-300">
                        Excesso de peso: {results.excessWeight} kg
                      </div>
                      <div className="text-gray-300">
                        Fator de correção: {results.correctionFactor}%
                      </div>
                    </div>
                  )}
                  
                  <div className={`p-3 rounded-lg border ${getResultColor(results.status)}`}>
                    <h4 className="font-semibold mb-2">Interpretação:</h4>
                    <p className="text-sm mb-2">{results.interpretation}</p>
                    <p className="text-sm font-medium">{results.recommendation}</p>
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
                <h4 className="font-semibold mb-2">Fórmula do Peso Ajustado:</h4>
                <div className="bg-muted p-3 rounded space-y-1">
                  <code className="block">Peso Ajustado = Peso Ideal + FC × (Peso Atual - Peso Ideal)</code>
                  <div className="text-sm text-gray-300 mt-2">
                    Onde FC = Fator de Correção (0,3 a 0,5)
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Indicações para Uso:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Medicamentos que requerem ajuste:</h5>
                    <div className="text-sm space-y-1">
                      <div>• Aminoglicosídeos</div>
                      <div>• Vancomicina</div>
                      <div>• Digoxina</div>
                      <div>• Teofilina</div>
                      <div>• Ciclosporina</div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Fatores de correção:</h5>
                    <div className="text-sm space-y-1">
                      <div>• 0,3 (30%): Conservador</div>
                      <div>• 0,4 (40%): Mais comum</div>
                      <div>• 0,5 (50%): Liberal</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Quando Usar o Peso Ajustado:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pacientes obesos (IMC ≥ 30 kg/m²)</li>
                  <li>• Medicamentos com distribuição limitada no tecido adiposo</li>
                  <li>• Dosagem de medicamentos hidrofílicos</li>
                  <li>• Cálculos de clearance renal</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Quando NÃO Usar:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pacientes com peso normal ou baixo peso</li>
                  <li>• Medicamentos lipofílicos (usar peso total)</li>
                  <li>• Quimioterápicos (geralmente peso total ou ASC)</li>
                  <li>• Anestésicos (depende do medicamento)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Limitações:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Não há consenso sobre o fator de correção ideal</li>
                  <li>• Varia conforme o medicamento</li>
                  <li>• Pode não ser adequado para obesidade extrema</li>
                  <li>• Requer monitorização clínica</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974</li>
                  <li>• Traynor AM, et al. Aminoglycoside dosing weight correction factors. Drug Intell Clin Pharm. 1995</li>
                  <li>• Sociedade Brasileira de Farmácia Hospitalar</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default AdjustedBodyWeight;
