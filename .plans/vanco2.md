perfeito — vamos refazer o “1. Vancomycin Dosing” com foco de produção (full-stack), já no formato que seu agente-codificador consegue implementar direto. Trago: (a) especificação funcional, (b) regras clínicas consolidadas e rastreáveis, (c) algoritmos com fórmulas, (d) contratos de API/DTO, (e) esquema de testes e (f) pontos de integração/parametrização por protocolo hospitalar.

> Escopo desta entrega: **adultos** (pediatria fora). A lógica admite TFG estável, **IHD** (hemodiálise intermitente), **CRRT** e pacientes com função renal instável. Alvos PD primários por AUC; “trough” apenas quando indicado (ex.: IHD, PD, CRRT noturno, ou meningite/CNS). Fontes principais e atualizadas estão citadas ao longo.

---

# 1) Regras clínicas (base para a engine)

## 1.1 Alvos terapêuticos por indicação

* **Infecções invasivas por MRSA** (bacteremia, endocardite, osteomielite, pneumonia grave, etc.): **AUC24/MIC (MIC=1 por BMD) entre 400–600 mg·h/L**; atingir nas primeiras 24–48 h. Quando usar AUC, não mire “trough” específico. ([idsociety.org][1])
* **CNS/meningite**: se optar por protocolo baseado em “trough”, meta **15–20 mg/L**. (Em Stanford, o alvo elevado de trough restringe-se essencialmente a meningite/CNS; demais indicações usam AUC ou trough amplo 10–20.)&#x20;
* **Quando não for viável AUC** (IHD/PD/CRRT noturno, função renal oscilante): use **trough \~15 (10–20) mg/L** (ou 15–20 na CNS).&#x20;

> Observação: risco de nefrotoxicidade aumenta com **AUC >650** ou **trough >15** — monitore de perto.&#x20;

## 1.2 Dose de ataque (load)

* Populações alvo: sépticos/graves com suspeita/confirmada MRSA grave, RRT (IHD/CRRT) ou infusão contínua.
* **Padrão:** **20–35 mg/kg (TBW)**, **máx 3 g**, arredondar para **250 mg** e **infundir a cada 1 g em ≥60 min**. Sugestões por peso (25 mg/kg) disponíveis (ex.: 1 g, 1,25 g, 1,5 g… até 2–3 g), com esquema “modificado” (20–25 mg/kg) em **CrCl <30 / AKI / IHD / CRRT**.&#x20;

## 1.3 Manutenção por função renal (TFG/CrCl estáveis)

Regras de Stanford (usar **TBW** para dose; **arredondar** a 250 mg; **máx 2 g/dose** e **4,5 g/24h** inicialmente). Tabela-guia:

* **CrCl >90 mL/min:** 15 mg/kg **q8–12h** (obesos: usar calculadora/PK).
* **CrCl 51–89:** 10–20 mg/kg **q12h**.
* **CrCl 30–50:** 10–15 mg/kg **q12h** ou 20 mg/kg **q24h**.
* **CrCl <10 ou AKI:** 15 mg/kg x1, depois **dose por nível**.
* **Infusão contínua (ARF >130 mL/min em UTI):** considerar regime dedicado (ver §1.6).
  Ajustes e temporização de níveis conforme quadro do protocolo.&#x20;

### Peso para **Cockcroft-Gault** (para ClCr)

* **IBW** se não obeso; **AdjBW = IBW + 0,4(TBW–IBW)** se obeso (BMI>30); **TBW** se TBW\<IBW. Evitar “arredondar SCr” (superestima insuficiência).&#x20;

### TFG por **CKD-EPI 2021** (se preferir TFGe em mL/min/1,73m²)

* Fórmula sem raça: **eGFR = 142·min(Scr/k,1)^α · max(Scr/k,1)^−1,200 · 0,9938^idade · (1,012 se mulher)**; k=0,7 (F) ou 0,9 (M); α=−0,241 (F) ou −0,302 (M). ([Medscape][2])

## 1.4 Hemodiálise intermitente (IHD)

* **Carga inicial:** 20–25 mg/kg (máx 2 g).
* **Estratégia:** dosar **pré-HD** (preferido) e repor **pós-HD** com base no nível; Stanford traz algoritmo e alternativas (nível \~4 h pós-HD), e UNMC detalha esquemas práticos.&#x20;

## 1.5 CRRT

* **Carga:** 20–25 mg/kg (máx 2 g).
* **Manutenção:** **10–15 mg/kg q24h** (parâmetros usuais de efluente 1–2 L/h aproximam CrCl 30–50 mL/min). Ajustar por AUC/níveis; lembrar que **diurese residual** aumenta CL não-CRRT. ([PMC][3])
* Em CRRT **alta-intensidade** pode ser necessário **≥15 mg/kg/dia** para atingir AUC-alvo; sempre monitorar AUC/níveis.&#x20;

## 1.6 Infusão contínua (seleção de casos)

* Considerar em **CrCl >130 mL/min (ARF)** em UTI. Carregar 15 mg/kg e calcular TDD por ferramenta PK; **nível aleatório a 24 h** com alvo **17–25 mg/L**; ajuste proporcional pela razão nível atual/desejado.&#x20;

## 1.7 AUC-guiado: métodos suportados

* **Meta universal MRSA grave:** **AUC24 400–600 mg·h/L**. Duas abordagens:

  1. **Equação de 1ª ordem (Sawchuk-Zaske/trapezoidal) com 2 níveis pós-distribuição**.
  2. **Bayes** (software/modelos população; 1–2 níveis). ([idsociety.org][1], [PMC][4])
* Stanford resume as **equações** (k, back-extrapolação e AUC por intervalo + “*× (24/τ)*”). ([Stanford Medicine][5])
* Evidência contemporânea compara métodos e viabilidade de AUC por 2 níveis. ([PMC][6])

## 1.8 Segurança e administração

* **Infundir ≤1 g/h** para reduzir “vancomycin infusion reaction” (ex-“red man”); se ocorrer, **retardar infusão (90–120 min/1 g)** ± anti-histamínico.&#x20;

---

# 2) Design de software (prod-ready)

## 2.1 Arquitetura

* **Serviço “pk-antimicrobials”** (stateless), com “policy overlay” por hospital.
* **Camadas:**

  * **Core PK** (puro): fórmulas (GFR/ClCr, CG/CKD-EPI), peso ideal/ajustado, Vd empírico, k, AUC (2 níveis), trapezoidal, conversões e arredondamentos.
  * **Rules**: mapeia **indicação → alvo PD** e **modo renal → regime** (AUC vs trough; IHD/CRRT).
  * **Protocols**: parâmetros “hospital-específicos” (ex.: caps de dose, janela de coleta, alvo trough por CNS, política de rounding, limites de TDD, mensagens).
  * **API** (REST/GraphQL) + **validação** forte (TypeScript + Zod ou Python + Pydantic).
  * **Audit & Explainability**: retornar **justificativa** (regras ativas + citações).

## 2.2 Contratos (REST)

### POST `/v1/vancomycin/regimen`

**Request (JSON)**

```json
{
  "demographics": {"age": 63, "sex": "M", "height_cm": 175, "weight_kg": 92, "bmi": 30.0},
  "renal": {
    "mode": "stable" | "ihd" | "crrt" | "pd" | "aki_unstable",
    "scr_mg_dl": 1.6,
    "egfr_source": "cg" | "ckdepi2021",
    "urine_ml_24h": 800,
    "crcl_override_ml_min": null
  },
  "indication": "mrsa_invasive" | "meningitis_cns" | "other",
  "monitoring": "auc" | "trough",
  "rtt_params": {"crrt_effluent_l_h": 2.0, "ihd_hours": 4},
  "constraints": {"max_single_dose_mg": 2000, "max_daily_mg": 4500, "round_to_mg": 250}
}
```

**Response (JSON)**

```json
{
  "loading": {"dose_mg": 2000, "infusion_minutes": 120, "rationale": "25 mg/kg TBW; round 250 mg"},
  "maintenance": {
    "plan": [{"dose_mg": 1250, "interval_h": 12}],
    "mode": "intermittent" | "continuous",
    "expected_auc24": null,
    "next_levels": [
      {"type": "random", "at_hours": 24, "note": "AUC or continuous infusion"},
      {"type": "trough", "before_dose_number": 4}
    ]
  },
  "targets": {"auc24": [400,600], "trough_mg_L": [10,20], "special": "CNS 15-20 if trough-based"},
  "safety": {"infusion_rate_max_mg_per_h": 1000},
  "explain": [{"rule": "AUC 400–600 MRSA", "source": "IDSA/ASHP 2020"},
              {"rule": "CRRT 10–15 mg/kg q24h", "source": "Stanford 2023"}]
}
```

### POST `/v1/vancomycin/auc`

Calcula AUC por 2 níveis (ou Bayes plugável).

**Request**

```json
{
  "dose": {"amount_mg": 1000, "interval_h": 12, "infusion_h": 1},
  "samples": [
    {"t_hr_after_start": 3.0, "conc_mg_L": 28.0},
    {"t_hr_after_start": 11.5, "conc_mg_L": 14.2}
  ],
  "patient": {"weight_kg": 92, "sex": "M", "age": 63}
}
```

**Response**

```json
{
  "pk": {"kel_h": 0.095, "vd_L": 0.7, "cl_L_h": 6.8},
  "auc": {"auc_tau": 300, "tau_h": 12, "auc24": 600},
  "target_met": true,
  "recommendation": {"adjustment": "none", "note": "If >600, scale TDD proportionally"}
}
```

### POST `/v1/vancomycin/rrt/recommendation`

Regras específicas de **IHD** / **CRRT** (entrada: tipo de RRT, duração, efluente, nível pré/pós, etc.) e retorno do **re-dose** e **próximo nível**.

---

# 3) Algoritmos (implementação)

## 3.1 Utilitários de peso e função renal

```ts
// IBW (kg): M = 50 + 2.3*(inches>60); F = 45.5 + 2.3*(inches>60)
// AdjBW = IBW + 0.4*(TBW-IBW)
function cockcroftGault(age, scr, sex, weightKg, heightCm): number {
  const ibw = sex==='M'
    ? 50 + 2.3*((heightCm/2.54) - 60)
    : 45.5 + 2.3*((heightCm/2.54) - 60);
  const useW = (weightKg < ibw) ? weightKg : (weightKg/ibw > 1.3 ? ibw + 0.4*(weightKg-ibw) : ibw);
  const base = ((140 - age) * useW) / (72 * scr);
  return sex==='F' ? base*0.85 : base;  // mL/min
} // :contentReference[oaicite:16]{index=16}

// CKD-EPI 2021 (mL/min/1,73m²)
function ckdepi2021(scr, age, sex) {
  const k = sex==='F' ? 0.7 : 0.9;
  const a = sex==='F' ? -0.241 : -0.302;
  const term1 = Math.min(scr/k, 1)**a;
  const term2 = Math.max(scr/k, 1)**(-1.200);
  const female = sex==='F' ? 1.012 : 1.0;
  return 142 * term1 * term2 * (0.9938 ** age) * female;
} // :contentReference[oaicite:17]{index=17}
```

## 3.2 Dose de ataque

```ts
function loadingDoseMg(weightKg, severity, renalMode, round=250, max=3000) {
  const base = (severity==='severe' || renalMode!=='stable') ? 22.5 : 25; // mg/kg, dentro de 20–35
  const raw = base * weightKg;
  const capped = Math.min(raw, max);
  return Math.round(capped/round)*round;
} // :contentReference[oaicite:18]{index=18}
```

## 3.3 Manutenção (estável, **intermitente**)

Regra determinística por **CrCl** (usar TBW para mg/kg; arredondar; respeitar caps):

```ts
function maintenanceByCrCl(crcl, weightKg) {
  let mgPerDose, interval;
  if (crcl > 90) { mgPerDose = 15*weightKg; interval=8; }             // 8–12h
  else if (crcl >= 51) { mgPerDose = 15*weightKg; interval=12; }
  else if (crcl >= 30) { mgPerDose = 12.5*weightKg; interval=12; }    // ou 20 mg/kg q24h
  else { return { strategy: 'dose_by_level' }; }
  return { doseMg: round250(mgPerDose), intervalH: interval };
} // :contentReference[oaicite:19]{index=19}
```

## 3.4 **AUC por 2 níveis** (Sawchuk-Zaske/trapezoidal)

Passos (padrão Stanford):

1. **Back-extrapolar** pico verdadeiro e **forward-extrapolar** vale.
2. **k = ln(C1/C2)/(Δt)** (níveis em fase de eliminação).
3. **AUC\_τ = t\_inf·(Cmax + Cmin)/2 + (Cmax−Cmin)/k**.
4. **AUC24 = AUC\_τ · (24/τ)**.
5. Ajustar TDD **proporcionalmente** para mover AUC ao alvo. ([Stanford Medicine][5])

```ts
function aucTwoLevels({C1, t1, C2, t2, tau, tinf}) {
  const k = Math.log(C1/C2) / (t2 - t1);
  const aucTau = tinf * (C1 + C2) / 2 + (C1 - C2) / k;
  return { k, aucTau, auc24: aucTau * (24/tau) };
}
function scaleDailyDose(currentTDDmg, currentAUC24, target=550) {
  return Math.round((currentTDDmg * target / currentAUC24)/250)*250;
} // :contentReference[oaicite:21]{index=21}
```

> Observação: a diretriz recomenda AUC 400–600 via método de 1ª ordem ou **Bayes**; mantenha o design **plugável** para posterior integração de um provedor Bayes (ex.: InsightRX/DoseMe – se licenciado). ([idsociety.org][1], [PMC][4])

## 3.5 **IHD** (algoritmo)

* **Carga:** 20–25 mg/kg (máx 2 g).
* **Nível alvo:** **pré-HD** (preferido).
* **Re-dose pós-HD** com base no nível (ou **nível \~4 h** após término da sessão como alternativa).
* **Ciclo:** repetir nível **antes da próxima HD** e ajustar.
  Implemente estados: `awaiting_hd`, `post_hd_replacement_due`, `steady_hd_cycle`, com regras de disparo por horário/nível.&#x20;

## 3.6 **CRRT**

* **Carga 20–25 mg/kg**; **manutenção 10–15 mg/kg q24h** se efluente 1–2 L/h (aprox. CrCl 30–50).
* Considere **urina 24 h** (diurese residual) como covariável de CL para ajuste fino (se informado).
* Priorize **AUC** e nivele **24–48 h**. Estados: `crrt_init`, `crrt_titrate_auc`, `crrt_steady`. ([PMC][3])

## 3.7 Infusão contínua (opcional)

* **TDD** por calculadora PK; **nível 24 h**, alvo **17–25 mg/L**; ajuste proporcional **TDD\_new = TDD\_cur × (alvo/nível)**.&#x20;

## 3.8 Regras de segurança

* **Infusão ≤1.000 mg/h**, máx **2 g/dose** e **4,5 g/dia** inicial; **alerta** se previsão de AUC>650 ou trough>15.&#x20;

---

# 4) Parametrização “protocolo hospitalar”

Crie um **manifesto** (JSON/YAML) carregado no boot do serviço:

```yaml
targets:
  mrsa_invasive: { auc24: [400,600] }
  meningitis_cns: { trough: [15,20] }
infusion:
  max_mg_per_h: 1000
dosing:
  rounding_mg: 250
  max_single_mg: 2000
  max_daily_mg: 4500
monitoring:
  stable:
    first_level_h: [24,48]
  ihd:
    prefer_predialysis: true
  crrt:
    first_level_h: [24,48]
weights_for_cg: { obese_bmi: 30, adjbw_factor: 0.4 }
```

---

# 5) Qualidade: validação e testes

## 5.1 Validações (reject com 422)

* **Faixas**: idade 18–120; peso 30–300 kg; SCr 0,2–15 mg/dL; altura 120–220 cm.
* **Consistência**: se `renal.mode="aki_unstable"` → bloquear AUC por 2 níveis “steady state”; forçar **dose por nível**.

## 5.2 Unit tests (exemplos)

1. **Load/round/cap**: 96 kg → load 25 mg/kg = 2400 → **2.5 g**; com `max=2000` → **2 g**.
2. **CrCl by CG**: casos TBW\<IBW (usa TBW), obesidade (AdjBW).&#x20;
3. **Regimes por CrCl**: 95 → q8–12h; 55 → q12h; 35 → q12h/24h.&#x20;
4. **AUC 2 níveis**: reproduzir exemplo do protocolo (redimensionar TDD por regra proporcional).&#x20;
5. **IHD**: simular ciclo com nível pré-HD baixo → re-dose pós-HD presente; alto → sem re-dose.&#x20;
6. **CRRT**: efluente 2 L/h com diurese 0 mL → requer ≥10–15 mg/kg/d; com diurese 1200 mL/24h → mesma dose gera AUC menor (ajuste). ([PMC][3])
7. **Safety**: bloquear programação de infusão >1 g/h; warnings para AUC>650/trough>15.&#x20;

---

# 6) Observabilidade & governança

* **Log estruturado**: entradas, parâmetros de cálculo, regras acionadas, saída e citações (ids).
* **Explainability**: devolva no payload `explain[]` com regra→fonte.
* **Auditoria clínica**: persistir *snapshot* do manifesto de protocolo usado no cálculo.

---

# 7) UI/UX (mínimo necessário)

* Renderize **“Plano inicial”** (carga + manutenção), **“Alvo PD”**, **“Quando coletar níveis”**, **“Próxima ação”** (com data/hora).
* Mostre **aviso de segurança** (infusão, nefrotoxicidade).
* Deixe claro o **modo**: AUC vs trough; IHD/CRRT.

---

# 8) Fontes curadas (o que sua engine deve “referenciar”)

* **Diretriz 2020 (ASHP/IDSA/PIDS/SIDP)** – alvo **AUC 400–600**, métodos AUC (1ª ordem ou Bayes), chegar em 24–48 h. ([idsociety.org][1])
* **Stanford Vancomycin Dosing Guide (rev. 02/2023)** – **tabelas por CrCl**, **round 250 mg**, **caps**, **infusão ≤1 g/h**, **IHD**, **CRRT 10–15 mg/kg q24h**, **infusão contínua (alvo 17–25 mg/L)**, **equações Sawchuk-Zaske** e **regra proporcional de TDD**.&#x20;
* **Stanford – casos** (CNS/meningite com trough 15–20 apenas; demais 10–20 ou AUC).&#x20;
* **UNMC** – prática detalhada para **IHD**.&#x20;
* **CKD-EPI 2021** – fórmula sem raça (constantes 142/0,9938). ([Medscape][2])
* **CRRT (revisões/estudos)** – necessidade de titulação por AUC; impacto da diurese residual; CRRT alta-intensidade pode exigir ≥15 mg/kg/d. ([PMC][3])
* **Sanford Guide (AUC e calculadora)** – referência de método (pagamento/assinatura, use só como *reference link* institucional). ([sanfordguide.com][7])

---

## Notas finais de implementação

* **Unidades e arredondamentos**: centralize em helpers; todo output **mg** e **h**; arredonde dose a 250 mg e horários ao **meio-hora** por padrão.&#x20;
* **Estados renais dinâmicos**: se `aki_unstable` → **desabilite** AUC “steady-state” e force **dose-by-level** com reavaliação 24 h.&#x20;
* **Compatibilidade**: projete a camada de **Rules** para aceitar “overrides” de cada hospital (ex.: querer trough 15–20 para osteomielite, etc.).
* **Conformidade**: logue as **citações** usadas na decisão (p. ex., `source_id: turn10view2#p2-L14`).
* **Segurança clínica**: sempre retornar **mensagem de cautela** (“esta ferramenta apoia, não substitui julgamento clínico”) e exigir **confirmar dados críticos** (peso/SCr modo manual ou integração LIS/EMR).

Se quiser, na próxima a gente parte para o “2. Interpretador de Gasometria Arterial” com o mesmo nível de detalhe técnico de implementação.

[1]: https://www.idsociety.org/practice-guideline/vancomycin/ "Therapeutic monitoring of vancomycin for serious methicillin-resistant Staphylococcus aureus infections: A revised consensus guideline and review by ASHP/PIDS/SIDP/IDSA"
[2]: https://reference.medscape.com/calculator/251/egfr-using-ckd-epi-2021-update "eGFR using CKD-EPI (2021 update)"
[3]: https://pmc.ncbi.nlm.nih.gov/articles/PMC10785304/ "
            Population pharmacokinetics and individualized dosing of vancomycin for critically ill patients receiving continuous renal replacement therapy: the role of residual diuresis - PMC
        "
[4]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9147553/?utm_source=chatgpt.com "Two Innovative Approaches to Optimize Vancomycin ..."
[5]: https://med.stanford.edu/content/dam/sm/bugsanddrugs/documents/antimicrobial-dosing-protocols/SHC%20Vancomycin%20Dosing%20Guide.pdf?utm_source=chatgpt.com "SHC Vancomycin Dosing Guide"
[6]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9806189/?utm_source=chatgpt.com "Comparison of the mathematical equation and trapezoidal ..."
[7]: https://www.sanfordguide.com/vanco_auc/?srsltid=AfmBOoo-8uEuGK-5c6x0J3eIe_IRJqcAhZFcXWZzCueOpc330tPoC-3h&utm_source=chatgpt.com "Vanco AUC24 Explained"
