import React, { useState } from 'react';
import { Calculator, Droplets, Copy, RotateCcw, Info, AlertTriangle } from 'lucide-react';
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
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../ui/select';

/**
 * Drops to mL/h Converter
 * 
 * Integrates with:
 * - Calculators.jsx for modal display
 * - calculatorStore.js for seeded calculator data
 * - Mobile optimization for touch interfaces
 * 
 * Medical validation:
 * - Essential for IV fluid administration
 * - Converts drop rate to infusion rate
 * - Critical for medication dosing accuracy
 */
const DropsToMLConverter = ({ open, onOpenChange }) => {
  const [inputs, setInputs] = useState({
    dropRate: '',
    dropFactor: '20' // Default: 20 gtt/mL (macrodrip)
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

    // Drop rate validation
    if (!inputs.dropRate || inputs.dropRate < 1 || inputs.dropRate > 300) {
      errors.push('Taxa de gotejamento deve estar entre 1 e 300 gtt/min');
    }

    // Drop factor validation
    if (!inputs.dropFactor || inputs.dropFactor < 1 || inputs.dropFactor > 100) {
      errors.push('Fator de gotejamento deve estar entre 1 e 100 gtt/mL');
    }

    // Medical warnings
    if (inputs.dropRate > 200) {
      warnings.push('Taxa muito alta - verificar prescrição médica');
    }
    if (inputs.dropRate < 5) {
      warnings.push('Taxa muito baixa - risco de obstrução do acesso');
    }
    if (inputs.dropFactor && ![10, 15, 20, 60].includes(parseInt(inputs.dropFactor))) {
      warnings.push('Fator não padrão - verificar especificação do equipo');
    }

    return { errors, warnings };
  };

  const calculate = () => {
    const validation = validateInputs();
    
    if (validation.errors.length > 0) {
      toast.error(validation.errors[0]);
      return;
    }

    const dropRateNum = parseFloat(inputs.dropRate);
    const dropFactorNum = parseFloat(inputs.dropFactor);

    // Formula: mL/h = (gtt/min × 60) / drop factor
    const infusionRate = (dropRateNum * 60) / dropFactorNum;

    // Calculate daily volume
    const dailyVolume = infusionRate * 24;

    // Determine infusion category
    let category = '';
    let categoryColor = '';
    let recommendations = [];

    if (infusionRate < 50) {
      category = 'Manutenção';
      categoryColor = 'text-green-200';
      recommendations.push('Adequado para hidratação de manutenção');
      recommendations.push('Monitorar permeabilidade do acesso venoso');
    } else if (infusionRate < 125) {
      category = 'Moderada';
      categoryColor = 'text-blue-200';
      recommendations.push('Infusão moderada - monitorar balanço hídrico');
      recommendations.push('Avaliar necessidade clínica');
    } else if (infusionRate < 250) {
      category = 'Rápida';
      categoryColor = 'text-orange-200';
      recommendations.push('Infusão rápida - monitorar sinais vitais');
      recommendations.push('Avaliar função cardíaca e renal');
      recommendations.push('Considerar bomba de infusão');
    } else {
      category = 'Muito Rápida';
      categoryColor = 'text-red-200';
      recommendations.push('Infusão muito rápida - supervisão contínua');
      recommendations.push('Obrigatório uso de bomba de infusão');
      recommendations.push('Monitorar sobrecarga volêmica');
      recommendations.push('Avaliar indicação médica');
    }

    // Additional recommendations based on drop factor
    if (dropFactorNum === 60) {
      recommendations.push('Microgotas - maior precisão para baixos volumes');
    } else if (dropFactorNum === 20) {
      recommendations.push('Macrogotas - padrão para adultos');
    } else if (dropFactorNum === 10 || dropFactorNum === 15) {
      recommendations.push('Equipo especial - verificar compatibilidade');
    }

    // Clinical considerations
    const clinicalConsiderations = [
      'Verificar prescrição médica antes da administração',
      'Monitorar sinais de flebite ou infiltração',
      'Avaliar balanço hídrico a cada 6-8 horas',
      'Considerar necessidade de eletrólitos'
    ];

    // Safety alerts
    const safetyAlerts = [];
    if (infusionRate > 200) {
      safetyAlerts.push('Taxa elevada - risco de sobrecarga circulatória');
    }
    if (dailyVolume > 3000) {
      safetyAlerts.push('Volume diário elevado - monitorar função renal');
    }
    if (dropRateNum > 150 && dropFactorNum === 60) {
      safetyAlerts.push('Microgotas em alta velocidade - considerar macrogotas');
    }

    setResult({
      infusionRate: infusionRate,
      dailyVolume: dailyVolume,
      category,
      categoryColor,
      recommendations,
      clinicalConsiderations,
      safetyAlerts,
      warnings: validation.warnings,
      dropRate: dropRateNum,
      dropFactor: dropFactorNum
    });

    // Show warnings if any
    validation.warnings.forEach(warning => {
      toast.warning(warning);
    });
  };

  const copyResult = () => {
    if (!result) return;
    
    const text = `Conversão Gotejamento → mL/h\n` +
                `Taxa de gotejamento: ${result.dropRate} gtt/min\n` +
                `Fator de gotejamento: ${result.dropFactor} gtt/mL\n\n` +
                `Velocidade de infusão: ${result.infusionRate.toFixed(1)} mL/h\n` +
                `Volume diário: ${result.dailyVolume.toFixed(0)} mL/dia\n` +
                `Categoria: ${result.category}\n\n` +
                `Recomendações:\n${result.recommendations.map(r => `• ${r}`).join('\n')}\n\n` +
                `Considerações clínicas:\n${result.clinicalConsiderations.map(c => `• ${c}`).join('\n')}`;
    
    navigator.clipboard.writeText(text);
    toast.success('Resultado copiado!');
  };

  const clearInputs = () => {
    setInputs({
      dropRate: '',
      dropFactor: '20'
    });
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-200" />
            Conversor Gotejamento → mL/h
          </DialogTitle>
          <DialogDescription>
            Converta taxa de gotejamento para velocidade de infusão
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formula Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4 text-blue-200" />
                Fórmula de Conversão
              </CardTitle>
              <CardDescription>
                Conversão padrão para administração de fluidos IV
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/50">
                <p className="text-sm font-mono text-blue-200">
                  mL/h = (gtt/min × 60) ÷ Fator de Gotejamento
                </p>
                <p className="text-xs text-blue-300 mt-2">
                  Onde 60 = minutos por hora
                </p>
              </div>
              
              <div className="bg-green-900/20 p-4 rounded-lg border-l-4 border-green-400">
                <div className="text-sm text-green-200">
                  <p className="font-medium mb-2">Fatores de Gotejamento Padrão:</p>
                  <ul className="text-xs space-y-1">
                    <li>• <strong>Macrogotas:</strong> 20 gtt/mL (adultos)</li>
                    <li>• <strong>Microgotas:</strong> 60 gtt/mL (pediatria/precisão)</li>
                    <li>• <strong>Equipos especiais:</strong> 10-15 gtt/mL</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input Data */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Infusão</CardTitle>
              <CardDescription>
                Insira os parâmetros do gotejamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dropRate">Taxa de Gotejamento (gtt/min)</Label>
                  <Input
                    id="dropRate"
                    type="number"
                    value={inputs.dropRate}
                    onChange={(e) => handleInputChange('dropRate', e.target.value)}
                    placeholder="30"
                    min="1"
                    max="300"
                    step="1"
                  />
                </div>

                <div>
                  <Label htmlFor="dropFactor">Fator de Gotejamento (gtt/mL)</Label>
                  <Select value={inputs.dropFactor} onValueChange={(value) => handleInputChange('dropFactor', value)}>
                    <SelectTrigger id="dropFactor">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 gtt/mL (Equipo especial)</SelectItem>
                      <SelectItem value="15">15 gtt/mL (Equipo especial)</SelectItem>
                      <SelectItem value="20">20 gtt/mL (Macrogotas - Padrão)</SelectItem>
                      <SelectItem value="60">60 gtt/mL (Microgotas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Calculate Button */}
              <Button
                onClick={calculate}
                disabled={!inputs.dropRate || !inputs.dropFactor}
                className="w-full"
              >
                Calcular Velocidade de Infusão
              </Button>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Resultado da Conversão
                  <Badge 
                    variant={result.category === 'Manutenção' ? 'default' : 'destructive'}
                    className={result.category === 'Manutenção' ? 'bg-green-900/20 text-green-200 border-green-400' : 
                              result.category === 'Moderada' ? 'bg-blue-900/20 text-blue-200 border-blue-400' :
                              result.category === 'Rápida' ? 'bg-orange-900/20 text-orange-200 border-orange-400' : 'bg-red-900/30 text-red-200 border-red-400'}
                  >
                    {result.category}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Velocidade de infusão calculada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-200">
                    {result.infusionRate.toFixed(1)}
                    <span className="text-lg font-normal ml-1">mL/h</span>
                  </div>
                  <div className="text-sm text-gray-300 mt-1">
                    Velocidade de Infusão
                  </div>
                </div>

                {/* Additional Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-400">
                    <div className="text-sm text-blue-200">
                      <div className="text-xs text-blue-300">Volume Diário</div>
                      <div className="font-medium text-lg">{result.dailyVolume.toFixed(0)} mL/dia</div>
                    </div>
                  </div>
                  <div className="bg-purple-900/20 p-4 rounded-lg border-l-4 border-purple-400">
                    <div className="text-sm text-purple-200">
                      <div className="text-xs text-purple-300">Equivalente</div>
                      <div className="font-medium text-lg">{(result.dailyVolume/1000).toFixed(1)} L/dia</div>
                    </div>
                  </div>
                </div>

                {result.recommendations.length > 0 && (
                  <div className="bg-green-900/20 p-4 rounded-lg border-l-4 border-green-400">
                    <div className="text-sm text-green-200">
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

                <div className="bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-400">
                  <div className="text-sm text-blue-200">
                    <strong>Considerações Clínicas:</strong>
                    <ul className="mt-2 space-y-1">
                      {result.clinicalConsiderations.map((consideration, index) => (
                        <li key={index} className="text-xs flex items-start">
                          <span className="mr-2">📋</span>
                          <span>{consideration}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {result.safetyAlerts.length > 0 && (
                  <div className="bg-red-900/30 p-4 rounded-lg border-l-4 border-red-400">
                    <div className="text-sm text-red-200">
                      <strong>Alertas de Segurança:</strong>
                      <ul className="mt-2 space-y-1">
                        {result.safetyAlerts.map((alert, index) => (
                          <li key={index} className="text-xs flex items-start">
                            <span className="mr-2">⚠️</span>
                            <span>{alert}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {result.warnings.length > 0 && (
                  <div className="bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-400">
                    <div className="text-sm text-yellow-200">
                      <strong>Avisos:</strong>
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
                    <p className="font-medium mb-2">Referências de Velocidade:</p>
                    <ul className="space-y-1">
                      <li>• <strong>Manutenção:</strong> < 50 mL/h</li>
                      <li>• <strong>Moderada:</strong> 50-125 mL/h</li>
                      <li>• <strong>Rápida:</strong> 125-250 mL/h</li>
                      <li>• <strong>Muito Rápida:</strong> > 250 mL/h</li>
                    </ul>
                    <p className="mt-3 text-xs font-medium text-blue-200">
                      📚 Referência: Diretrizes de Terapia IV - Enfermagem
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

export default DropsToMLConverter;
