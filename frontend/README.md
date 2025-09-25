# Health Guardian - Frontend

Este diretório contém o código-fonte do frontend do Health Guardian, uma aplicação React construída com Vite.

## Visão Geral

O frontend é responsável por toda a interface do usuário, interação com o paciente e visualização de dados médicos. Ele se comunica com o backend através de uma API REST para buscar e salvar informações.

## Estrutura de Pastas

```
frontend/
├── public/             # Arquivos estáticos
├── src/
│   ├── assets/         # Imagens, fontes, etc.
│   ├── components/     # Componentes React reutilizáveis
│   ├── pages/          # Componentes de página (rotas)
│   ├── services/       # Lógica de comunicação com a API
│   ├── store/          # Gerenciamento de estado global (Zustand)
│   ├── styles/         # Estilos globais e configurações do Tailwind
│   ├── utils/          # Funções utilitárias
│   ├── App.jsx         # Componente raiz da aplicação
│   └── main.jsx        # Ponto de entrada da aplicação
├── .env                # Variáveis de ambiente (não versionado)
├── package.json        # Dependências e scripts
└── vite.config.js      # Configuração do Vite
```

## Começando

1.  **Instale as dependências:**

    ```bash
    npm install
    ```

2.  **Configure as variáveis de ambiente:**

    Crie um arquivo `.env` na raiz do `frontend` e adicione a URL da API do backend:

    ```
    VITE_API_URL=http://localhost:5001/api
    VITE_SOCKET_URL=http://localhost:5001
    VITE_NODE_ENV=development
    ```

3.  **Inicie o servidor de desenvolvimento:**

    ```bash
    npm run dev
    ```

    A aplicação estará disponível em `http://localhost:3000` (ou outra porta, se a 3000 estiver em uso).

## Ganchos de Integração

-   **Conector (API):** A lógica para se comunicar com o backend está centralizada em `src/services/api.js`. Ele utiliza o `axios` para fazer requisições HTTP para a URL definida em `VITE_API_URL`.
-   **Conector (Estado Global):** O estado global da aplicação é gerenciado pelo Zustand. Os stores estão definidos em `src/store/` e são importados pelos componentes que precisam acessar ou modificar o estado.
-   **Conector (Rotas):** As rotas da aplicação são definidas em `App.jsx` usando o `react-router-dom`.

---

## Conflitos, Dificuldades e Decisões Tomadas

Esta seção documenta problemas reais enfrentados no desenvolvimento do frontend, suas causas prováveis, decisões adotadas e como intervir com segurança.

### 1) Cascata de Cores no Modo Claro (Light Mode)
- **Sintoma:** Alguns cards e painéis herdavam um fundo mais escuro em modo claro, devido à cascata agressiva de estilos globais em `index.css`.
- **Decisão:** Criamos seletores específicos no `overrides.css` para escopo controlado:
  - Regra: `.light-mode .center-pane .patient-dashboard-panel, .light-mode .center-pane .patient-dashboard-card { background-color: var(--color-bg-light) !important; }`
  - **Motivo:** Escopo restrito à área central (`center-pane`) e apenas aos blocos relevantes (`patient-dashboard-panel`, `patient-dashboard-card`). Evita efeitos colaterais e não pinta o container principal.
- **Integrações:**
  - Aplicação da classe `patient-dashboard-card` em blocos pontuais (sidecards, conteúdos e estados vazios) nos componentes relevantes.
  - Não alteramos utilitários globais nem substituímos classes base de Tailwind.

### 2) Portas do Vite e HMR Simultâneos
- **Sintoma:** Servidores de desenvolvimento em múltiplas portas (`3000-3003`) devido a instâncias paralelas do Vite.
- **Causa:** Terminais abertos com `npm run dev` simultaneamente.
- **Decisão:** Manter apenas uma instância ativa por workspace e confiar no fallback automático de porta do Vite.
- **Como intervir rapidamente:** Feche instâncias duplicadas e mantenha apenas um terminal rodando o `vite dev`.

### 3) Aplicação de Fundo em Cards Específicos (sem afetar containers)
- **Sintoma:** Elementos com `bg-theme-card` dentro de páginas específicas precisavam ter fundo cinza claro em modo claro, sem "pintar" a página inteira.
- **Decisão:** Adicionar `patient-dashboard-card` somente em cards de conteúdo, metadados, tags e estados vazios, mantendo o container principal intacto.
- **Locais principais:**
  - Sidebar do `PatientDashboard`: "Sinais Vitais Recentes", "Plano Terapêutico Ativo", "Resumo Clínico".
  - Conteúdo/Tags/Metadados no `RecordViewer`.
  - Estados vazios em `HistoryList`, `InvestigationList` e `PlansList`.

### 4) Seletores de Escopo e Centro do Layout
- **Contexto:** O seletor `.center-pane` vem de `MainLayout.jsx` e garante que a regra de light mode atinja apenas o miolo da interface.
- **Decisão:** Validar sempre a presença de `.center-pane` ao criar overrides, para evitar espalhar estilos.

### 5) Sistema de Tags e Normalização
- **Sintoma:** Diferenças na exibição/normalização de tags entre componentes.
- **Decisão:** Centralizar utilitários de tags e respeitar o formato `#TAG: valor`. Usar `normalizeTags` e `formatTagForDisplay` nas views que exibem tags.

### 6) Performance e Renderizações
- **Risco:** Listas longas e componentes com muitos estados podem causar renderizações redundantes.
- **Decisão:**
  - Preferir seletores do Zustand por fatias de estado.
  - Evitar recriar funções em cada render.
  - Introduzir memoização onde necessário e considerar virtualização de listas.

### 7) Acessibilidade e FHIR
- **Considerações:** Manter contraste adequado em light/dark mode e preparar o frontend para exportações compatíveis com FHIR.
- **Decisão:** Documentar os pontos de integração e validar contrastes ao ajustar temas.

---

## Potenciais Desafios Futuros
- **Expansão de Temas:** High-contrast, paletas customizadas e temas dinâmicos podem exigir novas regras de escopo para evitar regressões de cor.
- **Modularização de Estilos:** Migrar partes para CSS Modules/Variants pode reduzir colisões em cascata, mas demanda mapeamento cuidadoso de classes existentes.
- **Crescimento de Estado Global:** Dividir stores grandes em domínios menores, sempre documentando hooks e conexões.
- **Integração de IA Local (Ollama):** Padronizar env vars e contratos com o backend (em serviços de AI) para evitar desalinhamentos em sugestões assistidas.

---

## Guia de Intervenções Rápidas (Checklist)
1. Verificar se apenas um servidor Vite está rodando.
2. Validar que `.center-pane` está presente na hierarquia ao aplicar regras de light mode.
3. Para um novo card que precise fundo cinza claro no modo claro:
   - Adicionar a classe `patient-dashboard-card` no contêiner do card.
   - Garantir que está dentro da área central (`center-pane`).
4. Evitar overrides globais; prefira regras em `overrides.css` com escopo específico.
5. Testar visualmente com HMR e revisar componentes afetados.

---

## Padrões de Estilo e Consistência
- Usar Tailwind para composição de classes (ex.: `bg-theme-card`, `border-theme-border`).
- Para blocos específicos do dashboard, prefira prefixos semânticos (`patient-dashboard-panel`, `patient-dashboard-card`).
- Documentar cada intervenção com comentários e apontar conectores de integração quando aplicável.