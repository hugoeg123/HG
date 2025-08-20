import React, { useState } from 'react';
import { Calculator, Copy, RotateCcw, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Corrected Calcium Calculator
 * 
 * Integrates with:
 * - Calculators.jsx for modal display
 * - calculatorStore.js for seeded calculator data
 * - Mobile optimization for touch interfaces
 * 
 * Medical validation:
 * - Essential for interpreting calcium in hypoalbuminemia
 * - Uses standard correction formula
 * - Critical for endocrine and metabolic disorders
 */
const CorrectedCalcium = ({ open, onOpenChange }) => {
  const [inputs, setInputs] = useState({
    totalCalcium: '',
    albumin: '',
    units: 'mg_dl' // mg_dl or mmol_l
  });
  const [result, setResult] = useState(null);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    // Clear result when inputs change
    if (result) setResult(null);
  };

  const validateInputs = () => {
    const errors = [];
    const warnings = [];

    if (inputs.units === 'mg_dl') {
      // mg/dL validation
      if (!inputs.totalCalcium || inputs.totalCalcium < 5 || inputs.totalCalcium > 15) {
        errors.push('Cálcio total deve estar entre 5 e 15 mg/dL');
      }
      if (!inputs.albumin || inputs.albumin < 1 || inputs.albumin > 6) {
        errors.push('Albumina deve estar entre 1 e 6 g/dL');
      }

      // Medical warnings for mg/dL
      if (inputs.totalCalcium < 8.5) {
        warnings.push('Hipocalcemia - investigar causas (PTH, vitamina D, magnésio)');
      }
      if (inputs.totalCalcium > 10.5) {
        warnings.push('Hipercalcemia - investigar causas (PTH, malignidade)');
      }
      if (inputs.albumin < 3.5) {
        warnings.push('Hipoalbuminemia - correção é especialmente importante');
      }
    } else {
      // mmol/L validation
      if (!inputs.totalCalcium || inputs.totalCalcium < 1.25 || inputs.totalCalcium > 3.75) {
        errors.push('Cálcio total deve estar entre 1.25 e 3.75 mmol/L');
      }
      if (!inputs.albumin || inputs.albumin < 15 || inputs.albumin > 60) {
        errors.push('Albumina deve estar entre 15 e 60 g/L');
      }

      // Medical warnings for mmol/L
      if (inputs.totalCalcium < 2.12) {
        warnings.push('Hipocalcemia - investigar causas (PTH, vitamina D, magnésio)');
      }
      if (inputs.totalCalcium > 2.62) {
        warnings.push('Hipercalcemia - investigar causas (PTH, malignidade)');
      }
      if (inputs.albumin < 35) {
        warnings.push('Hipoalbuminemia - correção é especialmente importante');
      }
    }

    return { errors, warnings };
  };

  const calculate = () => {
    const validation = validateInputs();
    
    if (validation.errors.length > 0) {
      toast.error(validation.errors[0]);
      return;
    }

    const totalCalcium = parseFloat(inputs.totalCalcium);
    const albumin = parseFloat(inputs.albumin);
    let correctedCalcium;
    let normalRange;
    let albuminNormal;

    if (inputs.units === 'mg_dl') {
      // Formula: Corrected Ca = Total Ca + 0.8 × (4.0 - Albumin)
      albuminNormal = 4.0;
      correctedCalcium = totalCalcium + 0.8 * (albuminNormal - albumin);
      normalRange = '8.5 - 10.5 mg/dL';
    } else {
      // Formula: Corrected Ca = Total Ca + 0.02 × (40 - Albumin)
      albuminNormal = 40;
      correctedCalcium = totalCalcium + 0.02 * (albuminNormal - albumin);
      normalRange = '2.12 - 2.62 mmol/L';
    }

    // Interpretation
    let interpretation = '';
    let interpretationColor = '';
    let recommendations = [];
    
    const isLow = inputs.units === 'mg_dl' ? correctedCalcium < 8.5 : correctedCalcium < 2.12;
    const isHigh = inputs.units === 'mg_dl' ? correctedCalcium > 10.5 : correctedCalcium > 2.62;
    
    if (isLow) {
      interpretation = 'Hipocalcemia';
      interpretationColor = 'text-red-600';
      recommendations = [
        'Dosar PTH, 25(OH)D3 e magnésio',
        'Avaliar sintomas neuromusculares',
        'Considerar reposição de cálcio se sintomático',
        'Investigar causas: hipoparatireoidismo, deficiência de vitamina D'
      ];
    } else if (isHigh) {
      interpretation = 'Hipercalcemia';
      interpretationColor = 'text-red-600';
      recommendations = [
        'Dosar PTH para diferenciação etiológica',
        'Investigar malignidade se PTH suprimido',
        'Avaliar sintomas: fadiga, confusão, nefrolitíase',
        'Considerar hidratação e tratamento específico'
      ];
    } else {
      interpretation = 'Normal';
      interpretationColor = 'text-green-600';
      recommendations = [
        'Cálcio corrigido dentro da normalidade',
        'Manter acompanhamento de rotina',
        'Reavaliar se houver mudanças clínicas'
      ];
    }

    // Calculate correction applied
    const correction = correctedCalcium - totalCalcium;
    const correctionDirection = correction > 0 ? 'aumentou' : correction < 0 ? 'diminuiu' : 'não alterou';

    setResult({
      correctedCalcium,
      totalCalcium,
      albumin,
      correction: Math.abs(correction),
      correctionDirection,
      interpretation,
      interpretationColor,
      recommendations,
      normalRange,
      warnings: validation.warnings,
      units: inputs.units
    });

    // Show warnings if any
    validation.warnings.forEach(warning => {
      toast.warning(warning);
    });
  };

  const copyResult = () => {
    if (!result) return;
    
    const unitLabel = inputs.units === 'mg_dl' ? 'mg/dL' : 'mmol/L';
    const albuminUnit = inputs.units === 'mg_dl' ? 'g/dL' : 'g/L';
    
    const text = `Cálcio Corrigido pela Albumina\n` +
                `Cálcio total: ${result.totalCalcium} ${unitLabel}\n` +
                `Albumina: ${result.albumin} ${albuminUnit}\n\n` +
                `Cálcio corrigido: ${result.correctedCalcium.toFixed(2)} ${unitLabel}\n` +
                `Correção aplicada: ${result.correctionDirection} ${result.correction.toFixed(2)} ${unitLabel}\n` +
                `Interpretação: ${result.interpretation}\n` +
                `Referência: ${result.normalRange}\n\n` +
                `Recomendações:\n${result.recommendations.map(r => `• ${r}`).join('\n')}`;
    
    navigator.clipboard.writeText(text);
    toast.success('Resultado copiado!');
  };

  const clearInputs = () => {
    setInputs({
      totalCalcium: '',
      albumin: '',
      units: 'mg_dl'
    });
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Cálcio Corrigido pela Albumina
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-blue-600" />
                Fórmula de Correção
              </CardTitle>
              <CardDescription>
                Corrige o cálcio total para albumina normal, essencial na hipoalbuminemia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-mono text-sm font-medium text-blue-800">
                  {inputs.units === 'mg_dl' 
                    ? 'Ca corrigido = Ca total + 0.8 × (4.0 - Albumina)'
                    : 'Ca corrigido = Ca total + 0.02 × (40 - Albumina)'
                  }
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Unidades: {inputs.units === 'mg_dl' ? 'mg/dL e g/dL' : 'mmol/L e g/L'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados do Paciente</CardTitle>
              <CardDescription>
                Insira os valores laboratoriais para calcular o cálcio corrigido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Units Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sistema de Unidades
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="mg_dl"
                      checked={inputs.units === 'mg_dl'}
                      onChange={(e) => handleInputChange('units', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">mg/dL (Convencional)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="mmol_l"
                      checked={inputs.units === 'mmol_l'}
                      onChange={(e) => handleInputChange('units', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">mmol/L (SI)</span>
                  </label>
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cálcio Total ({inputs.units === 'mg_dl' ? 'mg/dL' : 'mmol/L'})
                  </label>
                  <input
                    type="number"
                    value={inputs.totalCalcium}
                    onChange={(e) => handleInputChange('totalCalcium', e.target.value)}
                    className="calculator-input"
                    placeholder={inputs.units === 'mg_dl' ? '9.5' : '2.37'}
                    min={inputs.units === 'mg_dl' ? '5' : '1.25'}
                    max={inputs.units === 'mg_dl' ? '15' : '3.75'}
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Normal: {inputs.units === 'mg_dl' ? '8.5-10.5 mg/dL' : '2.12-2.62 mmol/L'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Albumina ({inputs.units === 'mg_dl' ? 'g/dL' : 'g/L'})
                  </label>
                  <input
                    type="number"
                    value={inputs.albumin}
                    onChange={(e) => handleInputChange('albumin', e.target.value)}
                    className="calculator-input"
                    placeholder={inputs.units === 'mg_dl' ? '4.0' : '40'}
                    min={inputs.units === 'mg_dl' ? '1' : '15'}
                    max={inputs.units === 'mg_dl' ? '6' : '60'}
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Normal: {inputs.units === 'mg_dl' ? '3.5-5.0 g/dL' : '35-50 g/L'}
                  </p>
                </div>
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculate}
                disabled={!inputs.totalCalcium || !inputs.albumin}
                className="calculator-button-primary w-full py-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Calcular Cálcio Corrigido
              </button>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Resultado
                  <Badge 
                    variant={result.interpretation === 'Normal' ? 'default' : 'destructive'}
                    className={result.interpretation === 'Normal' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {result.interpretation}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Cálcio corrigido pela albumina sérica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900">
                    {result.correctedCalcium.toFixed(2)}
                    <span className="text-lg font-normal ml-1">
                      {result.units === 'mg_dl' ? 'mg/dL' : 'mmol/L'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Valor de Referência: {result.normalRange}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <div className="text-sm text-blue-800">
                    <strong>Correção Aplicada:</strong> {result.correctionDirection} {result.correction.toFixed(2)} {result.units === 'mg_dl' ? 'mg/dL' : 'mmol/L'}
                    <br />
                    <span className="text-xs mt-1 block">
                      Cálcio total: {result.totalCalcium} → Cálcio corrigido: {result.correctedCalcium.toFixed(2)}
                    </span>
                  </div>
                </div>

                {result.recommendations.length > 0 && (
                  <div className="bg-amber-900/30 p-4 rounded-lg border-l-4 border-amber-600">
                    <div className="text-sm text-amber-200">
                      <strong>Recomendações Clínicas:</strong>
                      <ul className="mt-2 space-y-1">
                        {result.recommendations.map((rec, index) => (
                          <li key={index} className="text-xs flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {result.warnings.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                    <div className="text-sm text-red-800">
                      <strong>Alertas Clínicos:</strong>
                      <ul className="mt-2 space-y-1">
                        {result.warnings.map((warning, index) => (
                          <li key={index} className="text-xs flex items-start">
                            <span className="mr-2">⚠️</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-700">
                    <p className="font-medium mb-2">Indicações para Correção:</p>
                    <ul className="space-y-1">
                      <li>• Hipoalbuminemia (albumina &lt; 3.5 g/dL ou &lt; 35 g/L)</li>
                      <li>• Suspeita de distúrbio do metabolismo do cálcio</li>
                      <li>• Monitoramento de terapia com cálcio ou vitamina D</li>
                      <li>• Avaliação de pacientes críticos ou desnutridos</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <button
                  onClick={clearInputs}
                  className="calculator-button-secondary flex-1 flex items-center justify-center gap-2 px-4 py-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpar Dados
                </button>
                
                {result && (
                  <button
                    onClick={copyResult}
                    className="calculator-button-primary flex-1 flex items-center justify-center gap-2 px-4 py-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar Resultado
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CorrectedCalcium;