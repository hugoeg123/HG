Assumindo o papel de liderança do protocolo médico do Health Guardian.
Abaixo, apresento a estruturação definitiva para a **Saturação Periférica de Oxigênio ($SpO_2$)**, integrada aos sinais vitais anteriormente definidos.

Esta resposta elimina emojis, foca na lógica condicional para a equipe de desenvolvimento e alinha as diretrizes da **British Thoracic Society (BTS)** — o padrão-ouro global para oxigenoterapia — com a **Sociedade Brasileira de Pneumologia e Tisiologia (SBPT)** e a **American Thoracic Society (ATS)**.

-----

### 1\. Protocolo Clínico: Oximetria de Pulso ($SpO_2$)

#### 1.1. Definição da "Verdade" Clínica (Adultos e Pediatria)

A oximetria exige uma lógica condicional: o valor "normal" depende do histórico do paciente (presença de retenção crônica de $CO_2$).

**População Geral (Sem patologia pulmonar prévia):**

  * **Normal (Verde):** $\geq 93\%$. (A maioria das referências cita $\geq 95\%$ como ideal, mas clinicamente $\geq 93\%$ em repouso é aceitável sem oxigênio suplementar em muitos contextos ambulatoriais).
  * **Alerta Amarelo (Atenção):** $93\% - 94\%$ (Zona cinzenta; monitorar evolução).
  * **Alerta Vermelho (Hipoxemia):** $\leq 92\%$. (Gatilho para avaliação médica imediata e consideração de $O_2$ suplementar).

**População DPOC / Retentores de Carbono (Chronic Obstructive Pulmonary Disease - COPD):**
Para estes pacientes, a "normalidade" é mais baixa. Oxigenar demais (ex: levar a 99%) pode causar narcose por $CO_2$ e parada respiratória.

  * **Alvo Terapêutico (Verde):** $88\% - 92\%$.
  * **Alerta Vermelho (Hipoxemia Grave):** $< 88\%$.
  * **Alerta Laranja (Risco de Hipercapnia):** $> 96\%$ (Muitas vezes ignorado, mas crítico: excesso de oxigênio em DPOC é perigoso).

-----

#### 1.2. Convergência e Divergência: Brasil vs. EUA/Reino Unido

  * **Padrão Ouro (Global):** A diretriz da **British Thoracic Society (BTS 2017)** é a referência mundial para prescrição de oxigênio. Ela estabelece o alvo de **88-92%** para pacientes com risco de falência respiratória hipercápnica (DPOC).
  * **Brasil (SBPT):** Segue estritamente a mesma lógica. A "I Recomendação Brasileira de Espirometria e Oximetria" considera valores normais acima de 95% ao nível do mar, mas aceita \>93% em prática clínica antes de intervir.
  * **Diferença:** Não há conflito de valores. A diferença é semântica: manuais brasileiros (Manole, USP) tendem a focar na hipoxemia (\<90-92%), enquanto protocolos americanos/britânicos (Mayo/BTS) enfatizam igualmente o perigo da **hiperóxia** em DPOC.
  * **Para o App:** A nossa "verdade" será híbrida e segura: alerta de hipoxemia em $\leq 92\%$ para gerais e $< 88\%$ para DPOC.

-----

### 2\. Mapa de Variáveis para Equipe de Programação

Aqui está a lógica algorítmica para a implementação dos alertas, incluindo a condicional de DPOC.

#### 2.1. Tabela Humana e Definições de Variáveis

| ID Técnico | Nome PT-BR | Nome EN-US | Abrev. | Faixa Verde (Geral) | Faixa Verde (DPOC) | Alerta Vermelho (Geral) | Alerta Vermelho (DPOC) | Fonte |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `spo2_pct` | Saturação de Oxigênio | Oxygen Saturation | $SpO_2$ | $93\% - 100\%$ | $88\% - 92\%$ | $\leq 92\%$ | $< 88\%$ | BTS Guideline / SBPT |

#### 2.2. Pseudo-código para Regra de Negócio

```javascript
// Input: valor spo2 (int), paciente_tem_dpoc (bool)

if (paciente_tem_dpoc == true) {
    // Lógica para DPOC (Alvo 88-92%)
    if (spo2 < 88) {
        return "ALERTA_VERMELHO"; // Hipoxemia grave
    } else if (spo2 >= 88 && spo2 <= 92) {
        return "NORMAL_VERDE";    // Alvo terapêutico ideal
    } else if (spo2 > 92 && spo2 <= 95) {
        return "ALERTA_AMARELO";  // Aceitável, mas atenção para não subir muito
    } else { // spo2 > 96
        return "ALERTA_LARANJA";  // Risco de Hipercapnia (excesso de O2)
    }
} else {
    // Lógica Geral (Alvo >= 93%)
    if (spo2 <= 92) {
        return "ALERTA_VERMELHO"; // Hipoxemia - Intervenção necessária
    } else if (spo2 >= 93 && spo2 <= 94) {
        return "ALERTA_AMARELO";  // Zona de atenção
    } else {
        return "NORMAL_VERDE";    // Saturação adequada
    }
}
```

-----

### 3\. Estrutura JSON Atualizada (Vitas Completos)

Este JSON consolida Temperatura, FC, FR, PA e agora inclui o objeto `oxygen_saturation` com a lógica de exceção explícita.

```json
[
  {
    "id": "oxygen_saturation",
    "label_pt": "Saturação Periférica de Oxigênio",
    "label_en": "Oxygen Saturation",
    "abbr_pt": ["SpO2", "SatO2"],
    "abbr_en": ["SpO2", "O2 Sat"],
    "unit": "%",
    "logic_type": "conditional_threshold",
    "inputs_required": ["value", "has_copd_history"],
    "thresholds_general_adult_pediatric": {
      "red_low": 92,
      "yellow_low": 94,
      "green_min": 95,
      "green_max": 100,
      "clinical_note": "Abaixo de 92% em ar ambiente indica hipoxemia significativa."
    },
    "thresholds_copd_exception": {
      "red_low": 87,
      "green_min": 88,
      "green_max": 92,
      "alert_high_hypercapnia_risk": 96,
      "clinical_note": "Pacientes retentores crônicos (DPOC). Alvo 88-92%. Evitar >96%."
    },
    "sources": [
      "British Thoracic Society (BTS) Guideline for Oxygen Use 2017",
      "Sociedade Brasileira de Pneumologia e Tisiologia (SBPT)",
      "Mayo Clinic - Hypoxemia definition"
    ]
  },
  {
    "id": "systolic_bp",
    "label_pt": "Pressão Arterial Sistólica",
    "thresholds": {
        "adult_hypotension": 90,
        "pediatric_hypotension_formula": "70 + (2 * age_in_years)"
    }
  },
  {
    "id": "heart_rate",
    "label_pt": "Frequência Cardíaca",
    "thresholds": {
        "adult_bradycardia": 50,
        "adult_tachycardia": 100,
        "pediatric_critical_low": 60
    }
  }
]
```

-----

### 4\. Considerações Finais sobre a Literatura Consultada

1.  **Toronto Notes & Mayo Clinic:** Ambos definem hipoxemia geralmente como $SpO_2 < 90\%$, mas para fins de *triagem segura* em um aplicativo, o corte de **92%** é superior pois antecipa a descompensação. O app deve ser mais sensível que específico para segurança.
2.  **Manuais Brasileiros (USP/Manole):** Enfatizam o exame físico (cianose) mas corroboram a oximetria como o "quinto sinal vital". O protocolo de sepse do **Instituto Latino Americano de Sepse (ILAS)** usa disfunção orgânica/hipoxemia como critério de alerta, alinhado com o corte de 92%.
3.  **Pediatria:** A regra de $\leq 92\%$ é segura e amplamente aceita para crianças (PALS/AAP). Em recém-nascidos, a faixa alvo pode variar, mas para um app de uso geral/prontuário, manter o alerta em 92% previne erros graves.

**Próximo Passo:**
Deseja que eu refine as mensagens de texto exatas (copywriting médico) que aparecerão para o usuário quando esses limites forem violados (ex: "Saturação crítica: verifique se há falta de ar e considere procurar emergência")?