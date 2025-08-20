import React, { useState, useMemo } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Copy, Info, Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { toast } from 'sonner';

/**
 * IdealPaO2Age Component - Modal para cálculo da PaO2 ideal por idade
 * 
 * @component
 * @example
 * return (
 *   <IdealPaO2Age open={true} onOpenChange={setOpen} />
 * )
 * 
 * Integrates with:
 * - components/ui/* para componentes de interface
 * - Calculators.jsx via propriedades open/onOpenChange
 * - sonner para notificações toast
 * 
 * Features:
 * - Cálculo da PaO2 ideal baseada na idade
 * - Correção por posição (supino/sentado)
 * - Interpretação de hipoxemia
 * - Cálculo do gradiente A-a
 * - Valores copiáveis
 * 
 * IA prompt: Expandir com correções por altitude, FiO2, temperatura, histórico de gasometrias
 */

function formatNumber(n, digits = 0) {
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

function CopyableValue({ label, value, suffix = "", className = "" }) {
  const copyToClipboard = () => {
    const textToCopy = `${value}${suffix}`;
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
          {value}{suffix}
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

export default function IdealPaO2Age({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    age: '',
    position: 'supine',
    actualPaO2: '',
    fiO2: '21',
    paCO2: '40'
  });

  const updateInput = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const results = useMemo(() => {
    const { age, position, actualPaO2, fiO2, paCO2 } = inputs;
    
    if (!age) {
      return null;
    }

    const ageNum = parseFloat(age);
    const actualPaO2Num = actualPaO2 ? parseFloat(actualPaO2) : null;
    const fiO2Num = parseFloat(fiO2) || 21;
    const paCO2Num = parseFloat(paCO2) || 40;

    if (ageNum < 0 || ageNum > 120) {
      return { error: "Idade deve estar entre 0 e 120 anos" };
    }

    if (fiO2Num < 21 || fiO2Num > 100) {
      return { error: "FiO2 deve estar entre 21% e 100%" };
    }

    // Fórmula para PaO2 ideal baseada na idade
    // PaO2 ideal (mmHg) = 104.2 - (0.27 × idade) para posição supina
    // Correção para posição sentada: +4 a +5 mmHg
    
    let idealPaO2Supine = 104.2 - (0.27 * ageNum);
    let idealPaO2 = idealPaO2Supine;
    
    if (position === 'sitting') {
      idealPaO2 = idealPaO2Supine + 4.5; // Correção média para posição sentada
    }

    // Faixa normal (±10 mmHg)
    const lowerNormal = idealPaO2 - 10;
    const upperNormal = idealPaO2 + 10;

    // Cálculo do gradiente A-a (se FiO2 e PaCO2 fornecidos)
    let gradientAa = null;
    let pAO2 = null;
    
    if (actualPaO2Num && fiO2Num && paCO2Num) {
      // PAO2 = (FiO2 × (Patm - PH2O)) - (PaCO2 / RQ)
      // Assumindo: Patm = 760 mmHg, PH2O = 47 mmHg, RQ = 0.8
      const patm = 760;
      const ph2o = 47;
      const rq = 0.8;
      
      pAO2 = ((fiO2Num / 100) * (patm - ph2o)) - (paCO2Num / rq);
      gradientAa = pAO2 - actualPaO2Num;
    }

    // Interpretação da hipoxemia
    let hypoxemiaInterpretation = null;
    if (actualPaO2Num) {
      hypoxemiaInterpretation = getHypoxemiaInterpretation(actualPaO2Num, ageNum);
    }

    // Interpretação do gradiente A-a
    let gradientInterpretation = null;
    if (gradientAa !== null) {
      gradientInterpretation = getGradientInterpretation(gradientAa, ageNum);
    }

    return {
      idealPaO2: formatNumber(idealPaO2, 0),
      idealPaO2Supine: formatNumber(idealPaO2Supine, 0),
      lowerNormal: formatNumber(lowerNormal, 0),
      upperNormal: formatNumber(upperNormal, 0),
      pAO2: pAO2 ? formatNumber(pAO2, 0) : null,
      gradientAa: gradientAa ? formatNumber(gradientAa, 0) : null,
      hypoxemiaInterpretation,
      gradientInterpretation
    };
  }, [inputs]);

  const getHypoxemiaInterpretation = (paO2, age) => {
    const idealPaO2 = 104.2 - (0.27 * age);
    const lowerLimit = idealPaO2 - 10;
    
    if (paO2 >= lowerLimit) {
      return {
        category: "Normal",
        color: "green",
        description: "PaO2 dentro da faixa normal para a idade",
        severity: "Sem hipoxemia"
      };
    } else if (paO2 >= 80) {
      return {
        category: "Hipoxemia Leve",
        color: "yellow",
        description: "Redução leve da oxigenação",
        severity: "Leve"
      };
    } else if (paO2 >= 60) {
      return {
        category: "Hipoxemia Moderada",
        color: "orange",
        description: "Redução moderada da oxigenação",
        severity: "Moderada"
      };
    } else if (paO2 >= 40) {
      return {
        category: "Hipoxemia Grave",
        color: "red",
        description: "Redução grave da oxigenação",
        severity: "Grave"
      };
    } else {
      return {
        category: "Hipoxemia Crítica",
        color: "red",
        description: "Hipoxemia potencialmente letal",
        severity: "Crítica"
      };
    }
  };

  const getGradientInterpretation = (gradient, age) => {
    // Gradiente A-a normal: (idade/4) + 4
    const normalGradient = (age / 4) + 4;
    
    if (gradient <= normalGradient) {
      return {
        category: "Normal",
        color: "green",
        description: "Gradiente A-a dentro do esperado",
        mechanism: "Sem alteração significativa da troca gasosa"
      };
    } else if (gradient <= normalGradient * 2) {
      return {
        category: "Levemente Aumentado",
        color: "yellow",
        description: "Aumento leve do gradiente A-a",
        mechanism: "Possível alteração V/Q ou shunt mínimo"
      };
    } else if (gradient <= normalGradient * 3) {
      return {
        category: "Moderadamente Aumentado",
        color: "orange",
        description: "Aumento moderado do gradiente A-a",
        mechanism: "Alteração V/Q ou shunt intrapulmonar"
      };
    } else {
      return {
        category: "Gravemente Aumentado",
        color: "red",
        description: "Aumento grave do gradiente A-a",
        mechanism: "Shunt significativo ou doença pulmonar grave"
      };
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      green: "bg-green-900/30 border-green-700/50 text-green-100",
      yellow: "bg-yellow-900/30 border-yellow-700/50 text-yellow-100",
      orange: "bg-orange-900/30 border-orange-700/50 text-orange-100",
      red: "bg-red-900/30 border-red-700/50 text-red-100"
    };
    return colors[color] || colors.green;
  };

  const clearForm = () => {
    setInputs({
      age: '',
      position: 'supine',
      actualPaO2: '',
      fiO2: '21',
      paCO2: '40'
    });
    toast.success('Formulário limpo');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Activity className="h-6 w-6" />
            PaO₂ Ideal por Idade
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-5 w-5 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Calcula a PaO₂ ideal baseada na idade com correções por posição e interpretação de hipoxemia</p>
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
              <p>• Digite a idade do paciente para calcular a PaO₂ ideal</p>
              <p>• Selecione a posição durante a coleta (supino ou sentado)</p>
              <p>• Opcionalmente, forneça PaO₂ atual, FiO₂ e PaCO₂ para análise completa</p>
              <p>• Baseado na fórmula: PaO₂ ideal = 104.2 - (0.27 × idade)</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs */}
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white text-lg">Dados do Paciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age" className="text-gray-300">Idade (anos) *</Label>
                    <Input
                      id="age"
                      type="number"
                      min="0"
                      max="120"
                      value={inputs.age}
                      onChange={(e) => updateInput('age', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="0-120"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position" className="text-gray-300">Posição</Label>
                    <Select value={inputs.position} onValueChange={(value) => updateInput('position', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supine">Supino (deitado)</SelectItem>
                        <SelectItem value="sitting">Sentado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-600">
                  <h4 className="text-white font-medium">Dados da Gasometria (Opcional)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="actualPaO2" className="text-gray-300">PaO₂ Atual (mmHg)</Label>
                      <Input
                        id="actualPaO2"
                        type="number"
                        min="0"
                        max="600"
                        value={inputs.actualPaO2}
                        onChange={(e) => updateInput('actualPaO2', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Ex: 85"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fiO2" className="text-gray-300">FiO₂ (%)</Label>
                      <Input
                        id="fiO2"
                        type="number"
                        min="21"
                        max="100"
                        value={inputs.fiO2}
                        onChange={(e) => updateInput('fiO2', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="21-100"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="paCO2" className="text-gray-300">PaCO₂ (mmHg)</Label>
                    <Input
                      id="paCO2"
                      type="number"
                      min="10"
                      max="100"
                      value={inputs.paCO2}
                      onChange={(e) => updateInput('paCO2', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Ex: 40"
                    />
                  </div>
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
                <CardTitle className="text-white text-lg">Resultados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results?.error ? (
                  <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
                    <p className="text-red-200 text-sm">{results.error}</p>
                  </div>
                ) : results ? (
                  <>
                    <CopyableValue
                      label="PaO₂ Ideal"
                      value={results.idealPaO2}
                      suffix=" mmHg"
                    />
                    
                    {inputs.position === 'sitting' && (
                      <CopyableValue
                        label="PaO₂ Ideal (Supino)"
                        value={results.idealPaO2Supine}
                        suffix=" mmHg"
                      />
                    )}
                    
                    <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                      <p className="text-gray-300 text-sm mb-1">Faixa Normal</p>
                      <p className="text-white font-mono">
                        {results.lowerNormal} - {results.upperNormal} mmHg
                      </p>
                    </div>

                    {results.pAO2 && (
                      <CopyableValue
                        label="PAO₂ (Alveolar)"
                        value={results.pAO2}
                        suffix=" mmHg"
                      />
                    )}

                    {results.gradientAa && (
                      <CopyableValue
                        label="Gradiente A-a"
                        value={results.gradientAa}
                        suffix=" mmHg"
                      />
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                    <p className="text-gray-300 text-sm">Digite a idade para calcular a PaO₂ ideal</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Interpretações */}
          {(results?.hypoxemiaInterpretation || results?.gradientInterpretation) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {results.hypoxemiaInterpretation && (
                <Card className="bg-gray-800/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Interpretação da PaO₂</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`p-4 rounded-lg border ${getColorClasses(results.hypoxemiaInterpretation.color)}`}>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-lg">{results.hypoxemiaInterpretation.category}</h4>
                          <span className="text-sm font-medium">{results.hypoxemiaInterpretation.severity}</span>
                        </div>
                        <p className="text-sm opacity-90">{results.hypoxemiaInterpretation.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {results.gradientInterpretation && (
                <Card className="bg-gray-800/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Interpretação do Gradiente A-a</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`p-4 rounded-lg border ${getColorClasses(results.gradientInterpretation.color)}`}>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-lg">{results.gradientInterpretation.category}</h4>
                        <p className="text-sm opacity-90">{results.gradientInterpretation.description}</p>
                        <p className="text-sm font-medium">{results.gradientInterpretation.mechanism}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Fórmulas e Referências */}
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">Fórmulas e Interpretação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Fórmulas:</h4>
                  <div className="space-y-1 text-xs">
                    <p>• PaO₂ ideal = 104.2 - (0.27 × idade)</p>
                    <p>• Correção sentado: +4 a +5 mmHg</p>
                    <p>• Faixa normal: ±10 mmHg</p>
                    <p>• PAO₂ = (FiO₂ × (760-47)) - (PaCO₂/0.8)</p>
                    <p>• Gradiente A-a = PAO₂ - PaO₂</p>
                    <p>• Gradiente normal = (idade/4) + 4</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Classificação da Hipoxemia:</h4>
                  <div className="space-y-1 text-xs">
                    <p>• <span className="text-green-400">Normal</span>: PaO₂ ≥ (ideal - 10)</p>
                    <p>• <span className="text-yellow-400">Leve</span>: PaO₂ 60-80 mmHg</p>
                    <p>• <span className="text-orange-400">Moderada</span>: PaO₂ 40-60 mmHg</p>
                    <p>• <span className="text-red-400">Grave</span>: PaO₂ &lt;40 mmHg</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-600">
                <h4 className="font-semibold text-white mb-2">Considerações Clínicas:</h4>
                <div className="space-y-1 text-xs">
                  <p>• A PaO₂ diminui aproximadamente 0.27 mmHg por ano de idade</p>
                  <p>• Posição sentada aumenta a PaO₂ em 4-5 mmHg comparado ao supino</p>
                  <p>• Gradiente A-a aumentado sugere doença pulmonar ou shunt</p>
                  <p>• Valores normais assumem nível do mar e ar ambiente (FiO₂ 21%)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}