# GRACE 1.0 — Escore de risco (ACS)

**Status:** pronto para implementação • **Módulo:** `Tools/Prebuilt/ClinicalScores` • **Owner:** Calculadoras e Escores • **Última revisão:** 2025-08-22

---

## A) Escopo clínico e referências

**Objetivo:** estimar risco com o **GRACE 1.0** em pacientes com **síndrome coronariana aguda (SCA)** usando variáveis da apresentação. Este documento segue o **modelo de pontos** clássico e apresenta **faixas de risco** por **pontuação total** (inclui o corte GRACE **>140** como alto risco e critério para estratégia invasiva precoce).

> Nota: O artigo GRACE original reporta risco **intra-hospitalar** e **até 6 meses**. Como o seu molde pede “Risco intra-hospitalar” e o corte >140, este componente retorna **pontuação total** + **classe de risco** (baixo/médio/alto) baseada no **score**. É possível, futuramente, plugar o **GRACE 2.0** para obter **percentuais exatos** por paciente.

**Variáveis (8):** Classe de Killip, PAS sistólica, FC, Idade, Creatinina, Parada cardiorrespiratória (PCR) à admissão, Desvio do ST, Marcadores cardíacos.

---

## B) Requisitos funcionais

1. **Entrada:** 8 *radio groups* com faixas e seus pontos oficiais.
2. **Cálculo:** soma dos pontos → `score` (0–\~400). Derivar `riskBand` por cortes do score.
3. **Saída:**

   * `score` (inteiro)
   * `riskBand`: `"low" | "intermediate" | "high"`
   * `advice` (mensagem curta)
   * `structuredNote` (nota para prontuário)
4. **Estados:** incompleto (se algum campo não marcado) → placeholder.
5. **Ações:** copiar nota; salvar `Observation`; limpar.

---

## C) Contrato I/O (TypeScript)

### Inputs (`GraceInput`)

```ts
export type GraceInput = {
  killipPts: number | null;      // 0,20,39,59
  sbpPts: number | null;         // 58,53,43,34,24,10,0
  hrPts: number | null;          // 0,3,9,15,24,38,46
  agePts: number | null;         // 0,8,25,41,58,75,91,100
  creatPts: number | null;       // 1,4,7,10,13,21,28
  arrestPts: number | null;      // 39 ou 0 (PCR à admissão)
  stDeviationPts: number | null; // 39 ou 0
  markersPts: number | null;     // 14 ou 0
};
```

### Outputs (`GraceResult`)

```ts
export type GraceResult = {
  score: number;
  riskBand: "low" | "intermediate" | "high";
  advice: string;
  structuredNote: string;
};
```

---

## D) Tabela de pontos (faixas → pontos)

* **Killip:** I=0; II=20; III=39; IV=59.
* **PAS sistólica (mmHg):** ≤80=58; 80–99=53; 100–119=43; 120–139=34; 140–159=24; 160–199=10; ≥200=0.
* **FC (bpm):** ≤50=0; 50–69=3; 70–89=9; 90–109=15; 110–149=24; 150–199=38; ≥200=46.
* **Idade (anos):** ≤30=0; 30–39=8; 40–49=25; 50–59=41; 60–69=58; 70–79=75; 80–89=91; ≥90=100.
* **Creatinina (mg/dL):** 0–0,39=1; 0,40–0,79=4; 0,80–1,19=7; 1,20–1,59=10; 1,60–1,99=13; 2,00–3,99=21; ≥4=28.
* **PCR à admissão:** Presente=39; Ausente=0.
* **Desvio de ST:** Presente=39; Ausente=0.
* **Marcadores:** Presente=14; Ausente=0.

---

## E) Classificação por score

* **Baixo:** `score ≤ 108`
* **Médio:** `109–140`
* **Alto:** `≥ 141`

`advice` padrão: “Considerar **estratégia invasiva precoce** se `score > 140`, salvo contraindicações; de outra forma, estratificar junto ao risco isquêmico e contexto clínico.”

---

## F) Lógica (pseudocódigo)

```pseudo
function computeGrace(input):
  if any field is null -> return null
  score = sum(all points)
  if score <= 108 -> band = low
  else if score <= 140 -> band = intermediate
  else -> band = high
  advice = texto conforme corte de 140
  structuredNote = template com faixas escolhidas + score + band + advice
  return {score, band, advice, structuredNote}
```

---

## G) i18n (PT‑BR)

```json
{
  "tools": {
    "grace": {
      "title": "GRACE 1.0 — Risco (ACS)",
      "killip": "Killip",
      "sbp": "Pressão sistólica (mmHg)",
      "hr": "Frequência cardíaca (bpm)",
      "age": "Idade (anos)",
      "creat": "Creatinina (mg/dL)",
      "arrest": "PCR à admissão",
      "stdev": "Desvio do segmento ST",
      "markers": "Marcadores de necrose miocárdica",
      "present": "Presente",
      "absent": "Ausente",
      "score": "Valor",
      "risk": "Risco intra-hospitalar",
      "low": "Baixo (≤108)",
      "intermediate": "Médio (109–140)",
      "high": "Alto (≥141)",
      "advice140": "GRACE >140 traduz alto risco e pode indicar estratégia invasiva precoce.",
      "copyNote": "Copiar nota",
      "save": "Salvar",
      "reset": "Limpar",
      "incomplete": "Selecione uma opção em cada critério para ver o resultado."
    }
  }
}
```

---

## H) Template de nota estruturada

```
GRACE 1.0 — {DATA}
Killip {KILLIP}; PAS {SBP_RANGE}; FC {HR_RANGE}; Idade {AGE_RANGE}; Creatinina {CREAT_RANGE}; PCR admissão {ARREST}; Desvio ST {ST}; Marcadores {MARK}
Escore total: {SCORE} → {BAND}
Conduta sugerida: {ADVICE}
Obs.: este é o modelo de pontos do GRACE 1.0; considerar GRACE 2.0 para probabilidade (%) personalizada se disponível.
Ref.: GRACE (BMJ 2006) e diretrizes ACS.
```

---

## I) Componente React (TypeScript + Tailwind + shadcn/ui)

> **Arquivo:** `frontend/src/components/Tools/prebuilt/GRACE.tsx`

```tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ClipboardCopy } from "lucide-react";

export type GraceInput = {
  killipPts: number | null;
  sbpPts: number | null;
  hrPts: number | null;
  agePts: number | null;
  creatPts: number | null;
  arrestPts: number | null;
  stDeviationPts: number | null;
  markersPts: number | null;
};

export type GraceResult = {
  score: number;
  riskBand: "low" | "intermediate" | "high";
  advice: string;
  structuredNote: string;
};

const t = (k: string) => {
  const d: Record<string, string> = {
    title: "GRACE 1.0 — Risco (ACS)",
    killip: "Killip",
    sbp: "Pressão sistólica (mmHg)",
    hr: "Frequência cardíaca (bpm)",
    age: "Idade (anos)",
    creat: "Creatinina (mg/dL)",
    arrest: "PCR à admissão",
    stdev: "Desvio do segmento ST",
    markers: "Marcadores de necrose miocárdica",
    present: "Presente",
    absent: "Ausente",
    score: "Valor",
    risk: "Risco intra-hospitalar",
    low: "Baixo (≤108)",
    intermediate: "Médio (109–140)",
    high: "Alto (≥141)",
    advice140: "GRACE >140 traduz alto risco e pode indicar estratégia invasiva precoce.",
    copyNote: "Copiar nota",
    save: "Salvar",
    reset: "Limpar",
    incomplete: "Selecione uma opção em cada critério para ver o resultado.",
  }; return d[k] ?? k;
};

function classify(score: number) {
  if (score <= 108) return { band: "low" as const, label: t("low") };
  if (score <= 140) return { band: "intermediate" as const, label: t("intermediate") };
  return { band: "high" as const, label: t("high") };
}

export function computeGrace(input: GraceInput | null): GraceResult | null {
  if (!input) return null;
  const vals = Object.values(input);
  if (vals.some((v) => v === null)) return null;
  const score = vals.reduce((a, b) => a + (b as number), 0);
  const c = classify(score);
  const advice = c.band === "high" ? t("advice140") : "Estratifique com clínica e considere GRACE 2.0 para probabilidade em %.";

  const structuredNote = [
    `GRACE 1.0 (ACS)`,
    `Escore: ${score} → ${c.label}`,
    `Conduta: ${advice}`,
    `Obs.: modelo de pontos; considerar GRACE 2.0 para % exata. Ref.: BMJ 2006.`,
  ].join("\n");

  return { score, riskBand: c.band, advice, structuredNote };
}

const Row = ({id, label, k, options, value, on}:{
  id: string;
  label: string;
  k: keyof GraceInput;
  options: { label: string; value: number }[];
  value: number | null;
  on: (k: keyof GraceInput, v: number) => void;
}) => (
  <fieldset className="space-y-2">
    <legend className="font-medium">{label}</legend>
    <RadioGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3" value={String(value)} onValueChange={(v)=>on(k, parseInt(v))}>
      {options.map((o, i) => (
        <div className="flex items-center space-x-2" key={`${id}_${i}`}>
          <RadioGroupItem id={`${id}_${i}`} value={String(o.value)} />
          <Label htmlFor={`${id}_${i}`}>{o.label}</Label>
        </div>
      ))}
    </RadioGroup>
  </fieldset>
);

export default function GRACE() {
  const [input, setInput] = React.useState<GraceInput>({
    killipPts: null,
    sbpPts: null,
    hrPts: null,
    agePts: null,
    creatPts: null,
    arrestPts: null,
    stDeviationPts: null,
    markersPts: null,
  });

  const result = computeGrace(input);
  const on = (k: keyof GraceInput, v: number) => setInput((s) => ({ ...s, [k]: v }));
  const copyNote = async () => { if (!result) return; await navigator.clipboard.writeText(result.structuredNote); };
  const reset = () => setInput({ killipPts: null, sbpPts: null, hrPts: null, agePts: null, creatPts: null, arrestPts: null, stDeviationPts: null, markersPts: null });

  const BandBadge = ({band}:{band: GraceResult["riskBand"]}) => {
    const map: Record<GraceResult["riskBand"], string> = {
      low: "bg-green-600",
      intermediate: "bg-amber-600",
      high: "bg-red-700",
    };
    const label = band === "low" ? t("low") : band === "intermediate" ? t("intermediate") : t("high");
    return <Badge className={map[band]}>{label}</Badge>;
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Row id="killip" label={t("killip")} k="killipPts" value={input.killipPts} on={on} options={[
          {label: "I (sem IC)", value: 0},
          {label: "II (estertores ou turgência)", value: 20},
          {label: "III (edema agudo de pulmão)", value: 39},
          {label: "IV (choque cardiogênico)", value: 59},
        ]} />

        <Row id="sbp" label={t("sbp")} k="sbpPts" value={input.sbpPts} on={on} options={[
          {label: "≤ 80", value: 58},
          {label: "80–99", value: 53},
          {label: "100–119", value: 43},
          {label: "120–139", value: 34},
          {label: "140–159", value: 24},
          {label: "160–199", value: 10},
          {label: "≥ 200", value: 0},
        ]} />

        <Row id="hr" label={t("hr")} k="hrPts" value={input.hrPts} on={on} options={[
          {label: "≤ 50", value: 0},
          {label: "50–69", value: 3},
          {label: "70–89", value: 9},
          {label: "90–109", value: 15},
          {label: "110–149", value: 24},
          {label: "150–199", value: 38},
          {label: "≥ 200", value: 46},
        ]} />

        <Row id="age" label={t("age")} k="agePts" value={input.agePts} on={on} options={[
          {label: "≤ 30", value: 0},
          {label: "30–39", value: 8},
          {label: "40–49", value: 25},
          {label: "50–59", value: 41},
          {label: "60–69", value: 58},
          {label: "70–79", value: 75},
          {label: "80–89", value: 91},
          {label: "≥ 90", value: 100},
        ]} />

        <Row id="creat" label={t("creat")} k="creatPts" value={input.creatPts} on={on} options={[
          {label: "0–0,39", value: 1},
          {label: "0,40–0,79", value: 4},
          {label: "0,80–1,19", value: 7},
          {label: "1,20–1,59", value: 10},
          {label: "1,60–1,99", value: 13},
          {label: "2,00–3,99", value: 21},
          {label: "≥ 4", value: 28},
        ]} />

        <Row id="arrest" label={t("arrest")} k="arrestPts" value={input.arrestPts} on={on} options={[
          {label: t("present"), value: 39},
          {label: t("absent"), value: 0},
        ]} />

        <Row id="st" label={t("stdev")} k="stDeviationPts" value={input.stDeviationPts} on={on} options={[
          {label: t("present"), value: 39},
          {label: t("absent"), value: 0},
        ]} />

        <Row id="markers" label={t("markers")} k="markersPts" value={input.markersPts} on={on} options={[
          {label: t("present"), value: 14},
          {label: t("absent"), value: 0},
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
              <div className="ml-4 text-sm text-muted-foreground">{t("risk")}:</div>
              <BandBadge band={result.riskBand} />
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

## J) Testes (Jest)

**Arquivo:** `frontend/src/components/Tools/prebuilt/__tests__/GRACE.test.ts`

```ts
import { computeGrace, type GraceInput } from "../GRACE";

const empty: GraceInput = {
  killipPts: null, sbpPts: null, hrPts: null, agePts: null, creatPts: null, arrestPts: null, stDeviationPts: null, markersPts: null,
};

const base: GraceInput = {
  killipPts: 0, sbpPts: 34, hrPts: 9, agePts: 41, creatPts: 7, arrestPts: 0, stDeviationPts: 0, markersPts: 14,
};

test("incompleto → null", () => {
  expect(computeGrace(empty)).toBeNull();
});

test("score baixo classifica como low", () => {
  const r = computeGrace(base)!; // 34+9+41+7+14 = 105
  expect(r.score).toBeGreaterThan(0);
  expect(r.riskBand).toBe("low");
});

test("score >140 → high", () => {
  const high: GraceInput = { ...base, killipPts: 59, sbpPts: 53, hrPts: 24, agePts: 75, stDeviationPts: 39 };
  const r = computeGrace(high)!;
  expect(r.score).toBeGreaterThanOrEqual(141);
  expect(r.riskBand).toBe("high");
});
```

---

## K) Persistência e interoperabilidade

* **Interno:** `Observations` com `type = "GRACE_1_0"`, `score`, `riskBand`, `answers`, `provenance` (versão, usuário, data/hora).
* **FHIR (opcional):** `QuestionnaireResponse` + `Observation` (perfil de risco SCA).

---

## L) Tarefas de engenharia

* [ ] Adicionar `GRACE.tsx` + testes.
* [ ] Conectar i18n e persistência real.
* [ ] Registrar no catálogo (tags: `cardiologia`, `dor torácica`, `NSTE-ACS`).
* [ ] QA de acessibilidade e revisão clínica.

---

**Pronto para plug-and-play** no diretório `prebuilt/`. Inclui contrato, lógica testável, componente, testes e textos. Para **percentuais individuais**, planejar integração futura com **GRACE 2.0** (equações/logística) mantendo compatibilidade com este componente.
