perfeito. vou refinar só o **#1 – Vancomicina (adultos)**, com foco total em **implementação robusta no HG** (o que colocar na engine, quando disparar alertas, como monitorar e como lidar com IHD/CRRT). Trago regras clínicas rastreáveis + sugestões de UI + blocos de lógica prontos p/ codar.

---

# Vancomicina — especificação de implementação (adultos)

## 1) Alvos terapêuticos e “modos” de monitorização

* **Padrão**: otimizar **AUC24/MIC = 400–600 mg·h/L** para infecções graves por MRSA; estimar AUC via Bayes (1–2 níveis) **ou** por método de 2 níveis (pós-infusão + vale no mesmo intervalo). No produto: “Modo AUC (recomendado)”.
* **Fallback (“modo vale”)** quando AUC não estiver disponível/viável: use vales como **proxy** (p.ex., 10–20 mg/L em geral; 15–20 mg/L se SNC/meningite), com mensagem clara de que é estratégia de 2ª linha por maior nefrotoxicidade.

> **Sinalização no UI**
> • Campo “Alvo” predefinido para **AUC 400–600**; se o usuário alternar para “vale”, exibir faixas por indicação e um aviso: “Recomendado migrar para AUC”.

---

## 2) Dose de ataque (LD) — pesos, arredondamento, infusão

* **LD**: 20–35 mg/kg pelo **peso atual (TBW)**; **arredondar** para múltiplos de **250 mg**; **dose inicial máx. 2 g** (cap institucional pode ser >2 g se política local permitir). **Infundir ≥60 min por 1.000 mg** (ou ≤10 mg/min) para reduzir reação de infusão.

> **No componente**: slider 20–35 mg/kg, “round 250 mg”, “cap inicial 2 g”, e cálculo automático do tempo mínimo de infusão (≥1 g/h; ou “≤10 mg/min” no help).

---

## 3) Manutenção inicial por função renal (estável)

Use **TBW para dosear vancomicina**; para **intervalar** por depuração, calcular **CrCl (Cockcroft–Gault)** com **IBW/AdjBW** conforme obesidade (só para o **CrCl**, não para a dose). Ofereça **duas leituras** no UI: TFGe (CKD-EPI 2021) “para contexto” e **CrCl (CG)** “para intervalo”.

Mapa inicial simplificado (ajustar por níveis/AUC depois):

* **CrCl > 90 mL/min**: 15 mg/kg **q8–12h**.
* **CrCl 50–90**: 10–20 mg/kg **q12h**.
* **CrCl 30–50**: 10–15 mg/kg **q12h** ou 20 mg/kg **q24h**.
* **CrCl < 30 / AKI**: LD, depois **dose guiada por nível/AUC** (sem fixar intervalo).

> **Regras de segurança**: não iniciar acima de **2 g/dose** ou **\~4,5 g/dia** sem justificativa; disparar alerta se co-administração nefrotóxica (ex.: piperacilina/tazobactam) e exigir nível precoce (24–48 h).

---

## 4) Quando e como dosar níveis

* **Modo AUC (preferido)**: orientar **1º nível** nas **primeiras 24–48 h** (Bayes aceita nível aleatório pós-distribuição); repetir após ajustes e depois conforme estabilidade renal.
* **Modo vale (fallback)**: em regime intermitente fora de diálise, coletar **vale** próximo ao estado de equilíbrio (política local; acrescente tooltip orientando colher precocemente se risco de sub/superexposição).

---

## 5) Hemodiálise intermitente (IHD)

* **LD**: 20–25 mg/kg (TBW).
* **Meta operacional**: **pré-HD 15–20 mg/L**.
* **Conduta prática** (implemente como “assistente de dose pós-HD”):

  1. **Colher nível pré-HD** (ou **4 h pós-HD** como alternativa válida local). 2) Se **≤20 mg/L**, **re-dose** (p.ex., 500–1.000 mg pós-HD; calibrável por protocolo). 3) Se **>20 mg/L**, **pular** re-dose e reavaliar no próximo ciclo. ([Stanford Medicine][1])

> **UI**: seletor “IHD (sim/não)”; se “sim”, mostrar **wizard**: “nível pré-HD → sugestão de re-dose pós-HD” e agendar automaticamente a **próxima coleta** (pré-HD seguinte). ([Stanford Medicine][1])

---

## 6) CRRT (CVVHD/CVVHDF)

* **LD**: 20–25 mg/kg (TBW).
* **Manutenção inicial**: **10–15 mg/kg q24h**, com **ajuste por AUC/nível** conforme intensidade do efluente e função renal residual. (Fluxos de 1–2 L/h de efluente costumam se comportar como CrCl \~30–50 mL/min; efluentes maiores exigem doses/frequências maiores).

> **UI**: seletor “CRRT” → campo “efluente (L/h)” opcional; se >2 L/h, exibir aviso “pode exigir ↑dose/↑frequência; monitore AUC precoce”.

---

## 7) Infusão contínua (casos selecionados)

* **Quando considerar**: **ARF/ARC** (CrCl >130 mL/min) com alto risco de subexposição.
* **Meta**: **nível aleatório 17–25 mg/L às 24 h** (como *proxy* de AUC terapêutica); ajustar **TDD proporcionalmente** (TDD nova = TDD atual × alvo / nível medido).

---

## 8) Regras de produto/engine (pseudocódigo)

```ts
// Entradas mínimas
sexo, idade, altura, peso_kg (TBW), SCr_mg_dL,
renal_mode ∈ {stable, aki_unstable, ihd, crrt},
indication ∈ {mrsa_invasive, cns_meningitis, other},
monitoring ∈ {AUC, trough},
crrt_effluent_L_h? (se crrt)

// Pesos para Cockcroft–Gault (só p/ intervalo)
IBW = (sexo=='M'? 50:45.5) + 2.3*(altura_pol - 60);
AdjBW = IBW + 0.4*(TBW - IBW);
peso_CG = (TBW<IBW)? TBW : (BMI>=30? AdjBW : IBW);

// CrCl (mL/min) p/ intervalo; TFGe CKD-EPI 2021 só para display
CrCl = ((140-idade)*peso_CG) / (72*SCr) * (sexo=='F'?0.85:1);

// Dose de ataque
LD_mg = clamp(round250(TBW* (gravidade? 25-30 : 20-25)), max_dose_por_política);

// Branch renal
if (renal_mode=='ihd') { alvo = 'pre-HD 15-20'; wizard_HD(); }
else if (renal_mode=='crrt') { MD = 10-15 mg/kg q24h; ajustar_por_AUC(); }
else if (renal_mode=='aki_unstable' || CrCl<30) { dar_LD; planejar_nível_precocemente; re-dose guiado por AUC/vale; }
else { // estável
  plan = tabela_por_CrCl(CrCl); // q8–12h / q12h / q24h (vide §3)
}

// Monitorização
if (monitoring=='AUC') { pedir_nível 24–48h; target_AUC=400–600; }
else { pedir_vale conforme política local; }

infusão_min = max(60, (dose_mg/1000)*60); // ≥60 min por 1g
```

---

## 9) UI/UX — sugestões rápidas

* **Tabs “Rápido (vale)”** e **“Avançado (AUC)”**. Default no **AUC** com banner educativo.
* **IHD/CRRT toggles** com micro-assistentes (HD: “pré-HD → dose pós-HD”; CRRT: campo efluente e lembrete de AUC precoce). ([Stanford Medicine][1])
* **Tooltips**: “Por que TBW para dose?”, “Por que CG p/ intervalo?”, “Por que AUC 400–600?” — linkando a Stanford e à diretriz.
* **Alertas**: TDD >4–4,5 g/dia; combinação com nefrotóxicos; elevação de SCr; AUC estimada >600; **infusão muito rápida** (>10 mg/min).

---

## 10) Fontes curadas (p/ documentação interna e auditoria)

* **IDSA/ASHP/SIDP/PIDS 2020 – consenso**: recomenda **AUC 400–600** e uso de Bayes/2 níveis (trocar “trough fixo” por AUC).
* **Stanford Health Care – Vancomycin Dosing Guide (2023)**: playbook completo (LD/MD por TBW, **round 250 mg**, **nível inicial 24–48 h**, IHD com **alvo pré-HD 15–20**, **CRRT 10–15 mg/kg q24h**, infusão contínua com **alvo 17–25**). **Base ideal para parametrizar a engine**.
* **UCSF IDMP – Antibiotic Dosing Card**: tabela prática por **CrCl** (q8–12h / q12h / q24h), **round 250 mg**, **máx. 2 g/dose**. Útil para o preset “Rápido (vale)”.
* **Stanford Antimicrobial Dosing Reference**: operacionalização de **coletas em HD** (pré-HD; alternativa 4 h pós-HD). ([Stanford Medicine][1])
* **Bula/segurança**: velocidade de infusão **≤10 mg/min** e **≥60 min por 1 g** (reduz reação de infusão).

---

## 11) O que mudar no seu código atual (resumo prático)

1. **Manter CKD-EPI 2021** só para exibir **TFGe**; **adicionar Cockcroft–Gault** (com IBW/AdjBW) para **escolher intervalo**.
2. **Botão “Modo AUC (recomendado)”**: habilitar coleta precoce (24–48 h) e cálculo de AUC (Bayes/2 níveis).
3. **HD**: trocar lógica “apenas LD e ponto” por **fluxo pré-HD → re-dose pós-HD** com alvo 15–20 mg/L. ([Stanford Medicine][1])
4. **CRRT**: preset **10–15 mg/kg q24h** + lembrete de AUC precoce; campo opcional “efluente”.
5. **Infusão**: calcular tempo mínimo automaticamente (≥60 min/1 g; alertar se exceder 10 mg/min).
6. **Caps/round**: **round 250 mg**, **máx. 2 g/dose** (parametrizável por protocolo).

---

Se quiser, no próximo passo eu já te entrego:

* o **módulo TypeScript** com funções (IBW/AdjBW/CG/CKD-EPI/AUC 2 níveis) e
* um **JSON de política** (HD/CRRT/infusão/round/caps/alvos) pronto pra “injetar” no teu motor.

**Quer que eu gere esses dois artefatos já no formato do teu repositório?**

[1]: https://med.stanford.edu/content/dam/sm/bugsanddrugs/documents/antimicrobial-dosing-protocols/SHC%20Antimicrobial%20Dosing%20Guide.pdf?utm_source=chatgpt.com "Stanford Health Care Antimicrobial Dosing Reference Guide"
