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
import { Copy, Calculator, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * CorrectedSodium - Correção do Sódio pela Glicemia
 * 
 * This component calculates corrected sodium levels accounting for hyperglycemia,
 * which is essential for accurate electrolyte assessment in diabetic patients.
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
 * <CorrectedSodium 
 *   open={showHardcodedCalculator === 'corrected-sodium'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Calculation example
 * // Input: sodium=130 mEq/L, glucose=400 mg/dL
 * // Output: correctedSodium=142.4 mEq/L
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function CorrectedSodium({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    sodium: '',
    glucose: '',
    glucoseUnit: 'mg/dL' // 'mg/dL' | 'mmol/L'
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  /**
   * Validates input parameters for sodium correction calculation
   * 
   * @returns {boolean} True if all inputs are valid
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.sodium || parseFloat(inputs.sodium) < 100 || parseFloat(inputs.sodium) > 200) {
      newErrors.sodium = 'Sódio deve estar entre 100-200 mEq/L';
    }
    
    if (!inputs.glucose || parseFloat(inputs.glucose) <= 0) {
      newErrors.glucose = 'Glicemia deve ser maior que 0';
    }
    
    if (inputs.glucoseUnit === 'mg/dL' && parseFloat(inputs.glucose) > 1000) {
      newErrors.glucose = 'Glicemia muito alta (>1000 mg/dL) - verificar valor';
    }
    
    if (inputs.glucoseUnit === 'mmol/L' && parseFloat(inputs.glucose) > 55) {
      newErrors.glucose = 'Glicemia muito alta (>55 mmol/L) - verificar valor';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Performs the sodium correction calculation
   * 
   * @returns {Object} Calculated results with clinical interpretation
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      const sodium = parseFloat(inputs.sodium);
      let glucose = parseFloat(inputs.glucose);
      
      // Convert glucose to mg/dL if needed
      if (inputs.glucoseUnit === 'mmol/L') {
        glucose = glucose * 18; // mmol/L to mg/dL
      }
      
      // Katz formula: Corrected Na = Measured Na + 1.6 × [(glucose - 100) / 100]
      // Alternative formula: Corrected Na = Measured Na + 2.4 × [(glucose - 100) / 100]
      // Using the more conservative Katz formula (1.6 factor)
      const correctedSodiumKatz = sodium + 1.6 * ((glucose - 100) / 100);
      
      // Alternative Hillier formula (2.4 factor) for comparison
      const correctedSodiumHillier = sodium + 2.4 * ((glucose - 100) / 100);
      
      // Calculate correction factor applied
      const correctionFactor = correctedSodiumKatz - sodium;
      
      // Determine sodium status
      let sodiumStatus = '';
      let statusColor = '';
      let clinicalSignificance = '';
      
      if (correctedSodiumKatz < 135) {
        sodiumStatus = 'Hiponatremia';
        statusColor = 'text-red-200';
        clinicalSignificance = 'Hiponatremia verdadeira - investigar causas e tratar';
      } else if (correctedSodiumKatz >= 135 && correctedSodiumKatz <= 145) {
        sodiumStatus = 'Normal';
        statusColor = 'text-green-200';
        clinicalSignificance = 'Sódio corrigido dentro da normalidade';
      } else {
        sodiumStatus = 'Hipernatremia';
        statusColor = 'text-orange-200';
        clinicalSignificance = 'Hipernatremia - avaliar estado de hidratação';
      }
      
      // Determine glucose status
      let glucoseStatus = '';
      let glucoseColor = '';
      
      if (glucose < 70) {
        glucoseStatus = 'Hipoglicemia';
        glucoseColor = 'text-red-200';
      } else if (glucose >= 70 && glucose <= 99) {
        glucoseStatus = 'Normal';
        glucoseColor = 'text-green-200';
      } else if (glucose >= 100 && glucose <= 125) {
        glucoseStatus = 'Glicemia de jejum alterada';
        glucoseColor = 'text-yellow-200';
      } else if (glucose >= 126 && glucose <= 199) {
        glucoseStatus = 'Diabetes';
        glucoseColor = 'text-orange-200';
      } else {
        glucoseStatus = 'Hiperglicemia severa';
        glucoseColor = 'text-red-200';
      }
      
      // Clinical recommendations
      const recommendations = [];
      
      if (Math.abs(correctionFactor) >= 5) {
        recommendations.push('Correção significativa (≥5 mEq/L) - usar sódio corrigido para decisões clínicas');
      }
      
      if (glucose > 250) {
        recommendations.push('Hiperglicemia severa - controlar glicemia antes de avaliar distúrbios eletrolíticos');
      }
      
      if (correctedSodiumKatz < 130) {
        recommendations.push('Hiponatremia severa - risco de edema cerebral, monitorar sintomas neurológicos');
      }
      
      if (correctedSodiumKatz > 150) {
        recommendations.push('Hipernatremia severa - risco de desidratação celular, avaliar reposição hídrica');
      }
      
      if (glucose > 400) {
        recommendations.push('Cetoacidose diabética possível - avaliar cetonas e gasometria');
      }
      
      // Monitoring recommendations
      const monitoring = [
        'Reavaliar eletrólitos após controle glicêmico',
        'Monitorar função renal (ureia, creatinina)',
        'Avaliar estado de hidratação clínico',
        'Considerar gasometria se hiperglicemia severa'
      ];
      
      const calculatedResults = {
        correctedSodiumKatz: correctedSodiumKatz.toFixed(1),
        correctedSodiumHillier: correctedSodiumHillier.toFixed(1),
        correctionFactor: correctionFactor.toFixed(1),
        sodiumStatus,
        statusColor,
        clinicalSignificance,
        glucoseStatus,
        glucoseColor,
        recommendations,
        monitoring,
        glucoseMgDl: glucose.toFixed(0),
        glucoseMmolL: (glucose / 18).toFixed(1)
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
      sodium: '',
      glucose: '',
      glucoseUnit: 'mg/dL'
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `Correção do Sódio pela Glicemia - Resultados:\n`;
    resultText += `Sódio medido: ${inputs.sodium} mEq/L\n`;
    resultText += `Glicemia: ${results.glucoseMgDl} mg/dL (${results.glucoseMmolL} mmol/L)\n\n`;
    resultText += `Sódio corrigido (Katz): ${results.correctedSodiumKatz} mEq/L\n`;
    resultText += `Sódio corrigido (Hillier): ${results.correctedSodiumHillier} mEq/L\n`;
    resultText += `Fator de correção: ${results.correctionFactor} mEq/L\n\n`;
    resultText += `Status do sódio: ${results.sodiumStatus}\n`;
    resultText += `Status da glicemia: ${results.glucoseStatus}\n\n`;
    resultText += `Significado clínico: ${results.clinicalSignificance}\n\n`;
    
    if (results.recommendations.length > 0) {
      resultText += `Recomendações:\n${results.recommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    }
    
    resultText += `Monitoramento:\n${results.monitoring.map(m => `• ${m}`).join('\n')}\n\n`;
    resultText += `Calculado em: ${new Date().toLocaleString('pt-BR')}`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results, inputs]);

  /**
   * Converts glucose units
   */
  const toggleGlucoseUnit = () => {
    const currentValue = parseFloat(inputs.glucose);
    if (isNaN(currentValue)) return;
    
    let convertedValue;
    let newUnit;
    
    if (inputs.glucoseUnit === 'mg/dL') {
      convertedValue = (currentValue / 18).toFixed(1);
      newUnit = 'mmol/L';
    } else {
      convertedValue = (currentValue * 18).toFixed(0);
      newUnit = 'mg/dL';
    }
    
    setInputs(prev => ({
      ...prev,
      glucose: convertedValue,
      glucoseUnit: newUnit
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Correção do Sódio pela Glicemia
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Laboratoriais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sodium">Sódio Sérico (mEq/L)</Label>
                <Input
                  id="sodium"
                  type="number"
                  value={inputs.sodium}
                  onChange={(e) => setInputs(prev => ({ ...prev, sodium: e.target.value }))}
                  placeholder="Ex: 130"
                  min="100"
                  max="200"
                  step="0.1"
                  className={errors.sodium ? 'border-red-500' : ''}
                />
                {errors.sodium && (
                  <p className="text-sm text-red-500">{errors.sodium}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="glucose">Glicemia ({inputs.glucoseUnit})</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleGlucoseUnit}
                    className="text-xs"
                  >
                    Converter para {inputs.glucoseUnit === 'mg/dL' ? 'mmol/L' : 'mg/dL'}
                  </Button>
                </div>
                <Input
                  id="glucose"
                  type="number"
                  value={inputs.glucose}
                  onChange={(e) => setInputs(prev => ({ ...prev, glucose: e.target.value }))}
                  placeholder={inputs.glucoseUnit === 'mg/dL' ? 'Ex: 400' : 'Ex: 22.2'}
                  min="0"
                  step={inputs.glucoseUnit === 'mg/dL' ? '1' : '0.1'}
                  className={errors.glucose ? 'border-red-500' : ''}
                />
                {errors.glucose && (
                  <p className="text-sm text-red-500">{errors.glucose}</p>
                )}
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Valores de Referência:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Sódio:</strong> 135-145 mEq/L</li>
                  <li>• <strong>Glicemia:</strong> 70-99 mg/dL (3.9-5.5 mmol/L)</li>
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
                        <span className="font-medium text-blue-800">Sódio Corrigido (Katz):</span>
                        <span className="font-bold text-blue-900">{results.correctedSodiumKatz} mEq/L</span>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Sódio Corrigido (Hillier):</span>
                        <span className="font-bold">{results.correctedSodiumHillier} mEq/L</span>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Fator de Correção:</span>
                        <span className="font-bold">{results.correctionFactor} mEq/L</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badges */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status do Sódio:</span>
                      <Badge className={results.statusColor}>
                        {results.sodiumStatus}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status da Glicemia:</span>
                      <Badge className={results.glucoseColor}>
                        {results.glucoseStatus}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Clinical Significance */}
                  <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Significado Clínico:</h4>
                    <p className="text-sm text-green-700">{results.clinicalSignificance}</p>
                  </div>
                  
                  {/* Recommendations */}
                  {results.recommendations.length > 0 && (
                    <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Recomendações:
                      </h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {results.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Monitoring */}
                  <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Monitoramento:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {results.monitoring.map((mon, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{mon}</span>
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
                <h4 className="font-semibold mb-2">Fórmulas de Correção:</h4>
                <div className="space-y-2">
                  <code className="bg-muted p-2 rounded block text-sm">
                    Katz: Na⁺ corrigido = Na⁺ medido + 1,6 × [(glicose - 100) ÷ 100]
                  </code>
                  <code className="bg-muted p-2 rounded block text-sm">
                    Hillier: Na⁺ corrigido = Na⁺ medido + 2,4 × [(glicose - 100) ÷ 100]
                  </code>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interpretação:</h4>
                <p className="text-sm text-muted-foreground">
                  A hiperglicemia causa deslocamento osmótico de água do espaço intracelular para o extracelular, 
                  diluindo o sódio sérico. A correção é essencial para avaliar o verdadeiro status do sódio, 
                  especialmente em pacientes diabéticos descompensados.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Quando Usar:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Hiperglicemia > 200 mg/dL (11,1 mmol/L)</li>
                  <li>• Hiponatremia em paciente diabético</li>
                  <li>• Cetoacidose diabética</li>
                  <li>• Estado hiperosmolar hiperglicêmico</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Katz MA. Hyperglycemia-induced hyponatremia. N Engl J Med 1973</li>
                  <li>• Hillier TA et al. Hyponatremia: evaluating the correction factor. Am J Med 1999</li>
                  <li>• Diretrizes SBD - Sociedade Brasileira de Diabetes 2023</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default CorrectedSodium;
