Visão geral do repositório atual

O diretório frontend/src/components/Tools/prebuilt do repositório HG contém atualmente cerca de 30 calculadoras e escores implementados manualmente em React (por exemplo, APACHE2.jsx, QTcCalculation.jsx, IdealPaO2Age.jsx, PaO2FiO2.jsx, SpO2FiO2Ratio.jsx, ConversaoMcgKgMin.jsx, FeNa.jsx, FeUrea.jsx, Osmolarity.jsx, MELD.jsx, HASBLED.jsx, RASSScale.jsx, SOFA.jsx, etc.). Algumas calculadoras são escritas diretamente em componentes React e outras, como Conversão de gotejamento e Conversão micrograma/kg/min ↔ mL/hora, utilizam a biblioteca shadcn/ui para inputs, tabs, tooltips e copy buttons. O projeto também possui um motor de calculadora dinâmica (DynamicCalculator.jsx) que recebe a definição da calculadora em JSON (localizada em backend/core/calculators) e gera automaticamente a interface com base em uma árvore de campos e fórmulas.

Pontos positivos do código existente

Reaproveitamento de componentes UI: Muitos componentes reutilizam botões, inputs, selects e tooltips de shadcn/ui, garantindo alguma consistência visual.

Motor dinâmico de calculadoras: O arquivo DynamicCalculator.jsx permite gerar calculadoras a partir de definições JSON. Isso separa a lógica (fórmulas e variáveis) da apresentação e facilita adicionar novas calculadoras sem escrever um componente React extenso. Um exemplo de definição pode ser visto no JSON da calculadora de gotejamento (gtt_ml_h_converter.json) que descreve entradas, fórmulas e saídas de maneira declarativa.

Boa calculadora de infusão (mcg/kg/min ↔ mL/h): O componente ConversaoMcgKgMin.jsx é o mais completo em termos de experiência do usuário. Ele utiliza abas para alternar entre as direções de conversão, mostra placeholders dinâmicos, fornece validações de intervalo, traz tooltips explicativos para cada campo e apresenta os resultados em formato copiável. Este componente pode servir de referência para padronizar a interface das demais calculadoras.

Problemas e inconsistências observados

Inconsistência de interface: Alguns componentes (como APACHE2.jsx ou ChildPugh.jsx) possuem dezenas de campos e lógicas complexas de forma manual, sem tabs ou organização clara. Outros simplesmente apresentam resultados sem permitir copiar valores ou ver dicas de utilização. A experiência do usuário varia muito de uma calculadora para outra.

Validações e placeholders: Em várias calculadoras os campos não têm validação de faixa de valores nem indicação das unidades, levando a possíveis erros de entrada. A calculadora de infusão, por outro lado, mostra limites, unidades e avisos claros.

Lógica espalhada: As fórmulas estão embutidas nos componentes React. Isso dificulta testes unitários e reaproveitamento de lógicas entre calculadoras (por exemplo, diversos escores utilizam idade ou creatinina). O motor dinâmico resolve parte desse problema, mas poucos componentes o utilizam atualmente.

Falta de agrupamento por especialidade: Não há uma estrutura consistente de categorias (ventilação, função renal, obstetrícia, pediatria, escores clínicos, etc.). O usuário pode ter dificuldade para localizar uma calculadora específica.

Falta de muitos escores e calculadoras importantes: A lista fornecida pelo usuário (baseada no UpToDate Whitebook) contém dezenas de calculadoras e escores que ainda não foram implementados no projeto. Abaixo está a comparação detalhada.

Comparação entre calculadoras implementadas e a lista ideal

A tabela a seguir resume as calculadoras/escores existentes no repositório (coluna Implementada?) e as que ainda faltam implementar. Para breviedade, apenas alguns exemplos das faltantes são listados por categoria; o relatório completo de faltantes segue a tabela. Calculadoras que já existem foram marcadas como Sim.

Categoria / calculadora	Implementada?	Observações
Ventilação		
Interpretador de gasometria arterial	Não	Falta interface para interpretar pH, PaCO₂ e anion gap.
PaO₂ ideal pela idade	Sim	IdealPaO2Age.jsx usa a fórmula PaO₂ = 109 − 0,43×idade para adultos
pmc.ncbi.nlm.nih.gov
.
Relação PaO₂/FiO₂ (PF)	Sim	PaO2FiO2.jsx calcula a relação (PaO₂÷FiO₂).
SpO₂/FiO₂ e equivalência com PF	Sim	SpO2FiO2Ratio.jsx implementa a relação e classificação de equivalência.
Diversas		
CAM‑ICU (delirium)	Sim	CAMICUScore.jsx calcula delirium.
Classificação do controle da asma (GINA)	Não	Disponível no anexo pediátrico; precisa ser implementado.
Escala CAGE (alcoolismo)	Não	Não existe componente.
Parkland (queimadura)	Sim	ParklandFormula.jsx calcula fluido 24 h pela fórmula de 4 mL/kg/%TBSA, sendo metade nas primeiras 8 h
emedicine.medscape.com
.
Glicemia média estimada (HbA1c)	Não	Precisa converter HbA1c para glicemia média.
Gradiente soro‑ascite (GASA)	Não	Falta implementação.
Índice de saturação de transferrina (IST)	Não	Precisa fórmula.
Mini‑mental	Não	Escala de avaliação cognitiva.
Modelo de risco de Lille	Não	Escore de prognóstico em hepatite/alcolismo.
Peso ideal pela altura	Sim	IdealBodyWeight.jsx.
Pressão arterial média (PAM)	Não	Fórmula MAP = DBP + (SBP − DBP)/3
en.wikipedia.org
.
Protocolos de COVID‑19	Não	Não é bem uma calculadora; seria um fluxograma.
QT corrigido	Sim	QTcCalculation.jsx usa fórmulas de Bazett, Fridericia e Framingham e interpretações coloridas.
Teste de Fagerström	Não	Avalia dependência de nicotina.
Testosterona livre e biodisponível	Não	Precisa fórmula (pode usar equações de Vermeulen).
Volemia estimada	Sim	EstimatedBloodVolume.jsx já existe.
Obstétricas		
Idade gestacional pela DUM e pela USG	Sim	GestationalAgeCalculator.jsx calcula idade gestacional por data de última menstruação ou ultrassom.
Eletrólitos e bioquímica		
Osmolaridade	Sim	Osmolarity.jsx.
Correção do cálcio pela albumina	Sim	CorrectedCalcium.jsx.
Correção do sódio pela glicemia	Sim	CorrectedSodium.jsx.
Déficit de ferro corporal	Sim	IronDeficit.jsx.
Gradiente albumina soro‑ascite (GASA)	Não	Falta.
IST (Índice de saturação de transferrina)	Não	Falta.
Escalas		
Escala de coma FOUR, Fisher, Glasgow com resposta pupilar, Lawton, Ramsay, SAS, CCS, Índice de Aldrete‑Kroulik	Não	Apenas a escala RASS está implementada (RASS e qSOFA têm componentes próprios).
Escores clínicos		
APACHE‑II	Sim	APACHE2.jsx.
qSOFA / SOFA	Sim	qSOFA.jsx e SOFA.jsx.
CHA2DS2‑VASc	Sim	CHA2DS2VASc.jsx.
Child‑Pugh	Sim	ChildPugh.jsx.
HAS‑BLED	Sim	HASBLED.jsx.
MELD / MELD‑Na	Sim	MELD.jsx.
Framingham	Sim	FraminghamRisk.jsx.
Khorana, Caprini, ABCD2, AIMS65, BISAP, Ranson, CRUSADE, CURB‑65, Centor modificado, Padua, Wells (TEP/TVP), EuroSCORE II, FIB‑4, HEART, MAGGIC, NEWS‑2, NIHSS, PSI, SIC, TIMI (com e sem supra), GRACE, PESI, SCORAD, PASI, GWTG, MASCC, SAPS II, TASH e outros	Não	Essas dezenas de escores ainda não foram implementadas. Um exemplo de fórmula é o FIB‑4, que calcula fibrose hepática por (idade × AST) / (plaquetas × √ALT)
reference.medscape.com
. Outra fórmula simples é a do Friedewald LDL, em que LDL é calculado como colesterol total − HDL − (triglicerídeos/5)
pmc.ncbi.nlm.nih.gov
.
Função renal		
CKD‑EPI (2021)	Sim	CKDEPI2021.jsx.
Cockcroft‑Gault	Sim	CockcroftGault.jsx.
MDRD	Não	Falta.
Measured creatinine clearance	Sim	MeasuredCreatinineClearance.jsx.
Relação proteína/creatinina urinária	Não	Falta.
Reposição de bicarbonato	Não	Falta.
Fração de excreção de sódio e ureia	Sim	FeNa.jsx e FeUrea.jsx.
Prognóstico		
ECOG, Karnofsky (KPS), PPS, Tokuhashi, Tomita, PaP, PPI	Não	Nenhuma dessas escalas/índices de desempenho/prognóstico está presente.
Uso pediátrico		
Conversão mcg/kg/min ↔ mL/h	Sim	ConversaoMcgKgMin.jsx (melhor UI).
Conversão mcg/kg/min ↔ gtt/min	Sim	ConversaoMcgKgMinGttMin.jsx.
Escala de Glasgow pediátrica, Escala de Finnegan, Escala de Raimondi, Critérios de Roma IV, Escore da APGAR, Escore de Rodwell, Idade gestacional por Capurro (somático e neurológico), IMC e obesidade pediátrica, Pressão arterial na pediatria, Infusões BI (mcg/kg/min ou mg/kg/hora), hidratação pediátrica, hipertermia maligna	Não	A maioria dessas calculadoras pediátricas está ausente, exceto o cálculo do tamanho do TOT (ETTSizeCalculator.jsx).
Critérios para definir a ordem de implementação

Como o número de calculadoras faltantes é grande, é prudente organizar um roteiro de implementação em fases, priorizando cálculo de uso frequente e complexidade crescente. Os critérios considerados foram:

Frequência e impacto clínico: calculadoras utilizadas diariamente (p.ex. MAP, GASA, GINA, CHADS‑VASC) devem vir antes de escores raros.

Complexidade técnica: começar por fórmulas simples (relação ou soma de variáveis) e progredir para escores com muitas variáveis.

Disponibilidade de fórmulas confiáveis: se a fórmula estiver presente nas referências anexas ou em fontes confiáveis, a implementação pode avançar. Quando houver dúvida, consultar as referências e documentar no JSON.

Reutilização de componentes comuns (peso, idade, creatinina, etc.): usar o motor dinâmico para evitar duplicação e facilitar manutenção, conforme discutido no documento calcGPT.txt.

Plano proposto de implementação (fases)
Fase 1 – Padronização da UI e migração para calculadoras dinâmicas

Criar um tema e componentes base para calculadoras (Layout, título, campo de entrada com unidades, tooltips, resultado copiável). Estes componentes devem imitar a experiência do ConversaoMcgKgMin.jsx: uso de Tabs quando houver modos, validação de intervalo, tooltips e botão de copiar resultado.

Refatorar calculadoras simples existentes (ex.: BMI.jsx, BSAMosteller.jsx, CorrectedCalcium.jsx) para usar o motor dinâmico e o novo tema. Implementar o JSON das fórmulas e chamar DynamicCalculator.jsx, reduzindo código duplicado.

Agrupar calculadoras por categoria no menu lateral (ventilação, renal, obstétrica, pediátrica, diversas, escores clínicos, escalas). Isso melhora a navegabilidade e prepara o terreno para a adição de novos itens.

Fase 2 – Implementação de calculadoras básicas faltantes

Pressão arterial média (PAM) – fórmula de fácil implementação: MAP ≈ DBP + (SBP − DBP)/3
en.wikipedia.org
.

Classificação do controle da asma (GINA 2025) – utilizar os critérios das últimas 4 semanas (sintomas diurnos, despertares noturnos, uso de beta‑agonista, limitação de atividades) conforme definido no anexo de pediatria e exibir a classificação (controlada, parcialmente controlada ou não controlada).

Escala CAGE – 4 perguntas sobre consumo de álcool. Pontuar cada resposta positiva (≥2 sugere alcoolismo). Interface simples com checkboxes.

Glicemia média estimada (HbA1c) – fórmula: GME (mg/dL) ≈ 28,7 × HbA1c − 46,7 (valor aproximado presente em diretrizes ADA). Incluir legenda e interpretação.

Gradiente albumina soro‑ascite (GASA) – calcular como albumina sérica − albumina do líquido ascítico para diferenciar hipertensão portal (>1,1 g/dL) de outras causas.

Índice de saturação de transferrina (IST) – fórmula: (ferro sérico ÷ capacidade total de ligação do ferro) × 100. Necessário incluir unidades e intervalos.

Modelo de risco de Lille – calcula resposta à prednisona em hepatite alcoólica; fórmula depende de bilirrubina inicial e após 7 dias (encontrada no anexo escores). Implementar no motor dinâmico.

Mini‑mental – 30 itens de avaliação cognitiva; exibir perguntas e somatório. Incluir interpretação por faixa etária e escolaridade.

Protocolo de COVID‑19 – se for apenas um fluxograma, pode ser incluído como página estática; se tiver critérios (idade, saturação, comorbidades), implementá‑lo como calculadora dinâmica.

Teste de Fagerström – 6 perguntas sobre dependência de nicotina, somando 0‑10. Exibir grau de dependência.

Testosterona livre/biodisponível – usar equações de Vermeulen (necessita SHBG, albumina e testosterona total); calcular T livre e biodisponível. As fórmulas podem ser obtidas em publicações de endocrinologia.

Fase 3 – Escores clínicos amplamente utilizados

CHADS₂ – pontuar insuficiência cardíaca, hipertensão, idade ≥ 75 anos, diabetes e história de AVC/TIA (2 pontos). Fornece estimativa de risco de AVC em fibrilação atrial.

DAS‑28 PCR/VHS – escores de atividade da artrite reumatoide calculados a partir de número de articulações dolorosas, inchadas, PCR/VHS e avaliação global. Apresentar valor e interpretação.

CURB‑65, PSI e ABCD₂ – estratificação de pneumonia, risco de mortalidade na pneumonia e risco de AVC pós‑AIT.

Caprini, Padua, Khorana, Wells (TEP/TVP) – escores de tromboembolismo venoso para hospitalização e oncologia. Incluir fatores de risco com checkboxes.

CRUSADE, TIMI (com e sem supra), GRACE, HEART – escores cardiovasculares para síndrome coronariana aguda. Exigem campos como idade, creatinina, pressão, ECG e enzimas.

BISAP, Ranson – mortalidade em pancreatite. Dependem de valores laboratoriais e critérios de admissão/48 h.

BISAP – 5 itens (BUN, alteração mental, SIRS, >60 anos, derrame pleural). Ranson tem 11 parâmetros.

FIB‑4 – formula (idade × AST) / (plaquetas × √ALT)
reference.medscape.com
 com interpretação de <1,45, 1,45–3,25 e >3,25 para fibrose hepática.

EuroSCORE II – escore de risco operatório em cirurgia cardíaca com diversas variáveis (idade, função ventricular, creatinina, endocardite, etc.).

Fase 4 – Escalas neurológicas e de sedação

Escala de coma FOUR – 4 seções (resposta ocular, motora, reflexos de tronco cerebral e respiração) com pontuação 0‑4 cada. Implementar lista suspensa para cada item e somatório.

Escala de Fisher – avaliação tomográfica da hemorragia subaracnoide, selecionando opção entre I e IV e mostrando risco de vasoespasmo.

Escala de Glasgow com resposta pupilar – adicionar o escore pupilar (0‑2) ao GCS clássico (3‑15) para obter GCS‑P. A pontuação total é GCS − pupil reactivity score.

Escalas de Ramsay, RASS, SAS – escalas de sedação/agitação; RASS já existe, mas SAS e Ramsay devem ser adicionadas.

Escala de Lawton (atividades instrumentais), CCS (angina), Índice de Aldrete‑Kroulik (recuperação pós‑anestesia) – incluir campos e interpretações conforme anexos.

Fase 5 – Escalas e escores específicos e prognósticos

NIHSS, NEWS‑2, SIC, MASCC, SAPS II, TASH – escore de AVC, alerta precoce de deterioração clínica, coagulopatia induzida por sepse, risco de neutropenia febril, gravidade em CTI e transfusão maciça.

ESCALA APGAR, Finnegan, Raimondi, Rome IV (pediatria) – escore de recém‑nascido, abstinência neonatal, coma em crianças e critérios de síndrome do intestino irritável.

Índices de desempenho (ECOG, Karnofsky, PPS) e escores prognósticos (Tokuhashi, Tomita, PaP, PPI) – escalas para oncologia e cuidados paliativos.

Escores dermatológicos e imunológicos – PASI (psoríase), SCORAD (dermatite atópica), R‑ISS (mieloma múltiplo) etc.

Calculadoras obstétricas e pediátricas adicionais – idade gestacional por Capurro (somático e neurológico), IMC pediátrico, pressão arterial pediátrica, hidratação pediátrica, hipertermia maligna, infusões em mg/kg/hora.

Recomendação de arquitetura e boas práticas

Adotar o motor de calculadora dinâmica: Criar arquivos JSON no backend (core/calculators) contendo as entradas, fórmulas (em Python) e saídas. O front‑end deve usar o componente DynamicCalculator.jsx para interpretar esses schemas. Isso reduz o número de componentes React grandes e facilita testes unitários.

Centralizar variáveis comuns: Muitos escores utilizam idade, peso, creatinina, AST/ALT, etc. É recomendável criar um armazenamento global (contexto) para variáveis clínicas frequentes, permitindo que o usuário preencha uma vez e reutilize em várias calculadoras, conforme sugerido no documento calcGPT.txt.

Padronizar UI com base no melhor exemplo: Utilizar a estrutura de ConversaoMcgKgMin.jsx (abas para diferentes modos, tooltips informativos, validação de intervalo, botão de cópia). Todas as novas calculadoras devem seguir esses princípios. Além disso, permitir alternar unidades (por exemplo, mg/dL vs mmol/L) quando necessário.

Documentar cada calculadora/escore: Incluir no JSON ou no componente campos como descrição, indicações de uso, interpretação e referências. Essas informações podem ser exibidas em uma aba ou seção de info.

Testes unitários e integração contínua: Cada fórmula deve ser coberta por testes no backend (Python) para garantir exatidão. O front‑end pode ter testes de snapshot e de interação.

Internacionalização (i18n): Muitos textos estão em português. Caso a aplicação pretenda suportar múltiplos idiomas, a extração para arquivos de tradução deve ocorrer já nas próximas fases.

Considerações finais

O repositório HG já oferece uma base sólida de calculadoras médicas, mas ainda falta implementar a maioria dos escores presentes no Whitebook (UpToDate). A melhor calculadora de infusão serve de modelo para a nova geração de componentes. A adoção do motor dinâmico com definições em JSON/Python permitirá escalar rapidamente o número de calculadoras, mantendo consistência de interface e manutenção simplificada. O plano proposto em fases prioriza calculadoras de maior impacto clínico e com fórmulas bem definidas, avançando gradualmente para escores complexos e escalas específicas.