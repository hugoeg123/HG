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
 * BSA DuBois Calculator - Área de Superfície Corporal (Fórmula de DuBois)
 * 
 * Integrates with:
 * - Calculators.jsx via hardcodedCalculators array
 * - Dialog component for modal display
 * - Cards for structured layout
 * 
 * @param {boolean} open - Controls modal visibility
 * @param {function} onOpenChange - Callback for modal state changes
 */
function BSADuBois({ open, onOpenChange }) {
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
      
      // Convert height from meters to centimeters for DuBois formula
      const heightCm = height * 100;
      
      // DuBois formula: BSA (m²) = 0.007184 × (weight^0.425) × (height^0.725)
      const bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(heightCm, 0.725);
      
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
ASC - Área de Superfície Corporal (DuBois):
ASC: ${results.bsa} m²
Peso: ${results.weightKg} kg
Altura: ${results.heightM} m (${results.heightCm} cm)
Interpretação: ${results.interpretation}

Calculado em: ${new Date().toLocaleString('pt-BR')}
    `.trim();
    
    navigator.clipboard.writeText(resultText);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            ASC - Área de Superfície Corporal (DuBois)
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
                  className={errors.weight ? 'border-red-500' : ''}
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
                  className={errors.height ? 'border-red-500' : ''}
                />
                {errors.height && (
                  <p className="text-sm text-red-500">{errors.height}</p>
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
                      {results.bsa}
                      <span className="text-lg font-normal text-gray-300 ml-2">m²</span>
                    </div>
                    <div className="text-sm text-gray-300">
                      Peso: {results.weightKg} kg | Altura: {results.heightCm} cm
                    </div>
                    <Badge className={getResultColor(results.status)}>
                      ASC {results.status === 'normal' ? 'Normal' : results.status === 'warning' ? 'Elevada' : results.status === 'danger' ? 'Muito Elevada' : 'Baixa'}
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
                <h4 className="font-semibold mb-2">Fórmula de DuBois:</h4>
                <code className="bg-muted p-2 rounded block">
                  ASC (m²) = 0.007184 × Peso^0.425 × Altura(cm)^0.725
                </code>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Características da Fórmula:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <div>• Primeira fórmula desenvolvida (1916)</div>
                    <div>• Baseada em medições diretas</div>
                    <div>• Mais precisa que Mosteller</div>
                  </div>
                  <div className="space-y-1">
                    <div>• Valores normais: 1,5 - 2,0 m² (adultos)</div>
                    <div>• Padrão histórico de referência</div>
                    <div>• Usada em pesquisas clínicas</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Comparação com Mosteller:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• DuBois: Mais precisa, baseada em dados empíricos</li>
                  <li>• Mosteller: Mais simples, amplamente aceita</li>
                  <li>• Diferença típica: &lt; 5% entre as fórmulas</li>
                  <li>• Ambas adequadas para uso clínico</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Aplicações Clínicas:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Dosagem de quimioterápicos</li>
                  <li>• Cálculo de índice cardíaco</li>
                  <li>• Estudos de fisiologia</li>
                  <li>• Avaliação metabólica</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• DuBois D, DuBois EF. A formula to estimate the approximate surface area. Arch Intern Med. 1916</li>
                  <li>• Gehan EA, George SL. Estimation of human body surface area. Cancer Chemother Rep. 1970</li>
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

export default BSADuBois;
