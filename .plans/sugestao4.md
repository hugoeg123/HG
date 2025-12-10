Vou assumir aqui o papel de “chefe de protocolo” do app 😊

## 1. Escopo desta resposta

* **População:** adulto ≥18 anos, não gestante, em repouso, afebril, sem dor intensa.
* **Uso:**

  * validar **dados de perfil** preenchidos por pacientes;
  * destacar valores em **registros profissionais**;
  * definir a **faixa “verde” (normal)** dos sinais vitais.
* **Fontes centrais (adulto):**

  * Cleveland Clinic – artigo de sinais vitais (tabela de normais para adultos).([Cleveland Clinic][1])
  * Cleveland Clinic / Mayo Clinic – frequência cardíaca de repouso 60–100 bpm.([Cleveland Clinic][2])
  * MedlinePlus / Mayo – temperatura corporal normal ~36,1–37,2 °C; febre ≥38 °C.([medlineplus.gov][3])
  * NEWS2 (Royal College of Physicians) – faixa que zera a pontuação para FR, FC, PA, T.([rcp.ac.uk][4])
  * Diretrizes Brasileiras de Hipertensão 2020 (SBC).([SciELO Brasil][5])
  * Diretriz ACC/AHA 2017 de hipertensão (EUA).([professional.heart.org][6])

Textos como **Toronto Notes, Mayo Clinic, Semiologia Clínica (HC/FMUSP)** convergem, em essência, para os mesmos intervalos de normalidade; diferenças são muito pequenas (ex.: FR 12–18 vs 12–20).

---

## 2. Abreviações – português e inglês

### Em português (BR)

| Conceito                | Nome PT-BR                  | Abreviação PT     |
| ----------------------- | --------------------------- | ----------------- |
| Temperatura corporal    | Temperatura                 | **T** ou **Temp** |
| Frequência cardíaca     | Frequência cardíaca         | **FC**            |
| Frequência respiratória | Frequência respiratória     | **FR**            |
| Pressão arterial        | Pressão arterial            | **PA**            |
| Pressão art. sistólica  | Pressão arterial sistólica  | **PAS**           |
| Pressão art. diastólica | Pressão arterial diastólica | **PAD**           |
| Pressão art. média      | Pressão arterial média      | **PAM**           |

### Em inglês (US)

| Conceito                | Nome em inglês           | Abreviação EN    |
| ----------------------- | ------------------------ | ---------------- |
| Temperatura corporal    | Body temperature         | **Temp**, **BT** |
| Frequência cardíaca     | Heart rate               | **HR**           |
| Frequência respiratória | Respiratory rate         | **RR**           |
| Pressão arterial        | Blood pressure           | **BP**           |
| Pressão art. sistólica  | Systolic blood pressure  | **SBP**          |
| Pressão art. diastólica | Diastolic blood pressure | **DBP**          |
| Pressão art. média      | Mean arterial pressure   | **MAP**          |

---

## 3. Faixa de normalidade (“verde”) – adulto

### 3.1 Temperatura (T / Temp / BT)

* **Faixa normal operacional do app (adulto, repouso):**
  **36,1–37,2 °C** (via termômetro oral/timpânico ou equivalente bem calibrado).([medlineplus.gov][3])
* **Pontos de corte relevantes para futuros alertas:**

  * **Febre:** ≥ **38,0 °C** (app pode tratar 37,3–37,9 °C como “zona amarela”).([medlineplus.gov][3])
  * **Hipotermia:** < **35,0 °C** (alto risco; muitos protocolos urgência/UTI usam <35 °C como critério de gravidade).([CNIB][7])

---

### 3.2 Frequência cardíaca (FC / HR)

* **Faixa normal de repouso (adulto):**
  **60–100 bpm** (Cleveland, Mayo, múltiplas fontes).([Cleveland Clinic][2])
* **Notas para o app:**

  * Atletas treinados podem ter FC 40–59 bpm sem patologia; ideal o app permitir flag “atleta” no perfil.
  * **NEWS2** considera FC **51–90 bpm** como o intervalo totalmente neutro (0 pontos), tratando 91–110 como leve alteração.([rcp.ac.uk][4])
  * Para **“verde” universal**, eu sugiro adotar:

    * **FC 50–99 bpm** = normal operacional (sem destaque).
    * FC 40–49 / 100–109 = amarelo; ≥110 ou <40 = vermelho (para próximas camadas de lógica).

---

### 3.3 Frequência respiratória (FR / RR)

* Fontes de fisiologia clínica + Cleveland Clinic + guias de observação adulta convergem para **12–20 irpm** como faixa habitual.([Geeky Medics][8])
* **NEWS2** define **12–20 rpm** como o intervalo que rende 0 pontos (normal).([rcp.ac.uk][4])

> **Faixa normal operacional para o app:**
> **FR 12–20 irpm** em repouso, adulto acordado.

Para lógica futura:

* 9–11 ou 21–24 → amarelo.
* ≤8 ou ≥25 → vermelho/alarme (NEWS2).([rcp.ac.uk][4])

---

### 3.4 Pressão arterial (PA / BP, PAS/SBP, PAD/DBP)

Aqui temos a maior diferença **Brasil x EUA**, então vou separar em:

#### 3.4.1 O que é “normal” para o nosso app (faixa verde)

* Para **adulto em repouso**, usando Cleveland Clinic e convergência das diretrizes:

  * **PAS (SBP): 90–120 mmHg**
  * **PAD (DBP): 60–80 mmHg**([Cleveland Clinic][1])

Essa faixa:

* Fica **acima do limiar de hipotensão** (≈90/60).([Cleveland Clinic][1])
* Está dentro de **“ótimo”/“normal”** tanto para ACC/AHA quanto para SBC.

**Para o app (verde):**

* **PAS 90–120 mmHg e PAD 60–80 mmHg**

  * Dentro disso → texto permanece sem destaque.
  * Fora disso → amarelo/vermelho conforme graus que vocês definirem com base nas diretrizes.

#### 3.4.2 Diferenças de classificação BR x EUA (importante para documentação)

**Brasil – Diretriz Brasileira de HAS 2020 (SBC)** – medida em consultório, ≥18 anos:([SciELO Brasil][5])

| Classificação SBC 2020 (consultório) | PAS (mmHg) |   PAD (mmHg) |
| ------------------------------------ | ---------: | -----------: |
| **Ótima (optimum BP)**               |       <120 |          <80 |
| **Normal**                           |    120–129 |   e/ou 80–84 |
| **Pré-hipertensão**                  |    130–139 |   e/ou 85–89 |
| **HAS estágio 1**                    |    140–159 |   e/ou 90–99 |
| **HAS estágio 2**                    |    160–179 | e/ou 100–109 |
| **HAS estágio 3**                    |       ≥180 |    e/ou ≥110 |

> **Diagnóstico de hipertensão (Brasil):**
> Em geral **PA ≥140/90 mmHg** em medidas repetidas em consultório, com alvos terapêuticos em torno de <130/80 em grupos de maior risco.

---

**EUA – ACC/AHA 2017 (ainda base dos updates recentes)**:([professional.heart.org][6])

| Categoria ACC/AHA 2017 | PAS (mmHg) | PAD (mmHg) |
| ---------------------- | ---------: | ---------: |
| **Normal**             |       <120 |      e <80 |
| **Elevated**           |    120–129 |      e <80 |
| **HAS estágio 1**      |    130–139 |   ou 80–89 |
| **HAS estágio 2**      |       ≥140 |     ou ≥90 |

> **Diagnóstico de hipertensão (EUA):**
> **PA ≥130/80 mmHg** já é classificado como hipertensão; alvo de tratamento usual <130/80.([professional.heart.org][6])

**Resumo da diferença crítica para o design do app:**

* **Faixa 130–139/85–89:**

  * **Brasil:** “pré-hipertensão” (ainda não HAS estabelecida).([SciELO Brasil][5])
  * **EUA:** já é **hipertensão estágio 1**.([professional.heart.org][6])
* **Por isso**, para não subestimar risco no app global, é prudente:

  * Tratar **130–139/80–89** como **zona amarela de alerta** (pré-hipertensão / hipertensão estágio 1 conforme o país).
  * Reservar “verde” apenas para **<130/<80**, e “ótimo” para 90–120/60–80, como sugerido acima.

---

## 4. “Mapa” de variáveis para o time de programação

### 4.1 Tabela humana

| ID técnico (sugestão) | Label PT-BR             | Label EN-US              | Abrev PT | Abrev EN | Faixa verde adulto (18+, repouso) | Unidade | Fontes principais                                                  |
| --------------------- | ----------------------- | ------------------------ | -------: | -------: | --------------------------------- | ------: | ------------------------------------------------------------------ |
| `temp_c`              | Temperatura corporal    | Body temperature         | T / Temp |  Temp/BT | **36,1 – 37,2**                   |      °C | MedlinePlus, Mayo, Cleveland([medlineplus.gov][3])                 |
| `hr_bpm`              | Frequência cardíaca     | Heart rate               |       FC |       HR | **50 – 99**                       |     bpm | Cleveland, Mayo, NEWS2 (faixa neutra 51–90)([Cleveland Clinic][2]) |
| `rr_bpm`              | Frequência respiratória | Respiratory rate         |       FR |       RR | **12 – 20**                       |    irpm | GeekyMedics, NEWS2, Cleveland([Geeky Medics][8])                   |
| `sbp_mmHg`            | Pressão art. sistólica  | Systolic blood pressure  |      PAS |      SBP | **90 – 120**                      |    mmHg | Cleveland, SBC 2020, ACC/AHA 2017([Cleveland Clinic][1])           |
| `dbp_mmHg`            | Pressão art. diastólica | Diastolic blood pressure |      PAD |      DBP | **60 – 80**                       |    mmHg | Mesmas acima                                                       |

> **Observação operacional:** para pacientes que informarem ser atletas, idosos frágeis ou em uso de betabloqueador, faz sentido modular os thresholds de FC e PA (camada futura de personalização).

---

### 4.2 Versão em JSON (pronta para o time dev usar como seed)

```json
[
  {
    "id": "temp_c",
    "label_pt": "Temperatura corporal",
    "label_en": "Body temperature",
    "abbr_pt": ["T", "Temp"],
    "abbr_en": ["Temp", "BT"],
    "age_group": "adulto >=18 anos, não gestante",
    "range_green": { "min": 36.1, "max": 37.2 },
    "unit": "°C",
    "sources": [
      "MedlinePlus - Body temperature norms, 2025",
      "Mayo Clinic - Fever: first aid",
      "Cleveland Clinic - Vital Signs"
    ],
    "clinical_notes_pt": "Considerar febre >= 38,0 °C; 37,3-37,9 °C zona amarela."
  },
  {
    "id": "hr_bpm",
    "label_pt": "Frequência cardíaca em repouso",
    "label_en": "Resting heart rate",
    "abbr_pt": ["FC"],
    "abbr_en": ["HR"],
    "age_group": "adulto >=18 anos, não gestante",
    "range_green": { "min": 50, "max": 99 },
    "unit": "bpm",
    "sources": [
      "Cleveland Clinic - Heart Rate: Normal Rates",
      "Mayo Clinic - What's a normal resting heart rate?",
      "NEWS2 - faixa 0 pontos (51-90 bpm)"
    ],
    "clinical_notes_pt": "FC 40-49 ou 100-109: alerta amarelo; <40 ou >=110: alerta vermelho."
  },
  {
    "id": "rr_bpm",
    "label_pt": "Frequência respiratória em repouso",
    "label_en": "Respiratory rate",
    "abbr_pt": ["FR"],
    "abbr_en": ["RR"],
    "age_group": "adulto >=18 anos, não gestante",
    "range_green": { "min": 12, "max": 20 },
    "unit": "irpm",
    "sources": [
      "Cleveland Clinic - Vital Signs (respiratory rate 12-18)",
      "NEWS2 - faixa 0 pontos (12-20)",
      "Guia de exame físico/OSCE (12-20)"
    ],
    "clinical_notes_pt": "9-11 ou 21-24: alerta amarelo; <=8 ou >=25: alerta vermelho (NEWS2)."
  },
  {
    "id": "sbp_mmHg",
    "label_pt": "Pressão arterial sistólica (consultório / repouso)",
    "label_en": "Systolic blood pressure",
    "abbr_pt": ["PAS"],
    "abbr_en": ["SBP"],
    "age_group": "adulto >=18 anos, não gestante",
    "range_green": { "min": 90, "max": 120 },
    "unit": "mmHg",
    "sources": [
      "Cleveland Clinic - Vital Signs (90/60 a 120/80)",
      "Diretrizes Brasileiras de HAS 2020 - classificação e BP ótima",
      "ACC/AHA 2017 - categorias de PA"
    ],
    "clinical_notes_pt": "SBP <90 = hipotensão; 121-129 = normal/elevada; 130-139 = pré-hipertensão (BR) / HAS estágio 1 (EUA)."
  },
  {
    "id": "dbp_mmHg",
    "label_pt": "Pressão arterial diastólica (consultório / repouso)",
    "label_en": "Diastolic blood pressure",
    "abbr_pt": ["PAD"],
    "abbr_en": ["DBP"],
    "age_group": "adulto >=18 anos, não gestante",
    "range_green": { "min": 60, "max": 80 },
    "unit": "mmHg",
    "sources": [
      "Cleveland Clinic - Vital Signs (90/60 a 120/80)",
      "Diretrizes Brasileiras de HAS 2020",
      "ACC/AHA 2017"
    ],
    "clinical_notes_pt": "DBP <60 = hipotensão relativa; 81-84 = normal alto (BR); 80-89 = HAS estágio 1 (EUA)."
  }
]
```

---

Se você quiser, na próxima rodada posso **expandir para pediatria** usando PALS + Diretrizes Brasileiras (e aquela tabela da sua imagem) e já desenhar o “semáforo” completo (verde/amarelo/vermelho) para cada faixa etária.

[1]: https://my.clevelandclinic.org/health/articles/10881-vital-signs "Vital Signs"
[2]: https://my.clevelandclinic.org/health/diagnostics/heart-rate?utm_source=chatgpt.com "Heart Rate: Normal Rates & What To Know"
[3]: https://medlineplus.gov/ency/article/001982.htm?utm_source=chatgpt.com "Body temperature norms: MedlinePlus Medical Encyclopedia"
[4]: https://www.rcp.ac.uk/media/alxev00t/news2-chart-1_the-news-scoring-system_0_0.pdf?utm_source=chatgpt.com "news2-chart-1_the-news-scoring-system_0_0.pdf"
[5]: https://www.scielo.br/j/abc/a/Z6m5gGNQCvrW3WLV7csqbqh/?lang=en "SciELO  Brasil - Diretrizes Brasileiras de Hipertensão Arterial – 2020 Diretrizes Brasileiras de Hipertensão Arterial – 2020 "
[6]: https://professional.heart.org/en/science-news/-/media/597477e610c64866bdde138e1729066d.ashx "Slide Set: 2017 ACC/AHA/AAPA/ABC/ACPM/AGS/ APhA/ASH/ASPC/NMA/PCNA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults"
[7]: https://www.ncbi.nlm.nih.gov/books/NBK602290/?utm_source=chatgpt.com "Details of each early warning score - NCBI - NIH"
[8]: https://geekymedics.com/basic-observations-vital-signs-osce/?utm_source=chatgpt.com "Measuring Basic Observations (Vital Signs) - OSCE Guide"
Vou direto ao ponto e focar em **pediatria**, como continuação do que já definimos para adultos.
A ideia é: esses valores viram o **“verde”** do semáforo; tudo fora disso o sistema marca como **alerta** (amarelo/vermelho).

---

## 1. Abreviações – PT-BR e EN

**Variáveis principais**

* **Temperatura**

  * PT-BR: Temperatura (geralmente axilar)
  * EN: Body temperature (BT, “T”)

* **Frequência cardíaca**

  * PT-BR: FC – Frequência Cardíaca
  * EN: HR – Heart Rate

* **Frequência respiratória**

  * PT-BR: FR – Frequência Respiratória (irpm)
  * EN: RR – Respiratory Rate (breaths/min)

* **Pressão arterial**

  * PT-BR: PA – Pressão Arterial
  * EN: BP – Blood Pressure

* **Pressão arterial sistólica**

  * PT-BR: PAS – Pressão Arterial Sistólica
  * EN: SBP – Systolic Blood Pressure

* **Pressão arterial diastólica**

  * PT-BR: PAD – Pressão Arterial Diastólica
  * EN: DBP – Diastolic Blood Pressure

(Adultos continuam com os limites que já combinamos: FC 60–100, FR 12–20, PA ~90–120/60–80 para 18–64 anos, etc.)

---

## 2. Temperatura – normalidade e diferença Brasil x EUA

### 2.1. Faixa “normal” para o app (crianças e adultos)

Para fins de alerta simples e unificado (axilar):

* **Normal (verde): 36,0 a 37,4 °C**
  – Coerente com faixas descritas em revisões sobre temperatura normal em crianças e adultos.

* **Febrícula / estado febril leve (amarelo): 37,5 a 37,9 °C (axilar)**
  – Muito usado na prática clínica, literatura geral e educação em saúde.

* **Febre (vermelho “simples” de laboratório/algoritmo):**

  * **Brasil – SBP (2025):** considera **febre ≥37,5 °C axilar** para fins de definição em estudos e classificação clínica, mas ressalta que isso *não* é automaticamente indicação de antitérmico ou de emergência.
  * **EUA / OMS / AAP:** ainda usam **febre ≥38,0 °C** (via oral/retal ou equivalente) como corte padrão.

* **Hipotermia clínica:** **T < 35,0 °C** (qualquer idade) – definição clássica de hipotermia.

* **Hiperpirexia / febre muito alta:** **T ≥ 40,5 °C** costuma ser usada como “febre muito alta” em pediatria, associada a maior risco e indicação de avaliação urgente.

👉 **Sugestão para o sistema:**

* Campo padrão: `temperatura_axilar`.
* **Normal:** 36,0–37,4 °C
* **Alerta amarelo:** 37,5–37,9 °C
* **Alerta vermelho:**

  * T ≥ 38,0 °C (compatível com EUA/OMS)
  * ou T ≥ 37,5 °C se você quiser aderir estritamente à definição da SBP.
  * T < 35,0 °C ou T ≥ 40,0–40,5 °C como “alerta crítico”.

---

## 3. Faixas **normais pediátricas** de FC, FR, PAS, PAD

### Fontes principais

* **PALS / AHA (Pediatric Advanced Life Support)** – tabela de sinais vitais por idade: FC (acordado), FR e PA (sistólica/diastólica).
* **Protocolos brasileiros de emergência pediátrica** que adotam as faixas de PALS (por exemplo: “Abordagem da Criança na Emergência”, 2023).
* Revisões de semiologia/exame físico pediátrico (e.g. materiais de semiologia pediátrica, cursos de enfermagem e pediatria do SUS).

Na prática, **Brasil x EUA**:

* Para **FC, FR, PAS, PAD** pediátricos, **não há divergência relevante** entre PALS (EUA) e protocolos brasileiros modernos – os serviços brasileiros simplesmente citam ou adaptam PALS/OMS.

### 3.1 Tabela – **Faixa de normalidade (“verde”)** no app

Usando categorias clínicas usuais e valores derivados de PALS + protocolos brasileiros:

| Faixa etária (PT-BR) | Age (EN)   | Idade aprox. | FC normal (bpm) | FR normal (irpm) | PAS normal (mmHg) | PAD normal (mmHg) |
| -------------------- | ---------- | ------------ | --------------- | ---------------- | ----------------- | ----------------- |
| Recém-nascido        | Neonate    | 0–28 dias    | 110–160         | 30–60            | 60–80             | 30–55             |
| Lactente             | Infant     | 1–12 meses   | 100–160         | 30–60            | 72–104            | 37–56             |
| Criança pequena      | Toddler    | 1–3 anos     | 90–150          | 24–40            | 86–112            | 42–72             |
| Pré-escolar          | Preschool  | 4–5 anos     | 80–140          | 22–34            | 89–112            | 46–72             |
| Escolar              | School-age | 6–12 anos    | 70–120          | 18–30            | 97–120            | 57–80             |
| Adolescente          | Adolescent | 13–18 anos   | 60–100          | 12–20            | 110–131           | 64–83             |

* **FC / FR:** faixas alinhadas a PALS e a tabelas brasileiras modernas que citam PALS como fonte (por exemplo, “Abordagem da Criança na Emergência”).
* **PAS / PAD:** aproximadas a partir da tabela de PALS (neonato, 1–12 meses, 1–2 anos, 3–5, 6–7, 10–12, 12–15) usando o menor e o maior valor de cada bloco para compor as categorias acima.

👉 **Regra de uso no app:**
Para preenchimento de perfil ou registro clínico, se o valor estiver **dentro da faixa da linha correspondente à idade**, você marca como **“normal (verde)”**.
Se estiver **fora**, já é pelo menos **alerta amarelo** (o que vocês podem representar como destaque de texto ou badge).

---

## 4. Limites de **hipotensão pediátrica** (alerta vermelho forte)

Aqui temos uma regra bem consolidada e idêntica em Brasil e EUA.

### 4.1 Regra PALS / AHA para hipotensão em crianças

**Definição de hipotensão (PAS) em pediatria, em repouso:**

* **Neonato a termo (0–28 dias):** PAS < **60 mmHg**
* **Lactente (1–12 meses):** PAS < **70 mmHg**
* **Crianças de 1 a 10 anos:**

  * **PAS < 70 + (2 × idade em anos)**

    * Ex.: 4 anos → 70 + 2×4 = 78 mmHg → hipotenso se PAS < 78
* **Crianças >10 anos / adolescentes:** PAS < **90 mmHg**

Esses mesmos cortes aparecem em:

* PALS (AHA)
* Protocolos brasileiros de choque/suporte avançado em emergência pediátrica
* Sites didáticos de pediatria e “Roteiros de Pediatria” que citam PALS.

👉 **Sugestão para o sistema:**

* Implementar essa regra como **“alerta vermelho” obrigatório** sempre que houver PAS abaixo do limite calculado para idade.
* Tudo que estiver **dentro da faixa normal da tabela** mas **próximo do limite inferior** pode ser apenas amarelo (a lógica de “zona de transição” vocês podem ajustar depois).

---

## 5. “Mapa” de variáveis para o time de programação

Abaixo um **exemplo de estrutura JSON** (pode virar schema no backend) com nomes internos, labels PT/EN, unidades e limites principais.
Os números em `age_bands` são exatamente os da tabela acima.

```json
{
  "temperature_axillary": {
    "label_pt": "Temperatura axilar",
    "label_en": "Axillary temperature",
    "unit": "°C",
    "normal_min": 36.0,
    "normal_max": 37.4,
    "fever_threshold_br": 37.5,
    "fever_threshold_international": 38.0,
    "hypothermia_threshold": 35.0,
    "hyperpyrexia_threshold": 40.5
  },
  "heart_rate": {
    "label_pt": "Frequência cardíaca",
    "label_en": "Heart rate",
    "abbr_pt": "FC",
    "abbr_en": "HR",
    "unit": "bpm",
    "age_bands": [
      {
        "pt": "Recém-nascido",
        "en": "Neonate",
        "age_range": "0–28 dias",
        "hr_min": 110,
        "hr_max": 160,
        "rr_min": 30,
        "rr_max": 60,
        "sbp_min": 60,
        "sbp_max": 80,
        "dbp_min": 30,
        "dbp_max": 55
      },
      {
        "pt": "Lactente",
        "en": "Infant",
        "age_range": "1–12 meses",
        "hr_min": 100,
        "hr_max": 160,
        "rr_min": 30,
        "rr_max": 60,
        "sbp_min": 72,
        "sbp_max": 104,
        "dbp_min": 37,
        "dbp_max": 56
      },
      {
        "pt": "Criança pequena",
        "en": "Toddler",
        "age_range": "1–3 anos",
        "hr_min": 90,
        "hr_max": 150,
        "rr_min": 24,
        "rr_max": 40,
        "sbp_min": 86,
        "sbp_max": 112,
        "dbp_min": 42,
        "dbp_max": 72
      },
      {
        "pt": "Pré-escolar",
        "en": "Preschool",
        "age_range": "4–5 anos",
        "hr_min": 80,
        "hr_max": 140,
        "rr_min": 22,
        "rr_max": 34,
        "sbp_min": 89,
        "sbp_max": 112,
        "dbp_min": 46,
        "dbp_max": 72
      },
      {
        "pt": "Escolar",
        "en": "School-age",
        "age_range": "6–12 anos",
        "hr_min": 70,
        "hr_max": 120,
        "rr_min": 18,
        "rr_max": 30,
        "sbp_min": 97,
        "sbp_max": 120,
        "dbp_min": 57,
        "dbp_max": 80
      },
      {
        "pt": "Adolescente",
        "en": "Adolescent",
        "age_range": "13–18 anos",
        "hr_min": 60,
        "hr_max": 100,
        "rr_min": 12,
        "rr_max": 20,
        "sbp_min": 110,
        "sbp_max": 131,
        "dbp_min": 64,
        "dbp_max": 83
      }
    ]
  },
  "respiratory_rate": {
    "label_pt": "Frequência respiratória",
    "label_en": "Respiratory rate",
    "abbr_pt": "FR",
    "abbr_en": "RR",
    "unit": "irpm",
    "age_bands_ref": "usar mesmos grupos etários da heart_rate (rr_min/rr_max da tabela)"
  },
  "systolic_bp": {
    "label_pt": "Pressão arterial sistólica",
    "label_en": "Systolic blood pressure",
    "abbr_pt": "PAS",
    "abbr_en": "SBP",
    "unit": "mmHg",
    "age_bands_ref": "usar sbp_min/sbp_max da tabela por faixa etária",
    "hypotension_rule_children_1_10y": "SBP < 70 + 2*idade_em_anos",
    "hypotension_neonate_term": "<60",
    "hypotension_infant_1_12m": "<70",
    "hypotension_child_over_10y": "<90"
  },
  "diastolic_bp": {
    "label_pt": "Pressão arterial diastólica",
    "label_en": "Diastolic blood pressure",
    "abbr_pt": "PAD",
    "abbr_en": "DBP",
    "unit": "mmHg",
    "age_bands_ref": "usar dbp_min/dbp_max da tabela por faixa etária"
  }
}
```

---

Se você quiser, no próximo passo eu posso:

* Unificar **adulto + pediatria** num único JSONzão pronto pra ir pro banco;
* E/ou desenhar o **semáforo completo (verde/amarelo/vermelho)** com regras mais finas (por ex. usar z-score de FC/FR por idade ou inspirar-se em PEWS).
