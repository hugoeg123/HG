import React, { useState } from 'react';
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
import { Calculator, Copy, RotateCcw, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Fractional Excretion of Sodium (FeNa) Calculator
 * 
 * Integrates with:
 * - Calculators.jsx for modal display
 * - calculatorStore.js for seeded calculator data
 * - Mobile optimization for touch interfaces
 * 
 * Medical validation:
 * - Gold standard for differentiating prerenal vs intrinsic AKI
 * - Critical for emergency and nephrology practice
 * - Accounts for diuretic use limitations
 */
const FeNa = ({ open, onOpenChange }) => {
  const [inputs, setInputs] = useState({
    serumSodium: '',
    urineSodium: '',
    serumCreatinine: '',
    urineCreatinine: '',
    onDiuretics: false
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

    if (!inputs.serumSodium || inputs.serumSodium < 120 || inputs.serumSodium > 160) {
      errors.push('Sódio sérico deve estar entre 120 e 160 mEq/L');
    }

    if (!inputs.urineSodium || inputs.urineSodium < 1 || inputs.urineSodium > 300) {
      errors.push('Sódio urinário deve estar entre 1 e 300 mEq/L');
    }

    if (!inputs.serumCreatinine || inputs.serumCreatinine < 0.1 || inputs.serumCreatinine > 20) {
      errors.push('Creatinina sérica deve estar entre 0.1 e 20 mg/dL');
    }

    if (!inputs.urineCreatinine || inputs.urineCreatinine < 1 || inputs.urineCreatinine > 500) {
      errors.push('Creatinina urinária deve estar entre 1 e 500 mg/dL');
    }

    // Medical warnings
    if (inputs.onDiuretics) {
      warnings.push('Paciente em uso de diuréticos - FeNa pode ser falsamente elevada');
    }

    if (inputs.urineSodium < 10) {
      warnings.push('Sódio urinário muito baixo - sugere forte retenção de sódio');
    }

    if (inputs.serumCreatinine > 5) {
      warnings.push('Creatinina muito elevada - verificar se coleta está correta');
    }

    return { errors, warnings };
  };

  const calculate = () => {
    const validation = validateInputs();
    
    if (validation.errors.length > 0) {
      toast.error(validation.errors[0]);
      return;
    }

    const serumNa = parseFloat(inputs.serumSodium);
    const urineNa = parseFloat(inputs.urineSodium);
    const serumCr = parseFloat(inputs.serumCreatinine);
    const urineCr = parseFloat(inputs.urineCreatinine);

    // FeNa formula: (UNa/SNa) / (UCr/SCr) × 100
    const feNa = ((urineNa / serumNa) / (urineCr / serumCr)) * 100;

    // Interpretation
    let interpretation = '';
    let interpretationColor = '';
    let likelihood = '';
    let recommendations = [];
    
    if (feNa < 1) {
      interpretation = 'FeNa < 1%';
      interpretationColor = 'text-green-200';
      likelihood = 'Sugere causa pré-renal';
      recommendations = [
        'Avaliar volemia e perfusão renal',
        'Considerar reposição volêmica se indicado',
        'Investigar causas de hipoperfusão',
        'Monitorar resposta à reposição de volume'
      ];
    } else if (feNa >= 1 && feNa < 2) {
      interpretation = 'FeNa 1-2%';
      interpretationColor = 'text-yellow-200';
      likelihood = 'Zona intermediária - avaliar contexto clínico';
      recommendations = [
        'Correlacionar com quadro clínico',
        'Considerar outros marcadores (FeUrea)',
        'Avaliar histórico de nefrotóxicos',
        'Repetir exames se necessário'
      ];
    } else {
      interpretation = 'FeNa ≥ 2%';
      interpretationColor = 'text-red-200';
      likelihood = 'Sugere necrose tubular aguda ou causa intrínseca';
      recommendations = [
        'Investigar causas intrínsecas de LRA',
        'Avaliar exposição a nefrotóxicos',
        'Considerar biópsia renal se indicado',
        'Suporte conservador da função renal'
      ];
    }

    // Additional considerations
    const considerations = [];
    
    if (inputs.onDiuretics) {
      considerations.push('FeUrea pode ser mais útil em pacientes usando diuréticos');
    }
    
    if (feNa < 1 && inputs.urineSodium > 40) {
      considerations.push('FeNa baixa com sódio urinário elevado - avaliar contexto');
    }

    setResult({
      feNa: feNa,
      interpretation,
      interpretationColor,
      likelihood,
      recommendations,
      considerations,
      warnings: validation.warnings
    });

    // Show warnings if any
    validation.warnings.forEach(warning => {
      toast.warning(warning);
    });
  };

  const copyResult = () => {
    if (!result) return;
    
    const text = `Fração de Excreção de Sódio (FeNa)\n` +
                `Sódio sérico: ${inputs.serumSodium} mEq/L\n` +
                `Sódio urinário: ${inputs.urineSodium} mEq/L\n` +
                `Creatinina sérica: ${inputs.serumCreatinine} mg/dL\n` +
                `Creatinina urinária: ${inputs.urineCreatinine} mg/dL\n` +
                `Diuréticos: ${inputs.onDiuretics ? 'Sim' : 'Não'}\n\n` +
                `FeNa: ${result.feNa.toFixed(2)}%\n` +
                `Interpretação: ${result.interpretation}\n` +
                `${result.likelihood}\n\n` +
                `Recomendações:\n${result.recommendations.map(r => `• ${r}`).join('\n')}`;
    
    navigator.clipboard.writeText(text);
    toast.success('Resultado copiado!');
  };

  const clearInputs = () => {
    setInputs({
      serumSodium: '',
      urineSodium: '',
      serumCreatinine: '',
      urineCreatinine: '',
      onDiuretics: false
    });
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            FeNa - Fração de Excreção de Sódio
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Laboratoriais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-700/50">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-200 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-200">
                    <p className="font-medium mb-1">FeNa = (UNa/SNa) / (UCr/SCr) × 100</p>
                    <p className="text-xs">
                      Diferencia causa pré-renal (&lt;1%) de necrose tubular aguda (≥2%)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="serumSodium">Na+ sérico (mEq/L)</Label>
                  <Input
                    id="serumSodium"
                    type="number"
                    value={inputs.serumSodium}
                    onChange={(e) => handleInputChange('serumSodium', e.target.value)}
                    placeholder="140"
                    min="120"
                    max="160"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urineSodium">Na+ urinário (mEq/L)</Label>
                  <Input
                    id="urineSodium"
                    type="number"
                    value={inputs.urineSodium}
                    onChange={(e) => handleInputChange('urineSodium', e.target.value)}
                    placeholder="20"
                    min="1"
                    max="300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="serumCreatinine">Creatinina sérica (mg/dL)</Label>
                  <Input
                    id="serumCreatinine"
                    type="number"
                    value={inputs.serumCreatinine}
                    onChange={(e) => handleInputChange('serumCreatinine', e.target.value)}
                    placeholder="1.2"
                    min="0.1"
                    max="20"
                    step="0.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urineCreatinine">Creatinina urinária (mg/dL)</Label>
                  <Input
                    id="urineCreatinine"
                    type="number"
                    value={inputs.urineCreatinine}
                    onChange={(e) => handleInputChange('urineCreatinine', e.target.value)}
                    placeholder="80"
                    min="1"
                    max="500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="diuretics"
                  checked={inputs.onDiuretics}
                  onChange={(e) => handleInputChange('onDiuretics', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="diuretics">Paciente em uso de diuréticos</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={calculate} className="flex-1" disabled={!inputs.serumSodium || !inputs.urineSodium || !inputs.serumCreatinine || !inputs.urineCreatinine}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular
                </Button>
                <Button variant="outline" onClick={clearInputs}>
                  <RotateCcw className="h-4 w-4 mr-2" />
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
                {result && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyResult}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="text-center p-4 rounded-lg border bg-blue-900/20 border-blue-700/50">
                    <div className="text-3xl font-bold text-blue-200">
                      {result.feNa.toFixed(2)}%
                    </div>
                    <div className={`text-sm font-medium ${result.interpretationColor}`}>
                      {result.interpretation}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      {result.likelihood}
                    </div>
                  </div>

                  {result.recommendations.length > 0 && (
                    <div className="p-3 rounded-lg border bg-green-900/20 border-green-700/50">
                      <h4 className="font-semibold text-green-200 mb-2">Recomendações:</h4>
                      <ul className="text-sm text-green-300 space-y-1">
                        {result.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.considerations.length > 0 && (
                    <div className="p-3 rounded-lg border bg-amber-900/20 border-amber-700/50">
                      <h4 className="font-semibold text-amber-200 mb-2">Considerações:</h4>
                      <ul className="text-sm text-amber-300 space-y-1">
                        {result.considerations.map((cons, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{cons}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.warnings.length > 0 && (
                    <div className="p-3 rounded-lg border bg-red-900/30 border-red-700/50">
                      <h4 className="font-semibold text-red-200 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Atenção:
                      </h4>
                      <ul className="text-sm text-red-300 space-y-1">
                        {result.warnings.map((warning, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-3 rounded-lg border bg-gray-800/50 border-gray-600/50">
                    <h4 className="font-semibold text-gray-200 mb-2">Interpretação:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• &lt;1%: Pré-renal (desidratação, ICC, etc.)</li>
                      <li>• 1-2%: Zona intermediária</li>
                      <li>• ≥2%: Intrínseca (NTA, nefrite, etc.)</li>
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
      </DialogContent>
    </Dialog>
  );
};

export default FeNa;
