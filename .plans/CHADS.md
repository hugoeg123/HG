# CHA2DS2‑VASc — Risco de AVC em FA não‑valvar

**Status:** pronto para implementação • **Módulo:** `Tools/Prebuilt/ClinicalScores` • **Owner:** Calculadoras e Escores • **Última revisão:** 2025-08-22

---

## A) Escopo clínico e referências

**Objetivo:** estimar risco de **AVC isquêmico** em pacientes com **fibrilação atrial não‑valvar (FA paroxística, persistente, persistente de longa duração ou permanente)** e apoiar decisão sobre **anticoagulação**.

**Variáveis do escore (pontos):**

* **C**: Insuficiência cardíaca/FE reduzida (1)
* **H**: Hipertensão arterial (1)
* **A2**: Idade ≥75 anos (2) | **A**: 65–74 anos (1) | <65 (0)
* **D**: Diabetes mellitus (1)
* **S2**: AVC/AIT/tromboembolismo prévio (2)
* **V**: Doença vascular (IAM prévio, DAC/DA periférica, placa aórtica) (1)
* **Sc**: **Sexo feminino** (1)

**Limiar prático para anticoagulação (conforme texto fornecido):**

* **Homens:** >=2 → **anticoagular**; 1 → **individualizar**; 0 → **não anticoagular**
* **Mulheres:** >=3 → **anticoagular**; 2 → **individualizar**; 0–1 (apenas sexo) → **não anticoagular**

**Fonte principal:** Lip GY et al., *Chest* 2010.

> Nota clínica: A antiagregação com **AAS não é recomendada** para prevenção tromboembólica na FA não‑valvar.

---

## B) Requisitos funcionais

1. **Entrada:** 2 *radio groups* (idade, sexo) + 5 *checkboxes* (IC, HAS, AVC/AIT/TE, vascular, DM).
2. **Cálculo:** soma dos pontos (0–9). Derivar **recomendação** (não indicar/individualizar/anticoagular) **condicionada ao sexo**.
3. **Saída:**

   * `score` (inteiro 0–9)
   * `recommendation` (`"no_oac" | "individualize" | "anticoagulate"`)
   * `recommendationLabel` (string legível)
   * `advice` (mensagem clínica curta)
   * `structuredNote` (nota pronta para prontuário)
4. **Estados:** incompleto se idade/sexo não selecionados → alerta.
5. **Ações:** copiar nota; salvar `Observation`; limpar.

---

## C) Contrato I/O (TypeScript)

### Inputs (`Cha2ds2VascInput`)

```ts
export type Cha2ds2VascInput = {
  agePts: 0|1|2 | null;     // <65 = 0; 65–74 = 1; ≥75 = 2
  sex: "male" | "female" | null; // feminino soma 1 ponto
  chf: boolean;             // 1
  htn: boolean;             // 1
  strokeTiaTe: boolean;     // 2
  vascular: boolean;        // 1
  diabetes: boolean;        // 1
};
```

### Outputs (`Cha2ds2VascResult`)

```ts
export type Cha2ds2VascResult = {
  score: number;
  recommendation: "no_oac" | "individualize" | "anticoagulate";
  recommendationLabel: string;   // "Não indicar", "Individualizar", "Anticoagulação indicada"
  advice: string;                // frase clínica curta
  structuredNote: string;        // nota para colar no prontuário
};
```

---

## D) Lógica (pseudocódigo)

```pseudo
function computeCha2ds2Vasc(input):
  if input.agePts is null or input.sex is null -> return null
  sexPts = (sex == female ? 1 : 0)
  score = agePts + sexPts + chf*1 + htn*1 + (strokeTiaTe?2:0) + vascular*1 + diabetes*1

  if sex == male:
    if score >= 2 -> rec = anticoagulate
    else if score == 1 -> rec = individualize
    else -> rec = no_oac
  else if sex == female:
    if score >= 3 -> rec = anticoagulate
    else if score == 2 -> rec = individualize
    else -> rec = no_oac  // inclui 1 ponto apenas por sexo

  advice = texto curto + lembrete de que AAS não é indicado
  structuredNote = template com checklist + score + recomendação
  return {score, rec, advice, structuredNote}
```

---

## E) i18n (PT‑BR)

```json
{
  "tools": {
    "cha2ds2vasc": {
      "title": "CHA2DS2‑VASc — FA não‑valvar",
      "age": "Idade",
      "sex": "Sexo (para escore)",
      "male": "Masculino",
      "female": "Feminino",
      "chf": "Histórico de insuficiência cardíaca",
      "htn": "Hipertensão arterial",
      "stroke": "AVE/AIT/tromboembolismo prévio",
      "vascular": "Doença vascular (IAM prévio, DAC/DA periférica, placa aórtica)",
      "dm": "Diabetes mellitus",
      "score": "Valor (pontos)",
      "meaning": "Recomendação",
      "no_oac": "Não indicar anticoagulação",
      "individualize": "Individualizar conduta",
      "anticoagulate": "Anticoagulação indicada",
      "advice": "Decisão baseada no limiar por sexo; AAS não indicado para FA não‑valvar.",
      "copyNote": "Copiar nota",
      "save": "Salvar",
      "reset": "Limpar",
      "incomplete": "Selecione idade e sexo para ver o resultado."
    }
  }
}
```

---

## F) Template de nota estruturada

```
CHA2DS2‑VASc — {DATA}
Idade {AGE_LABEL}; Sexo {SEX_LABEL}; IC {CHF}; HAS {HTN}; AVC/AIT/TE {STROKE}; Vascular {VASC}; DM {DM}
Escore total: {SCORE}
Recomendação: {REC_LABEL}
Obs.: limiar sexo‑específico (H: ≥2; M: ≥3). AAS não indicado para prevenção de FA não‑valvar.
Ref.: Lip et al., Chest 2010.
```

---

## G) Componente React (TypeScript + Tailwind + shadcn/ui)

> **Arquivo:** `frontend/src/components/Tools/prebuilt/CHA2DS2_VASc.tsx`

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

export type Cha2ds2VascInput = {
  agePts: 0|1|2 | null;
  sex: "male" | "female" | null;
  chf: boolean;
  htn: boolean;
  strokeTiaTe: boolean;
  vascular: boolean;
  diabetes: boolean;
};

export type Cha2ds2VascResult = {
  score: number;
  recommendation: "no_oac" | "individualize" | "anticoagulate";
  recommendationLabel: string;
  advice: string;
  structuredNote: string;
};

const t = (k: string) => {
  const d: Record<string, string> = {
    title: "CHA2DS2‑VASc — FA não‑valvar",
    age: "Idade",
    sex: "Sexo (para escore)",
    male: "Masculino",
    female: "Feminino",
    chf: "Histórico de insuficiência cardíaca",
    htn: "História de hipertensão arterial",
    stroke: "AVE/AIT/tromboembolismo prévio",
    vascular: "Doença vascular",
    dm: "Diabetes mellitus",
    score: "Valor (pontos)",
    meaning: "Recomendação",
    no_oac: "Não indicar anticoagulação",
    individualize: "Individualizar conduta",
    anticoagulate: "Anticoagulação indicada",
    advice: "Decisão baseada no limiar por sexo; AAS não indicado para FA não‑valvar.",
    copyNote: "Copiar nota",
    save: "Salvar",
    reset: "Limpar",
    incomplete: "Selecione idade e sexo para ver o resultado.",
  }; return d[k] ?? k;
};

function classify(score: number, sex: "male"|"female") {
  if (sex === "male") {
    if (score >= 2) return { key: "anticoagulate", label: t("anticoagulate") } as const;
    if (score === 1) return { key: "individualize", label: t("individualize") } as const;
    return { key: "no_oac", label: t("no_oac") } as const;
  } else {
    if (score >= 3) return { key: "anticoagulate", label: t("anticoagulate") } as const;
    if (score === 2) return { key: "individualize", label: t("individualize") } as const;
    return { key: "no_oac", label: t("no_oac") } as const; // inclui 1 ponto apenas pelo sexo
  }
}

export function computeCha2ds2Vasc(input: Cha2ds2VascInput | null): Cha2ds2VascResult | null {
  if (!input || input.agePts === null || input.sex === null) return null;
  const sexPts = input.sex === "female" ? 1 : 0;
  const score = (input.agePts ?? 0)
    + sexPts
    + (input.chf ? 1 : 0)
    + (input.htn ? 1 : 0)
    + (input.strokeTiaTe ? 2 : 0)
    + (input.vascular ? 1 : 0)
    + (input.diabetes ? 1 : 0);
  const c = classify(score, input.sex);
  const advice = `${c.label}. ${t("advice")}`;
  const structuredNote = [
    `CHA2DS2‑VASc`,
    `Escore total: ${score}`,
    `Recomendação: ${c.label}`,
    `Obs.: Limiar por sexo (H: ≥2; M: ≥3). AAS não indicado. Ref.: Lip 2010.`,
  ].join("\n");
  return { score, recommendation: c.key, recommendationLabel: c.label, advice, structuredNote };
}

const RowRadio = ({id, label, value, onChange, options}:{
  id: string;
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) => (
  <fieldset className="space-y-2">
    <legend className="font-medium">{label}</legend>
    <RadioGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3" value={String(value)} onValueChange={onChange}>
      {options.map((o, i) => (
        <div className="flex items-center space-x-2" key={`${id}_${i}`}>
          <RadioGroupItem id={`${id}_${i}`} value={o.value} />
          <Label htmlFor={`${id}_${i}`}>{o.label}</Label>
        </div>
      ))}
    </RadioGroup>
  </fieldset>
);

const RowCheckbox = ({id, label, checked, onChange}:{ id: string; label: string; checked: boolean; onChange: (v: boolean) => void; }) => (
  <div className="flex items-center space-x-2">
    <Checkbox id={id} checked={checked} onCheckedChange={(v)=>onChange(Boolean(v))} />
    <Label htmlFor={id}>{label}</Label>
  </div>
);

export default function CHA2DS2_VASc() {
  const [input, setInput] = React.useState<Cha2ds2VascInput>({
    agePts: null,
    sex: null,
    chf: false,
    htn: false,
    strokeTiaTe: false,
    vascular: false,
    diabetes: false,
  });

  const result = computeCha2ds2Vasc(input);
  const set = <K extends keyof Cha2ds2VascInput>(k: K, v: Cha2ds2VascInput[K]) => setInput((s)=>({ ...s, [k]: v }));

  const copyNote = async () => { if (!result) return; await navigator.clipboard.writeText(result.structuredNote); };
  const reset = () => setInput({ agePts: null, sex: null, chf: false, htn: false, strokeTiaTe: false, vascular: false, diabetes: false });

  const BandBadge = ({rec}:{rec: Cha2ds2VascResult["recommendation"]}) => {
    const map: Record<Cha2ds2VascResult["recommendation"], string> = {
      no_oac: "bg-green-600",
      individualize: "bg-amber-600",
      anticoagulate: "bg-red-700",
    };
    const label = rec === "no_oac" ? t("no_oac") : rec === "individualize" ? t("individualize") : t("anticoagulate");
    return <Badge className={map[rec]}>{label}</Badge>;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RowRadio id="age" label={t("age")} value={input.agePts === null ? null : String(input.agePts)} onChange={(v)=>set("agePts", parseInt(v) as 0|1|2)} options={[
          {label: "< 65 anos (0 pt)", value: "0"},
          {label: "65–74 anos (1 pt)", value: "1"},
          {label: "≥ 75 anos (2 pts)", value: "2"},
        ]} />

        <RowRadio id="sex" label={t("sex")} value={input.sex} onChange={(v)=>set("sex", v as "male"|"female")} options={[
          {label: t("male"), value: "male"},
          {label: t("female"), value: "female"},
        ]} />

        <fieldset className="space-y-3">
          <legend className="font-medium">Outros critérios</legend>
          <RowCheckbox id="chf" label={t("chf")} checked={input.chf} onChange={(v)=>set("chf", v)} />
          <RowCheckbox id="htn" label={t("htn")} checked={input.htn} onChange={(v)=>set("htn", v)} />
          <RowCheckbox id="stroke" label={t("stroke")} checked={input.strokeTiaTe} onChange={(v)=>set("strokeTiaTe", v)} />
          <RowCheckbox id="vascular" label={t("vascular")} checked={input.vascular} onChange={(v)=>set("vascular", v)} />
          <RowCheckbox id="dm" label={t("dm")} checked={input.diabetes} onChange={(v)=>set("diabetes", v)} />
        </fieldset>

        {!result && (
          <Alert>
            <AlertTitle>{t("incomplete")}</AlertTitle>
            <AlertDescription>{"Selecione idade e sexo; marque os demais conforme histórico."}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm text-muted-foreground">{t("score")}:</div>
              <Badge variant="secondary" className="text-base px-3">{result.score}</Badge>
              <div className="ml-4 text-sm text-muted-foreground">{t("meaning")}:</div>
              <BandBadge rec={result.recommendation} />
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

## H) Testes (Jest)

**Arquivo:** `frontend/src/components/Tools/prebuilt/__tests__/CHA2DS2_VASc.test.ts`

```ts
import { computeCha2ds2Vasc, type Cha2ds2VascInput } from "../CHA2DS2_VASc";

const baseMale = (): Cha2ds2VascInput => ({ agePts: 0, sex: "male", chf: false, htn: false, strokeTiaTe: false, vascular: false, diabetes: false });
const baseFem  = (): Cha2ds2VascInput => ({ agePts: 0, sex: "female", chf: false, htn: false, strokeTiaTe: false, vascular: false, diabetes: false });

test("incompleto → null", () => {
  expect(computeCha2ds2Vasc(null)).toBeNull();
  expect(computeCha2ds2Vasc({ ...baseMale(), agePts: null })).toBeNull();
});

test("homem, score 0 → não indicar", () => {
  const r = computeCha2ds2Vasc(baseMale())!;
  expect(r.score).toBe(0);
  expect(r.recommendation).toBe("no_oac");
});

test("homem, score 1 → individualizar", () => {
  const r = computeCha2ds2Vasc({ ...baseMale(), htn: true })!; // 1 ponto
  expect(r.score).toBe(1);
  expect(r.recommendation).toBe("individualize");
});

test("homem, score 2 → anticoagular", () => {
  const r = computeCha2ds2Vasc({ ...baseMale(), agePts: 1, htn: true })!; // 2 pontos
  expect(r.score).toBe(2);
  expect(r.recommendation).toBe("anticoagulate");
});

test("mulher, sexo apenas (1) → não indicar", () => {
  const r = computeCha2ds2Vasc(baseFem())!; // 1 ponto (sexo)
  expect(r.score).toBe(1);
  expect(r.recommendation).toBe("no_oac");
});

test("mulher, score 2 → individualizar", () => {
  const r = computeCha2ds2Vasc({ ...baseFem(), htn: true })!; // sexo(1)+HAS(1)=2
  expect(r.score).toBe(2);
  expect(r.recommendation).toBe("individualize");
});

test("mulher, score 3 → anticoagular", () => {
  const r = computeCha2ds2Vasc({ ...baseFem(), agePts: 1, htn: true })!; // 3 pontos
  expect(r.score).toBe(3);
  expect(r.recommendation).toBe("anticoagulate");
});
```

---

## I) Persistência e interoperabilidade

* **Interno:** `Observations` com `type = "CHA2DS2_VASc"`, `score`, `recommendation`, `answers`, `provenance` (versão, usuário, data/hora).
* **FHIR (opcional):** `QuestionnaireResponse` + `Observation` (perfil de risco FA) — mapear itens e pontos.

---

## J) Tarefas de engenharia

* [ ] Adicionar `CHA2DS2_VASc.tsx` + testes.
* [ ] Conectar i18n/persistência.
* [ ] Registrar no catálogo (tags: `cardiologia`, `FA`, `tromboembolismo`).
* [ ] QA clínico do texto/labels e verificação de terminologia local (Sexo vs Gênero) e exemplos de **doença vascular**.

---

**Pronto para plug‑and‑play** no diretório `prebuilt/`. Inclui contrato, lógica testável, componente, testes, UX, persistência e notas clínicas alinhadas ao seu molde.
