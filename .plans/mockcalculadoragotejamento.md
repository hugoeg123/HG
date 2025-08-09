import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Info } from "lucide-react";

// Hardcoded, non-editable calculator (predefined). 
// Category suggestion: Ferramentas > Calculadoras > Conversões
// A estética segue o padrão atual (cards, dialog central, botões arredondados, Tailwind + shadcn).

function formatNumber(n: number, digits = 1) {
  if (!isFinite(n)) return "-";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
}

function CopyableValue({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  const text = suffix ? `${value} ${suffix}` : value;
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border bg-muted/30 px-3 py-2">
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-lg font-semibold">{text}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        aria-label={`Copiar ${label}`}
      >
        <Copy className="h-4 w-4" />
      </Button>
      {copied && <span className="text-xs text-green-600">Copiado!</span>}
    </div>
  );
}

export default function ConversorGotejamentoDialog() {
  // Modal abre direto quando o usuário escolhe "Usar" na listagem
  const [open, setOpen] = useState(true);

  // --- Parâmetros
  const [dropFactor, setDropFactor] = useState<number>(20); // gotas por mL (equipo padrão)

  // --- Estado do modo "Tap" (toque no ritmo)
  const [running, setRunning] = useState(false);
  const [drops, setDrops] = useState(0);
  const startRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0); // segundos

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (startRef.current) setElapsed((Date.now() - startRef.current) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [running]);

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

  const gotasPorMin = useMemo(() => {
    if (!running && elapsed > 0 && drops > 0) {
      return (drops * 60) / elapsed; // fórmula: gotas/min = quantidade ÷ (tempo/60)
    }
    return 0;
  }, [running, elapsed, drops]);

  const mlPorHora = useMemo(() => {
    if (gotasPorMin > 0 && dropFactor > 0) {
      // Taxa (mL/h) = (gotas/min ÷ gotas/mL) * 60
      return (gotasPorMin / dropFactor) * 60;
    }
    return 0;
  }, [gotasPorMin, dropFactor]);

  // --- Conversão direta (caminho de volta): mL/h -> gotas/min
  const [mlhInput, setMlhInput] = useState<string>("");
  const gotasMinFromMlh = useMemo(() => {
    const v = parseFloat(mlhInput.replace(",", "."));
    if (!isNaN(v) && dropFactor > 0) {
      return (v * dropFactor) / 60; // inversa
    }
    return 0;
  }, [mlhInput, dropFactor]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">Conversão de Gotejamento: gotas/min ↔ mL/h</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <Card className="border-muted">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Como usar</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Tap:</strong> toque no botão “Gotas” no ritmo do gotejamento. Pare quando quiser; calculamos automaticamente as taxas.</li>
                <li>O fator de gotejamento padrão é <strong>20 gotas/mL</strong>, mas você pode ajustar conforme o equipo.</li>
                <li>Também é possível converter diretamente de <strong>mL/h para gotas/min</strong>.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="dropFactor">Relação de gotas por 1 mL (gotas/mL)</Label>
                  <Input
                    id="dropFactor"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={dropFactor}
                    onChange={(e) => setDropFactor(parseFloat(e.target.value || "0"))}
                  />
                </div>
                <div className="sm:col-span-2 flex items-end">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Info className="h-4 w-4" />
                          Equipo macro: 10–20 gtt/mL • micro: 60 gtt/mL (ex.: pediatria)
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Escolha conforme o equipo em uso.</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <Separator className="my-4" />

              <Tabs defaultValue="tap" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tap">Tap (contar gotas)</TabsTrigger>
                  <TabsTrigger value="convert">Conversão direta</TabsTrigger>
                </TabsList>

                <TabsContent value="tap" className="space-y-4">
                  <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <Label>Toques</Label>
                      <div className="rounded-xl border bg-muted/30 px-3 py-2 text-lg font-semibold">{drops}</div>
                    </div>
                    <div className="sm:col-span-1">
                      <Label>Tempo (s)</Label>
                      <div className="rounded-xl border bg-muted/30 px-3 py-2 text-lg font-semibold">{formatNumber(elapsed, 1)}</div>
                    </div>
                    <div className="sm:col-span-1 flex gap-2">
                      {!running ? (
                        <Button className="w-full" onClick={handleTap}>Gotas</Button>
                      ) : (
                        <Button className="w-full" onClick={handleTap} variant="default">Gotas (+1)</Button>
                      )}
                      {running ? (
                        <Button variant="secondary" onClick={handleStop}>Parar</Button>
                      ) : (
                        <Button variant="secondary" onClick={handleReset}>Resetar</Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <CopyableValue label="Gotas/min" value={formatNumber(gotasPorMin, 1)} />
                    <CopyableValue label="Taxa de infusão" value={formatNumber(mlPorHora, 1)} suffix="mL/h" />
                    <CopyableValue label="Resumo" value={`${formatNumber(gotasPorMin,1)} gtt/min → ${formatNumber(mlPorHora,1)} mL/h`} />
                  </div>
                </TabsContent>

                <TabsContent value="convert" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <Label htmlFor="mlh">Taxa desejada (mL/h)</Label>
                      <Input id="mlh" inputMode="decimal" value={mlhInput} onChange={(e) => setMlhInput(e.target.value)} />
                    </div>
                    <div className="sm:col-span-2 flex items-end gap-2">
                      <div className="text-sm text-muted-foreground">Resultado em gotas por minuto, dado o equipo selecionado.</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <CopyableValue label="Gotas/min" value={formatNumber(gotasMinFromMlh, 1)} />
                    <CopyableValue label="Resumo" value={`${formatNumber(parseFloat(mlhInput||"0"),1)} mL/h → ${formatNumber(gotasMinFromMlh,1)} gtt/min`} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground">
            Fórmulas: <strong>gtt/min = n° de gotas ÷ (tempo/60)</strong> · <strong>mL/h = (gtt/min ÷ gtt/mL) × 60</strong> · <strong>gtt/min = (mL/h × gtt/mL) ÷ 60</strong>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
