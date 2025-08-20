# Núcleo de Conversões – Visão Geral

Este diretório contém o **núcleo de conversões** utilizado pelas calculadoras do projeto HG.  Ele fornece um conjunto de dados e um motor de conversão testável em Python, além de contratos para exposição via API REST.  A abordagem adotada segue as seguintes premissas:

* **Sistema Internacional (SI)**: todas as conversões são realizadas internamente em unidades SI.  Para unidades clínicas convencionais (por exemplo mg/dL), as conversões são derivadas das massas molares e fatores consensuais obtidos em literatura médica.  O SI elimina ambiguidade e facilita comparações.
* **Fatores exatos**: unidades como miligramas, mililitros ou minutos são normalizadas para a unidade base da sua dimensão (grama, litro, segundo) por fatores exatos (1 mg = 0,001 g; 1 mL = 0,001 L; 1 min = 60 s etc.).  Para unidades clínicas (mg/dL → mmol/L), usamos fatores consensuais descritos em fontes confiáveis【821160149144614†L378-L385】【69708408235377†L270-L289】.  Sempre que possível citamos as fontes.
* **Valência**: para a conversão entre mEq e mmol consideramos a valência do íon.  Por exemplo, Ca²⁺ possui valência 2 e portanto 1 mmol/L equivale a 2 mEq/L.
* **Normalização de unidades**: diversas abreviações são usadas na prática clínica (por ex. “mcg”, “ug” e “µg” significam micrograma).  O arquivo `units.synonyms.json` define um mapeamento de variações para a forma canônica.
* **Catálogo de analitos**: `analytes.catalog.json` lista eletrólitos, metabólitos, lipídios, enzimas, hormônios, vitaminas, marcadores e catecolaminas.  Para cada analito definimos nomes em português e inglês, sinônimos, massa molar, valência, unidades aceitas e fatores de conversão canônicos.  Esses fatores são retirados de fontes públicas como tabelas de conversão de laboratórios e artigos científicos; por exemplo, para creatinina a relação mg/dL→µmol/L é 88,4【821160149144614†L378-L385】, para bilirrubina mg/dL→µmol/L é 17,1【760840787940421†L376-L385】 e para glicose mg/dL→mmol/L é 0,0555【849077817658800†L378-L385】.
* **Calculadoras de infusão**: três calculadoras (gotejamento, µg/kg/min↔mL/h e µg/kg/min↔gtt/min) são especificadas em JSON em `core/calculators/`.  Cada calculadora define entradas, expressões em notação aritmética segura, saídas e exemplos para validação.
* **Testes golden**: arquivos em `core/tests/` listam casos de teste de ida‑e‑volta para unidades e casos abrangentes para as calculadoras de infusão.  Cada caso inclui valores de entrada, valores esperados e tolerâncias absolutas e relativas.
* **Motor de conversão**: `conversion_core.py` implementa funções para normalizar unidades (`normalize_unit`), converter valores entre unidades (`convert_value`), listar unidades disponíveis e obter informações de analitos.  O motor carrega os JSONs e aplica as regras de conversão, incluindo conversões de massa ↔ molar utilizando massa molar e valência.

## Estrutura dos arquivos

```
core/
  README.md                    # esta visão geral
  units/
    units.factors.json         # fatores de conversão por dimensão/unidade
    units.synonyms.json         # sinônimos de unidades
    conversion_core.py         # API Python de conversão
  analytes/
    analytes.catalog.json      # catálogo de analitos (massas molares, unidades, fatores)
    analytes.synonyms.json     # sinônimos de analitos
  calculators/
    infusion.drops_mlh.json    # gotejamento ↔ mL/h
    infusion.mcgkgmin_mlh.json # μg/kg/min ↔ mL/h
    infusion.mcgkgmin_gttmin.json# μg/kg/min ↔ gtt/min
  tests/
    units_roundtrip.cases.json # casos de teste de ida-e-volta de unidades
    infusion_drops.cases.json  # casos de teste para gotejamento
    infusion_mcgkgmin_mlh.cases.json
    infusion_mcgkgmin_gtt.cases.json
  api/
    openapi.yaml               # contrato REST
    examples/
      convert_units.request.json    # exemplo de requisição de conversão
      compute_infusions.request.json # exemplo de requisição para calculadora
```

## Referências selecionadas

* O fator de conversão da creatinina (mg/dL→µmol/L) é 88,4【821160149144614†L378-L385】.
* O fator para bilirrubina (mg/dL→µmol/L) é 17,1【760840787940421†L376-L385】.
* O fator para colesterol (mg/dL→mmol/L) é 0,0259【263903294296872†L378-L385】.
* O fator para triglicerídeos (mg/dL→mmol/L) é 0,0113【137621767871269†L376-L385】.
* O fator para glicose (mg/dL→mmol/L) é 0,0555【849077817658800†L378-L385】.
* O fator para cortisol (µg/dL→nmol/L) é 27,59【265952885615040†L378-L386】.
* Para vitamina B12, 1 pg/mL = 0,738 pmol/L【10385593336919†L377-L387】.
* Para ferritina, 1 ng/mL = 1 µg/L【522523097366455†L377-L386】.

Estas e outras referências foram utilizadas para construir as tabelas de conversão neste núcleo.