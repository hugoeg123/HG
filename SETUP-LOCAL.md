# Guia de Configuração Local - Health Guardian

## Status da Configuração

✅ **Configurações de Porta Corrigidas:**
- Backend: Porta 5001 (configurada)
- Frontend: Porta 3000 (configurada)
- PostgreSQL: Porta 5432 (padrão)
- API URL: http://localhost:5001/api

## Pré-requisitos Necessários

### 1. PostgreSQL (OBRIGATÓRIO)
O PostgreSQL não está instalado no sistema. Escolha uma das opções:

#### Opção A: Instalação Local do PostgreSQL
1. Baixe o PostgreSQL 14+ em: https://www.postgresql.org/download/windows/
2. Durante a instalação:
   - Porta: 5432 (padrão)
   - Usuário: postgres
   - Senha: postgres (ou configure no .env)
3. Crie o banco de dados:
   ```sql
   CREATE DATABASE health_guardian;
   ```

#### Opção B: Docker Desktop (Recomendado)
1. Instale o Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Inicie o Docker Desktop
3. Execute o comando:
   ```bash
   docker-compose -f docker-compose-postgres.yml up -d
   ```

### 2. Node.js
✅ Verificado - Node.js está instalado

## Configuração Atual

### Backend (.env)
```env
PORT=5001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=health_guardian
DB_USER=postgres
DB_PASSWORD=postgres
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
VITE_NODE_ENV=development
```

## Próximos Passos

1. **Instalar PostgreSQL** (escolha uma opção acima)
2. **Testar conexão com banco**:
   ```bash
   cd backend
   npm run pg:check
   ```
3. **Executar migrações**:
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed
   ```
4. **Iniciar serviços**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Verificação de Funcionamento

- Backend: http://localhost:5001/api/health
- Frontend: http://localhost:3000
- Login teste: medico@teste.com / 123456

## Problemas Identificados

❌ **PostgreSQL não instalado** - Conexão recusada na porta 5432
❌ **Docker Desktop não está rodando** - Necessário para usar containers

## Soluções

1. Instale PostgreSQL localmente OU
2. Instale e inicie o Docker Desktop
3. Execute os comandos de migração
4. Teste a aplicação completa