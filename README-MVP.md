# Health Guardian - MVP (Minimum Viable Product)

Este documento descreve o MVP (Produto Mínimo Viável) do Health Guardian, um sistema de prontuário eletrônico (EMR) para gerenciamento de pacientes e registros médicos.

## Visão Geral do MVP

O MVP do Health Guardian inclui as funcionalidades essenciais para um sistema de prontuário eletrônico funcional, permitindo o gerenciamento básico de pacientes e registros médicos.

## Funcionalidades do MVP

- **Autenticação de Usuários**
  - Login e logout
  - Proteção de rotas

- **Gerenciamento de Pacientes**
  - Cadastro de pacientes
  - Listagem de pacientes
  - Visualização de detalhes do paciente
  - Edição de informações do paciente

- **Registros Médicos**
  - Criação de registros médicos
  - Visualização de histórico de registros
  - Adição de tags aos registros

- **Sistema de Tags**
  - Categorização de informações médicas
  - Busca por tags

## Tecnologias Utilizadas

- **Frontend**: React, React Router, Axios
- **Backend**: Node.js, Express
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT (JSON Web Tokens)

## Configuração do Ambiente de Desenvolvimento

Para configurar e executar o MVP localmente, siga os passos abaixo:

### Pré-requisitos

- Node.js (v14+)
- Docker Desktop
- Git

### Configuração Automatizada

O projeto inclui scripts para facilitar a configuração e execução do ambiente de desenvolvimento:

1. **Configuração inicial do projeto**:
   ```powershell
   .\start-dev-postgresql.ps1
   ```
   Este script verifica as dependências necessárias e instala os pacotes do Node.js para o frontend e backend.

### Configuração Manual

Se preferir configurar manualmente:

1. **Configurar o PostgreSQL**:
   ```
   docker-compose up -d postgres
   ```

2. **Instalar dependências e iniciar o backend**:
   ```
   cd backend
   npm install
   npm run dev
   ```

3. **Instalar dependências e iniciar o frontend**:
   ```
   cd frontend
   npm install
   npm run dev
   ```

4. **Executar migrações do banco de dados**:
   ```
   cd backend
   npm run db:migrate
   ```

5. **Popular o banco com dados iniciais**:
   ```
   cd backend
   npm run db:seed
   ```

6. **Verificar a conexão com o PostgreSQL**:
   ```
   cd backend
   npm run pg:check
   ```

### Acessando o Aplicativo

- **Frontend**: http://localhost:3000
- **API Backend**: http://localhost:5000
- **PostgreSQL**: postgresql://localhost:5432/health_guardian

## Estrutura do Projeto

```
health-guardian/
├── backend/                # Servidor Node.js/Express
│   ├── src/
│   │   ├── config/         # Configurações (banco de dados, etc.)
│   │   ├── controllers/    # Controladores da API
│   │   ├── middleware/     # Middleware (auth, validação, etc.)
│   │   ├── models/         # Modelos do Sequelize
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Serviços de negócios
│   │   ├── utils/          # Utilitários
│   │   └── index.js        # Ponto de entrada do servidor
│   ├── .env                # Variáveis de ambiente
│   └── package.json        # Dependências do backend
│
├── frontend/               # Cliente React
│   ├── public/             # Arquivos estáticos
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── contexts/       # Contextos React
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Serviços (API, etc.)
│   │   ├── utils/          # Utilitários
│   │   ├── App.jsx         # Componente principal
│   │   └── main.jsx        # Ponto de entrada do React
│   └── package.json        # Dependências do frontend
│
├── docs/                   # Documentação
├── docker-compose.yml      # Configuração do Docker
├── setup-project.ps1       # Script de configuração
└── start-dev.ps1           # Script para iniciar o ambiente
```

## Documentação Adicional

- [Configuração do PostgreSQL](./docs/configuracao-postgresql.md)
- [Estrutura de Dados](./docs/estrutura-dados.md) (se disponível)
- [API Endpoints](./docs/api-endpoints.md) (se disponível)

## Próximos Passos (Pós-MVP)

- Implementação de calculadoras médicas
- Sistema avançado de busca
- Geração de relatórios e documentos
- Integração com assistente de IA
- Melhorias de UX/UI
- Testes automatizados

## Solução de Problemas

Se encontrar problemas com a conexão do PostgreSQL:

1. Verifique se o Docker está rodando
2. Execute a verificação de conexão: `npm run pg:check` no diretório `backend`
3. Consulte a documentação em `docs/configuracao-postgresql.md`

## Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request