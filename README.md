# Health Guardian - Prontuário Eletrônico Inteligente

Health Guardian é um sistema de Prontuário Eletrônico do Paciente (EMR) de código aberto, projetado para ser moderno, intuitivo e extensível. Ele combina um backend robusto em Node.js com um frontend reativo em React, e utiliza IA para auxiliar os profissionais de saúde.

## Visão Geral do Projeto

O projeto está dividido em duas partes principais:

-   **`./backend`**: Uma API RESTful construída com Node.js, Express e Sequelize para gerenciar todos os dados e a lógica de negócios.
-   **`./frontend`**: Uma Single Page Application (SPA) construída com React e Vite, que consome a API do backend para fornecer a interface do usuário.

Consulte os arquivos `README.md` dentro de cada um desses diretórios para obter detalhes específicos sobre sua arquitetura e configuração.

## Começando (Ambiente de Desenvolvimento)

Para executar o projeto completo localmente, você precisará ter o Node.js e o npm (ou yarn/pnpm) instalados, além de uma instância do PostgreSQL em execução.

### 1. Backend

Navegue até o diretório `backend`, instale as dependências e inicie o servidor.

```bash
cd backend
npm install
# Configure seu arquivo .env aqui
npm run dev
```

O servidor do backend estará rodando em `http://localhost:5000`.

### 2. Frontend

Em um **novo terminal**, navegue até o diretório `frontend`, instale as dependências e inicie o servidor de desenvolvimento.

```bash
cd frontend
npm install
# O arquivo .env deve ser configurado para apontar para a API
npm run dev
```

O servidor do frontend estará rodando em `http://localhost:3000` (ou uma porta subsequente se a 3000 estiver ocupada).

## 🔗 Mapa de Integrações

### Backend ↔ Frontend
- **API REST**: O backend expõe endpoints em `http://localhost:5000/api`
- **Autenticação**: JWT tokens para autenticação stateless
- **CORS**: Configurado para permitir requisições do frontend

### Backend ↔ Banco de Dados
- **PostgreSQL**: Banco principal com Sequelize ORM
- **Migrações**: Controle de versão do schema do banco
- **Seeds**: Dados iniciais para desenvolvimento

### Frontend ↔ Usuário
- **React Router**: Navegação entre páginas
- **Zustand**: Gerenciamento de estado global
- **Axios**: Cliente HTTP para comunicação com a API

## 🔧 Solução de Problemas Comuns

### Erro `net::ERR_FAILED` no Frontend
**Causa**: Problema de CORS - frontend em porta não permitida pelo backend

**Solução**:
1. Verifique em qual porta o frontend está rodando
2. Se não for 3000-3005, edite `backend/src/app.js`
3. Adicione a nova porta na lista `allowedOrigins`
4. Reinicie o backend

### Backend não inicia
**Verificações**:
- PostgreSQL está rodando?
- Arquivo `.env` existe no backend?
- Dependências instaladas? (`npm install`)

### Frontend não carrega
**Verificações**:
- Dependências instaladas? (`npm install`)
- Arquivo `.env` existe no frontend?
- Backend está rodando em `http://localhost:5000`?

### Erro de autenticação
**Solução**: Crie um médico de teste:
```bash
cd backend
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"medico@teste.com","senha":"123456","nome":"Dr. Teste"}'
```

## Próximos Passos

Consulte o `README-MVP.md` para entender as funcionalidades planejadas e o roadmap do projeto.