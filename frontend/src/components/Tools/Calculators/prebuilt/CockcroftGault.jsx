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
import { Copy, Calculator, Kidney, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Cockcroft-Gault Creatinine Clearance Calculator
 * 
 * Integrates with:
 * - Calculators.jsx via hardcodedCalculators array
 * - Dialog component for modal display
 * - Cards for structured layout
 * 
 * Medical validation:
 * - Standard for renal dose adjustments
 * - Less accurate in obesity and elderly
 * - Use ideal weight if BMI >30
 * 
 * @param {boolean} open - Controls modal visibility
 * @param {function} onOpenChange - Callback for modal state changes
 */
function CockcroftGault({ open, onOpenChange }) {
  // State management
  const [inputs, setInputs] = useState({
    age: '',
    weight: '',
    creatinine: '',
    sex: 'male'
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Validation function
  const validateInputs = useCallback(() => {
    const newErrors = {};
    const warnings = [];
    
    if (!inputs.age || parseFloat(inputs.age) < 18 || parseFloat(inputs.age) > 120) {
      newErrors.age = 'Idade deve estar entre 18 e 120 anos';
    }
    
    if (!inputs.weight || parseFloat(inputs.weight) < 20 || parseFloat(inputs.weight) > 300) {
      newErrors.weight = 'Peso deve estar entre 20 e 300 kg';
    }
    
    if (!inputs.creatinine || parseFloat(inputs.creatinine) < 0.1 || parseFloat(inputs.creatinine) > 20) {
      newErrors.creatinine = 'Creatinina deve estar entre 0.1 e 20 mg/dL';
    }
    
    // Medical warnings
    if (parseFloat(inputs.age) > 80) {
      warnings.push('Menos precisa em idosos >80 anos');
    }
    
    if (parseFloat(inputs.weight) > 100) {
      warnings.push('Considerar peso ideal se IMC >30');
    }
    
    if (parseFloat(inputs.creatinine) > 3) {
      warnings.push('Creatinina elevada - verificar se está correta');
    }
    
    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, warnings };
  }, [inputs]);

  // Calculation function
  const calculate = useCallback(() => {
    const validation = validateInputs();
    
    if (!validation.isValid) {
      return;
    }
    
    try {
      const age = parseFloat(inputs.age);
      const weight = parseFloat(inputs.weight);
      const creatinine = parseFloat(inputs.creatinine);
      const isFemale = inputs.sex === 'female';
      
      // Cockcroft-Gault formula
      let clearance = ((140 - age) * weight) / (72 * creatinine);
      
      // Apply female correction factor
      if (isFemale) {
        clearance *= 0.85;
      }
      
      // Classification and interpretation
      let classification = '';
      let status = 'normal';
      let interpretation = '';
      let recommendations = [];
      
      if (clearance >= 90) {
        classification = 'Função renal normal';
        status = 'normal';
        interpretation = 'Função renal preservada. Não há necessidade de ajuste de doses.';
        recommendations = ['Manter hidratação adequada', 'Monitorização de rotina'];
      } else if (clearance >= 60) {
        classification = 'Disfunção renal leve';
        status = 'info';
        interpretation = 'Disfunção renal leve. Alguns medicamentos podem necessitar ajuste.';
        recommendations = ['Evitar nefrotóxicos', 'Ajustar doses conforme necessário', 'Monitorização mais frequente'];
      } else if (clearance >= 30) {
        classification = 'Disfunção renal moderada';
        status = 'warning';
        interpretation = 'Disfunção renal moderada. Ajuste de doses necessário para a maioria dos medicamentos.';
        recommendations = ['Ajuste obrigatório de doses', 'Evitar contraste iodado', 'Considerar encaminhamento ao nefrologista'];
      } else if (clearance >= 15) {
        classification = 'Disfunção renal severa';
        status = 'danger';
        interpretation = 'Disfunção renal severa. Ajuste rigoroso de doses e contraindicação de vários medicamentos.';
        recommendations = ['Ajuste rigoroso de doses', 'Evitar medicamentos nefrotóxicos', 'Encaminhamento urgente ao nefrologista'];
      } else {
        classification = 'Falência renal';
        status = 'danger';
        interpretation = 'Falência renal. Necessário terapia de substituição renal.';
        recommendations = ['Preparar para diálise', 'Ajuste extremo de doses', 'Acompanhamento nefrológico imediato'];
      }
      
      const calculatedResults = {
        clearance: clearance.toFixed(1),
        classification,
        status,
        interpretation,
        recommendations,
        warnings: validation.warnings,
        inputs: {
          age: age.toFixed(0),
          weight: weight.toFixed(1),
          creatinine: creatinine.toFixed(2),
          sex: inputs.sex
        }
      };
      
      setResults(calculatedResults);
      
      // Show warnings if any
      validation.warnings.forEach(warning => {
        toast.warning(warning);
      });
    } catch (error) {
      toast.error('Erro no cálculo: ' + error.message);
    }
  }, [inputs, validateInputs]);

  // Clear function
  const clearForm = useCallback(() => {
    setInputs({
      age: '',
      weight: '',
      creatinine: '',
      sex: 'male'
    });
    setResults(null);
    setErrors({});
  }, []);

  // Copy function
  const copyResults = useCallback(() => {
    if (!results) return;
    
    const resultText = `
Clearance de Creatinina (Cockcroft-Gault):
Idade: ${results.inputs.age} anos
Peso: ${results.inputs.weight} kg
Creatinina: ${results.inputs.creatinine} mg/dL
Sexo: ${results.inputs.sex === 'male' ? 'Masculino' : 'Feminino'}

Resultado: ${results.clearance} mL/min
Classificação: ${results.classification}
Interpretação: ${results.interpretation}

Recomendações:
${results.recommendations.map(rec => `• ${rec}`).join('\n')}

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

  // Get classification badge
  const getClassificationBadge = (classification, status) => {
    const colorClasses = {
      normal: 'text-green-200 bg-green-900/30 border border-green-700/50',
      warning: 'text-yellow-200 bg-yellow-900/30 border border-yellow-700/50',
      danger: 'text-red-200 bg-red-900/30 border border-red-700/50',
      info: 'text-blue-200 bg-blue-900/30 border border-blue-700/50'
    };
    
    return <Badge className={colorClasses[status]}>{classification}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Kidney className="h-5 w-5" />
            Clearance de Creatinina (Cockcroft-Gault)
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
                  <Label htmlFor="age">Idade (anos)</Label>
                  <Input
                    id="age"
                    type="number"
                    value={inputs.age}
                    onChange={(e) => setInputs(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Ex: 65"
                    min="18"
                    max="120"
                    className={errors.age ? 'border-red-500' : ''}
                  />
                  {errors.age && (
                    <p className="text-sm text-red-500">{errors.age}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={inputs.weight}
                    onChange={(e) => setInputs(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="Ex: 70"
                    step="0.1"
                    min="20"
                    max="300"
                    className={errors.weight ? 'border-red-500' : ''}
                  />
                  {errors.weight && (
                    <p className="text-sm text-red-500">{errors.weight}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="creatinine">Creatinina sérica (mg/dL)</Label>
                <Input
                  id="creatinine"
                  type="number"
                  value={inputs.creatinine}
                  onChange={(e) => setInputs(prev => ({ ...prev, creatinine: e.target.value }))}
                  placeholder="Ex: 1.2"
                  step="0.1"
                  min="0.1"
                  max="20"
                  className={errors.creatinine ? 'border-red-500' : ''}
                />
                {errors.creatinine && (
                  <p className="text-sm text-red-500">{errors.creatinine}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sex">Sexo</Label>
                <Select 
                  value={inputs.sex} 
                  onValueChange={(value) => setInputs(prev => ({ ...prev, sex: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
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
                      {results.clearance}
                      <span className="text-lg font-normal text-gray-300 ml-2">mL/min</span>
                    </div>
                    <div className="text-sm text-gray-300">
                      Clearance de Creatinina
                    </div>
                    
                    <div className="flex justify-center">
                      {getClassificationBadge(results.classification, results.status)}
                    </div>
                  </div>
                  
                  {results.warnings.length > 0 && (
                    <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-700/50">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-300 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-amber-200 mb-1">Atenção:</h4>
                          <ul className="text-sm text-amber-300 space-y-1">
                            {results.warnings.map((warning, index) => (
                              <li key={index}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className={`p-3 rounded-lg border ${getResultColor(results.status)}`}>
                    <h4 className="font-semibold mb-2">Interpretação:</h4>
                    <p className="text-sm mb-3">{results.interpretation}</p>
                    
                    <h4 className="font-semibold mb-2">Recomendações:</h4>
                    <ul className="text-sm space-y-1">
                      {results.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
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
        
        {/* Formula and References Card */}
        <Card>
          <CardHeader>
            <CardTitle>Fórmula e Referências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Fórmula de Cockcroft-Gault (1976):</h4>
                <div className="bg-muted p-3 rounded space-y-1">
                  <code className="block">CrCl = [(140 - idade) × peso] ÷ (72 × creatinina)</code>
                  <code className="block">Se feminino: × 0,85</code>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Classificação da Função Renal:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <div>• ≥ 90 mL/min: Normal</div>
                    <div>• 60-89 mL/min: Disfunção leve</div>
                    <div>• 30-59 mL/min: Disfunção moderada</div>
                  </div>
                  <div className="space-y-1">
                    <div>• 15-29 mL/min: Disfunção severa</div>
                    <div>• &lt; 15 mL/min: Falência renal</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Aplicações Clínicas:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Padrão-ouro para ajuste de doses renais</li>
                  <li>• Avaliação da função renal</li>
                  <li>• Indicação de terapia de substituição renal</li>
                  <li>• Monitorização de nefrotoxicidade</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Vantagens:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Amplamente validada e aceita</li>
                  <li>• Fácil aplicação clínica</li>
                  <li>• Considera idade, peso e sexo</li>
                  <li>• Padrão em bulas de medicamentos</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Limitações:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Menos precisa em obesos (usar peso ideal)</li>
                  <li>• Superestima clearance em idosos</li>
                  <li>• Não considera massa muscular</li>
                  <li>• Baseada em creatinina sérica</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Cockcroft DW, Gault MH. Prediction of creatinine clearance. Nephron. 1976</li>
                  <li>• National Kidney Foundation. K/DOQI Clinical Practice Guidelines</li>
                  <li>• Sociedade Brasileira de Nefrologia</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default CockcroftGault;