import React, { useState } from 'react';
import { Calculator, Copy, RotateCcw, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Iron Deficit Calculator
 * 
 * Integrates with:
 * - Calculators.jsx for modal display
 * - calculatorStore.js for seeded calculator data
 * - Mobile optimization for touch interfaces
 * 
 * Medical validation:
 * - Essential for iron replacement therapy planning
 * - Uses Ganzoni formula (WHO recommended)
 * - Critical for anemia management
 */
const IronDeficit = ({ open, onOpenChange }) => {
  const [inputs, setInputs] = useState({
    weight: '',
    currentHb: '',
    targetHb: '',
    sex: 'male',
    units: 'g_dl' // g_dl or mmol_l
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

    if (!inputs.weight || inputs.weight < 10 || inputs.weight > 200) {
      errors.push('Peso deve estar entre 10 e 200 kg');
    }

    if (inputs.units === 'g_dl') {
      // g/dL validation
      if (!inputs.currentHb || inputs.currentHb < 3 || inputs.currentHb > 20) {
        errors.push('Hemoglobina atual deve estar entre 3 e 20 g/dL');
      }
      if (!inputs.targetHb || inputs.targetHb < 8 || inputs.targetHb > 18) {
        errors.push('Hemoglobina alvo deve estar entre 8 e 18 g/dL');
      }

      // Medical warnings for g/dL
      if (inputs.currentHb < 7) {
        warnings.push('Anemia severa - considerar transfusão se sintomático');
      }
      if (inputs.targetHb > 15) {
        warnings.push('Alvo de Hb muito alto - risco de sobrecarga de ferro');
      }
    } else {
      // mmol/L validation
      if (!inputs.currentHb || inputs.currentHb < 1.9 || inputs.currentHb > 12.4) {
        errors.push('Hemoglobina atual deve estar entre 1.9 e 12.4 mmol/L');
      }
      if (!inputs.targetHb || inputs.targetHb < 5.0 || inputs.targetHb > 11.2) {
        errors.push('Hemoglobina alvo deve estar entre 5.0 e 11.2 mmol/L');
      }

      // Medical warnings for mmol/L
      if (inputs.currentHb < 4.3) {
        warnings.push('Anemia severa - considerar transfusão se sintomático');
      }
      if (inputs.targetHb > 9.3) {
        warnings.push('Alvo de Hb muito alto - risco de sobrecarga de ferro');
      }
    }

    // Cross-validation
    if (inputs.currentHb && inputs.targetHb && parseFloat(inputs.targetHb) <= parseFloat(inputs.currentHb)) {
      errors.push('Hemoglobina alvo deve ser maior que a atual');
    }

    // Weight-specific warnings
    if (inputs.weight < 20) {
      warnings.push('Peso muito baixo - ajustar dose para pediatria');
    }
    if (inputs.weight > 120) {
      warnings.push('Peso elevado - considerar dose máxima por infusão');
    }

    return { errors, warnings };
  };

  const calculate = () => {
    const validation = validateInputs();
    
    if (validation.errors.length > 0) {
      toast.error(validation.errors[0]);
      return;
    }

    const weight = parseFloat(inputs.weight);
    let currentHb = parseFloat(inputs.currentHb);
    let targetHb = parseFloat(inputs.targetHb);

    // Convert to g/dL if needed for calculation
    if (inputs.units === 'mmol_l') {
      currentHb = currentHb * 1.61; // Convert mmol/L to g/dL
      targetHb = targetHb * 1.61;
    }

    // Ganzoni Formula: Iron deficit (mg) = Weight (kg) × (Target Hb - Current Hb) × 2.4 + Iron stores
    // Iron stores: 500mg for weight >35kg, 15mg/kg for weight ≤35kg
    
    const hbDifference = targetHb - currentHb;
    const ironStores = weight > 35 ? 500 : 15 * weight;
    const ironDeficit = weight * hbDifference * 2.4 + ironStores;

    // Calculate dosing recommendations
    const recommendations = [];
    let dosing = {};

    // Iron sucrose dosing (most common)
    const ironSucrosePerDose = Math.min(200, ironDeficit); // Max 200mg per dose
    const ironSucroseDoses = Math.ceil(ironDeficit / ironSucrosePerDose);
    const ironSucroseFrequency = ironSucroseDoses <= 5 ? '2-3x/semana' : '3x/semana';

    // Iron carboxymaltose dosing (for higher doses)
    const ironCarboxyPerDose = weight < 70 ? Math.min(1000, ironDeficit) : Math.min(1500, ironDeficit);
    const ironCarboxyDoses = Math.ceil(ironDeficit / ironCarboxyPerDose);

    dosing = {
      totalDeficit: ironDeficit,
      ironSucrose: {
        dosePerSession: ironSucrosePerDose,
        numberOfDoses: ironSucroseDoses,
        frequency: ironSucroseFrequency,
        totalDuration: `${Math.ceil(ironSucroseDoses / 2.5)} semanas`
      },
      ironCarboxymaltose: {
        dosePerSession: ironCarboxyPerDose,
        numberOfDoses: ironCarboxyDoses,
        frequency: ironCarboxyDoses === 1 ? 'Dose única' : 'Semanal',
        totalDuration: ironCarboxyDoses === 1 ? '1 dia' : `${ironCarboxyDoses} semanas`
      }
    };

    // Clinical recommendations
    if (ironDeficit > 2000) {
      recommendations.push('Déficit alto - considerar ferro carboximaltose para menos sessões');
    }
    if (ironDeficit < 500) {
      recommendations.push('Déficit baixo - considerar ferro oral se tolerado');
    }
    if (weight < 35) {
      recommendations.push('Paciente pediátrico - ajustar doses conforme protocolo pediátrico');
    }
    if (hbDifference > 5) {
      recommendations.push('Grande diferença de Hb - considerar investigar outras causas de anemia');
    }

    // Monitoring recommendations
    const monitoring = [
      'Reavaliar Hb e ferritina em 4-6 semanas',
      'Monitorar reações adversas durante infusão',
      'Investigar e tratar causa da deficiência de ferro',
      'Considerar suplementação oral de manutenção'
    ];

    setResult({
      ironDeficit: Math.round(ironDeficit),
      dosing,
      recommendations,
      monitoring,
      hbDifference: inputs.units === 'mmol_l' ? (targetHb - currentHb) / 1.61 : hbDifference,
      ironStores,
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
    
    const hbUnit = inputs.units === 'g_dl' ? 'g/dL' : 'mmol/L';
    
    const text = `Cálculo de Déficit de Ferro (Fórmula de Ganzoni)\n` +
                `Peso: ${inputs.weight} kg\n` +
                `Hb atual: ${inputs.currentHb} ${hbUnit}\n` +
                `Hb alvo: ${inputs.targetHb} ${hbUnit}\n` +
                `Sexo: ${inputs.sex === 'male' ? 'Masculino' : 'Feminino'}\n\n` +
                `Déficit total de ferro: ${result.ironDeficit} mg\n\n` +
                `Opções de reposição:\n` +
                `Sacarato de ferro:\n` +
                `• ${result.dosing.ironSucrose.dosePerSession} mg por sessão\n` +
                `• ${result.dosing.ironSucrose.numberOfDoses} sessões\n` +
                `• Frequência: ${result.dosing.ironSucrose.frequency}\n\n` +
                `Carboximaltose férrica:\n` +
                `• ${result.dosing.ironCarboxymaltose.dosePerSession} mg por sessão\n` +
                `• ${result.dosing.ironCarboxymaltose.numberOfDoses} sessões\n` +
                `• Frequência: ${result.dosing.ironCarboxymaltose.frequency}\n\n` +
                `Monitoramento:\n${result.monitoring.map(m => `• ${m}`).join('\n')}`;
    
    navigator.clipboard.writeText(text);
    toast.success('Resultado copiado!');
  };

  const clearInputs = () => {
    setInputs({
      weight: '',
      currentHb: '',
      targetHb: '',
      sex: 'male',
      units: 'g_dl'
    });
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-200" />
            Calculadora de Déficit de Ferro
          </DialogTitle>
          <DialogDescription>
            Cálculo do déficit de ferro usando a Fórmula de Ganzoni (OMS)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formula Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4 text-blue-200" />
                Fórmula de Ganzoni
              </CardTitle>
              <CardDescription>
                Fórmula recomendada pela Organização Mundial da Saúde (OMS)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/50">
                <p className="text-sm font-mono text-blue-200">
                  Déficit = Peso × (Hb alvo - Hb atual) × 2.4 + Estoque de ferro
                </p>
                <p className="text-xs text-blue-300 mt-2">
                  Estoque de ferro: 500mg (peso &gt;35kg) ou 15mg/kg (peso ≤35kg)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Patient Data */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Paciente</CardTitle>
              <CardDescription>
                Insira os dados necessários para o cálculo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Units Selection */}
              <div>
                <Label className="block text-sm font-medium mb-2">
                  Unidades de Hemoglobina
                </Label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="g_dl"
                      checked={inputs.units === 'g_dl'}
                      onChange={(e) => handleInputChange('units', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">g/dL</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">
                    Peso (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    value={inputs.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    placeholder="70"
                    min="10"
                    max="200"
                  />
                </div>

                <div>
                  <Label htmlFor="sex">
                    Sexo
                  </Label>
                  <Select value={inputs.sex} onValueChange={(value) => handleInputChange('sex', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currentHb">
                    Hb atual ({inputs.units === 'g_dl' ? 'g/dL' : 'mmol/L'})
                  </Label>
                  <Input
                    id="currentHb"
                    type="number"
                    value={inputs.currentHb}
                    onChange={(e) => handleInputChange('currentHb', e.target.value)}
                    placeholder={inputs.units === 'g_dl' ? '8.5' : '5.3'}
                    min={inputs.units === 'g_dl' ? '3' : '1.9'}
                    max={inputs.units === 'g_dl' ? '20' : '12.4'}
                    step="0.1"
                  />
                </div>

                <div>
                  <Label htmlFor="targetHb">
                    Hb alvo ({inputs.units === 'g_dl' ? 'g/dL' : 'mmol/L'})
                  </Label>
                  <Input
                    id="targetHb"
                    type="number"
                    value={inputs.targetHb}
                    onChange={(e) => handleInputChange('targetHb', e.target.value)}
                    placeholder={inputs.units === 'g_dl' ? '12.0' : '7.5'}
                    min={inputs.units === 'g_dl' ? '8' : '5.0'}
                    max={inputs.units === 'g_dl' ? '18' : '11.2'}
                    step="0.1"
                  />
                </div>
              </div>

              {/* Calculate Button */}
              <Button
                onClick={calculate}
                disabled={!inputs.weight || !inputs.currentHb || !inputs.targetHb}
                className="w-full"
              >
                Calcular Déficit de Ferro
              </Button>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Resultado do Cálculo
                  <Badge variant="outline" className="bg-blue-900/20 text-blue-200">
                    {result.ironDeficit} mg
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Déficit total de ferro calculado pela Fórmula de Ganzoni
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-200">
                    {result.ironDeficit}
                    <span className="text-lg font-normal ml-1">mg</span>
                  </div>
                  <div className="text-sm text-gray-300 mt-1">
                    Déficit Total de Ferro
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Diferença de Hb: {result.hbDifference.toFixed(1)} {inputs.units === 'g_dl' ? 'g/dL' : 'mmol/L'}
                  </div>
                </div>

                {/* Dosing Options */}
                <div className="space-y-4">
                  <div className="bg-green-900/20 p-4 rounded-lg border-l-4 border-green-400">
                    <div className="text-sm text-green-200">
                      <strong>Sacarato de Ferro (Noripurum®):</strong>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between items-center">
                          <span>• Dose por sessão:</span>
                          <span className="font-medium">{result.dosing.ironSucrose.dosePerSession} mg</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>• Número de sessões:</span>
                          <span className="font-medium">{result.dosing.ironSucrose.numberOfDoses}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>• Frequência:</span>
                          <span className="font-medium">{result.dosing.ironSucrose.frequency}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>• Duração total:</span>
                          <span className="font-medium">{result.dosing.ironSucrose.totalDuration}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-400">
                    <div className="text-sm text-blue-200">
                      <strong>Carboximaltose Férrica (Ferinject®):</strong>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between items-center">
                          <span>• Dose por sessão:</span>
                          <span className="font-medium">{result.dosing.ironCarboxymaltose.dosePerSession} mg</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>• Número de sessões:</span>
                          <span className="font-medium">{result.dosing.ironCarboxymaltose.numberOfDoses}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>• Frequência:</span>
                          <span className="font-medium">{result.dosing.ironCarboxymaltose.frequency}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>• Duração total:</span>
                          <span className="font-medium">{result.dosing.ironCarboxymaltose.totalDuration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {result.recommendations.length > 0 && (
                  <div className="bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-400">
                    <div className="text-sm text-yellow-200">
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

                <div className="bg-purple-900/20 p-4 rounded-lg border-l-4 border-purple-400">
                  <div className="text-sm text-purple-200">
                    <strong>Protocolo de Monitoramento:</strong>
                    <ul className="mt-2 space-y-1">
                      {result.monitoring.map((mon, index) => (
                        <li key={index} className="text-xs flex items-start">
                          <span className="mr-2">📋</span>
                          <span>{mon}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {result.warnings.length > 0 && (
                  <div className="bg-red-900/30 p-4 rounded-lg border-l-4 border-red-400">
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

                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <div className="text-xs text-gray-300">
                    <p className="font-medium mb-2">Informações Adicionais:</p>
                    <ul className="space-y-1">
                      <li>• <strong>Estoque de ferro calculado:</strong> {result.ironStores} mg</li>
                      <li>• <strong>Referência:</strong> Fórmula de Ganzoni (OMS)</li>
                      <li>• <strong>Importante:</strong> Sempre investigar e tratar a causa da deficiência</li>
                      <li>• <strong>Contraindicações:</strong> Hipersensibilidade, sobrecarga de ferro, anemia não ferropriva</li>
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
                <Button
                  onClick={clearInputs}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpar Dados
                </Button>
                
                {result && (
                  <Button
                    onClick={copyResult}
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Resultado
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IronDeficit;