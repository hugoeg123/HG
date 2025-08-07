# Config Directory

## Visão Geral
Diretório responsável pelas configurações de banco de dados e ambiente da aplicação.

## Arquivos

### database-pg.js
- **Função**: Configuração da conexão com PostgreSQL usando Sequelize
- **Conectores**: 
  - Usado por `models/index.js` para inicializar modelos
  - Referenciado em `app.js` para sincronização do banco
- **Variáveis de Ambiente**: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

### sequelize-config.js
- **Função**: Configuração do Sequelize para diferentes ambientes (development, test, production)
- **Conectores**:
  - Usado pelo Sequelize CLI para migrações e seeds
  - Integra com `database-pg.js` para conexão com PostgreSQL
- **Ambientes**: development, test, production

## Mapa de Integrações
- **Entrada**: Variáveis de ambiente (.env)
- **Saída**: Configurações para modelos Sequelize
- **Dependências**: dotenv, sequelize, pg
- **Consumidores**: 
  - `src/models/index.js`
  - `src/app.js`
  - Sequelize CLI

## Hooks & Dependencies
- **Triggers**: Inicialização da aplicação
- **Dependencies**: PostgreSQL, variáveis de ambiente
- **Side Effects**: Conexão com banco de dados, sincronização de modelos