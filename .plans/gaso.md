# 2) Interpretador de Gasometria Arterial (ABG) — pacote pronto pra implementar

Abaixo está o **blueprint técnico final** no padrão do projeto (*calcGPT*): esquema de I/O, validações, algoritmos, pseudocódigo/funções puras, classificação, oxigenação, mensagens de segurança, casos-teste e checklist de integração com o front. Tudo segue o modelo “renderização por schema” e o fluxo de versionamento/seed que você definiu no calcGPT【】【】. O conteúdo funcional (PaO₂ pela idade; P/F e equivalência via Severinghaus–Ellis; layout do intérprete) está alinhado ao seu compilado de calculadoras【】【】【】 e às notas laboratoriais (p.ex., HCO₃⁻ calculado por Henderson–Hasselbalch; correção/temperatura; fontes de erro) do PDF clínico que você anexou【】【】【】.

---

## 1) Identidade, domínio e versionamento

* **calculator\_id:** `abg.interpreter.v1`
* **domain:** `critical-care/ventilation/acid-base`
* **tags:** `ABG`, `acid-base`, `A–a`, `PF_ratio`, `anion_gap`, `delta_ratio`, `Henderson-Hasselbalch`
* **channel:** `stable`
* **persistResult:** `true` (com confirmação do usuário)
* **docs\_link:** Knowledge tab aponta para “ABG — interpretação e fórmulas”, “PaO₂ ideal por idade” e “P/F & Severinghaus–Ellis” (já presentes no compilado)【】【】.

---

## 2) JSON Schema — Inputs/Outputs/UI

### `schema/abg.interpreter.v1.json`

```json
{
  "id": "abg.interpreter.v1",
  "name": "Interpretador de Gasometria Arterial",
  "inputs": [
    { "key": "age_years", "label": "Idade (anos)", "type": "number", "min": 0, "max": 120, "required": true },
    { "key": "sample_type", "label": "Tipo de amostra", "type": "enum", "options": ["arterial","capilar","venosa"], "required": true },
    { "key": "FiO2", "label": "FiO2 (fração 0–1)", "type": "number", "min": 0.21, "max": 1.0, "step": 0.01, "required": true },
    { "key": "baro_mmHg", "label": "Pressão barométrica (mmHg)", "type": "number", "min": 400, "max": 800, "default": 760, "required": false },
    { "key": "temp_C", "label": "Temperatura do paciente (°C)", "type": "number", "min": 30, "max": 42, "default": 37, "required": false },

    { "key": "pH", "label": "pH", "type": "number", "min": 6.8, "max": 7.8, "required": true },
    { "key": "PaCO2", "label": "PaCO2", "type": "number", "unit_pref": ["mmHg","kPa"], "min": 1, "max": 120, "required": true },
    { "key": "HCO3", "label": "HCO3−", "type": "number", "unit_pref": ["mEq/L"], "min": 5, "max": 45, "required": true },
    { "key": "PaO2", "label": "PaO2 (arterial)", "type": "number", "unit_pref": ["mmHg","kPa"], "min": 20, "max": 600, "required": false },
    { "key": "BE", "label": "Base excess (opcional)", "type": "number", "min": -30, "max": 30, "required": false },

    { "key": "Na", "label": "Sódio", "type": "number", "unit_pref": ["mEq/L"], "min": 100, "max": 180, "required": false },
    { "key": "Cl", "label": "Cloreto", "type": "number", "unit_pref": ["mEq/L"], "min": 60, "max": 140, "required": false },
    { "key": "K", "label": "Potássio (opcional)", "type": "number", "unit_pref": ["mEq/L"], "min": 2, "max": 8, "required": false },
    { "key": "albumin", "label": "Albumina (g/dL)", "type": "number", "min": 0.5, "max": 6.0, "required": false },
    { "key": "lactate", "label": "Lactato (mmol/L)", "type": "number", "min": 0, "max": 20, "required": false },

    { "key": "resp_acidotic_timing", "label": "Distúrbio respiratório: agudo vs crônico (se aplicável)", "type": "enum", "options": ["auto","agudo","cronico"], "default": "auto", "required": false }
  ],
  "outputs": [
    { "key": "primary_disorder", "label": "Distúrbio primário", "type": "string" },
    { "key": "mixed_disorders", "label": "Distúrbios mistos (se houver)", "type": "array/string" },
    { "key": "comp_expected", "label": "Compensação esperada", "type": "string" },
    { "key": "anion_gap", "label": "Ânion gap (corrigido se albumina)", "type": "number" },
    { "key": "delta_ratio", "label": "Δ-ratio", "type": "number" },
    { "key": "PAO2", "label": "PAO2 (mmHg)", "type": "number" },
    { "key": "A_a_gradient", "label": "Gradiente A–a (mmHg)", "type": "number" },
    { "key": "A_a_upper_limit", "label": "Limite superior A–a pela idade (mmHg)", "type": "number" },
    { "key": "PF_ratio", "label": "PaO2/FiO2", "type": "number" },
    { "key": "hh_consistency_delta", "label": "ΔpH previsto vs medido (H–H)", "type": "number" },
    { "key": "warnings", "label": "Alertas e pitfalls", "type": "array/string" },
    { "key": "differentials", "label": "Diferenciais curtos", "type": "array/string" }
  ],
  "ui": {
    "groups": [
      { "title": "Amostra e demografia", "fields": ["age_years","sample_type","FiO2","baro_mmHg","temp_C"] },
      { "title": "ABG", "fields": ["pH","PaCO2","HCO3","PaO2","BE","resp_acidotic_timing"] },
      { "title": "Bioquímica (para AG/Δ-Δ)", "fields": ["Na","Cl","K","albumin","lactate"] }
    ],
    "notes": [
      "HCO3− é calculado pelo analisador a partir de pH e PaCO2 via Henderson–Hasselbalch; divergências grandes indicam erro ou amostra inadequada.",
      "Temperatura: se não corrigir, reporte e interprete a 37 °C (padrão)."    ]
  }
}
```

> Observação: os elementos “PaO₂ ideal (idade)”, “P/F” e “Severinghaus–Ellis (SpO₂→PaO₂)” já constam no seu compilado e serão linkados na aba de conhecimento e/ou como “related calculators”【】【】.

---

## 3) Validações e saneamento (camada comum)

* **Unidades PaCO₂/PaO₂ (kPa vs mmHg):** se `PaCO2 ≤ 8` **e** `unit_pref` ausente, assuma kPa e converta `× 7.5`; idem para `PaO2`. Se valor final cair fora do plausível, gere *warning* “possível unidade incorreta”.
* **Faixas e coerência:**

  * `pH ∈ [6.8, 7.8]`, `HCO3 ∈ [5,45]`, `PaCO2 ∈ [10,120] mmHg`.
  * **Henderson–Hasselbalch (H–H):** calcule `pH_pred = 6.1 + log10(HCO3 / (0.03 × PaCO2))`. Se `|pH − pH_pred| > 0.03`, adicionar *warning* “inconsistência pH↔HCO₃⁻/PaCO₂ (H–H) — revisar amostra/unidade”【】.
* **Temperatura:** se `temp_C != 37`, marcar “valores reportados a 37 °C (padrão de laboratório)” (campo informativo); opção futura: “corrigir por T” (controverso)【】.
* **Amostra:** se `sample_type != arterial`, bloquear **A–a** e **P/F** com *warning* “Oxigenação só com arterial” (ok para acid–base).

**Pitfalls de pré-analítica** (sempre checar): bolhas de ar, heparina, transporte tardio (PaO₂ falso), leucocitose/trombocitose consumindo O₂ — exibir em “warnings” quando “tempo de transporte” / “bolhas” forem marcados na UI【】.

---

## 4) Algoritmos (fórmulas canônicas)

### 4.1 Acid–base

* **Primário via pH + direção:**

  * `pH < 7.35` = **acidemia**; `> 7.45` = **alcalemia**; em “normal”, procurar mistos.
  * Se direção do **PaCO₂** acompanha o pH → **metabólico**; se diverge → **respiratório**.
* **Compensações (±2 para PaCO₂; ±3 para HCO₃⁻):**

  * **Acidose metabólica (Winter):** `PaCO2_exp = 1.5×HCO3 + 8 (±2)`
  * **Alcalose metabólica:** `PaCO2_exp ≈ 40 + 0.7×(HCO3 − 24) (±2)`
  * **Resp. acidose:** aguda `+1 mEq/L HCO3 / +10 PaCO2`; crônica `+3.5~4 / +10`
  * **Resp. alcalose:** aguda `−2 / −10`; crônica `−4~5 / −10`
  * Se `resp_acidotic_timing = auto`, calcule **ambos** cenários e marque o de menor desvio como “mais provável”.
* **Ânion gap:** `AG = Na − (Cl + HCO3)` (pode incluir K se informado).

  * **Correção por albumina:** `AGcorr = AG + 2.5 × (4.0 − albumina[g/dL])` (evita mascarar HAGMA) — exibir ambos.
* **Δ–Δ (quando AGcorr > limite, ex. 12):**

  * `ΔAG = AGcorr − 12`; `ΔHCO3 = 24 − HCO3`; `Δ-ratio = ΔAG/ΔHCO3`.
  * Interpretação: `<1` (HClMA associada); `1–2` (HAGMA “pura”); `>2` (alcalose metab. ou resp. crônica associada).

> As peças “AG corrigido”, “Δ-ratio” e compensações resumidas são exatamente as que o seu intérprete precisa segundo o compilado (itens e UI)【】【】.

### 4.2 Oxigenação

* **Equação alveolar:** `PAO2 = FiO2 × (Pbaro − 47) − PaCO2/R` (R=0.8; `Pbaro` default 760).
* **Gradiente A–a:** `A_a = PAO2 − PaO2`; **limite pela idade:** \~`age/4 + 4` mmHg (exibir como referência).
* **P/F:** `PF_ratio = PaO2 / FiO2`.
* **PaO₂ ideal por idade:** disponível como calculadora relacionada (usar fonte consolidada)【】.
* **SpO₂→PaO₂ (opcional, sem ABG):** Severinghaus–Ellis para estimar PaO₂ e, então, P/F (avisar limitações e sugerir confirmação por ABG)【】.

> **Atenção:** só calcular **A–a**/**P/F** com **amostra arterial** (bloquear se capilar/venosa). O seu layout original já separa bem estes conceitos【】.

---

## 5) Classificação — saída padronizada

1. **Primário único**
   `Acidose/Alcalose metabólica`, `Acidose/Alcalose respiratória (aguda/crônica)`.

2. **Misturas comuns**
   Detectar por **compensação fora da faixa** e por **Δ-ratio**:

* HAGMA + HClMA (Δ-ratio <1), HAGMA + AM (Δ-ratio >2), etc.

3. **Oxigenação**

* A–a: normal vs elevado (comparar ao **limite pela idade**).
* P/F: classificar hipoxemia e apoiar critérios de SDRA segundo protocolo local (mostrar P/F).

4. **Diferenciais curtos**

* HAGMA “GOLD MARK”; AM (vômitos/diuréticos/mineralocorticoide), AR (DPOC, asma, sedação…), etc. Você já listou um conjunto coerente no compilado; manteremos como texto de apoio no output【】.

---

## 6) Funções puras — TypeScript (núcleo)

```ts
// units.ts (helpers mínimos)
export const toMmHg = (x: number, unit: "mmHg"|"kPa" = "mmHg") => unit === "kPa" ? x * 7.5 : x;

// abgCore.ts
export type AbgInput = {
  age_years: number; sample_type: "arterial"|"capilar"|"venosa";
  FiO2: number; baro_mmHg?: number; temp_C?: number;
  pH: number; PaCO2: number; PaCO2_unit?: "mmHg"|"kPa";
  HCO3: number; PaO2?: number; PaO2_unit?: "mmHg"|"kPa"; BE?: number;
  Na?: number; Cl?: number; K?: number; albumin?: number; lactate?: number;
  resp_acidotic_timing?: "auto"|"agudo"|"cronico";
};

export type AbgOutput = {
  primary_disorder: string;
  mixed_disorders: string[];
  comp_expected: string;
  anion_gap?: number; anion_gap_corrected?: number;
  delta_ratio?: number;
  PAO2?: number; A_a_gradient?: number; A_a_upper_limit?: number;
  PF_ratio?: number;
  hh_consistency_delta?: number;
  warnings: string[];
  differentials: string[];
};

export function interpretABG(input: AbgInput): AbgOutput {
  const warnings: string[] = [];

  // 1) Normalizar unidades
  const baro = input.baro_mmHg ?? 760;
  const R = 0.8;

  const PaCO2_mmHg = toMmHg(input.PaCO2, input.PaCO2_unit ?? (input.PaCO2 <= 8 ? "kPa":"mmHg"));
  if (input.PaCO2_unit == null && input.PaCO2 <= 8) warnings.push("PaCO2 informado possivelmente em kPa; convertido para mmHg.");

  const PaO2_mmHg = input.PaO2 != null ? toMmHg(input.PaO2, input.PaO2_unit ?? (input.PaO2 <= 8 ? "kPa":"mmHg")) : undefined;
  if (input.PaO2 != null && input.PaO2_unit == null && input.PaO2 <= 8) warnings.push("PaO2 possivelmente em kPa; convertido.");

  // 2) Henderson–Hasselbalch (consistência)
  const pH_pred = 6.1 + Math.log10(input.HCO3 / (0.03 * PaCO2_mmHg));
  const hh_delta = Math.abs(input.pH - pH_pred);
  if (hh_delta > 0.03) warnings.push("Inconsistência pH↔HCO3/PaCO2 (Henderson–Hasselbalch): revisar amostra/unidades.");

  // 3) Determinar primário
  const acidemia = input.pH < 7.35, alkalemia = input.pH > 7.45;
  const resp_dir_same_as_pH = (PaCO2_mmHg > 40 && input.pH < 7.4) || (PaCO2_mmHg < 40 && input.pH > 7.4);
  let primary = "Indeterminado", compExpected = "", mixed: string[] = [];

  if (acidemia || alkalemia) {
    if (resp_dir_same_as_pH) { // metabólico
      primary = acidemia ? "Acidose metabólica" : "Alcalose metabólica";
      const PaCO2_exp = acidemia ? 1.5 * input.HCO3 + 8 : 40 + 0.7 * (input.HCO3 - 24);
      compExpected = `PaCO2 esperada ≈ ${PaCO2_exp.toFixed(1)} mmHg (±2)`;
      if (PaCO2_mmHg > PaCO2_exp + 2) mixed.push("Acidose respiratória");
      if (PaCO2_mmHg < PaCO2_exp - 2) mixed.push("Alcalose respiratória");
    } else { // respiratório
      const timing = input.resp_acidotic_timing ?? "auto";
      const isAcid = PaCO2_mmHg > 45;
      primary = isAcid ? "Acidose respiratória" : "Alcalose respiratória";
      const del10 = Math.abs(PaCO2_mmHg - 40) / 10;
      const acuteHCO3 = isAcid ? 24 + 1 * del10 : 24 - 2 * del10;
      const chronicHCO3 = isAcid ? 24 + 4 * del10 : 24 - 5 * del10;
      const choose = (t: "agudo"|"cronico") => {
        const exp = t === "agudo" ? acuteHCO3 : chronicHCO3;
        return { t, exp, diff: Math.abs(input.HCO3 - exp) };
      };
      const pick = timing === "auto" ? [choose("agudo"), choose("cronico")].sort((a,b)=>a.diff-b.diff)[0] : choose(timing);
      compExpected = `HCO3− esperado (${pick.t}) ≈ ${pick.exp.toFixed(1)} mEq/L (±3)`;
      if (input.HCO3 > pick.exp + 3) mixed.push("Alcalose metabólica");
      if (input.HCO3 < pick.exp - 3) mixed.push("Acidose metabólica");
    }
  } else {
    primary = "pH normal — suspeitar distúrbio misto";
  }

  // 4) AG / Δ-Δ
  let AG: number|undefined, AGcorr: number|undefined, deltaRatio: number|undefined;
  if (input.Na!=null && input.Cl!=null) {
    AG = input.Na - (input.Cl + input.HCO3);
    AGcorr = input.albumin!=null ? AG + 2.5*(4 - input.albumin) : AG;
    if ((AGcorr ?? 0) > 12) {
      const dAG = (AGcorr! - 12), dHCO3 = (24 - input.HCO3);
      deltaRatio = dAG / dHCO3;
      if (deltaRatio < 1) mixed.push("Acidose metabólica hiperclorêmica associada");
      if (deltaRatio > 2) mixed.push("Alcalose metabólica ou acidose resp. crônica associada");
    }
  }

  // 5) Oxigenação (somente arterial)
  let PAO2: number|undefined, A_a: number|undefined, A_a_UL: number|undefined, PF: number|undefined;
  if (input.sample_type === "arterial" && PaO2_mmHg != null) {
    PAO2 = input.FiO2 * (baro - 47) - PaCO2_mmHg / R;
    A_a = PAO2 - PaO2_mmHg;
    A_a_UL = (input.age_years / 4) + 4;
    PF = PaO2_mmHg / input.FiO2;
  } else if (input.sample_type !== "arterial" && PaO2_mmHg != null) {
    warnings.push("A–a e P/F exigem amostra arterial.");
  }

  // 6) Diferenciais (curtos)
  const diffs: string[] = [];
  if (primary.includes("Acidose metabólica") || mixed.some(x=>x.includes("Acidose metabólica"))) diffs.push("GOLD MARK, cetoacidose, IR, diarreia/ATR");
  if (primary.includes("Alcalose metabólica") || mixed.some(x=>x.includes("Alcalose metabólica"))) diffs.push("Vômitos/diuréticos/mineralocorticoide");
  if (primary.includes("Acidose respiratória")) diffs.push("DPOC/asma, depressão respiratória, neuromuscular");
  if (primary.includes("Alcalose respiratória")) diffs.push("Hipóxia/TEP, sepse, dor/ansiedade, gestação");

  return {
    primary_disorder: primary,
    mixed_disorders: Array.from(new Set(mixed)),
    comp_expected: compExpected,
    anion_gap: AG, anion_gap_corrected: AGcorr,
    delta_ratio: deltaRatio,
    PAO2, A_a_gradient: A_a, A_a_upper_limit: A_a_UL,
    PF_ratio: PF,
    hh_consistency_delta: hh_delta,
    warnings,
    differentials: diffs
  };
}
```

---

## 7) Laudo estruturado (render no front)

* **Classificação principal** + **mistos**.
* **Números-chave:** `pH, PaCO₂, HCO₃⁻, AG/AGcorr, Δ-ratio, PAO₂, A–a (limite idade), P/F`.
* **Oxigenação:** destacar se **A–a > limite** pela idade; se **A–a normal** com hipoxemia → pensar hipoventilação/altitude.
* **Diferenciais curtos** (como no compilado; manter seção “Comentários” para lembrar que ABG não substitui contexto clínico)【】.
* **Avisos de segurança**: amostra não arterial para oxigenação; inconsistência H–H; suspeita de unidade kPa; temperatura não corrigida; riscos pré-analíticos【】.

---

## 8) Casos-teste (“golden”)

1. **CAD (HAGMA) + resp. compensatória adequada**
   `pH 7.24, PaCO2 28, HCO3 12, Na 140, Cl 100, Alb 3.0, FiO2 0.21, PaO2 70, idade 60`
   Esperado: **Acidose metabólica (AGcorr↑)**; Winter \~`1.5*12+8=26±2` → PaCO₂ 28 **ok**; Δ-ratio \~`(AGcorr−12)/(24−12)` \~ 1 → HAGMA “pura”; A–a↑ (reportar limite idade \~`60/4+4=19`)【exibir limite】.

2. **Alcalose metabólica + acidose resp. crônica**
   `pH 7.46, PaCO2 55, HCO3 37`
   Resp. crônica esperada `HCO3 ≈ 24 + 4*(15/10) = 30` → medido 37 ⇒ **alcalose metabólica associada**.

3. **AR aguda**
   `pH 7.28, PaCO2 60, HCO3 27`
   Aguda esperada `HCO3 ≈ 24 + 1*(20/10)=26` (±3) → **comp. metab. adequada**.

4. **pH normal (misto)**
   `pH 7.40, PaCO2 20, HCO3 12` ⇒ **Alcalose resp. + acidose metabólica** (Δ-ratio avaliar).

5. **Oxigenação arterial**
   `FiO2 0.5, baro 760, PaCO2 40, PaO2 60`
   `PAO2 = 0.5*(760−47) − 40/0.8 = 356.5 − 50 = 306.5` → `A–a ≈ 246.5` (↑); `P/F = 120`.

6. **kPa → mmHg detecção**
   `PaCO2 5.3 (unit null)` ⇒ converter; adicionar *warning*.

> Estes cenários cobrem as lacunas citadas pelo agente (“H-H, ref. por idade, compensações, classificação de distúrbios”) na prática.

---

## 9) Integração (backend & seed)

* **Pasta:** `backend/calculators/abg/`

  * `abgCore.ts` (funções puras), `schema/abg.interpreter.v1.json`, `tests/abg.interpreter.v1.spec.ts`
* **Seed/migration:** registrar `calculator_id`, canal `stable`, `persistResult=true`, docs/links relacionados.
* **Checklist do calcGPT:** schema, funções puras, registry, units/analytes, testes “golden” e round-trip, seed, notas de curadoria, teste no front【】.
* **Conversões:** rely no `units.factors.json` (mmHg↔kPa, etc.) e analitos (Na/Cl/K/Alb) como você desenhou para o núcleo de conversões【】.

---

## 10) Integração (front end renderizado por schema)

* **Layouts** compatíveis com o que você já tem no compilado (campos pH/PaCO₂/HCO₃⁻, AG, Δ-ratio, resultado)【】.
* **Debounce 300–500 ms**; só enviar quando obrigatórios preenchidos【】.
* **Fallback local:** se offline, manter cálculo acid–base mínimo; oxigenação e Δ-Δ podem ser locais também.
* **Exibir “limite A–a por idade”** no bloco de oxigenação (p.ex., “limite: 19 mmHg aos 60 anos”).

---

## 11) Mensagens de segurança (exemplos prontos)

* “**Inconsistência H–H**: pH não bate com HCO₃⁻/PaCO₂. Revise amostra, unidades ou tempo de transporte.”【】
* “**A–a/PF exigem arterial** — oxigenação não calculada para amostra capilar/venosa.”
* “**Temperatura**: interpretado a 37 °C; correção por T é controversa.”【】
* “**Pré-analítica**: bolhas de ar, heparina, tempo, leucocitose podem distorcer valores.”【】

---

## 12) Observações pediatria/neonatal

* Referências por idade devem ajustar *flags* de normalidade; **PaO₂ alvo em RN** é mais baixo (evitar hiperóxia). Exibir rótulo “faixa neonatal” no UI quando `age_years < 1`. (Complementar com suas tabelas pediátricas quando adicionarmos módulo pediatria.)

---

## 13) O que já está no seu acervo (cross-link)

* **PaO₂ ideal por idade** — pronto no compilado; linkar na aba “Relacionadas”【】.
* **P/F e Severinghaus–Ellis (SpO₂→PaO₂)** — já documentados no compilado (com limitações)【】.
* **UI do intérprete** — base do layout já presente (campos e texto de apoio)【】.

---

### Pronto para o dev

Se quiser, eu já **abro um PR de exemplo** com `schema/`, `abgCore.ts` e `tests/` nesse formato — mas o material acima já está fechado para o seu agente codificador plugar direto no pipeline do **Health Guardian**.
