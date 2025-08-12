import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Copy } from "lucide-react";

// Imports do core recém-criado
import { ptNumber, roundTo } from "../../../core/number";
import { mcgKgMinToGttMin, gttMinToMcgKgMin, format } from "../../../core/infusionCore";

/** Componente copiável similar ao das outras calculadoras */
function Copyable({ label, value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-600 bg-gray-800/30 px-3 py-2">
      <div className="flex flex-col">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-lg font-semibold text-white">{value}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          } catch {
            // Fallback silencioso
          }
        }}
        aria-label={`Copiar ${label}`}
        className="text-gray-400 hover:text-white hover:bg-gray-700"
      >
        <Copy className="h-4 w-4" />
      </Button>
      {copied && <span className="text-xs text-teal-400">Copiado!</span>}
    </div>
  );
}

export default function ConversaoMcgKgMinGttMin({ open, onOpenChange }) {
  // Estados principais
  const [tab, setTab] = useState("dose_to_gtt");
  const [weight, setWeight] = useState("");
  const [conc, setConc] = useState("");
  const [concUnit, setConcUnit] = useState("mg/mL");
  const [dropFactor, setDropFactor] = useState("20");
  const [dose, setDose] = useState("");
  const [gtt, setGtt] = useState("");

  // Estados do Tap
  const [running, setRunning] = useState(false);
  const [drops, setDrops] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const intervalRef = useRef(null);

  // Timer para atualização contínua quando está correndo
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((Date.now() - startTime) / 1000);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running, startTime]);

  // Funções do Tap
  const onTap = () => {
    if (!running) {
      setStartTime(Date.now());
      setRunning(true);
      setDrops(1);
      setElapsed(0);
    } else {
      setDrops(d => d + 1);
    }
  };

  const onStop = () => {
    if (running) {
      setRunning(false);
      // Calcular gtt/min baseado no tap
      if (drops > 0 && elapsed > 0) {
        const gttMin = (drops / elapsed) * 60;
        setGtt(String(roundTo(gttMin, 1)));
      }
    }
  };

  const onReset = () => {
    setRunning(false);
    setDrops(0);
    setElapsed(0);
    setStartTime(0);
    setGtt("");
  };

  // Cálculo do resultado principal
  const result = useMemo(() => {
    try {
      const weightKg = ptNumber(weight);
      const concVal = ptNumber(conc);
      const dropFactorNum = parseInt(dropFactor);

      if (isNaN(weightKg) || isNaN(concVal) || isNaN(dropFactorNum) || 
          weightKg <= 0 || concVal <= 0) {
        return null;
      }

      const ctx = {
        weightKg,
        conc: { value: concVal, unit: concUnit },
        dropFactor: dropFactorNum
      };

      if (tab === "dose_to_gtt") {
        const doseVal = ptNumber(dose);
        if (isNaN(doseVal) || doseVal <= 0) return null;

        const gttResult = mcgKgMinToGttMin(doseVal, ctx);
        const mlhResult = (gttResult * 60) / dropFactorNum; // Convert gtt/min to mL/h

        return {
          primary: `${format.gtt(gttResult)} gtt/min`,
          primaryLabel: "Taxa de gotejamento",
          secondary: `${format.mlh(mlhResult)} mL/h`,
          secondaryLabel: "Equivalente em mL/h"
        };
      } else {
        // gtt_to_dose
        let gttVal;
        
        // Se tap foi usado e tem resultado, usar ele; senão, usar o campo manual
        if (running || (drops > 0 && !running)) {
          if (drops > 0 && elapsed > 0) {
            gttVal = (drops / elapsed) * 60;
          } else {
            return null;
          }
        } else {
          gttVal = ptNumber(gtt);
          if (isNaN(gttVal) || gttVal <= 0) return null;
        }

        const doseResult = gttMinToMcgKgMin(gttVal, ctx);
        const mlhResult = (gttVal * 60) / dropFactorNum;

        return {
          primary: `${format.mcgKgMin(doseResult)} mcg/kg/min`,
          primaryLabel: "Dose calculada",
          secondary: `${format.mlh(mlhResult)} mL/h`,
          secondaryLabel: "Equivalente em mL/h"
        };
      }
    } catch (error) {
      console.warn("Erro no cálculo:", error);
      return null;
    }
  }, [tab, weight, conc, concUnit, dropFactor, dose, gtt, drops, elapsed, running]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="w-full text-center text-xl">
            Conversão: mcg/kg/min ↔ gtt/min
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Card de instruções */}
          <Card className="border-gray-700/50 bg-theme-card">
            <CardHeader className="pb-2 text-center">
              <CardTitle className="text-base text-white">Como usar</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-gray-300">
              <div className="space-y-1">
                <p>Selecione a direção da conversão, preencha peso, concentração e fator de gotas.</p>
                <p>Na aba "gtt/min → mcg/kg/min", use o botão <strong>Gota</strong> para contar o gotejamento em tempo real.</p>
              </div>
            </CardContent>
          </Card>

          {/* Card principal */}
          <Card className="border-gray-700/50 bg-theme-card">
            <CardContent className="pt-6">
              {/* Campos comuns */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="weight" className="text-white">Peso (kg)</Label>
                  <Input
                    id="weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    inputMode="decimal"
                    placeholder="Peso do paciente"
                    className="bg-theme-surface border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="conc" className="text-white">Concentração</Label>
                  <Input
                    id="conc"
                    value={conc}
                    onChange={(e) => setConc(e.target.value)}
                    inputMode="decimal"
                    placeholder="Ex.: 4"
                    className="bg-theme-surface border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="concUnit" className="text-white">Unidade</Label>
                  <Select value={concUnit} onValueChange={setConcUnit}>
                    <SelectTrigger className="bg-theme-surface border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mg/mL">mg/mL</SelectItem>
                      <SelectItem value="mcg/mL">mcg/mL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dropFactor" className="text-white">Fator de gotas</Label>
                  <Select value={dropFactor} onValueChange={setDropFactor}>
                    <SelectTrigger className="bg-theme-surface border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 gtt/mL</SelectItem>
                      <SelectItem value="15">15 gtt/mL</SelectItem>
                      <SelectItem value="20">20 gtt/mL</SelectItem>
                      <SelectItem value="60">60 gtt/mL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Abas */}
              <div className="mt-5 grid grid-cols-2 rounded-lg overflow-hidden border border-gray-700/50">
                <button
                  onClick={() => setTab("dose_to_gtt")}
                  className={`py-2 ${tab === "dose_to_gtt" ? "bg-teal-600 text-white" : "bg-gray-700/40 hover:bg-gray-700/60 text-gray-200"}`}
                >
                  mcg/kg/min → gtt/min
                </button>
                <button
                  onClick={() => setTab("gtt_to_dose")}
                  className={`py-2 ${tab === "gtt_to_dose" ? "bg-teal-600 text-white" : "bg-gray-700/40 hover:bg-gray-700/60 text-gray-200"}`}
                >
                  gtt/min → mcg/kg/min
                </button>
              </div>

              {/* Conteúdo da aba */}
              {tab === "dose_to_gtt" ? (
                <div className="mt-4">
                  <label className="text-xs text-gray-300">Dose (mcg/kg/min)</label>
                  <Input
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    inputMode="decimal"
                    placeholder="Dose em mcg/kg/min (ex.: 0,1)"
                    className="w-full mt-1 px-3 py-2 rounded-md bg-theme-card border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-white placeholder-gray-500"
                  />
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="text-xs text-gray-300">Toques (Gotas)</label>
                      <Input
                        value={running || drops > 0 ? String(drops) : gtt}
                        onChange={(e) => {
                          if (running) return;
                          const v = e.target.value;
                          setGtt(v);
                          const n = ptNumber(v);
                          if (!isNaN(n)) setDrops(Math.max(0, Math.floor(n)));
                        }}
                        readOnly={running}
                        inputMode="numeric"
                        placeholder="Digite/Conte as gotas"
                        className="w-full mt-1 px-3 py-2 rounded-md bg-theme-card border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-300">Tempo (s)</label>
                      <Input
                        value={elapsed.toFixed(1)}
                        readOnly
                        className="w-full mt-1 px-3 py-2 rounded-md bg-theme-card border border-gray-700/50 text-gray-300"
                      />
                    </div>
                    <div className="flex gap-2">
                      {!running ? (
                        <button className="w-full px-3 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-semibold" onClick={onTap}>Gota</button>
                      ) : (
                        <button className="w-full px-3 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-semibold" onClick={onTap}>Gota (+1)</button>
                      )}
                      {running ? (
                        <button className="px-3 py-2 rounded-md bg-orange-600/90 text-white" onClick={onStop}>Parar</button>
                      ) : (
                        <button className="px-3 py-2 rounded-md bg-gray-700/40 border border-gray-700/50 text-white" onClick={onReset}>Reset</button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400">Ao usar o Tap, o cálculo de gtt/min só é feito quando você pressiona <b>Parar</b>.</p>
                </div>
              )}

              {/* Resultado */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Copyable label={result?.primaryLabel ?? "Resultado"} value={result?.primary ?? "—"} />
                <Copyable label={result?.secondaryLabel ?? "Resumo"} value={result?.secondary ?? "—"} />
              </div>

              {/* Rodapé com fórmulas */}
              <p className="mt-4 text-[11px] text-gray-400">
                Fórmulas: gtt/min = (mcg/kg/min × kg × fator) / conc_(mcg/mL) · mcg/kg/min = (gtt/min × conc_(mcg/mL)) / (kg × fator) · mL/h = gtt/min × (60 / fator)
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}