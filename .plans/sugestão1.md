
* **Ação “Tap” inicia o cronômetro** no primeiro toque (sem botão Start).
* **Dois modos**: “Tap (Contar gotas)” e “Conversão direta”.
* **Inputs e labels** alinhados ao jargão clínico: usar **“gtt/mL”** (texto informativo) e chamar o botão de **“Gota”** (se o usuário digitar manualmente, não confunde).
* **Resultados copy-to-clipboard**, com **gtt/min** e **mL/h**.
* **Ajuda contextual** com dica sobre **macro 10–20 gtt/mL** e **micro 60 gtt/mL**.
* **Sem mexer em cores/tema**, só estrutura e micro-copy.

---

# Onde encaixa no seu projeto

Você mencionou estes arquivos no `frontend`:

* `src/components/Tools/CalculatorCard.jsx`
* `src/components/Tools/CalculatorModal.jsx`
* `src/components/Tools/knowledgebase/Calculators.jsx`

Vamos:

1. **Adicionar** a calculadora predefinida (componente isolado).
2. **Registrar** no *knowledgebase* para aparecer no grid/cards e filtros.
3. **Renderizar no modal** quando o usuário clica “Usar”.

---

# 1) Novo componente (pré-feito)

**Arquivo:** `frontend/src/components/Tools/prebuilt/ConversaoGotejamento.jsx`

> Se seu front já aceita TS/tsx, pode renomear para `.tsx`. Abaixo vai em **JS** puro para plug-and-play.

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
  // ---- Parâmetros
  const [dropFactor, setDropFactor] = useState(20); // gtt por mL

  // ---- Estado do modo "Tap"
  const [running, setRunning] = useState(false);
  const [drops, setDrops] = useState(0);     // “Gotas” (cada toque)
  const [elapsed, setElapsed] = useState(0); // segundos
  const startRef = useRef(null);

  // Inicia/atualiza timer somente enquanto running = true
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (startRef.current) setElapsed((Date.now() - startRef.current) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  // Primeira “Gota” inicia cronômetro; subsequentes apenas contam
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
                <li><strong>Tap:</strong> toque no botão <strong>Gota</strong> a cada gota que cair. A primeira “Gota” já inicia o cronômetro.</li>
                <li>Fator padrão: <strong>20 gtt/mL</strong>, ajuste conforme o equipo.</li>
                <li>Também dá para converter de <strong>mL/h → gtt/min</strong> diretamente.</li>
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
                      <TooltipContent>Escolha conforme o equipo (ex.: pediatria costuma usar micro 60 gtt/mL).</TooltipContent>
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
                      <div className="text-sm text-muted-foreground">Resultado em gtt/min, dado o equipo selecionado.</div>
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

**Por que isso resolve?**

* O **primeiro toque** em “Gota” inicia `running` e seta `startRef`; sem botão Start.
* Mantém **estilo atual (shadcn/Tailwind)**, só estrutura e labels.
* **A11y**: **barra de espaço** também conta gota.

---

# 2) Registrar no catálogo de calculadoras

Abra `frontend/src/components/Tools/knowledgebase/Calculators.jsx` e **adicione** (ou ajuste) a entrada:

```jsx
// Exemplo de item no array/export
{
  id: "conversao-gotejamento",
  name: "Conversão de Gotejamento",
  description: "Converte entre gtt/min e mL/h; modo Tap ou conversão direta.",
  category: "Conversões",      // garanta que o filtro tenha esta categoria
  tags: ["infusão", "macro", "micro", "gtt", "mL/h"],
  kind: "prebuilt",            // para o modal saber que deve montar componente pronto
  component: "ConversaoGotejamento" // chave que o modal vai mapear para o componente
}
```

> Se hoje a lista não suporta `component`, acrescente esse campo. Assim você evita *ifs* por `id` e pode plugar outros “prebuilt” no futuro.

---

# 3) Renderizar no modal

No `frontend/src/components/Tools/CalculatorModal.jsx`, importe e **mapeie** componentes predefinidos:

```jsx
import ConversaoGotejamento from "../prebuilt/ConversaoGotejamento";
// ...
const PREBUILT_MAP = {
  ConversaoGotejamento,
};
// ...
export default function CalculatorModal({ calculator, open, onOpenChange }) {
  if (!calculator) return null;

  // se vier "prebuilt", renderiza diálogo do componente
  if (calculator.kind === "prebuilt" && PREBUILT_MAP[calculator.component]) {
    const Comp = PREBUILT_MAP[calculator.component];
    return <Comp open={open} onOpenChange={onOpenChange} />;
  }

  // ... fallback: calculadoras “montáveis” pelo builder atual
  return (
    // seu modal atual
  );
}
```

---

# 4) Filtros e rótulos

* **Categorias**: inclua **“Conversões”** no seletor/filtro de categoria (na tela de cards).
* **Labels**: onde aparecer “gotas/min”, padronize como **“gtt/min”**; o botão em Tap deve exibir **“Gota”** (singular).

---

# 5) UX de pequenos detalhes (recomendo)

* **Botão primário** = “Gota”; **secundário** alterna “Parar/Resetar”.
* **Copiar valor** com feedback **“Copiado!”** já está no componente.
* **Placeholders**: em mL/h, aceite vírgula e ponto (normalizo no parse).
* **Acessibilidade**: documente no tooltip “Pressione espaço para contar gota”.

---

# 6) Se preferir TypeScript

Troque o arquivo para `.tsx` e adicione tipos simples nas props:

```ts
export default function ConversaoGotejamentoDialog(
  { open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }
) { /* ... */ }
```

O resto compila sem mudanças.

---

# 7) Teste rápido

1. Build do front, abrir **Calculadoras** → card “Conversão de Gotejamento” → **Usar**.
2. Toque “Gota” 10–15 vezes; pare; confira **gtt/min** e **mL/h**.
3. Mude **gtt/mL** para **60**; repita; confira se **mL/h** varia conforme esperado.
4. Aba “Conversão direta”: digite **120 mL/h** com **20 gtt/mL** → deve dar **40 gtt/min**.


