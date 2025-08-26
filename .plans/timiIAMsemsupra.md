# TIMI UA/NSTEMI — Escore de risco em 14 dias (SCASSST)

**Status:** pronto para implementação • **Módulo:** `Tools/Prebuilt/ClinicalScores` • **Owner:** Calculadoras e Escores • **Última revisão:** 2025-08-22

---

## A) Escopo clínico e referências

**Objetivo:** estimar o risco de **desfecho composto em 14 dias** (morte, IAM, revascularização urgente) em pacientes com **angina instável/NSTEMI (SCASSST)** na apresentação.

**Variáveis (7, 1 ponto cada):**

1. Idade ≥ 65 anos
2. ≥ 3 fatores de risco para DAC
3. DAC conhecida com estenose ≥ 50%
4. Uso de AAS nos últimos 7 dias
5. ≥ 2 episódios de angina nas últimas 24h (aqui resumido como “angina instável 24h”)
6. Elevação de biomarcadores de necrose miocárdica
7. Alteração do segmento ST ≥ 0,5 mm (desvio)

**Estratos práticos:**

* **Baixo:** 0–2 pontos
* **Intermediário:** 3–4 pontos
* **Alto:** ≥5 pontos

**Risco típico por escore (14 dias):**

* 0–1 → **3–5%**
* 2 → **3–8%**
* 3 → **5–13%**
* 4 → **7–20%**
* 5 → **12–26%**
* 6–7 → **19–41%**

**Fontes:** Antman EM et al., JAMA 2000 (TIMI UA/NSTEMI). Diretrizes AHA/ACC para NSTE-ACS.

> **Nota clínica:** usar em conjunto com avaliação clínica e outros escores (ex.: HEART) principalmente em dor torácica indiferenciada.

---

## B) Requisitos funcionais

1. **Entrada:** 7 checkboxes (booleanos) + explicações rápidas (tooltips) dos critérios.
2. **Cálculo:** soma (0–7). Derivar **estrato** (baixo/intermediário/alto) e **faixa de risco (%)** conforme tabela acima.
3. **Saída:**

   * `score` (0–7)
   * `riskBand` (`"low" | "intermediate" | "high"`)
   * `riskPercentRange` (string, p.ex. `"7–20%"`)
   * `advice` (mensagem curta)
   * `structuredNote` (nota pronta p/ prontuário)
4. **Estados de UI:** incompleto (sem seleção) → escore = 0; completo → cartão com *badge* e %.
5. **Ações rápidas:** copiar nota; salvar `Observation`; limpar.

---

## C) I/O (TypeScript) — contrato

### Inputs (`TimiNsteInput`)

```ts
export type TimiNsteInput = {
  ageGte65: boolean;                 // Idade ≥ 65 anos
  threeOrMoreRiskFactors: boolean;   // ≥3 fatores de risco para DAC
  knownCadGte50: boolean;            // DAC conhecida ≥ 50%
  aspirinLast7d: boolean;            // Uso de AAS nos últimos 7 dias
  recentSevereAngina24h: boolean;    // Angina/episódios nas últimas 24h
  elevatedMarkers: boolean;          // Biomarcadores elevados
  stDeviationGte05mm: boolean;       // Desvio do ST ≥ 0,5 mm
};
```

### Outputs (`TimiNsteResult`)

```ts
export type TimiNsteResult = {
  score: 0|1|2|3|4|5|6|7;
  riskBand: "low" | "intermediate" | "high";
  riskPercentRange: string; // "3–5%", "7–20%" etc.
  advice: string;
  structuredNote: string;
};
```

---

## D) Lógica (pseudocódigo)

```pseudo
function computeTimiNste(input):
  // tratar undefined como false
  let score = sum(booleans in input)
  if score <= 2 -> band = low, pct = "3–8%" (usar 0–1: "3–5%"; 2: "3–8%")
  else if score <= 4 -> band = intermediate, pct = score==3?"5–13%":"7–20%"
  else -> band = high, pct = score==5?"12–26%":"19–41%"
  advice = texto curto sobre estratégia invasiva precoce conforme risco
  structuredNote = template com checklist de critérios + escore + pct + conduta
  return {score, band, pct, advice, structuredNote}
```

---

## E) UX/UI — diretrizes

* **Componente:** cartão com 7 *checkboxes* e cálculo reativo.
* **Resultado:** *badge* do estrato e faixa de risco.
* **Acessibilidade:** `fieldset/legend`, rótulos clicáveis, navegação por teclado.
* **i18n:** chaves `tools.timi_nste.*` (abaixo).

---

## F) Persistência e interoperabilidade

* **Interno:** `Observations` com `type = "TIMI_UA_NSTEMI"`, `score`, `riskBand`, `riskPercentRange`, `answers`, `provenance`.
* **FHIR (opcional):** `QuestionnaireResponse` + `Observation` (perfil de risco). Mapear itens booleanos.

---

## G) i18n (PT‑BR)

```json
{
  "tools": {
    "timi_nste": {
      "title": "TIMI UA/NSTEMI — risco em 14 dias",
      "descShort": "Estratificação de risco em SCASSST.",
      "ageGte65": "Idade ≥ 65 anos",
      "threeOrMoreRiskFactors": "≥ 3 fatores de risco para coronariopatia",
      "knownCadGte50": "Coronariopatia conhecida com obstrução ≥ 50%",
      "aspirinLast7d": "Uso de AAS nos últimos 7 dias",
      "recentSevereAngina24h": "Angina instável nas últimas 24 horas",
      "elevatedMarkers": "Elevação dos marcadores de necrose miocárdica",
      "stDeviationGte05mm": "Alteração do segmento ST ≥ 0,5 mm",
      "score": "Valor (pontos)",
      "meaning": "Significado",
      "riskLow": "Baixo risco (0–2)",
      "riskIntermediate": "Risco intermediário (3–4)",
      "riskHigh": "Alto risco (≥5)",
      "riskRange": "Risco (14 dias)",
      "advice": "Considerar estratégia invasiva precoce conforme estrato e contexto clínico.",
      "copyNote": "Copiar nota",
      "save": "Salvar",
      "reset": "Limpar"
    }
  }
}
```

---

## H) Template de nota estruturada

```
TIMI UA/NSTEMI — {DATA}
Critérios: idade≥65 {AGE}; ≥3 FR {RISKFACT}; DAC≥50% {CAD}; AAS7d {ASA}; angina24h {ANG}; marcadores {MARK}; ST≥0,5mm {ST}
Escore: {SCORE} → {BAND} — risco 14d: {PCT}
Conduta sugerida: {ADVICE}
Observação: usar em conjunto com avaliação clínica e outros escores quando apropriado.
Ref.: Antman JAMA 2000; AHA/ACC NSTE-ACS.
```

---

## I) Componente React (TypeScript + Tailwind + shadcn/ui)

> **Arquivo:** `frontend/src/components/Tools/prebuilt/TIMI_UA_NSTEMI.tsx`

```tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCopy } from "lucide-react";

export type TimiNsteInput = {
  ageGte65: boolean;
  threeOrMoreRiskFactors: boolean;
  knownCadGte50: boolean;
  aspirinLast7d: boolean;
  recentSevereAngina24h: boolean;
  elevatedMarkers: boolean;
  stDeviationGte05mm: boolean;
};

export type TimiNsteResult = {
  score: 0|1|2|3|4|5|6|7;
  riskBand: "low" | "intermediate" | "high";
  riskPercentRange: string;
  advice: string;
  structuredNote: string;
};

const t = (k: string) => {
  const d: Record<string, string> = {
    title: "TIMI UA/NSTEMI — risco em 14 dias",
    ageGte65: "Idade ≥ 65 anos",
    threeOrMoreRiskFactors: "≥ 3 fatores de risco para coronariopatia",
    knownCadGte50: "Coronariopatia com obstrução ≥ 50%",
    aspirinLast7d: "Uso de AAS nos últimos 7 dias",
    recentSevereAngina24h: "Angina instável nas últimas 24 horas",
    elevatedMarkers: "Elevação dos marcadores de necrose miocárdica",
    stDeviationGte05mm: "Alteração do segmento ST ≥ 0,5 mm",
    score: "Valor (pontos)",
    meaning: "Significado",
    riskLow: "Baixo risco (0–2)",
    riskIntermediate: "Risco intermediário (3–4)",
    riskHigh: "Alto risco (≥5)",
    riskRange: "Risco (14 dias)",
    advice: "Considerar estratégia invasiva precoce conforme estrato e contexto clínico.",
    copyNote: "Copiar nota",
    save: "Salvar",
    reset: "Limpar",
  }; return d[k] ?? k;
};

function mapRisk(score: number): { band: "low"|"intermediate"|"high"; pct: string; label: string } {
  if (score <= 1) return { band: "low", pct: "3–5%", label: t("riskLow") };
  if (score === 2) return { band: "low", pct: "3–8%", label: t("riskLow") };
  if (score === 3) return { band: "intermediate", pct: "5–13%", label: t("riskIntermediate") };
  if (score === 4) return { band: "intermediate", pct: "7–20%", label: t("riskIntermediate") };
  if (score === 5) return { band: "high", pct: "12–26%", label: t("riskHigh") };
  return { band: "high", pct: "19–41%", label: t("riskHigh") }; // 6–7
}

export function computeTimiNste(input: TimiNsteInput): TimiNsteResult {
  const vals = Object.values(input).map(Boolean);
  const score = vals.reduce((a, b) => a + (b ? 1 : 0), 0) as 0|1|2|3|4|5|6|7;
  const m = mapRisk(score);
  const advice = `${t("advice")} (${m.label}; ${m.pct}).`;
  const flags = {
    AGE: input.ageGte65 ? "Sim" : "Não",
    RISKFACT: input.threeOrMoreRiskFactors ? "Sim" : "Não",
    CAD: input.knownCadGte50 ? "Sim" : "Não",
    ASA: input.aspirinLast7d ? "Sim" : "Não",
    ANG: input.recentSevereAngina24h ? "Sim" : "Não",
    MARK: input.elevatedMarkers ? "Sim" : "Não",
    ST: input.stDeviationGte05mm ? "Sim" : "Não",
  } as const;
  const structuredNote = [
    `TIMI UA/NSTEMI (14 dias)`,
    `Critérios: idade≥65 ${flags.AGE}; ≥3 FR ${flags.RISKFACT}; DAC≥50% ${flags.CAD}; AAS7d ${flags.ASA}; angina24h ${flags.ANG}; marcadores ${flags.MARK}; ST≥0,5mm ${flags.ST}`,
    `Escore: ${score} → ${m.label} — risco: ${m.pct}`,
    `Conduta: ${advice}`,
    `Obs.: usar com avaliação clínica/HEART quando apropriado. Ref.: Antman JAMA 2000.`,
  ].join("\n");
  return { score, riskBand: m.band, riskPercentRange: m.pct, advice, structuredNote };
}

export default function TIMI_UA_NSTEMI() {
  const [input, setInput] = React.useState<TimiNsteInput>({
    ageGte65: false,
    threeOrMoreRiskFactors: false,
    knownCadGte50: false,
    aspirinLast7d: false,
    recentSevereAngina24h: false,
    elevatedMarkers: false,
    stDeviationGte05mm: false,
  });

  const result = computeTimiNste(input);
  const set = (k: keyof TimiNsteInput, v: boolean) => setInput((s) => ({ ...s, [k]: v }));

  const copyNote = async () => { await navigator.clipboard.writeText(result.structuredNote); };
  const reset = () => setInput({
    ageGte65: false,
    threeOrMoreRiskFactors: false,
    knownCadGte50: false,
    aspirinLast7d: false,
    recentSevereAngina24h: false,
    elevatedMarkers: false,
    stDeviationGte05mm: false,
  });

  const BandBadge = ({band}:{band: TimiNsteResult["riskBand"]}) => {
    const map: Record<TimiNsteResult["riskBand"], string> = {
      low: "bg-green-600",
      intermediate: "bg-amber-600",
      high: "bg-red-700",
    };
    const label = band === "low" ? t("riskLow") : band === "intermediate" ? t("riskIntermediate") : t("riskHigh");
    return <Badge className={map[band]}>{label}</Badge>;
  };

  const Row = ({id, label, k}:{id:string; label:string; k:keyof TimiNsteInput}) => (
    <div className="flex items-center space-x-2">
      <Checkbox id={id} checked={input[k]} onCheckedChange={(v)=>set(k, Boolean(v))} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <fieldset className="space-y-3">
          <legend className="sr-only">Critérios TIMI UA/NSTEMI</legend>
          <Row id="age" label={t("ageGte65")} k="ageGte65" />
          <Row id="rf" label={t("threeOrMoreRiskFactors")} k="threeOrMoreRiskFactors" />
          <Row id="cad" label={t("knownCadGte50")} k="knownCadGte50" />
          <Row id="asa" label={t("aspirinLast7d")} k="aspirinLast7d" />
          <Row id="ang" label={t("recentSevereAngina24h")} k="recentSevereAngina24h" />
          <Row id="mark" label={t("elevatedMarkers")} k="elevatedMarkers" />
          <Row id="st" label={t("stDeviationGte05mm")} k="stDeviationGte05mm" />
        </fieldset>

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
      </CardContent>
    </Card>
  );
}
```

---

## J) Testes (Jest)

**Arquivo:** `frontend/src/components/Tools/prebuilt/__tests__/TIMI_UA_NSTEMI.test.ts`

```ts
import { computeTimiNste, type TimiNsteInput } from "../TIMI_UA_NSTEMI";

const none: TimiNsteInput = {
  ageGte65: false,
  threeOrMoreRiskFactors: false,
  knownCadGte50: false,
  aspirinLast7d: false,
  recentSevereAngina24h: false,
  elevatedMarkers: false,
  stDeviationGte05mm: false,
};

test("vazio → score 0, baixo risco e 3–5%", () => {
  const r = computeTimiNste(none);
  expect(r.score).toBe(0);
  expect(r.riskBand).toBe("low");
  expect(r.riskPercentRange).toBe("3–5%");
});

test("score 4 → intermediário e 7–20%", () => {
  const r = computeTimiNste({ ...none, ageGte65: true, threeOrMoreRiskFactors: true, aspirinLast7d: true, stDeviationGte05mm: true });
  expect(r.score).toBe(4);
  expect(r.riskBand).toBe("intermediate");
  expect(r.riskPercentRange).toBe("7–20%");
});

test("score ≥5 → alto risco", () => {
  const r = computeTimiNste({ ...none, ageGte65: true, threeOrMoreRiskFactors: true, knownCadGte50: true, elevatedMarkers: true, stDeviationGte05mm: true });
  expect(r.score).toBe(5);
  expect(r.riskBand).toBe("high");
  expect(["12–26%","19–41%"]).toContain(r.riskPercentRange);
});
```

---

## K) Edge cases e validações

* **Fatores de risco (≥3):** fornecer tooltip com exemplos (tabagismo, HAS, dislipidemia, DM, história familiar de DAC precoce).
* **ST ≥ 0,5 mm:** considerar depressão ou elevação (no contexto SCASSST).
* **Telemetria:** `calc_timi_nste_viewed/completed/saved` sem dados pessoais.
* **A11y:** foco por teclado, `aria-describedby` conforme necessário.

---

## L) Tarefas de engenharia

* [ ] Adicionar `TIMI_UA_NSTEMI.tsx` e testes.
* [ ] Registrar no catálogo com tags `cardiologia`, `dor torácica`, `NSTE-ACS`.
* [ ] Conectar persistência (`Observations`) e i18n real.
* [ ] QA clínico do texto/labels.

---

**Pronto para plug-and-play** no diretório `prebuilt/`. Inclui contrato, lógica testável, componente, testes, UX, persistência e ajuda.
