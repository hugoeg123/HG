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
 * Fractional Excretion of Urea (FeUrea) Calculator
 * 
 * Integrates with:
 * - Calculators.jsx for modal display
 * - calculatorStore.js for seeded calculator data
 * - Mobile optimization for touch interfaces
 * 
 * Medical validation:
 * - More reliable than FeNa in patients on diuretics
 * - Useful alternative for AKI differentiation
 * - Less affected by diuretic therapy
 */
const FeUrea = ({ open, onOpenChange }) => {
  const [inputs, setInputs] = useState({
    serumUrea: '',
    urineUrea: '',
    serumCreatinine: '',
    urineCreatinine: ''
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

    if (!inputs.serumUrea || inputs.serumUrea < 5 || inputs.serumUrea > 300) {
      errors.push('Ureia sérica deve estar entre 5 e 300 mg/dL');
    }

    if (!inputs.urineUrea || inputs.urineUrea < 50 || inputs.urineUrea > 5000) {
      errors.push('Ureia urinária deve estar entre 50 e 5000 mg/dL');
    }

    if (!inputs.serumCreatinine || inputs.serumCreatinine < 0.1 || inputs.serumCreatinine > 20) {
      errors.push('Creatinina sérica deve estar entre 0.1 e 20 mg/dL');
    }

    if (!inputs.urineCreatinine || inputs.urineCreatinine < 1 || inputs.urineCreatinine > 500) {
      errors.push('Creatinina urinária deve estar entre 1 e 500 mg/dL');
    }

    // Medical warnings
    if (inputs.serumUrea > 100) {
      warnings.push('Ureia muito elevada - verificar se há uremia');
    }

    if (inputs.serumCreatinine > 5) {
      warnings.push('Creatinina muito elevada - verificar se coleta está correta');
    }

    // Check ratio consistency
    const ureaRatio = parseFloat(inputs.urineUrea) / parseFloat(inputs.serumUrea);
    const creatinineRatio = parseFloat(inputs.urineCreatinine) / parseFloat(inputs.serumCreatinine);
    
    if (ureaRatio < creatinineRatio * 0.1) {
      warnings.push('Razão ureia/creatinina inconsistente - verificar valores');
    }

    return { errors, warnings };
  };

  const calculate = () => {
    const validation = validateInputs();
    
    if (validation.errors.length > 0) {
      toast.error(validation.errors[0]);
      return;
    }

    const serumUrea = parseFloat(inputs.serumUrea);
    const urineUrea = parseFloat(inputs.urineUrea);
    const serumCr = parseFloat(inputs.serumCreatinine);
    const urineCr = parseFloat(inputs.urineCreatinine);

    // FeUrea formula: (UUrea/SUrea) / (UCr/SCr) × 100
    const feUrea = ((urineUrea / serumUrea) / (urineCr / serumCr)) * 100;

    // Interpretation
    let interpretation = '';
    let interpretationColor = '';
    let likelihood = '';
    let recommendations = [];
    let advantages = [];
    
    if (feUrea < 35) {
      interpretation = 'FeUrea < 35%';
      interpretationColor = 'text-green-200';
      likelihood = 'Sugere causa pré-renal';
      recommendations = [
        'Avaliar status volêmico do paciente',
        'Considerar reposição volêmica se indicado',
        'Investigar causas de hipoperfusão renal',
        'Monitorar resposta à terapia de reposição'
      ];
    } else if (feUrea >= 35 && feUrea < 50) {
      interpretation = 'FeUrea 35-50%';
      interpretationColor = 'text-yellow-200';
      likelihood = 'Zona intermediária - avaliar contexto clínico';
      recommendations = [
        'Correlacionar com quadro clínico completo',
        'Considerar outros marcadores diagnósticos',
        'Avaliar histórico de exposição a nefrotóxicos',
        'Repetir avaliação laboratorial se necessário'
      ];
    } else {
      interpretation = 'FeUrea ≥ 50%';
      interpretationColor = 'text-amber-200';
      likelihood = 'Sugere necrose tubular aguda ou causa intrínseca';
      recommendations = [
        'Investigar causas intrínsecas de lesão renal',
        'Revisar medicações nefrotóxicas',
        'Considerar avaliação nefrológica',
        'Implementar medidas de neuroproteção'
      ];
    }

    // Advantages of FeUrea over FeNa
    advantages = [
      'Menos afetada pelo uso de diuréticos',
      'Mais confiável em pacientes com ICC',
      'Útil quando FeNa está na zona intermediária',
      'Melhor performance em idosos'
    ];

    setResult({
      feUrea: feUrea,
      interpretation,
      interpretationColor,
      likelihood,
      recommendations,
      advantages,
      warnings: validation.warnings
    });

    // Show warnings if any
    validation.warnings.forEach(warning => {
      toast.warning(warning);
    });
  };

  const copyResult = () => {
    if (!result) return;
    
    const text = `Fração de Excreção de Ureia (FeUrea)\n` +
                `Ureia sérica: ${inputs.serumUrea} mg/dL\n` +
                `Ureia urinária: ${inputs.urineUrea} mg/dL\n` +
                `Creatinina sérica: ${inputs.serumCreatinine} mg/dL\n` +
                `Creatinina urinária: ${inputs.urineCreatinine} mg/dL\n\n` +
                `FeUrea: ${result.feUrea.toFixed(1)}%\n` +
                `Interpretação: ${result.interpretation}\n` +
                `${result.likelihood}\n\n` +
                `Recomendações:\n${result.recommendations.map(r => `• ${r}`).join('\n')}`;
    
    navigator.clipboard.writeText(text);
    toast.success('Resultado copiado!');
  };

  const clearInputs = () => {
    setInputs({
      serumUrea: '',
      urineUrea: '',
      serumCreatinine: '',
      urineCreatinine: ''
    });
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            FeUrea - Fração de Excreção de Ureia
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Laboratoriais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
          {/* Formula Info */}
          <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-700/50">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-200 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">FeUrea = (UUrea/SUrea) / (UCr/SCr) × 100</p>
                <p className="text-xs">
                  Alternativa à FeNa, especialmente útil em pacientes usando diuréticos
                </p>
              </div>
            </div>
          </div>

          {/* Input Fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="serumUrea">Ureia sérica (mg/dL)</Label>
                <Input
                  id="serumUrea"
                  type="number"
                  value={inputs.serumUrea}
                  onChange={(e) => handleInputChange('serumUrea', e.target.value)}
                  placeholder="40"
                  min="5"
                  max="300"
                />
              </div>

              <div>
                <Label htmlFor="urineUrea">Ureia urinária (mg/dL)</Label>
                <Input
                  id="urineUrea"
                  type="number"
                  value={inputs.urineUrea}
                  onChange={(e) => handleInputChange('urineUrea', e.target.value)}
                  placeholder="800"
                  min="50"
                  max="5000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
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

              <div>
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
          </div>

          {/* Calculate Button */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={calculate} 
              className="flex-1" 
              disabled={!inputs.serumUrea || !inputs.urineUrea || !inputs.serumCreatinine || !inputs.urineCreatinine}
            >
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
                      {result.feUrea.toFixed(1)}%
                    </div>
                    <div className={`text-sm font-medium ${result.interpretationColor}`}>
                      {result.interpretation}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      {result.likelihood}
                    </div>
                  </div>

                  {result.recommendations.length > 0 && (
                    <div className="p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
                      <h4 className="font-semibold text-blue-200 mb-2">Recomendações:</h4>
                      <ul className="text-sm text-blue-300 space-y-1">
                        {result.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.advantages.length > 0 && (
                    <div className="p-3 rounded-lg border bg-green-900/20 border-green-700/50">
                      <h4 className="font-semibold text-green-200 mb-2">Vantagens da FeUrea:</h4>
                      <ul className="text-sm text-green-300 space-y-1">
                        {result.advantages.map((adv, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{adv}</span>
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
                      <li>• &lt;35%: Pré-renal (desidratação, ICC, etc.)</li>
                      <li>• 35-50%: Zona intermediária</li>
                      <li>• ≥50%: Intrínseca (NTA, nefrite, etc.)</li>
                    </ul>
                    <p className="text-xs text-gray-400 mt-2">
                      <strong>Nota:</strong> Menos afetada por diuréticos que FeNa
                    </p>
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

export default FeUrea;
