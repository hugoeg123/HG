Sidebar Visual Polish & Interatividade
Como um usuário, eu quero que o paciente selecionado na barra lateral esquerda tenha um destaque de fundo claro e que a barra lateral direita possa ser expandida, para que eu tenha um feedback visual claro da minha seleção e mais espaço para interagir com as ferramentas.
Critérios de Aceitação:
O paciente ativo na LeftSidebar deve ter tanto a borda (border-teal-500) quanto o fundo translúcido (bg-teal-600/20).
Um ícone de seta (e.g., <) deve aparecer na RightSidebar.
Clicar neste ícone deve fazer com que a RightSidebar ocupe uma porção maior da tela (ex: 50%), e o painel de conteúdo central se ajuste para preencher o espaço restante.
Clicar novamente no ícone (que agora deve ser uma seta >) restaura a RightSidebar ao seu tamanho original.
Handoff Directive (Resumo da Implementação):
Para o Destaque: Corrija a className condicional em LeftSidebar.jsx para incluir bg-teal-600/20 junto com a borda quando isActive for verdadeiro.
Para a Expansão: Adicione um estado de expansão em MainLayout.jsx. Modifique as classes de grid-cols do layout principal para reagir a este estado. Adicione um botão na RightSidebar que modifica o estado no MainLayout.