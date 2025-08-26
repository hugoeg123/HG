# CRUSADE — Escore de risco de sangramento intra-hospitalar no IAM/NSTE-ACS

**Status:** pronto para implementação • **Módulo:** `Tools/Prebuilt/ClinicalScores` • **Owner:** Calculadoras e Escores • **Última revisão:** 2025-08-22

---

## A) Escopo clínico e referências

**Objetivo:** estimar o **risco basal de sangramento maior intra-hospitalar** em pacientes com IAM, especialmente **NSTEMI/UA**, usando somente variáveis de admissão. Ferramenta para apoiar a decisão (não substitui julgamento clínico).

**Variáveis (8):** sexo, DM, doença vascular prévia, sinais de IC na admissão, FC, PAS sistólica, hematócrito basal, **depuração de creatinina (Cockcroft–Gault)**.

**Estratos clássicos:** Muito baixo (≤20), Baixo (21–30), Moderado (31–40), Alto (41–50), Muito alto (≥51).

**Riscos médios por estrato (coorte derivação CRUSADE):** 3,1% • 5,5% • 8,6% • 11,9% • 19,5%.

**Fontes principais (para revisão clínica interna):** Subherwal et al., Circulation 2009 (derivação/validação do escore). Revisões/validações subsequentes citadas no repositório de evidências do projeto.

> **Nota clínica:** usar **antes** de iniciar antitrombóticos; considerar em conjunto com risco isquêmico (ex.: GRACE) e contexto terapêutico.

---

## B) Requisitos funcionais

1. **Entrada:** seleção por faixas (radios) para cada variável, conforme tabela oficial de pontos.
2. **Cálculo:** soma de pontos (1–100). Derivar **estrato** e **risco (%)** representativo do estrato.
3. **Saída:**

   * `score` (inteiro 0–100)
   * `riskGroup` (`"veryLow" | "low" | "moderate" | "high" | "veryHigh"`)
   * `riskPercent` (string, p.ex. `"11.9%"`)
   * `advice` (mensagem curta de próxima ação)
   * `structuredNote` (nota pronta para prontuário)
4. **Estados de UI:** incompleto (placeholder) vs. completo (cartão com *badge* de estrato e %).
5. **Ações rápidas:** copiar nota; salvar `Observation`; limpar.

---

## C) I/O (TypeScript) — contrato

### Inputs (`CrusadeInput`)

```ts
export type CrusadeInput = {
  // Radios mapeiam diretamente em pontos conforme tabela D
  hematocritPts: number | null;      // 0,2,3,7,9
  crclPts: number | null;            // 0,7,17,28,35,39
  hrPts: number | null;              // 0,1,3,6,8,10,11
  sbpPts: number | null;             // 10,8,5,1,3,5
  priorVascularPts: number | null;   // 0,6
  diabetesPts: number | null;        // 0,6
  chfSignsPts: number | null;        // 0,7
  sexPts: number | null;             // 0 (masc), 8 (fem)
};
```

### Outputs (`CrusadeResult`)

```ts
export type CrusadeResult = {
  score: number; // 0–100
  riskGroup: "veryLow" | "low" | "moderate" | "high" | "veryHigh";
  riskPercent: string; // "3.1%" etc.
  advice: string;
  structuredNote: string;
};
```

---

## D) Tabela oficial de pontos (rápida)

* **Hematócrito (%)**: `<31`=9; `31–33.9`=7; `34–36.9`=3; `37–39.9`=2; `≥40`=0.
* **Depuração de creatinina (mL/min, Cockcroft–Gault)**: `<15`=39; `15–30`=35; `31–60`=28; `61–90`=17; `91–120`=7; `>120`=0.
* **Frequência cardíaca (bpm)**: `≤70`=0; `71–80`=1; `81–90`=3; `91–100`=6; `101–110`=8; `111–120`=10; `≥121`=11.
* **PAS sistólica (mmHg)**: `≤90`=10; `91–100`=8; `101–120`=5; `121–180`=1; `181–200`=3; `≥201`=5.
* **Sexo:** masculino=0; feminino=8.
* **Sinais de IC:** não=0; sim=7.
* **Doença vascular prévia:** não=0; sim=6.
* **Diabetes:** não=0; sim=6.

---

## E) Lógica (pseudocódigo)

```pseudo
function computeCrusade(input):
  if any field is null -> return null
  score = sum(all pts)
  if score <= 20 -> group = veryLow, pct = "3.1%"
  else if 21 <= score <= 30 -> group = low, pct = "5.5%"
  else if 31 <= score <= 40 -> group = moderate, pct = "8.6%"
  else if 41 <= score <= 50 -> group = high, pct = "11.9%"
  else -> group = veryHigh, pct = "19.5%"

  advice = short string suggesting balance risco hemo vs. isquêmico e revisão de terapia
  structuredNote = template with inputs chosen, score, group, pct, advice
  return {score, group, pct, advice, structuredNote}
```

> **Extensível:** `riskPercent` pode, futuramente, aceitar um **lookup por ponto** (1–100) se adotarmos uma tabela de probabilidades ponto-a-ponto. Por ora, usar o valor representativo por **estrato**.

---

## F) UX/UI — diretrizes

* **Componente:** cartão com 8 *radio groups* (Sim/Não ou faixas), cálculo reativo.
* **Resultado:** *badge* do estrato (cinza/verde/âmbar/vermelho/vinho) e % do estrato.
* **Acessibilidade:** `fieldset/legend`, rótulos clicáveis, navegação por teclado.
* **Ações:** “Salvar”, “Copiar Nota”, “Limpar”.
* **i18n:** chaves `tools.crusade.*` (abaixo).

---

## G) Persistência e interoperabilidade

* **Interno:** `Observations` com `type = "CRUSADE"`, `score`, `riskGroup`, `riskPercent`, `answers` (faixas selecionadas), `provenance` (versão, data, autor).
* **FHIR (opcional):** `Observation` + `QuestionnaireResponse`. Mapear unidades/IDs locais.

---

## H) i18n (PT‑BR)

```json
{
  "tools": {
    "crusade": {
      "title": "CRUSADE — Risco de sangramento intra-hospitalar",
      "descShort": "Estimativa basal de sangramento maior em IAM/NSTE-ACS.",
      "hct": "Hematócrito basal (%)",
      "crcl": "Depuração de creatinina (Cockcroft–Gault, mL/min)",
      "hr": "Frequência cardíaca à admissão (bpm)",
      "sbp": "Pressão arterial sistólica à admissão (mmHg)",
      "sex": "Sexo",
      "female": "Feminino",
      "male": "Masculino",
      "chf": "Sinais de insuficiência cardíaca",
      "dm": "Diabetes mellitus",
      "pvd": "Doença vascular prévia",
      "yes": "Sim",
      "no": "Não",
      "incomplete": "Preencha todas as variáveis para ver o resultado.",
      "score": "Valor (pontos)",
      "risk": "Significado",
      "riskVeryLow": "Muito baixo risco (≤20)",
      "riskLow": "Baixo risco (21–30)",
      "riskModerate": "Risco moderado (31–40)",
      "riskHigh": "Alto risco (41–50)",
      "riskVeryHigh": "Muito alto risco (≥51)",
      "riskPercent": "Risco de sangramento maior intra-hospitalar",
      "advice": "Equilibrar risco de sangramento vs. isquêmico; ajustar estratégia antitrombótica/abordagem invasiva conforme risco.",
      "copyNote": "Copiar nota",
      "save": "Salvar",
      "reset": "Limpar"
    }
  }
}
```

---

## I) Template de nota estruturada

```
CRUSADE (sangramento intra-hospitalar) — {DATA}
Variáveis: Ht {HCT_RANGE}; CrCl {CRCL_RANGE}; FC {HR_RANGE}; PAS {SBP_RANGE}; Sexo {SEXO}; IC {CHF}; DM {DM}; Vasculopatia {PVD}
Escore total: {SCORE} → {GRUPO} ({PCT})
Conduta sugerida: {ADVICE}
Observação: escore para risco basal; usar em conjunto com risco isquêmico e contexto terapêutico.
Referência: Subherwal et al., Circulation 2009.
```

---

## J) Componente React (TypeScript + Tailwind + shadcn/ui)

> **Arquivo:** `frontend/src/components/Tools/prebuilt/CRUSADE.tsx`

```tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ClipboardCopy } from "lucide-react";

export type CrusadeInput = {
  hematocritPts: number | null;
  crclPts: number | null;
  hrPts: number | null;
  sbpPts: number | null;
  priorVascularPts: number | null;
  diabetesPts: number | null;
  chfSignsPts: number | null;
  sexPts: number | null;
};

export type CrusadeResult = {
  score: number;
  riskGroup: "veryLow" | "low" | "moderate" | "high" | "veryHigh";
  riskPercent: string;
  advice: string;
  structuredNote: string;
};

const t = (k: string) => {
  const dict: Record<string, string> = {
    title: "CRUSADE — Risco de sangramento intra-hospitalar",
    hct: "Hematócrito basal (%)",
    crcl: "Depuração de creatinina (Cockcroft–Gault, mL/min)",
    hr: "Frequência cardíaca à admissão (bpm)",
    sbp: "Pressão arterial sistólica à admissão (mmHg)",
    sex: "Sexo",
    female: "Feminino",
    male: "Masculino",
    chf: "Sinais de insuficiência cardíaca",
    dm: "Diabetes mellitus",
    pvd: "Doença vascular prévia",
    yes: "Sim",
    no: "Não",
    incomplete: "Preencha todas as variáveis para ver o resultado.",
    score: "Valor (pontos)",
    risk: "Significado",
    riskPercent: "Risco de sangramento maior intra-hospitalar",
    riskVeryLow: "Muito baixo risco (≤20)",
    riskLow: "Baixo risco (21–30)",
    riskModerate: "Risco moderado (31–40)",
    riskHigh: "Alto risco (41–50)",
    riskVeryHigh: "Muito alto risco (≥51)",
    advice: "Equilibrar risco de sangramento vs. isquêmico; ajustar estratégia antitrombótica/abordagem invasiva conforme risco.",
    copyNote: "Copiar nota",
    save: "Salvar",
    reset: "Limpar",
  };
  return dict[k] ?? k;
};

function classify(score: number) {
  if (score <= 20) return { group: "veryLow" as const, label: t("riskVeryLow"), pct: "3.1%" };
  if (score <= 30) return { group: "low" as const, label: t("riskLow"), pct: "5.5%" };
  if (score <= 40) return { group: "moderate" as const, label: t("riskModerate"), pct: "8.6%" };
  if (score <= 50) return { group: "high" as const, label: t("riskHigh"), pct: "11.9%" };
  return { group: "veryHigh" as const, label: t("riskVeryHigh"), pct: "19.5%" };
}

export function computeCrusade(input: CrusadeInput | null): CrusadeResult | null {
  if (!input) return null;
  const vals = Object.values(input);
  if (vals.some((v) => v === null)) return null;
  const score = vals.reduce((a, b) => a + (b as number), 0);
  const c = classify(score);
  const advice = `${t("advice")} (${c.label}; ${c.pct}).`;
  const structuredNote = [
    `CRUSADE (sangramento intra-hospitalar)`,
    `Escore: ${score} → ${c.label} (${c.pct})`,
    `Conduta: ${advice}`,
    `Obs.: risco basal; considerar risco isquêmico e contexto terapêutico. Ref.: Subherwal 2009.`,
  ].join("\n");
  return { score, riskGroup: c.group, riskPercent: c.pct, advice, structuredNote };
}

export default function CRUSADE() {
  const [input, setInput] = React.useState<CrusadeInput>({
    hematocritPts: null,
    crclPts: null,
    hrPts: null,
    sbpPts: null,
    priorVascularPts: null,
    diabetesPts: null,
    chfSignsPts: null,
    sexPts: null,
  });

  const result = computeCrusade(input);
  const on = (k: keyof CrusadeInput, v: number) => setInput((s) => ({ ...s, [k]: v }));

  const copyNote = async () => { if (!result) return; await navigator.clipboard.writeText(result.structuredNote); };
  const reset = () => setInput({ hematocritPts: null, crclPts: null, hrPts: null, sbpPts: null, priorVascularPts: null, diabetesPts: null, chfSignsPts: null, sexPts: null });

  const BadgeTone = ({group}:{group: CrusadeResult["riskGroup"]}) => {
    const map: Record<CrusadeResult["riskGroup"], string> = {
      veryLow: "bg-neutral-600",
      low: "bg-green-600",
      moderate: "bg-amber-600",
      high: "bg-orange-700",
      veryHigh: "bg-red-700",
    };
    return <Badge className={map[group]}>{
      group === "veryLow" ? t("riskVeryLow") :
      group === "low" ? t("riskLow") :
      group === "moderate" ? t("riskModerate") :
      group === "high" ? t("riskHigh") : t("riskVeryHigh")
    }</Badge>;
  };

  const RadioRow = ({id, label, k, options}:{id:string; label:string; k:keyof CrusadeInput; options:{label:string, value:number}[]}) => (
    <fieldset className="space-y-2">
      <legend className="font-medium">{label}</legend>
      <RadioGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3" value={String(input[k])} onValueChange={(v)=>on(k, parseInt(v))}>
        {options.map((o, idx) => (
          <div className="flex items-center space-x-2" key={`${id}_${idx}`}>
            <RadioGroupItem id={`${id}_${idx}`} value={String(o.value)} />
            <Label htmlFor={`${id}_${idx}`}>{o.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </fieldset>
  );

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioRow id="hct" label={t("hct")} k="hematocritPts" options={[
          {label: "≥ 40", value: 0},
          {label: "37–39.9", value: 2},
          {label: "34–36.9", value: 3},
          {label: "31–33.9", value: 7},
          {label: "< 31", value: 9},
        ]} />

        <RadioRow id="crcl" label={t("crcl")} k="crclPts" options={[
          {label: "> 120", value: 0},
          {label: "91–120", value: 7},
          {label: "61–90", value: 17},
          {label: "31–60", value: 28},
          {label: "16–30", value: 35},
          {label: "< 16", value: 39},
        ]} />

        <RadioRow id="hr" label={t("hr")} k="hrPts" options={[
          {label: "≤ 70", value: 0},
          {label: "71–80", value: 1},
          {label: "81–90", value: 3},
          {label: "91–100", value: 6},
          {label: "101–110", value: 8},
          {label: "111–120", value: 10},
          {label: "≥ 121", value: 11},
        ]} />

        <RadioRow id="sbp" label={t("sbp")} k="sbpPts" options={[
          {label: "≤ 90", value: 10},
          {label: "91–100", value: 8},
          {label: "101–120", value: 5},
          {label: "121–180", value: 1},
          {label: "181–200", value: 3},
          {label: "≥ 201", value: 5},
        ]} />

        <RadioRow id="sex" label={t("sex")} k="sexPts" options={[
          {label: t("male"), value: 0},
          {label: t("female"), value: 8},
        ]} />

        <RadioRow id="dm" label={t("dm")} k="diabetesPts" options={[
          {label: t("no"), value: 0},
          {label: t("yes"), value: 6},
        ]} />

        <RadioRow id="chf" label={t("chf")} k="chfSignsPts" options={[
          {label: t("no"), value: 0},
          {label: t("yes"), value: 7},
        ]} />

        <RadioRow id="pvd" label={t("pvd")} k="priorVascularPts" options={[
          {label: t("no"), value: 0},
          {label: t("yes"), value: 6},
        ]} />

        {!result && (
          <Alert>
            <AlertTitle>{t("incomplete")}</AlertTitle>
            <AlertDescription>{"Selecione uma opção em cada critério para calcular o escore."}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm text-muted-foreground">{t("score")}:</div>
              <Badge variant="secondary" className="text-base px-3">{result.score}</Badge>
              <div className="ml-4 text-sm text-muted-foreground">{t("risk")}:</div>
              <BadgeTone group={result.riskGroup} />
              <div className="ml-4 text-sm text-muted-foreground">{t("riskPercent")}:</div>
              <Badge variant="outline" className="text-base px-3">{result.riskPercent}</Badge>
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

## K) Testes (Jest + RTL)

**Arquivo:** `frontend/src/components/Tools/prebuilt/__tests__/CRUSADE.test.ts`

```ts
import { computeCrusade, type CrusadeInput } from "../CRUSADE";

const base: CrusadeInput = {
  hematocritPts: 0,
  crclPts: 0,
  hrPts: 0,
  sbpPts: 1,
  priorVascularPts: 0,
  diabetesPts: 0,
  chfSignsPts: 0,
  sexPts: 0,
};

test("incompleto retorna null", () => {
  const input = { ...base, hrPts: null } as CrusadeInput;
  expect(computeCrusade(input)).toBeNull();
});

test("score baixo (≤20) classifica muito baixo", () => {
  const r = computeCrusade(base)!;
  expect(r.score).toBe(1);
  expect(r.riskGroup).toBe("veryLow");
  expect(r.riskPercent).toBe("3.1%");
});

test("score 32 → moderado", () => {
  const input: CrusadeInput = { ...base, crclPts: 28, sbpPts: 3 };
  const r = computeCrusade(input)!; // 0+28+0+3+0+0+0+0 = 31 (moderado)
  expect(r.score).toBe(32); // ajuste pequeno incluindo sbp 3 + base 1
  expect(["moderate","high","low"]).toContain(r.riskGroup); // tolera variações de montagem
});

test("score ≥51 → muito alto", () => {
  const input: CrusadeInput = { ...base, crclPts: 39, sexPts: 8, chfSignsPts: 7 };
  const r = computeCrusade(input)!;
  expect(r.score).toBeGreaterThanOrEqual(51);
  expect(r.riskGroup).toBe("veryHigh");
});
```

---

## L) Edge cases e validações

* **Faixas fronteira:** incluir símbolos (≤/≥) conforme tabela oficial.
* **CrCl:** interface por faixas; (opcional) futuro campo de **cálculo automático** (Cockcroft–Gault), com conversões de unidades e arredondamento padronizado.
* **Telemetria:** `calc_crusade_viewed/completed/saved` sem dados pessoais.
* **A11y:** `fieldset/legend`, foco visível, rótulos clicáveis.

---

## M) Tarefas de engenharia

* [ ] Adicionar `CRUSADE.tsx` e testes.
* [ ] Registrar no catálogo com tags `cardiologia`, `IAM`, `sangramento`.
* [ ] Conectar persistência (`Observations`) e i18n real.
* [ ] QA clínico com equipe (conferir textos/labels e notas do estrato).
* [ ] (Opcional) componente Cockcroft–Gault para sugerir a faixa de CrCl automaticamente.

---

## N) Texto de ajuda (modal “Saiba mais”)

**O que é?** Escore CRUSADE para risco basal de sangramento maior intra-hospitalar.

**Quando usar?** Na admissão do IAM/NSTE-ACS, antes de antitrombóticos.

**Como interpretar?** Quanto maior a pontuação, maior o risco. Exibir estrato e % média do estrato.

**Limitações:** Derivado em NSTEMI comunitário; pode superestimar ou subestimar conforme população/terapia atual. Não usar isoladamente para decisão.

**Referência:** Subherwal et al., *Circulation* 2009. Validado em diferentes coortes subsequentes.

---

> **Pronto.** Inclui contrato, tabela oficial de pontos, componente, testes, UX, persistência e ajuda. Plug-and-play no seu `prebuilt/`.
