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
import { Copy, Calculator, User, Info } from 'lucide-react';
import { toast } from 'sonner';

/**
 * BMI Calculator - Índice de Massa Corporal
 * 
 * Integrates with:
 * - Calculators.jsx via hardcodedCalculators array
 * - Dialog component for modal display
 * - Cards for structured layout
 * 
 * @param {boolean} open - Controls modal visibility
 * @param {function} onOpenChange - Callback for modal state changes
 */
function BMI({ open, onOpenChange }) {
  // State management
  const [inputs, setInputs] = useState({
    weight: '',
    height: ''
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Validation function
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.weight || parseFloat(inputs.weight) <= 0) {
      newErrors.weight = 'Peso deve ser maior que 0 kg';
    }
    
    if (!inputs.height || parseFloat(inputs.height) <= 0) {
      newErrors.height = 'Altura deve ser maior que 0 m';
    }
    
    if (parseFloat(inputs.height) > 3) {
      newErrors.height = 'Altura deve ser em metros (ex: 1.75)';
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
      
      const bmi = weight / (height * height);
      
      let classification = '';
      let status = 'normal';
      let interpretation = '';
      
      if (bmi < 18.5) {
        classification = 'Baixo peso';
        status = 'info';
        interpretation = 'Pode indicar desnutrição. Consulte um profissional de saúde.';
      } else if (bmi < 25) {
        classification = 'Peso normal';
        status = 'normal';
        interpretation = 'Peso adequado para a altura. Mantenha hábitos saudáveis.';
      } else if (bmi < 30) {
        classification = 'Sobrepeso';
        status = 'warning';
        interpretation = 'Risco aumentado para doenças cardiovasculares. Considere mudanças no estilo de vida.';
      } else if (bmi < 35) {
        classification = 'Obesidade grau I';
        status = 'danger';
        interpretation = 'Risco moderado para complicações. Recomenda-se acompanhamento médico.';
      } else if (bmi < 40) {
        classification = 'Obesidade grau II';
        status = 'danger';
        interpretation = 'Risco alto para complicações. Necessário acompanhamento médico especializado.';
      } else {
        classification = 'Obesidade grau III';
        status = 'danger';
        interpretation = 'Risco muito alto. Necessário tratamento médico urgente.';
      }
      
      const calculatedResults = {
        bmi: bmi.toFixed(1),
        classification,
        status,
        interpretation
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
      height: ''
    });
    setResults(null);
    setErrors({});
  }, []);

  // Copy function
  const copyResults = useCallback(() => {
    if (!results) return;
    
    const resultText = `
IMC - Índice de Massa Corporal:
IMC: ${results.bmi} kg/m²
Classificação: ${results.classification}
Interpretação: ${results.interpretation}

Calculado em: ${new Date().toLocaleString('pt-BR')}
    `.trim();
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results]);

  // Result colors based on status - Using consistent dark theme colors
  const getResultColor = (status) => {
    const colors = {
      normal: 'calculator-result-success',
      warning: 'calculator-result-warning',
      danger: 'calculator-result-danger',
      info: 'calculator-result-info'
    };
    return colors[status] || colors.normal;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="calculator-dialog">
        <DialogHeader className="calculator-dialog-header">
          <DialogTitle className="calculator-dialog-title">
            <User className="h-5 w-5" />
            IMC - Índice de Massa Corporal
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Dados de Entrada</CardTitle>
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
                  step="0.1"
                  min="0"
                  className={`calculator-input ${errors.weight ? 'border-red-500' : ''}`}
                />
                {errors.weight && (
                  <p className="text-sm text-red-500">{errors.weight}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="height">Altura (m)</Label>
                <Input
                  id="height"
                  type="number"
                  value={inputs.height}
                  onChange={(e) => setInputs(prev => ({ ...prev, height: e.target.value }))}
                  placeholder="Ex: 1.75"
                  step="0.01"
                  min="0"
                  max="3"
                  className={`calculator-input ${errors.height ? 'border-red-500' : ''}`}
                />
                {errors.height && (
                  <p className="text-sm text-red-500">{errors.height}</p>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={calculate} className="calculator-button-primary flex-1">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular
                </Button>
                <Button onClick={clearForm} className="calculator-button-secondary">
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
                      {results.bmi}
                      <span className="text-lg font-normal text-gray-400 ml-2">kg/m²</span>
                    </div>
                    <Badge className={getResultColor(results.status)}>
                      {results.classification}
                    </Badge>
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
                <h4 className="font-semibold mb-2">Fórmula:</h4>
                <code className="bg-muted p-2 rounded block">
                  IMC = Peso (kg) ÷ Altura² (m²)
                </code>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Classificação OMS:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <div>• &lt; 18,5: Baixo peso</div>
                    <div>• 18,5 - 24,9: Peso normal</div>
                    <div>• 25,0 - 29,9: Sobrepeso</div>
                  </div>
                  <div className="space-y-1">
                    <div>• 30,0 - 34,9: Obesidade grau I</div>
                    <div>• 35,0 - 39,9: Obesidade grau II</div>
                    <div>• ≥ 40,0: Obesidade grau III</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Organização Mundial da Saúde (OMS)</li>
                  <li>• Ministério da Saúde - Guia Alimentar</li>
                  <li>• Sociedade Brasileira de Endocrinologia</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default BMI;
