import React, { useState, useMemo } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Copy, Info, Thermometer } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { toast } from 'sonner';

/**
 * TemperatureConverter Component - Modal para conversão de temperaturas
 * 
 * @component
 * @example
 * return (
 *   <TemperatureConverter open={true} onOpenChange={setOpen} />
 * )
 * 
 * Integrates with:
 * - components/ui/* para componentes de interface
 * - Calculators.jsx via propriedades open/onOpenChange
 * - sonner para notificações toast
 * 
 * Features:
 * - Conversão entre Celsius, Fahrenheit e Kelvin
 * - Pontos de referência clínicos
 * - Validação de entrada
 * - Valores copiáveis
 * - Interpretação clínica da temperatura
 * 
 * IA prompt: Expandir com conversões para Rankine, Réaumur, histórico de conversões, gráficos de temperatura
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
    const textToCopy = `${value}${unit}`;
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
          {value}{unit}
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

export default function TemperatureConverter({ open, onOpenChange }) {
  const [inputValue, setInputValue] = useState('');
  const [inputUnit, setInputUnit] = useState('celsius');

  const conversions = useMemo(() => {
    const value = parseFloat(inputValue);
    
    if (!inputValue || isNaN(value)) {
      return null;
    }

    // Validação de limites físicos
    let celsius;
    
    switch (inputUnit) {
      case 'celsius':
        celsius = value;
        if (celsius < -273.15) {
          return { error: "Temperatura não pode ser menor que -273.15°C (zero absoluto)" };
        }
        break;
      case 'fahrenheit':
        celsius = (value - 32) * 5/9;
        if (value < -459.67) {
          return { error: "Temperatura não pode ser menor que -459.67°F (zero absoluto)" };
        }
        break;
      case 'kelvin':
        celsius = value - 273.15;
        if (value < 0) {
          return { error: "Temperatura em Kelvin não pode ser negativa" };
        }
        break;
      default:
        return { error: "Unidade não reconhecida" };
    }

    const fahrenheit = (celsius * 9/5) + 32;
    const kelvin = celsius + 273.15;

    return {
      celsius: formatNumber(celsius, 1),
      fahrenheit: formatNumber(fahrenheit, 1),
      kelvin: formatNumber(kelvin, 1),
      interpretation: getTemperatureInterpretation(celsius)
    };
  }, [inputValue, inputUnit]);

  const getTemperatureInterpretation = (celsius) => {
    if (celsius < 35.0) {
      return {
        category: "Hipotermia",
        color: "blue",
        severity: celsius < 32 ? "Grave" : celsius < 35 ? "Moderada" : "Leve",
        description: "Temperatura corporal abaixo do normal",
        clinicalNote: "Requer aquecimento e monitorização"
      };
    } else if (celsius >= 35.0 && celsius <= 37.5) {
      return {
        category: "Normal",
        color: "green",
        severity: "Fisiológica",
        description: "Temperatura corporal dentro da faixa normal",
        clinicalNote: "Sem intervenção necessária"
      };
    } else if (celsius > 37.5 && celsius <= 38.5) {
      return {
        category: "Febre Baixa",
        color: "yellow",
        severity: "Leve",
        description: "Elevação leve da temperatura corporal",
        clinicalNote: "Monitorizar e considerar antitérmicos"
      };
    } else if (celsius > 38.5 && celsius <= 40.0) {
      return {
        category: "Febre Moderada",
        color: "orange",
        severity: "Moderada",
        description: "Febre significativa",
        clinicalNote: "Antitérmicos indicados, investigar causa"
      };
    } else if (celsius > 40.0 && celsius <= 42.0) {
      return {
        category: "Febre Alta",
        color: "red",
        severity: "Grave",
        description: "Hipertermia significativa",
        clinicalNote: "Resfriamento ativo e investigação urgente"
      };
    } else {
      return {
        category: "Hipertermia Extrema",
        color: "red",
        severity: "Crítica",
        description: "Temperatura potencialmente letal",
        clinicalNote: "Emergência médica - resfriamento imediato"
      };
    }
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
    setInputUnit('celsius');
    toast.success('Formulário limpo');
  };

  const referencePoints = [
    { name: "Zero Absoluto", celsius: -273.15, fahrenheit: -459.67, kelvin: 0 },
    { name: "Ponto de Congelamento da Água", celsius: 0, fahrenheit: 32, kelvin: 273.15 },
    { name: "Temperatura Corporal Normal", celsius: 37, fahrenheit: 98.6, kelvin: 310.15 },
    { name: "Ponto de Ebulição da Água", celsius: 100, fahrenheit: 212, kelvin: 373.15 }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Thermometer className="h-6 w-6" />
            Conversor de Temperatura
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-5 w-5 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Converte temperaturas entre Celsius, Fahrenheit e Kelvin com interpretação clínica</p>
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
              <p>• Digite o valor da temperatura e selecione a unidade de origem</p>
              <p>• A conversão é feita automaticamente para todas as escalas</p>
              <p>• Inclui interpretação clínica para temperaturas corporais</p>
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
                  <Label htmlFor="temperature" className="text-gray-300">Temperatura</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Digite a temperatura"
                  />
                </div>
                
                <div>
                  <Label htmlFor="unit" className="text-gray-300">Unidade</Label>
                  <Select value={inputUnit} onValueChange={setInputUnit}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="celsius">Celsius (°C)</SelectItem>
                      <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                      <SelectItem value="kelvin">Kelvin (K)</SelectItem>
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
                      label="Celsius"
                      value={conversions.celsius}
                      unit=" °C"
                    />
                    <CopyableValue
                      label="Fahrenheit"
                      value={conversions.fahrenheit}
                      unit=" °F"
                    />
                    <CopyableValue
                      label="Kelvin"
                      value={conversions.kelvin}
                      unit=" K"
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
                    <p className="text-gray-300 text-sm">Digite uma temperatura para ver as conversões</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pontos de Referência */}
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">Pontos de Referência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referencePoints.map((point, index) => (
                  <div key={index} className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                    <h4 className="font-semibold text-white text-sm mb-2">{point.name}</h4>
                    <div className="space-y-1 text-xs text-gray-300">
                      <p>{formatNumber(point.celsius, 1)}°C</p>
                      <p>{formatNumber(point.fahrenheit, 1)}°F</p>
                      <p>{formatNumber(point.kelvin, 1)}K</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fórmulas */}
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">Fórmulas de Conversão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Celsius ↔ Fahrenheit</h4>
                  <p>°F = (°C × 9/5) + 32</p>
                  <p>°C = (°F - 32) × 5/9</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Celsius ↔ Kelvin</h4>
                  <p>K = °C + 273.15</p>
                  <p>°C = K - 273.15</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Fahrenheit ↔ Kelvin</h4>
                  <p>K = (°F - 32) × 5/9 + 273.15</p>
                  <p>°F = (K - 273.15) × 9/5 + 32</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-600">
                <h4 className="font-semibold text-white mb-2">Interpretação Clínica (Temperatura Corporal):</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <p>• <span className="text-blue-400">Hipotermia</span>: &lt;35°C (&lt;95°F)</p>
                  <p>• <span className="text-green-400">Normal</span>: 35-37.5°C (95-99.5°F)</p>
                  <p>• <span className="text-yellow-400">Febre baixa</span>: 37.5-38.5°C (99.5-101.3°F)</p>
                  <p>• <span className="text-orange-400">Febre moderada</span>: 38.5-40°C (101.3-104°F)</p>
                  <p>• <span className="text-red-400">Febre alta</span>: 40-42°C (104-107.6°F)</p>
                  <p>• <span className="text-red-400">Hipertermia extrema</span>: &gt;42°C (&gt;107.6°F)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
