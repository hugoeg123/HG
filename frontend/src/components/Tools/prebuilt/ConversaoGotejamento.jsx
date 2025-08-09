import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";
import { Copy, Info } from "lucide-react";

/**
 * ConversaoGotejamentoDialog Component - Modal para conversão de gotejamento otimizado
 * 
 * @component
 * @example
 * return (
 *   <ConversaoGotejamentoDialog open={true} onOpenChange={setOpen} />
 * )
 * 
 * Integrates with:
 * - components/ui/* para componentes de interface (Dialog, Button, etc.)
 * - Calculators.jsx via propriedades open/onOpenChange
 * 
 * Features:
 * - Modo "Tap": contagem de gotas com cronômetro automático
 * - Conversão direta: mL/h para gtt/min e vice-versa
 * - Valores copiáveis para clipboard
 * - Tooltips informativos sobre equipos
 * - Fórmulas matemáticas visíveis
 * 
 * IA prompt: Adicionar histórico de conversões, templates de equipos hospitalares, e integração com prontuário
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

function CopyableValue({ label, value, suffix }) {
  const text = suffix ? `${value} ${suffix}` : value;
  const [copied, setCopied] = useState(false);
  
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border bg-gray-800/30 px-3 py-2">
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

export default function ConversaoGotejamentoDialog({ open, onOpenChange }) {
  // ---- Parâmetros
  const [dropFactor, setDropFactor] = useState(20); // gtt/mL padrão

  // ---- Estado do modo "Tap" (contagem de gotas)
  const [running, setRunning] = useState(false);
  const [drops, setDrops] = useState(0);     // Número de gotas contadas
  const [elapsed, setElapsed] = useState(0); // Tempo decorrido em segundos
  const startRef = useRef(null);

  // Timer para atualizar tempo decorrido enquanto está rodando
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (startRef.current) setElapsed((Date.now() - startRef.current) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  // Função para contar gotas - primeira "Gota" inicia cronômetro
  function handleTap() {
    if (!running) {
      startRef.current = Date.now();
      setElapsed(0);
      setDrops(1);
      setRunning(true);
      return;
    }
    setDrops((d) => d + 1);
  }

  function handleStop() {
    setRunning(false);
    if (startRef.current) setElapsed((Date.now() - startRef.current) / 1000);
  }

  function handleReset() {
    setRunning(false);
    startRef.current = null;
    setDrops(0);
    setElapsed(0);
  }

  // Acessibilidade: barra de espaço conta uma gota
  useEffect(() => {
    function onKey(e) {
      if (e.code === "Space" && open) {
        e.preventDefault();
        handleTap();
      }
    }
    if (open) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [running, open]);

  // Cálculos automáticos para modo Tap
  const gotasPorMin = useMemo(() => {
    if (!running && elapsed > 0 && drops > 0) {
      return (drops * 60) / elapsed; // fórmula: gtt/min = número de gotas ÷ (tempo/60)
    }
    return 0;
  }, [running, elapsed, drops]);

  const mlPorHora = useMemo(() => {
    if (gotasPorMin > 0 && dropFactor > 0) {
      return (gotasPorMin / dropFactor) * 60; // mL/h = (gtt/min ÷ gtt/mL) × 60
    }
    return 0;
  }, [gotasPorMin, dropFactor]);

  // ---- Conversão direta: mL/h → gtt/min
  const [mlhInput, setMlhInput] = useState("");
  const gotasMinFromMlh = useMemo(() => {
    const v = parseFloat(String(mlhInput).replace(",", "."));
    if (!isNaN(v) && dropFactor > 0) {
      return (v * dropFactor) / 60; // gtt/min = (mL/h × gtt/mL) ÷ 60
    }
    return 0;
  }, [mlhInput, dropFactor]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            Conversão de Gotejamento: gtt/min ↔ mL/h
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
                <li><strong>Tap:</strong> toque no botão <strong>Gota</strong> a cada gota que cair. A primeira "Gota" já inicia o cronômetro.</li>
                <li>Fator padrão: <strong>20 gtt/mL</strong>, ajuste conforme o equipo em uso.</li>
                <li>Também é possível converter de <strong>mL/h → gtt/min</strong> diretamente na segunda aba.</li>
                <li><strong>Dica:</strong> use a barra de espaço para contar gotas mais rapidamente.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Card principal */}
          <Card className="border-gray-700 bg-gray-800/50">
            <CardContent className="pt-6">
              {/* Configuração do fator de gotejamento */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="dropFactor" className="text-white">Relação de gotas por 1 mL (gtt/mL)</Label>
                  <Input
                    id="dropFactor"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={dropFactor}
                    onChange={(e) => setDropFactor(parseFloat(e.target.value || "0"))}
                    className="bg-theme-surface border-gray-600 text-white"
                  />
                </div>
                <div className="sm:col-span-2 flex items-end">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 cursor-help">
                          <Info className="h-4 w-4" />
                          Macro: 10–20 gtt/mL • Micro: 60 gtt/mL
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Escolha conforme o equipo:</p>
                        <p>• Equipo Macro: 10-20 gtt/mL (adultos)</p>
                        <p>• Equipo Micro: 60 gtt/mL (pediatria/precisão)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Separador visual */}
              <div className="border-b border-gray-600 mb-6"></div>

              {/* Abas principais */}
              <Tabs defaultValue="tap" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                  <TabsTrigger value="tap" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                    Tap (Contar gotas)
                  </TabsTrigger>
                  <TabsTrigger value="convert" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                    Conversão direta
                  </TabsTrigger>
                </TabsList>

                {/* Aba Tap - Contagem de gotas */}
                <TabsContent value="tap" className="space-y-4 mt-6">
                  {/* Controles de contagem */}
                  <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <Label className="text-white">Toques (Gotas)</Label>
                      <div className="rounded-xl border border-gray-600 bg-gray-800/30 px-3 py-2 text-lg font-semibold text-white">
                        {drops}
                      </div>
                    </div>
                    <div className="sm:col-span-1">
                      <Label className="text-white">Tempo (s)</Label>
                      <div className="rounded-xl border border-gray-600 bg-gray-800/30 px-3 py-2 text-lg font-semibold text-white">
                        {formatNumber(elapsed, 1)}
                      </div>
                    </div>
                    <div className="sm:col-span-1 flex gap-2">
                      <Button 
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white" 
                        onClick={handleTap}
                      >
                        Gota {running && "(+1)"}
                      </Button>
                      {running ? (
                        <Button variant="secondary" onClick={handleStop} className="bg-orange-600 hover:bg-orange-700">
                          Parar
                        </Button>
                      ) : (
                        <Button variant="secondary" onClick={handleReset} className="bg-gray-600 hover:bg-gray-700">
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Resultados do modo Tap */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <CopyableValue 
                      label="gtt/min" 
                      value={formatNumber(gotasPorMin, 1)} 
                    />
                    <CopyableValue 
                      label="Taxa de infusão" 
                      value={formatNumber(mlPorHora, 1)} 
                      suffix="mL/h" 
                    />
                    <CopyableValue 
                      label="Resumo" 
                      value={`${formatNumber(gotasPorMin,1)} gtt/min → ${formatNumber(mlPorHora,1)} mL/h`} 
                    />
                  </div>
                </TabsContent>

                {/* Aba Conversão Direta */}
                <TabsContent value="convert" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <Label htmlFor="mlh" className="text-white">Taxa desejada (mL/h)</Label>
                      <Input 
                        id="mlh" 
                        inputMode="decimal" 
                        value={mlhInput} 
                        onChange={(e) => setMlhInput(e.target.value)}
                        placeholder="Ex: 125"
                        className="bg-theme-surface border-gray-600 text-white"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-end gap-2">
                      <div className="text-sm text-gray-400">
                        Resultado em gotas por minuto, considerando o equipo selecionado.
                      </div>
                    </div>
                  </div>
                  
                  {/* Resultados da conversão direta */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <CopyableValue 
                      label="gtt/min" 
                      value={formatNumber(gotasMinFromMlh, 1)} 
                    />
                    <CopyableValue 
                      label="Resumo" 
                      value={`${formatNumber(parseFloat(mlhInput||"0"),1)} mL/h → ${formatNumber(gotasMinFromMlh,1)} gtt/min`} 
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Fórmulas utilizadas */}
          <div className="text-xs text-gray-400 text-center">
            <strong>Fórmulas:</strong> gtt/min = nº de gotas ÷ (tempo/60) • mL/h = (gtt/min ÷ gtt/mL) × 60 • gtt/min = (mL/h × gtt/mL) ÷ 60
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Connector: Integra com Calculators.jsx via propriedades open/onOpenChange para controle de modal
// Hook: Exportado como componente prebuilt para calculadoras hardcoded no sistema