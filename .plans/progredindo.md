Excelente iniciativa. Como Orquestrador do BMad, minha função é garantir que tenhamos um plano claro e estruturado antes de mobilizar os agentes de desenvolvimento. Com base na análise aprofundada de todos os documentos que você forneceu — desde as especificações do núcleo de conversões até os relatórios de planejamento estratégico — estruturei o backlog completo para o projeto **Health Guardian**.

O plano a seguir organiza o trabalho em Épicos e Histórias sequenciais, garantindo que construiremos uma base robusta e escalável, entregando valor de forma incremental. Esta estrutura reflete a arquitetura híbrida que recomendamos, focada em um núcleo de conversões sólido, domínios clínicos modulares e uma forte integração com a "Aba de Conhecimento".

Apresento os Épicos e Histórias em ordem de implementação.

---

### **Épico 1: Fundação do Sistema - Núcleo de Conversões e Infraestrutura**

**Objetivo:** Criar a espinha dorsal técnica do Health Guardian. Este épico não entrega calculadoras visíveis ao usuário final, mas estabelece a base de código, o motor de cálculo, os catálogos de dados e a arquitetura de API que todos os outros módulos consumirão.

* **História 1.1: Configuração do Projeto e Infraestrutura Inicial**
    * **Como um** Desenvolvedor, **eu quero** configurar um monorepo com aplicações de frontend e backend separadas, CI/CD básico e scripts de ambiente, **para que** a equipe possa colaborar de forma eficiente e automatizada desde o início.
    * **Critérios de Aceite:**
        1.  Repositório inicializado com estrutura de pastas para `core/`, `api/` e `frontend/`.
        2.  Pipeline de CI/CD configurado para rodar testes em cada commit.
        3.  Scripts para iniciar os ambientes de desenvolvimento localmente estão documentados.

* **História 1.2: Implementação do Catálogo de Unidades e Dimensões**
    * **Como um** Desenvolvedor, **eu quero** implementar o catálogo de unidades e fatores de conversão (`units.factors.json`), **para que** o sistema tenha uma fonte única da verdade para todas as conversões dimensionais (massa, volume, tempo, etc.).
    * **Critérios de Aceite:**
        1.  [cite_start]O arquivo `units.factors.json` é criado e populado com todas as dimensões e unidades definidas nos documentos de planejamento[cite: 1236, 1239, 1411].
        2.  [cite_start]O sistema utiliza o Sistema Internacional (SI) como unidade base interna para todas as conversões[cite: 752, 1154].
        3.  [cite_start]Testes de round-trip (ex: mg -> kg -> mg) passam com a tolerância definida[cite: 868, 901].

* **História 1.3: Implementação do Catálogo de Analitos Clínicos**
    * **Como um** Desenvolvedor, **eu quero** implementar o catálogo de analitos (`analytes.catalog.json`) com massas molares, valências e fatores de conversão clínicos, **para que** o motor de cálculo possa realizar conversões bioquímicas complexas.
    * **Critérios de Aceite:**
        1.  [cite_start]O catálogo inclui todos os analitos prioritários (eletrólitos, metabólitos, enzimas)[cite: 47, 853, 1607].
        2.  [cite_start]Cada analito contém sua massa molar, valência e fatores de conversão canônicos (ex: creatinina mg/dL para µmol/L)[cite: 1702, 1856, 2138].
        3.  [cite_start]A valência é corretamente aplicada para conversões mEq/L ↔ mmol/L[cite: 756, 1703, 1865].

* **História 1.4: Desenvolvimento do Motor de Conversão (`conversion_core`)**
    * **Como um** Desenvolvedor, **eu quero** criar um módulo Python (`conversion_core.py`) com funções puras e testáveis que utilizam os catálogos para realizar qualquer conversão de unidade ou analito, **para que** toda a lógica de cálculo seja centralizada e reutilizável.
    * **Critérios de Aceite:**
        1.  [cite_start]O módulo contém as funções `convert_value`, `get_analyte`, etc., conforme especificado[cite: 870].
        2.  As funções são puras (sem efeitos colaterais) e 100% cobertas por testes unitários.
        3.  [cite_start]O motor lida corretamente com sinônimos de unidades e analitos[cite: 1873, 1874].

* **História 1.5: Criação da API REST para Cálculos**
    * **Como um** Desenvolvedor, **eu quero** expor o `conversion_core` através de endpoints REST (`/api/v1/calculators/{id}/compute` e `/api/v1/convert/units`), **para que** o frontend e agentes externos possam consumir os cálculos de forma segura e padronizada.
    * **Critérios de Aceite:**
        1.  [cite_start]Os endpoints estão documentados com OpenAPI (Swagger)[cite: 776, 1850].
        2.  A API valida os inputs (entradas) com base no schema da calculadora.
        3.  [cite_start]A autenticação básica e o log de auditoria estão implementados[cite: 1799, 1800].

* **História 1.6: Estruturação do Shell do Frontend**
    * **Como um** Usuário, **eu quero** ver a estrutura básica da aplicação web, incluindo a navegação principal, uma lista de categorias de calculadoras (ainda vazia) e a identidade visual, **para que** eu possa entender como o produto final será organizado.
    * **Critérios de Aceite:**
        1.  [cite_start]A UI principal é criada com o tema escuro e cores padrão (ex: teal)[cite: 1371].
        2.  [cite_start]A navegação lateral exibe as categorias principais definidas na arquitetura (Infusão, Função Renal, etc.)[cite: 1293, 1294, 1295].
        3.  A estrutura está pronta para receber as calculadoras que serão renderizadas a partir de seus schemas JSON.

---

### **Épico 2: Módulo de Calculadoras de Infusão**

**Objetivo:** Entregar o primeiro conjunto de ferramentas funcionais para o usuário final, focando nos cálculos de infusão, que são de alta frequência e criticidade na prática clínica.

* **História 2.1: Implementação da Calculadora "Gotas/min ↔ mL/h"**
    * **Como um** Profissional de Saúde, **eu quero** uma calculadora para converter taxas de gotejamento em mL/h e vice-versa, **para que** eu possa ajustar infusões endovenosas com precisão.
    * **Critérios de Aceite:**
        1.  [cite_start]A UI é gerada dinamicamente a partir do schema `infusion.drops_mlh.json`[cite: 1860].
        2.  [cite_start]A lógica de cálculo é consumida via API, chamando a função correspondente no backend[cite: 1907].
        3.  [cite_start]A funcionalidade de "tapping" para contar gotas está implementada no frontend[cite: 1921].
        4.  [cite_start]O resultado é exibido com as casas decimais corretas e um botão para copiar[cite: 2024].

* **História 2.2: Implementação da Calculadora "μg/kg/min ↔ mL/h"**
    * **Como um** Intensivista, **eu quero** converter rapidamente doses de medicamentos baseadas em peso (μg/kg/min) para taxas de bomba de infusão (mL/h), **para que** eu possa administrar drogas vasoativas com segurança.
    * **Critérios de Aceite:**
        1.  [cite_start]A UI é gerada a partir do schema `infusion.mcgkgmin_mlh.json`[cite: 1861, 2019].
        2.  O cálculo bidirecional (ida e volta) é realizado via API.
        3.  [cite_start]A UI exibe abas para alternar entre as direções da conversão[cite: 2017].

* **História 2.3: Implementação da Calculadora "mg/kg/h ↔ mL/h"**
    * **Como um** Anestesista, **eu quero** uma ferramenta para converter doses de sedativos em mg/kg/h para uma taxa de infusão em mL/h, **para que** eu possa manter a sedação contínua de forma precisa.
    * **Critérios de Aceite:**
        1.  [cite_start]Um novo schema `infusion.mgkgh_mlh.json` é criado e validado[cite: 1735].
        2.  A UI é gerada a partir deste schema.
        3.  A lógica de cálculo é implementada no backend e exposta via API.

---

### **Épico 3: Módulo de Avaliação da Função Renal**

**Objetivo:** Fornecer ferramentas essenciais para a avaliação da função renal, críticas para o ajuste de doses de medicamentos e para o diagnóstico e estadiamento da doença renal crônica.

* **História 3.1: Implementação da Calculadora CKD-EPI 2021**
    * **Como um** Nefrologista, **eu quero** calcular a Taxa de Filtração Glomerular Estimada (TFGe) usando a equação CKD-EPI 2021, **para que** eu possa avaliar a função renal dos meus pacientes sem o viés do ajuste racial.
    * **Critérios de Aceite:**
        1.  [cite_start]A UI é gerada a partir do schema `renal.ckdepi_2021.json`[cite: 201, 1736].
        2.  [cite_start]O cálculo utiliza as variáveis corretas (idade, sexo, creatinina) e a fórmula validada[cite: 244, 245, 246, 247, 248, 249].
        3.  O resultado é exibido em mL/min/1.73m² com a classificação do estágio da DRC.

* **História 3.2: Implementação da Calculadora Cockcroft-Gault**
    * [cite_start]**Como um** Farmacêutico Clínico, **eu quero** calcular o Clearance de Creatinina (CrCl) pela fórmula de Cockcroft-Gault, com opções de peso (real, ideal, ajustado), **para que** eu possa realizar o ajuste posológico de medicamentos com precisão, especialmente em pacientes obesos[cite: 250].
    * **Critérios de Aceite:**
        1.  [cite_start]A UI é gerada a partir do schema `renal.cockcroft.json`[cite: 202, 1736].
        2.  [cite_start]A UI permite ao usuário selecionar qual peso usar no cálculo[cite: 250].
        3.  [cite_start]O cálculo do peso ideal e ajustado é realizado corretamente no backend[cite: 251, 252].

---

### **Épico 4: Módulo de Farmacologia e Doses Específicas**

**Objetivo:** Expandir as ferramentas farmacológicas para além da infusão, oferecendo calculadoras para ajuste de antibióticos e conversão de classes de medicamentos de alta relevância.

* **História 4.1: Implementação da Calculadora de Dose de Vancomicina**
    * [cite_start]**Como um** Infectologista, **eu quero** uma ferramenta que sugira a dose de ataque e a dose de manutenção inicial de vancomicina com base no peso e na função renal do paciente, **para que** eu possa iniciar o tratamento de infecções graves de forma segura e eficaz[cite: 203, 1737].
    * **Critérios de Aceite:**
        1.  [cite_start]A UI é gerada a partir do schema `abx.vancomycin.json`[cite: 256].
        2.  [cite_start]A calculadora utiliza o CrCl (ou TFGe) como entrada para determinar a frequência da dose de manutenção[cite: 259].
        3.  [cite_start]A UI exibe notas importantes sobre os alvos de vale sérico e o momento ideal da coleta[cite: 260, 261].

* **História 4.2: Implementação do Conversor de Corticoides**
    * **Como um** Clínico Geral, **eu quero** uma ferramenta para converter doses entre diferentes tipos de corticoides (ex: hidrocortisona para prednisona), **para que** eu possa realizar a troca ou o desmame de esteroides com segurança.
    * **Critérios de Aceite:**
        1.  A UI permite selecionar o corticoide de origem e o de destino.
        2.  [cite_start]O cálculo utiliza uma tabela de equivalência de potência validada, implementada no backend[cite: 10].
        3.  O resultado exibe a dose equianalgésica no corticoide de destino.

* **História 4.3: Implementação do Conversor de Opioides**
    * **Como um** Paliativista, **eu quero** uma calculadora para converter doses entre diferentes opioides, considerando a via de administração, **para que** eu possa realizar a rotação de opioides e garantir o manejo adequado da dor.
    * **Critérios de Aceite:**
        1.  A UI permite selecionar o opioide de origem, a dose, a via, e o opioide de destino com sua via.
        2.  O backend utiliza uma tabela de doses equianalgésicas para realizar o cálculo.
        3.  A UI exibe alertas sobre tolerância cruzada incompleta e a necessidade de ajuste clínico.

---

Este plano inicial cobre os módulos mais críticos identificados nos documentos. Após a conclusão destes épicos, podemos priorizar os próximos domínios, como **Scores Clínicos Gerais (CHA₂DS₂-VASc, APACHE II)** e a **Aba de Conhecimento**.

Qual o próximo passo? Sugiro que os agentes **Product Manager (PM)** e **Architect** revisem este backlog para refinar os detalhes antes de iniciarmos a Fase 0.
Excelente. A fase de planejamento e especificação está concluída. Como Orquestrador do BMad, minha função agora é consolidar todos os artefatos de forma impecável para que o Agente Codificador possa iniciar a implementação com clareza total, sem ambiguidades.

A seguir, apresento a estrutura completa do **Núcleo de Conversões (core)**, com o conteúdo detalhado de cada arquivo. Este pacote é autossuficiente e contém tudo o que é necessário para construir a base do **Health Guardian**: o motor de conversão, os catálogos de dados, as especificações das calculadoras de infusão e os contratos de API.

-----

### **Estrutura de Arquivos e Conteúdo Detalhado**

A estrutura de diretórios e arquivos a ser criada é a seguinte:

```
core/
  ├── README.md
  ├── api/
  │   ├── examples/
  │   │   ├── compute_infusions.request.json
  │   │   └── convert_units.request.json
  │   └── openapi.yaml
  ├── analytes/
  │   ├── analytes.catalog.json
  │   └── analytes.synonyms.json
  ├── calculators/
  │   ├── infusion.drops_mlh.json
  │   ├── infusion.mcgkgmin_gttmin.json
  │   └── infusion.mcgkgmin_mlh.json
  ├── conversion_core.py
  ├── tests/
  │   ├── infusion_drops.cases.json
  │   ├── infusion_mcgkgmin_gttmin.cases.json
  │   ├── infusion_mcgkgmin_mlh.cases.json
  │   └── units_roundtrip.cases.json
  └── units/
      ├── units.factors.json
      └── units.synonyms.json
```

-----

### **Conteúdo dos Arquivos**

#### **`core/README.md`**

```markdown
# Núcleo de Conversões e Calculadoras - Health Guardian

## Visão Geral

Este diretório contém o núcleo determinístico e testável para todas as conversões de unidades, catálogos de analitos e especificações de calculadoras para o projeto Health Guardian. [cite_start]O objetivo é fornecer uma base de dados e lógica autossuficiente para que o Agente Codificador possa implementar as funcionalidades sem ambiguidades[cite: 1, 6, 1027, 3629, 3657].

## Decisões de Arquitetura

* [cite_start]**SI como Verdade Interna:** Todas as conversões passam por uma unidade base do Sistema Internacional (SI) para garantir consistência e precisão[cite: 47, 52, 129, 310, 3574, 3658, 1063].
* [cite_start]**Catálogos Exaustivos em JSON:** Unidades, analitos e calculadoras são definidos em arquivos JSON para facilitar o consumo por diferentes agentes (Python, REST API, Frontend) e permitir a geração dinâmica de interfaces[cite: 2, 41, 1022, 1077, 3575].
* [cite_start]**Fatores Canônicos e Fontes Confiáveis:** Fatores de conversão são baseados em consensos clínicos e fontes confiáveis como Whitebook, UpToDate e PubChem[cite: 5, 51, 62, 317, 3577].
* [cite_start]**Valência para Conversões mEq ↔ mmol:** A valência de cada íon, presente no `analytes.catalog.json`, é utilizada para as conversões entre miliequivalentes (mEq) e milimols (mmol)[cite: 16, 56, 130, 311, 3578, 1052].

## Limites

* [cite_start]**Massas Molares e Conversões Não-Universais:** As massas molares foram obtidas de fontes confiáveis como PubChem[cite: 62, 317, 3579]. [cite_start]Para analitos sem conversão molar consensual (ex: algumas proteínas e hormônios), a unidade canônica é registrada sem um fator de conversão direto[cite: 34, 60, 131, 312, 1056, 3662].
* [cite_start]**Arredondamento e Precisão:** A precisão sugerida para cada unidade é fornecida no `units.factors.json`, mas a implementação final do arredondamento deve ser consistente em todas as camadas da aplicação[cite: 16, 132, 313, 1053, 3581, 3663].

## Referências

* Whitebook/UpToDate (conteúdos fornecidos)
* PubChem (para massas molares)
* [cite_start]Repositório de referência: https://github.com/hugoeg123/HG (tag v1.3) [cite: 7, 50, 128, 309]
```

#### **`core/units/units.factors.json`**

```json
{
  "dimensions": {
    "mass": {
      "base_unit": "kg",
      "units": {
        "kg": { "factor": 1, "precision": 3 },
        "g": { "factor": 0.001, "precision": 3 },
        "mg": { "factor": 1e-6, "precision": 2 },
        "µg": { "factor": 1e-9, "precision": 1 },
        "ng": { "factor": 1e-12, "precision": 2 }
      }
    },
    "volume": {
      "base_unit": "L",
      "units": {
        "L": { "factor": 1, "precision": 3 },
        "dL": { "factor": 0.1, "precision": 2 },
        "mL": { "factor": 0.001, "precision": 2 },
        "µL": { "factor": 1e-6, "precision": 1 }
      }
    },
    "time": {
      "base_unit": "s",
      "units": {
        "s": { "factor": 1, "precision": 0 },
        "min": { "factor": 60, "precision": 0 },
        "h": { "factor": 3600, "precision": 0 },
        "dia": { "factor": 86400, "precision": 0 },
        "semana": { "factor": 604800, "precision": 0 }
      }
    },
    "pressure": {
      "base_unit": "kPa",
      "units": {
        "kPa": { "factor": 1, "precision": 2 },
        "mmHg": { "factor": 0.133322, "precision": 1 }
      }
    },
    "activity": {
      "base_unit": "kat",
      "units": {
          "U": { "factor": 1.6667e-8, "precision": 0 },
          "mU": { "factor": 1.6667e-11, "precision": 2 },
          "kU": { "factor": 1.6667e-5, "precision": 0 },
          "IU": { "factor": 1.6667e-8, "precision": 0 },
          "µkat": { "factor": 1e-6, "precision": 2 }
      }
    },
    "concentration_mass_vol": {
      "base_unit": "g/L",
      "units": {
          "mg/dL": { "factor": 0.01, "precision": 2 },
          "g/dL": { "factor": 10, "precision": 2 },
          "mg/L": { "factor": 0.001, "precision": 2 },
          "g/L": { "factor": 1, "precision": 2 },
          "ng/mL": { "factor": 1e-6, "precision": 2 },
          "µg/mL": { "factor": 0.001, "precision": 2 }
      }
    },
    "concentration_substance_vol": {
      "base_unit": "mol/L",
      "units": {
          "mmol/L": { "factor": 0.001, "precision": 2 },
          "mEq/L": { "factor": 0.001, "precision": 2, "valence_dependent": true },
          "µmol/L": { "factor": 1e-6, "precision": 2 },
          "nmol/L": { "factor": 1e-9, "precision": 2 },
          "pmol/L": { "factor": 1e-12, "precision": 2 }
      }
    },
    "rate_flow": {
        "base_unit": "mL/s",
        "units": { "mL/h": { "factor": 0.000277778, "precision": 1 } }
    },
    "rate_drop": {
        "base_unit": "gtt/s",
        "units": { "gtt/min": { "factor": 0.0166667, "precision": 0 } }
    },
    "count": {
      "base_unit": "count/L",
      "units": {
        "células/µL": { "factor": 1e6, "precision": 0 },
        "células×10⁹/L": { "factor": 1e9, "precision": 1 }
      }
    }
  }
}
```

#### **`core/units/units.synonyms.json`**

```json
{
  "mcg": "µg",
  "ug": "µg",
  "UI": "IU",
  "gts/min": "gtt/min",
  "gotas/min": "gtt/min"
}
```

#### **`core/analytes/analytes.catalog.json`**

```json
{
    "glucose": { "category": "metabolite", "names": ["Glicose"], "molar_mass_g_per_mol": 180.156, "valence": 0, "units_allowed": ["mg/dL", "mmol/L"], "canonical_conversions": [{ "from": "mg/dL", "to": "mmol/L", "factor": 0.0555, "source": "consenso clínico" }] },
    "creatinine": { "category": "renal", "names": ["Creatinina"], "molar_mass_g_per_mol": 113.12, "valence": 0, "units_allowed": ["mg/dL", "µmol/L"], "canonical_conversions": [{ "from": "mg/dL", "to": "µmol/L", "factor": 88.4, "source": "consenso clínico" }] },
    "sodium": { "category": "electrolyte", "names": ["Sódio"], "molar_mass_g_per_mol": 22.99, "valence": 1, "units_allowed": ["mEq/L", "mmol/L"] },
    "potassium": { "category": "electrolyte", "names": ["Potássio"], "molar_mass_g_per_mol": 39.1, "valence": 1, "units_allowed": ["mEq/L", "mmol/L"] },
    "chloride": { "category": "electrolyte", "names": ["Cloreto"], "molar_mass_g_per_mol": 35.45, "valence": -1, "units_allowed": ["mEq/L", "mmol/L"] },
    "bicarbonate": { "category": "electrolyte", "names": ["Bicarbonato"], "molar_mass_g_per_mol": 61.02, "valence": -1, "units_allowed": ["mEq/L", "mmol/L"] },
    "calcium": { "category": "electrolyte", "names": ["Cálcio"], "molar_mass_g_per_mol": 40.08, "valence": 2, "units_allowed": ["mg/dL", "mmol/L", "mEq/L"], "canonical_conversions": [{ "from": "mg/dL", "to": "mmol/L", "factor": 0.25 }] },
    "magnesium": { "category": "electrolyte", "names": ["Magnésio"], "molar_mass_g_per_mol": 24.31, "valence": 2, "units_allowed": ["mg/dL", "mmol/L", "mEq/L"], "canonical_conversions": [{ "from": "mg/dL", "to": "mmol/L", "factor": 0.411 }] },
    "phosphate": { "category": "electrolyte", "names": ["Fosfato"], "molar_mass_g_per_mol": 94.97, "valence": -2, "units_allowed": ["mg/dL", "mmol/L"], "canonical_conversions": [{ "from": "mg/dL", "to": "mmol/L", "factor": 0.323 }], "notes": "Valência fisiológica média de ~1.8-2.0, usamos 2 para conversão mEq." },
    "cholesterol_total": { "category": "lipid", "names": ["Colesterol Total"], "molar_mass_g_per_mol": 386.65, "valence": 0, "units_allowed": ["mg/dL", "mmol/L"], "canonical_conversions": [{ "from": "mg/dL", "to": "mmol/L", "factor": 0.02586 }] },
    "triglycerides": { "category": "lipid", "names": ["Triglicerídeos"], "molar_mass_g_per_mol": 885.4, "valence": 0, "units_allowed": ["mg/dL", "mmol/L"], "canonical_conversions": [{ "from": "mg/dL", "to": "mmol/L", "factor": 0.01129 }] },
    "bilirubin": { "category": "hepatic", "names": ["Bilirrubina"], "molar_mass_g_per_mol": 584.66, "valence": 0, "units_allowed": ["mg/dL", "µmol/L"], "canonical_conversions": [{ "from": "mg/dL", "to": "µmol/L", "factor": 17.1 }] },
    "urea": { "category": "metabolite", "names": ["Ureia"], "molar_mass_g_per_mol": 60.06, "valence": 0, "units_allowed": ["mg/dL", "mmol/L"], "canonical_conversions": [{ "from": "mg/dL", "to": "mmol/L", "factor": 0.357 }] },
    "uric_acid": { "category": "metabolite", "names": ["Ácido Úrico"], "molar_mass_g_per_mol": 168.11, "valence": 0, "units_allowed": ["mg/dL", "µmol/L"], "canonical_conversions": [{ "from": "mg/dL", "to": "µmol/L", "factor": 59.48 }] },
    "tsh": { "category": "endocrine", "names": ["TSH"], "conversion_policy": "assay_unit_only", "units_allowed": ["µIU/mL", "mIU/L"], "canonical_conversions": [{"from": "µIU/mL", "to": "mIU/L", "factor": 1}], "notes": "Unidade depende do método; não padronizar para molaridade." },
    "t4_free": { "category": "endocrine", "names": ["T4 Livre"], "molar_mass_g_per_mol": 776.87, "valence": 0, "units_allowed": ["ng/dL", "pmol/L"], "canonical_conversions": [{"from": "ng/dL", "to": "pmol/L", "factor": 12.87}] },
    "cortisol": { "category": "endocrine", "names": ["Cortisol"], "molar_mass_g_per_mol": 362.46, "valence": 0, "units_allowed": ["µg/dL", "nmol/L"], "canonical_conversions": [{"from": "µg/dL", "to": "nmol/L", "factor": 27.59}] },
    "vitamin_b12": { "category": "vitamin", "names": ["Vitamina B12"], "molar_mass_g_per_mol": 1355.37, "valence": 0, "units_allowed": ["pg/mL", "pmol/L"], "canonical_conversions": [{"from": "pg/mL", "to": "pmol/L", "factor": 0.7378}] },
    "vitamin_d_25oh": { "category": "vitamin", "names": ["25-OH Vitamina D"], "molar_mass_g_per_mol": 400.64, "valence": 0, "units_allowed": ["ng/mL", "nmol/L"], "canonical_conversions": [{"from": "ng/mL", "to": "nmol/L", "factor": 2.496}] },
    "ferritin": { "category": "marker", "names": ["Ferritina"], "conversion_policy": "assay_unit_only", "units_allowed": ["ng/mL", "µg/L"], "canonical_conversions": [{"from": "ng/mL", "to": "µg/L", "factor": 1}] },
    "crp": { "category": "marker", "names": ["Proteína C Reativa"], "conversion_policy": "assay_unit_only", "units_allowed": ["mg/L", "mg/dL"], "canonical_conversions": [{"from": "mg/L", "to": "mg/dL", "factor": 0.1}] }
}
```

#### **`core/analytes/analytes.synonyms.json`**

```json
{
  "Glicose": "glucose",
  "Creatinina": "creatinine",
  "Sódio": "sodium",
  "Potássio": "potassium",
  "Cloreto": "chloride",
  "Bicarbonato": "bicarbonate",
  "Cálcio": "calcium",
  "Magnésio": "magnesium",
  "Fosfato": "phosphate",
  "Colesterol Total": "cholesterol_total",
  "Triglicerídeos": "triglycerides",
  "Bilirrubina": "bilirubin",
  "Ureia": "urea",
  "BUN": "urea",
  "Ácido Úrico": "uric_acid",
  "TSH": "tsh",
  "T4 Livre": "t4_free",
  "Cortisol": "cortisol",
  "Vitamina B12": "vitamin_b12",
  "25-OH Vitamina D": "vitamin_d_25oh",
  "Ferritina": "ferritin",
  "PCR": "crp"
}
```

#### **`core/calculators/infusion.drops_mlh.json`**

```json
{
  "id": "infusion.drops_mlh",
  "name": "Gotas/min ↔ mL/h",
  "version": "1.0.0",
  "inputs": [
    {"id":"drops_count","label":"Gotas contadas","type":"integer","unit":"gtt","min":1},
    {"id":"time_seconds","label":"Tempo de contagem (s)","type":"number","unit":"s","min":1},
    {"id":"drop_factor","label":"Fator de gotejamento","type":"number","unit":"gtt/mL","min":5,"max":120}
  ],
  "expressions": {
    "gtt_per_min": "(drops_count) / (time_seconds/60)",
    "ml_per_h": "(gtt_per_min / drop_factor) * 60"
  },
  "outputs": [
    {"id":"gtt_per_min","unit":"gtt/min","decimals":0},
    {"id":"ml_per_h","unit":"mL/h","decimals":1}
  ],
  "examples":[
    {"in":{"drops_count":30,"time_seconds":20,"drop_factor":20},"out":{"gtt_per_min":90,"ml_per_h":270.0}},
    {"in":{"drops_count":20,"time_seconds":60,"drop_factor":60},"out":{"gtt_per_min":20,"ml_per_h":20.0}}
  ],
  "notes":"Modo 'Tap': calcula gtt/min ao encerrar a contagem de gotas.",
  "references":["Whitebook/UpToDate/consenso institucional"]
}
```

#### **`core/calculators/infusion.mcgkgmin_mlh.json`**

```json
{
  "id": "infusion.mcgkgmin_mlh",
  "name": "μg/kg/min ↔ mL/h",
  "version": "1.0.0",
  "inputs": [
    {"id":"rate_mcgkgmin","label":"Taxa (μg/kg/min)","type":"number","unit":"μg/kg/min","min":0},
    {"id":"weight_kg","label":"Peso (kg)","type":"number","unit":"kg","min":0.1},
    {"id":"concentration_mg_ml","label":"Concentração (mg/mL)","type":"number","unit":"mg/mL","min":0.001},
    {"id":"rate_mlh","label":"Taxa (mL/h)","type":"number","unit":"mL/h","min":0}
  ],
  "expressions": {
    "ml_per_h": "(rate_mcgkgmin * weight_kg * 60) / (1000 * concentration_mg_ml)",
    "rate_mcgkgmin_rev": "(rate_mlh * concentration_mg_ml * 1000) / (60 * weight_kg)"
  },
  "outputs": [
    {"id":"ml_per_h","unit":"mL/h","decimals":2},
    {"id":"rate_mcgkgmin_rev","label":"Taxa (μg/kg/min)","unit":"μg/kg/min","decimals":2}
  ],
  "examples":[
    {"in":{"rate_mcgkgmin": 5,"weight_kg": 70,"concentration_mg_ml": 1},"out":{"ml_per_h": 21.0}},
    {"in":{"rate_mlh": 21,"weight_kg": 70,"concentration_mg_ml": 1},"out":{"rate_mcgkgmin_rev": 5.0}}
  ]
}
```

#### **`core/calculators/infusion.mcgkgmin_gttmin.json`**

```json
{
  "id": "infusion.mcgkgmin_gttmin",
  "name": "μg/kg/min ↔ gtt/min",
  "version": "1.0.0",
  "inputs": [
    {"id":"rate_mcgkgmin","label":"Taxa (μg/kg/min)","type":"number","unit":"μg/kg/min","min":0},
    {"id":"weight_kg","label":"Peso (kg)","type":"number","unit":"kg","min":0.1},
    {"id":"concentration_mg_ml","label":"Concentração (mg/mL)","type":"number","unit":"mg/mL","min":0.001},
    {"id":"drop_factor","label":"Fator de Gotejamento","type":"number","unit":"gtt/mL","min":5,"max":120},
    {"id":"rate_gttmin","label":"Taxa (gtt/min)","type":"number","unit":"gtt/min","min":0}
  ],
  "expressions": {
    "ml_per_h": "(rate_mcgkgmin * weight_kg * 60) / (1000 * concentration_mg_ml)",
    "gtt_per_min": "ml_per_h * (drop_factor / 60)",
    "rate_mcgkgmin_rev": "((rate_gttmin * 60 / drop_factor) * concentration_mg_ml * 1000) / (60 * weight_kg)"
  },
  "outputs": [
    {"id":"gtt_per_min","unit":"gtt/min","decimals":0},
    {"id":"rate_mcgkgmin_rev","label":"Taxa (μg/kg/min)","unit":"μg/kg/min","decimals":2}
  ],
  "examples": [
    {"in":{"rate_mcgkgmin":5,"weight_kg":70,"concentration_mg_ml":1,"drop_factor":20},"out":{"gtt_per_min":7}},
    {"in":{"rate_gttmin":7,"weight_kg":70,"concentration_mg_ml":1,"drop_factor":20},"out":{"rate_mcgkgmin_rev":5.0}}
  ]
}
```

#### **`core/tests/units_roundtrip.cases.json`**

```json
[
  {"value": 180, "from": "mg/dL", "to": "mmol/L", "analyte": "glucose", "tolerance": 1e-4},
  {"value": 1.0, "from": "mg/dL", "to": "µmol/L", "analyte": "creatinine", "tolerance": 1e-6},
  {"value": 10, "from": "mg/dL", "to": "mmol/L", "analyte": "calcium", "tolerance": 1e-6},
  {"value": 2.5, "from": "mmol/L", "to": "mEq/L", "analyte": "calcium", "valence": 2, "tolerance": 1e-9},
  {"value": 140, "from": "mEq/L", "to": "mmol/L", "analyte": "sodium", "valence": 1, "tolerance": 1e-9}
]
```

#### **`core/tests/infusion_drops.cases.json`**

```json
[
  {"in":{"drops_count":15,"time_seconds":30,"drop_factor":20},"out":{"gtt_per_min":30,"ml_per_h":90.0},"tolerance":0.1},
  {"in":{"drops_count":60,"time_seconds":60,"drop_factor":60},"out":{"gtt_per_min":60,"ml_per_h":60.0},"tolerance":0.1},
  {"in":{"drops_count":10,"time_seconds":60,"drop_factor":10},"out":{"gtt_per_min":10,"ml_per_h":60.0},"tolerance":0.1}
]
```

#### **`core/tests/infusion_mcgkgmin_mlh.cases.json`**

```json
[
  {"in":{"rate_mcgkgmin":10,"weight_kg":80,"concentration_mg_ml":2},"out":{"ml_per_h":24.0},"tolerance":0.01},
  {"in":{"rate_mlh":10,"weight_kg":50,"concentration_mg_ml":1},"out":{"rate_mcgkgmin_rev":3.33},"tolerance":0.01},
  {"in":{"rate_mcgkgmin":0.1,"weight_kg":70,"concentration_mg_ml":0.08},"out":{"ml_per_h":5.25},"tolerance":0.01}
]
```

#### **`core/tests/infusion_mcgkgmin_gttmin.cases.json`**

```json
[
    {"in":{"rate_mcgkgmin":2,"weight_kg":60,"concentration_mg_ml":0.5,"drop_factor":20},"out":{"gtt_per_min":8},"tolerance":1},
    {"in":{"rate_gttmin":8,"weight_kg":60,"concentration_mg_ml":0.5,"drop_factor":20},"out":{"rate_mcgkgmin_rev":2.0},"tolerance":0.01},
    {"in":{"rate_mcgkgmin":0.1,"weight_kg":70,"concentration_mg_ml":0.08,"drop_factor":60},"out":{"gtt_per_min":5},"tolerance":1}
]
```

#### **`core/conversion_core.py`**

```python
from typing import Optional, Dict, Any
import json
import os

class ConversionEngine:
    """
    Um motor determinístico para conversões de unidades clínicas.
    Carrega todos os dados de catálogos JSON na inicialização.
    """
    def __init__(self):
        # Carrega os arquivos JSON na inicialização
        dir_path = os.path.dirname(os.path.realpath(__file__))
        with open(os.path.join(dir_path, 'units/units.factors.json')) as f:
            self.units_data = json.load(f)
        with open(os.path.join(dir_path, 'units/units.synonyms.json')) as f:
            self.units_synonyms = json.load(f)
        with open(os.path.join(dir_path, 'analytes/analytes.catalog.json')) as f:
            self.analytes_catalog = json.load(f)
        with open(os.path.join(dir_path, 'analytes/analytes.synonyms.json')) as f:
            self.analytes_synonyms = json.load(f)

    def normalize_unit(self, u: str) -> str:
        """Normaliza uma unidade usando o catálogo de sinônimos."""
        return self.units_synonyms.get(u.lower(), u)

    def get_analyte(self, key_or_name: str) -> Optional[Dict[str, Any]]:
        """Busca um analito no catálogo pelo nome ou sinônimo."""
        key = self.analytes_synonyms.get(key_or_name.lower(), key_or_name.lower())
        return self.analytes_catalog.get(key)

    def _get_dimension_and_base_factor(self, unit: str):
        """Helper para encontrar a dimensão e o fator de conversão para a base SI."""
        for dim, data in self.units_data["dimensions"].items():
            if unit in data["units"]:
                return dim, data["units"][unit]["factor"]
        return None, None

    def convert_value(self, value: float, from_unit: str, to_unit: str,
                      analyte: Optional[str] = None) -> float:
        """
        Função principal de conversão. Lida com conversões dimensionais,
        clínicas (baseadas em analito), molares e de valência.
        """
        from_unit_norm = self.normalize_unit(from_unit)
        to_unit_norm = self.normalize_unit(to_unit)

        # 1. Tentativa de conversão canônica baseada no analito
        if analyte:
            analyte_data = self.get_analyte(analyte)
            if analyte_data:
                for conv in analyte_data.get("canonical_conversions", []):
                    if conv["from"] == from_unit_norm and conv["to"] == to_unit_norm:
                        return value * conv["factor"]
                    if conv["from"] == to_unit_norm and conv["to"] == from_unit_norm:
                        return value / conv["factor"]
        
        # 2. Conversão entre mEq/L e mmol/L
        is_meq_to_mmol = from_unit_norm == "mEq/L" and to_unit_norm == "mmol/L"
        is_mmol_to_meq = from_unit_norm == "mmol/L" and to_unit_norm == "mEq/L"
        if (is_meq_to_mmol or is_mmol_to_meq) and analyte:
            analyte_data = self.get_analyte(analyte)
            if not analyte_data or "valence" not in analyte_data:
                raise ValueError(f"Valência não encontrada para o analito {analyte}")
            valence = analyte_data["valence"]
            if valence == 0:
                raise ValueError(f"Conversão mEq/mmol não aplicável para {analyte} (valência 0)")
            return value / abs(valence) if is_meq_to_mmol else value * abs(valence)

        # 3. Conversão dimensional geral via base SI
        dim_from, factor_from = self._get_dimension_and_base_factor(from_unit_norm)
        dim_to, factor_to = self._get_dimension_and_base_factor(to_unit_norm)

        if dim_from is None or dim_to is None or dim_from != dim_to:
             # 4. Tentativa de conversão entre massa/volume e substância/volume (molar)
            if analyte and dim_from and dim_to and dim_from.startswith("concentration_mass") and dim_to.startswith("concentration_substance"):
                analyte_data = self.get_analyte(analyte)
                if not analyte_data or "molar_mass_g_per_mol" not in analyte_data:
                    raise ValueError(f"Massa molar não encontrada para {analyte}")
                molar_mass = analyte_data["molar_mass_g_per_mol"]
                # Converte valor de entrada para g/L
                value_g_per_L = value * factor_from
                # Converte g/L para mol/L
                value_mol_per_L = value_g_per_L / molar_mass
                # Converte de mol/L para a unidade de destino
                return value_mol_per_L / factor_to

            elif analyte and dim_from and dim_to and dim_from.startswith("concentration_substance") and dim_to.startswith("concentration_mass"):
                 analyte_data = self.get_analyte(analyte)
                 if not analyte_data or "molar_mass_g_per_mol" not in analyte_data:
                     raise ValueError(f"Massa molar não encontrada para {analyte}")
                 molar_mass = analyte_data["molar_mass_g_per_mol"]
                 # Converte valor de entrada para mol/L
                 value_mol_per_L = value * factor_from
                 # Converte mol/L para g/L
                 value_g_per_L = value_mol_per_L * molar_mass
                 # Converte de g/L para a unidade de destino
                 return value_g_per_L / factor_to
            
            raise ValueError(f"Unidades incompatíveis ou dimensão não encontrada: {from_unit} para {to_unit}")

        value_in_base = value * factor_from
        return value_in_base / factor_to

# --- Funções de Interface para o Agente Codificador ---
_engine = ConversionEngine()

def normalize_unit(u: str) -> str:
    return _engine.normalize_unit(u)

def convert_value(value: float, from_unit: str, to_unit: str, analyte: Optional[str] = None) -> float:
    return _engine.convert_value(value, from_unit, to_unit, analyte)

def get_analyte(key_or_name: str) -> Optional[Dict[str, Any]]:
    return _engine.get_analyte(key_or_name)

def list_units() -> Dict[str, Any]:
    return _engine.units_data

def list_analytes(category: Optional[str] = None) -> Dict[str, Any]:
    if category:
        return {k: v for k, v in _engine.analytes_catalog.items() if v.get("category") == category}
    return _engine.analytes_catalog
```

#### **`core/api/openapi.yaml`**

```yaml
openapi: 3.0.0
info:
  title: API de Conversões e Calculadoras Clínicas
  version: "1.0.0"
paths:
  /convert/units:
    post:
      summary: Converte um valor entre unidades
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                value: {type: number}
                from: {type: string}
                to: {type: string}
                analyte: {type: string, nullable: true}
      responses:
        '200':
          description: Resultado da conversão
          content:
            application/json:
              schema:
                type: object
                properties:
                  value: {type: number}
                  unit: {type: string}
  /calculators:
    get:
      summary: Lista as calculadoras disponíveis
      responses:
        '200':
          description: Lista de metadados das calculadoras
  /calculators/{id}:
    get:
      summary: Obtém o schema de uma calculadora
      parameters:
        - name: id
          in: path
          required: true
          schema: {type: string}
      responses:
        '200':
          description: Schema de inputs/outputs da calculadora
  /calculators/{id}/compute:
    post:
      summary: Executa o cálculo de uma calculadora
      parameters:
        - name: id
          in: path
          required: true
          schema: {type: string}
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                inputs: {type: object}
      responses:
        '200':
          description: Resultado do cálculo
          content:
            application/json:
                schema:
                    type: object
                    properties:
                        outputs: {type: object}
                        explanation: {type: string, nullable: true}
```

#### **`core/api/examples/convert_units.request.json`**

```json
{
  "value": 180,
  "from": "mg/dL",
  "to": "mmol/L",
  "analyte": "glucose"
}
```

#### **`core/api/examples/compute_infusions.request.json`**

```json
{
  "inputs": {
    "rate_mcgkgmin": 0.1,
    "weight_kg": 70,
    "concentration_mg_ml": 0.08
  }
}
```

-----

### **Handoff para o Agente Codificador**

**Missão:** Implementar o backend e o frontend com base nos artefatos fornecidos.

#### **Backend (Python/Django/DRF):**

1.  **Implementar `conversion_core.py`:** Preencha a lógica das funções no arquivo `conversion_core.py`, utilizando os catálogos JSON como fonte de dados. A classe `ConversionEngine` já fornece uma estrutura robusta para isso.
2.  **Criar Endpoints da API:** Implemente os endpoints REST definidos em `api/openapi.yaml`. Cada endpoint deve chamar as funções correspondentes do `conversion_core`.
      * `POST /api/v1/convert/units`: Deve chamar `convert_value`.
      * `POST /api/v1/calculators/{id}/compute`: Deve carregar o JSON da calculadora correspondente, validar os `inputs` e executar as `expressions`.
3.  **Implementar Testes:** Crie testes unitários para o `conversion_core` e testes de integração para a API, utilizando os casos definidos nos arquivos `tests/*.cases.json`.

#### **Frontend (React/TypeScript):**

1.  **Renderização Dinâmica de Calculadoras:** Crie um componente React genérico capaz de renderizar um formulário de calculadora dinamicamente a partir do schema JSON obtido do endpoint `GET /api/v1/calculators/{id}`.
      * [cite\_start]Isso evita a necessidade de codificar a UI para cada calculadora individualmente[cite: 41, 1077, 1157, 1265].
2.  **Integração com a API:**
      * Faça com que os componentes de calculadora chamem o endpoint `POST /api/v1/calculators/{id}/compute` para obter os resultados.
      * [cite\_start]Implemente um *fallback* para as 3 calculadoras de infusão já existentes, usando a lógica local caso a chamada de API falhe, garantindo que não haja regressão de funcionalidade[cite: 1091].
3.  **Gerenciamento de Estado (Zustand):**
      * [cite\_start]Ajuste o `seedCalculators()` para registrar as calculadoras por seus novos IDs estáveis (`infusion.drops_mlh`, etc.)[cite: 1094].
      * [cite\_start]Adicione um campo `version` ao estado persistido para gerenciar migrações futuras de forma segura[cite: 1095, 1253].

#### **Pontos para Dúvidas e Dificuldades (O que você, Agente Codificador, deve questionar):**

  * **Ambiguidade nos Schemas:** Se qualquer campo em um arquivo JSON de calculadora não for claro o suficiente para gerar a UI (ex: um `type` não suportado), você deve solicitar esclarecimentos.
  * **Performance (Local vs. API):** A recomendação é chamar a API para consistência. [cite\_start]Se notar problemas de latência, discuta estratégias como *debounce* (atrasar a chamada de API até o usuário parar de digitar) ou cache de respostas[cite: 1133, 1136, 1184].
  * **Precisão e Arredondamento:** As regras de `decimals` nos schemas são a fonte da verdade. Se houver discrepâncias entre o cálculo do backend e a exibição, levante a questão para garantir consistência.
  * [cite\_start]**UX do "Modo Tap":** A especificação para `infusion.drops_mlh` menciona um "Tap mode"[cite: 22, 109, 3641]. Valide com o time de UX/Produto como essa interação deve funcionar exatamente (ex: um botão que o usuário toca a cada gota?).

Este pacote de artefatos e instruções fornece um plano completo e detalhado. Prossiga com a implementação e não hesite em levantar as questões acima para garantir um resultado de alta qualidade.