import React, { useState, useMemo } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Copy, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";

/**
 * PaO2FiO2 Component - Modal para cálculo da relação PaO2/FiO2 (Índice de Kirby)
 * 
 * @component
 * @example
 * return (
 *   <PaO2FiO2 open={true} onOpenChange={setOpen} />
 * )
 * 
 * Integrates with:
 * - components/ui/* para componentes de interface (Dialog, Button, etc.)
 * - Calculators.jsx via propriedades open/onOpenChange
 * 
 * Features:
 * - Cálculo automático da relação PaO2/FiO2
 * - Interpretação clínica automática (Normal, SDRA leve/moderada/grave)
 * - Conversão automática de FiO2 entre decimal e percentual
 * - Valores copiáveis para clipboard
 * - Validação de entrada em tempo real
 * 
 * IA prompt: Adicionar histórico de medições, gráficos de tendência, e integração com ventilação mecânica
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

// Função para interpretar o resultado da relação PaO2/FiO2
function interpretarRelacao(relacao) {
  if (!isFinite(relacao) || relacao <= 0) {
    return { categoria: "Inválido", cor: "gray", descricao: "Valores inválidos" };
  }
  
  if (relacao >= 400) {
    return { 
      categoria: "Normal", 
      cor: "green", 
      descricao: "Função pulmonar normal" 
    };
  } else if (relacao >= 300) {
    return { 
      categoria: "SDRA Leve", 
      cor: "yellow", 
      descricao: "Síndrome do Desconforto Respiratório Agudo Leve" 
    };
  } else if (relacao >= 200) {
    return { 
      categoria: "SDRA Moderada", 
      cor: "orange", 
      descricao: "Síndrome do Desconforto Respiratório Agudo Moderada" 
    };
  } else if (relacao >= 100) {
    return { 
      categoria: "SDRA Grave", 
      cor: "red", 
      descricao: "Síndrome do Desconforto Respiratório Agudo Grave" 
    };
  } else {
    return { 
      categoria: "SDRA Muito Grave", 
      cor: "red", 
      descricao: "Insuficiência respiratória muito grave" 
    };
  }
}

export default function PaO2FiO2({ open, onOpenChange }) {
  // Estados dos inputs
  const [pao2, setPao2] = useState("");
  const [fio2, setFio2] = useState("");
  const [fio2Tipo, setFio2Tipo] = useState("decimal"); // "decimal" ou "percentual"

  // Validação de inputs
  const isValidPaO2 = (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 && num <= 800; // PaO2 entre 0 e 800 mmHg
  };

  const isValidFiO2 = (value, tipo) => {
    const num = parseFloat(value);
    if (tipo === "decimal") {
      return !isNaN(num) && num >= 0.21 && num <= 1.0; // FiO2 entre 0.21 e 1.0
    } else {
      return !isNaN(num) && num >= 21 && num <= 100; // FiO2 entre 21% e 100%
    }
  };

  // Cálculos automáticos
  const resultados = useMemo(() => {
    const pao2Num = parseFloat(pao2.replace(",", "."));
    let fio2Num = parseFloat(fio2.replace(",", "."));
    
    if (!isValidPaO2(pao2Num) || !isValidFiO2(fio2Num, fio2Tipo)) {
      return {
        relacao: 0,
        fio2Decimal: 0,
        fio2Percentual: 0,
        interpretacao: interpretarRelacao(0)
      };
    }

    // Converter FiO2 para decimal se necessário
    if (fio2Tipo === "percentual") {
      fio2Num = fio2Num / 100;
    }

    const relacao = pao2Num / fio2Num;
    const interpretacao = interpretarRelacao(relacao);

    return {
      relacao,
      fio2Decimal: fio2Num,
      fio2Percentual: fio2Num * 100,
      interpretacao
    };
  }, [pao2, fio2, fio2Tipo]);

  const hasValidInputs = isValidPaO2(parseFloat(pao2.replace(",", "."))) && 
                        isValidFiO2(parseFloat(fio2.replace(",", ".")), fio2Tipo);

  // Função para alternar tipo de FiO2
  const toggleFiO2Tipo = () => {
    const novoTipo = fio2Tipo === "decimal" ? "percentual" : "decimal";
    setFio2Tipo(novoTipo);
    
    // Converter valor atual se válido
    const fio2Num = parseFloat(fio2.replace(",", "."));
    if (isValidFiO2(fio2Num, fio2Tipo)) {
      if (novoTipo === "percentual") {
        setFio2((fio2Num * 100).toString());
      } else {
        setFio2((fio2Num / 100).toString());
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            Relação PaO2/FiO2 (Índice de Kirby)
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
                <li><strong>Fórmula:</strong> PaO2/FiO2 = PaO2 (mmHg) ÷ FiO2 (decimal)</li>
                <li><strong>Normal:</strong> ≥ 400 (função pulmonar normal)</li>
                <li><strong>SDRA Leve:</strong> 300-399 (lesão pulmonar leve)</li>
                <li><strong>SDRA Moderada:</strong> 200-299 (lesão pulmonar moderada)</li>
                <li><strong>SDRA Grave:</strong> 100-199 (lesão pulmonar grave)</li>
                <li><strong>Muito Grave:</strong> {'<'} 100 (insuficiência respiratória crítica)</li>
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
                    <Label htmlFor="pao2" className="text-white">PaO2 (Pressão arterial de oxigênio)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="pao2"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min="0"
                        max="800"
                        value={pao2}
                        onChange={(e) => setPao2(e.target.value)}
                        className="bg-theme-surface border-gray-600 text-white"
                        placeholder="Ex: 80"
                      />
                      <span className="text-gray-400 text-sm">mmHg</span>
                    </div>
                    {pao2 && !isValidPaO2(parseFloat(pao2.replace(",", "."))) && (
                      <p className="text-red-400 text-xs mt-1">PaO2 deve estar entre 0 e 800 mmHg</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="fio2" className="text-white">FiO2 (Fração inspirada de oxigênio)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleFiO2Tipo}
                        className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        {fio2Tipo === "decimal" ? "Decimal" : "Percentual"}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="fio2"
                        type="number"
                        inputMode="decimal"
                        step={fio2Tipo === "decimal" ? "0.01" : "1"}
                        min={fio2Tipo === "decimal" ? "0.21" : "21"}
                        max={fio2Tipo === "decimal" ? "1.0" : "100"}
                        value={fio2}
                        onChange={(e) => setFio2(e.target.value)}
                        className="bg-theme-surface border-gray-600 text-white"
                        placeholder={fio2Tipo === "decimal" ? "Ex: 0.4" : "Ex: 40"}
                      />
                      <span className="text-gray-400 text-sm">
                        {fio2Tipo === "decimal" ? "(0.21-1.0)" : "%"}
                      </span>
                    </div>
                    {fio2 && !isValidFiO2(parseFloat(fio2.replace(",", ".")), fio2Tipo) && (
                      <p className="text-red-400 text-xs mt-1">
                        FiO2 deve estar entre {fio2Tipo === "decimal" ? "0.21 e 1.0" : "21% e 100%"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Resultados */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-semibold mb-3">Resultados</h3>
                    <div className="space-y-3">
                      <CopyableValue
                        label="Relação PaO2/FiO2"
                        value={formatNumber(resultados.relacao, 1)}
                        className="bg-gray-800/30"
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
                        {formatNumber(resultados.relacao, 1)} = {pao2} mmHg ÷ {formatNumber(resultados.fio2Decimal, 2)}
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
                    {resultados.relacao >= 400 && (
                      <p>✅ Função pulmonar adequada. Manter monitorização.</p>
                    )}
                    {resultados.relacao >= 300 && resultados.relacao < 400 && (
                      <p>⚠️ SDRA leve. Considerar suporte ventilatório e monitorização intensiva.</p>
                    )}
                    {resultados.relacao >= 200 && resultados.relacao < 300 && (
                      <p>🔶 SDRA moderada. Ventilação mecânica protetora, PEEP otimizada.</p>
                    )}
                    {resultados.relacao >= 100 && resultados.relacao < 200 && (
                      <p>🔴 SDRA grave. Considerar ventilação protetora, posição prona, ECMO.</p>
                    )}
                    {resultados.relacao < 100 && (
                      <p>🚨 Estado crítico. Suporte avançado imediato, considerar ECMO urgente.</p>
                    )}
                  </div>
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
                <li>• ARDS Definition Task Force. Acute respiratory distress syndrome. JAMA. 2012.</li>
                <li>• Ranieri VM, et al. Acute respiratory distress syndrome: the Berlin Definition. JAMA. 2012.</li>
                <li>• Kirby RR, et al. High level positive end expiratory pressure (PEEP) in acute respiratory insufficiency. Chest. 1975.</li>
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
// Teste: Verificar cálculos com casos conhecidos (PaO2=80, FiO2=0.4 = 200)