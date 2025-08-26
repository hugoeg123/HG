# HEART — Dor torácica na emergência (MACE em 6 semanas)

**Status:** pronto para implementação • **Módulo:** `Tools/Prebuilt/ClinicalScores` • **Owner:** Calculadoras e Escores • **Última revisão:** 2025-08-22

---

## A) Escopo clínico e referências

**Objetivo:** estimar risco de **eventos cardiovasculares maiores (MACE) em 6 semanas** em adultos (≥21 anos) com **dor torácica aguda** na emergência, usando o escore **HEART** (History, ECG, Age, Risk factors, Troponin).

**Não aplicar** em: STEMI, hipotensão, diagnóstico confirmado de SCA, expectativa de vida <1 ano, ou etiologias não cardíacas que exijam internação.

**Variáveis (5, 0–2 pts cada):** História clínica, ECG, Idade, Fatores de risco, Troponina.

**Estratos e risco típico (6 semanas):**

* **Baixo (0–3):** \~**0,9–1,7%**
* **Moderado (4–6):** \~**12–16,6%**
* **Alto (≥7):** \~**50–65%**

**Fonte primária:** Six AJ et al., *Neth Heart J* 2008.

> Nota clínica: considerar protocolos com **troponina de alta sensibilidade** (limite superior de referência — 99º percentil). O componente “T” usa a razão ao LSR (1–3× ou ≥3×).

---

## B) Requisitos funcionais

1. **Entrada:** 5 *radio groups* conforme a tabela de pontos abaixo; tooltip com a definição de fatores de risco.
2. **Cálculo:** soma (0–10). Derivar **estrato** e **faixa de risco (%)**.
3. **Saída:**

   * `score` (0–10)
   * `riskBand` (`"low" | "moderate" | "high"`)
   * `riskPercentRange` (string — ex.: `"0,9–1,7%"`)
   * `advice` (mensagem curta)
   * `structuredNote` (nota pronta p/ prontuário)
4. **Estados:** incompleto (se faltar algum item) → placeholder; completo → cartão com *badge*.
5. **Ações rápidas:** copiar nota; salvar `Observation`; limpar.

---

## C) Tabela de pontos (oficial)

* **História (History):** alta suspeita=2; moderada=1; baixa=0.
* **ECG:** infra-ST significativo=2; distúrbio inespecífico de repolarização=1; normal=0.
* **Idade:** ≥65=2; 45–65=1; <45=0.
* **Fatores de risco:** ≥3 FR **ou** DAC/DA aterosclerótica conhecida=2; 1–2 FR=1; nenhum FR=0.
  *FR típicos:* hipercolesterolemia, hipertensão, diabetes, tabagismo, história familiar positiva, **obesidade (IMC>30)**.
* **Troponina:** ≥3× LSR=2; 1–3× LSR=1; normal=0.

---

## D) Contrato I/O (TypeScript)

### Inputs (`HeartInput`)

```ts
export type HeartInput = {
  historyPts: 0|1|2 | null;
  ecgPts: 0|1|2 | null;
  agePts: 0|1|2 | null;
  riskPts: 0|1|2 | null;
  troponinPts: 0|1|2 | null;
};
```

### Outputs (`HeartResult`)

```ts
export type HeartResult = {
  score: number; // 0–10
  riskBand: "low" | "moderate" | "high";
  riskPercentRange: string; // "0,9–1,7%", "12–16,6%", "50–65%"
  advice: string;
  structuredNote: string;
};
```

---

## E) Lógica (pseudocódigo)

```pseudo
function computeHeart(input):
  if any is null -> return null
  score = sum(points)
  if score <= 3 -> band=low, pct="0,9–1,7%"
  else if score <= 6 -> band=moderate, pct="12–16,6%"
  else -> band=high, pct="50–65%"
  advice = ação conforme estrato (alta precoce c/ follow-up vs. observação/estratégia invasiva)
  structuredNote = template com escolhas + score + banda + pct + conduta
  return {...}
```

---

## F) i18n (PT‑BR)

```json
{
  "tools": {
    "heart": {
      "title": "HEART — Dor torácica (MACE em 6 semanas)",
      "history": "História",
      "ecg": "ECG",
      "age": "Idade",
      "risk": "Fatores de risco",
      "troponin": "Troponina",
      "score": "Valor",
      "meaning": "Significado",
      "riskRange": "Risco (6 semanas)",
      "low": "Baixo (0–3)",
      "moderate": "Moderado (4–6)",
      "high": "Alto (≥7)",
      "riskFactorsTip": "FR: hipercolesterolemia, HAS, DM, tabagismo, história familiar, obesidade (IMC>30) ou DAC conhecida.",
      "advice": "Ajuste conduta: baixa → alta segura/seguimento; moderada → observação e seriadas; alta → manejo agressivo/estratégia invasiva conforme contexto.",
      "copyNote": "Copiar nota",
      "save": "Salvar",
      "reset": "Limpar",
      "incomplete": "Selecione uma opção em cada critério para ver o resultado."
    }
  }
}
```

---

## G) Template de nota estruturada

```
HEART — {DATA}
História {HIST}; ECG {ECG}; Idade {AGE}; FR {RISK}; Troponina {TROP}
Escore: {SCORE} → {BAND} — risco 6 semanas: {PCT}
Conduta sugerida: {ADVICE}
Obs.: não aplicar em STEMI/hipotensão/diagnóstico confirmado de SCA.
Ref.: Six et al., Neth Heart J 2008.
```

---

## H) Componente React (TypeScript + Tailwind + shadcn/ui)

> **Arquivo:** `frontend/src/components/Tools/prebuilt/HEART.tsx`

```tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ClipboardCopy, Info } from "lucide-react";

export type HeartInput = {
  historyPts: 0|1|2 | null;
  ecgPts: 0|1|2 | null;
  agePts: 0|1|2 | null;
  riskPts: 0|1|2 | null;
  troponinPts: 0|1|2 | null;
};

export type HeartResult = {
  score: number;
  riskBand: "low" | "moderate" | "high";
  riskPercentRange: string;
  advice: string;
  structuredNote: string;
};

const t = (k: string) => {
  const d: Record<string,string> = {
    title: "HEART — Dor torácica (MACE em 6 semanas)",
    history: "História",
    ecg: "ECG",
    age: "Idade",
    risk: "Fatores de risco",
    troponin: "Troponina",
    score: "Valor",
    meaning: "Significado",
    riskRange: "Risco (6 semanas)",
    low: "Baixo (0–3)",
    moderate: "Moderado (4–6)",
    high: "Alto (≥7)",
    riskFactorsTip: "FR: hipercolesterolemia, HAS, DM, tabagismo, história familiar, obesidade (IMC>30) ou DAC conhecida.",
    advice: "Ajuste conduta: baixa → alta segura/seguimento; moderada → observação e seriadas; alta → manejo agressivo/estratégia invasiva conforme contexto.",
    copyNote: "Copiar nota",
    save: "Salvar",
    reset: "Limpar",
    incomplete: "Selecione uma opção em cada critério para ver o resultado.",
  }; return d[k] ?? k;
};

function classify(score: number) {
  if (score <= 3) return { band: "low" as const, label: t("low"), pct: "0,9–1,7%" };
  if (score <= 6) return { band: "moderate" as const, label: t("moderate"), pct: "12–16,6%" };
  return { band: "high" as const, label: t("high"), pct: "50–65%" };
}

export function computeHeart(input: HeartInput | null): HeartResult | null {
  if (!input) return null;
  const vals = Object.values(input);
  if (vals.some(v => v === null)) return null;
  const score = vals.reduce((a,b)=> a + (b as number), 0);
  const c = classify(score);
  const advice = `${t("advice")} (${c.label}; ${c.pct}).`;
  const structuredNote = [
    `HEART`,
    `Escore: ${score} → ${c.label} — risco: ${c.pct}`,
    `Conduta: ${advice}`,
    `Obs.: não aplicar em STEMI/hipotensão/SCA confirmada. Ref.: Six 2008.`,
  ].join("\n");
  return { score, riskBand: c.band, riskPercentRange: c.pct, advice, structuredNote };
}

const Row = ({id, label, k, options, value, on}:{
  id: string; label: string; k: keyof HeartInput; value: number | null;
  options: { label: string; value: 0|1|2 }[]; on: (k: keyof HeartInput, v: 0|1|2) => void;
}) => (
  <fieldset className="space-y-2">
    <legend className="font-medium flex items-center gap-2">{label}
      {label === t("risk") && (
        <span className="inline-flex items-center text-xs text-muted-foreground"><Info className="h-4 w-4 mr-1" />{t("riskFactorsTip")}</span>
      )}
    </legend>
    <RadioGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3" value={String(value)} onValueChange={(v)=>on(k, parseInt(v) as 0|1|2)}>
      {options.map((o, i) => (
        <div className="flex items-center space-x-2" key={`${id}_${i}`}>
          <RadioGroupItem id={`${id}_${i}`} value={String(o.value)} />
          <Label htmlFor={`${id}_${i}`}>{o.label}</Label>
        </div>
      ))}
    </RadioGroup>
  </fieldset>
);

export default function HEART() {
  const [input, setInput] = React.useState<HeartInput>({
    historyPts: null,
    ecgPts: null,
    agePts: null,
    riskPts: null,
    troponinPts: null,
  });

  const result = computeHeart(input);
  const on = (k: keyof HeartInput, v: 0|1|2) => setInput((s)=>({ ...s, [k]: v }));
  const copyNote = async () => { if (!result) return; await navigator.clipboard.writeText(result.structuredNote); };
  const reset = () => setInput({ historyPts: null, ecgPts: null, agePts: null, riskPts: null, troponinPts: null });

  const BandBadge = ({band}:{band: HeartResult["riskBand"]}) => {
    const map: Record<HeartResult["riskBand"], string> = {
      low: "bg-green-600",
      moderate: "bg-amber-600",
      high: "bg-red-700",
    };
    const label = band === "low" ? t("low") : band === "moderate" ? t("moderate") : t("high");
    return <Badge className={map[band]}>{label}</Badge>;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Row id="history" label={t("history")} k="historyPts" value={input.historyPts} on={on} options={[
          {label: "Suspeita alta (2 pts)", value: 2},
          {label: "Suspeita moderada (1 pt)", value: 1},
          {label: "Suspeita baixa (0 pt)", value: 0},
        ]} />

        <Row id="ecg" label={t("ecg")} k="ecgPts" value={input.ecgPts} on={on} options={[
          {label: "Infra-ST significante (2 pts)", value: 2},
          {label: "Distúrbio de repolarização inespecífico (1 pt)", value: 1},
          {label: "Normal (0 pt)", value: 0},
        ]} />

        <Row id="age" label={t("age")} k="agePts" value={input.agePts} on={on} options={[
          {label: "≥ 65 (2 pts)", value: 2},
          {label: "45–65 (1 pt)", value: 1},
          {label: "< 45 (0 pt)", value: 0},
        ]} />

        <Row id="risk" label={t("risk")} k="riskPts" value={input.riskPts} on={on} options={[
          {label: "≥3 FR ou DAC/DA aterosclerótica conhecida (2 pts)", value: 2},
          {label: "1–2 fatores de risco (1 pt)", value: 1},
          {label: "Sem fatores de risco (0 pt)", value: 0},
        ]} />

        <Row id="troponin" label={t("troponin")} k="troponinPts" value={input.troponinPts} on={on} options={[
          {label: "≥ 3× limite normal (2 pts)", value: 2},
          {label: "1–3× limite normal (1 pt)", value: 1},
          {label: "Limite normal (0 pt)", value: 0},
        ]} />

        {!result && (
          <Alert>
            <AlertTitle>{t("incomplete")}</AlertTitle>
            <AlertDescription>{"Marque uma opção em cada grupo para calcular o escore."}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm text-muted-foreground">{t("score")}:</div>
              <Badge variant="secondary" className="text-base px-3">{result.score}</Badge>
              <div className="ml-4 text-sm text-muted-foreground">{t("meaning")}:</div>
              <BandBadge band={result.riskBand} />
              <div className="ml-4 text-sm text-muted-foreground">{t("riskRange")}:</div>
              <Badge variant="outline" className="text-base px-3">{result.riskPercentRange}</Badge>
            </div>

            <p className="text-sm">{result.advice}</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={copyNote}><ClipboardCopy className="mr-2 h-4 w-4" /> {t("copyNote")}</Button>
              <Button variant="default" onClick={() => {/* TODO: salvar em Observations */}}>{t("save")}</Button>
              <Button variant="ghost" onClick={reset}>{t("reset")}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## I) Testes (Jest)

**Arquivo:** `frontend/src/components/Tools/prebuilt/__tests__/HEART.test.ts`

```ts
import { computeHeart, type HeartInput } from "../HEART";

const empty: HeartInput = { historyPts: null, ecgPts: null, agePts: null, riskPts: null, troponinPts: null };

const low: HeartInput = { historyPts: 0, ecgPts: 0, agePts: 1, riskPts: 1, troponinPts: 1 }; // total 3
const mid: HeartInput = { historyPts: 1, ecgPts: 1, agePts: 1, riskPts: 1, troponinPts: 1 }; // total 5
const high: HeartInput = { historyPts: 2, ecgPts: 2, agePts: 2, riskPts: 2, troponinPts: 2 }; // total 10

test("incompleto → null", () => {
  expect(computeHeart(empty)).toBeNull();
});

test("score 3 → baixo e 0,9–1,7%", () => {
  const r = computeHeart(low)!;
  expect(r.score).toBe(3);
  expect(r.riskBand).toBe("low");
  expect(r.riskPercentRange).toBe("0,9–1,7%");
});

test("score 5 → moderado e 12–16,6%", () => {
  const r = computeHeart(mid)!;
  expect(r.score).toBe(5);
  expect(r.riskBand).toBe("moderate");
  expect(r.riskPercentRange).toBe("12–16,6%");
});

test("score 10 → alto e 50–65%", () => {
  const r = computeHeart(high)!;
  expect(r.score).toBe(10);
  expect(r.riskBand).toBe("high");
  expect(r.riskPercentRange).toBe("50–65%");
});
```

---

## J) Persistência e interoperabilidade

* **Interno:** `Observations` com `type = "HEART"`, `score`, `riskBand`, `riskPercentRange`, `answers`, `provenance`.
* **FHIR (opcional):** `QuestionnaireResponse` + `Observation` (perfil de risco), mapeando unidades e LSR de troponina.

---

## K) Tarefas de engenharia

* [ ] Adicionar `HEART.tsx` e testes.
* [ ] Registrar no catálogo com tags `dor torácica`, `HEART`, `emergência`.
* [ ] Conectar persistência e i18n real.
* [ ] QA clínico do texto/labels e ajuste para protocolos locais de troponina.

---

**Pronto para plug-and-play** no diretório `prebuilt/`. Inclui contrato, lógica testável, componente, testes, UX, persistência e ajuda.
