import React, { useEffect, useMemo, useRef, useState } from "react";

// Mock isolado para visualização da calculadora (estilo HG dark)
// Atualizações nesta revisão:
// - Corrigido erro de JSX adjacente (componentes devidamente encapsulados)
// - Campo de **Toques (Gotas)** compartilhado com o modo Tap (mostra os toques enquanto conta)
// - Botões de copiar nos resultados
// - Fator de gotas digitável, com dica Macro/Micro
// - Placeholders explicativos
// - Pequenos testes de sanidade no final (console.assert) para as fórmulas

// ---------- helpers ----------
const ptNumber = (input) => {
  if (typeof input === "number") return input;
  if (typeof input !== "string") return NaN;
  const s = input.trim().replace(/\s+/g, "").replace(/,/g, ".");
  if (!s) return NaN;
  return Number(s);
};
const roundTo = (x, places) => {
  const f = 10 ** places;
  return Math.round((x + Number.EPSILON) * f) / f;
};
const toMcgPerMl = (conc) => (conc.unit === "mg/mL" ? conc.value * 1000 : conc.value);

// conversions
const gttMinToMlH = (gttPerMin, dropFactor) => gttPerMin * (60 / dropFactor);
const mcgKgMinToGttMin = (dose, ctx) => {
  if (!ctx.weightKg || ctx.weightKg <= 0) throw new Error("Peso (kg) é obrigatório e deve ser > 0.");
  if (!ctx.dropFactor || ctx.dropFactor <= 0) throw new Error("Fator de gotas é obrigatório.");
  const concMcgMl = toMcgPerMl(ctx.conc);
  if (concMcgMl <= 0) throw new Error("Concentração deve ser > 0.");
  return (dose * ctx.weightKg * ctx.dropFactor) / concMcgMl;
};
const gttMinToMcgKgMin = (gttPerMin, ctx) => {
  if (!ctx.weightKg || ctx.weightKg <= 0) throw new Error("Peso (kg) é obrigatório e deve ser > 0.");
  if (!ctx.dropFactor || ctx.dropFactor <= 0) throw new Error("Fator de gotas é obrigatório.");
  const concMcgMl = toMcgPerMl(ctx.conc);
  if (concMcgMl <= 0) throw new Error("Concentração deve ser > 0.");
  return (gttPerMin * concMcgMl) / (ctx.weightKg * ctx.dropFactor);
};

const format = {
  mlh: (x) => roundTo(x, 2).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  gtt: (x) => Math.round(x).toLocaleString("pt-BR"),
  mcgKgMin: (x) => roundTo(x, 2).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
};

function Copyable({ label, value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 flex items-center justify-between gap-2">
      <div>
        <div className="text-xs opacity-80">{label}</div>
        <div className="text-2xl font-semibold mt-1 break-all">{value ?? "—"}</div>
      </div>
      <button
        type="button"
        title={`Copiar ${label}`}
        onClick={async () => {
          if (value != null) await navigator.clipboard.writeText(String(value));
          setCopied(true);
          setTimeout(() => setCopied(false), 1000);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 hover:bg-zinc-800"
        aria-label={`Copiar ${label}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 3H8a2 2 0 00-2 2v1H5a2 2 0 00-2 2v10a2 2 0 002 2h9a2 2 0 002-2v-1h1a2 2 0 002-2V5a2 2 0 00-2-2h-1z" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="8" y="3" width="8" height="4" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <span className="sr-only">{copied ? "Copiado" : "Copiar"}</span>
      </button>
    </div>
  );
}

export default function MockInfusionCalculatorTap() {
  // Inputs com placeholders (sem valores iniciais)
  const [tab, setTab] = useState("dose_to_gtt");
  const [weight, setWeight] = useState("");
  const [concValue, setConcValue] = useState("");
  const [concUnit, setConcUnit] = useState("mg/mL");
  const [factorStr, setFactorStr] = useState(""); // digitável
  const [dose, setDose] = useState("");
  const [gtt, setGtt] = useState("");

  // Tap state (apenas na aba gtt → dose)
  const [running, setRunning] = useState(false);
  const [drops, setDrops] = useState(0);
  const startRef = useRef(null);
  const [elapsed, setElapsed] = useState(0); // s

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

  const parsed = useMemo(
    () => ({ weightKg: ptNumber(weight), concVal: ptNumber(concValue) }),
    [weight, concValue]
  );

  const dropFactor = useMemo(() => ptNumber(factorStr), [factorStr]);
  const hasFactor = dropFactor > 0; // entrada digitável
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
          primary: format.gtt(gttMin),
          secondaryLabel: "mL/h (informativo)",
          secondary: format.mlh(mlh),
        };
      }
      // gtt/min vindas do campo ou do Tap (se houve medição ao parar)
      const gttValManual = ptNumber(gtt);
      const gttVal = gttFromTap > 0 ? gttFromTap : gttValManual;
      if (!(gttVal >= 0)) return null;
      const doseVal = gttMinToMcgKgMin(gttVal, { weightKg: parsed.weightKg, conc, dropFactor });
      const mlh = gttMinToMlH(gttVal, dropFactor);
      return {
        primaryLabel: "mcg/kg/min",
        primary: format.mcgKgMin(doseVal),
        secondaryLabel: "mL/h (informativo)",
        secondary: format.mlh(mlh),
        tapUsed: gttFromTap > 0,
        tapGtt: gttFromTap,
      };
    } catch {
      return null;
    }
  }, [tab, dose, gtt, parsed, conc, dropFactor, canCalcCommon, gttFromTap]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <header className="mb-5 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Mock • Conversão: mcg/kg/min ↔ gtt/min</h1>
          <span className="text-xs opacity-60">Preview isolado</span>
        </header>

        <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl p-5">
          {/* Como usar */}
          <div className="border border-zinc-800 bg-zinc-800/50 rounded-xl p-4 text-sm leading-relaxed">
            <p className="font-medium">Como usar</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Informe <b>peso (kg)</b>, <b>concentração</b> e <b>fator de gotas</b>.</li>
              <li>Converta <i>mcg/kg/min</i> ↔ <i>gtt/min</i>; <i>mL/h</i> aparece como referência.</li>
              <li>No modo "gtt/min → mcg/kg/min", você pode usar o <b>Tap</b> tocando no ritmo das gotas.</li>
              <li>Arredondamentos: gtt/min inteiro; mL/h com <b>2 casas</b>; mcg/kg/min com 2 casas.</li>
            </ul>
          </div>

          {/* Linha 1: Peso + Concentração (valor + unidade inline) */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Peso */}
            <div>
              <label className="text-xs opacity-80">Peso (kg)</label>
              <input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                inputMode="decimal"
                placeholder="Peso em kg (ex.: 70)"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Concentração (valor + unidade inline) */}
            <div>
              <label className="text-xs opacity-80">Concentração</label>
              <div className="flex gap-2 mt-1">
                <input
                  value={concValue}
                  onChange={(e) => setConcValue(e.target.value)}
                  inputMode="decimal"
                  placeholder="Valor numérico (ex.: 4)"
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <select
                  value={concUnit}
                  onChange={(e) => setConcUnit(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option>mg/mL</option>
                  <option>mcg/mL</option>
                </select>
              </div>
              <p className="text-[11px] opacity-60 mt-1">Ex.: 4 mg/mL, 0,08 mg/mL, 1 mg/mL</p>
            </div>
          </div>

          {/* Linha 2: Fator de gotas (full width) */}
          <div className="mt-4">
            <label className="text-xs opacity-80">Relação de gotas por 1 mL (gtt/mL)</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                value={factorStr}
                onChange={(e) => setFactorStr(e.target.value)}
                inputMode="numeric"
                placeholder="Ex.: 20"
                className="w-28 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <span className="text-xs opacity-70">ⓘ Macro: 10–20 gtt/mL • Micro: 60 gtt/mL</span>
            </div>
            {!hasFactor && (
              <p className="text-[11px] opacity-60 mt-1">Selecione um fator (Macro: 10–20 • Micro: 60 gotas/mL)</p>
            )}
          </div>

          {/* Abas */}
          <div className="mt-5 grid grid-cols-2 rounded-xl overflow-hidden border border-zinc-700">
            <button
              onClick={() => setTab("dose_to_gtt")}
              className={`py-2 ${tab === "dose_to_gtt" ? "bg-emerald-700" : "bg-zinc-900 hover:bg-zinc-800"}`}
            >
              mcg/kg/min → gtt/min
            </button>
            <button
              onClick={() => setTab("gtt_to_dose")}
              className={`py-2 ${tab === "gtt_to_dose" ? "bg-emerald-700" : "bg-zinc-900 hover:bg-zinc-800"}`}
            >
              gtt/min → mcg/kg/min
            </button>
          </div>

          {/* Conteúdo da aba */}
          {tab === "dose_to_gtt" ? (
            <div className="mt-4">
              <label className="text-xs opacity-80">Dose (mcg/kg/min)</label>
              <input
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                inputMode="decimal"
                placeholder="Dose em mcg/kg/min (ex.: 0,1)"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {/* Campo compartilhado para toques (Tap) e edição manual */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-xs opacity-80">Toques (Gotas)</label>
                  <input
                    value={running || drops > 0 ? String(drops) : gtt}
                    onChange={(e) => {
                      if (running) return; // não edita enquanto estiver contando
                      const v = e.target.value;
                      setGtt(v);
                      const n = ptNumber(v);
                      if (!isNaN(n)) setDrops(Math.max(0, Math.floor(n)));
                    }}
                    readOnly={running}
                    inputMode="numeric"
                    placeholder="Digite/Conte as gotas"
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs opacity-80">Tempo (s)</label>
                  <input
                    value={elapsed.toFixed(1)}
                    readOnly
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 opacity-80"
                  />
                </div>
                <div className="flex gap-2">
                  {!running ? (
                    <button className="w-full px-3 py-2 rounded-lg bg-emerald-700" onClick={onTap}>Gota</button>
                  ) : (
                    <button className="w-full px-3 py-2 rounded-lg bg-emerald-700" onClick={onTap}>Gota (+1)</button>
                  )}
                  {running ? (
                    <button className="px-3 py-2 rounded-lg bg-orange-600/90" onClick={onStop}>Parar</button>
                  ) : (
                    <button className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700" onClick={onReset}>Reset</button>
                  )}
                </div>
              </div>
              <p className="text-[11px] opacity-60">Ao usar o Tap, o cálculo de gtt/min só é feito quando você pressiona <b>Parar</b>.</p>
            </div>
          )}

          {/* Resultado */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Copyable label={result?.primaryLabel ?? "Resultado"} value={result?.primary ?? "—"} />
            <Copyable label={result?.secondaryLabel ?? "Resumo"} value={result?.secondary ?? "—"} />
          </div>

          {/* Rodapé com fórmulas */}
          <p className="mt-4 text-[11px] opacity-60">
            Fórmulas: gtt/min = (mcg/kg/min × kg × fator) / conc_(mcg/mL) · mcg/kg/min = (gtt/min × conc_(mcg/mL)) / (kg × fator) · mL/h = gtt/min × (60 / fator)
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------- Testes rápidos (sanidade) ----------
if (typeof window !== "undefined") {
  // 1) gtt → mL/h: 15 gtt/min, fator 20 => 45 mL/h
  console.assert(Math.abs(gttMinToMlH(15, 20) - 45) < 1e-9, "gtt→mL/h falhou");
  // 2) mcg/kg/min → gtt/min (70 kg, 4 mg/mL (=4000 mcg/mL), dose 0,1, fator 20)
  const gttCalc = mcgKgMinToGttMin(0.1, { weightKg: 70, conc: { value: 4, unit: "mg/mL" }, dropFactor: 20 });
  console.assert(Math.abs(gttCalc - 35) < 1e-6, "mcg/kg/min→gtt/min falhou");
  // 3) inversa (usa resultado 35 gtt/min)
  const doseBack = gttMinToMcgKgMin(35, { weightKg: 70, conc: { value: 4, unit: "mg/mL" }, dropFactor: 20 });
  console.assert(Math.abs(doseBack - 0.1) < 1e-6, "gtt/min→mcg/kg/min falhou");
}
