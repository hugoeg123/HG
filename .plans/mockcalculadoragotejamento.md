import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Info } from "lucide-react";

function format(n: number, d = 1) {
  if (!isFinite(n)) return "-";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
}

function CopyRow({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border bg-muted/30 px-3 py-2">
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-lg font-semibold">{text}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        aria-label={`Copiar ${label}`}
      >
        <Copy className="h-4 w-4" />
      </Button>
      {copied && <span className="text-xs text-primary">Copiado!</span>}
    </div>
  );
}

export default function ConversaoMcgKgMinMlh() {
  const [open, setOpen] = useState(true);

  type Dir = "mcgkgmin-mlh" | "mlh-mcgkgmin";
  const [dir, setDir] = useState<Dir>("mcgkgmin-mlh");

  const [taxa, setTaxa] = useState<string>(""); // valor da taxa conforme direção
  const [peso, setPeso] = useState<string>(""); // kg
  const [diluicao, setDiluicao] = useState<string>(""); // mg/mL

  const taxaNum = useMemo(() => parseFloat((taxa || "").replace(",", ".")), [taxa]);
  const pesoNum = useMemo(() => parseFloat((peso || "").replace(",", ".")), [peso]);
  const diluicaoNum = useMemo(() => parseFloat((diluicao || "").replace(",", ".")), [diluicao]);

  const isValid = useMemo(() => (
    !isNaN(taxaNum) && taxaNum > 0 &&
    !isNaN(pesoNum) && pesoNum >= 0.1 && pesoNum <= 300 &&
    !isNaN(diluicaoNum) && diluicaoNum > 0
  ), [taxaNum, pesoNum, diluicaoNum]);

  // Fórmulas
  // mcg/kg/min -> mL/h : (taxa * peso * 60) / 1000 / diluicao
  // mL/h -> mcg/kg/min : (taxa * (diluicao * 1000)) / 60 / peso
  const result = useMemo(() => {
    if (!isValid) return "...";
    if (dir === "mcgkgmin-mlh") {
      const v = (taxaNum * pesoNum * 60) / 1000 / diluicaoNum;
      return `${format(v, 1)} mL/h`;
    }
    const v = (taxaNum * (diluicaoNum * 1000)) / 60 / pesoNum;
    const s = (Math.round(v * 100) / 100).toString();
    return `${s.replace(/\.?0+$/, "")} micrograma/kg/min`;
  }, [dir, isValid, taxaNum, pesoNum, diluicaoNum]);

  const resumo = useMemo(() => {
    if (dir === "mcgkgmin-mlh") return `${taxa || "…"} mcg/kg/min → ${result}`;
    return `${taxa || "…"} mL/h → ${result}`;
  }, [dir, taxa, result]);

  // Placeholders dinâmicos
  const placeholderTaxa = dir === "mcgkgmin-mlh" ? "micrograma/kg/minuto" : "mL/hora";
  const placeholderPeso = "Insira o peso em kg";
  const placeholderDiluicao = "mg por 1 mL";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="w-full text-center text-xl">Conversão de Infusão: mcg/kg/min ↔ mL/h</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <Card className="border-muted">
            <CardHeader className="pb-2 text-center">
              <CardTitle className="text-base">Como usar</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              <div className="space-y-1">
                <p>Selecione a direção da conversão, informe a taxa, o peso (kg) e a diluição (mg/mL). O resultado atualiza em tempo real.</p>
                <p>Fórmulas: <strong>mL/h = (mcg/kg/min × kg × 60) ÷ (1000 × mg/mL)</strong> · <strong>mcg/kg/min = (mL/h × mg/mL × 1000) ÷ (60 × kg)</strong></p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              {/* Tabs para manter uniformidade com outras calculadoras */}
              <Tabs value={dir} onValueChange={(v) => setDir(v as Dir)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mcgkgmin-mlh">mcg/kg/min → mL/h</TabsTrigger>
                  <TabsTrigger value="mlh-mcgkgmin">mL/h → mcg/kg/min</TabsTrigger>
                </TabsList>

                <TabsContent value="mcgkgmin-mlh" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="taxa-a">Taxa de infusão (mcg/kg/min)</Label>
                      <Input id="taxa-a" placeholder={placeholderTaxa} inputMode="decimal" value={taxa} onChange={(e) => setTaxa(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="peso-a">Peso (kg)</Label>
                      <Input id="peso-a" placeholder={placeholderPeso} inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="diluicao-a">Diluição (mg por 1 mL)</Label>
                      <Input id="diluicao-a" placeholder={placeholderDiluicao} inputMode="decimal" value={diluicao} onChange={(e) => setDiluicao(e.target.value)} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="mlh-mcgkgmin" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="taxa-b">Taxa de infusão (mL/h)</Label>
                      <Input id="taxa-b" placeholder={placeholderTaxa} inputMode="decimal" value={taxa} onChange={(e) => setTaxa(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="peso-b">Peso (kg)</Label>
                      <Input id="peso-b" placeholder={placeholderPeso} inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="diluicao-b">Diluição (mg por 1 mL)</Label>
                      <Input id="diluicao-b" placeholder={placeholderDiluicao} inputMode="decimal" value={diluicao} onChange={(e) => setDiluicao(e.target.value)} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2"><Info className="h-4 w-4"/>Ex.: noradrenalina 4 mg/50 mL ⇒ 0,08 mg/mL</div>
                    </TooltipTrigger>
                    <TooltipContent>Faça a diluição em mg por 1 mL, não em mcg.</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CopyRow label="Equivalência" text={result} />
                <CopyRow label="Resumo" text={resumo} />
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
