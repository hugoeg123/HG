# Limites de Alerta de Sinais Vitais e Protocolos Clínicos

## Visão Geral
Este documento define a "Single Source of Truth" (Fonte Única da Verdade) para os critérios de alerta de sinais vitais na plataforma Health Guardian. A implementação segue rigorosamente protocolos clínicos estabelecidos e garante paridade entre as validações no Frontend (Interface do Usuário) e Backend (Servidor/Banco de Dados).

### Arquitetura de Validação
A lógica de validação é espelhada nos seguintes componentes para garantir integridade:
- **Frontend (UX/Feedback Imediato)**: 
  - `frontend/src/lib/vitalSignAlerts.js` (Motor de regras central)
  - `frontend/src/components/PatientView/VitalSignEditor.jsx` (Destaque visual em tempo real)
- **Backend (Segurança/Persistência)**: 
  - `backend/src/utils/vitalSignParser.js` (Motor de regras espelhado)
  - `backend/src/models/sequelize/PatientVitalSigns.js` (Validação ao salvar no banco)

---

## 1. Adulto (≥18 anos, População Geral)

### Parâmetros Padrão
| Sinal Vital | Faixa Normal | Critério de Alerta (Warning) | Critério Crítico (Emergency) | Referência |
|-------------|--------------|------------------------------|------------------------------|------------|
| **FC (Frequência Cardíaca)** | 60–100 bpm | `< 60` ou `> 100` | `< 50` ou `≥ 150` | AHA / ACLS |
| **FR (Frequência Respiratória)** | 12–20 irpm | `< 12` ou `> 20` | - | NEWS2 |
| **SpO2 (Saturação de Oxigênio)** | ≥ 94% (ar ambiente) | `≤ 92%` | `< 90%` | BTS / SBPT |
| **Temp (Temperatura)** | 36.1–37.2 °C | `> 37.8 °C` (Febre) ou `< 35.0 °C` (Hipotermia) | - | MedlinePlus |
| **PA (Pressão Arterial)** | PAS 90–120 / PAD 60–80 | PAS `≥ 140` ou `≤ 90` | PAS `≥ 180` (Crise) ou `≤ 80` (Choque) | JNC 7 / Diretrizes SBC |

---

## 2. Critérios Condicionais e Contextuais

A plataforma aplica regras dinâmicas baseadas no contexto clínico do paciente (extraído do prontuário).

### 2.1 Gestação (Obstetrícia)
Adaptações fisiológicas normais da gravidez exigem limites de alerta modificados para evitar falsos positivos.
- **Frequência Cardíaca (FC)**:
  - Faixa aceitável ampliada devido ao aumento do débito cardíaco.
  - **Alerta**: Apenas se `< 50` ou `≥ 110` bpm.
  - *Justificativa*: A FC basal aumenta 10-20 bpm durante a gestação. Limites rígidos de 100 bpm geram "fadiga de alerta".

### 2.2 Doença Pulmonar Obstrutiva Crônica (DPOC)
Pacientes retentores crônicos de CO2 possuem alvos de saturação diferenciados para evitar hipercapnia induzida por oxigênio.
- **SpO2 (Saturação)**:
  - **Alvo Terapêutico**: 88% – 92%.
  - **Alerta de Hipóxia**: `< 88%`.
  - **Alerta de Hiperóxia**: `> 96%` (Risco de narcose por CO2).
  - *Condição*: Aplicável se paciente possui "DPOC" ou "COPD" na lista de condições crônicas.

---

## 3. Pediatria (PALS - Pediatric Advanced Life Support)
*Atualmente implementado como placeholder na arquitetura, planejado para expansão futura.*

### Faixas de Frequência Cardíaca (Repouso)
- **Recém-nascido**: 110–160 bpm
- **Lactente**: 100–160 bpm
- **Pré-escolar**: 80–140 bpm
- **Escolar**: 70–120 bpm
- **Adolescente**: 60–100 bpm

### Definição de Hipotensão (PAS - Pressão Arterial Sistólica)
- **< 1 mês**: PAS < 60 mmHg
- **1 mês – 1 ano**: PAS < 70 mmHg
- **1 – 10 anos**: PAS < 70 + (2 × idade em anos)
- **> 10 anos**: PAS < 90 mmHg

---

## Fontes Bibliográficas
1. **SBC 2020**: Diretrizes Brasileiras de Hipertensão Arterial.
2. **AHA/ACC 2017**: Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults.
3. **BTS 2017**: British Thoracic Society Guideline for Oxygen Use in Adults in Healthcare and Emergency Settings.
4. **NEWS2**: National Early Warning Score 2 (Royal College of Physicians).
5. **PALS**: Pediatric Advanced Life Support Provider Manual (AHA).
