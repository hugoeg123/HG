# Calculadoras de função renal

Este diretório abrange calculadoras destinadas à avaliação da função renal e do equilíbrio hidroeletrolítico.  As fórmulas estimam a depuração de creatinina, a fração de excreção de solutos e ajudam na prescrição de drogas renais.

| Calculadora/Conversão                               | Variáveis principais                                         | Fórmula / comentário |
|----------------------------------------------------|----------------------------------------------------------------|----------------------|
| **Depuração de creatinina (Cockcroft–Gault)**      | Idade, peso (kg), creatinina sérica, sexo                     | `CrCl = [(140 – idade) × peso] / (72 × Cr_sérica)`; multiplicar por 0,85 em mulheres【755153964960023†L588-L599】.  Resulta em mL/min. |
| **Depuração de creatinina (medida)**                | Volume urinário (mL), duração da coleta (min), creatinina urinária, creatinina sérica | `CrCl_medida = (Cr_urina × volume)/(Cr_sérica × tempo)`; padroniza para mL/min multiplicando por (100 mL/L) e corrigindo para 1 minuto. |
| **Fração de excreção de sódio (FeNa)**              | Sódio sérico, sódio urinário, creatinina sérica, creatinina urinária | `FeNa (%) = [(Na_urina × Cr_sérica)/(Na_sérica × Cr_urina)] × 100`【689935032807257†L170-L172】.  Útil para diferenciar injúria renal pré‑renal de renal intrínseca. |
| **Fração de excreção de ureia**                     | Ureia sérica (mg/dL), ureia urinária (mg/dL), creatinina sérica, creatinina urinária | `FeUrea (%) = [(Ureia_urina × Cr_sérica)/(Ureia_sérica × Cr_urina)] × 100`.  Aplicada em uso de diuréticos. |
| **Correção do cálcio pela albumina**                | Cálcio sérico total, albumina (g/dL)                          | `Ca_corr = Ca_total + 0,8 × (4,0 – albumina)`【269570755257146†L83-L87】. |
| **Osmolaridade plasmática estimada**                 | Sódio (mEq/L), glicose (mg/dL), ureia (mg/dL)                 | `Osm_est = 2 × Na + glicose/18 + ureia/6`; compara‑se com osmolaridade medida para calcular o gap osmótico. |
| **Taxa de filtração glomerular (CKD‑EPI/MDRD)**      | Idade, sexo, raça, creatinina sérica                          | Fórmulas CKD‑EPI e MDRD estimam TFG em mL/min/1,73 m²; os coeficientes variam com sexo e raça. |

> **Observação:** Embora a Cockcroft–Gault permaneça amplamente utilizada para ajuste de doses de fármacos, as fórmulas CKD‑EPI e MDRD são recomendadas para estimar a taxa de filtração glomerular (TFG) e classificar estágios de doença renal crônica.
