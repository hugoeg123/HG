# CAGE — Questionário de Triagem para Uso de Álcool

**Status:** pronto para implementação • **Módulo:** `Tools/Prebuilt/ClinicalScores` • **Owner:** Calculadoras e Escores • **Última revisão:** 2025-08-22

---

## A) Escopo clínico e referências

**Objetivo:** triagem de uso de álcool em ≥ 16 anos. Ferramenta de *screening*; não é diagnóstico.

**Interpretação canônica:**

* **Pontuação 0–1:** triagem negativa (baixa probabilidade de problema relacionado ao álcool).
* **Pontuação ≥ 2:** triagem positiva → suspeitar de problema de uso de álcool e **encaminhar para avaliação** adicional e tratamento.
* **Alerta (“eye‑opener”):** resposta **“sim”** à pergunta de beber pela manhã é **altamente preocupante** mesmo com escore total baixo. Exibir *flag* destacado.

**Desempenho (clássico):** para *cutoff* ≥ 2 — sensibilidade \~93% e especificidade \~76% para “consumo excessivo”; sensibilidade \~91% e especificidade \~77% para alcoolismo.

**Fontes:**

* Ewing JA. *Detecting alcoholism. The CAGE questionnaire*. JAMA. 1984;252(14):1905-7.
* Bernadt MW, et al. *Comparison of questionnaire and laboratory tests in the detection of excessive drinking and alcoholism*. Lancet. 1982;1(8267):325‑8.

> **Atenção:** incorporar mensagem de “ferramenta de rastreio” e recomendação de aprofundar com perguntas qualitativas (quantidade, frequência, padrão).

---

## B) Requisitos funcionais

1. **Entrada:** quatro perguntas binárias (Sim/Não).
2. **Cálculo:** soma dos “Sim” (1 ponto por “Sim”).
3. **Saída:**

   * `score` (0–4)
   * `classification` (`"negative" | "positive"`)
   * `eyeOpenerFlag` (booleano; verdadeiro se Q4 = “Sim”)
   * `advice` (string curta com próxima ação)
   * `details` (sensibilidade/especificidade e nota de limitação)
   * `structuredNote` (texto pronto para prontuário)
4. **Estados de UI:**

   * Incompleto (nem todas as perguntas marcadas) → mostrar *placeholder* “Responda às 4 perguntas”.
   * Completo → mostrar cartão de resultado com *badge* de risco e (se `eyeOpenerFlag`) alerta.
5. **Ações rápidas:** copiar nota para prontuário; salvar Observação no paciente; abrir fluxo de encaminhamento.

---

## C) I/O (JSON) — contrato

### Inputs (`CAGEInput`)

```ts
export type CAGEInput = {
  q1ThoughtAboutCuttingDown: boolean | null; // Você já pensou em largar a bebida?
  q2AnnoyedByCriticism: boolean | null;      // Ficou aborrecido quando criticaram seu hábito?
  q3GuiltyAboutDrinking: boolean | null;     // Sentiu-se mal/culpado por beber?
  q4EyeOpenerMorningDrink: boolean | null;   // Bebeu pela manhã para acalmar/curar ressaca?
};
```

### Outputs (`CAGEResult`)

```ts
export type CAGEResult = {
  score: 0 | 1 | 2 | 3 | 4;
  classification: "negative" | "positive";
  eyeOpenerFlag: boolean;
  advice: string;        // ex.: "Triagem positiva — considerar SBIRT e avaliação especializada."
  details: string;       // sensibilidade/especificidade + limitações
  structuredNote: string;// pronto para colar no prontuário
};
```

---

## D) Lógica (pseudocódigo)

```pseudo
function computeCAGE(input):
  ensure all q1..q4 are boolean (not null) else return null (incompleto)
  score = sum([q1,q2,q3,q4] where true = 1)
  classification = (score >= 2) ? "positive" : "negative"
  eyeOpenerFlag = (q4 == true)

  advice = if classification == "positive"
             then "Triagem positiva — orientar redução de danos, oferecer encaminhamento e avaliação especializada."
             else "Triagem negativa — reavaliar periodicamente ou se houver suspeita clínica."
  if eyeOpenerFlag:
     advice += " Alerta: consumo matinal (‘eye‑opener’) é altamente preocupante."

  details = "CAGE é triagem; cutoff ≥2: sens.~93%/esp.~76% p/ consumo excessivo; sens.~91%/esp.~77% p/ alcoolismo. Menos sensível a distúrbios leves."

  structuredNote = template(patientName, date, answers, score, classification, eyeOpenerFlag, advice)

  return {score, classification, eyeOpenerFlag, advice, details, structuredNote}
```

---

## E) UX/UI — diretrizes

* **Componente:** cartão com quatro *radio groups* (Sim/Não) com `fieldset/legend` (acessível), cálculo reativo.
* **Resultado:** *badge* colorido (verde = negativo; âmbar/vermelho = positivo). Alerta separado para “eye‑opener”.
* **Botões:** “Salvar”, “Copiar Nota”, “Limpar”.
* **Texto educativo curto** sob o resultado (até 3 linhas) + link “saiba mais” (abre modal com descrição completa e referências).
* **i18n:** chaves `tools.cage.*` (ver seção H).

---

## F) Validações e mensagens

* `null` em qualquer pergunta → estado **Incompleto** (não calcular `CAGEResult`).
* **Aria/Accessibility:** foco gerenciável por teclado; `aria-describedby` nos grupos; rótulos clicáveis.
* **Telemetria:** `calc_cage_viewed`, `calc_cage_completed`, `calc_cage_saved` (payload: score, classification, eyeOpenerFlag; **não** incluir dados pessoais no evento).

---

## G) Armazenamento e interoperabilidade

* **Modelo interno:** salvar em `Observations` com `type = "CAGE"`, `score`, `classification`, `flags.eyeOpener = true|false`, `answers` {q1..q4} e `provenance` (versão do algoritmo, data/hora, usuário).
* **FHIR (opcional):** `QuestionnaireResponse` + `Observation` (profile: screening instrument). Se usar LOINC/SNOMED, mapear perguntas como itens `boolean` (IDs locais).

### Exemplo de payload (interno)

```json
{
  "tool": "CAGE",
  "version": "1.0.0",
  "patientId": "<uuid>",
  "timestamp": "2025-08-22T12:00:00-03:00",
  "inputs": {
    "q1ThoughtAboutCuttingDown": true,
    "q2AnnoyedByCriticism": false,
    "q3GuiltyAboutDrinking": true,
    "q4EyeOpenerMorningDrink": false
  },
  "result": {
    "score": 2,
    "classification": "positive",
    "eyeOpenerFlag": false,
    "advice": "Triagem positiva — orientar redução de danos, oferecer encaminhamento e avaliação especializada.",
    "details": "CAGE é triagem; cutoff ≥2: sens.~93%/esp.~76%…",
    "structuredNote": "…"
  }
}
```

---

## H) Conteúdo e i18n (PT‑BR)

```json
{
  "tools": {
    "cage": {
      "title": "CAGE — Triagem para uso de álcool",
      "descShort": "Questionário de 4 itens para triagem em ≥ 16 anos.",
      "q1": "Você já pensou em largar a bebida?",
      "q2": "Ficou aborrecido quando outras pessoas criticaram o seu hábito de beber?",
      "q3": "Você se sentiu mal ou culpado pelo fato de beber?",
      "q4": "Você bebeu pela manhã para ficar mais calmo ou aliviar uma ressaca (eye‑opener)?",
      "yes": "Sim",
      "no": "Não",
      "incomplete": "Responda às 4 perguntas para ver o resultado.",
      "score": "Valor",
      "classification": "Classificação",
      "negative": "Triagem negativa",
      "positive": "Triagem positiva",
      "eyeOpenerFlag": "Alerta: consumo matinal (‘eye‑opener’) é altamente preocupante.",
      "advicePositive": "Triagem positiva — orientar redução de danos e avaliação especializada.",
      "adviceNegative": "Triagem negativa — reavaliar periodicamente conforme risco.",
      "details": "Ferramenta de rastreio; cutoff ≥2: sens.~93%/esp.~76% para consumo excessivo; sens.~91%/esp.~77% para alcoolismo. Menos eficaz para distúrbios leves.",
      "learnMore": "Saiba mais",
      "copyNote": "Copiar nota",
      "save": "Salvar",
      "reset": "Limpar"
    }
  }
}
```

---

## I) Nota estruturada (template)

```
CAGE (triagem para uso de álcool) — {DATA}
Respostas: [C] {Q1}; [A] {Q2}; [G] {Q3}; [E] {Q4}
Escore total: {SCORE} → {CLASSIFICACAO}
{EYE_OPENER_ALERT}
Conduta sugerida: {ADVICE}
Observações: ferramenta de rastreio; considerar avaliação adicional conforme contexto clínico.
Referências: Ewing 1984 (JAMA); Bernadt 1982 (Lancet).
```

`{EYE_OPENER_ALERT}` incluir somente se `eyeOpenerFlag` for verdadeiro.

---

## J) Componente React (TypeScript + Tailwind + shadcn/ui)

> **Colocar o arquivo em:** `frontend/src/components/Tools/prebuilt/CAGE.tsx`

```tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ClipboardCopy } from "lucide-react";

export type CAGEInput = {
  q1ThoughtAboutCuttingDown: boolean | null;
  q2AnnoyedByCriticism: boolean | null;
  q3GuiltyAboutDrinking: boolean | null;
  q4EyeOpenerMorningDrink: boolean | null;
};

export type CAGEResult = {
  score: 0 | 1 | 2 | 3 | 4;
  classification: "negative" | "positive";
  eyeOpenerFlag: boolean;
  advice: string;
  details: string;
  structuredNote: string;
};

const t = (k: string) => {
  // TODO: trocar por hook de i18n do app
  const dict: Record<string, string> = {
    title: "CAGE — Triagem para uso de álcool",
    q1: "Você já pensou em largar a bebida?",
    q2: "Ficou aborrecido quando outras pessoas criticaram o seu hábito de beber?",
    q3: "Você se sentiu mal ou culpado pelo fato de beber?",
    q4: "Você bebeu pela manhã para ficar mais calmo ou aliviar uma ressaca (eye‑opener)?",
    yes: "Sim",
    no: "Não",
    incomplete: "Responda às 4 perguntas para ver o resultado.",
    score: "Valor",
    classification: "Classificação",
    negative: "Triagem negativa",
    positive: "Triagem positiva",
    eyeOpenerFlag: "Alerta: consumo matinal (‘eye‑opener’) é altamente preocupante.",
    advicePositive: "Triagem positiva — orientar redução de danos e avaliação especializada.",
    adviceNegative: "Triagem negativa — reavaliar periodicamente conforme risco.",
    details:
      "Ferramenta de rastreio; cutoff ≥2: sens.~93%/esp.~76% p/ consumo excessivo; sens.~91%/esp.~77% p/ alcoolismo. Menos eficaz para distúrbios leves.",
    copyNote: "Copiar nota",
    save: "Salvar",
    reset: "Limpar",
  };
  return dict[k] ?? k;
};

function computeCAGE(input: CAGEInput | null): CAGEResult | null {
  if (!input) return null;
  const { q1ThoughtAboutCuttingDown: q1, q2AnnoyedByCriticism: q2, q3GuiltyAboutDrinking: q3, q4EyeOpenerMorningDrink: q4 } = input;
  if ([q1, q2, q3, q4].some((v) => v === null)) return null;
  const scoreNum = [q1, q2, q3, q4].reduce((acc, v) => acc + (v ? 1 : 0), 0) as 0 | 1 | 2 | 3 | 4;
  const classification = scoreNum >= 2 ? "positive" : "negative";
  const eyeOpenerFlag = !!q4;
  const advice = (classification === "positive" ? t("advicePositive") : t("adviceNegative")) +
    (eyeOpenerFlag ? " " + t("eyeOpenerFlag") : "");

  const structuredNote = [
    `CAGE (triagem para uso de álcool)`,
    `Respostas: [C] ${q1 ? "Sim" : "Não"}; [A] ${q2 ? "Sim" : "Não"}; [G] ${q3 ? "Sim" : "Não"}; [E] ${q4 ? "Sim" : "Não"}`,
    `Escore total: ${scoreNum} → ${classification === "positive" ? t("positive") : t("negative")}`,
    eyeOpenerFlag ? t("eyeOpenerFlag") : "",
    `Conduta sugerida: ${advice}`,
    `Obs.: ferramenta de rastreio; considerar avaliação clínica adicional. Referências: Ewing 1984; Bernadt 1982.`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    score: scoreNum,
    classification,
    eyeOpenerFlag,
    advice,
    details: t("details"),
    structuredNote,
  };
}

export default function CAGE() {
  const [input, setInput] = React.useState<CAGEInput>({
    q1ThoughtAboutCuttingDown: null,
    q2AnnoyedByCriticism: null,
    q3GuiltyAboutDrinking: null,
    q4EyeOpenerMorningDrink: null,
  });

  const result = computeCAGE(input);

  const onSet = (key: keyof CAGEInput, val: boolean) => setInput((s) => ({ ...s, [key]: val }));

  const copyNote = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.structuredNote);
  };

  const reset = () => setInput({
    q1ThoughtAboutCuttingDown: null,
    q2AnnoyedByCriticism: null,
    q3GuiltyAboutDrinking: null,
    q4EyeOpenerMorningDrink: null,
  });

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <fieldset className="space-y-2">
          <legend className="font-medium">{t("q1")}</legend>
          <RadioGroup
            className="flex gap-6"
            value={String(input.q1ThoughtAboutCuttingDown)}
            onValueChange={(v) => onSet("q1ThoughtAboutCuttingDown", v === "true")}
            aria-labelledby="q1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="q1_yes" value="true" />
              <Label htmlFor="q1_yes">{t("yes")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="q1_no" value="false" />
              <Label htmlFor="q1_no">{t("no")}</Label>
            </div>
          </RadioGroup>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-medium">{t("q2")}</legend>
          <RadioGroup
            className="flex gap-6"
            value={String(input.q2AnnoyedByCriticism)}
            onValueChange={(v) => onSet("q2AnnoyedByCriticism", v === "true")}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="q2_yes" value="true" />
              <Label htmlFor="q2_yes">{t("yes")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="q2_no" value="false" />
              <Label htmlFor="q2_no">{t("no")}</Label>
            </div>
          </RadioGroup>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-medium">{t("q3")}</legend>
          <RadioGroup
            className="flex gap-6"
            value={String(input.q3GuiltyAboutDrinking)}
            onValueChange={(v) => onSet("q3GuiltyAboutDrinking", v === "true")}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="q3_yes" value="true" />
              <Label htmlFor="q3_yes">{t("yes")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="q3_no" value="false" />
              <Label htmlFor="q3_no">{t("no")}</Label>
            </div>
          </RadioGroup>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-medium">{t("q4")}</legend>
          <RadioGroup
            className="flex gap-6"
            value={String(input.q4EyeOpenerMorningDrink)}
            onValueChange={(v) => onSet("q4EyeOpenerMorningDrink", v === "true")}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="q4_yes" value="true" />
              <Label htmlFor="q4_yes">{t("yes")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="q4_no" value="false" />
              <Label htmlFor="q4_no">{t("no")}</Label>
            </div>
          </RadioGroup>
        </fieldset>

        {!result && (
          <Alert>
            <AlertTitle>{t("incomplete")}</AlertTitle>
            <AlertDescription>
              {"Marque Sim/Não em cada pergunta para calcular automaticamente o escore."}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">{t("score")}:</div>
              <Badge variant="secondary" className="text-base px-3">{result.score}</Badge>
              <div className="ml-4 text-sm text-muted-foreground">{t("classification")}:</div>
              <Badge className={result.classification === "positive" ? "bg-red-600" : "bg-green-600"}>
                {result.classification === "positive" ? t("positive") : t("negative")}
              </Badge>
            </div>

            {result.eyeOpenerFlag && (
              <Alert>
                <AlertTitle>{t("eyeOpenerFlag")}</AlertTitle>
                <AlertDescription>
                  {"Considere avaliação mais aprofundada, inclusive risco de abstinência e necessidade de manejo especializado."}
                </AlertDescription>
              </Alert>
            )}

            <p className="text-sm">{result.advice}</p>
            <p className="text-xs text-muted-foreground">{result.details}</p>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={copyNote}><ClipboardCopy className="mr-2 h-4 w-4" /> {t("copyNote")}</Button>
              <Button variant="default" onClick={() => {/* TODO: integrar com storage/Observations */}}>{t("save")}</Button>
              <Button variant="ghost" onClick={reset}>{t("reset")}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { computeCAGE };
```

---

## K) Testes (Jest + React Testing Library)

**Arquivo:** `frontend/src/components/Tools/prebuilt/__tests__/CAGE.test.ts`

```ts
import { computeCAGE, CAGEInput } from "../CAGE";

test("incompleto retorna null", () => {
  const input: CAGEInput = { q1ThoughtAboutCuttingDown: true, q2AnnoyedByCriticism: null, q3GuiltyAboutDrinking: false, q4EyeOpenerMorningDrink: false };
  expect(computeCAGE(input)).toBeNull();
});

test("score 0 → negativo", () => {
  const allNo: CAGEInput = { q1ThoughtAboutCuttingDown: false, q2AnnoyedByCriticism: false, q3GuiltyAboutDrinking: false, q4EyeOpenerMorningDrink: false };
  const r = computeCAGE(allNo)!;
  expect(r.score).toBe(0);
  expect(r.classification).toBe("negative");
  expect(r.eyeOpenerFlag).toBe(false);
});

test("score 1 → negativo", () => {
  const input: CAGEInput = { q1ThoughtAboutCuttingDown: true, q2AnnoyedByCriticism: false, q3GuiltyAboutDrinking: false, q4EyeOpenerMorningDrink: false };
  const r = computeCAGE(input)!;
  expect(r.score).toBe(1);
  expect(r.classification).toBe("negative");
});

test("score 2 → positivo", () => {
  const input: CAGEInput = { q1ThoughtAboutCuttingDown: true, q2AnnoyedByCriticism: true, q3GuiltyAboutDrinking: false, q4EyeOpenerMorningDrink: false };
  const r = computeCAGE(input)!;
  expect(r.score).toBe(2);
  expect(r.classification).toBe("positive");
});

test("eye‑opener flag", () => {
  const input: CAGEInput = { q1ThoughtAboutCuttingDown: false, q2AnnoyedByCriticism: false, q3GuiltyAboutDrinking: false, q4EyeOpenerMorningDrink: true };
  const r = computeCAGE(input)!;
  expect(r.score).toBe(1);
  expect(r.eyeOpenerFlag).toBe(true);
  expect(r.advice).toMatch(/eye/i);
});
```

---

## L) Linhas de corte e *edge cases*

* **Cálculo sempre inteiro 0–4.**
* **Empate aparente:** nenhum caso especial além do *eye‑opener*; manter *cutoff* clássico ≥2.
* **Uso em gestantes/adolescentes ≥16:** manter mensagens padrão; sugerir avaliação especializada quando positivo.

---

## M) Tarefas de engenharia

* [ ] Criar arquivo `CAGE.tsx` e testes.
* [ ] Conectar ao serviço de Observations (persistência) e telemetria.
* [ ] Registrar rota no catálogo de calculadoras (menu e busca interna) com tags `triagem`, `psiquiatria`, `álcool`.
* [ ] Integrar `i18n` do app (substituir função `t`).
* [ ] QA de acessibilidade (teclado e leitores de tela).
* [ ] Revisão clínica do texto final (conteúdo está no corpo deste documento).

---

## N) Texto de ajuda (modal “Saiba mais”)

**O que é?** CAGE é uma ferramenta de triagem para identificar possível uso não saudável de álcool.

**Como usar?** Responda as quatro perguntas com “Sim” ou “Não” e verifique o escore.

**Como interpretar?** 0–1: triagem negativa. ≥2: triagem positiva (suspeitar e avaliar). “Eye‑opener” = alerta adicional.

**Limitações:** Menos eficaz para distúrbios leves. Use outras ferramentas e anamnese qualitativa quando suspeitar de subnotificação.

**Referências:** Ewing 1984 (JAMA); Bernadt 1982 (Lancet).

---

> **Pronto.** Este pacote inclui: contrato de dados, lógica pura testável, componente de UI, testes e textos. Basta colar o arquivo, ligar i18n/persistência e publicar no catálogo.

Perfeito — deixei no canvas a especificação completa + o componente React/TSX pronto para colar no seu repo (`frontend/src/components/Tools/prebuilt/CAGE.tsx`), com:

* contrato de dados (inputs/outputs),
* pseudocódigo da lógica,
* UI acessível (shadcn + Tailwind),
* flag especial para “eye-opener”,
* nota estruturada para prontuário,
* testes (Jest) e tarefas de integração (telemetria, persistência e i18n),
* textos de ajuda e referências.

Se quiser, já preparo um PR “modelo” com a rota no catálogo e o *hook* de persistência (`Observations`) — é só dizer.
