# Documentação da Estratégia de Testes

Este documento descreve o estado atual da estratégia de testes no projeto Health-Guardian e define um plano de ação para implementar uma suíte de testes robusta, alinhada com as regras do projeto.

## Estado Atual (Débito Técnico Crítico)

**ALERTA:** Atualmente, o projeto **NÃO POSSUI UMA SUÍTE DE TESTES AUTOMATIZADOS**.

- Uma busca por arquivos de teste (`.test.js`, `.spec.js`) não retornou nenhum arquivo de teste real.
- Foram encontradas apenas referências a nomes de arquivos de teste em um arquivo `README.md` (`frontend/src/hooks/README.md`), indicando uma intenção não realizada de criar testes.

**Consequência:** A ausência de testes automatizados representa um risco significativo para a estabilidade e manutenibilidade do projeto. Cada nova alteração ou refatoração tem o potencial de introduzir regressões (bugs em funcionalidades existentes) que não serão detectadas automaticamente. Isso torna o desenvolvimento mais lento, mais arriscado e mais caro a longo prazo.

## Plano de Ação para Implementação de Testes

Para mitigar esse risco e alinhar o projeto com as melhores práticas e as regras definidas, propõe-se a seguinte estratégia de implementação de testes, dividida em fases.

### Ferramentas Recomendadas

- **Frontend (React):**
  - **Vitest:** Um framework de testes moderno, rápido e compatível com Vite.
  - **React Testing Library:** Para testar componentes React da maneira como os usuários os utilizam.
  - **Mock Service Worker (MSW):** Para interceptar e simular chamadas de API, permitindo testar componentes de forma isolada do backend.

- **Backend (Node.js/Express):**
  - **Jest:** Um framework de testes popular e completo para JavaScript.
  - **Supertest:** Para testar os endpoints da API HTTP de forma programática.
  - **Sequelize-Mock:** Para simular o banco de dados e testar a lógica dos modelos e serviços de forma isolada.

### Fase 1: Testes de Unidade (Backend)

O objetivo desta fase é testar as menores partes lógicas do backend de forma isolada.

1.  **Configurar o Ambiente de Testes:** Instalar e configurar Jest e Supertest no backend.
2.  **Testar Funções Puras:** Começar com testes para funções utilitárias e de lógica de negócios que não dependem de requisições ou do banco de dados (ex: funções em `backend/src/core`).
3.  **Testar Serviços com Mocks:** Testar os serviços (ex: `calculator.service.js`) usando mocks para as dependências (como os modelos Sequelize).

### Fase 2: Testes de Integração (Backend)

O objetivo é testar como as diferentes partes do backend funcionam juntas, especialmente as rotas da API.

1.  **Testar Endpoints da API:** Usar o Supertest para fazer requisições HTTP reais aos endpoints da API e verificar as respostas.
2.  **Usar um Banco de Dados de Teste:** Configurar o Sequelize para usar um banco de dados de teste separado (ou em memória, como o SQLite) para garantir que os testes não afetem os dados de desenvolvimento.
3.  **Exemplo de Teste (`/api/patients`):
    - `GET /api/patients`: Deve retornar um array de pacientes.
    - `POST /api/patients`: Deve criar um novo paciente e retornar 201.
    - `POST /api/patients` com dados inválidos: Deve retornar 400.

### Fase 3: Testes de Componentes (Frontend)

O objetivo é testar os componentes React de forma isolada.

1.  **Configurar o Ambiente de Testes:** Instalar e configurar Vitest e React Testing Library no frontend.
2.  **Testar Componentes de UI:** Começar com os componentes mais simples em `frontend/src/components/ui`, verificando se eles renderizam corretamente com diferentes props.
3.  **Testar Componentes Funcionais:** Testar componentes mais complexos, simulando interações do usuário (cliques, digitação) e verificando se o estado do componente muda conforme o esperado.

### Fase 4: Testes de Integração (Frontend)

O objetivo é testar como os componentes do frontend interagem com os serviços e o estado global.

1.  **Configurar o MSW:** Instalar e configurar o Mock Service Worker para interceptar as chamadas feitas pelo `api.js`.
2.  **Testar Fluxos Completos:** Simular um fluxo de usuário completo. Exemplo: "Login de Usuário".
    - Renderizar a página de Login.
    - Simular a digitação do email e senha.
    - Simular o clique no botão "Entrar".
    - Verificar se o MSW interceptou a chamada `POST /api/auth/login`.
    - Verificar se o `authStore` foi atualizado com o token.
    - Verificar se o usuário foi redirecionado para a página principal.

## Documentação e Cobertura

- **Localização:** Os arquivos de teste devem ser colocados em um diretório `__tests__` dentro da pasta do módulo que está sendo testado (ex: `frontend/src/components/ui/__tests__/Button.test.jsx`).
- **Cobertura de Código:** A meta deve ser atingir uma cobertura de testes de pelo menos 70% para novas funcionalidades e, gradualmente, aumentar a cobertura para o código legado.