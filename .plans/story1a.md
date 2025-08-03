Refatorar RecordEditor para uma Arquitetura de Editor Híbrido, Performático e Acessível
Epic:  O Editor de Registros Híbrido e Inteligente

História
Como um profissional de saúde, eu quero um editor de registros que funcione como um documento de texto contínuo, mas que se organize visualmente em seções baseadas em tags, para que eu possa registrar informações de forma mais rápida e natural, sem a rigidez de múltiplos campos de formulário e sem perder a estrutura dos dados.

Critérios de Aceitação (AC)
Substituição do Componente: O novo componente HybridEditor.jsx deve substituir completamente o antigo RecordEditor.jsx dentro da PatientView.

Alternância de Visão: Um controle (toggle switch) deve permitir ao usuário alternar instantaneamente entre a "Visão Segmentada" e a "Visão de Texto Contínuo".

Renderização Segmentada: Na Visão Segmentada, o editor deve renderizar uma lista de componentes SectionBlock.jsx, onde cada bloco representa uma seção do texto iniciada por uma tag (#TAG: ou >>SUBTAG:).


Parsing de Tags: O editor deve utilizar shared/parser.js  para identificar corretamente as seções e extrair o nome da tag e o conteúdo de cada bloco.

Performance (Grok): A interface deve permanecer fluida e sem atrasos de digitação, mesmo em registros longos (>30 seções). A edição de um SectionBlock não deve causar a re-renderização de todos os outros blocos.

Otimização de Sincronização (Grok): O evento de alteração de texto deve usar um mecanismo de debounce para evitar sobrecarga de processamento e preparar o terreno para um futuro auto-save eficiente.

Acessibilidade (Grok): Cada SectionBlock deve ser acessível via teclado e possuir aria-labels adequados para leitores de tela (ex: "Seção de Queixa Principal").

Funcionalidade "Add to Chat": Cada SectionBlock deve ter um botão (ícone Sparkles) que, ao ser clicado, prepara o conteúdo daquela seção para ser enviado ao chat de IA. A integração final com o chat ocorrerá na História 1.3.

Tarefas / Subtarefas (Handoff para Dev Agent)
Estrutura de Arquivos:

[ ] Criar frontend/src/components/PatientView/HybridEditor.jsx.

[ ] Criar frontend/src/components/PatientView/SectionBlock.jsx.

[ ] Atualizar frontend/src/components/PatientView/index.jsx para remover RecordEditor e importar e renderizar o novo HybridEditor.jsx.

Lógica do HybridEditor.jsx:

[ ] Implementar o estado editorContent (string) para o texto completo.

[ ] Implementar o estado isSegmented (boolean) e o componente de toggle.

[ ] Usar useMemo para calcular o array sections a partir de editorContent, utilizando uma versão adaptada do parseSections que divida o texto por \n\n.

[ ] Implementar a função handleTextChange(sectionId, newContent) que atualiza o editorContent de forma otimizada. (Aplicar debounce aqui).

[ ] Implementar a lógica de onKeyDown para unir seções quando Backspace é pressionado em um bloco vazio, como no mock ProntuarioHibrido.

[ ] Receber um prop onSave que será chamado com o editorContent completo.

Lógica do SectionBlock.jsx:

[ ] O componente deve receber as props: section, onContentChange, onAddToChat.

[ ] Implementar a lógica para extrair a tag e o valor do section.content.

[ ] Renderizar o nome da tag (buscado de um tagMap como no mock) como um cabeçalho estilizado.

[ ] Utilizar um <textarea> com auto-ajuste de altura para o conteúdo.

[ ] Adicionar o botão "Add to Chat" (Sparkles) que aparece no hover.

[ ] Otimização: Envolver a exportação do componente com React.memo e garantir que as props passadas do HybridEditor.jsx sejam estáveis (usar useCallback para as funções).

Integração e Finalização:

[ ] Garantir que o botão "Salvar" no HybridEditor.jsx chame o onSave com o conteúdo completo e atualizado.

[ ] Conectar o 

onSave à função createRecord ou updateRecord do patientStore , garantindo que o fluxo de salvamento continue funcionando.

Dev Notes (Contexto para o Dev Agent)
Objetivo Estratégico: Esta refatoração é a base para todas as funcionalidades avançadas futuras. O objetivo é criar uma experiência de edição similar a um IDE, abandonando o paradigma de formulário.


Arquivo Chave: O shared/parser.js  é central. Ele precisa ser robusto o suficiente para dividir o texto em seções de forma confiável. A lógica de 

split('\n\n') do mock é um excelente ponto de partida para seções sem tag.

Performance é Crucial: A principal crítica à abordagem de múltiplos textareas é a performance. O uso de React.memo e debounce não é opcional, é um requisito fundamental desta história para evitar regressões.

Estado Futuro: Lembre-se que este editor será o alicerce para a User Story 1.2 (Tag Toolbar) e 1.3 (Live Data Tags). A arquitetura deve ser extensível para suportar essas futuras adições.

