# 3) Calculadoras Obstétricas — especificação técnica completa (pronta pro dev)

Abaixo está o pacote “3. Calculadoras Obstétricas” pronto pra implementar no **Health Guardian**. Trago: (A) regras clínicas canônicas (com fontes fortes), (B) fórmulas/algoritmos, (C) JSON de I/O, (D) fluxo de decisão (pseudocódigo), (E) validações e testes, (F) tarefas de engenharia.
Escopo: **datação por LMP e USG (com redating ACOG), correção para ciclos irregulares, parâmetros biométricos (técnica e faixas), tabelas/percentis de crescimento por IG (Intergrowth-21st) e EFW (Hadlock)**.

---

## A) Regras clínicas de referência (o que a calculadora deve respeitar)

1. **Estabelecimento de EDD/IG (ACOG #700)**

* LMP (DUM) assume ciclo regular de 28d e ovulação no dia 14.
* **Ultrassom 1º trimestre (CRL)** é o método **mais acurado** para datar (ideal 9+0 a 13+6).
* “Redating” (substituir LMP pela USG) quando a diferença ultrapassa estes limites:

  * **≤ 8w6d:** > **5 dias**
  * **9w0–13w6d:** > **7 dias**
  * **14w0–15w6d:** > **7 dias**
  * **16w0–21w6d:** > **10 dias**
  * **22w0–27w6d:** > **14 dias**
  * **≥ 28w0d:** > **21 dias**
* Se **não** houver USG até 22 semanas, é “**suboptimally dated**”.
* Uma vez estabelecida, **não mude a EDD** exceto em raras circunstâncias documentadas. ([ACOG][1], [healthcare.uiowa.edu][2], [publications.smfm.org][3])

2. **Ciclos irregulares / comprimento do ciclo**

* LMP-based supõe 28d; **se o ciclo for diferente** e **conhecido para aquele ciclo**, ajustar **EDD = LMP + 280d + (ciclo−28)**.
* **Se ciclo irregular/duvidoso**, **priorizar USG 1º trimestre**; evite “ajustes” arbitrários. (Perinatology explica a suposição de 28d; ACOG prioriza USG para precisão). ([perinatology.com][4], [ACOG][1])

3. **Gravidez por FIV (casos especiais)**

* **Dia 3:** EDD ≈ **transferência + 263d**.
* **Dia 5 (blastocisto):** EDD ≈ **transferência + 261d**.
* Princípio: **EDD = concepção + 266d**; subtraia a “idade” do embrião. ([perinatology.com][4], [The ObG Project][5])

4. **Parâmetros biométricos: técnica de medida (para datar e para growth)**
   Adotar **planos/técnicas padronizados** (Intergrowth/ISUOG). Resumo operacional:

* **CRL**: plano sagital mediano verdadeiro, embrião estendido, calipers na borda externa da cabeça à borda externa do sacro (sem saco vitelino). Datação ideal 9+0–13+6.
* **BPD/HC**: plano transventricular, tálamos simétricos, linha média central. **Intergrowth usa BPD outer-to-outer**; **HC** por elipse na calota.
* **AC**: corte transverso ao nível do **estômago** e **veia porta**; circunferência por elipse.
* **FL**: diâfises ósseas extremidade a extremidade (sem epífises).
  (Use exatamente o protocolo do padrão cujo **z-score/percentil** será calculado — se usar **Intergrowth**, siga Intergrowth). ([Obstetrics & Gynecology][6], [Omda][7])

5. **Crescimento fetal (tabelas/percentis por IG)**

* Padrão recomendado: **Intergrowth-21st Fetal Growth Standards** (medianas e SD/z-scores para **HC, AC, BPD, FL** e **EFW**).
* Percentil = Φ(z), onde **z = (valor − média(GA)) / SD(GA)** (distribuição \~normal por GA nos padrões). ([Intergrowth 21][8])

---

## B) Fórmulas/algoritmos (implementação)

### 1) Datação por LMP (com correção de ciclo, opcional)

* Entrada mínima: `lmp_date` (YYYY-MM-DD).
* Opcional: `cycle_length_days` (se o **comprimento daquele ciclo** for conhecido).
* **Algoritmo:**

  * `edd_lmp = lmp_date + 280 days + max(min(cycle_length_days-28, +14), -14)` (capar o ajuste em ±14d evita abusos).
  * `ga_on(date) = floor((date - lmp_date)/7)` semanas + resto em dias.
* **Flags de confiabilidade:** `lmp_quality = {regular|irregular|unknown}`, `cycle_length_known = bool`.
* **Se irregular/unknown:** exibir aviso “Use USG para datar” e **não** promover `edd_lmp` a EDD estabelecida. ([perinatology.com][4], [ACOG][1])

### 2) Datação por USG — 1º trimestre (CRL)

* Fórmula base (Robinson & Fleming, amplamente adotada; variação NSC/BMUS corrige unidade):

  * **GA (dias) = 8.052 × √(1.037 × CRL\_mm) + 23.73**
  * (equivalente clássico: 8.052 × √CRL + 23.73; a forma com 1.037 corrige calibração antiga).
* Faixa válida: \~**45–84 mm** (≈ 9+0–13+6).
* **edd\_us\_crl = us\_exam\_date + (280d − GA\_at\_exam)**.
* Se existir LMP, aplique **redating ACOG** pelos limiares acima. ([Pi NHS][9], [LOINC][10], [ACOG][1])

### 3) Datação por USG — 2º/3º trimestre

* Se **sem datação prévia**, usar **HC (ou composto HC±FL)** para estimar GA (ISUOG).
* Depois calcule **edd\_us = us\_exam\_date + (280d − GA\_at\_exam)**.
* Se já havia EDD (por LMP ou CRL), verificar **redating** pelos limiares ACOG do trimestre. ([ISUOG][11], [ACOG][1])

> **Obs. técnica (para dev):** fórmulas de GA por HC (14–40s) podem ser providas via tabela/ajuste (p.ex. Snijders & Nicolaides 1994) ou usar as equações do padrão escolhido (Intergrowth); manter **uma única fonte** para evitar mistura de protocolos. ([Fundação Medicina Fetal][12])

### 4) Crescimento fetal por IG (percentis/z-scores)

* **Padrão**: **Intergrowth-21st**. Preparar “**data pack**” (CSV/JSON) com `GA_days → mean, SD` para **HC, AC, BPD, FL, EFW**.
* **z = (valor − mean\[GA]) / SD\[GA]**; **percentil = Φ(z)**.
* **EFW**: calcular primeiro, depois percentil de EFW no Intergrowth. ([Intergrowth 21][8])

### 5) EFW (peso fetal estimado) por biometria

* Fórmula robusta e difundida (**Hadlock 1985**; variante “quatro medidas”):

  $$
  \log_{10}(\text{EFW}) = 1.3596 + 0.0064\cdot HC + 0.0424\cdot AC + 0.174\cdot FL + 0.00061\cdot(BPD\cdot AC) - 0.00386\cdot(AC\cdot FL)
  $$

  (unidades em **cm**; depois **EFW\[g] = 10^{…}**).
* Alternativas: Hadlock A/B/C (documentar qual variante você implementou para reprodutibilidade). ([Sieog][13])

---

## C) Esquemas de dados (JSON) — I/O padronizado

### 1) **Dating Engine**

**Input** (`POST /obstetrics/dating`):

```json
{
  "context_date": "2025-08-16",
  "lmp": {
    "date": "2025-01-10",
    "cycle_length_days": 31,
    "regularity": "irregular"  // "regular" | "irregular" | "unknown"
  },
  "usg": [
    {
      "exam_date": "2025-03-20",
      "method": "CRL",         // "CRL" | "HC" | "COMPOSITE"
      "measurements": {"CRL_mm": 62.0}
    },
    {
      "exam_date": "2025-06-05",
      "method": "COMPOSITE",
      "measurements": {"BPD_mm": 52.0, "HC_mm": 190.0, "AC_mm": 160.0, "FL_mm": 34.0}
    }
  ],
  "conception": {
    "mode": "spontaneous",     // "spontaneous" | "IVF"
    "ivf": {"embryo_day": 5, "transfer_date": "2025-02-01"}
  }
}
```

**Output**:

```json
{
  "established_edd": "2025-10-17",
  "established_method": "USG_CRL",     // "LMP" | "USG_CRL" | "USG_HC" | "USG_COMPOSITE" | "IVF"
  "established_on": "2025-03-20",
  "is_suboptimally_dated": false,
  "ga_on_context": {"weeks": 31, "days": 2},
  "redating": {
    "applied": true,
    "reason": "ACOG_threshold_exceeded_9w0-13w6d",
    "details": {"diff_days": 9, "threshold_days": 7}
  },
  "warnings": [
    "Cycle irregular -> LMP not used for EDD",
    "Use Intergrowth technique for biometry if computing percentiles"
  ]
}
```

### 2) **Growth Engine**

**Input** (`POST /obstetrics/growth`):

```json
{
  "ga_reference": {"type": "EDD", "edd": "2025-10-17", "asof_date": "2025-08-16"},
  "biometry": {"BPD_mm": 52.0, "HC_mm": 190.0, "AC_mm": 160.0, "FL_mm": 34.0},
  "efw_formula": "Hadlock_1985_FourParams",   // or "Hadlock_A" | "Hadlock_B" | etc.
  "standard": "Intergrowth21st"               // for z-score/percentil
}
```

**Output**:

```json
{
  "ga_days": 219,
  "z_scores": {"HC": -0.2, "AC": 0.1, "BPD": -0.5, "FL": 0.0, "EFW": -0.35},
  "percentiles": {"HC": 42, "AC": 54, "BPD": 31, "FL": 50, "EFW": 36},
  "efw_g": 775,
  "notes": ["BPD measured O-O per Intergrowth"]
}
```

---

## D) Fluxo de decisão (pseudocódigo)

```ts
function establishEDD(input) {
  const exams = sortByDate(input.usg || []);
  let candidate = null;
  let provenance = null;

  // 1) IVF, se presente (mais exato que LMP)
  if (input.conception?.mode === 'IVF' && input.conception.ivf) {
    const base = days(input.conception.ivf.transfer_date);
    const add = 266 - (input.conception.ivf.embryo_day ?? 0);
    candidate = base.plusDays(add);
    provenance = 'IVF';
  }

  // 2) LMP (com ajuste de ciclo se conhecido)
  if (!candidate && input.lmp?.date) {
    const adj = clamp((input.lmp.cycle_length_days ?? 28) - 28, -14, +14);
    candidate = days(input.lmp.date).plusDays(280 + adj);
    provenance = 'LMP';
  }

  // 3) USG: priorizar 1º trimestre (CRL)
  const crlExam = exams.find(e => e.method === 'CRL');
  if (crlExam) {
    const GA_days = robinsonFlemingDays(crlExam.measurements.CRL_mm);
    const edd_crl = days(crlExam.exam_date).plusDays(280 - GA_days);
    // Redating ACOG vs LMP/IVF se existir
    const refEDD = candidate; const diff = dateDiffDays(edd_crl, refEDD);
    const threshold = acogRedatingThreshold(GA_days);
    if (!refEDD || Math.abs(diff) > threshold) {
      candidate = edd_crl; provenance = 'USG_CRL';
    }
  }

  // 4) Se ainda não datado e houver USG 2º/3º: usar HC/composto
  if (!candidate) {
    const late = exams.find(e => e.method !== 'CRL');
    if (late) {
      const GA_days = gaFromBiometry(late.method, late.measurements); // HC ou composto
      candidate = days(late.exam_date).plusDays(280 - GA_days);
      provenance = late.method === 'HC' ? 'USG_HC' : 'USG_COMPOSITE';
    }
  }

  // 5) Suboptimally dated?
  const firstDating = earliestDatingExam(exams);
  const suboptimal = !firstDating || gaAtExam(firstDating) > 154 /* 22w*7 */;
  return { established_edd: fmt(candidate), established_method: provenance, is_suboptimally_dated: suboptimal };
}
```

---

## E) Validações, limites e testes

### Entradas & faixas

* **CRL:** 45–84 mm (\~9–14s). Fora disso → rejeitar p/ datação. ([PMC][14])
* **BPD/HC/AC/FL:** validar ranges por GA; avisar **plano de corte incorreto** (heurística: HC muito fora com BPD concordante sugere erro de elipse). ([Omda][7])
* **Ciclo irregular (flag)**: **não** promover LMP a EDD; mostrar banner “Use USG”. ([ACOG][1])

### Testes unitários (exemplos)

* **CRL=55 mm** em 2025-03-20 → GA≈ **12+1**; **EDD = 2025-03-20 + (280 − GA\_dias)**; comparar com LMP ajustado quando existir. ([Omni Calculator][15])
* **Redating ACOG**: LMP sugere EDD\_X; USG 10+3 difere **9d** → deve **redatar** (limiar 7d). ([ACOG][1])
* **IVF d5** em 2025-02-01 → **EDD = 2025-02-01 + 261d**. ([perinatology.com][4])
* **Intergrowth**: para GA=200 d, `HC=mediana(GA)` → z≈0; percentil≈50. ([Intergrowth 21][8])
* **Hadlock**: inserir medição dummy; comparar EFW com calculadora de referência (tolerância ±1%). ([Sieog][13])

---

## F) Tarefas de engenharia (passo a passo)

1. **Core de datas**

   * Adotar **date-fns** ou **Luxon**. Nunca manipular meses/dias manualmente (evita bugs de bissexto e “31/xx”).
   * Todas as contas em **UTC** (zerando horas) para estabilidade.

2. **Módulo `dating`**

   * Implementar `robinsonFlemingDays(crl_mm)` usando a forma **8.052×√(1.037×CRL)+23.73**.
   * Implementar `acogRedatingThreshold(GA_days)` retornando o limiar correto (mapa por faixa de GA na **data do exame**).
   * Implementar `gaFromBiometry` com **uma fonte única** (p.ex., **Snijders/Intergrowth** para HC/composto). Documente a equação escolhida. ([Fundação Medicina Fetal][12])
   * Implementar caso **IVF**: `EDD = transfer + (266 - embryo_day)`.

3. **Módulo `growth` (Intergrowth)**

   * Baixar/empacotar as tabelas **Intergrowth-21st** de **HC/AC/BPD/FL/EFW** (mean/SD por GA d).
   * Interpolar linearmente entre dias; calcular z-score e percentil.
   * **Aviso** no output quando a técnica informada divergir do protocolo Intergrowth (ex.: BPD O-I vs O-O). ([Intergrowth 21][8], [Omda][7])

4. **Módulo `efw` (Hadlock)**

   * Implementar ao menos **1 variante** (a de 4 parâmetros acima).
   * Documentar as **unidades de entrada (cm)** e converter mm→cm antes do cálculo. ([Sieog][13])

5. **UI/UX**

   * No seletor “**Critério**” manter: **DUM**, **USG (CRL/HC/Comp.)**, **IVF**. Exibir **somente** os campos pertinentes.
   * **Banner de qualidade**: `LMP_regular/irregular` e “**EDD estabelecida** em {data} por {método}”.
   * **Rastro de auditoria**: salvar `established_edd`, `method`, `exam_date`, `diff_vs_lmp`, `threshold`.
   * Tooltip “**Limites ACOG**” e “**Técnica Intergrowth**”.

6. **Validação & QA**

   * Testes com dataset público (Intergrowth samples) e casos artificiais cobrindo cada limiar ACOG.
   * Snapshot tests de **percentis** (mudanças de tabela/versão devem quebrar o teste).

7. **Erros e avisos a exibir**

   * “CRL fora do intervalo de datação (45–84 mm)” → desabilitar “Estabelecer EDD”. ([PMC][14])
   * “Ciclo irregular informado → LMP não será usada para EDD; considerar USG 1º trimestre.” ([ACOG][1])
   * “Biometria incompatível com plano padrão (Intergrowth). Revise técnica.” ([Omda][7])

---

## G) Parâmetros biométricos — guia rápido pro dev e pro usuário

* **CRL (mm)**: datação (9–14s). Fora disso, não usar p/ EDD. ([PMC][14])
* **BPD (mm)**: plano transventricular; **O-O** se Intergrowth. Percentil via z-score Intergrowth. ([Omda][7])
* **HC (mm)**: elipse na calota no mesmo plano do BPD. Pode **datar** se sem CRL (14–40s) conforme fórmula padrão única. ([ISUOG][11])
* **AC (mm)**: nível do estômago e veia porta; elipse sem incluir costelas. Percentil via Intergrowth. ([Omda][7])
* **FL (mm)**: diâfise de extremidade a extremidade. Percentil via Intergrowth. ([Omda][7])
* **EFW (g)**: Hadlock; percentil de **EFW** usando Intergrowth. ([Sieog][13], [Intergrowth 21][8])

---

## H) Correções para ciclos irregulares — política da calculadora

1. **Campo opcional**: `cycle_length_days`.
2. **Se “regular” + comprimento conhecido** → **ajuste EDD** por `(ciclo−28)`.
3. **Se “irregular/unknown”** → **não** corrigir; exibir aviso e **dar prioridade a USG** para EDD.
4. **Se existir USG 1º tri** e a diferença LMP×USG exceder limiar ACOG → **redatar**. ([perinatology.com][4], [ACOG][1])

---

## I) Exemplos prontos (casos clinicamente realistas)

* **Caso 1 (ciclo 31d, LMP confiável, sem USG):**
  `EDD = LMP + 280 + (31−28) = LMP + 283d`. **Aviso:** “confirmação por USG 1º tri recomendada.” ([perinatology.com][4])

* **Caso 2 (USG CRL=62 mm em 2025-03-20):**
  `GA_dias ≈ 8.052×√(1.037×62)+23.73` → \~**12+3**; `EDD = 2025-03-20 + (280 − GA)`; se LMP divergir **>7d**, **redatar**. ([Pi NHS][9], [ACOG][1])

* **Caso 3 (IVF d5, transferência 2025-02-01):**
  `EDD = 2025-02-01 + 261d`. ([perinatology.com][4])

* **Caso 4 (Growth):**
  Em 28+0, **HC, AC, BPD, FL** → calcular **z/percentil** Intergrowth; **EFW(Hadlock)** e percentil Intergrowth de EFW. ([Intergrowth 21][8], [Sieog][13])

---

## J) Observações de implementação

* **Não misturar padrões**: se percentil é Intergrowth, **a técnica de medida deve ser Intergrowth** (ex.: BPD O-O).
* **Persistência**: salve `established_edd` + `method` + `established_on` + `source_exam`. **Nunca** recalcule EDD silenciosamente depois de “estabelecida”.
* **Internacionalização**: resultados em **semanas+dias** e **datas absolutas** (DD/MM/AAAA).
* **Acessibilidade**: mensagens claras de limitação (ex.: “USG 3º tri é menos acurada para datar”). ([ACOG][1])

---

## Referências (principais)

* **ACOG Committee Opinion #700 – Methods for Estimating the Due Date** (limiares de redating, suboptimal dating, princípios gerais). ([ACOG][1], [healthcare.uiowa.edu][2])
* **ISUOG**: uso de **HC/HC+FL** para datar quando sem datação prévia. ([ISUOG][11])
* **Intergrowth-21st**: padrões internacionais para **z-scores/percentis** de **HC/AC/BPD/FL/EFW** e manual de técnica. ([Intergrowth 21][8], [Omda][7])
* **CRL (Robinson & Fleming; NSC/BMUS revisão)**: **8.052×√(1.037×CRL)+23.73**. ([Pi NHS][9], [LOINC][10])
* **Hadlock (1985) – EFW** (equação multiparamétrica). ([Sieog][13])
* **Perinatology (nota sobre LMP=28d e EDD=concepção+266d)**; **IVF** (263/261d). ([perinatology.com][4])

---

Se quiser, já te entrego **stubs TypeScript** ou **fixtures JSON** do Intergrowth (mean/SD por dia) para plugar direto no teu backend.

[1]: https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date?utm_source=chatgpt.com "Methods for Estimating the Due Date"
[2]: https://www.healthcare.uiowa.edu/familymedicine/fpinfo/OB/OB2017/ACOG%20redating%20gestational%20age.pdf?utm_source=chatgpt.com "ACOG redating gestational age.pdf"
[3]: https://publications.smfm.org/publications/239-acog-committee-opinion-700-methods-for-estimating-the/?utm_source=chatgpt.com "ACOG Committee Opinion #700: Methods for estimating ..."
[4]: https://perinatology.com/calculators/Due-Date.htm?utm_source=chatgpt.com "Pregnancy Due Date Calculator"
[5]: https://www.obgproject.com/2023/01/02/accurate-ultrasound-pregnancy-dating/?utm_source=chatgpt.com "When LMP and Ultrasound Dates Don't Match"
[6]: https://obgyn.onlinelibrary.wiley.com/doi/10.1002/uog.17347?utm_source=chatgpt.com "International estimated fetal weight standards of the ..."
[7]: https://www.medscinet.net/Intergrowth/patientinfodocs/Intergrowth%20Protocol%20Sept%202009.pdf?utm_source=chatgpt.com "The International Fetal and Newborn Growth Standards for the ..."
[8]: https://intergrowth21.com/tools-resources/fetal-growth?utm_source=chatgpt.com "Fetal Growth | Intergrowth"
[9]: https://www.pi.nhs.uk/ultrasound/standards/datingpolicy.htm?utm_source=chatgpt.com "Ultrasound Standards Dating Policy - Perinatal Institute"
[10]: https://loinc.org/11914-9?utm_source=chatgpt.com "Gestational age estimated from Crown rump length on US ..."
[11]: https://www.isuog.org/static/4e2ed89e-fa8a-42c2-9c0929cd89cb58ff/ISUOG-Practice-Guidelines-routine-mid-trimester-fetal-ultrasound.pdf?utm_source=chatgpt.com "ISUOG-Practice-Guidelines-routine-mid-trimester-fetal- ..."
[12]: https://fetalmedicine.org/research/pregnancyDating?utm_source=chatgpt.com "Pregnancy dating"
[13]: https://www.sieog.it/wp-content/uploads/2014/05/815.full_.pdf?utm_source=chatgpt.com "Assessment of the Accuracy of Multiple Sonographic Fetal ..."
[14]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4029763/?utm_source=chatgpt.com "Estimation of gestational age in early pregnancy from ..."
[15]: https://www.omnicalculator.com/health/crown-rump-length?utm_source=chatgpt.com "Crown-rump Length Calculator | CRL"
