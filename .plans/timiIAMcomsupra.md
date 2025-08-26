# TIMI STEMI — Escore de risco (mortalidade em 30 dias)

**Status:** pronto para implementação • **Módulo:** `Tools/Prebuilt/ClinicalScores` • **Owner:** Calculadoras e Escores • **Última revisão:** 2025-08-22

---

## A) Escopo clínico e referências

**Objetivo:** estimar risco de **mortalidade em 30 dias** na apresentação de **IAM com supra (STEMI)**.

**Contexto de uso:** pacientes **elegíveis à fibrinólise** (cenário de derivação). Complementar à avaliação e à estratégia de reperfusão; **não** substitui julgamento clínico.

**Fontes principais:**

* Morrow DA, Antman EM, Charlesworth A, et al. *TIMI Risk Score for ST‑Elevation Myocardial Infarction*. **Circulation**. 2000;102:2031‑2037.

---

## B) Variáveis e pontos

Marcar os critérios presentes **na admissão**:

* **História de diabetes, hipertensão ou angina** → **+1**
* **PAS < 100 mmHg** → **+3**
* **FC > 100 bpm** → **+2**
* **Killip II–IV** → **+2**
* **Peso < 67 kg** → **+1**
* **Supra de ST em parede anterior ou BRE novo** → **+1**
* **ΔT (tempo até tratamento) > 4 h** → **+1**
* **Idade** → `<65` = **0** | `65–74` = **+2** | `≥75` = **+3**

**Faixa total:** 0–14 pontos.

**Tabela de mortalidade (30 dias):**

* 0 → **0,8%**
* 1 → **1,6%**
* 2 → **2,2%**
* 3 → **4,4%**
* 4 → **7,3%**
* 5 → **12%**
* 6 → **16%**
* 7 → **23%**
* 8 → **27%**
* **9–14 → 36%**

---

## C) Requisitos funcionais

1. **Entrada:** 7 *checkboxes* (critérios binários) + 1 *radio group* (faixa etária).
2. **Cálculo:** `score = soma(checkboxes) + pontos(idade)`.
3. **Saída:**

   * `score` (0–14)
   * `mortalityPercent` (string, conforme tabela)
   * `structuredNote` (nota para prontuário)
   * `advice` (mensagem curta)
4. **Estados de UI:** incompleto (sem idade) vs. completo (exibe `score` e `%`).
5. **Ações:** Copiar nota, Salvar (Observation), Limpar.

---

## D) I/O (TypeScript)

### Inputs (`TimiStemiInput`)

```ts
export type TimiStemiInput = {
  hxDMHTNAngina: boolean;      // +1
  sbpLt100: boolean;           // +3
  hrGt100: boolean;            // +2
  killipIItoIV: boolean;       // +2
  weightLt67: boolean;         // +1
  anteriorSTEorNewLBBB: boolean; // +1
  timeToTxGt4h: boolean;       // +1
  ageCat: "lt65" | "65to74" | "ge75" | null; // 0 / +2 / +3
};
```

### Outputs (`TimiStemiResult`)

```ts
export type TimiStemiResult = {
  score: number;              // 0–14
  mortalityPercent: string;   // "0.8%" ... "36%"
  advice: string;
  structuredNote: string;
};
```

---

## E) Lógica (pseudocódigo)

```pseudo
function computeTimiStemi(input):
  if input.ageCat is null -> return null
  agePts = {lt65:0, 65to74:2, ge75:3}[input.ageCat]
  score = agePts
  + (input.hxDMHTNAngina ? 1 : 0)
  + (input.sbpLt100 ? 3 : 0)
  + (input.hrGt100 ? 2 : 0)
  + (input.killipIItoIV ? 2 : 0)
  + (input.weightLt67 ? 1 : 0)
  + (input.anteriorSTEorNewLBBB ? 1 : 0)
  + (input.timeToTxGt4h ? 1 : 0)

  mortalityPercent = lookup(score) // ver tabela F

  advice = "Estimativa de mortalidade em 30 dias; considerar estratégia de reperfusão mais precoce possível e suporte intensivo conforme risco."

  structuredNote = template(score, mortalityPercent, respostas)

  return {score, mortalityPercent, advice, structuredNote}
```

---

## F) Tabela de mapeamento (score → %)

```ts
const TIMI_STEMI_MORTALITY: Record<number, string> = {
  0: "0.8%",
  1: "1.6%",
  2: "2.2%",
  3: "4.4%",
  4: "7.3%",
  5: "12%",
  6: "16%",
  7: "23%",
  8: "27%",
};

function scoreToMortality(score: number): string {
  if (score >= 9) return "36%";
  return TIMI_STEMI_MORTALITY[score as 0|1|2|3|4|5|6|7|8] ?? "—";
}
```

---

## G) UX/UI — diretrizes

* **Componente:** cartão com grade de *checkboxes* (todos com rótulo clicável) e *radio* para idade.
* **Resultado:** badge com pontos e exibição proeminente de `%`.
* **Acessibilidade:** `fieldset/legend`, foco por teclado, `aria-describedby` nas seções.
* **i18n:** chaves `tools.timi_stemi.*` (abaixo).

---

## H) Persistência e interoperabilidade

* **Interno:** salvar em `Observations` (`type = "TIMI_STEMI"`, `score`, `mortalityPercent`, `answers` e `provenance`).
* **FHIR (opcional):** `QuestionnaireResponse` + `Observation` (profile de risco isquêmico), com mapeamento local das variáveis.

---

## I) i18n (PT‑BR)

```json
{
  "tools": {
    "timi_stemi": {
      "title": "TIMI STEMI — Mortalidade em 30 dias",
      "descShort": "Escore de apresentação para IAM com supra.",
      "checklistTitle": "Marque os critérios que se aplicam:",
      "hx": "História de diabetes, hipertensão ou angina",
      "sbp": "PA sistólica < 100 mmHg",
      "hr": "FC > 100 bpm",
      "killip": "Killip classe II–IV",
      "weight": "Peso < 67 kg",
      "steAntLbbb": "Supra de ST em parede anterior ou BRE novo",
      "deltaT": "ΔT > 4 horas",
      "age": "Idade",
      "lt65": "< 65 anos",
      "a65to74": "65 – 74 anos",
      "ge75": "≥ 75 anos",
      "incomplete": "Selecione a idade para calcular o escore.",
      "score": "Valor (pontos)",
      "mortality": "Mortalidade (30 dias)",
      "advice": "Estimativa de mortalidade em 30 dias; usar em conjunto com estratégia de reperfusão e suporte.",
      "copyNote": "Copiar nota",
      "save": "Salvar",
      "reset": "Limpar"
    }
  }
}
```

---

## J) Template de nota estruturada

```
TIMI STEMI — {DATA}
Critérios: HX(DM/HA/angina) {HX}; PAS<100 {SBP}; FC>100 {HR}; Killip II–IV {KILLIP}; Peso<67 {WT}; Ant. STE/novo BRE {STE}; ΔT>4h {DT}; Idade {AGE}
Escore: {SCORE} | Mortalidade estimada (30d): {PCT}
Conduta sugerida: {ADVICE}
Observação: escore derivado em população candidata a fibrinólise; interpretar no contexto clínico atual e disponibilidade de ICP.
Referência: Morrow et al., Circulation 2000.
```

---

## K) Componente React (TypeScript + Tailwind + shadcn/ui)

> **Arquivo:** `frontend/src/components/Tools/prebuilt/TIMI_STEMI.tsx`

```tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ClipboardCopy } from "lucide-react";

export type TimiStemiInput = {
  hxDMHTNAngina: boolean;
  sbpLt100: boolean;
  hrGt100: boolean;
  killipIItoIV: boolean;
  weightLt67: boolean;
  anteriorSTEorNewLBBB: boolean;
  timeToTxGt4h: boolean;
  ageCat: "lt65" | "65to74" | "ge75" | null;
};

export type TimiStemiResult = {
  score: number;
  mortalityPercent: string;
  advice: string;
  structuredNote: string;
};

const t = (k: string) => {
  const dict: Record<string, string> = {
    title: "TIMI STEMI — Mortalidade em 30 dias",
    checklistTitle: "Marque os critérios que se aplicam:",
    hx: "História de diabetes, hipertensão ou angina",
    sbp: "PA sistólica < 100 mmHg",
    hr: "FC > 100 bpm",
    killip: "Killip classe II–IV",
    weight: "Peso < 67 kg",
    ste: "Supra de ST em parede anterior ou BRE novo",
    dt: "ΔT > 4 horas",
    age: "Idade",
    lt65: "< 65 anos",
    a65to74: "65 – 74 anos",
    ge75: "≥ 75 anos",
    incomplete: "Selecione a idade para calcular o escore.",
    score: "Valor (pontos)",
    mortality: "Mortalidade (30 dias)",
    adviceText: "Estimativa de mortalidade em 30 dias; usar em conjunto com estratégia de reperfusão e suporte.",
    copyNote: "Copiar nota",
    save: "Salvar",
    reset: "Limpar",
  }; return dict[k] ?? k;
};

const MORTALITY_MAP: Record<number, string> = { 0:"0.8%",1:"1.6%",2:"2.2%",3:"4.4%",4:"7.3%",5:"12%",6:"16%",7:"23%",8:"27%" };

function scoreToMortality(score: number): string {
  return score >= 9 ? "36%" : (MORTALITY_MAP[score] ?? "—");
}

export function computeTimiStemi(input: TimiStemiInput | null): TimiStemiResult | null {
  if (!input) return null;
  if (input.ageCat === null) return null;
  const agePts = input.ageCat === "lt65" ? 0 : input.ageCat === "65to74" ? 2 : 3;
  const score = agePts
    + (input.hxDMHTNAngina ? 1 : 0)
    + (input.sbpLt100 ? 3 : 0)
    + (input.hrGt100 ? 2 : 0)
    + (input.killipIItoIV ? 2 : 0)
    + (input.weightLt67 ? 1 : 0)
    + (input.anteriorSTEorNewLBBB ? 1 : 0)
    + (input.timeToTxGt4h ? 1 : 0);

  const pct = scoreToMortality(score);
  const advice = t("adviceText");
  const structuredNote = [
    `TIMI STEMI`,
    `Escore: ${score} | Mortalidade (30d): ${pct}`,
    `Critérios: HX ${input.hxDMHTNAngina?"Sim":"Não"}; PAS<100 ${input.sbpLt100?"Sim":"Não"}; FC>100 ${input.hrGt100?"Sim":"Não"}; Killip II–IV ${input.killipIItoIV?"Sim":"Não"}; Peso<67 ${input.weightLt67?"Sim":"Não"}; Ant.STE/novo BRE ${input.anteriorSTEorNewLBBB?"Sim":"Não"}; ΔT>4h ${input.timeToTxGt4h?"Sim":"Não"}; Idade ${(input.ageCat==="lt65"?"<65":input.ageCat==="65to74"?"65–74":"≥75")}`,
    `Conduta sugerida: ${advice}`,
    `Obs.: escore derivado em cenário candidato a fibrinólise; interpretar no contexto clínico atual. Ref.: Morrow 2000.`,
  ].join("\n");

  return { score, mortalityPercent: pct, advice, structuredNote };
}

export default function TIMI_STEMI() {
  const [input, setInput] = React.useState<TimiStemiInput>({
    hxDMHTNAngina: false,
    sbpLt100: false,
    hrGt100: false,
    killipIItoIV: false,
    weightLt67: false,
    anteriorSTEorNewLBBB: false,
    timeToTxGt4h: false,
    ageCat: null,
  });

  const onChk = (k: keyof TimiStemiInput) => (val: boolean) => setInput((s)=>({ ...s, [k]: val }));
  const onAge = (v: string) => setInput((s)=>({ ...s, ageCat: v as TimiStemiInput["ageCat"] }));

  const result = computeTimiStemi(input);

  const copyNote = async () => { if (!result) return; await navigator.clipboard.writeText(result.structuredNote); };
  const reset = () => setInput({ hxDMHTNAngina:false, sbpLt100:false, hrGt100:false, killipIItoIV:false, weightLt67:false, anteriorSTEorNewLBBB:false, timeToTxGt4h:false, ageCat:null });

  const Row = ({id,label,k}:{id:string; label:string; k:keyof TimiStemiInput}) => (
    <div className="flex items-center space-x-2">
      <Checkbox id={id} checked={Boolean(input[k])} onCheckedChange={(v)=>onChk(k)(Boolean(v))} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <fieldset className="space-y-3">
          <legend className="font-medium">{t("checklistTitle")}</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Row id="hx" label={t("hx")} k="hxDMHTNAngina" />
            <Row id="sbp" label={t("sbp")} k="sbpLt100" />
            <Row id="hr" label={t("hr")} k="hrGt100" />
            <Row id="killip" label={t("killip")} k="killipIItoIV" />
            <Row id="weight" label={t("weight")} k="weightLt67" />
            <Row id="ste" label={t("ste")} k="anteriorSTEorNewLBBB" />
            <Row id="dt" label={t("dt")} k="timeToTxGt4h" />
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-medium">{t("age")}</legend>
          <RadioGroup className="flex flex-wrap gap-6" value={input.ageCat ?? ""} onValueChange={onAge}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="age_lt65" value="lt65" />
              <Label htmlFor="age_lt65">{t("lt65")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="age_65to74" value="65to74" />
              <Label htmlFor="age_65to74">{t("a65to74")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="age_ge75" value="ge75" />
              <Label htmlFor="age_ge75">{t("ge75")}</Label>
            </div>
          </RadioGroup>
        </fieldset>

        {!result && (
          <Alert>
            <AlertTitle>{t("incomplete")}</AlertTitle>
            <AlertDescription>{"Selecione a faixa etária para habilitar o cálculo."}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm text-muted-foreground">{t("score")}:</div>
              <Badge variant="secondary" className="text-base px-3">{result.score}</Badge>
              <div className="ml-4 text-sm text-muted-foreground">{t("mortality")}:</div>
              <Badge variant="outline" className="text-base px-3">{result.mortalityPercent}</Badge>
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

## L) Testes (Jest + RTL)

**Arquivo:** `frontend/src/components/Tools/prebuilt/__tests__/TIMI_STEMI.test.ts`

```ts
import { computeTimiStemi, type TimiStemiInput } from "../TIMI_STEMI";

const base: TimiStemiInput = {
  hxDMHTNAngina: false,
  sbpLt100: false,
  hrGt100: false,
  killipIItoIV: false,
  weightLt67: false,
  anteriorSTEorNewLBBB: false,
  timeToTxGt4h: false,
  ageCat: "lt65",
};

test("incompleto sem idade", () => {
  const x: TimiStemiInput = { ...base, ageCat: null };
  expect(computeTimiStemi(x)).toBeNull();
});

test("score 0 → 0.8%", () => {
  const r = computeTimiStemi(base)!;
  expect(r.score).toBe(0);
  expect(r.mortalityPercent).toBe("0.8%");
});

test("idade 65–74 (+2) + PAS<100 (+3) = 5 → 12%", () => {
  const r = computeTimiStemi({ ...base, ageCat: "65to74", sbpLt100: true })!;
  expect(r.score).toBe(5);
  expect(r.mortalityPercent).toBe("12%");
});

test("score ≥9 → 36%", () => {
  const r = computeTimiStemi({ ...base, ageCat: "ge75", sbpLt100: true, hrGt100: true, killipIItoIV: true })!; // 3+3+2+2 = 10
  expect(r.score).toBeGreaterThanOrEqual(9);
  expect(r.mortalityPercent).toBe("36%");
});
```

---

## M) Edge cases e validações

* **Obrigatório selecionar idade.**
* **ΔT > 4 h:** considerar mensagem educativa contextual sobre “tempo porta-agulha/porta-balão”.
* **Persistência e telemetria:** eventos `calc_timi_stemi_viewed/completed/saved` (sem dados pessoais).
* **A11y:** navegação por teclado; foco visível; rótulos clicáveis.

---

## N) Tarefas de engenharia

* [ ] Adicionar `TIMI_STEMI.tsx` e testes.
* [ ] Registrar no catálogo com tags `cardiologia`, `IAM`, `STEMI`, `prognóstico`.
* [ ] Conectar persistência (`Observations`) e i18n real.
* [ ] Revisão clínica do texto (mensagens e dicas contextuais de conduta).

---

## O) Texto de ajuda (modal “Saiba mais”)

**O que é?** Escore de apresentação para estimar mortalidade em 30 dias no IAM com supra (TIMI STEMI).

**Quando usar?** Paciente com STEMI, especialmente em contexto de **fibrinólise**. Interpretar junto com estratégia de reperfusão e risco hemorrágico.

**Como interpretar?** Some os pontos e leia a mortalidade na tabela. Resultados altos indicam risco maior e podem motivar priorização de suporte e reperfusão emergente.

**Limitações:** Derivado em estudos de trombólise; em serviços com ICP primária ampla, o prognóstico pode diferir. Não usar isoladamente para decisão terapêutica.

**Referência:** Morrow et al., *Circulation* 2000.

---

> **Pronto.** Documento inclui contrato, lógica, mapeamento oficial, componente React/TS, testes, UX, persistência e ajuda — no mesmo padrão das outras calculadoras prebuilt.
