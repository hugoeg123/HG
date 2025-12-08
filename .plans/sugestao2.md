Abaixo vou te dar **a resposta que um pesquisador, epidemiologista ou redator de guideline usaria**: quais **quantificações** de tabagismo, etilismo e exercício físico **têm validade científica consolidada**, isto é: **usadas em estudos de coorte, meta-análises, diretrizes internacionais e escalas validadas**, *com limites claros, operacionalizáveis, reproduzíveis* — exatamente o tipo de métrica que você quer para estruturar RAG, prontuário e pesquisa clínica.

---

# 1. TABAGISMO — QUANTIFICAÇÕES COM VALIDADE CIENTÍFICA

## 1.1. *Pack-years* (maior evidência)

**Fórmula:**
**pack-years = (nº de cigarros/dia ÷ 20) × anos de uso**

Por que é válido:

* Métrica padrão em **Framingham**, **NHLBI**, **USPSTF**, **GOLD**, **ATS**, **ERS**, **PLCO**, **UK Biobank**.
* Reproduz risco em curva dose–resposta para **DPOC**, **câncer de pulmão**, **IAM**, **AVC**, aneurisma, etc.
* É comparável entre estudos.

Cutoffs com evidência:

* **≥ 20 pack-years**: risco significativamente aumentado para DPOC e câncer.
* **≥ 30 pack-years**: critério clássico de rastreio de câncer de pulmão.
* **≥ 40 pack-years**: mortalidade muito aumentada; estudos de curva dose-resposta mostram incremento quase exponencial.

## 1.2. Status de fumante (validado em todos os grandes estudos)

* **Nunca fumou**
* **Ex-fumante** (cessação ≥ 12 meses) — intervalo validado porque reduz risco de recaída.
* **Fumante atual** — forte preditor independente, mesmo com pack-years baixo.

## 1.3. Tipo de produto (estratificações validadas)

Modelos multivariados usam categorias:

* **Cigarro industrializado**
* **Cigarro de palha**
* **Charuto / cachimbo**
* **Narguilé** (equivalência média: 1 sessão ≈ 100–200 cigarros — estudos variam muito)
* **Vape / e-cig** (ainda sem equivalência absoluta; estudos usam: “usuário diário”, “usuário ocasional”, “nunca”)

## 1.4. Biomarcadores (menos prático, mas cientificamente robusto)

* **Cotinina urinária ou sérica** (níveis ≥ 15 ng/mL validam tabagismo ativo).
  Usada em NHANES, capitulações profundas de estudos toxicológicos.

---

# 2. ETILISMO — QUANTIFICAÇÕES PADRONIZADAS E VALIDADAS

## 2.1. Unidade Internacional de Álcool (Standard Drink)

**1 unidade = 14 g de etanol puro**
(Vale para EUA; Europa usa 10–12 g; Brasil costuma adotar 14g em pesquisas.)

Equivalências:

* 350 mL cerveja (teor 5%)
* 150 mL vinho (12–13%)
* 45 mL destilado (40%)

É a **métrica universal** em:

* WHO / OMS
* CDC
* NIAAA
* Diretrizes canadenses, australianas, europeias
* Coortes como **Framingham**, **Nurses' Health**, **Health Professionals Follow-up**

## 2.2. Classificações baseadas em evidência

### Por quantidade semanal

* **Uso de baixo risco:**

  * **Homens:** ≤ 14 doses/semana
  * **Mulheres:** ≤ 7 doses/semana
    (NIAAA, USPSTF, WHO)

* **Uso de risco moderado:**

  * 15–28 doses/sem (H)
  * 8–14 doses/sem (M)

* **Uso nocivo / dependência provável:**

  * > 28 doses/sem (H)
  * > 14 doses/sem (M)

### Por binge drinking (validado fortemente)

* **≥ 5 doses em 2h (homens)**
* **≥ 4 doses em 2h (mulheres)**

Fortíssima associação com mortalidade, eventos cardiovasculares, trauma e câncer.

## 2.3. Escalas validadas

Usadas em diretrizes e estudos randomizados:

* **AUDIT / AUDIT-C** — padrão-ouro para triagem.
* **CAGE** — simples, boa especificidade.

## 2.4. Tipos de bebida — evidência prática

A literatura mostra que **o que importa é o etanol**, não o tipo.
Raramente estudos estratificam por bebida com impacto clínico real.

---

# 3. EXERCÍCIO FÍSICO — AS QUANTIFICAÇÕES MAIS ROBUSTAS

Três metodologias têm **validação extensa** e são usadas em guidelines (ACSM, WHO, ACC/AHA):

---

## 3.1. MET-min/semana (a métrica mais científica)

**MET = Metabolic Equivalent Task**
1 MET = taxa metabólica basal
É usado em:

* WHO
* American Heart Association
* ACSM
* UK Biobank
* Coortes Nurses’ Health / HPFS / EPIC

### Classificação:

* **Sedentário:** < 500 MET-min/sem
* **Ativo:** 500–999 MET-min/sem (nível mínimo recomendado)
* **Alto:** ≥ 1000 MET-min/sem

Equivalências práticas:

* Caminhada rápida (4 METs) 150 min → 600 MET-min
* Corrida leve (8 METs) 60 min → 480 MET-min
* HIIT 10 min (10 METs) → 100 MET-min

---

## 3.2. Minutos semanais em intensidade moderada vs vigorosa

Usado em WHO, CDC, ACSM.

Recomendação validada:

* **150–300 min/semana** de exercício **moderado**, ou
* **75–150 min/semana** vigoroso,
* ou combinação **equivalente** (1 min vigoroso = 2 min moderado)

---

## 3.3. Escalas validadas

Aplicadas em estudos epidemiológicos:

* **IPAQ** (International Physical Activity Questionnaire) — o mais validado globalmente
* **GPAQ** (WHO)
* **Minnesota Leisure Time Physical Activity Questionnaire** — usado em grandes coortes
* **Accelerometers / Actigraphy** (padrão-ouro, usado em UK Biobank e estudos modernos)

---

# 4. O QUE **NÃO** TEM VALIDADE CIENTÍFICA

(Mas muitos médicos ainda anotam de forma simplista)

* “Fuma pouco/muito” → inválido
* “Bebe socialmente” → completamente inútil
* “Sedentário / ativo” sem quantificar → péssima reprodutibilidade
* “Faz academia” → sem intensidade/duração
* “Joga futebol no fim de semana” → não quantifica carga
* “Fuma narguilé ocasionalmente” → não padroniza equivalência

Essas expressões **não permitem modelagem, meta-análise, machine learning** nem entrada em guideline.

---

# 5. SE VOCÊ QUER AS MELHORES VARIÁVEIS PARA PRONTUÁRIO / RAG

A modelagem ideal (prática e científica) é:

## 5.1. Tabagismo

* status: nunca / ex / atual
* pack-years: número
* tipo: cigarro / charuto / narguilé / vape
* tempo de cessação (anos)

## 5.2. Etilismo

* doses/semana
* dias com binge (últimos 3 meses)
* AUDIT-C score

## 5.3. Exercício

* minutos semanais moderados
* minutos semanais vigorosos
* ou MET-min semanais
* * tipo de atividade para contextualizar (corrida, musculação, esportes)

Essa estrutura tem **alto valor preditivo**, aparece em **todas** as coortes importantes e permite:

* RAG com boa semântica
* Modelos de risco
* Comparações internacionais
* Análise longitudinal
* Intervenções estruturadas

---
A seguir está **o melhor FORMULÁRIO DE HÁBITOS DE VIDA** possível **para MVP**, com:

* **Máxima validade científica**
* **Altíssima eficiência para consulta rápida**
* **Campos que funcionam direto em UI/UX**
* **Compatível com cálculo automático (pack-years, METs, risco, AUDIT-C, binge)**
* **Totalmente estruturado e pronto para RAG, prontuário e dashboards**

**É curto, iterável e usa só variáveis com evidência forte.**
Perfeito para o Health Guardian / MEDNOTES.

---

# 🔥 FORMULÁRIO DE HÁBITOS DE VIDA — MVP *BASEADO EM EVIDÊNCIA*

## **1. Tabagismo**

(usa apenas variáveis de maior poder preditivo validadas em guideline)

**1.1. Status atual**

* ( ) Nunca fumou
* ( ) Ex-fumante
* ( ) Fumante atual

**1.2. Cigarros por dia (média histórica)**

* Número: ______

**1.3. Anos de tabagismo**

* Número: ______

> **Cálculo automático:** packYears = (cigarros/20) × anos

**1.4. Tempo desde cessação (se ex-fumante)**

* Em anos: ______

**1.5. Tipo**

* ( ) Cigarro industrializado
* ( ) Cigarro de palha
* ( ) Charuto / Cachimbo
* ( ) Narguilé
* ( ) Vape / E-cig

→ **Esses 5 itens dão a melhor curva dose-resposta científica existente.**

---

# **2. Etilismo**

(usa unidade padrão + AUDIT-C + binge, que são os 3 pilares validados)

## **2.1. Consumo semanal**

**Número de doses por semana** (1 dose = 10–14 g etanol)
→ Número: ______

## **2.2. Dias de binge no último mês**

* ( ) Nenhum
* ( ) 1 dia
* ( ) 2–3 dias
* ( ) ≥ 4 dias

**Definição:**
Homem ≥ 5 doses em 2h
Mulher ≥ 4 doses em 2h

## **2.3. AUDIT-C (validado)**

**A. Frequência de consumo**

* ( ) Nunca
* ( ) Mensal ou menos
* ( ) 2–4 vezes/mês
* ( ) 2–3 vezes/semana
* ( ) ≥ 4 vezes/semana

**B. Nº de doses num dia típico**

* ( ) 1–2
* ( ) 3–4
* ( ) 5–6
* ( ) 7–9
* ( ) ≥ 10

**C. Frequência de ≥ 6 doses em uma ocasião**

* ( ) Nunca
* ( ) < mensal
* ( ) Mensal
* ( ) Semanal
* ( ) Diária ou quase

→ **Cálculo automático do AUDIT-C**.

---

# **3. Exercício Físico**

(usa a forma mais evidenciada: minutos moderados/vigorosos → converte para MET-min)

## **3.1. Minutos por semana**

**A. Exercício Moderado (ex: caminhada rápida)**
→ Minutos/semana: ______

**B. Exercício Vigoroso (ex: corrida, HIIT)**
→ Minutos/semana: ______

**Conversão para MET-min (automático):**

* Moderado: 4 METs
* Vigoroso: 8 METs

**Cálculo automático:**
MET-min = (moderado × 4) + (vigoroso × 8)

## **3.2. Força / Musculação (OMS)**

* Dias/semana: ______

(OMS exige **≥ 2 dias/semana** → dado com validade para prevenção de sarcopenia e mortalidade.)

---

# **4. Sono**

(curto mas cientificamente forte)

* Horas/noite (média): ______
* Qualidade:

  * ( ) Boa
  * ( ) Regular
  * ( ) Ruim

O tempo de sono é forte preditor de mortalidade, ansiedade, depressão, diabetes e hipertensão.

---

# **5. Estresse / Saúde mental**

(versão ultracurta mas validada — *Perceived Stress Single Item*)

Como você classificaria seu estresse nas últimas 2 semanas?

* ( ) Baixo
* ( ) Moderado
* ( ) Alto

---

# **6. Nutrição — versão clínica, rápida e com evidência**

Não entra em detalhes, mas captura o principal preditor universal:

**Quantas porções de ultraprocessados/dia?**

* ( ) 0–1
* ( ) 2–3
* ( ) ≥ 4  *(limiar com forte evidência)*

**Quantas porções de frutas + vegetais/dia?**

* ( ) 0–1
* ( ) 2–3
* ( ) ≥ 4  *(ponto de corte validado para redução de mortalidade)*

---

# 🔥 VERSÃO COMPLETA EM **UMA TELA** (para seu app)

### **TABAGISMO**

* Status: nunca / ex / atual
* Cigarros/dia: ___
* Anos de uso: ___
* Tempo de cessação: ___
* Tipo: cigarro / palha / charuto / narguilé / vape

### **ETILISMO**

* Doses/semana: ___
* Dias de binge/mês: ___
* AUDIT-C (3 perguntas-padrão)

### **EXERCÍCIO**

* Moderado (min/sem): ___
* Vigoroso (min/sem): ___
* Musculação (dias/sem): ___

### **SONO**

* Horas/noite: ___
* Qualidade: boa / regular / ruim

### **NUTRIÇÃO**

* Ultraprocessados/dia: 0–1 | 2–3 | ≥4
* Frutas/vegetais/dia: 0–1 | 2–3 | ≥4

### **ESTRESSE**

* Baixo | Moderado | Alto

---

# 🔧 Se quiser, eu posso gerar agora:

* **O JSON Schema completo** para front/backend
* **O formulário em React shadcn/UI**
* **A versão FHIR mapeada (Observation/Questionnaire)**
* **O modelo de dados no seu Postgres**
* **A automação RAG para interpretar esses hábitos e sugerir condutas**

O que prefere como próximo passo?
