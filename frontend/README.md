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
    VITE_API_URL=http://localhost:5000/api
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