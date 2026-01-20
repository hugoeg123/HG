# Guia de Início Rápido - Health Guardian

Este guia te ajudará a configurar e executar o Health Guardian com PostgreSQL rapidamente.

## Pré-requisitos

1. **Node.js** (v14+) - [Download](https://nodejs.org/)
2. **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
3. **Git** - [Download](https://git-scm.com/)

## Passos para Inicialização

### 1. Iniciar o Docker Desktop

**IMPORTANTE**: Antes de continuar, certifique-se de que o Docker Desktop está rodando:

- No Windows: Procure por "Docker Desktop" no menu Iniciar e execute
- Aguarde até ver o ícone do Docker na bandeja do sistema
- O ícone deve estar verde/azul (não vermelho)

### 2. Clonar e Configurar o Projeto

```bash
# Se ainda não clonou o projeto
git clone <url-do-repositorio>
cd HG1

# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
cd ..
```

### 3. Iniciar o PostgreSQL

```bash
# Iniciar o PostgreSQL com Docker (pgvector)
docker compose -f docker-compose-postgres.yml up -d postgres

# Verificar se está rodando
docker ps
```

Você deve ver algo como:
```
CONTAINER ID   IMAGE                 COMMAND                  CREATED         STATUS         PORTS                    NAMES
xxxxxxxxx      pgvector/pgvector:14  "docker-entrypoint.s…"   X seconds ago   Up X seconds   0.0.0.0:5432->5432/tcp   health-guardian-postgres
```

### 4. Configurar o Banco de Dados

```bash
cd backend

# Executar migrações (criar tabelas)
npm run db:migrate

# Popular com dados iniciais
npm run db:seed

# Verificar conexão
npm run pg:check
```

### 5. Iniciar os Serviços

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Acessar a Aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **PostgreSQL**: postgresql://localhost:5432/health-guardian

## Script Automatizado (Alternativa)

Se preferir, use o script automatizado:

```powershell
# No PowerShell (Windows)
.\start-dev-postgresql.ps1
```

## Solução de Problemas Comuns

### Docker não está rodando
```
Erro: unable to get image 'postgres:15': error during connect
```
**Solução**: Inicie o Docker Desktop e aguarde até estar completamente carregado.

### Porta 5432 já está em uso
```
Erro: port is already allocated
```
**Solução**: 
```bash
# Parar outros serviços PostgreSQL
docker compose -f docker-compose-postgres.yml down
# ou
docker stop $(docker ps -q --filter "publish=5432")
```

### Erro de conexão com o banco
```
Erro: connection refused
```
**Solução**:
1. Verifique se o PostgreSQL está rodando: `docker ps`
2. Aguarde alguns segundos para o banco inicializar
3. Verifique as configurações no arquivo `backend/.env`

### Migrações falharam
```
Erro: sequelize-cli não é reconhecido
```
**Solução**:
```bash
cd backend
npm install --save-dev sequelize-cli
npm run db:migrate
```

## Comandos Úteis

```bash
# Ver logs do PostgreSQL
docker logs health-guardian-postgres

# Parar todos os serviços
docker-compose down

# Resetar o banco de dados
docker compose -f docker-compose-postgres.yml down
docker volume rm hg1_postgres_data
docker compose -f docker-compose-postgres.yml up -d postgres
cd backend && npm run db:migrate && npm run db:seed

# Verificar status dos contêineres
docker ps

# Conectar ao PostgreSQL diretamente
docker exec -it health-guardian-postgres psql -U postgres -d health_guardian
```

## Próximos Passos

Após a configuração inicial:

1. Explore a interface em http://localhost:3000
2. Teste as funcionalidades de cadastro de pacientes
3. Crie alguns registros médicos
4. Consulte a documentação em `docs/` para funcionalidades avançadas

## Suporte

Se encontrar problemas:

1. Consulte a [documentação do PostgreSQL](./docs/configuracao-postgresql.md)
2. Verifique os logs dos serviços
3. Certifique-se de que todas as dependências estão instaladas
