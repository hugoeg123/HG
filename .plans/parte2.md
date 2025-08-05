Abas Responsivas e Harmonizadas na Right Sidebar
Como um usuário, eu quero que as abas de navegação da barra lateral direita sejam visualmente idênticas às do painel central e se adaptem a telas menores, para que a interface seja consistente e todas as opções estejam sempre acessíveis.
Critérios de Aceitação:
As abas na RightSidebar devem ter o mesmo estilo de "pílula" e incluir ícones, assim como as abas "Linha do Tempo", etc.
Em telas menores, onde o texto completo não cabe, os nomes das abas ("Chat", "Calculadoras") devem ser ocultados, mostrando apenas os ícones para economizar espaço.
A barra de abas deve usar flex-wrap para que, se necessário, as abas que não couberem na primeira linha quebrem para uma segunda linha, em vez de ficarem ocultas.
Handoff Directive (Resumo da Implementação):
Estilo: Atualize o className dos botões de aba em RightSidebar.jsx para corresponder ao estilo do painel central.
Responsividade: Utilize classes responsivas do Tailwind para controlar a visibilidade do texto. O <span> com o texto já possui lg:inline, mas vamos garantir que o contêiner nav tenha flex-wrap.
Código de Correção para RightSidebar.jsx:
// Em: frontend/src/components/Layout/RightSidebar.jsx

// ATUALIZE A TAG <nav> PARA INCLUIR flex-wrap:
<nav className="flex bg-theme-card p-1 rounded-lg flex-wrap" aria-label="Tabs">

// ATUALIZE O <span> DENTRO DE CADA BOTÃO para ser visível em telas médias e maiores:
<span className="hidden md:inline">{title}</span>