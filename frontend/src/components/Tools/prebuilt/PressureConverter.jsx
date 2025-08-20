import React, { useState, useMemo } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Copy, Info, Gauge } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { toast } from 'sonner';

/**
 * PressureConverter Component - Modal para conversão de pressões
 * 
 * @component
 * @example
 * return (
 *   <PressureConverter open={true} onOpenChange={setOpen} />
 * )
 * 
 * Integrates with:
 * - components/ui/* para componentes de interface
 * - Calculators.jsx via propriedades open/onOpenChange
 * - sonner para notificações toast
 * 
 * Features:
 * - Conversão entre mmHg, kPa e cmH2O
 * - Pontos de referência clínicos
 * - Validação de entrada
 * - Valores copiáveis
 * - Interpretação clínica da pressão
 * 
 * IA prompt: Expandir com conversões para atm, bar, psi, histórico de conversões, gráficos de pressão
 */

function formatNumber(n, digits = 1) {
  if (!isFinite(n)) return "--";
  try {
    return new Intl.NumberFormat("pt-BR", { 
      maximumFractionDigits: digits, 
      minimumFractionDigits: digits 
    }).format(n);
  } catch {
    return String(n.toFixed ? n.toFixed(digits) : n);
  }
}

function CopyableValue({ label, value, unit, className = "" }) {
  const copyToClipboard = () => {
    const textToCopy = `${value} ${unit}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success(`${label} copiado: ${textToCopy}`);
    }).catch(() => {
      toast.error('Erro ao copiar valor');
    });
  };

  return (
    <div className={`flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-600 ${className}`}>
      <span className="text-gray-300 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-white font-medium">
          {value} {unit}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-6 w-6 p-0 hover:bg-gray-700"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function PressureConverter({ open, onOpenChange }) {
  const [inputValue, setInputValue] = useState('');
  const [inputUnit, setInputUnit] = useState('mmhg');

  const conversions = useMemo(() => {
    const value = parseFloat(inputValue);
    
    if (!inputValue || isNaN(value) || value < 0) {
      if (inputValue && (isNaN(value) || value < 0)) {
        return { error: "Pressão deve ser um valor positivo" };
      }
      return null;
    }

    // Converter tudo para mmHg primeiro
    let mmhg;
    
    switch (inputUnit) {
      case 'mmhg':
        mmhg = value;
        break;
      case 'kpa':
        mmhg = value * 7.50062; // 1 kPa = 7.50062 mmHg
        break;
      case 'cmh2o':
        mmhg = value * 0.73556; // 1 cmH2O = 0.73556 mmHg
        break;
      default:
        return { error: "Unidade não reconhecida" };
    }

    // Converter de mmHg para outras unidades
    const kpa = mmhg / 7.50062;
    const cmh2o = mmhg / 0.73556;

    return {
      mmhg: formatNumber(mmhg, 1),
      kpa: formatNumber(kpa, 2),
      cmh2o: formatNumber(cmh2o, 1),
      interpretation: getPressureInterpretation(mmhg)
    };
  }, [inputValue, inputUnit]);

  const getPressureInterpretation = (mmhg) => {
    // Interpretação baseada em pressão arterial sistólica
    if (mmhg < 90) {
      return {
        category: "Hipotensão",
        color: "blue",
        severity: mmhg < 70 ? "Grave" : "Moderada",
        description: "Pressão arterial baixa",
        clinicalNote: "Pode indicar choque ou desidratação"
      };
    } else if (mmhg >= 90 && mmhg < 120) {
      return {
        category: "Normal",
        color: "green",
        severity: "Ótima",
        description: "Pressão arterial normal",
        clinicalNote: "Manter estilo de vida saudável"
      };
    } else if (mmhg >= 120 && mmhg < 130) {
      return {
        category: "Normal Limítrofe",
        color: "yellow",
        severity: "Elevada",
        description: "Pressão arterial no limite superior",
        clinicalNote: "Monitorizar e modificar estilo de vida"
      };
    } else if (mmhg >= 130 && mmhg < 140) {
      return {
        category: "Hipertensão Estágio 1",
        color: "orange",
        severity: "Leve",
        description: "Hipertensão arterial leve",
        clinicalNote: "Mudanças no estilo de vida e considerar medicação"
      };
    } else if (mmhg >= 140 && mmhg < 180) {
      return {
        category: "Hipertensão Estágio 2",
        color: "red",
        severity: "Moderada",
        description: "Hipertensão arterial moderada",
        clinicalNote: "Medicação anti-hipertensiva indicada"
      };
    } else if (mmhg >= 180) {
      return {
        category: "Crise Hipertensiva",
        color: "red",
        severity: "Grave",
        description: "Emergência hipertensiva",
        clinicalNote: "Tratamento imediato necessário"
      };
    }

    return null;
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-900/30 border-blue-700/50 text-blue-100",
      green: "bg-green-900/30 border-green-700/50 text-green-100",
      yellow: "bg-yellow-900/30 border-yellow-700/50 text-yellow-100",
      orange: "bg-orange-900/30 border-orange-700/50 text-orange-100",
      red: "bg-red-900/30 border-red-700/50 text-red-100"
    };
    return colors[color] || colors.green;
  };

  const clearForm = () => {
    setInputValue('');
    setInputUnit('mmhg');
    toast.success('Formulário limpo');
  };

  const referencePoints = [
    { 
      name: "Pressão Atmosférica ao Nível do Mar", 
      mmhg: 760, 
      kpa: 101.325, 
      cmh2o: 1033.2,
      context: "Referência padrão"
    },
    { 
      name: "Pressão Arterial Normal (Sistólica)", 
      mmhg: 120, 
      kpa: 16.0, 
      cmh2o: 163.2,
      context: "PA sistólica ideal"
    },
    { 
      name: "Pressão Arterial Normal (Diastólica)", 
      mmhg: 80, 
      kpa: 10.7, 
      cmh2o: 108.8,
      context: "PA diastólica ideal"
    },
    { 
      name: "Pressão Venosa Central Normal", 
      mmhg: 8, 
      kpa: 1.1, 
      cmh2o: 10.9,
      context: "PVC: 2-8 mmHg"
    },
    { 
      name: "Pressão Intracraniana Normal", 
      mmhg: 10, 
      kpa: 1.3, 
      cmh2o: 13.6,
      context: "PIC: 5-15 mmHg"
    },
    { 
      name: "PEEP Típica em VM", 
      mmhg: 7.5, 
      kpa: 1.0, 
      cmh2o: 10.2,
      context: "PEEP: 5-10 cmH2O"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Gauge className="h-6 w-6" />
            Conversor de Pressão
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-5 w-5 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Converte pressões entre mmHg, kPa e cmH2O com interpretação clínica</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Card de Instruções */}
          <Card className="bg-blue-900/20 border-blue-700/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-100 text-base">Instruções</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-200 text-sm space-y-2">
              <p>• Digite o valor da pressão e selecione a unidade de origem</p>
              <p>• A conversão é feita automaticamente para todas as unidades</p>
              <p>• Inclui interpretação clínica para pressões arteriais</p>
              <p>• Clique no ícone de cópia para copiar valores específicos</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white text-lg">Entrada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pressure" className="text-gray-300">Pressão</Label>
                  <Input
                    id="pressure"
                    type="number"
                    step="0.1"
                    min="0"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Digite a pressão"
                  />
                </div>
                
                <div>
                  <Label htmlFor="unit" className="text-gray-300">Unidade</Label>
                  <Select value={inputUnit} onValueChange={setInputUnit}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mmhg">mmHg (milímetros de mercúrio)</SelectItem>
                      <SelectItem value="kpa">kPa (quilopascal)</SelectItem>
                      <SelectItem value="cmh2o">cmH₂O (centímetros de água)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={clearForm}
                  variant="outline" 
                  className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  Limpar
                </Button>
              </CardContent>
            </Card>

            {/* Resultados */}
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white text-lg">Conversões</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {conversions?.error ? (
                  <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
                    <p className="text-red-200 text-sm">{conversions.error}</p>
                  </div>
                ) : conversions ? (
                  <>
                    <CopyableValue
                      label="mmHg"
                      value={conversions.mmhg}
                      unit="mmHg"
                    />
                    <CopyableValue
                      label="kPa"
                      value={conversions.kpa}
                      unit="kPa"
                    />
                    <CopyableValue
                      label="cmH₂O"
                      value={conversions.cmh2o}
                      unit="cmH₂O"
                    />
                    
                    {conversions.interpretation && (
                      <div className={`p-4 rounded-lg border ${getColorClasses(conversions.interpretation.color)}`}>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-lg">{conversions.interpretation.category}</h4>
                            <span className="text-sm font-medium">{conversions.interpretation.severity}</span>
                          </div>
                          <p className="text-sm opacity-90">{conversions.interpretation.description}</p>
                          <p className="text-sm font-medium">{conversions.interpretation.clinicalNote}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                    <p className="text-gray-300 text-sm">Digite uma pressão para ver as conversões</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pontos de Referência */}
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">Pontos de Referência Clínicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {referencePoints.map((point, index) => (
                  <div key={index} className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                    <h4 className="font-semibold text-white text-sm mb-1">{point.name}</h4>
                    <p className="text-xs text-gray-400 mb-2">{point.context}</p>
                    <div className="space-y-1 text-xs text-gray-300">
                      <p>{formatNumber(point.mmhg, 1)} mmHg</p>
                      <p>{formatNumber(point.kpa, 2)} kPa</p>
                      <p>{formatNumber(point.cmh2o, 1)} cmH₂O</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fórmulas e Referências */}
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">Fórmulas de Conversão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Fatores de Conversão</h4>
                  <div className="space-y-1 text-xs">
                    <p>• 1 mmHg = 0.133322 kPa</p>
                    <p>• 1 kPa = 7.50062 mmHg</p>
                    <p>• 1 mmHg = 1.35951 cmH₂O</p>
                    <p>• 1 cmH₂O = 0.73556 mmHg</p>
                    <p>• 1 kPa = 10.1972 cmH₂O</p>
                    <p>• 1 cmH₂O = 0.0980665 kPa</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Aplicações Clínicas</h4>
                  <div className="space-y-1 text-xs">
                    <p>• <strong>mmHg</strong>: Pressão arterial, PIC, PVC</p>
                    <p>• <strong>kPa</strong>: Sistema Internacional (SI)</p>
                    <p>• <strong>cmH₂O</strong>: Ventilação mecânica, PEEP</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-600">
                <h4 className="font-semibold text-white mb-2">Classificação da Pressão Arterial (Sistólica):</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <p>• <span className="text-blue-400">Hipotensão</span>: &lt;90 mmHg</p>
                  <p>• <span className="text-green-400">Normal</span>: 90-119 mmHg</p>
                  <p>• <span className="text-yellow-400">Limítrofe</span>: 120-129 mmHg</p>
                  <p>• <span className="text-orange-400">Hipertensão Estágio 1</span>: 130-139 mmHg</p>
                  <p>• <span className="text-red-400">Hipertensão Estágio 2</span>: 140-179 mmHg</p>
                  <p>• <span className="text-red-400">Crise Hipertensiva</span>: ≥180 mmHg</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}