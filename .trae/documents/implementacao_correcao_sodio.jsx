import React, { useState, useMemo } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Copy, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";

/**
 * CorrecaoSodio Component - Modal para correção de sódio sérico em hiperglicemia
 * 
 * @component
 * @example
 * return (
 *   <CorrecaoSodio open={true} onOpenChange={setOpen} />
 * )
 * 
 * Integrates with:
 * - components/ui/* para componentes de interface (Dialog, Button, etc.)
 * - Calculators.jsx via propriedades open/onOpenChange
 * 
 * Features:
 * - Cálculo automático do sódio corrigido para hiperglicemia
 * - Opção entre fórmula clássica (1.6) e moderna (2.4)
 * - Interpretação automática dos níveis de sódio
 * - Valores copiáveis para clipboard
 * - Validação de entrada em tempo real
 * 
 * IA prompt: Adicionar histórico de correções, alertas para hiponatremia/hipernatremia, e integração com protocolos de correção
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

function CopyableValue({ label, value, suffix, className = "" }) {
  const text = suffix ? `${value} ${suffix}` : value;
  const [copied, setCopied] = useState(false);
  
  return (
    <div className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${className}`}>
      <div className="flex flex-col">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-lg font-semibold text-white">{text}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 hover:bg-gray-700"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          } catch {
            // Fallback silencioso
          }
        }}
        aria-label={`Copiar ${label}`}
      >
        <Copy className="h-4 w-4" />
      </Button>
      {copied && <span className="text-xs text-green-400 animate-fade-in">Copiado!</span>}
    </div>
  );
}

// Função para interpretar níveis de sódio
function interpretarSodio(sodio) {
  if (!isFinite(sodio) || sodio <= 0) {
    return { categoria: "Inválido", cor: "gray", descricao: "Valor inválido" };
  }
  
  if (sodio < 135) {
    if (sodio < 125) {
      return { 
        categoria: "Hiponatremia Grave", 
        cor: "red", 
        descricao: "Hiponatremia grave - risco de edema cerebral" 
      };
    } else if (sodio < 130) {
      return { 
        categoria: "Hiponatremia Moderada", 
        cor: "orange", 
        descricao: "Hiponatremia moderada - monitorização intensiva" 
      };
    } else {
      return { 
        categoria: "Hiponatremia Leve", 
        cor: "yellow", 
        descricao: "Hiponatremia leve - correção gradual" 
      };
    }
  } else if (sodio <= 145) {
    return { 
      categoria: "Normal", 
      cor: "green", 
      descricao: "Nível de sódio normal" 
    };
  } else if (sodio <= 155) {
    return { 
      categoria: "Hipernatremia Leve", 
      cor: "yellow", 
      descricao: "Hipernatremia leve - hidratação adequada" 
    };
  } else if (sodio <= 165) {
    return { 
      categoria: "Hipernatremia Moderada", 
      cor: "orange", 
      descricao: "Hipernatremia moderada - correção cuidadosa" 
    };
  } else {
    return { 
      categoria: "Hipernatremia Grave", 
      cor: "red", 
      descricao: "Hipernatremia grave - risco neurológico" 
    };
  }
}

export default function CorrecaoSodio({ open, onOpenChange }) {
  // Estados dos inputs
  const [sodioMedido, setSodioMedido] = useState("");
  const [glicemia, setGlicemia] = useState("");
  const [formulaModerna, setFormulaModerna] = useState(false); // false = clássica (1.6), true = moderna (2.4)

  // Validação de inputs
  const isValidSodio = (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 100 && num < 200; // Sódio entre 100 e 200 mEq/L
  };

  const isValidGlicemia = (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 100 && num <= 1000; // Glicemia entre 100 e 1000 mg/dL
  };

  // Cálculos automáticos
  const resultados = useMemo(() => {
    const sodioNum = parseFloat(sodioMedido.replace(",", "."));
    const glicemiaNum = parseFloat(glicemia.replace(",", "."));
    
    if (!isValidSodio(sodioNum) || !isValidGlicemia(glicemiaNum)) {
      return {
        sodioCorrigido: 0,
        diferenca: 0,
        fatorCorrecao: formulaModerna ? 2.4 : 1.6,
        interpretacao: interpretarSodio(0)
      };
    }

    // Fórmula: Na+ corrigido = Na+ medido + [(Glicemia - 100) / 100] × fator
    // Fator clássico: 1.6 mEq/L por cada 100 mg/dL de glicose acima de 100
    // Fator moderno: 2.4 mEq/L (mais preciso segundo estudos recentes)
    const fatorCorrecao = formulaModerna ? 2.4 : 1.6;
    const correcao = ((glicemiaNum - 100) / 100) * fatorCorrecao;
    const sodioCorrigido = sodioNum + correcao;
    const diferenca = correcao;
    const interpretacao = interpretarSodio(sodioCorrigido);

    return {
      sodioCorrigido,
      diferenca,
      fatorCorrecao,
      interpretacao
    };
  }, [sodioMedido, glicemia, formulaModerna]);

  const hasValidInputs = isValidSodio(parseFloat(sodioMedido.replace(",", "."))) && 
                        isValidGlicemia(parseFloat(glicemia.replace(",", ".")));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            Correção de Sódio em Hiperglicemia
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Card de instruções */}
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Como usar</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300">
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Fórmula Clássica:</strong> Na+ corrigido = Na+ medido + [(Glicemia - 100) / 100] × 1.6</li>
                <li><strong>Fórmula Moderna:</strong> Na+ corrigido = Na+ medido + [(Glicemia - 100) / 100] × 2.4</li>
                <li><strong>Indicação:</strong> Pacientes com hiperglicemia (glicemia {'>'} 200 mg/dL)</li>
                <li><strong>Objetivo:</strong> Estimar o sódio sérico real após correção da hiperglicemia</li>
                <li><strong>Importante:</strong> A fórmula moderna (2.4) é mais precisa segundo estudos recentes</li>
              </ul>
            </CardContent>
          </Card>

          {/* Card principal */}
          <Card className="border-gray-700 bg-gray-800/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sodio" className="text-white">Sódio sérico medido</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="sodio"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min="100"
                        max="200"
                        value={sodioMedido}
                        onChange={(e) => setSodioMedido(e.target.value)}
                        className="bg-theme-surface border-gray-600 text-white"
                        placeholder="Ex: 130"
                      />
                      <span className="text-gray-400 text-sm">mEq/L</span>
                    </div>
                    {sodioMedido && !isValidSodio(parseFloat(sodioMedido.replace(",", "."))) && (
                      <p className="text-red-400 text-xs mt-1">Sódio deve estar entre 100 e 200 mEq/L</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="glicemia" className="text-white">Glicemia</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="glicemia"
                        type="number"
                        inputMode="decimal"
                        step="1"
                        min="100"
                        max="1000"
                        value={glicemia}
                        onChange={(e) => setGlicemia(e.target.value)}
                        className="bg-theme-surface border-gray-600 text-white"
                        placeholder="Ex: 400"
                      />
                      <span className="text-gray-400 text-sm">mg/dL</span>
                    </div>
                    {glicemia && !isValidGlicemia(parseFloat(glicemia.replace(",", "."))) && (
                      <p className="text-red-400 text-xs mt-1">Glicemia deve estar entre 100 e 1000 mg/dL</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="formula"
                      checked={formulaModerna}
                      onCheckedChange={setFormulaModerna}
                    />
                    <Label htmlFor="formula" className="text-white">
                      Usar fórmula moderna (fator 2.4)
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Fórmula moderna é mais precisa segundo estudos recentes</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Resultados */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-semibold mb-3">Resultados</h3>
                    <div className="space-y-3">
                      <CopyableValue
                        label="Sódio corrigido"
                        value={formatNumber(resultados.sodioCorrigido, 1)}
                        suffix="mEq/L"
                        className="bg-gray-800/30"
                      />
                      <CopyableValue
                        label="Diferença (correção)"
                        value={`${resultados.diferenca >= 0 ? '+' : ''}${formatNumber(resultados.diferenca, 1)}`}
                        suffix="mEq/L"
                        className="bg-blue-900/30 border-blue-700/50"
                      />
                      
                      {hasValidInputs && (
                        <CopyableValue
                          label="Interpretação"
                          value={resultados.interpretacao.categoria}
                          className={`bg-${resultados.interpretacao.cor}-900/30 border-${resultados.interpretacao.cor}-700/50`}
                        />
                      )}
                    </div>
                  </div>

                  {hasValidInputs && (
                    <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                      <p className="text-blue-200 text-sm">
                        <strong>Fórmula aplicada:</strong><br/>
                        {formatNumber(resultados.sodioCorrigido, 1)} = {sodioMedido} + [({glicemia} - 100) / 100] × {resultados.fatorCorrecao}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Interpretação detalhada */}
              {hasValidInputs && (
                <div className={`mt-6 p-4 bg-${resultados.interpretacao.cor}-900/30 border border-${resultados.interpretacao.cor}-700/50 rounded-lg`}>
                  <h4 className={`text-${resultados.interpretacao.cor}-200 font-semibold mb-2`}>
                    📊 Interpretação Clínica
                  </h4>
                  <p className={`text-${resultados.interpretacao.cor}-200 text-sm mb-2`}>
                    <strong>{resultados.interpretacao.categoria}:</strong> {resultados.interpretacao.descricao}
                  </p>
                  
                  {/* Recomendações específicas */}
                  <div className={`text-${resultados.interpretacao.cor}-200 text-sm`}>
                    {resultados.sodioCorrigido >= 135 && resultados.sodioCorrigido <= 145 && (
                      <p>✅ Sódio corrigido normal. Focar no controle glicêmico.</p>
                    )}
                    {resultados.sodioCorrigido < 135 && resultados.sodioCorrigido >= 130 && (
                      <p>⚠️ Hiponatremia leve. Correção gradual, máximo 8-10 mEq/L/dia.</p>
                    )}
                    {resultados.sodioCorrigido < 130 && resultados.sodioCorrigido >= 125 && (
                      <p>🔶 Hiponatremia moderada. Correção cuidadosa, monitorização neurológica.</p>
                    )}
                    {resultados.sodioCorrigido < 125 && (
                      <p>🔴 Hiponatremia grave. Risco de edema cerebral, correção urgente mas controlada.</p>
                    )}
                    {resultados.sodioCorrigido > 145 && resultados.sodioCorrigido <= 155 && (
                      <p>⚠️ Hipernatremia leve. Hidratação adequada, controle glicêmico.</p>
                    )}
                    {resultados.sodioCorrigido > 155 && (
                      <p>🔴 Hipernatremia significativa. Correção gradual, máximo 0.5 mEq/L/h.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Alertas importantes */}
              {hasValidInputs && (
                <div className="mt-6 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
                  <h4 className="text-yellow-200 font-semibold mb-2">⚠️ Considerações Importantes</h4>
                  <ul className="text-yellow-200 text-sm space-y-1 list-disc pl-5">
                    <li>Esta correção é uma estimativa. Reavaliar após controle glicêmico</li>
                    <li>Correção de sódio deve ser gradual para evitar mielinólise pontina</li>
                    <li>Monitorar função renal e balanço hídrico durante correção</li>
                    <li>Considerar outras causas de hiponatremia além da hiperglicemia</li>
                    {parseFloat(glicemia.replace(",", ".")) > 600 && (
                      <li>Glicemia {'>'} 600 mg/dL: risco de cetoacidose ou estado hiperosmolar</li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referências */}
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Referências</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300">
              <ul className="space-y-1">
                <li>• Katz MA. Hyperglycemia-induced hyponatremia--calculation of expected serum sodium depression. N Engl J Med. 1973.</li>
                <li>• Hillier TA, et al. Hyponatremia: evaluating the correction factor for hyperglycemia. Am J Med. 1999.</li>
                <li>• Adrogué HJ, Madias NE. Hyponatremia. N Engl J Med. 2000.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook: Exportado para uso em Calculators.jsx
// Conector: Integra com sistema de calculadoras via props open/onOpenChange
// Teste: Verificar cálculos com casos conhecidos (Na=130, Glicemia=400, fator=1.6 = 134.8)