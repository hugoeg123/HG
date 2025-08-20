Conforme solicitado, elaborei o Documento de Requisitos do Produto (PRD), o README e o pacote ZIP com todas as calculadoras, escores e escalas referenciados nos arquivos fornecidos. Estes artefatos estão prontos para serem inseridos no repositório do projeto.

### PRD

* O PRD descreve a visão, motivação, arquitetura de informação, escopo, requisitos funcionais e não funcionais, critérios de aceite e plano de implementação do módulo de calculadoras clínicas, com ênfase na padronização em unidades SI e na criação de um registro central de variáveis para reuso.
* Arquivo: Documento de Requisitos do Produto (PRD) – Módulo de Calculadoras Clínicas
Visão geral

O Health Guardian (HG) será uma plataforma móvel que integra calculadoras médicas, escores clínicos, escalas funcionais e conversores de unidades em um único ecossistema. A curadoria de conteúdo parte de múltiplas fontes internas (Whitebook, UpToDate, documentos do HCFMUSP) e é complementada por diretrizes de sociedades médicas. O objetivo é disponibilizar ferramentas confiáveis, de fácil utilização e com base científica sólida, reduzindo a complexidade da prática clínica à beira‑do‑leito.

Motivação

Atualmente os profissionais de saúde utilizam inúmeras calculadoras dispersas (apps, planilhas, sites) para estimar doses de medicamentos, estratificar risco ou classificar a severidade de doenças. Essa fragmentação aumenta o tempo de consulta e a chance de erros. O módulo aqui descrito unifica 96 ferramentas (escalas, escores e calculadoras variadas) sob uma arquitetura comum, facilitando manutenção, atualização e integração com outras funcionalidades do aplicativo (por exemplo, a aba de conhecimento). A padronização de unidades por meio de conversões SI evita discrepâncias entre módulos e reduz erros de cálculo; fatores de conversão para bilirrubina, cálcio, creatinina, glicose, magnésio, fósforo e outros analitos podem ser extraídos de tabelas oficiais de unidades
pmc.ncbi.nlm.nih.gov
.

Arquitetura de informação

O módulo seguirá o modelo híbrido detalhado em calcGPT.txt: as ferramentas serão organizadas em três níveis (Tipo de Ferramenta → Especialidade/Sistema → Ferramenta) e enriqueceremos cada calculadora com tags de variáveis, sistemas de órgãos, população e unidades. Essa organização facilita a descoberta por parte do usuário e permite que o motor de busca da plataforma relacione automaticamente ferramentas com conteúdos da aba de conhecimento.

Registro central de variáveis e SI – conversões

Todas as entradas de calculadoras devem fazer referência a variáveis definidas em um registro central. Cada variável possui:

nome canônico e aliases;

unidades suportadas e fator de conversão para a unidade SI;

notas como valência (ex.: mEq de bicarbonato = mmol, magnésio 1 mEq = 0,5 mmol etc.)
pmc.ncbi.nlm.nih.gov
;

vínculos com as ferramentas que a utilizam.

O motor de conversão subjacente transformará qualquer valor fornecido pelo usuário em SI, realizará o cálculo e, se necessário, converterá o resultado de volta para a unidade preferida. Isso previne erros de arredondamento e garante consistência entre diferentes módulos.

Escopo e funcionalidades

Catálogo de calculadoras: disponibilizar 9 escalas, 70 escores e 17 calculadoras diversas. Cada calculadora deve expor:

nome oficial e aliases;

descrição resumida, indicações de uso, limitações e referências bibliográficas;

lista de entradas (variáveis) com unidade padrão e faixa de valores aceitáveis;

lógica de cálculo (fórmula ou pseudocódigo) e classificação de resultados, quando aplicável;

saídas (valor numérico, categoria de risco ou texto interpretativo).

Conversões de unidades: implementar núcleo de conversões SI‑first para eletrólitos, hormônios e parâmetros hemodinâmicos. Por exemplo, cálcio total (mg/dL ↔ mmol/L), creatinina (mg/dL ↔ μmol/L) e glicose (mg/dL ↔ mmol/L) têm fatores canônicos amplamente documentados
pmc.ncbi.nlm.nih.gov
. A plataforma deve sempre converter a entrada para SI antes de executar a fórmula.

Interface de usuário: as calculadoras serão exibidas por hierarquia (especialidade/órgão) e também por pesquisa de palavras‑chave ou tags. Cada calculadora deve possuir campos intuitivos de preenchimento, ajuda contextual (tooltip) e resultados destacados. Escores com pontos de corte (e.g., CURB‑65, ABCD2) devem apresentar de forma clara a categoria de risco e a conduta recomendada.

Integração com a aba de conhecimento: ao abrir uma variável (p.ex., creatinina), o usuário deve ver todas as calculadoras que a utilizam e materiais de apoio (protocolos, artigos) relacionados àquela variável. Isso será implementado cruzando tags e variáveis no banco.

Requisitos funcionais

RF‑01 – Cadastro das calculadoras: o sistema deverá importar as calculadoras descritas nos arquivos escalas.txt, escores.txt e variadas.txt e gerar metadados estruturados em JSON. Este PRD acompanha calculators_metadata, um conjunto de arquivos JSON com os campos mínimos para implementação.

RF‑02 – Cálculo automático: ao preencher os campos de entrada, o sistema deve executar a lógica associada e apresentar os resultados em tempo real. Para as calculadoras ainda não implementadas, deverá aparecer aviso “em desenvolvimento”.

RF‑03 – Conversão de unidades: ao receber valores em unidades diversas (mg/dL, μmol/L, mmHg, kg, etc.), a aplicação deve converter automaticamente para SI antes do cálculo, utilizando fatores de conversão confirmados
pmc.ncbi.nlm.nih.gov
.

RF‑04 – Validação de entrada: entradas deverão ter validação de faixa (ex.: idade 0–120 anos), tipo de dado (númerico, booleano) e unidades aceitáveis. Campos obrigatórios precisam ser sinalizados.

RF‑05 – Internacionalização: embora a primeira versão seja em português, a estrutura deve permitir traduções de textos e etiquetas para outros idiomas.

RF‑06 – Acessibilidade e design responsivo: interface compatível com dispositivos móveis e com leitores de tela; contraste adequado e navegação por teclado.

Requisitos não funcionais

RNF‑01 – Desempenho: cálculos instantâneos com latência perceptível <100 ms. Conversões de unidades e operações aritméticas devem ser otimizadas.

RNF‑02 – Escalabilidade: arquitetura modular; novas calculadoras podem ser adicionadas sem necessidade de alterar o núcleo. O registro central de variáveis deve ser versionado.

RNF‑03 – Manutenibilidade: código legível com testes automatizados para cada cálculo; documentação de cada fórmula e fonte científica associada.

RNF‑04 – Segurança e privacidade: o sistema não armazena dados dos pacientes; resultados são calculados localmente e descartados. As variáveis de entrada são genéricas (peso, idade) e não contêm identificadores pessoais.

RNF‑05 – Confiabilidade: utilizar apenas fórmulas validadas; cada escore deve citar publicações de referência e diretrizes oficiais. O módulo de conversão deve aderir a fatores de conversão amplamente aceitos
pmc.ncbi.nlm.nih.gov
.

Critérios de aceite

Todos os 96 escores/escalas/calculadoras listados nos arquivos fonte estão presentes na plataforma, ainda que alguns estejam assinalados como “em desenvolvimento”.

Para as calculadoras implementadas, os resultados batem com exemplos de referência fornecidos nos documentos originais.

Conversões de unidades são consistentes com tabelas oficiais de unidades SI
pmc.ncbi.nlm.nih.gov
.

A interface apresenta mensagens claras de interpretação (baixa, moderada, alta gravidade) e links para as referências bibliográficas.

A busca por tags (por ex.: variável “creatinina”) retorna todas as ferramentas relevantes.

Plano de implementação

Geração dos metadados: a partir dos arquivos fornecidos, foi criado o script build_calculators.py que monta os JSONs em calculators_metadata. Esses arquivos servirão de contrato para o agente desenvolvedor. As calculadoras mais comuns (IMC, carga tabágica, CHADS₂, BISAP, CURB‑65, FIB‑4, etc.) já incluem a fórmula Python no mesmo script.

Core de conversões: reutilizar o núcleo de conversões anteriormente entregue, que define fatores moleculares e unidades SI. Esse núcleo será compartilhado entre todos os cálculos.

Serviço de cálculo: criar um módulo (por exemplo, calc_engine.ts) no repositório HG que receba as entradas, consulte o registro de variáveis para normalizar unidades, execute a lógica da calculadora (pelo nome/slug) e retorne o resultado estruturado.

Interface de usuário: em React Native/Expo, criar páginas para cada categoria (escalas, escores, calculadoras), com componentes reutilizáveis de entrada (campo numérico, seleção, caixas de verificação) e exibição de resultados. As descrições e textos de ajuda devem ser carregados a partir dos metadados JSON.

Testes e validação: implementar testes unitários para cada fórmula usando exemplos de caso. Revisar com especialistas clínicos as interpretações e mensagens finais.

Iteração contínua: as calculadoras marcadas como “TODO” no JSON devem ser priorizadas em sprints posteriores; sua implementação exigirá pesquisa em guidelines atualizadas e validação do algoritmo.

Considerações finais

Este PRD estabelece uma base sólida para o desenvolvimento do módulo de calculadoras do Health Guardian. A unificação das ferramentas em uma arquitetura híbrida com conversões SI e registro central de variáveis garante escalabilidade e segurança clínica. A equipe deverá seguir as referências científicas para implementação dos algoritmos restantes e manter o repositório atualizado de acordo com novas evidências.

### README

* O README explica a estrutura do projeto, como utilizar os metadados JSON gerados, como regenerar os arquivos a partir dos scripts e como integrá-los ao aplicativo HG.
* Arquivo: {{file\:file-4czXo2fziBj7wYC4YEa7EJ}}

### Pacote ZIP

* O arquivo ZIP contém a pasta `calculators_metadata/` com um JSON para cada escala, escore ou calculadora, inclusive placeholders com `TODO` para itens que ainda requerem implementação.
* Inclui também o README para orientação do desenvolvedor.
* Arquivo: Health Guardian – Módulo de Calculadoras Clínicas

Este repositório contém o material preparatório para a implementação do módulo de calculadoras, escores e escalas do aplicativo Health Guardian (HG). Ele inclui um Documento de Requisitos do Produto (PRD), um conjunto de metadados JSON para cada ferramenta e um script que gera funções de cálculo de exemplo em Python.

Estrutura do projeto
.
├── PRD.md                       # Documento de requisitos do produto
├── README.md                    # Este arquivo
├── build_calculators.py         # Script Python para geração de metadados e funções
├── calculators_metadata/        # Conjunto de arquivos JSON, um por calculadora/escore/escala
│   ├── escala_de_coma_four.json
│   ├── escala_de_fisher.json
│   ├── …
│   └── teste_fagerstrom.json
└── calculadoras.zip             # Arquivo ZIP com os JSONs e este README

Uso dos metadados

Cada arquivo em calculators_metadata/ descreve uma ferramenta clínica específica. Os campos mais relevantes são:

Campo	Descrição
name	Nome oficial da calculadora/escore/escala.
type	Tipo de ferramenta (escala, escore ou calculadora).
inputs	Lista de entradas necessárias; cada item inclui nome e unidade esperada.
outputs	Campos que a calculadora retorna (valores numéricos ou categorias).
algorithm	Fórmula ou pseudocódigo usado no cálculo; os detalhes completos devem ser implementados.
interpretation	Orientação sobre como classificar o resultado (baixo/alto risco, etc.).
description	Resumo da utilidade clínica e contexto de uso.
references	Lista de publicações ou diretrizes que embasam a ferramenta.

Os escores mais comuns (por exemplo, CURB‑65, CHADS₂, BISAP, FIB‑4, Alvarado) já têm suas fórmulas implementadas no script build_calculators.py. Para utilizar uma função, importe o módulo e chame a função apropriada. Exemplo:

from build_calculators import curb65

# Definir critérios (True/False) para cada variável
entrada = {
    "confusion": False,
    "urea_gt_7": True,
    "resp_rate_ge_30": False,
    "sbp_lt_90_dbp_le_60": False,
    "age_ge_65": True,
}

resultado = curb65(entrada)
print(resultado)  # {'score': 2, '30_day_mortality': '9% (internação)'}

Como gerar os metadados novamente

Se novos escores ou escalas forem adicionados aos arquivos fonte (escalas.txt, escores.txt, variadas.txt), execute o script de construção para regenerar os JSONs:

python build_calculators.py


Isso cria (ou atualiza) a pasta calculators_metadata/ com os arquivos correspondentes. O script também serve como referência inicial para implementações de cálculo em outras linguagens.

Como integrar ao aplicativo HG

Registro de variáveis – conforme descrito no PRD, crie uma tabela ou coleção persistente que armazene cada variável (nome, unidade SI, fatores de conversão e aliases). Essa camada permitirá reuso das mesmas entradas em diferentes calculadoras.

Conversões e núcleo de cálculo – reutilize o núcleo de conversões em SI (entregue em iterações anteriores) para normalizar entradas. Em seguida, leia o metadado da calculadora, mapeie as variáveis de entrada para valores normalizados e aplique a fórmula ou pseudocódigo definido.

Interface de usuário – o front‑end deverá ler os arquivos JSON para construir dinamicamente formulários de entrada, textos de ajuda e interpretar o resultado. Caso uma calculadora possua algorithm marcado como TODO, exiba uma mensagem de que está em desenvolvimento.

Atualização de conteúdos – mantenha o repositório sincronizado com novas evidências científicas. Os arquivos JSON facilitam versionamento; cada atualização deve incluir revisão das referências bibliográficas.

Como contribuir

Abra uma issue para sugerir novas calculadoras ou correções nas fórmulas. Proporcione as referências clínicas correspondentes.

Ao implementar um novo escore, adicione sua função ao build_calculators.py e atualize o JSON correspondente com entradas, saídas, algoritmo e referências.

Siga os princípios de conversão SI para evitar discrepâncias nas unidades
pmc.ncbi.nlm.nih.gov
.

Referências

Os fatores de conversão e várias das fórmulas adotadas neste projeto baseiam‑se em tabelas oficiais de unidades convencionais e SI. Por exemplo, a bilirrubina (mg/dL → µmol/L), creatinina (mg/dL → µmol/L), cálcio (mg/dL → mmol/L), glicose (mg/dL → mmol/L), magnésio (mEq/L → mmol/L) e fósforo (mg/dL → mmol/L) utilizam fatores apresentados no artigo “Conversion Table – Conventional to SI Units”
pmc.ncbi.nlm.nih.gov
.

Além disso, cada calculadora faz referência às diretrizes e publicações originais indicadas em seu arquivo JSON (ver campo references). Consulte essas fontes para detalhes e validação das fórmulas.

Esses documentos fornecem uma base sólida para que o agente codificador integre as diversas calculadoras ao aplicativo, garantindo consistência e facilidades de manutenção. Se precisar de ajustes ou complementos, estou à disposição.
