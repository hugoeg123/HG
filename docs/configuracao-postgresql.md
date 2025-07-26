# Configuração do PostgreSQL para o Health Guardian

Este documento descreve como configurar o PostgreSQL para o projeto Health Guardian.

## Opções de Configuração

### Opção 1: Usar Docker (Recomendado)

A maneira mais fácil de executar o PostgreSQL é usando Docker:

```bash
# Iniciar o PostgreSQL com Docker Compose
docker-compose up -d postgres

# Verificar se o contêiner está rodando
docker ps

# Ver logs do PostgreSQL
docker logs health-guardian-postgres
```

### Opção 2: Instalação Local

1. Baixe e instale o PostgreSQL: https://www.postgresql.org/download/
2. Durante a instalação, defina a senha do usuário `postgres`
3. Crie o banco de dados:

```sql
CREATE DATABASE health_guardian;
```

## Configuração do Ambiente

O arquivo `.env` no diretório `backend` deve conter:

```env
# Configurações do PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=health_guardian
DB_USER=postgres
DB_PASSWORD=postgres
DB_DIALECT=postgres
```

## Executar Migrações

Após configurar o PostgreSQL, execute as migrações para criar as tabelas:

```bash
cd backend
npm run db:migrate
```

## Popular o Banco de Dados

Para adicionar dados iniciais:

```bash
npm run db:seed
```

## Verificar a Conexão

Para verificar se a conexão está funcionando:

```bash
npm run pg:check
```

## Comandos Úteis

```bash
# Configurar PostgreSQL
npm run pg:setup

# Executar migrações
npm run db:migrate

# Popular com dados iniciais
npm run db:seed

# Verificar conexão
npm run pg:check
```

## Solução de Problemas

### Erro de Conexão

Se você receber erros de conexão:

1. Verifique se o PostgreSQL está rodando:
   ```bash
   docker ps  # Para Docker
   # ou
   sudo systemctl status postgresql  # Para instalação local no Linux
   ```

2. Verifique as configurações no arquivo `.env`

3. Teste a conexão manualmente:
   ```bash
   psql -h localhost -p 5432 -U postgres -d health_guardian
   ```

### Resetar o Banco de Dados

Para resetar completamente o banco:

```bash
# Parar o contêiner
docker-compose down

# Remover o volume
docker volume rm hg1_postgres_data

# Reiniciar
docker-compose up -d postgres

# Executar migrações novamente
cd backend && npm run db:migrate && npm run db:seed
```