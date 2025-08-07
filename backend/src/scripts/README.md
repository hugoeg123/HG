# Backend Scripts Directory

## Visão Geral

Este diretório contém scripts de automação, utilitários de desenvolvimento e ferramentas de manutenção para a aplicação Health Guardian. Estes scripts facilitam tarefas comuns de desenvolvimento, deploy e manutenção do sistema.

## Scripts Existentes

### `setup-postgres-env.js`
**Propósito**: Configuração automática do ambiente PostgreSQL para desenvolvimento.

**Funcionalidades**:
- Criação automática de banco de dados
- Configuração de usuário e permissões
- Verificação de conectividade
- Inicialização de schemas básicos

**Uso**:
```bash
node src/scripts/setup-postgres-env.js
```

**Conectores**:
- **Database Config**: Utiliza `config/database-pg.js` para configurações
- **Environment**: Lê variáveis de `.env` para conexão
- **Sequelize**: Integra com configurações do Sequelize

**Dependências**:
- `pg`: Cliente PostgreSQL
- `dotenv`: Carregamento de variáveis de ambiente
- `sequelize`: ORM para operações de banco

## Scripts Recomendados

### `seed-database.js`
**Propósito**: Popular banco de dados com dados iniciais para desenvolvimento.

**Funcionalidades Esperadas**:
```javascript
/**
 * Script de seed para popular banco com dados iniciais
 * 
 * Conectores:
 * - Utiliza models/ para criação de registros
 * - Integra com seeders/ para dados estruturados
 * - Usado em desenvolvimento e testes
 */

const { sequelize } = require('../config/database-pg');
const seeders = require('../seeders');

const seedDatabase = async () => {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');
    
    // Executar seeders em ordem
    await seeders.userSeeder();
    await seeders.patientSeeder();
    await seeders.recordSeeder();
    await seeders.alertSeeder();
    
    console.log('✅ Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
```

### `migrate-database.js`
**Propósito**: Executar migrações de banco de dados de forma controlada.

**Funcionalidades Esperadas**:
```javascript
/**
 * Script para executar migrações de banco
 * 
 * Conectores:
 * - Utiliza migrations/ para alterações de schema
 * - Integra com Sequelize CLI
 * - Usado em deploy e atualizações
 */

const { exec } = require('child_process');
const path = require('path');

const runMigrations = async (direction = 'up') => {
  const command = direction === 'up' 
    ? 'npx sequelize-cli db:migrate'
    : 'npx sequelize-cli db:migrate:undo';
    
  return new Promise((resolve, reject) => {
    exec(command, { cwd: path.join(__dirname, '../..') }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erro na migração:', error);
        reject(error);
      } else {
        console.log('✅ Migração concluída:', stdout);
        resolve(stdout);
      }
    });
  });
};
```

### `backup-database.js`
**Propósito**: Criar backups automáticos do banco de dados.

**Funcionalidades Esperadas**:
```javascript
/**
 * Script de backup automático
 * 
 * Conectores:
 * - Utiliza pg_dump para PostgreSQL
 * - Integra com storage (local/cloud)
 * - Usado em produção para backups regulares
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const createBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `backup-${timestamp}.sql`;
  const backupPath = path.join(__dirname, '../../backups', backupFile);
  
  const command = `pg_dump ${process.env.DATABASE_URL} > ${backupPath}`;
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erro no backup:', error);
        reject(error);
      } else {
        console.log(`✅ Backup criado: ${backupFile}`);
        resolve(backupPath);
      }
    });
  });
};
```

### `health-check.js`
**Propósito**: Verificar saúde do sistema e dependências.

**Funcionalidades Esperadas**:
```javascript
/**
 * Script de health check do sistema
 * 
 * Conectores:
 * - Verifica conexão com banco de dados
 * - Testa APIs externas
 * - Valida configurações críticas
 */

const { sequelize } = require('../config/database-pg');
const axios = require('axios');

const healthCheck = async () => {
  const checks = {
    database: false,
    redis: false,
    externalAPIs: false,
    diskSpace: false
  };
  
  try {
    // Verificar banco de dados
    await sequelize.authenticate();
    checks.database = true;
    console.log('✅ Database: OK');
    
    // Verificar Redis (se usado)
    // await redisClient.ping();
    // checks.redis = true;
    
    // Verificar APIs externas
    // const response = await axios.get('https://api.external.com/health');
    // checks.externalAPIs = response.status === 200;
    
    // Verificar espaço em disco
    const stats = require('fs').statSync('.');
    checks.diskSpace = true; // Implementar verificação real
    
    return checks;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return checks;
  }
};
```

### `cleanup-logs.js`
**Propósito**: Limpeza automática de logs antigos.

**Funcionalidades Esperadas**:
```javascript
/**
 * Script de limpeza de logs
 * 
 * Conectores:
 * - Remove logs antigos baseado em data
 * - Compacta logs antes da remoção
 * - Usado em cron jobs para manutenção
 */

const fs = require('fs').promises;
const path = require('path');
const { gzip } = require('zlib');
const { promisify } = require('util');

const gzipAsync = promisify(gzip);

const cleanupLogs = async (retentionDays = 30) => {
  const logsDir = path.join(__dirname, '../../logs');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  try {
    const files = await fs.readdir(logsDir);
    
    for (const file of files) {
      const filePath = path.join(logsDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime < cutoffDate) {
        if (!file.endsWith('.gz')) {
          // Compactar antes de remover
          const content = await fs.readFile(filePath);
          const compressed = await gzipAsync(content);
          await fs.writeFile(`${filePath}.gz`, compressed);
        }
        
        await fs.unlink(filePath);
        console.log(`🗑️ Removido: ${file}`);
      }
    }
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  }
};
```

### `generate-docs.js`
**Propósito**: Gerar documentação automática da API.

**Funcionalidades Esperadas**:
```javascript
/**
 * Gerador de documentação automática
 * 
 * Conectores:
 * - Analisa routes/ para endpoints
 * - Gera documentação OpenAPI/Swagger
 * - Integra com JSDoc comments
 */

const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs').promises;
const path = require('path');

const generateDocs = async () => {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Health Guardian API',
        version: '1.0.0',
        description: 'API documentation for Health Guardian'
      },
      servers: [
        {
          url: process.env.API_URL || 'http://localhost:5001',
          description: 'Development server'
        }
      ]
    },
    apis: ['./src/routes/*.js', './src/controllers/*.js']
  };
  
  const specs = swaggerJsdoc(options);
  const docsPath = path.join(__dirname, '../../docs/api.json');
  
  await fs.writeFile(docsPath, JSON.stringify(specs, null, 2));
  console.log('📚 Documentação gerada em:', docsPath);
};
```

### `performance-test.js`
**Propósito**: Testes de performance e carga.

**Funcionalidades Esperadas**:
```javascript
/**
 * Script de teste de performance
 * 
 * Conectores:
 * - Testa endpoints críticos
 * - Mede tempo de resposta
 * - Gera relatórios de performance
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

const performanceTest = async () => {
  const baseURL = process.env.API_URL || 'http://localhost:5001';
  const endpoints = [
    '/api/patients',
    '/api/records',
    '/api/alerts',
    '/api/ai/chat'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const start = performance.now();
    
    try {
      const response = await axios.get(`${baseURL}${endpoint}`);
      const end = performance.now();
      
      results.push({
        endpoint,
        status: response.status,
        responseTime: end - start,
        success: true
      });
    } catch (error) {
      const end = performance.now();
      
      results.push({
        endpoint,
        status: error.response?.status || 0,
        responseTime: end - start,
        success: false,
        error: error.message
      });
    }
  }
  
  console.table(results);
  return results;
};
```

## Estrutura de Script Padrão

```javascript
#!/usr/bin/env node

/**
 * [Nome do Script]
 * 
 * Propósito: [Descrição da funcionalidade]
 * 
 * Uso: node src/scripts/[nome-do-script].js [argumentos]
 * 
 * Conectores:
 * - Integra com [módulo/serviço] para [funcionalidade]
 * - Utiliza [dependência] para [propósito]
 * 
 * Dependências:
 * - [biblioteca]: [versão] - [propósito]
 * 
 * @author Health Guardian Team
 * @since 1.0.0
 */

require('dotenv').config();

const main = async () => {
  try {
    console.log('🚀 Iniciando [nome do script]...');
    
    // Validar argumentos
    const args = process.argv.slice(2);
    if (args.length < 1) {
      console.error('❌ Uso: node script.js <argumento>');
      process.exit(1);
    }
    
    // Lógica principal
    const result = await executeScript(args);
    
    console.log('✅ Script concluído com sucesso!');
    console.log('📊 Resultado:', result);
    
  } catch (error) {
    console.error('❌ Erro na execução:', error.message);
    console.error('🔍 Stack trace:', error.stack);
    process.exit(1);
  }
};

const executeScript = async (args) => {
  // Implementação específica
};

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { executeScript };
```

## Mapa de Integrações

```
scripts/
├── setup-postgres-env.js
│   ├── → config/database-pg.js
│   ├── → .env (variáveis)
│   └── → sequelize (configuração)
│
├── seed-database.js
│   ├── → models/ (criação de dados)
│   ├── → seeders/ (dados estruturados)
│   └── → desenvolvimento/testes
│
├── migrate-database.js
│   ├── → migrations/ (alterações schema)
│   ├── → Sequelize CLI
│   └── → deploy/atualizações
│
├── backup-database.js
│   ├── → pg_dump (PostgreSQL)
│   ├── → storage (local/cloud)
│   └── → produção (backups regulares)
│
├── health-check.js
│   ├── → config/database-pg.js
│   ├── → APIs externas
│   └── → monitoramento
│
├── cleanup-logs.js
│   ├── → logs/ (arquivos de log)
│   ├── → cron jobs
│   └── → manutenção
│
├── generate-docs.js
│   ├── → routes/ (endpoints)
│   ├── → controllers/ (JSDoc)
│   └── → docs/ (documentação)
│
└── performance-test.js
    ├── → API endpoints
    ├── → métricas de performance
    └── → relatórios
```

## Automação e Cron Jobs

### Configuração de Cron
```bash
# Backup diário às 2:00 AM
0 2 * * * cd /path/to/app && node src/scripts/backup-database.js

# Limpeza de logs semanal
0 3 * * 0 cd /path/to/app && node src/scripts/cleanup-logs.js

# Health check a cada 5 minutos
*/5 * * * * cd /path/to/app && node src/scripts/health-check.js

# Geração de docs diária
0 1 * * * cd /path/to/app && node src/scripts/generate-docs.js
```

### Scripts de Deploy
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Iniciando deploy..."

# Backup antes do deploy
node src/scripts/backup-database.js

# Executar migrações
node src/scripts/migrate-database.js

# Health check pós-deploy
node src/scripts/health-check.js

echo "✅ Deploy concluído!"
```

## Dependências Comuns

- **dotenv**: Carregamento de variáveis de ambiente
- **pg**: Cliente PostgreSQL
- **sequelize**: ORM para operações de banco
- **axios**: Cliente HTTP para testes
- **fs/path**: Operações de sistema de arquivos
- **child_process**: Execução de comandos do sistema
- **zlib**: Compressão de arquivos
- **swagger-jsdoc**: Geração de documentação

## Logging e Monitoramento

### Estrutura de Log
```javascript
const logger = {
  info: (message, data) => {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`, data || '');
  },
  error: (message, error) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error || '');
  },
  success: (message, data) => {
    console.log(`[${new Date().toISOString()}] ✅ ${message}`, data || '');
  },
  warning: (message, data) => {
    console.warn(`[${new Date().toISOString()}] ⚠️ ${message}`, data || '');
  }
};
```

### Métricas de Performance
```javascript
const measurePerformance = async (operation, fn) => {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1000000; // Convert to milliseconds
  
  logger.info(`Performance: ${operation} took ${duration.toFixed(2)}ms`);
  return result;
};
```

## Hook de Teste

### Testes de Scripts
```javascript
// Exemplo de teste para script
const { executeScript } = require('../setup-postgres-env');

describe('Setup PostgreSQL Script', () => {
  test('should setup database successfully', async () => {
    const result = await executeScript(['test']);
    expect(result.success).toBe(true);
  });
  
  test('should handle connection errors', async () => {
    // Mock connection error
    const result = await executeScript(['invalid']);
    expect(result.success).toBe(false);
  });
});
```

## IA Prompt Sugerido

```
IA prompt: "Crie um novo script para [funcionalidade específica], incluindo validação de argumentos, tratamento de erros, logging estruturado e documentação JSDoc. Siga os padrões estabelecidos nos scripts existentes e documente todas as integrações."
```

## Segurança

### Validação de Entrada
```javascript
const validateArgs = (args, required) => {
  if (args.length < required.length) {
    throw new Error(`Argumentos insuficientes. Requeridos: ${required.join(', ')}`);
  }
  
  // Sanitizar argumentos
  return args.map(arg => arg.toString().trim());
};
```

### Execução Segura
```javascript
const safeExec = (command) => {
  // Validar comando para prevenir injection
  const allowedCommands = ['pg_dump', 'sequelize-cli'];
  const baseCommand = command.split(' ')[0];
  
  if (!allowedCommands.includes(baseCommand)) {
    throw new Error(`Comando não permitido: ${baseCommand}`);
  }
  
  return exec(command);
};
```

## Troubleshooting

### Problemas Comuns
1. **Permissões**: Verificar permissões de arquivo e banco
2. **Variáveis de Ambiente**: Validar .env está carregado
3. **Dependências**: Verificar se todas as dependências estão instaladas
4. **Conectividade**: Testar conexão com banco e APIs externas

### Debug
- **Verbose Mode**: Adicionar flag -v para logs detalhados
- **Dry Run**: Implementar modo de teste sem execução real
- **Step by Step**: Executar scripts em etapas para identificar falhas