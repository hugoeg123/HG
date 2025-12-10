Beleza, vamos unificar tudo num “dicionário de sinais vitais” e depois falar de z-score.

---

## 1. Mapa único de sinais vitais (pediatria + adulto)

### Estrutura pensada pro backend

* 1 objeto por tipo de sinal vital.
* Em FC/FR/PA, uma lista de **faixas etárias**, cada uma com limites “verdes” (normal de repouso).
* Tudo em português + inglês, com abreviações.

```json
{
  "temperature_axillary": {
    "id": "temperature_axillary",
    "label_pt": "Temperatura axilar",
    "label_en": "Axillary temperature",
    "abbr_pt": ["T", "Temp"],
    "abbr_en": ["Temp", "BT"],
    "unit": "°C",
    "normal_range": { "min": 36.0, "max": 37.4 },
    "fever_threshold_br": 37.5,
    "fever_threshold_international": 38.0,
    "hypothermia_threshold": 35.0,
    "hyperpyrexia_threshold": 40.5
  },

  "age_based_vitals": [
    {
      "id": "neonate",
      "age_range_pt": "0–28 dias",
      "age_range_en": "0–28 days",
      "label_pt": "Recém-nascido",
      "label_en": "Neonate",
      "hr": { "label_pt": "Frequência cardíaca", "label_en": "Heart rate", "abbr_pt": "FC", "abbr_en": "HR", "unit": "bpm", "min": 110, "max": 160 },
      "rr": { "label_pt": "Frequência respiratória", "label_en": "Respiratory rate", "abbr_pt": "FR", "abbr_en": "RR", "unit": "irpm", "min": 30, "max": 60 },
      "sbp": { "label_pt": "Pressão arterial sistólica", "label_en": "Systolic blood pressure", "abbr_pt": "PAS", "abbr_en": "SBP", "unit": "mmHg", "min": 60, "max": 80 },
      "dbp": { "label_pt": "Pressão arterial diastólica", "label_en": "Diastolic blood pressure", "abbr_pt": "PAD", "abbr_en": "DBP", "unit": "mmHg", "min": 30, "max": 55 }
    },
    {
      "id": "infant",
      "age_range_pt": "1–12 meses",
      "age_range_en": "1–12 months",
      "label_pt": "Lactente",
      "label_en": "Infant",
      "hr": { "min": 100, "max": 160 },
      "rr": { "min": 30, "max": 60 },
      "sbp": { "min": 72, "max": 104 },
      "dbp": { "min": 37, "max": 56 }
    },
    {
      "id": "toddler",
      "age_range_pt": "1–3 anos",
      "age_range_en": "1–3 years",
      "label_pt": "Criança pequena",
      "label_en": "Toddler",
      "hr": { "min": 90, "max": 150 },
      "rr": { "min": 24, "max": 40 },
      "sbp": { "min": 86, "max": 112 },
      "dbp": { "min": 42, "max": 72 }
    },
    {
      "id": "preschool",
      "age_range_pt": "4–5 anos",
      "age_range_en": "4–5 years",
      "label_pt": "Pré-escolar",
      "label_en": "Preschool",
      "hr": { "min": 80, "max": 140 },
      "rr": { "min": 22, "max": 34 },
      "sbp": { "min": 89, "max": 112 },
      "dbp": { "min": 46, "max": 72 }
    },
    {
      "id": "school_age",
      "age_range_pt": "6–12 anos",
      "age_range_en": "6–12 years",
      "label_pt": "Escolar",
      "label_en": "School-age child",
      "hr": { "min": 70, "max": 120 },
      "rr": { "min": 18, "max": 30 },
      "sbp": { "min": 97, "max": 120 },
      "dbp": { "min": 57, "max": 80 }
    },
    {
      "id": "adolescent",
      "age_range_pt": "13–17 anos",
      "age_range_en": "13–17 years",
      "label_pt": "Adolescente",
      "label_en": "Adolescent",
      "hr": { "min": 60, "max": 100 },
      "rr": { "min": 12, "max": 20 },
      "sbp": { "min": 110, "max": 131 },
      "dbp": { "min": 64, "max": 83 }
    },
    {
      "id": "adult",
      "age_range_pt": "≥18 anos",
      "age_range_en": "≥18 years",
      "label_pt": "Adulto",
      "label_en": "Adult",
      "hr": { "min": 50, "max": 99 },
      "rr": { "min": 12, "max": 20 },
      "sbp": { "min": 90, "max": 120 },
      "dbp": { "min": 60, "max": 80 }
    }
  ],

  "pediatric_hypotension_rules": {
    "neonate_term_sbp_crit": "<60",
    "infant_1_12m_sbp_crit": "<70",
    "child_1_10y_sbp_crit": "SBP < 70 + 2 * idade_anos",
    "child_over_10y_sbp_crit": "<90"
  }
}
```

Essas faixas “verdes” vêm de:

* **PALS/AHA** e outras tabelas de emergência para FC/FR/PAS pediátricas.([rch.org.au][1])
* **Hipotensão pediátrica**: mesma regra em PALS/AHA e protocolos brasileiros (“PAS <60, <70, <70+2×idade, <90”).([rch.org.au][1])
* **Adulto**: Cleveland Clinic/MedlinePlus para PA 90/60–120/80, FC 60–100, FR 12–20; NEWS2 para refinar a faixa neutra (51–90 bpm).

No app, o fluxo básico seria:

1. Calcular idade.
2. Descobrir o `age_based_vitals[id]` que se aplica.
3. Ver se o valor informado cai em `min–max`; se não, pintar amarelo/vermelho conforme lógica de severidade (por ex. usar as regras de hipotensão como vermelho).

---

## 2. Como usar **z-score** nos sinais vitais

### 2.1. Conceito rápido

Z-score é:

[
z = \frac{\text{valor medido} - \mu(\text{idade})}{\sigma(\text{idade})}
]

* **μ(idade)** = média (ou mediana) do sinal vital para aquela idade num grande estudo de referência.
* **σ(idade)** = desvio-padrão para aquela idade.

Assim você transforma FC, FR, PA em um **eixo comum**: “quantos desvios-padrão acima/abaixo do esperado para a idade”.

Exemplo (caricatural):

* Criança de 2 anos, FC medida = 160 bpm.
* Estudo de referência diz μ≈113, σ≈15 para essa idade.([PMC][2])
* z ≈ (160−113)/15 ≈ +3,1 → muito acima (≈99,8 percentil).

### 2.2. De onde vêm μ e σ?

Pra ser sério, você **não inventa** μ e σ: você pega de curvas de referência:

* **Crianças – FC/FR:** Fleming 2011 (Lancet) e derivados, que compilaram >140 mil medidas de FC e ~4 mil de FR de crianças saudáveis e geraram curvas de centis (1º–99º) por idade.([PMC][2])
* Outros trabalhos (Sepanski 2018, Herbert 2020) constroem percentis e z-scores a partir de grandes bancos hospitalares.([Frontiers][3])
* **PA pediátrica:** tabelas do *Fourth Report*/NHLBI e da diretriz AAP 2017, que dão médias/SD e permitem calcular z-scores e percentis de PAS/PAD por sexo, idade e altura.([NHLBI, NIH][4])

Na prática técnica:

1. Você escolhe uma fonte (ex.: Fleming para FC/FR; AAP 2017 para PA).
2. Extrai de lá, para cada idade (ou faixa estreita de idade), o par (μ, σ) ou as curvas de percentil.
3. Guarda isso num arquivo (CSV/JSON) que o backend consegue consultar.
4. Sempre que entra um sinal vital, calcula o z correspondente.

### 2.3. Como usar z-score no HG

Uma forma simples:

* **|z| < 1** ≈ entre 16º e 84º percentil → “bem dentro do esperado” (verde).
* **1 ≤ |z| < 2** ≈ 84º–97º → “fora da faixa, mas moderado” (amarelo).
* **|z| ≥ 2** ≈ ≥97º ou ≤3º → “muito fora” (vermelho).

Isso pode virar:

* Pontos num **PEWS/NEWS pediátrico** interno (0, 1, 2 pontos conforme z).
* Um “badge” no app: “FC 160 (z=+3,1) – taquicardia importante para a idade”.

Você também pode combinar vários z-scores num modelo de risco (p. ex., regressão logística ou rede neural que recebe z(HR), z(RR), z(PA), etc.) – vários trabalhos de predição de deterioração criticam usar apenas cortes fixos e usam z-scores por idade.([Frontiers][3])

### 2.4. Quão acurado é isso na prática?

**Pontos fortes**

* As curvas de FC/FR tipo Fleming usam **dados enormes** (143 mil HR, quase 4 mil RR) e produzem centis contínuos por idade – estatística muito mais sólida do que as “tabelas de bolso” clássicas.([PMC][2])
* Estudos posteriores mostram que **RR ajustada pela idade (z-score)** é um bom preditor de gravidade em doenças respiratórias e influenza.([PLOS][5])
* Para **PA pediátrica**, as tabelas AAP/“Fourth Report” são o padrão-ouro mundial para definir quem está no 90º, 95º percentil etc.([PubMed][6])

**Limitações**

1. **Distribuição não é perfeitamente normal.**

   * RR especialmente é assimétrica (cauda direita comprida). Alguns estudos mostram forte curtose e skewness; o próprio Sepanski comenta isso.([Frontiers][3])
   * Então o “z=2” nem sempre corresponde exatamente ao 97,5º percentil; é uma aproximação.

2. **Contexto importa muito.**

   * Criança febril, chorando ou recém-medicada é muito diferente do “criança saudável em repouso” das curvas de referência.
   * Trabalhos com centis lembram que são mais úteis para acompanhar **tendência ao longo do tempo** do que para definir com precisão binária “doente vs saudável” com uma medida isolada.([MDPI][7])

3. **População de referência ≠ sua população.**

   * A maioria dos grandes estudos é de EUA/Europa. Pode haver diferenças pequenas de etnia/ambiente, mas em geral o consenso é que não vale a pena complicar demais com curvas específicas por etnia.([eprints.whiterose.ac.uk][8])

4. **Erro de medida e artefatos.**

   * Paquimetria de PA, oximetro mal posicionado, monitor pegando RR de tremor, etc.
   * O z-score vai só “quantificar o erro” se a medida estiver ruim.

**Resumo honesto**

* Como medida **contínua de quão anormal está o sinal vital em relação à idade**, o z-score é **muito melhor** do que só dizer “acima de X é taquicardia”.
* Para **triagem individual**, sozinho ele é **moderadamente acurado**: ajuda, mas não substitui julgamento clínico nem scores completos (PEWS, qSOFA, etc.).
* O ideal é você **calibrar**: rodar o z-score em cima do seu próprio dataset (HG/BR-MIMIC), ver qual z se associa com internação, UTI, óbito, e ajustar os thresholds.

---

Se você quiser, no próximo passo eu posso:

* Esboçar um **schema SQL/JSON** pra guardar as curvas (μ, σ, centis) por idade;
* E te dar um pseudocódigo de função `calculate_vital_zscore(vital, age, sex, height, value)` pra já plugar no backend do MEDNOTES/Health Guardian.

[1]: https://www.rch.org.au/clinicalguide/guideline_index/normal_ranges_for_physiological_variables/?utm_source=chatgpt.com "Acceptable ranges for physiological variables"
[2]: https://pmc.ncbi.nlm.nih.gov/articles/PMC3789232/?utm_source=chatgpt.com "Normal ranges of heart rate and respiratory rate in children ..."
[3]: https://www.frontiersin.org/journals/pediatrics/articles/10.3389/fped.2018.00066/full?utm_source=chatgpt.com "Pediatric Vital Sign Distribution Derived From a Multi- ..."
[4]: https://www.nhlbi.nih.gov/files/docs/guidelines/child_tbl.pdf?utm_source=chatgpt.com "Blood Pressure Levels for Boys by Age and Height Percentile"
[5]: https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0272029&utm_source=chatgpt.com "Vital sign predictors of severe influenza among children in an ..."
[6]: https://pubmed.ncbi.nlm.nih.gov/15286277/?utm_source=chatgpt.com "The fourth report on the diagnosis, evaluation, and ..."
[7]: https://www.mdpi.com/2227-9067/7/10/160?utm_source=chatgpt.com "Normal Percentiles for Respiratory Rate in Children ..."
[8]: https://eprints.whiterose.ac.uk/id/eprint/87524/3/Defining%2520normal%2520heart%2520and%2520respiratory%2520rates%2520in%2520children_v2%5B1%5D.pdf?utm_source=chatgpt.com "Defining normal heart and respiratory rates in children"
