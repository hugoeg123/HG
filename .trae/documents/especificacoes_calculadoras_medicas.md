# Especificações Detalhadas das Calculadoras Médicas

## 1. Visão Geral

Este documento detalha todas as 50+ calculadoras médicas que serão implementadas no sistema expandido, organizadas por domínio clínico. Cada calculadora inclui validação médica rigorosa, fórmulas precisas, interpretações clínicas e referências bibliográficas.

## 2. Calculadoras Antropométricas

### 2.1 Índice de Massa Corporal (IMC)

**Identificação**:
- ID: `bmi`
- Nome: "Índice de Massa Corporal"
- Domínio: `antropometria`
- Tipo: `prebuilt`

**Entradas**:
```json
{
  "peso": {
    "symbol": "weight_kg",
    "type": "number",
    "unit": "kg",
    "description": "Peso corporal em quilogramas",
    "validation": {
      "min": 1,
      "max": 500,
      "precision": 1
    }
  },
  "altura": {
    "symbol": "height_m",
    "type": "number",
    "unit": "m",
    "description": "Altura em metros",
    "validation": {
      "min": 0.3,
      "max": 3.0,
      "precision": 2
    }
  }
}
```

**Fórmula**: `IMC = peso ÷ altura²`

**Saída**:
```json
{
  "imc": {
    "unit": "kg/m²",
    "precision": 1,
    "interpretation": {
      "<16.0": {"label": "Magreza grave", "color": "red"},
      "16.0-16.9": {"label": "Magreza moderada", "color": "yellow"},
      "17.0-18.4": {"label": "Magreza leve", "color": "yellow"},
      "18.5-24.9": {"label": "Peso normal", "color": "green"},
      "25.0-29.9": {"label": "Sobrepeso", "color": "yellow"},
      "30.0-34.9": {"label": "Obesidade grau I", "color": "red"},
      "35.0-39.9": {"label": "Obesidade grau II", "color": "red"},
      "≥40.0": {"label": "Obesidade grau III", "color": "red"}
    }
  }
}
```

**Validação Médica**:
- Aplicável para adultos (≥18 anos)
- Limitações em atletas (massa muscular elevada)
- Não aplicável em gestantes
- Considerações especiais para idosos

**Referências**:
- WHO. Obesity: preventing and managing the global epidemic. Geneva: WHO; 2000.
- Keys A, et al. Indices of relative weight and obesity. J Chronic Dis. 1972;25(6):329-43.

### 2.2 Área de Superfície Corporal - Mosteller

**Identificação**:
- ID: `bsa_mosteller`
- Nome: "Área de Superfície Corporal (Mosteller)"
- Domínio: `antropometria`
- Tipo: `prebuilt`

**Entradas**:
```json
{
  "altura": {
    "symbol": "height_cm",
    "type": "number",
    "unit": "cm",
    "description": "Altura em centímetros",
    "validation": {"min": 30, "max": 300}
  },
  "peso": {
    "symbol": "weight_kg",
    "type": "number",
    "unit": "kg",
    "description": "Peso em quilogramas",
    "validation": {"min": 1, "max": 500}
  }
}
```

**Fórmula**: `BSA = √((altura × peso) ÷ 3600)`

**Saída**:
```json
{
  "bsa": {
    "unit": "m²",
    "precision": 2,
    "interpretation": {
      "<1.0": {"label": "Superfície corporal pequena", "color": "blue"},
      "1.0-2.5": {"label": "Superfície corporal normal", "color": "green"},
      ">2.5": {"label": "Superfície corporal grande", "color": "blue"}
    }
  }
}
```

**Validação Médica**:
- Padrão para dosagem de quimioterápicos
- Mais precisa que DuBois para adultos
- Aplicável em todas as idades

**Referências**:
- Mosteller RD. Simplified calculation of body-surface area. N Engl J Med. 1987;317(17):1098.

### 2.3 Área de Superfície Corporal - DuBois

**Identificação**:
- ID: `bsa_dubois`
- Nome: "Área de Superfície Corporal (DuBois)"
- Domínio: `antropometria`
- Tipo: `dynamic`

**Fórmula**: `BSA = 0.20247 × altura^0.725 × peso^0.425`

**Validação Médica**:
- Fórmula histórica, menos usada atualmente
- Boa para comparação com Mosteller

**Referências**:
- DuBois D, DuBois EF. A formula to estimate the approximate surface area. Arch Intern Med. 1916;17(6_2):863-71.

### 2.4 Peso Corporal Ideal - Devine

**Identificação**:
- ID: `ideal_body_weight`
- Nome: "Peso Corporal Ideal (Devine)"
- Domínio: `antropometria`
- Tipo: `prebuilt`

**Entradas**:
```json
{
  "altura": {
    "symbol": "height_cm",
    "type": "number",
    "unit": "cm",
    "validation": {"min": 100, "max": 250}
  },
  "sexo": {
    "symbol": "sex",
    "type": "select",
    "options": ["masculino", "feminino"]
  }
}
```

**Fórmulas**:
- Masculino: `IBW = 50 + 0.9 × (altura - 152)`
- Feminino: `IBW = 45.5 + 0.9 × (altura - 152)`

**Validação Médica**:
- Base para dosagem de medicamentos
- Aplicável para altura ≥152 cm
- Limitações em extremos de altura

**Referências**:
- Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974;8:650-5.

### 2.5 Peso Corporal Magro - Hume

**Identificação**:
- ID: `lean_body_weight`
- Nome: "Peso Corporal Magro (Hume)"
- Domínio: `antropometria`
- Tipo: `dynamic`

**Fórmulas**:
- Masculino: `LBW = 0.3281 × peso + 0.33929 × altura - 29.5336`
- Feminino: `LBW = 0.29569 × peso + 0.41813 × altura - 43.2933`

**Validação Médica**:
- Útil para farmacocinética de drogas hidrofílicas
- Aplicável em adultos

**Referências**:
- Hume R. Prediction of lean body mass from height and weight. J Clin Pathol. 1966;19(4):389-91.

### 2.6 Peso Corporal Ajustado

**Identificação**:
- ID: `adjusted_body_weight`
- Nome: "Peso Corporal Ajustado"
- Domínio: `antropometria`
- Tipo: `dynamic`

**Fórmula**: `AjBW = IBW + 0.4 × (peso_atual - IBW)`

**Validação Médica**:
- Específico para pacientes obesos (IMC ≥30)
- Usado para dosagem de aminoglicosídeos
- Requer cálculo prévio do peso ideal

**Referências**:
- Traynor AM, et al. Aminoglycoside dosing weight correction factors. Drug Intell Clin Pharm. 1995;29(12):1129-34.

## 3. Calculadoras de Função Renal

### 3.1 Clearance de Creatinina - Cockcroft-Gault

**Identificação**:
- ID: `cockcroft_gault`
- Nome: "Clearance de Creatinina (Cockcroft-Gault)"
- Domínio: `renal`
- Tipo: `prebuilt`

**Entradas**:
```json
{
  "idade": {
    "symbol": "age_years",
    "type": "number",
    "unit": "anos",
    "validation": {"min": 18, "max": 120}
  },
  "peso": {
    "symbol": "weight_kg",
    "type": "number",
    "unit": "kg",
    "validation": {"min": 20, "max": 300}
  },
  "creatinina": {
    "symbol": "creatinine_mg_dl",
    "type": "number",
    "unit": "mg/dL",
    "validation": {"min": 0.1, "max": 20}
  },
  "sexo": {
    "symbol": "sex",
    "type": "select",
    "options": ["masculino", "feminino"]
  }
}
```

**Fórmula**: `CrCl = [(140 - idade) × peso] ÷ (72 × creatinina) × 0.85 (se feminino)`

**Saída**:
```json
{
  "clearance": {
    "unit": "mL/min",
    "precision": 1,
    "interpretation": {
      "≥90": {"label": "Função renal normal", "color": "green"},
      "60-89": {"label": "Disfunção renal leve", "color": "yellow"},
      "30-59": {"label": "Disfunção renal moderada", "color": "yellow"},
      "15-29": {"label": "Disfunção renal severa", "color": "red"},
      "<15": {"label": "Falência renal", "color": "red"}
    }
  }
}
```

**Validação Médica**:
- Padrão para ajuste de doses renais
- Superestima função em obesos
- Menos precisa em idosos
- Usar peso ideal se IMC >30

**Referências**:
- Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41.

### 3.2 Taxa de Filtração Glomerular - CKD-EPI 2021

**Identificação**:
- ID: `ckd_epi_2021`
- Nome: "TFG CKD-EPI 2021 (sem correção racial)"
- Domínio: `renal`
- Tipo: `prebuilt`

**Entradas**:
```json
{
  "creatinina": {
    "symbol": "creatinine_mg_dl",
    "type": "number",
    "unit": "mg/dL",
    "validation": {"min": 0.1, "max": 20}
  },
  "idade": {
    "symbol": "age_years",
    "type": "number",
    "unit": "anos",
    "validation": {"min": 18, "max": 120}
  },
  "sexo": {
    "symbol": "sex",
    "type": "select",
    "options": ["masculino", "feminino"]
  }
}
```

**Fórmulas**:
- Feminino: `TFG = 142 × min(Cr/0.7, 1)^(-0.241) × max(Cr/0.7, 1)^(-1.200) × 0.9938^idade`
- Masculino: `TFG = 142 × min(Cr/0.9, 1)^(-0.302) × max(Cr/0.9, 1)^(-1.200) × 0.9938^idade`

**Saída**:
```json
{
  "tfg": {
    "unit": "mL/min/1.73m²",
    "precision": 0,
    "interpretation": {
      "≥90": {"label": "G1 - Normal ou elevada", "color": "green"},
      "60-89": {"label": "G2 - Levemente diminuída", "color": "yellow"},
      "45-59": {"label": "G3a - Moderadamente diminuída", "color": "yellow"},
      "30-44": {"label": "G3b - Moderada a severamente diminuída", "color": "red"},
      "15-29": {"label": "G4 - Severamente diminuída", "color": "red"},
      "<15": {"label": "G5 - Falência renal", "color": "red"}
    }
  }
}
```

**Validação Médica**:
- Padrão atual para classificação de DRC
- Remove correção racial controversa
- Mais precisa que Cockcroft-Gault
- Reportar como ">60" se >60 e sem outros sinais de DRC

**Referências**:
- Inker LA, et al. New Creatinine- and Cystatin C-Based Equations to Estimate GFR without Race. N Engl J Med. 2021;385(19):1737-49.

### 3.3 Clearance de Creatinina Medido

**Identificação**:
- ID: `measured_creatinine_clearance`
- Nome: "Clearance de Creatinina Medido"
- Domínio: `renal`
- Tipo: `dynamic`

**Entradas**:
```json
{
  "volume_urinario": {
    "symbol": "urine_volume_ml",
    "type": "number",
    "unit": "mL",
    "validation": {"min": 100, "max": 5000}
  },
  "tempo_coleta": {
    "symbol": "collection_time_min",
    "type": "number",
    "unit": "minutos",
    "validation": {"min": 60, "max": 1440}
  },
  "creatinina_urinaria": {
    "symbol": "urine_creatinine_mg_dl",
    "type": "number",
    "unit": "mg/dL",
    "validation": {"min": 1, "max": 500}
  },
  "creatinina_serica": {
    "symbol": "serum_creatinine_mg_dl",
    "type": "number",
    "unit": "mg/dL",
    "validation": {"min": 0.1, "max": 20}
  }
}
```

**Fórmula**: `CrCl = (Cr_urina × volume) ÷ (Cr_sérica × tempo)`

**Validação Médica**:
- Padrão-ouro para função renal
- Requer coleta urinária completa
- Normalizar para 1.73m² se necessário

**Referências**:
- Levey AS, et al. A more accurate method to estimate glomerular filtration rate. Ann Intern Med. 2009;130(6):461-70.

### 3.4 Fração de Excreção de Sódio (FeNa)

**Identificação**:
- ID: `fractional_excretion_sodium`
- Nome: "Fração de Excreção de Sódio"
- Domínio: `renal`
- Tipo: `prebuilt`

**Entradas**:
```json
{
  "sodio_urinario": {
    "symbol": "urine_sodium_meq_l",
    "type": "number",
    "unit": "mEq/L",
    "validation": {"min": 1, "max": 300}
  },
  "sodio_serico": {
    "symbol": "serum_sodium_meq_l",
    "type": "number",
    "unit": "mEq/L",
    "validation": {"min": 120, "max": 160}
  },
  "creatinina_urinaria": {
    "symbol": "urine_creatinine_mg_dl",
    "type": "number",
    "unit": "mg/dL",
    "validation": {"min": 1, "max": 500}
  },
  "creatinina_serica": {
    "symbol": "serum_creatinine_mg_dl",
    "type": "number",
    "unit": "mg/dL",
    "validation": {"min": 0.1, "max": 20}
  }
}
```

**Fórmula**: `FeNa = [(Na_urina × Cr_sérica) ÷ (Na_sérica × Cr_urina)] × 100`

**Saída**:
```json
{
  "fena": {
    "unit": "%",
    "precision": 2,
    "interpretation": {
      "<1": {"label": "IRA pré-renal", "color": "blue"},
      "1-2": {"label": "Zona intermediária", "color": "yellow"},
      ">2": {"label": "IRA intrínseca", "color": "red"}
    }
  }
}
```

**Validação Médica**:
- Diferencia IRA pré-renal de intrínseca
- Menos útil se usando diuréticos
- Coletar antes de diuréticos se possível

**Referências**:
- Espinel CH. The FENa test. Use in the differential diagnosis of acute renal failure. JAMA. 1976;236(6):579-81.

### 3.5 Fração de Excreção de Ureia (FeUrea)

**Identificação**:
- ID: `fractional_excretion_urea`
- Nome: "Fração de Excreção de Ureia"
- Domínio: `renal`
- Tipo: `dynamic`

**Fórmula**: `FeUrea = [(Ureia_urina × Cr_sérica) ÷ (Ureia_sérica × Cr_urina)] × 100`

**Saída**:
```json
{
  "feurea": {
    "unit": "%",
    "precision": 1,
    "interpretation": {
      "<35": {"label": "IRA pré-renal", "color": "blue"},
      "35-50": {"label": "Zona intermediária", "color": "yellow"},
      ">50": {"label": "IRA intrínseca", "color": "red"}
    }
  }
}
```

**Validação Médica**:
- Útil quando paciente usa diuréticos
- Mais específica que FeNa em uso de diuréticos
- Complementa avaliação da FeNa

**Referências**:
- Carvounis CP, et al. Significance of the fractional excretion of urea in the differential diagnosis of acute renal failure. Kidney Int. 2002;62(6):2223-9.

## 4. Calculadoras Metabólicas

### 4.1 Correção de Cálcio pela Albumina

**Identificação**:
- ID: `corrected_calcium`
- Nome: "Cálcio Corrigido pela Albumina"
- Domínio: `metabolismo`
- Tipo: `prebuilt`

**Entradas**:
```json
{
  "calcio_total": {
    "symbol": "total_calcium_mg_dl",
    "type": "number",
    "unit": "mg/dL",
    "validation": {"min": 1, "max": 20}
  },
  "albumina": {
    "symbol": "albumin_g_dl",
    "type": "number",
    "unit": "g/dL",
    "validation": {"min": 0.5, "max": 6}
  }
}
```

**Fórmula**: `Ca_corrigido = Ca_total + 0.8 × (4.0 - albumina)`

**Saída**:
```json
{
  "calcio_corrigido": {
    "unit": "mg/dL",
    "precision": 1,
    "interpretation": {
      "<8.5": {"label": "Hipocalcemia", "color": "red"},
      "8.5-10.5": {"label": "Normal", "color": "green"},
      ">10.5": {"label": "Hipercalcemia", "color": "red"}
    }
  }
}
```

**Validação Médica**:
- Essencial em hipoalbuminemia
- Fórmula válida para albumina 2.0-4.5 g/dL
- Considerar cálcio ionizado se disponível

**Referências**:
- Payne RB, et al. Interpretation of serum calcium in patients with abnormal serum proteins. Br Med J. 1973;4(5893):643-6.

### 4.2 Osmolaridade Sérica Calculada

**Identificação**:
- ID: `serum_osmolarity`
- Nome: "Osmolaridade Sérica Calculada"
- Domínio: `metabolismo`
- Tipo: `prebuilt`

**Entradas**:
```json
{
  "sodio": {
    "symbol": "sodium_meq_l",
    "type": "number",
    "unit": "mEq/L",
    "validation": {"min": 120, "max": 180}
  },
  "glicose": {
    "symbol": "glucose_mg_dl",
    "type": "number",
    "unit": "mg/dL",
    "validation": {"min": 30, "max": 1000}
  },
  "ureia": {
    "symbol": "bun_mg_dl",
    "type": "number",
    "unit": "mg/dL",
    "validation": {"min": 1, "max": 200}
  }
}
```

**Fórmula**: `Osm = 2 × Na + glicose/18 + ureia/6`

**Saída**:
```json
{
  "osmolaridade": {
    "unit": "mOsm/kg",
    "precision": 0,
    "interpretation": {
      "<280": {"label": "Hipoosmolaridade", "color": "blue"},
      "280-295": {"label": "Normal", "color": "green"},
      ">295": {"label": "Hiperosmolaridade", "color": "red"}
    }
  },
  "gap_osmotico": {
    "unit": "mOsm/kg",
    "precision": 0,
    "description": "Diferença entre osmolaridade medida e calculada",
    "interpretation": {
      "<10": {"label": "Normal", "color": "green"},
      "≥10": {"label": "Gap osmótico elevado - investigar intoxicações", "color": "red"}
    }
  }
}
```

**Validação Médica**:
- Útil para avaliação de intoxicações
- Gap osmótico >10 sugere substâncias não medidas
- Considerar etanol, metanol, etilenoglicol

**Referências**:
- Dorwart WV, Chalmers L. Comparison of methods for calculating serum osmolality. Clin Chem. 1975;21(2):190-4.

### 4.3 Correção de Sódio por Hiperglicemia

**Identificação**:
- ID: `sodium_correction_hyperglycemia`
- Nome: "Correção de Sódio por Hiperglicemia"
- Domínio: `metabolismo`
- Tipo: `dynamic`

**Entradas**:
```json
{
  "sodio_medido": {
    "symbol": "measured_sodium_meq_l",
    "type": "number",
    "unit": "mEq/L",
    "validation": {"min": 100, "max": 180}
  },
  "glicemia": {
    "symbol": "glucose_mg_dl",
    "type": "number",
    "unit": "mg/dL",
    "validation": {"min": 100, "max": 1000}
  }
}
```

**Fórmula**: `Na_corrigido = Na_medido + 1.6 × [(glicemia - 100) ÷ 100]`

**Validação Médica**:
- Aplicável em hiperglicemia >200 mg/dL
- Útil em cetoacidose diabética
- Fator de correção pode variar (1.6-2.4)

**Referências**:
- Katz MA. Hyperglycemia-induced hyponatremia--calculation of expected serum sodium depression. N Engl J Med. 1973;289(16):843-4.

### 4.4 Déficit de Ferro Total (Ganzoni)

**Identificação**:
- ID: `iron_deficit_ganzoni`
- Nome: "Déficit de Ferro Total (Ganzoni)"
- Domínio: `hematologia`
- Tipo: `prebuilt`

**Entradas**:
```json
{
  "peso": {
    "symbol": "weight_kg",
    "type": "number",
    "unit": "kg",
    "validation": {"min": 10, "max": 200}
  },
  "hb_alvo": {
    "symbol": "target_hb_g_dl",
    "type": "number",
    "unit": "g/dL",
    "validation": {"min": 8, "max": 18}
  },
  "hb_atual": {
    "symbol": "current_hb_g_dl",
    "type": "number",
    "unit": "g/dL",
    "validation": {"min": 3, "max": 15}
  },
  "ferro_deposito": {
    "symbol": "iron_stores_mg",
    "type": "number",
    "unit": "mg",
    "validation": {"min": 0, "max": 1000},
    "defaultValue": 500
  }
}
```

**Fórmula**: `Déficit = peso × (Hb_alvo - Hb_atual) × 2.4 + ferro_depósito`

**Saída**:
```json
{
  "deficit_ferro": {
    "unit": "mg",
    "precision": 0,
    "interpretation": {
      "<500": {"label": "Déficit leve", "color": "yellow"},
      "500-1500": {"label": "Déficit moderado", "color": "yellow"},
      ">1500": {"label": "Déficit severo", "color": "red"}
    }
  }
}
```

**Validação Médica**:
- Padrão para reposição de ferro IV
- Ferro de depósito: 500mg (padrão) ou 15mg/kg
- Considerar perdas contínuas

**Referências**:
- Ganzoni AM. Intravenous iron-dextran: therapeutic and experimental possibilities. Schweiz Med Wochenschr. 1970;100(7):301-3.

### 4.5 Estimativa Média de Glicemia (eAG)

**Identificação**:
- ID: `estimated_average_glucose`
- Nome: "Estimativa Média de Glicemia"
- Domínio: `metabolismo`
- Tipo: `dynamic`

**Entradas**:
```json
{
  "hba1c": {
    "symbol": "hba1c_percent",
    "type": "number",
    "unit": "%",
    "validation": {"min": 4, "max": 20}
  }
}
```

**Fórmula**: `eAG = 28.7 × HbA1c - 46.7`

**Saída**:
```json
{
  "eag": {
    "unit": "mg/dL",
    "precision": 0,
    "interpretation": {
      "<154": {"label": "Controle adequado (HbA1c <7%)", "color": "green"},
      "154-183": {"label": "Controle limítrofe (HbA1c 7-8%)", "color": "yellow"},
      ">183": {"label": "Controle inadequado (HbA1c >8%)", "color": "red"}
    }
  }
}
```

**Validação Médica**:
- Correlação com glicemia média de 2-3 meses
- Útil para educação do paciente
- Variabilidade individual existe

**Referências**:
- Nathan DM, et al. Translating the A1C assay into estimated average glucose values. Diabetes Care. 2008;31(8):1473-8.

## 5. Calculadoras Cardiológicas

### 5.1 LDL Colesterol (Friedewald)

**Identificação**:
- ID: `friedewald_ldl`
- Nome: "LDL Colesterol (Friedewald)"
- Domínio: `cardiologia`
- Tipo: `prebuilt`

**Entradas**:
```json
{
  "colesterol_total": {
    "symbol": "total_cholesterol_mg_dl",
    "type": "number",
    "unit": "mg/dL",
    "validation": {"min": 50, "max": 800}
  },
  "hdl": {
    "symbol": "hdl_cholesterol_mg_dl",
    "type": "number",
    "unit": "mg/dL",
    "validation": {"min": 10, "max": 150}
  },
  "triglicerideos": {
    "symbol": "triglycerides_mg_dl",
    "type": "number",
    "unit": "mg/dL",
    "validation": {"min": 20, "max": 400}
  }
}
```

**Fórmula**: `LDL = CT - HDL - TG/5`

**Saída**:
```json
{
  "ldl": {
    "unit": "mg/dL",
    "precision": 0,
    "interpretation": {
      "<70": {"label": "Ótimo (muito alto risco)", "color": "green"},
      "70-99": {"label": "Ótimo a quase ótimo", "color": "green"},
      "100-129": {"label": "Quase ótimo a limítrofe", "color": "yellow"},
      "130-159": {"label": "Limítrofe alto", "color": "yellow"},
      "160-189": {"label": "Alto", "color": "red"},
      "≥190": {"label": "Muito alto", "color": "red"}
    }
  },
  "limitacoes": {
    "description": "Limitações da fórmula",
    "warnings": [
      "Inválida se TG > 400 mg/dL",
      "Menos precisa se TG > 200 mg/dL",
      "Não usar em jejum < 9h"
    ]
  }
}
```

**Validação Médica**:
- Inválida se triglicerídeos >400 mg/dL
- Menos precisa se TG >200 mg/dL
- Requer jejum de 9-12 horas
- Considerar LDL direto se limitações

**Referências**:
- Friedewald WT, et al. Estimation of the concentration of low-density lipoprotein cholesterol. Clin Chem. 1972;18(6):499-502.

### 5.2 Relação PaO2/FiO2

**Identificação**:
- ID: `pao2_fio2_ratio`
- Nome: "Relação PaO2/FiO2"
- Domínio: `terapia_intensiva`
- Tipo: `prebuilt`

**Entradas**:
```json
{
  "pao2": {
    "symbol": "pao2_mmhg",
    "type": "number",
    "unit": "mmHg",
    "validation": {"min": 30, "max": 600}
  },
  "fio2": {
    "symbol": "fio2_fraction",
    "type": "number",
    "unit": "fração (0.21-1.0)",
    "validation": {"min": 0.21, "max": 1.0}
  }
}
```

**Fórmula**: `Relação = PaO2 ÷ FiO2`

**Saída**:
```json
{
  "pao2_fio2": {
    "unit": "mmHg",
    "precision": 0,
    "interpretation": {
      "≥300": {"label": "Normal", "color": "green"},
      "200-299": {"label": "SARA leve", "color": "yellow"},
      "100-199": {"label": "SARA moderada", "color": "red"},
      "<100": {"label": "SARA grave", "color": "red"}
    }
  }
}
```

**Validação Médica**:
- Diagnóstico de SARA/ARDS
- Requer gasometria arterial
- Considerar PEEP e outros fatores
- Parte dos critérios de Berlin

**Referências**:
- Bernard GR, et al. The American-European Consensus Conference on ARDS. Am J Respir Crit Care Med. 1994;149(3 Pt 1):818-24.

## 6. Calculadoras Hematológicas

### 6.1 Contagem Absoluta de Eosinófilos

**Identificação**:
- ID: `absolute_eosinophil_count`
- Nome: "Contagem Absoluta de Eosinófilos"
- Domínio: `hematologia`
- Tipo: `dynamic`

**Entradas**:
```json
{
  "leucocitos": {
    "symbol": "wbc_per_ul",
    "type": "number",
    "unit": "×10³/μL",
    "validation": {"min": 0.5, "max": 100}
  },
  "eosinofilos_percent": {
    "symbol": "eosinophils_percent",
    "type": "number",
    "unit": "%",
    "validation": {"min": 0, "max": 50}
  }
}
```

**Fórmula**: `Eosinófilos = (WBC × %Eo) ÷ 100`

**Saída**:
```json
{
  "eosinofilos_absolutos": {
    "unit": "células/μL",
    "precision": 0,
    "interpretation": {
      "<500": {"label": "Normal", "color": "green"},
      "500-1500": {"label": "Eosinofilia leve", "color": "yellow"},
      "1500-5000": {"label": "Eosinofilia moderada", "color": "yellow"},
      ">5000": {"label": "Eosinofilia severa", "color": "red"}
    }
  }
}
```

**Validação Médica**:
- Normal: <500 células/μL
- Investigar causas se >1500
- Considerar síndrome hipereosinofílica se >1500 persistente

**Referências**:
- Tefferi A, et al. Contemporary approach to the diagnosis and management of eosinophilia. Mayo Clin Proc. 2005;80(9):1177-84.

### 6.2 Saturação de Transferrina

**Identificação**:
- ID: `transferrin_saturation`
- Nome: "Saturação de Transferrina"
- Domínio: `hematologia`
- Tipo: `dynamic`

**Entradas**:
```json
{
  "ferro_serico": {
    "symbol": "serum_iron_ug_dl",
    "type": "number",
    "unit": "μg/dL",
    "validation": {"min": 10, "max": 500}
  },
  "tibc": {
    "symbol": "tibc_ug_dl",
    "type": "number",
    "unit": "μg/dL",
    "validation": {"min": 200, "max": 600}
  }
}
```

**Fórmula**: `IST = (ferro ÷ TIBC) × 100`

**Saída**:
```json
{
  "saturacao_transferrina": {
    "unit": "%",
    "precision": 1,
    "interpretation": {
      "<16": {"label": "Deficiência de ferro", "color": "red"},
      "16-45": {"label": "Normal", "color": "green"},
      ">45": {"label": "Sobrecarga de ferro", "color": "red"}
    }
  }
}
```

**Validação Médica**:
- Diagnóstico de deficiência de ferro
- <16% sugere deficiência
- >45% sugere sobrecarga
- Combinar com ferritina

**Referências**:
- Looker AC, et al. Prevalence of iron deficiency in the United States. JAMA. 1997;277(12):973-6.

## 7. Calculadoras de Terapia Intensiva

### 7.1 PaO2 Ideal pela Idade

**Identificação**:
- ID: `ideal_pao2_by_age`
- Nome: "PaO2 Ideal pela Idade"
- Domínio: `terapia_intensiva`
- Tipo: `dynamic`

**Entradas**:
```json
{
  "idade": {
    "symbol": "age_years",
    "type": "number",
    "unit": "anos",
    "validation": {"min": 18, "max": 100}
  }
}
```

**Fórmula**: `PaO2_ideal = 100 - (idade ÷ 3)`

**Saída**:
```json
{
  "pao2_ideal": {
    "unit": "mmHg",
    "precision": 0,
    "interpretation": {
      "description": "Valor esperado de PaO2 em ar ambiente ao nível do mar"
    }
  }
}
```

**Validação Médica**:
- Referência para gasometria arterial
- Válido para ar ambiente (FiO2 0.21)
- Considerar altitude e comorbidades

**Referências**:
- Sorbini CA, et al. Arterial oxygen tension in relation to age in healthy subjects. Respiration. 1968;25(1):3-13.

### 7.2 Relação SpO2/FiO2

**Identificação**:
- ID: `spo2_fio2_ratio`
- Nome: "Relação SpO2/FiO2"
- Domínio: `terapia_intensiva`
- Tipo: `dynamic`

**Entradas**:
```json
{
  "spo2": {
    "symbol": "spo2_percent",
    "type": "number",
    "unit": "%",
    "validation": {"min": 70, "max": 100}
  },
  "fio2": {
    "symbol": "fio2_fraction",
    "type": "number",
    "unit": "fração (0.21-1.0)",
    "validation": {"min": 0.21, "max": 1.0}
  }
}
```

**Fórmula**: `Relação = SpO2 ÷ FiO2`

**Saída**:
```json
{
  "spo2_fio2": {
    "unit": "%",
    "precision": 0,
    "interpretation": {
      "≥235": {"label": "Correlaciona com PaO2/FiO2 ≥200", "color": "yellow"},
      "<235": {"label": "Correlaciona com PaO2/FiO2 <200", "color": "red"}
    }
  }
}
```

**Validação Médica**:
- Estimativa quando gasometria não disponível
- Menos precisa que PaO2/FiO2
- Útil para triagem inicial

**Referências**:
- Rice TW, et al. Comparison of the SpO2/FIO2 ratio and the PaO2/FIO2 ratio in patients with acute lung injury or ARDS. Chest. 2007;132(2):410-7.

## 8. Calculadoras de Conversão

### 8.1 Conversão Gotejamento (já existente)

**Identificação**:
- ID: `gtt_to_ml_h`
- Nome: "Conversão de Gotejamento"
- Domínio: `conversoes`
- Tipo: `prebuilt`

**Funcionalidades**:
- Conversão gtt/min ↔ mL/h
- Modo "Tap" para contagem de gotas
- Cálculo de tempo de infusão
- Diferentes tipos de equipo

### 8.2 Conversão mcg/kg/min (já existente)

**Identificação**:
- ID: `mcg_kg_min_conversion`
- Nome: "Conversão mcg/kg/min"
- Domínio: `conversoes`
- Tipo: `prebuilt`

**Funcionalidades**:
- Conversão dose ↔ velocidade de infusão
- Múltiplas drogas vasoativas
- Cálculo de concentração
- Tabelas de diluição

## 9. Validação e Testes Médicos

### 9.1 Casos de Teste por Calculadora

**BMI - Casos de Teste**:
```json
[
  {
    "name": "Adulto peso normal",
    "inputs": {"weight": 70, "height": 1.75},
    "expected": {"bmi": 22.9, "interpretation": "Peso normal"},
    "tolerance": 0.1
  },
  {
    "name": "Obesidade grau I",
    "inputs": {"weight": 85, "height": 1.65},
    "expected": {"bmi": 31.2, "interpretation": "Obesidade grau I"},
    "tolerance": 0.1
  }
]
```

**Cockcroft-Gault - Casos de Teste**:
```json
[
  {
    "name": "Homem adulto função normal",
    "inputs": {"age": 45, "weight": 70, "creatinine": 1.0, "sex": "masculino"},
    "expected": {"clearance": 97.2},
    "tolerance": 2.0
  },
  {
    "name": "Mulher idosa disfunção moderada",
    "inputs": {"age": 75, "weight": 60, "creatinine": 1.8, "sex": "feminino"},
    "expected": {"clearance": 23.6},
    "tolerance": 1.0
  }
]
```

### 9.2 Validação de Ranges Médicos

**Ranges Fisiológicos por Calculadora**:
```typescript
const MEDICAL_RANGES = {
  bmi: {
    weight: { min: 1, max: 500, unit: 'kg' },
    height: { min: 0.3, max: 3.0, unit: 'm' },
    warnings: {
      weight: { threshold: 200, message: 'Peso muito elevado - verificar' },
      height: { threshold: 2.5, message: 'Altura muito elevada - verificar' }
    }
  },
  cockcroft_gault: {
    age: { min: 18, max: 120, unit: 'anos' },
    creatinine: { min: 0.1, max: 20, unit: 'mg/dL' },
    warnings: {
      creatinine: { threshold: 5, message: 'Creatinina muito elevada - verificar' }
    }
  }
};
```

### 9.3 Interpretações Clínicas Validadas

**Classificações Baseadas em Guidelines**:
```typescript
const CLINICAL_INTERPRETATIONS = {
  bmi: {
    source: 'WHO 2000',
    ranges: {
      '<16.0': { label: 'Magreza grave', action: 'Avaliação nutricional urgente' },
      '18.5-24.9': { label: 'Peso normal', action: 'Manter peso atual' },
      '≥30.0': { label: 'Obesidade', action: 'Intervenção para perda de peso' }
    }
  },
  ckd_epi: {
    source: 'KDIGO 2012',
    ranges: {
      '≥90': { label: 'G1 - Normal', action: 'Monitoramento anual se fatores de risco' },
      '30-44': { label: 'G3b - Moderada a severa', action: 'Encaminhar para nefrologista' },
      '<15': { label: 'G5 - Falência renal', action: 'Preparar para terapia renal substitutiva' }
    }
  }
};
```

## 10. Implementação Técnica

### 10.1 Estrutura de Arquivos JSON

**Exemplo: bmi.json**
```json
{
  "id": "bmi",
  "name": "Índice de Massa Corporal",
  "domain": "antropometria",
  "description": "Calcula o IMC e classifica o estado nutricional",
  "type": "prebuilt",
  "version": "1.0.0",
  "lastUpdated": "2024-01-15",
  "inputs": [
    {
      "name": "peso",
      "symbol": "weight_kg",
      "type": "number",
      "unit": "kg",
      "description": "Peso corporal em quilogramas",
      "validation": {
        "min": 1,
        "max": 500,
        "precision": 1,
        "required": true
      },
      "placeholder": "Ex: 70"
    },
    {
      "name": "altura",
      "symbol": "height_m",
      "type": "number",
      "unit": "m",
      "description": "Altura em metros",
      "validation": {
        "min": 0.3,
        "max": 3.0,
        "precision": 2,
        "required": true
      },
      "placeholder": "Ex: 1.75"
    }
  ],
  "output": {
    "name": "imc",
    "symbol": "bmi",
    "unit": "kg/m²",
    "precision": 1,
    "interpretation": [
      {
        "condition": "<16.0",
        "label": "Magreza grave",
        "color": "red",
        "description": "Risco nutricional elevado"
      },
      {
        "condition": "18.5-24.9",
        "label": "Peso normal",
        "color": "green",
        "description": "Peso adequado para a altura"
      },
      {
        "condition": "≥30.0",
        "label": "Obesidade",
        "color": "red",
        "description": "Risco aumentado para comorbidades"
      }
    ]
  },
  "formula": "weight_kg / (height_m * height_m)",
  "references": [
    {
      "citation": "WHO. Obesity: preventing and managing the global epidemic. Geneva: WHO; 2000.",
      "url": "https://www.who.int/publications/i/item/9241208945",
      "type": "guideline"
    }
  ],
  "medicalReview": {
    "reviewer": "Dr. Especialista",
    "date": "2024-01-15",
    "approved": true,
    "notes": "Fórmula e interpretações validadas conforme WHO 2000"
  },
  "limitations": [
    "Não aplicável em gestantes",
    "Limitações em atletas com alta massa muscular",
    "Considerar composição corporal em idosos"
  ],
  "warnings": [
    {
      "condition": "weight_kg > 200",
      "message": "Peso muito elevado - verificar se está correto",
      "severity": "medium"
    }
  ]
}
```

### 10.2 Componente React Genérico

**PreBuiltCalculator.tsx**
```typescript
interface PreBuiltCalculatorProps {
  calculatorId: string;
  schema: CalculatorSchema;
  onResult?: (result: CalculationResult) => void;
}

export const PreBuiltCalculator: React.FC<PreBuiltCalculatorProps> = ({
  calculatorId,
  schema,
  onResult
}) => {
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  
  const { calculate, validate, isLoading } = useCalculator(calculatorId);
  const { isMobile } = useMobileOptimization();
  
  const handleInputChange = useCallback((field: string, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    const validation = validate({ ...inputs, [field]: value });
    setErrors(validation.errors);
    setWarnings(validation.warnings);
  }, [inputs, validate]);
  
  const handleCalculate = useCallback(async () => {
    try {
      const calculationResult = await calculate(inputs);
      setResult(calculationResult);
      onResult?.(calculationResult);
    } catch (error) {
      console.error('Calculation failed:', error);
    }
  }, [calculate, inputs, onResult]);
  
  const isValid = errors.length === 0 && 
    schema.inputs.every(input => 
      input.validation.required ? inputs[input.symbol] !== undefined : true
    );
  
  return (
    <div className={`calculator-container ${isMobile ? 'mobile' : 'desktop'}`}>
      <div className="calculator-header">
        <h2 className="text-2xl font-bold text-gray-900">{schema.name}</h2>
        <p className="text-gray-600 mt-2">{schema.description}</p>
      </div>
      
      <div className="calculator-inputs mt-6">
        {schema.inputs.map((input) => (
          <div key={input.symbol} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {input.name}
              {input.validation.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            <TouchOptimizedInput
              type={input.type}
              value={inputs[input.symbol] || ''}
              onChange={(value) => handleInputChange(input.symbol, value)}
              placeholder={input.placeholder}
              unit={input.unit}
            />
            
            {input.description && (
              <p className="text-sm text-gray-500 mt-1">{input.description}</p>
            )}
          </div>
        ))}
        
        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <h4 className="text-red-800 font-medium mb-2">Erros de Validação:</h4>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error.message}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Validation Warnings */}
        {warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <h4 className="text-yellow-800 font-medium mb-2">Avisos:</h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>• {warning.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="calculator-actions mt-6">
        <button
          onClick={handleCalculate}
          disabled={!isValid || isLoading}
          className={`
            w-full py-3 px-4 rounded-lg font-medium transition-colors
            ${isValid && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? 'Calculando...' : 'Calcular'}
        </button>
      </div>
      
      {/* Results */}
      {result && (
        <div className="calculator-results mt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Resultado</h3>
            
            <div className="space-y-4">
              {Object.entries(result.outputs).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-gray-700">{schema.output.name}:</span>
                  <span className="font-mono text-lg font-semibold">
                    {value} {schema.output.unit}
                  </span>
                </div>
              ))}
              
              {result.interpretation && (
                <div className="mt-4 p-4 bg-white rounded-md border">
                  <h4 className="font-medium text-gray-900 mb-2">Interpretação:</h4>
                  <p className="text-gray-700">{result.interpretation}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Formula Display */}
          <div className="mt-4">
            <FormulaDisplay formula={schema.formula} />
          </div>
          
          {/* References */}
          <div className="mt-4">
            <ReferenceLinks references={schema.references} />
          </div>
        </div>
      )}
      
      {/* Limitations */}
      {schema.limitations && schema.limitations.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Limitações:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {schema.limitations.map((limitation, index) => (
              <li key={index}>• {limitation}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

### 10.3 Hook de Calculadora

**useCalculator.ts**
```typescript
interface UseCalculatorReturn {
  calculate: (inputs: Record<string, any>) => Promise<CalculationResult>;
  validate: (inputs: Record<string, any>) => ValidationResult;
  isLoading: boolean;
  error: string | null;
}

export const useCalculator = (calculatorId: string): UseCalculatorReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const schema = useCalculatorSchema(calculatorId);
  const calculator = useMemo(() => {
    if (!schema) return null;
    return new CalculatorEngine(schema);
  }, [schema]);
  
  const validate = useCallback((inputs: Record<string, any>): ValidationResult => {
    if (!calculator) return { isValid: false, errors: [], warnings: [] };
    
    return calculator.validate(inputs);
  }, [calculator]);
  
  const calculate = useCallback(async (inputs: Record<string, any>): Promise<CalculationResult> => {
    if (!calculator) throw new Error('Calculator not initialized');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const validation = calculator.validate(inputs);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }
      
      const result = await calculator.calculate(inputs);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Calculation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [calculator]);
  
  return {
    calculate,
    validate,
    isLoading,
    error
  };
};
```

### 10.4 Engine de Cálculo

**CalculatorEngine.ts**
```typescript
export class CalculatorEngine {
  private schema: CalculatorSchema;
  private formulaParser: FormulaParser;
  
  constructor(schema: CalculatorSchema) {
    this.schema = schema;
    this.formulaParser = new FormulaParser();
  }
  
  validate(inputs: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Validate required fields
    for (const input of this.schema.inputs) {
      if (input.validation.required && !inputs[input.symbol]) {
        errors.push({
          field: input.symbol,
          message: `${input.name} é obrigatório`,
          type: 'required'
        });
      }
    }
    
    // Validate ranges and types
    for (const [field, value] of Object.entries(inputs)) {
      const inputSchema = this.schema.inputs.find(i => i.symbol === field);
      if (!inputSchema || value === undefined || value === '') continue;
      
      const validation = inputSchema.validation;
      const numValue = Number(value);
      
      if (inputSchema.type === 'number') {
        if (isNaN(numValue)) {
          errors.push({
            field,
            message: `${inputSchema.name} deve ser um número válido`,
            type: 'type'
          });
          continue;
        }
        
        if (validation.min !== undefined && numValue < validation.min) {
          errors.push({
            field,
            message: `${inputSchema.name} deve ser ≥ ${validation.min}`,
            type: 'range'
          });
        }
        
        if (validation.max !== undefined && numValue > validation.max) {
          errors.push({
            field,
            message: `${inputSchema.name} deve ser ≤ ${validation.max}`,
            type: 'range'
          });
        }
      }
    }
    
    // Check warnings
    if (this.schema.warnings) {
      for (const warning of this.schema.warnings) {
        if (this.evaluateCondition(warning.condition, inputs)) {
          warnings.push({
            field: warning.field || 'general',
            message: warning.message,
            severity: warning.severity || 'medium'
          });
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  async calculate(inputs: Record<string, any>): Promise<CalculationResult> {
    // Parse and evaluate formula
    const result = this.formulaParser.evaluate(this.schema.formula, inputs);
    
    // Apply precision
    const precision = this.schema.output.precision || 2;
    const roundedResult = Number(result.toFixed(precision));
    
    // Get interpretation
    const interpretation = this.getInterpretation(roundedResult);
    
    return {
      outputs: {
        [this.schema.output.symbol]: roundedResult
      },
      interpretation: interpretation?.label,
      color: interpretation?.color,
      timestamp: new Date().toISOString(),
      calculatorId: this.schema.id
    };
  }
  
  private getInterpretation(value: number) {
    if (!this.schema.output.interpretation) return null;
    
    for (const interp of this.schema.output.interpretation) {
      if (this.valueMatchesCondition(value, interp.condition)) {
        return interp;
      }
    }
    
    return null;
  }
  
  private valueMatchesCondition(value: number, condition: string): boolean {
    // Parse conditions like "<16.0", "18.5-24.9", "≥30.0"
    if (condition.includes('-')) {
      const [min, max] = condition.split('-').map(Number);
      return value >= min && value <= max;
    }
    
    if (condition.startsWith('≥') || condition.startsWith('>=')) {
      const threshold = Number(condition.slice(1));
      return value >= threshold;
    }
    
    if (condition.startsWith('≤') || condition.startsWith('<=')) {
      const threshold = Number(condition.slice(1));
      return value <= threshold;
    }
    
    if (condition.startsWith('<')) {
      const threshold = Number(condition.slice(1));
      return value < threshold;
    }
    
    if (condition.startsWith('>')) {
      const threshold = Number(condition.slice(1));
      return value > threshold;
    }
    
    return false;
  }
  
  private evaluateCondition(condition: string, inputs: Record<string, any>): boolean {
    // Simple condition evaluation for warnings
    // Example: "weight_kg > 200"
    try {
      return this.formulaParser.evaluate(condition, inputs);
    } catch {
      return false;
    }
  }
}
```

## 11. Componentes de Suporte

### 11.1 TouchOptimizedInput

```typescript
interface TouchOptimizedInputProps {
  type: 'number' | 'select' | 'text';
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  unit?: string;
  options?: string[];
}

export const TouchOptimizedInput: React.FC<TouchOptimizedInputProps> = ({
  type,
  value,
  onChange,
  placeholder,
  unit,
  options
}) => {
  const { isMobile } = useMobileOptimization();
  
  if (type === 'select') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full border border-gray-300 rounded-lg px-3 py-2
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${isMobile ? 'text-lg py-3' : 'text-base'}
        `}
      >
        <option value="">Selecione...</option>
        {options?.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }
  
  return (
    <div className="relative">
      <input
        type={type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full border border-gray-300 rounded-lg px-3 py-2
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${isMobile ? 'text-lg py-3' : 'text-base'}
          ${unit ? 'pr-12' : ''}
        `}
        inputMode={type === 'number' ? 'decimal' : 'text'}
      />
      {unit && (
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
          {unit}
        </span>
      )}
    </div>
  );
};
```

### 11.2 FormulaDisplay

```typescript
interface FormulaDisplayProps {
  formula: string;
}

export const FormulaDisplay: React.FC<FormulaDisplayProps> = ({ formula }) => {
  const [showFormula, setShowFormula] = useState(false);
  
  const formatFormula = (formula: string): string => {
    // Convert programming formula to mathematical notation
    return formula
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/Math\.sqrt\(([^)]+)\)/g, '√($1)')
      .replace(/Math\.pow\(([^,]+),\s*([^)]+)\)/g, '$1^$2')
      .replace(/_/g, ' ');
  };
  
  return (
    <div className="border-t pt-4">
      <button
        onClick={() => setShowFormula(!showFormula)}
        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
      >
        <span>Ver fórmula</span>
        <ChevronDownIcon 
          className={`ml-1 h-4 w-4 transform transition-transform ${
            showFormula ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      {showFormula && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md">
          <code className="text-sm font-mono text-gray-800">
            {formatFormula(formula)}
          </code>
        </div>
      )}
    </div>
  );
};
```

### 11.3 ReferenceLinks

```typescript
interface ReferenceLinksProps {
  references: Reference[];
}

export const ReferenceLinks: React.FC<ReferenceLinksProps> = ({ references }) => {
  const [showReferences, setShowReferences] = useState(false);
  
  if (!references || references.length === 0) return null;
  
  return (
    <div className="border-t pt-4">
      <button
        onClick={() => setShowReferences(!showReferences)}
        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
      >
        <span>Referências ({references.length})</span>
        <ChevronDownIcon 
          className={`ml-1 h-4 w-4 transform transition-transform ${
            showReferences ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      {showReferences && (
        <div className="mt-2 space-y-2">
          {references.map((ref, index) => (
            <div key={index} className="text-sm text-gray-600">
              <span className="font-medium">{index + 1}.</span>
              <span className="ml-2">{ref.citation}</span>
              {ref.url && (
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  [Link]
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## 12. Conclusão

Este documento especifica um sistema robusto de calculadoras médicas com:

- **50+ calculadoras** organizadas por domínio clínico
- **Validação médica rigorosa** com referências bibliográficas
- **Interface otimizada** para dispositivos móveis
- **Arquitetura extensível** para novas calculadoras
- **Componentes reutilizáveis** para desenvolvimento eficiente

Cada calculadora inclui:
- Fórmulas matematicamente precisas
- Validação de entrada robusta
- Interpretações clínicas baseadas em guidelines
- Limitações e avisos médicos
- Referências científicas atualizadas

O sistema está preparado para implementação imediata e expansão futura conforme necessidades clínicas.