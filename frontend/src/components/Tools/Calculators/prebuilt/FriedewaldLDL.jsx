import React, { useState } from 'react';
import { Calculator, Copy, RotateCcw, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../ui/card';
import { Badge } from '../../../ui/badge';

/**
 * Friedewald LDL Calculator
 * 
 * Integrates with:
 * - Calculators.jsx for modal display
 * - calculatorStore.js for seeded calculator data
 * - Mobile optimization for touch interfaces
 * 
 * Medical validation:
 * - Essential for cardiovascular risk assessment
 * - Uses Friedewald equation (standard clinical formula)
 * - Critical for lipid profile interpretation
 */
const FriedewaldLDL = ({ open, onOpenChange }) => {
  const [inputs, setInputs] = useState({
    totalCholesterol: '',
    hdlCholesterol: '',
    triglycerides: '',
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
      if (!inputs.totalCholesterol || inputs.totalCholesterol < 50 || inputs.totalCholesterol > 800) {
        errors.push('Colesterol total deve estar entre 50 e 800 mg/dL');
      }
      if (!inputs.hdlCholesterol || inputs.hdlCholesterol < 10 || inputs.hdlCholesterol > 150) {
        errors.push('HDL-colesterol deve estar entre 10 e 150 mg/dL');
      }
      if (!inputs.triglycerides || inputs.triglycerides < 30 || inputs.triglycerides > 2000) {
        errors.push('Triglicérides devem estar entre 30 e 2000 mg/dL');
      }

      // Friedewald limitation - triglycerides > 400 mg/dL
      if (inputs.triglycerides > 400) {
        errors.push('Fórmula de Friedewald não é válida para triglicérides > 400 mg/dL');
      }

      // Medical warnings for mg/dL
      if (inputs.triglycerides > 300) {
        warnings.push('Triglicérides elevados - considerar dosagem direta do LDL');
      }
      if (inputs.hdlCholesterol < 40) {
        warnings.push('HDL baixo - fator de risco cardiovascular');
      }
      if (inputs.totalCholesterol > 240) {
        warnings.push('Colesterol total elevado - risco cardiovascular aumentado');
      }
    } else {
      // mmol/L validation
      if (!inputs.totalCholesterol || inputs.totalCholesterol < 1.3 || inputs.totalCholesterol > 20.7) {
        errors.push('Colesterol total deve estar entre 1.3 e 20.7 mmol/L');
      }
      if (!inputs.hdlCholesterol || inputs.hdlCholesterol < 0.26 || inputs.hdlCholesterol > 3.9) {
        errors.push('HDL-colesterol deve estar entre 0.26 e 3.9 mmol/L');
      }
      if (!inputs.triglycerides || inputs.triglycerides < 0.34 || inputs.triglycerides > 22.6) {
        errors.push('Triglicérides devem estar entre 0.34 e 22.6 mmol/L');
      }

      // Friedewald limitation - triglycerides > 4.5 mmol/L (≈400 mg/dL)
      if (inputs.triglycerides > 4.5) {
        errors.push('Fórmula de Friedewald não é válida para triglicérides > 4.5 mmol/L');
      }

      // Medical warnings for mmol/L
      if (inputs.triglycerides > 3.4) {
        warnings.push('Triglicérides elevados - considerar dosagem direta do LDL');
      }
      if (inputs.hdlCholesterol < 1.0) {
        warnings.push('HDL baixo - fator de risco cardiovascular');
      }
      if (inputs.totalCholesterol > 6.2) {
        warnings.push('Colesterol total elevado - risco cardiovascular aumentado');
      }
    }

    // Cross-validation
    if (inputs.hdlCholesterol && inputs.totalCholesterol && 
        parseFloat(inputs.hdlCholesterol) >= parseFloat(inputs.totalCholesterol)) {
      errors.push('HDL não pode ser maior ou igual ao colesterol total');
    }

    return { errors, warnings };
  };

  const calculate = () => {
    const validation = validateInputs();
    
    if (validation.errors.length > 0) {
      toast.error(validation.errors[0]);
      return;
    }

    let totalChol = parseFloat(inputs.totalCholesterol);
    let hdlChol = parseFloat(inputs.hdlCholesterol);
    let triglyc = parseFloat(inputs.triglycerides);

    // Convert to mg/dL if needed for calculation
    if (inputs.units === 'mmol_l') {
      totalChol = totalChol * 38.67; // Convert mmol/L to mg/dL
      hdlChol = hdlChol * 38.67;
      triglyc = triglyc * 88.57; // Different conversion factor for triglycerides
    }

    // Friedewald Formula: LDL = Total Cholesterol - HDL - (Triglycerides/5)
    // Note: Triglycerides/5 estimates VLDL cholesterol
    const vldlChol = triglyc / 5;
    const ldlChol = totalChol - hdlChol - vldlChol;

    // Convert back to original units if needed
    let finalLDL = ldlChol;
    let finalVLDL = vldlChol;
    if (inputs.units === 'mmol_l') {
      finalLDL = ldlChol / 38.67;
      finalVLDL = vldlChol / 38.67;
    }

    // Calculate non-HDL cholesterol
    const nonHDL = inputs.units === 'mmol_l' ? 
      (totalChol - hdlChol) / 38.67 * 38.67 : 
      totalChol - hdlChol;

    // Risk stratification based on LDL levels
    let riskCategory = '';
    let riskColor = '';
    let recommendations = [];

    if (inputs.units === 'mg_dl') {
      if (ldlChol < 100) {
        riskCategory = 'Ótimo';
        riskColor = 'text-green-200';
        recommendations.push('Manter estilo de vida saudável');
      } else if (ldlChol < 130) {
        riskCategory = 'Próximo do ótimo';
        riskColor = 'text-amber-200';
        recommendations.push('Considerar mudanças no estilo de vida');
      } else if (ldlChol < 160) {
        riskCategory = 'Limítrofe alto';
        riskColor = 'text-orange-200';
        recommendations.push('Mudanças no estilo de vida necessárias');
        recommendations.push('Avaliar outros fatores de risco');
      } else if (ldlChol < 190) {
        riskCategory = 'Alto';
        riskColor = 'text-red-200';
        recommendations.push('Terapia medicamentosa indicada');
        recommendations.push('Mudanças intensivas no estilo de vida');
      } else {
        riskCategory = 'Muito alto';
        riskColor = 'text-red-200';
        recommendations.push('Terapia medicamentosa urgente');
        recommendations.push('Avaliação cardiológica');
      }
    } else {
      // mmol/L thresholds
      if (finalLDL < 2.6) {
        riskCategory = 'Ótimo';
        riskColor = 'text-green-200';
        recommendations.push('Manter estilo de vida saudável');
      } else if (finalLDL < 3.4) {
        riskCategory = 'Próximo do ótimo';
        riskColor = 'text-amber-200';
        recommendations.push('Considerar mudanças no estilo de vida');
      } else if (finalLDL < 4.1) {
        riskCategory = 'Limítrofe alto';
        riskColor = 'text-orange-200';
        recommendations.push('Mudanças no estilo de vida necessárias');
        recommendations.push('Avaliar outros fatores de risco');
      } else if (finalLDL < 4.9) {
        riskCategory = 'Alto';
        riskColor = 'text-red-200';
        recommendations.push('Terapia medicamentosa indicada');
        recommendations.push('Mudanças intensivas no estilo de vida');
      } else {
        riskCategory = 'Muito alto';
        riskColor = 'text-red-200';
        recommendations.push('Terapia medicamentosa urgente');
        recommendations.push('Avaliação cardiológica');
      }
    }

    // Additional recommendations based on other lipid parameters
    if (inputs.units === 'mg_dl') {
      if (hdlChol < 40) {
        recommendations.push('HDL baixo - aumentar atividade física');
      }
      if (triglyc > 150) {
        recommendations.push('Triglicérides elevados - reduzir carboidratos');
      }
      if (nonHDL > 130) {
        recommendations.push('Não-HDL elevado - considerar terapia combinada');
      }
    } else {
      if (hdlChol < 1.0) {
        recommendations.push('HDL baixo - aumentar atividade física');
      }
      if (triglyc > 1.7) {
        recommendations.push('Triglicérides elevados - reduzir carboidratos');
      }
      if ((totalChol - hdlChol) > 3.4) {
        recommendations.push('Não-HDL elevado - considerar terapia combinada');
      }
    }

    // Clinical notes
    const clinicalNotes = [
      'Fórmula válida apenas para triglicérides < 400 mg/dL (4.5 mmol/L)',
      'Considerar dosagem direta do LDL se triglicérides > 300 mg/dL',
      'Avaliar risco cardiovascular global (Framingham, ASCVD)',
      'Jejum de 12h recomendado para maior precisão'
    ];

    setResult({
      ldlCholesterol: finalLDL,
      vldlCholesterol: finalVLDL,
      nonHDLCholesterol: inputs.units === 'mmol_l' ? (totalChol - hdlChol) / 38.67 : totalChol - hdlChol,
      riskCategory,
      riskColor,
      recommendations,
      clinicalNotes,
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
    
    const unit = inputs.units === 'mg_dl' ? 'mg/dL' : 'mmol/L';
    
    const text = `Cálculo de LDL-Colesterol (Fórmula de Friedewald)\n` +
                `Colesterol total: ${inputs.totalCholesterol} ${unit}\n` +
                `HDL-colesterol: ${inputs.hdlCholesterol} ${unit}\n` +
                `Triglicérides: ${inputs.triglycerides} ${unit}\n\n` +
                `LDL-colesterol: ${result.ldlCholesterol.toFixed(1)} ${unit}\n` +
                `VLDL-colesterol: ${result.vldlCholesterol.toFixed(1)} ${unit}\n` +
                `Não-HDL colesterol: ${result.nonHDLCholesterol.toFixed(1)} ${unit}\n\n` +
                `Classificação: ${result.riskCategory}\n\n` +
                `Recomendações:\n${result.recommendations.map(r => `• ${r}`).join('\n')}\n\n` +
                `Observações clínicas:\n${result.clinicalNotes.map(n => `• ${n}`).join('\n')}`;
    
    navigator.clipboard.writeText(text);
    toast.success('Resultado copiado!');
  };

  const clearInputs = () => {
    setInputs({
      totalCholesterol: '',
      hdlCholesterol: '',
      triglycerides: '',
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
            Calculadora de LDL-Colesterol (Friedewald)
          </DialogTitle>
          <DialogDescription>
            Cálculo do LDL-colesterol usando a Fórmula de Friedewald
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formula Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4 text-blue-600" />
                Fórmula de Friedewald
              </CardTitle>
              <CardDescription>
                Método padrão para estimativa do LDL-colesterol
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-mono text-blue-800">
                  LDL = Colesterol Total - HDL - (Triglicérides ÷ 5)
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Onde Triglicérides/5 estima o VLDL-colesterol
                </p>
              </div>
              
              {/* Limitation Warning */}
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Limitação Importante</p>
                    <p className="text-xs">
                      Não válida para triglicérides &gt; 400 mg/dL (4.5 mmol/L)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient Data */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Laboratoriais</CardTitle>
              <CardDescription>
                Insira os valores do perfil lipídico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Units Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidades
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
                    <span className="text-sm">mg/dL</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="mmol_l"
                      checked={inputs.units === 'mmol_l'}
                      onChange={(e) => handleInputChange('units', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">mmol/L</span>
                  </label>
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Colesterol Total ({inputs.units === 'mg_dl' ? 'mg/dL' : 'mmol/L'})
                  </label>
                  <input
                    type="number"
                    value={inputs.totalCholesterol}
                    onChange={(e) => handleInputChange('totalCholesterol', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={inputs.units === 'mg_dl' ? '200' : '5.2'}
                    min={inputs.units === 'mg_dl' ? '50' : '1.3'}
                    max={inputs.units === 'mg_dl' ? '800' : '20.7'}
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HDL-Colesterol ({inputs.units === 'mg_dl' ? 'mg/dL' : 'mmol/L'})
                  </label>
                  <input
                    type="number"
                    value={inputs.hdlCholesterol}
                    onChange={(e) => handleInputChange('hdlCholesterol', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={inputs.units === 'mg_dl' ? '50' : '1.3'}
                    min={inputs.units === 'mg_dl' ? '10' : '0.26'}
                    max={inputs.units === 'mg_dl' ? '150' : '3.9'}
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Triglicérides ({inputs.units === 'mg_dl' ? 'mg/dL' : 'mmol/L'})
                  </label>
                  <input
                    type="number"
                    value={inputs.triglycerides}
                    onChange={(e) => handleInputChange('triglycerides', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={inputs.units === 'mg_dl' ? '150' : '1.7'}
                    min={inputs.units === 'mg_dl' ? '30' : '0.34'}
                    max={inputs.units === 'mg_dl' ? '400' : '4.5'}
                    step="0.1"
                  />
                </div>
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculate}
                disabled={!inputs.totalCholesterol || !inputs.hdlCholesterol || !inputs.triglycerides}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Calcular LDL-Colesterol
              </button>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Resultado do Cálculo
                  <Badge 
                    variant={result.riskCategory === 'Ótimo' ? 'default' : 'destructive'}
                    className={result.riskCategory === 'Ótimo' ? 'bg-green-100 text-green-800' : 
                              result.riskCategory === 'Próximo do ótimo' ? 'bg-yellow-100 text-yellow-800' :
                              result.riskCategory === 'Limítrofe alto' ? 'bg-orange-100 text-orange-800' : ''}
                  >
                    {result.riskCategory}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  LDL-colesterol calculado pela Fórmula de Friedewald
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900">
                    {result.ldlCholesterol.toFixed(1)}
                    <span className="text-lg font-normal ml-1">{inputs.units === 'mg_dl' ? 'mg/dL' : 'mmol/L'}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    LDL-Colesterol
                  </div>
                </div>

                {/* Additional Results */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                    <div className="text-sm text-blue-800">
                      <div className="text-xs text-blue-600">VLDL-Colesterol</div>
                      <div className="font-medium text-lg">{result.vldlCholesterol.toFixed(1)} {inputs.units === 'mg_dl' ? 'mg/dL' : 'mmol/L'}</div>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                    <div className="text-sm text-purple-800">
                      <div className="text-xs text-purple-600">Não-HDL Colesterol</div>
                      <div className="font-medium text-lg">{result.nonHDLCholesterol.toFixed(1)} {inputs.units === 'mg_dl' ? 'mg/dL' : 'mmol/L'}</div>
                    </div>
                  </div>
                </div>

                {result.recommendations.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                    <div className="text-sm text-green-800">
                      <strong>Recomendações Clínicas:</strong>
                      <ul className="mt-2 space-y-1">
                        {result.recommendations.map((rec, index) => (
                          <li key={index} className="text-xs flex items-start">
                            <span className="mr-2">💡</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <div className="text-sm text-blue-800">
                    <strong>Observações Clínicas:</strong>
                    <ul className="mt-2 space-y-1">
                      {result.clinicalNotes.map((note, index) => (
                        <li key={index} className="text-xs flex items-start">
                          <span className="mr-2">📋</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

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
                    <p className="font-medium mb-2">Valores de Referência (mg/dL):</p>
                    <ul className="space-y-1">
                      <li>• <strong>Ótimo:</strong> &lt; 100 mg/dL (&lt; 2.6 mmol/L)</li>
                      <li>• <strong>Próximo do ótimo:</strong> 100-129 mg/dL (2.6-3.3 mmol/L)</li>
                      <li>• <strong>Limítrofe alto:</strong> 130-159 mg/dL (3.4-4.0 mmol/L)</li>
                      <li>• <strong>Alto:</strong> 160-189 mg/dL (4.1-4.8 mmol/L)</li>
                      <li>• <strong>Muito alto:</strong> ≥ 190 mg/dL (≥ 4.9 mmol/L)</li>
                    </ul>
                    <p className="mt-3 text-xs font-medium text-blue-700">
                      📚 Referência: Friedewald et al. Clin Chem 1972
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpar Dados
                </button>
                
                {result && (
                  <button
                    onClick={copyResult}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
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

export default FriedewaldLDL;
