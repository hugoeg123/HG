import React, { useState } from 'react';
import { Calculator, Copy, RotateCcw, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/card';
import { Badge } from '../../../ui/badge';

/**
 * Serum Osmolarity Calculator
 * 
 * Integrates with:
 * - Calculators.jsx for modal display
 * - calculatorStore.js for seeded calculator data
 * - Mobile optimization for touch interfaces
 * 
 * Medical validation:
 * - Essential for evaluating hypo/hypernatremia
 * - Critical for fluid and electrolyte management
 * - Helps identify osmolar gaps
 */
const Osmolarity = ({ open, onOpenChange }) => {
  const [inputs, setInputs] = useState({
    sodium: '',
    glucose: '',
    bun: '', // Blood Urea Nitrogen
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

    // Sodium validation (same for both units)
    if (!inputs.sodium || inputs.sodium < 120 || inputs.sodium > 160) {
      errors.push('Sódio deve estar entre 120 e 160 mEq/L');
    }

    if (inputs.units === 'mg_dl') {
      // mg/dL validation
      if (!inputs.glucose || inputs.glucose < 50 || inputs.glucose > 800) {
        errors.push('Glicose deve estar entre 50 e 800 mg/dL');
      }
      if (!inputs.bun || inputs.bun < 5 || inputs.bun > 150) {
        errors.push('BUN deve estar entre 5 e 150 mg/dL');
      }

      // Medical warnings for mg/dL
      if (inputs.glucose > 250) {
        warnings.push('Hiperglicemia significativa - pode causar desidratação');
      }
      if (inputs.bun > 50) {
        warnings.push('BUN elevado - avaliar função renal');
      }
    } else {
      // mmol/L validation
      if (!inputs.glucose || inputs.glucose < 2.8 || inputs.glucose > 44.4) {
        errors.push('Glicose deve estar entre 2.8 e 44.4 mmol/L');
      }
      if (!inputs.bun || inputs.bun < 1.8 || inputs.bun > 53.6) {
        errors.push('Ureia deve estar entre 1.8 e 53.6 mmol/L');
      }

      // Medical warnings for mmol/L
      if (inputs.glucose > 13.9) {
        warnings.push('Hiperglicemia significativa - pode causar desidratação');
      }
      if (inputs.bun > 17.9) {
        warnings.push('Ureia elevada - avaliar função renal');
      }
    }

    // Sodium-specific warnings
    if (inputs.sodium < 135) {
      warnings.push('Hiponatremia - avaliar osmolalidade e volemia');
    }
    if (inputs.sodium > 145) {
      warnings.push('Hipernatremia - avaliar balanço hídrico');
    }

    return { errors, warnings };
  };

  const calculate = () => {
    const validation = validateInputs();
    
    if (validation.errors.length > 0) {
      toast.error(validation.errors[0]);
      return;
    }

    const sodium = parseFloat(inputs.sodium);
    let glucose = parseFloat(inputs.glucose);
    let bun = parseFloat(inputs.bun);
    let osmolarity;

    if (inputs.units === 'mg_dl') {
      // Formula: 2 × Na + Glucose/18 + BUN/2.8
      osmolarity = 2 * sodium + glucose / 18 + bun / 2.8;
    } else {
      // Formula: 2 × Na + Glucose + Urea
      osmolarity = 2 * sodium + glucose + bun;
    }

    // Interpretation
    let interpretation = '';
    let interpretationColor = '';
    let recommendations = [];
    let osmolarGap = null;
    
    if (osmolarity < 280) {
      interpretation = 'Hipoosmolaridade';
      interpretationColor = 'text-blue-200';
      recommendations = [
        'Avaliar causas de hiponatremia',
        'Verificar osmolalidade sérica medida',
        'Considerar SIADH, polidipsia, diuréticos',
        'Avaliar função renal e adrenal'
      ];
    } else if (osmolarity > 295) {
      interpretation = 'Hiperosmolaridade';
      interpretationColor = 'text-red-200';
      recommendations = [
        'Avaliar desidratação e perdas hídricas',
        'Investigar diabetes insípido',
        'Considerar intoxicação por álcoois',
        'Reposição hídrica cuidadosa se indicada'
      ];
    } else {
      interpretation = 'Normal';
      interpretationColor = 'text-green-200';
      recommendations = [
        'Osmolaridade dentro da normalidade',
        'Manter hidratação adequada',
        'Reavaliar se houver alterações clínicas'
      ];
    }

    // Calculate contributions
    const sodiumContrib = 2 * sodium;
    const glucoseContrib = inputs.units === 'mg_dl' ? glucose / 18 : glucose;
    const bunContrib = inputs.units === 'mg_dl' ? bun / 2.8 : bun;

    // Clinical considerations
    const considerations = [];
    
    if (glucoseContrib > 20) {
      considerations.push('Hiperglicemia contribui significativamente para osmolaridade');
    }
    
    if (bunContrib > 20) {
      considerations.push('Uremia contribui significativamente para osmolaridade');
    }
    
    if (sodiumContrib / osmolarity < 0.85) {
      considerations.push('Contribuição do sódio relativamente baixa - investigar outras causas');
    }

    setResult({
      osmolarity,
      sodiumContrib,
      glucoseContrib,
      bunContrib,
      interpretation,
      interpretationColor,
      recommendations,
      considerations,
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
    
    const glucoseUnit = inputs.units === 'mg_dl' ? 'mg/dL' : 'mmol/L';
    const bunLabel = inputs.units === 'mg_dl' ? 'BUN' : 'Ureia';
    const bunUnit = inputs.units === 'mg_dl' ? 'mg/dL' : 'mmol/L';
    
    const text = `Osmolaridade Sérica Calculada\n` +
                `Sódio: ${inputs.sodium} mEq/L\n` +
                `Glicose: ${inputs.glucose} ${glucoseUnit}\n` +
                `${bunLabel}: ${inputs.bun} ${bunUnit}\n\n` +
                `Osmolaridade: ${result.osmolarity.toFixed(1)} mOsm/kg\n` +
                `Interpretação: ${result.interpretation}\n\n` +
                `Contribuições:\n` +
                `• Sódio: ${result.sodiumContrib.toFixed(1)} mOsm/kg\n` +
                `• Glicose: ${result.glucoseContrib.toFixed(1)} mOsm/kg\n` +
                `• ${bunLabel}: ${result.bunContrib.toFixed(1)} mOsm/kg\n\n` +
                `Recomendações:\n${result.recommendations.map(r => `• ${r}`).join('\n')}`;
    
    navigator.clipboard.writeText(text);
    toast.success('Resultado copiado!');
  };

  const clearInputs = () => {
    setInputs({
      sodium: '',
      glucose: '',
      bun: '',
      units: 'mg_dl'
    });
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-200" />
            Osmolaridade Sérica Calculada
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-blue-200" />
                Fórmula de Cálculo
              </CardTitle>
              <CardDescription>
                Estima osmolaridade sérica para avaliação de distúrbios hidroeletrolíticos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/50">
                <p className="font-mono text-sm font-medium text-blue-200">
                  {inputs.units === 'mg_dl' 
                    ? 'Osmolaridade = 2 × Na + Glicose/18 + BUN/2.8'
                    : 'Osmolaridade = 2 × Na + Glicose + Ureia'
                  }
                </p>
                <p className="text-xs text-blue-200 mt-2">
                  Unidades: mOsm/kg • Referência: 280-295 mOsm/kg
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados Laboratoriais</CardTitle>
              <CardDescription>
                Insira os valores séricos para calcular a osmolaridade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Units Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                  Sódio (mEq/L)
                </label>
                <input
                  type="number"
                  value={inputs.sodium}
                  onChange={(e) => handleInputChange('sodium', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-800 text-gray-200"
                    placeholder="140"
                    min="120"
                    max="160"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Normal: 135-145 mEq/L
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                  Glicose ({inputs.units === 'mg_dl' ? 'mg/dL' : 'mmol/L'})
                </label>
                <input
                  type="number"
                  value={inputs.glucose}
                  onChange={(e) => handleInputChange('glucose', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-800 text-gray-200"
                    placeholder={inputs.units === 'mg_dl' ? '100' : '5.6'}
                    min={inputs.units === 'mg_dl' ? '50' : '2.8'}
                    max={inputs.units === 'mg_dl' ? '800' : '44.4'}
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Normal: {inputs.units === 'mg_dl' ? '70-100 mg/dL' : '3.9-5.6 mmol/L'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                  {inputs.units === 'mg_dl' ? 'BUN (mg/dL)' : 'Ureia (mmol/L)'}
                </label>
                <input
                  type="number"
                  value={inputs.bun}
                  onChange={(e) => handleInputChange('bun', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-800 text-gray-200"
                    placeholder={inputs.units === 'mg_dl' ? '15' : '5.4'}
                    min={inputs.units === 'mg_dl' ? '5' : '1.8'}
                    max={inputs.units === 'mg_dl' ? '150' : '53.6'}
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Normal: {inputs.units === 'mg_dl' ? '7-20 mg/dL' : '2.5-7.1 mmol/L'}
                  </p>
                </div>
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculate}
                disabled={!inputs.sodium || !inputs.glucose || !inputs.bun}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Calcular Osmolaridade Sérica
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
                    className={result.interpretation === 'Normal' ? 'bg-green-900/30 text-green-200 border border-green-700/50' : ''}
                  >
                    {result.interpretation}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Osmolaridade sérica calculada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-gray-900/30 rounded-lg border border-gray-700/50">
                  <div className="text-3xl font-bold text-gray-200">
                    {result.osmolarity.toFixed(1)}
                    <span className="text-lg font-normal ml-1">mOsm/kg</span>
                  </div>
                  <div className="text-sm text-gray-300 mt-1">
                    Valor de Referência: 280-295 mOsm/kg
                  </div>
                </div>

                <div className="bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-400">
                  <div className="text-sm text-blue-200">
                    <strong>Contribuições para Osmolaridade:</strong>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <span>• Sódio:</span>
                        <span className="font-medium">{result.sodiumContrib.toFixed(1)} mOsm/kg ({((result.sodiumContrib/result.osmolarity)*100).toFixed(0)}%)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>• Glicose:</span>
                        <span className="font-medium">{result.glucoseContrib.toFixed(1)} mOsm/kg ({((result.glucoseContrib/result.osmolarity)*100).toFixed(0)}%)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>• {inputs.units === 'mg_dl' ? 'BUN' : 'Ureia'}:</span>
                        <span className="font-medium">{result.bunContrib.toFixed(1)} mOsm/kg ({((result.bunContrib/result.osmolarity)*100).toFixed(0)}%)</span>
                      </div>
                    </div>
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

                {result.considerations.length > 0 && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border-l-4 border-teal-400">
                    <div className="text-sm text-gray-100">
                      <strong>Considerações Clínicas:</strong>
                      <ul className="mt-2 space-y-1">
                        {result.considerations.map((cons, index) => (
                          <li key={index} className="text-xs flex items-start">
                            <span className="mr-2">💡</span>
                            <span>{cons}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {result.warnings.length > 0 && (
                  <div className="bg-red-900/20 p-4 rounded-lg border-l-4 border-red-400">
                    <div className="text-sm text-red-200">
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

                <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                  <div className="text-xs text-gray-200">
                    <p className="font-medium mb-2">Indicações Clínicas:</p>
                    <ul className="space-y-1">
                      <li>• Avaliação de distúrbios de sódio (hipo/hipernatremia)</li>
                      <li>• Suspeita de intoxicação por álcoois ou outras substâncias</li>
                      <li>• Distúrbios do balanço hídrico e eletrolítico</li>
                      <li>• Monitoramento de pacientes em terapia intensiva</li>
                    </ul>
                    <p className="mt-3 text-xs font-medium text-blue-200">
                      💡 Nota: Compare com osmolalidade sérica medida para calcular o gap osmolar
                    </p>
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-300 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpar Dados
                </button>
                
                {result && (
                  <button
                    onClick={copyResult}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-200 bg-blue-900/30 rounded-md hover:bg-blue-900/50 transition-colors"
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

export default Osmolarity;
