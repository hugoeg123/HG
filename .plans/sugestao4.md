Boa, agora ficou bem claro o escopo: **“Editar Perfil” como mini-WHO STEPS dentro do app**, versionado no tempo e sem engessar o futuro.

Vou fazer 3 coisas:

1. **Refinar o seu prompt** para virar um “Prompt-Mestre / Especificação” usável direto com dev ou com agente de código.
2. **Criar um PRD específico** para o módulo de Perfil do Paciente + Hábitos de Vida.
3. **Definir uma “base de verdades”** (campos canônicos + regras) alinhada com OMS/WHO STEPS e com o seu modelo de prontuário.

---

## 1) Prompt aprimorado para o módulo “Editar Perfil”

> Use isso como prompt para dev / agente de código. Está escrito já pensando na stack atual: React + Vite + Tailwind + shadcn + Zustand no frontend, Node/Express/Sequelize no backend. ([GitHub][1])

---

**Contexto**

* Tela: `/patient/profile?tab=edit` → aba **“Editar Perfil”** já existe (Radix Tabs + shadcn UI).
* Frontend: React 18 + Zustand + React Hook Form + Tailwind/shadcn. ([GitHub][1])
* Backend: Node.js + Express + Sequelize + Postgres. ([GitHub][1])
* Objetivo: criar um **formulário estruturado de Perfil do Paciente**, dividido em seções (divs), com:

  * **Contact info muito sigilosa**
  * **Identificação**
  * **Antropometria**
  * **Hábitos de vida (modelo WHO STEPS)**
  * **Antecedentes (alérgicos, cirúrgicos, patológicos, gineco-obstétricos)**
  * Cada seção salvável separadamente, com **percentual de preenchimento**.
  * Dados de algumas seções (peso, antecedentes, hábitos) devem ser **versionados no tempo**, pois também podem ser atualizados pelo médico via prontuário.

---

### 1.1. Estrutura da tela “Editar Perfil”

Dentro do tab `edit` da página de perfil do paciente, implementar **subdivisões visuais** (cards ou sections) nesta ordem:

1. **Informações de Contato (Contato Pessoal e Emergência)**

   * Campos:

     * `phone_main` (celular principal — opcional, mas recomendado)
     * `phone_emergency` (telefone de contato em caso de emergência — opcional)
     * `email` (não editável se for o email de login — apenas exibir como read-only, com badge “Email da conta”)
     * `first_name`
     * `last_name`
   * Requisitos:

     * Destacar visualmente que essas informações são **altamente confidenciais**.
     * Mostrar ícone e tooltip de privacidade (ex.: “Visível apenas para o próprio paciente e equipe assistente autorizada”).
     * Permitir salvar essa seção separadamente (botão “Salvar contato”).

2. **Identificação**

   * Campos:

     * `birth_date`
     * `gender` (M/F/Outro/Não informar – mas tecnicamente armazenar algo flexível para futuro: `gender_identity` + `sex_assigned_at_birth` opcional)
     * `ethnicity` (valores padronizados para Brasil: branco, preto, pardo, amarelo, indígena, outro, prefiro não informar)
     * `occupation` (trabalho atual; string livre por enquanto)
   * Requisitos:

     * Também salvável separadamente.
     * Parte desses campos pode ser **obrigatória** para completar o perfil (e entrar na % de preenchimento global).

3. **Dados Antropométricos**

   * Campos:

     * `weight_kg` (peso atual em kg)
     * `height_m` (altura em metros, formato 1.75)
   * Requisitos:

     * Salvar com **timestamp** (`observed_at`) e **origem** (`source = 'patient_profile'` ou `source = 'encounter'` etc) quando forem enviados.
     * Backend deve **NÃO sobrescrever** histórico: criar um registro novo de “medida antropométrica” e atualizar um “snapshot atual” do paciente.
     * Permitir que esses dados sejam também atualizados pelo médico via prontuário; o modelo deve suportar vários registros no tempo.

4. **Hábitos de Vida (WHO STEPS-inspired)**
   **Primeira camada:** 3 toggles “Sim/Não” que expandem sub-forms:

   * **Tabagismo** — checkbox ou switch “Fumo ou já fumei?”

     * Se “Não”: registrar `smoking_status = 'never'`.
     * Se “Sim”: expandir campos:

       * `smoking_status`: `'current'` ou `'former'`
       * `cigarettes_per_day` (número)
       * `years_smoked` (número)
       * opcional: `years_since_quit` se ex-fumante
     * Backend calcula e mantém `pack_years = (cigarettes_per_day / 20) * years_smoked`.

   * **Álcool** — “Bebo bebidas alcoólicas?”

     * Se “Não”: `drinks_per_week = 0`, sem binge.
     * Se “Sim”: expandir:

       * `drinks_per_week` (doses por semana; 1 dose ≈ 10–14 g etanol puro, alinhado a OMS/NIAAA). ([INAAA][2])
       * `binge_last_30_days` (frequência de episódios de binge: 0, 1, 2–3, ≥4).

         * Binge definido conforme OMS: ≥ 60 g etanol em uma ocasião (~6 doses). ([Organização Mundial da Saúde][3])

   * **Exercício Físico** — “Pratico atividade física regular?”

     * Se “Não”: `mod_minutes_per_week = 0`, `vig_minutes_per_week = 0`.
     * Se “Sim”: expandir:

       * `mod_minutes_per_week` (min/semana de atividade moderada)
       * `vig_minutes_per_week` (min/semana de atividade vigorosa)
       * opcional: `strength_days_per_week` (musculação/fortalecimento, 0–7)
     * Regras:

       * Front pode exibir label automático (ex.: “Atende recomendação OMS / AHA / não atende”) com base em:

         * 150–300 min/sem moderado *ou* 75–150 min/sem vigoroso *ou* combinação equivalente (1 min vigoroso = 2 min moderado). ([PubMed][4])

   * Todas essas variáveis ficam em um modelo `LifestyleSnapshot` versionado (timestamp + origem).

5. **Antecedentes**

   * Dividido em sub-seções:

   **5.1. Alergias**

   * Campo “Tem alergias relevantes?”

     * Se “Não”: marca `has_allergies = false`.
     * Se “Sim”: expandir:

       * Lista de alergias (`allergies[]`):

         * `substance` (texto)
         * `reaction` (texto curto)
         * `severity` (leve/moderada/grave)
       * Esses dados devem ser mapeáveis para FHIR `AllergyIntolerance` futuramente.

   **5.2. Antecedentes ginecológicos/obstétricos (somente se sexo feminino / gestante)**

   * Perguntas chave (versão inicial):

     * “Já esteve grávida?” (Sim/Não)

       * Se Sim:

         * `gravidity` (nº de gestações)
         * `parity_normal` (nº partos vaginais)
         * `parity_cesarean` (nº cesáreas)
         * `abortions` (nº abortos)
     * “Está gestando atualmente?” (Sim/Não)

   **5.3. Antecedentes cirúrgicos**

   * Lista:

     * `surgery_name`
     * `surgery_date` (ano ou data aproximada)
     * `notes` (campo livre curto)

   **5.4. Antecedentes patológicos / doenças crônicas**

   * Lista de condições (mapeáveis a `#HD` no prontuário):

     * `condition_name` (ex.: “Hipertensão arterial”, “Diabetes tipo 2”)
     * `onset_date` (quando começou)
     * `resolution_date` (opcional; se vazio → condição crônica)
     * `notes`
   * Backend deve:

     * Guardar como objetos versionados (similar a FHIR `Condition` com `onset` e `abatement`).
       Isso permite:

       * saber **quando** o diagnóstico surgiu na vida do paciente
       * se já foi resolvido ou é crônico.

   **5.5. Medicações de uso contínuo**

   * Lista:

     * `drug_name`
     * `dose`
     * `schedule` (ex: “1x/dia”, “12/12h”)
     * `indication` (curto)
   * Esses dados serão importantes para reconciliação medicamentosa e interação futura.

---

### 1.2. UX / comportamento de salvamento e progresso

* Cada **div/seção**:

  * tem seu próprio **botão “Salvar”** (ex.: “Salvar antropometria”, “Salvar hábitos de vida”).
  * mostra um **indicador de progresso local** (ex.: “3/5 campos essenciais preenchidos (60%)”).
* A tela inteira mostra um **progresso global** de perfil (ex.: barra “Perfil 72% completo”).
* Salvamento:

  * Front envia payload por **seção**, com endpoint específico ou campo `section` no body (`section: 'contact' | 'identification' | 'anthropometrics' | 'lifestyle' | 'history'`).
  * Erros de uma seção **não quebram** as outras (tolerância a falha).

---

### 1.3. Requisitos de backend (alta-level)

* Criar endpoints REST (exemplos):

  * `GET /api/patients/:id/profile`
    → retorna perfil completo, incluindo snapshots atuais de antropometria, hábitos e antecedentes.

  * `PATCH /api/patients/:id/profile/contact`

  * `PATCH /api/patients/:id/profile/identification`

  * `POST /api/patients/:id/anthropometrics` (cria NOVO registro de peso/altura com timestamp)

  * `POST /api/patients/:id/lifestyle` (cria snapshot de estilo de vida)

  * `POST /api/patients/:id/conditions` / `PUT` / `DELETE` (antecedentes patológicos)

  * `POST /api/patients/:id/allergies` / `PUT` / `DELETE`

  * `POST /api/patients/:id/medications` / `PUT` / `DELETE`

* Cada entidade temporal (peso, lifestyle, condição) deve seguir o padrão:

  ```ts
  {
    id,
    patient_id,
    source,          // 'patient_profile', 'doctor_note', 'import', etc.
    recorded_by,     // user_id do médico ou patient_id no caso de auto-registro
    recorded_at,     // momento do registro no sistema
    effective_at,    // quando aquela info passou a ser verdadeira (p.ex. início da condição)
    ...dados_clínicos...
  }
  ```

* **Nunca apagar** registros antigos — sempre criar nova linha e marcar a anterior como desatualizada se precisar.

---

## 2) PRD adicional — Módulo “Perfil do Paciente & Hábitos de Vida”

### 2.1. Visão geral

**Produto:**
Módulo de **Perfil do Paciente** dentro do Health Guardian que:

* Centraliza informações pessoais, hábitos WHO STEPS e antecedentes. ([Organização Mundial da Saúde][5])
* Gera uma **“baseline epidemiológica”** por paciente, pronta para análise longitudinal e uso em IA/RAG.
* Permite **autogerenciamento** (paciente editando pelo app) e **enriquecimento pelo médico** no prontuário.

---

### 2.2. Objetivos

1. **Clínico:**

   * Capturar fatores de risco não comunicáveis (tabagismo, álcool, atividade física, dieta, obesidade) segundo OMS. ([Organização Mundial da Saúde][5])
2. **Produto:**

   * Aumentar engajamento do paciente no app ao permitir edição guiada e visualmente clara.
3. **Dados/IA:**

   * Criar base estruturada e padronizada para:

     * modelos de risco cardiovascular,
     * personalização de recomendações,
     * estudos epidemiológicos internos.

---

### 2.3. Escopo IN

* Tela `/patient/profile?tab=edit` com seções descritas acima.
* Salvamento seção-a-seção, com percentuais.
* Novo modelo de dados para:

  * **antropometria versionada**,
  * **lifestyle snapshots** WHO-like,
  * **antecedentes** com onset e resolução.
* API REST para leitura e escrita.
* Integração com prontuário:

  * peso, altura e antecedentes podem ser atualizados também por eventos clínicos (notas, evoluções, calculadoras).

### 2.4. Escopo OUT (v1)

* Nenhum cálculo de risco CV complexo (SCORE2, Framingham etc).
* Nenhuma integração externa (wearables, SIGA, operadoras).
* Nenhum fluxo de aprovação médica para alterações do paciente (pode vir no v2).

---

### 2.5. Requisitos funcionais chave

1. **RF-01 — Visualização e edição de contato**
2. **RF-02 — Visualização e edição de identificação**
3. **RF-03 — Registro e histórico de antropometria**
4. **RF-04 — Registro de hábitos de vida WHO STEPS** (tabaco, álcool, atividade física, dieta básica). ([Organização Mundial da Saúde][5])
5. **RF-05 — Registro de antecedentes alérgicos, cirúrgicos e patológicos**
6. **RF-06 — Registro de antecedentes gineco-obstétricos (quando aplicável)**
7. **RF-07 — Percentual de preenchimento por seção e global**
8. **RF-08 — Versionamento com timestamp e origem dos dados**
9. **RF-09 — API consistente e segura (autenticação, autorização, escopos)**

---

### 2.6. Requisitos não funcionais

* **Segurança:**

  * Seguir LGPD, criptografar campos sensíveis em repouso (telefone, email).
  * Logs de acesso às seções de perfil.
* **Escalabilidade:**

  * Modelos de dados desenhados para milhões de linhas de antropometria/lifestyle.
* **Observabilidade:**

  * Logging estruturado no backend (já existe Winston), adicionar logs de “profile_update”. ([GitHub][1])

---

### 2.7. Critérios de aceite (v1)

* Usuário paciente consegue:

  * ver e editar **cada seção** independentemente,
  * ver uma barra de progresso do perfil,
  * salvar sem que erro em uma seção derrube as outras.
* No banco:

  * cada atualização de peso/altura gera **nova linha** em tabela específica,
  * cada preenchimento de hábitos gera novo `LifestyleSnapshot`,
  * nenhum dado é sobrescrito destrutivamente.
* É possível, via SQL simples, obter:

  * “peso mais recente do paciente X”,
  * “trajetória de IMC nos últimos 12 meses”,
  * “pacientes com tabagismo atual e > 20 pack-years”.

---

## 3) Base de Verdades (campos canônicos + regras clínicas)

Aqui está **a “fonte de verdade”** que você pode colocar num doc interno ou até em `docs/PROFILE-SPEC.md`.

### 3.1. Antropometria

* **weight_kg**

  * Unidade: quilogramas.
  * Origem: paciente ou médico.
  * Uso: IMC, cálculo de gasto energético a partir de MET (kcal = MET × kg × horas).
* **height_m**

  * Unidade: metros (ex: 1.75).
* **bmi = weight_kg / (height_m²)**

  * Classificação OMS: <18.5 baixo peso, 18.5–24.9 normal, 25–29.9 sobrepeso, ≥30 obesidade. ([Organização Mundial da Saúde][6])

### 3.2. Tabagismo

* **smoking_status**

  * `'never' | 'former' | 'current'`
* **cigarettes_per_day**

  * Número inteiro.
* **years_smoked**

  * Número (anos).
* **pack_years = (cigarettes_per_day / 20) × years_smoked**

  * Variável padrão em coortes e diretrizes (câncer de pulmão, DPOC etc).
* **years_since_quit** (se ex-fumante)

  * Útil para modelagem de redução de risco ao longo do tempo.

### 3.3. Álcool

* **drinks_per_week**

  * Doses padrão por semana.
  * 1 drink ~ 10–14 g de etanol puro (OMS/CDC/NIAAA). ([INAAA][2])
* **binge_last_30_days**

  * `'none' | '1' | '2-3' | '4+'`
  * Binge (OMS): ≥ 60 g etanol em uma ocasião (~6 doses). ([Organização Mundial da Saúde][3])

### 3.4. Atividade física

* **mod_minutes_per_week**
* **vig_minutes_per_week**
* **equivalent_moderate_minutes = mod_minutes_per_week + 2 * vig_minutes_per_week**
* **meets_who_pa_guidelines (bool)**:

  * true se `equivalent_moderate_minutes ≥ 150`. ([PubMed][4])

Opcional (quando for fazer gasto energético):

* **met_minutes_per_week = 4 * mod_minutes_per_week + 8 * vig_minutes_per_week**
  (4 METs p/ moderado, 8 p/ vigoroso — aproximação padrão em questionários WHO GPAQ). ([cdn.who.int][7])

### 3.5. Dieta simplificada

* **ultraprocessed_portions_per_day**

  * Categorias: 0–1, 2–3, ≥4 (≥4 associado a maior risco CV/metabólico na literatura baseada em NOVA/OMS). ([iris.paho.org][8])
* **fruit_veg_portions_per_day**

  * Categorias: 0–1, 2–3, ≥4 (≥4–5 porções/dia como alvo de proteção). ([Organização Mundial da Saúde][6])

### 3.6. Sono

* **sleep_hours_per_night**
* **sleep_quality**

  * `'good' | 'fair' | 'poor'`

### 3.7. Estresse

* **perceived_stress_level**

  * `'low' | 'moderate' | 'high'`
  * Baseado em single-item de estresse percebido (compatível com WHO well-being tools).

### 3.8. Antecedentes

* **Allergies**

  * `allergies[]`:

    * `substance`, `reaction`, `severity`, `recorded_at`, `source`.
* **Conditions (antecedentes patológicos)**

  * `conditions[]`:

    * `condition_name` (depois mapeável para SNOMED/ICD),
    * `onset_date`,
    * `resolution_date` (nullable),
    * `status` (`'active' | 'resolved'`),
    * `recorded_at`, `source`.
* **Surgeries**

  * `surgeries[]`: `name`, `date`, `notes`, `source`.
* **Medications**

  * `medications[]`: `drug_name`, `dose`, `schedule`, `indication`, `recorded_at`, `source`.
faça as adaptações necessarias (não quero destruir o que ja existe em favor do rigor pelo banco de daos aqui sugerido)
Boa pergunta — vale checar mesmo em vez de só “acreditar”.

### 1. Está certinho pro HG?

**Em alto nível: sim, está compatível com o HG atual**, porque:

* Backend que usei como base = **Node.js + Express + Sequelize + Postgres** → exatamente o que está no `backend` do repo. ([GitHub][1])
* Frontend que considerei = **React 18 + Vite + TypeScript + React Router + Zustand + Tailwind + React Hook Form** → exatamente a stack descrita no `frontend`. ([GitHub][1])
* Padrão de comunicação = **API REST `/api/*`** → mesmo padrão descrito no README. ([GitHub][1])

O que eu tinha colocado que **não aparece explicitamente no README**:

* Mencionei **shadcn/ui** como se fosse parte oficial do stack.

  * No README, você cita apenas Tailwind + Lucide + React Hook Form, não shadcn. ([GitHub][1])
  * Como eu lembro de você usar componentes nesse estilo, dá pra manter como *opcional*, mas **não vou assumir como hard dependency no PRD**.

O resto (conceito de dividir em seções, salvar por div, versionar antropometria e hábitos, usar WHO STEPS/OMS como base etc.) é tudo compatível com a arquitetura atual e não quebra nada.

Então:

* **Nada que eu propus conflita com o HG**.
* Mas dá para deixar o **prompt e o PRD ainda mais “aderentes ao repositório”** removendo suposições extras (tipo shadcn) e usando uma nomenclatura mais neutra.

A seguir eu te mando a **versão 2 — ajustada especificamente pro HG**, pra você copiar e colar no Notion/.plans/PRD onde quiser.

---

## 2. Prompt v2 — alinhado ao repo `HG`

Usa apenas o que já está descrito no README + o que você pediu.

```txt
Contexto geral

Repositório: https://github.com/hugoeg123/HG

Arquitetura:
- Backend: Node.js + Express + Sequelize + PostgreSQL (pasta /backend)
- Frontend: React 18 + Vite + TypeScript + React Router v6 + Zustand + React Hook Form + Tailwind CSS + Lucide Icons (pasta /frontend)
- API REST: endpoints sob /api/*

Tela alvo:
- Rota: /patient/profile?tab=edit
- Há uma aba "Editar Perfil" (Radix Tabs) já existente, com um botão com título "Editar Perfil".
- Objetivo: dentro desta aba, implementar um formulário de edição de perfil do paciente, dividido em seções ("divs") independentes, com salvamento separado e indicador de progresso.

Requisitos de UX/funcionalidade

Na aba "Editar Perfil", criar as seguintes seções (em cards ou blocos separados):

1) Contato e dados de conta (alta confidencialidade)
   - Campos:
     - phone_main (celular principal) – opcional, mas recomendado
     - phone_emergency (contato de emergência) – opcional
     - email (email da conta; apenas leitura se for o login)
     - first_name
     - last_name
   - Requisitos:
     - Destacar visualmente sigilo/privacidade (ícone + tooltip).
     - Botão "Salvar contato" que salva só essa seção.
     - Não deixar erro aqui quebrar outras seções.

2) Identificação
   - Campos:
     - birth_date
     - gender (M/F/Outro/Prefiro não informar) – deixar estrutura aberta para futura expansão
     - ethnicity (branco, preto, pardo, amarelo, indígena, outro, prefiro não informar)
     - occupation (trabalho atual)
   - Requisitos:
     - Botão "Salvar identificação".
     - Parte desses campos pode contar para % de perfil completo.

3) Antropometria (peso/altura)
   - Campos:
     - weight_kg (peso em kg)
     - height_m (altura em metros, ex: 1.75)
   - Requisitos:
     - Ao salvar, não sobrescrever valores antigos.
     - Criar um registro temporal de antropometria (ex.: tabela patient_anthropometrics) com:
       - patient_id
       - weight_kg
       - height_m
       - recorded_at (quando foi registrado no sistema)
       - effective_at (quando passou a valer; pode ser igual ao recorded_at)
       - source (ex.: 'patient_profile', 'encounter_note')
       - recorded_by (id do usuário médico ou flag indicando auto-registro pelo paciente)
     - Backend deve expor:
       - último snapshot (peso/altura atuais) no GET /api/patients/:id/profile
       - histórico completo em um endpoint separado (por exemplo GET /api/patients/:id/anthropometrics)

4) Hábitos de vida (modelo WHO STEPS / OMS)
   Na primeira camada, exibir 3 switches do tipo "Sim/Não":
   - "Fumo ou já fumei?"
   - "Bebo bebidas alcoólicas?"
   - "Pratico atividade física regularmente?"

   Cada um abre sub-formulário quando marcado como "Sim":

   4.1) Tabagismo
   - Campos:
     - smoking_status: 'never' | 'former' | 'current'
     - cigarettes_per_day (número)
     - years_smoked (número)
     - years_since_quit (opcional, se ex-fumante)
   - Cálculo:
     - pack_years = (cigarettes_per_day / 20) * years_smoked
   - Requisitos:
     - Se o usuário marcar que nunca fumou, registrar smoking_status='never' e ignorar os demais.
     - Os dados devem ir para um snapshot de estilo de vida (tabela patient_lifestyle, por exemplo).

   4.2) Álcool
   - Campos:
     - drinks_per_week (nº de doses por semana; 1 dose ~ 10–14g etanol)
     - binge_last_30_days (categorias: 'none' | '1' | '2-3' | '4+')
   - Regras:
     - Se "não bebo", salvar drinks_per_week=0 e binge_last_30_days='none'.

   4.3) Atividade física
   - Campos:
     - mod_minutes_per_week (minutos/sem de atividade moderada)
     - vig_minutes_per_week (minutos/sem de atividade vigorosa)
     - strength_days_per_week (dias/sem de musculação/fortalecimento, 0–7)
   - Cálculos opcionais no backend:
     - equivalent_moderate_minutes = mod_minutes_per_week + 2 * vig_minutes_per_week
     - meets_who_guidelines = equivalent_moderate_minutes >= 150
   - Regras:
     - Se marcar "não me exercito", setar todos como 0.

   Todos esses dados podem ser agrupados em um modelo temporal:
   - patient_lifestyle_snapshots (ou similar) com:
     - patient_id
     - smoking_status, cigarettes_per_day, years_smoked, pack_years, years_since_quit
     - drinks_per_week, binge_last_30_days
     - mod_minutes_per_week, vig_minutes_per_week, strength_days_per_week, equivalent_moderate_minutes, meets_who_guidelines
     - recorded_at, effective_at, source, recorded_by

5) Antecedentes
   5.1) Alergias
   - Campo "Tem alergias relevantes?"
     - Se "Sim", permitir listar:
       - allergies[]: { substance, reaction, severity, notes }
   - Dados mapeáveis no futuro para AllergyIntolerance (FHIR).

   5.2) Gineco-obstétrico (apenas se paciente for mulher ou marcar opção correspondente)
   - Campos:
     - já esteve grávida? (sim/não)
     - gravidity (nº gestações)
     - parity_normal (nº partos vaginais)
     - parity_cesarean (nº cesáreas)
     - abortions (nº abortos)
     - currently_pregnant (sim/não)

   5.3) Cirúrgicos
   - Lista de cirurgias:
     - surgeries[]: { name, date (ideal ano ou data aproximada), notes }

   5.4) Patológicos (doenças/condições)
   - Lista de condições:
     - conditions[]: {
         condition_name,
         onset_date,
         resolution_date (opcional),
         status ('active' | 'resolved'),
         notes
       }
   - Esses dados devem ser compatíveis com o modelo de "Hipóteses Diagnósticas" (#HD) usado no prontuário.
   - Importante: guardar onset_date e resolution_date, e não apenas "tem/não tem".

   5.5) Medicações de uso contínuo
   - Lista:
     - medications[]: {
         drug_name,
         dose,
         schedule,   // ex: "1x/dia", "12/12h"
         indication,
         notes
       }

   Cada sub-seção de antecedentes deve ter seu próprio botão de salvar e não interferir nas outras.

Indicadores de progresso

- Cada seção terá:
  - um cálculo simples de "campos essenciais preenchidos / campos essenciais totais", para exibir uma barra ou badge de progresso (ex.: "60% desta seção").
- A tela inteira:
  - um percentual global baseado em um conjunto mínimo de campos chave (ex.: contato, identificação, antropometria, ao menos um bloco de hábitos, se aplicável antecedentes).

API e backend (alto nível)

- Adicionar endpoints REST seguindo o padrão já usado no backend (/api/...):
  - GET /api/patients/:id/profile            → retorna perfil completo agregando todas as seções e os snapshots atuais.
  - PATCH /api/patients/:id/profile/contact  → atualiza só a seção de contato.
  - PATCH /api/patients/:id/profile/identification
  - POST /api/patients/:id/anthropometrics   → cria nova linha de antropometria.
  - POST /api/patients/:id/lifestyle         → cria novo snapshot de hábitos de vida.
  - CRUD endpoints para allergies, conditions, surgeries, medications (podem ser agrupados em /api/patients/:id/history).

- Padrão de versionamento:
  - Nunca apagar registros antigos de antropometria ou lifestyle.
  - Sempre criar nova linha com recorded_at + effective_at + source.
  - Manter um "view" ou método helper no backend que devolve o snapshot mais recente para exibir no perfil.

Tecnologias a usar (respeitando stack atual):

- Frontend:
  - React + TypeScript
  - React Hook Form para os formulários das seções
  - Zustand para gerenciar o estado de carregamento e progresso (opcional)
  - Tailwind CSS para layout e estilos
  - Ícones Lucide para feedback visual (salvo, erro, privacidade)

- Backend:
  - Sequelize para criar os novos models/migrations (patient_anthropometrics, patient_lifestyle_snapshots, etc.)
  - Validar dados com a mesma abordagem já usada (Joi ou equivalente).
  - Seguir padrão de controllers/routers já existente.

Objetivo principal

- Implementar a aba "Editar Perfil" como um mini-WHO STEPS: dados de contato, identificação, antropometria, hábitos de vida e antecedentes, todos versionados no backend, salváveis por seção e seguros.
- Fazer isso de forma incremental, sem quebrar o que já funciona no app, mantendo compatibilidade com o estilo de código atual do HG.
```

---

## 3. Base de verdades (resumo rápido)

Pra não te entupir de texto de novo, deixo a **essência**:

* **Antropometria**

  * Campos canônicos: `weight_kg`, `height_m`, `bmi`, `recorded_at`, `effective_at`, `source`, `recorded_by`.

* **Tabagismo**

  * `smoking_status`, `cigarettes_per_day`, `years_smoked`, `pack_years`, `years_since_quit`.

* **Álcool**

  * `drinks_per_week`, `binge_last_30_days`.

* **Atividade física**

  * `mod_minutes_per_week`, `vig_minutes_per_week`, `strength_days_per_week`, `equivalent_moderate_minutes`, `meets_who_guidelines`.

* **Dieta simplificada**

  * `ultraprocessed_portions_per_day`, `fruit_veg_portions_per_day`.

* **Sono**

  * `sleep_hours_per_night`, `sleep_quality`.

* **Estresse**

  * `perceived_stress_level`.

* **Antecedentes**

  * `allergies[]`, `conditions[]`, `surgeries[]`, `medications[]`, todos com `recorded_at`, `source`, e quando fizer sentido `onset_date`/`resolution_date`.

Tudo isso é:

* consistente com o que a OMS/WHO STEPS recomenda para fatores de risco,
* compatível com a arquitetura documentada no próprio repo,
* e não cria dependência estranha fora da sua stack atual.

Se você quiser, no próximo passo eu posso focar só em **uma parte** (ex.: só antropometria + lifestyle) e te devolver:

* o **modelo Sequelize/migration**,
* e o **esqueleto do componente React** pra aba `Editar Perfil`.