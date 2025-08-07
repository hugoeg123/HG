# Health Guardian - Backend

Este diretório contém o código-fonte do backend do Health Guardian, uma API REST construída com Node.js, Express e Sequelize.

## Visão Geral

O backend é responsável por gerenciar a lógica de negócios, autenticação de usuários, e persistência de dados no banco de dados PostgreSQL. Ele expõe uma API REST para o frontend consumir.

## Estrutura de Pastas

```
backend/
├── src/
│   ├── config/         # Arquivos de configuração (banco de dados, etc.)
│   ├── controllers/    # Controladores (lógica de requisição/resposta)
│   ├── middleware/     # Middlewares do Express
│   ├── migrations/     # Migrações do banco de dados (Sequelize)
│   ├── models/         # Modelos do Sequelize (representação das tabelas)
│   ├── routes/         # Definição das rotas da API
│   ├── seeders/        # Seeders para popular o banco de dados
│   ├── services/       # Lógica de negócios desacoplada dos controladores
│   ├── utils/          # Funções utilitárias
│   └── app.js          # Arquivo principal da aplicação Express
├── .env                # Variáveis de ambiente (não versionado)
├── package.json        # Dependências e scripts
└── sequelize-config.js # Configuração do Sequelize CLI
```

## Começando

1.  **Instale as dependências:**

    ```bash
    npm install
    ```

2.  **Configure as variáveis de ambiente:**

    Crie um arquivo `.env` na raiz do `backend` a partir do `.env.example` e preencha as variáveis do banco de dados:

    ```
    DB_HOST=localhost
    DB_USER=seu_usuario
    DB_PASSWORD=sua_senha
    DB_NAME=health_guardian
    DB_PORT=5432

    API_PORT=5001
    ```

3.  **Execute as migrações do banco de dados:**

    ```bash
    npx sequelize-cli db:migrate
    ```

4.  **(Opcional) Popule o banco de dados com dados iniciais:**

    ```bash
    npx sequelize-cli db:seed:all
    ```

5.  **Inicie o servidor:**

    ```bash
    npm start
    ```

    A API estará disponível em `http://localhost:5000/api`.

## Ganchos de Integração

-   **Conector (Banco de Dados):** A conexão com o banco de dados PostgreSQL é gerenciada pelo Sequelize. Os modelos estão em `src/models/` e a configuração em `src/config/database.js`.
-   **Conector (Frontend):** A API expõe endpoints em `src/routes/` que são consumidos pelo frontend. A rota base é `/api`.
-   **Conector (Autenticação):** A autenticação é feita via JWT (JSON Web Tokens), com middlewares em `src/middleware/auth.js` para proteger as rotas.

## 🔧 Solução de Problemas

### Erro de Conexão com Banco
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no `.env`
- Execute as migrações: `npm run migrate`

### Erro de Autenticação
- Verifique se `JWT_SECRET` está definido no `.env`
- Confirme se o usuário existe no banco
- Para criar um médico de teste:
  ```bash
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"medico@teste.com","senha":"123456","nome":"Dr. Teste"}'
  ```

### Erro de CORS (`net::ERR_FAILED`)
- **Problema**: Frontend em porta não permitida pelo CORS
- **Solução**: O backend permite portas 3000-3005. Se o frontend estiver em outra porta:
  1. Pare o servidor: `Ctrl+C`
  2. Edite `src/app.js` e adicione a nova porta na lista `allowedOrigins`
  3. Reinicie o servidor: `npm start`
- **Portas permitidas atualmente**: 3000, 3001, 3002, 3003, 3004, 3005

### Erro 404 em Endpoints
- Verifique se o servidor está rodando: `http://localhost:5000/api/health`
- Confirme se a rota existe em `src/routes/`
- Verifique se o controlador está sendo importado corretamente