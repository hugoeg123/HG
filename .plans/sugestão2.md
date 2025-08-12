A ideia é adicionar **um novo prebuilt** usando o core, sem tocar nas duas calculadoras antigas.
vou te dar:
1. os **arquivos e paths** certinhos,
2. o **componente pronto** (adaptado ao tema do HG, com Tap, copiar, fator digitável),
3. duas formas de **plugar**: pelo registro dos prebuilt (card/modal) **ou** por rota direta,
4. checks de QA.

---

# 1) Onde criar o novo prebuilt

Crie este arquivo:

```
frontend/src/components/Tools/prebuilt/ConversaoMcgKgMinGttMin.jsx
```

> Ele segue o estilo do projeto (tema escuro do HG; classes utilitárias próximas às que você usa em `ConversaoGotejamento.jsx`).

---

# 2) Código do componente (usa o core recém-criado)

> Imports do **core** (sem duplicar lógicas).
> `format` do core formata números; aqui faço **formatação pt-BR** no display (com `toLocaleString`) mantendo 2 casas para mL/h e mcg/kg/min e inteiro para gtt/min.

```jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

// CORE (criado no Passo 0). Se você usa alias "@/":
// import { ptNumber, roundTo } from "@/core/number";
// import { gttMinToMlH, mcgKgMinToGttMin, gttMinToMcgKgMin } from "@/core/infusionCore";
// Caso NÃO use alias "@", use relativo:
import { ptNumber, roundTo } from "../../../core/number";
import { gttMinToMlH, mcgKgMinToGttMin, gttMinToMcgKgMin } from "../../../core/infusionCore";

// ---- helpers de formatação (apenas UI) ----
const fmt = {
  mlh: (x) =>
    Number.isFinite(x)
      ? roundTo(x, 2).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—",
  gtt: (x) =>
    Number.isFinite(x)
      ? Math.round(x).toLocaleString("pt-BR")
      : "—",
  mcgKgMin: (x) =>
    Number.isFinite(x)
      ? roundTo(x, 2).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—",
};

function Copyable({ label, value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-gray-700/50 bg-theme-card p-4 flex items-center justify-between gap-2">
      <div>
        <div className="text-xs text-gray-300">{label}</div>
        <div className="text-2xl font-semibold mt-1 break-all text-white">{value ?? "—"}</div>
      </div>
      <button
        type="button"
        title={`Copiar ${label}`}
        onClick={async () => {
          if (value != null) await navigator.clipboard.writeText(String(value));
          setCopied(true);
          setTimeout(() => setCopied(false), 900);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-700/50 hover:bg-gray-700/40 text-gray-200"
        aria-label={`Copiar ${label}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M16 3H8a2 2 0 00-2 2v1H5a2 2 0 00-2 2v10a2 2 0 002 2h9a2 2 0 002-2v-1h1a2 2 0 002-2V5a2 2 0 00-2-2h-1z" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="8" y="3" width="8" height="4" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <span className="sr-only">{copied ? "Copiado" : "Copiar"}</span>
      </button>
    </div>
  );
}

export default function ConversaoMcgKgMinGttMin() {
  // estado
  const [tab, setTab] = useState("dose_to_gtt");
  const [weight, setWeight] = useState("");
  const [concValue, setConcValue] = useState("");
  const [concUnit, setConcUnit] = useState("mg/mL");
  const [factorStr, setFactorStr] = useState(""); // digitável
  const [dose, setDose] = useState("");
  const [gtt, setGtt] = useState("");

  // Tap (somente na aba gtt → dose)
  const [running, setRunning] = useState(false);
  const [drops, setDrops] = useState(0);
  const startRef = useRef(null);
  const [elapsed, setElapsed] = useState(0); // segundos

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (startRef.current) setElapsed((Date.now() - startRef.current) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  const onTap = () => {
    if (!running) {
      startRef.current = Date.now();
      setElapsed(0);
      setDrops(1);
      setRunning(true);
      return;
    }
    setDrops((d) => d + 1);
  };
  const onStop = () => {
    setRunning(false);
    if (startRef.current) setElapsed((Date.now() - startRef.current) / 1000);
  };
  const onReset = () => {
    setRunning(false);
    startRef.current = null;
    setDrops(0);
    setElapsed(0);
  };

  const gttFromTap = useMemo(() => {
    if (!running && elapsed > 0 && drops > 0) return (drops * 60) / elapsed; // gotas/min
    return 0;
  }, [running, elapsed, drops]);

  // parsing
  const parsed = useMemo(
    () => ({ weightKg: ptNumber(weight), concVal: ptNumber(concValue) }),
    [weight, concValue]
  );
  const dropFactor = useMemo(() => ptNumber(factorStr), [factorStr]);
  const hasFactor = dropFactor > 0;
  const canCalcCommon = parsed.weightKg > 0.5 && parsed.concVal > 0 && hasFactor;
  const conc = useMemo(() => ({ value: parsed.concVal, unit: concUnit }), [parsed.concVal, concUnit]);

  const result = useMemo(() => {
    try {
      if (!canCalcCommon) return null;

      if (tab === "dose_to_gtt") {
        const doseVal = ptNumber(dose);
        if (!(doseVal >= 0)) return null;
        const gttMin = mcgKgMinToGttMin(doseVal, { weightKg: parsed.weightKg, conc, dropFactor });
        const mlh = gttMinToMlH(gttMin, dropFactor);
        return {
          primaryLabel: "gtt/min",
          primary: fmt.gtt(gttMin),
          secondaryLabel: "mL/h (informativo)",
          secondary: fmt.mlh(mlh),
        };
      }

      // gtt/min manual ou vindo do Tap
      const gttValManual = ptNumber(gtt);
      const gttVal = gttFromTap > 0 ? gttFromTap : gttValManual;
      if (!(gttVal >= 0)) return null;
      const doseVal = gttMinToMcgKgMin(gttVal, { weightKg: parsed.weightKg, conc, dropFactor });
      const mlh = gttMinToMlH(gttVal, dropFactor);
      return {
        primaryLabel: "mcg/kg/min",
        primary: fmt.mcgKgMin(doseVal),
        secondaryLabel: "mL/h (informativo)",
        secondary: fmt.mlh(mlh),
        tapUsed: gttFromTap > 0,
        tapGtt: gttFromTap,
      };
    } catch {
      return null;
    }
  }, [tab, dose, gtt, parsed, conc, dropFactor, canCalcCommon, gttFromTap]);

  return (
    <div className="min-h-[60vh] text-white">
      <div className="w-full">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">mcg/kg/min ↔ gtt/min</h2>
          <span className="text-xs text-gray-400">Conversões</span>
        </div>

        <div className="rounded-lg bg-theme-background border border-gray-700/50 shadow-xl p-5">
          {/* Instruções */}
          <div className="border border-gray-700/50 bg-gray-800/50 rounded-lg p-4 text-sm leading-relaxed">
            <p className="font-medium text-white">Como usar</p>
            <ul className="list-disc pl-5 space-y-1 mt-1 text-gray-200">
              <li>Informe <b>peso (kg)</b>, <b>concentração</b> e <b>fator de gotas</b>.</li>
              <li>Converta <i>mcg/kg/min</i> ↔ <i>gtt/min</i>; <i>mL/h</i> aparece como referência.</li>
              <li>No modo <b>gtt/min → mcg/kg/min</b>, você pode usar o <b>Tap</b> tocando no ritmo das gotas.</li>
              <li>Arredondamentos: gtt/min inteiro; mL/h com <b>2 casas</b>; mcg/kg/min com 2 casas.</li>
            </ul>
          </div>

          {/* Linha 1: Peso + Concentração (valor + unidade) */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-300">Peso (kg)</label>
              <input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                inputMode="decimal"
                placeholder="Peso em kg (ex.: 70)"
                className="w-full mt-1 px-3 py-2 rounded-md bg-theme-card border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-300">Concentração</label>
              <div className="flex gap-2 mt-1">
                <input
                  value={concValue}
                  onChange={(e) => setConcValue(e.target.value)}
                  inputMode="decimal"
                  placeholder="Valor numérico (ex.: 4)"
                  className="flex-1 px-3 py-2 rounded-md bg-theme-card border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-white placeholder-gray-500"
                />
                <select
                  value={concUnit}
                  onChange={(e) => setConcUnit(e.target.value)}
                  className="px-3 py-2 rounded-md bg-theme-card border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-white"
                >
                  <option>mg/mL</option>
                  <option>mcg/mL</option>
                </select>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Ex.: 4 mg/mL, 0,08 mg/mL, 1 mg/mL</p>
            </div>
          </div>

          {/* Linha 2: Fator de gotas */}
          <div className="mt-4">
            <label className="text-xs text-gray-300">Relação de gotas por 1 mL (gtt/mL)</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                value={factorStr}
                onChange={(e) => setFactorStr(e.target.value)}
                inputMode="numeric"
                placeholder="Ex.: 20"
                className="w-28 px-3 py-2 rounded-md bg-theme-card border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-white placeholder-gray-500"
              />
              <span className="text-xs text-gray-400">ⓘ Macro: 10–20 gtt/mL • Micro: 60 gtt/mL</span>
            </div>
            {!hasFactor && (
              <p className="text-[11px] text-gray-400 mt-1">Informe um fator (Macro: 10–20 • Micro: 60)</p>
            )}
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
              <input
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
                  <input
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
                  <input
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
        </div>
      </div>
    </div>
  );
}

// ---- sanity checks leves (dev only) ----
if (typeof window !== "undefined") {
  console.assert(Math.abs(gttMinToMlH(15, 20) - 45) < 1e-9, "gtt→mL/h falhou");
  const gttCalc = mcgKgMinToGttMin(0.1, { weightKg: 70, conc: { value: 4, unit: "mg/mL" }, dropFactor: 20 });
  console.assert(Math.abs(gttCalc - 35) < 1e-6, "mcg/kg/min→gtt/min falhou");
  const doseBack = gttMinToMcgKgMin(35, { weightKg: 70, conc: { value: 4, unit: "mg/mL" }, dropFactor: 20 });
  console.assert(Math.abs(doseBack - 0.1) < 1e-6, "gtt/min→mcg/kg/min falhou");
}
```

> Se preferir **sem** os `console.assert`, pode remover o bloco final. Eles não quebram nada em produção, mas você já disse que testes rodam à parte — então sinta-se à vontade para tirar.

---

# 3) Como **plugar** no HG

Você tem dois jeitos (use o que o projeto já usa hoje).

### Opção A — via **card/modal** dos “prebuilt” (igual ao `ConversaoGotejamento.jsx`)

1. **Importe o componente** onde você monta a lista de prebuilt (ex.: `frontend/src/components/Tools/prebuilt/index.js` ou onde você constrói o array).

   ```js
   import ConversaoMcgKgMinGttMin from "./ConversaoMcgKgMinGttMin";
   ```

2. **Adicione um item** no array/registro de calculadoras prebuilt:

   ```js
   {
     id: "infusion-mcgkgmin-gttmin",
     name: "mcg/kg/min ↔ gtt/min",
     category: "Conversões",
     component: ConversaoMcgKgMinGttMin,
     keywords: ["infusão","gotejamento","mcg/kg/min","gtt/min","mL/h","tap"],
   }
   ```

   > Siga o mesmo shape do item de `ConversaoGotejamento.jsx`. O `CalculatorCard.jsx` já trata o `component` e abre no modal “Usar”.

3. **Verifique o ícone/cor da categoria**
   Se você tem helpers como `getIconForCategory("Conversões")`, não precisa mudar nada (é a mesma categoria que você já usa).

### Opção B — por **rota direta** (se você preferir testar isolado)

No seu arquivo de rotas (ex.: `frontend/src/App.jsx` ou `frontend/src/routes.jsx`):

```jsx
import ConversaoMcgKgMinGttMin from "./components/Tools/prebuilt/ConversaoMcgKgMinGttMin";

// ...
<Route path="/tools/infusion-mcgkgmin-gttmin" element={<ConversaoMcgKgMinGttMin />} />
```

> Dá pra manter oculto do grid, mas acessível por URL para QA.

---

# 4) QA rápido (iguais aos seus exemplos)

* **Caso 1:** 70 kg, 4 mg/mL, **fator 20**, **dose 0,1 mcg/kg/min**
  Espera: **gtt/min ≈ 0** (0,035 → arredonda p/ inteiro) e **mL/h ≈ 0,11**.

* **Caso 2:** **15 gtt/min**, **fator 20**, 4 mg/mL, 70 kg
  Espera: **mL/h = 45,00**; **dose ≈ 42,86 mcg/kg/min**.

* **Tap:** Clique “Gota” algumas vezes, depois **Parar**. O campo “Toques (Gotas)” mostra a contagem; o cálculo usa o TAP (se >0).

## Notas de compatibilidade com seu estilo/tema

* Usei `bg-theme-background`, `bg-theme-card`, `border-gray-700/50`, `text-white/text-gray-300` — mapeando com o que você descreveu no design system.
* Os **botões ativos** seguem `bg-teal-600 hover:bg-teal-700`.
* Inputs usam `focus:ring-teal-500/50` como nas outras calculadoras.
