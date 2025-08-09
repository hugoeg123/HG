

# 1) Novo componente (pré-pronto)

**Criar arquivo:** `frontend/src/components/Tools/prebuilt/ConversaoGotejamento.jsx`

```jsx
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

function formatNumber(n, digits = 1) {
  if (!isFinite(n)) return "--";
  try {
    return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
  } catch {
    return String(n.toFixed ? n.toFixed(digits) : n);
  }
}

function CopyableValue({ label, value, suffix }) {
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
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          } catch {}
        }}
        aria-label={`Copiar ${label}`}
      >
        <Copy className="h-4 w-4" />
      </Button>
      {copied && <span className="text-xs text-green-600">Copiado!</span>}
    </div>
  );
}

export default function ConversaoGotejamentoDialog({ open, onOpenChange }) {
  const [dropFactor, setDropFactor] = useState(20); // gtt/mL

  // Tap (contagem)
  const [running, setRunning] = useState(false);
  const [drops, setDrops] = useState(0);     // “Gotas” (toques)
  const [elapsed, setElapsed] = useState(0); // segundos
  const startRef = useRef(null);

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

  // A11y: barra de espaço conta gota
  useEffect(() => {
    function onKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        handleTap();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  // Cálculos
  const gotasPorMin = useMemo(() => {
    if (!running && elapsed > 0 && drops > 0) return (drops * 60) / elapsed;
    return 0;
  }, [running, elapsed, drops]);

  const mlPorHora = useMemo(() => {
    if (gotasPorMin > 0 && dropFactor > 0) return (gotasPorMin / dropFactor) * 60;
    return 0;
  }, [gotasPorMin, dropFactor]);

  // Conversão direta: mL/h → gtt/min
  const [mlhInput, setMlhInput] = useState("");
  const gotasMinFromMlh = useMemo(() => {
    const v = parseFloat(String(mlhInput).replace(",", "."));
    if (!isNaN(v) && dropFactor > 0) return (v * dropFactor) / 60;
    return 0;
  }, [mlhInput, dropFactor]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            Conversão de Gotejamento: gtt/min ↔ mL/h
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <Card className="border-muted">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Como usar</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Tap:</strong> toque no botão <strong>Gota</strong> a cada gota. A primeira “Gota” já inicia o cronômetro.</li>
                <li>Fator padrão: <strong>20 gtt/mL</strong>, ajuste conforme o equipo.</li>
                <li>Também dá para converter <strong>mL/h → gtt/min</strong> direto.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="dropFactor">Relação de gotas por 1 mL (gtt/mL)</Label>
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
                          Macro: 10–20 gtt/mL • Micro: 60 gtt/mL
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Escolha conforme o equipo (p.ex. pediatria usa micro 60 gtt/mL).</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <Separator className="my-4" />

              <Tabs defaultValue="tap" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tap">Tap (Contar gotas)</TabsTrigger>
                  <TabsTrigger value="convert">Conversão direta</TabsTrigger>
                </TabsList>

                <TabsContent value="tap" className="space-y-4">
                  <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <Label>Toques (Gotas)</Label>
                      <div className="rounded-xl border bg-muted/30 px-3 py-2 text-lg font-semibold">{drops}</div>
                    </div>
                    <div className="sm:col-span-1">
                      <Label>Tempo (s)</Label>
                      <div className="rounded-xl border bg-muted/30 px-3 py-2 text-lg font-semibold">{formatNumber(elapsed, 1)}</div>
                    </div>
                    <div className="sm:col-span-1 flex gap-2">
                      <Button className="w-full" onClick={handleTap}>Gota</Button>
                      {running ? (
                        <Button variant="secondary" onClick={handleStop}>Parar</Button>
                      ) : (
                        <Button variant="secondary" onClick={handleReset}>Resetar</Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <CopyableValue label="gtt/min" value={formatNumber(gotasPorMin, 1)} />
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
                      <div className="text-sm text-muted-foreground">Resultado em gtt/min, dado o equipo.</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <CopyableValue label="gtt/min" value={formatNumber(gotasMinFromMlh, 1)} />
                    <CopyableValue label="Resumo" value={`${formatNumber(parseFloat(mlhInput||"0"),1)} mL/h → ${formatNumber(gotasMinFromMlh,1)} gtt/min`} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground">
            Fórmulas: <strong>gtt/min = nº de gotas ÷ (tempo/60)</strong> · <strong>mL/h = (gtt/min ÷ gtt/mL) × 60</strong> · <strong>gtt/min = (mL/h × gtt/mL) ÷ 60</strong>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

> Pasta pode não existir: crie `frontend/src/components/Tools/prebuilt/`.

---

# 2) Mapear no modal

**Editar:** `frontend/src/components/Tools/CalculatorModal.jsx`

Adicione no topo:

```jsx
import ConversaoGotejamento from "./prebuilt/ConversaoGotejamento";

const PREBUILT_MAP = {
  ConversaoGotejamento,
};
```

E troque o `return` principal para checar prebuilt (mantenha seu fallback como está):

```jsx
export default function CalculatorModal({ calculator, open, onOpenChange }) {
  if (!calculator) return null;

  if (calculator.kind === "prebuilt" && calculator.component && PREBUILT_MAP[calculator.component]) {
    const Comp = PREBUILT_MAP[calculator.component];
    return <Comp open={open} onOpenChange={onOpenChange} />;
  }

  // ... resto do seu modal (builder genérico)
}
```

---

# 3) Registrar na lista de calculadoras

**Editar:** `frontend/src/components/Tools/knowledgebase/Calculators.jsx`

Inclua este objeto dentro do array exportado (ou onde você mantém o catálogo):

```jsx
{
  id: "conversao-gotejamento",
  name: "Conversão de Gotejamento",
  description: "Converte entre gtt/min e mL/h; modo Tap ou conversão direta.",
  category: "Conversões",
  tags: ["infusão", "macro", "micro", "gtt", "mL/h"],
  kind: "prebuilt",
  component: "ConversaoGotejamento"
}
```

> Se seu filtro de categorias é fixo, garanta que **“Conversões”** esteja incluída. Se é dinâmico (pega do array), nada a fazer.

---

# 4) (Opcional) Card/Lista

Se o `CalculatorCard.jsx` mostra rótulos, padronize:

* onde aparecer “gotas/min”, renderize **“gtt/min”**;
* botão do modo Tap: **“Gota”** (singular) para não confundir quem digitar.

---

# 5) Teste rápido

1. `npm run dev` (ou `pnpm dev`) no `frontend/`.
2. Calculadoras → “Conversão de Gotejamento” → **Usar**.
3. Toque **Gota** 12–15 vezes, **Parar** → confira **gtt/min** e **mL/h**.
4. Troque para **60 gtt/mL** e veja a diferença.
5. Aba “Conversão direta”: **120 mL/h** com **20 gtt/mL** → deve dar **40 gtt/min**.

---