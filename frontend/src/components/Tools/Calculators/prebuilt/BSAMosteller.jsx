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
 * BSA Mosteller Calculator - Área de Superfície Corporal (Fórmula de Mosteller)
 * 
 * Integrates with:
 * - Calculators.jsx via hardcodedCalculators array
 * - Dialog component for modal display
 * - Cards for structured layout
 * 
 * @param {boolean} open - Controls modal visibility
 * @param {function} onOpenChange - Callback for modal state changes
 */
function BSAMosteller({ open, onOpenChange }) {
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
      
      // Convert height from meters to centimeters for Mosteller formula
      const heightCm = height * 100;
      
      // Mosteller formula: BSA (m²) = √[(height(cm) × weight(kg)) / 3600]
      const bsa = Math.sqrt((heightCm * weight) / 3600);
      
      let interpretation = '';
      let status = 'normal';
      
      if (bsa < 1.5) {
        interpretation = 'ASC abaixo do normal para adultos. Pode indicar baixo peso ou estatura reduzida.';
        status = 'info';
      } else if (bsa <= 2.0) {
        interpretation = 'ASC dentro da faixa normal para adultos (1,5 - 2,0 m²).';
        status = 'normal';
      } else if (bsa <= 2.5) {
        interpretation = 'ASC elevada. Comum em indivíduos de grande estatura ou sobrepeso.';
        status = 'warning';
      } else {
        interpretation = 'ASC muito elevada. Verificar dados de entrada e considerar avaliação clínica.';
        status = 'danger';
      }
      
      const calculatedResults = {
        bsa: bsa.toFixed(2),
        weightKg: weight.toFixed(1),
        heightCm: heightCm.toFixed(0),
        heightM: height.toFixed(2),
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
      height: ''
    });
    setResults(null);
    setErrors({});
  }, []);

  // Copy function
  const copyResults = useCallback(() => {
    if (!results) return;
    
    const resultText = `
ASC - Área de Superfície Corporal (Mosteller):
ASC: ${results.bsa} m²
Peso: ${results.weightKg} kg
Altura: ${results.heightM} m (${results.heightCm} cm)
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
            ASC - Área de Superfície Corporal (Mosteller)
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
                  placeholder="Ex: 175"
                  step="0.1"
                  min="0"
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
                    <div className="text-3xl font-bold text-gray-900">
                      {results.bsa}
                      <span className="text-lg font-normal text-gray-600 ml-2">m²</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Peso: {results.weightKg} kg | Altura: {results.heightCm} cm
                    </div>
                    <Badge className={getResultColor(results.status)}>
                      ASC {results.status === 'normal' ? 'Normal' : results.status === 'warning' ? 'Elevada' : results.status === 'danger' ? 'Muito Elevada' : 'Baixa'}
                    </Badge>
                  </div>
                  
                  <div className={`calculator-result ${getResultColor(results.status)}`}>
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
                <h4 className="font-semibold mb-2">Fórmula de Mosteller:</h4>
                <code className="bg-muted p-2 rounded block">
                  ASC (m²) = √[(Altura(cm) × Peso(kg)) ÷ 3600]
                </code>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Características da Fórmula:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <div>• Mais simples e amplamente utilizada</div>
                    <div>• Recomendada pela maioria das diretrizes</div>
                    <div>• Boa correlação com métodos diretos</div>
                  </div>
                  <div className="space-y-1">
                    <div>• Valores normais: 1,5 - 2,0 m² (adultos)</div>
                    <div>• Usada para dosagem de medicamentos</div>
                    <div>• Padrão em oncologia e nefrologia</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Aplicações Clínicas:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Dosagem de quimioterápicos</li>
                  <li>• Cálculo de clearance de creatinina</li>
                  <li>• Ajuste de doses em pediatria</li>
                  <li>• Avaliação nutricional</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Mosteller RD. Simplified calculation of body-surface area. N Engl J Med. 1987</li>
                  <li>• DuBois D, DuBois EF. A formula to estimate the approximate surface area. Arch Intern Med. 1916</li>
                  <li>• Sociedade Brasileira de Oncologia Clínica</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default BSAMosteller;
