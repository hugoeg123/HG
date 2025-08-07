# Backend Migrations Directory

## Visão Geral

Este diretório contém as migrações do banco de dados para a aplicação Health Guardian. As migrações são responsáveis por versionar e aplicar mudanças incrementais no schema do banco de dados, garantindo que todas as instâncias da aplicação tenham a mesma estrutura de dados.

## Estrutura de Migrações

### Convenção de Nomenclatura
```
YYYYMMDDHHMMSS-description-of-change.js
```

**Exemplo**: `20241201120000-create-users-table.js`

### Migrações Existentes

#### `20241201000001-create-users-table.js`
**Propósito**: Criar tabela de usuários do sistema.

**Estrutura**:
- `id`: Chave primária (UUID)
- `name`: Nome completo
- `email`: Email único
- `password`: Senha hasheada
- `role`: Papel no sistema (admin, doctor, nurse)
- `isActive`: Status ativo/inativo
- `createdAt`, `updatedAt`: Timestamps

**Conectores**:
- **Auth**: Base para sistema de autenticação
- **Records**: Referenciado em registros médicos
- **Alerts**: Destinatário de alertas

#### `20241201000002-create-patients-table.js`
**Propósito**: Criar tabela de pacientes.

**Estrutura**:
- `id`: Chave primária (UUID)
- `name`: Nome completo
- `cpf`: CPF único
- `birthDate`: Data de nascimento
- `gender`: Gênero (M/F/O)
- `phone`: Telefone de contato
- `email`: Email do paciente
- `address`: Endereço (JSONB)
- `emergencyContact`: Contato de emergência (JSONB)
- `medicalHistory`: Histórico médico (JSONB)
- `isActive`: Status ativo/inativo
- `createdAt`, `updatedAt`: Timestamps

**Conectores**:
- **Records**: Chave estrangeira em registros
- **Alerts**: Destinatário de alertas
- **AI**: Contexto para análises

#### `20241201000003-create-records-table.js`
**Propósito**: Criar tabela de registros médicos.

**Estrutura**:
- `id`: Chave primária (UUID)
- `patientId`: FK para pacientes
- `doctorId`: FK para usuários (médico)
- `type`: Tipo de registro (consultation, exam, prescription)
- `date`: Data do registro
- `content`: Conteúdo estruturado (TEXT)
- `tags`: Tags aplicadas (ARRAY)
- `status`: Status do registro
- `metadata`: Metadados adicionais (JSONB)
- `createdAt`, `updatedAt`: Timestamps

**Conectores**:
- **Patients**: Vinculado via patientId
- **Users**: Vinculado via doctorId
- **Tags**: Aplicação de tags
- **AI**: Base para análises

#### `20241201000004-create-tags-table.js`
**Propósito**: Criar tabela de definições de tags.

**Estrutura**:
- `id`: Chave primária (UUID)
- `name`: Nome da tag
- `category`: Categoria (specialty, condition, procedure)
- `color`: Cor para UI
- `description`: Descrição da tag
- `isActive`: Status ativo/inativo
- `createdAt`, `updatedAt`: Timestamps

**Conectores**:
- **Records**: Aplicadas em registros
- **Search**: Facilita busca e filtros
- **UI**: Exibição visual

#### `20241201000005-create-templates-table.js`
**Propósito**: Criar tabela de templates de documentos.

**Estrutura**:
- `id`: Chave primária (UUID)
- `name`: Nome do template
- `category`: Categoria do template
- `specialty`: Especialidade médica
- `content`: Conteúdo do template (TEXT)
- `tags`: Tags associadas (ARRAY)
- `isActive`: Status ativo/inativo
- `createdBy`: FK para usuário criador
- `createdAt`, `updatedAt`: Timestamps

**Conectores**:
- **Records**: Base para novos registros
- **Users**: Criado por usuário
- **AI**: Contexto para sugestões

#### `20241201000006-create-alerts-table.js`
**Propósito**: Criar tabela de alertas e notificações.

**Estrutura**:
- `id`: Chave primária (UUID)
- `patientId`: FK para paciente (opcional)
- `userId`: FK para usuário destinatário
- `type`: Tipo de alerta (medication, appointment, exam)
- `priority`: Prioridade (low, medium, high, critical)
- `title`: Título do alerta
- `message`: Mensagem detalhada
- `scheduledFor`: Data/hora agendada
- `sentAt`: Data/hora de envio
- `readAt`: Data/hora de leitura
- `isActive`: Status ativo/inativo
- `metadata`: Metadados adicionais (JSONB)
- `createdAt`, `updatedAt`: Timestamps

**Conectores**:
- **Patients**: Vinculado via patientId
- **Users**: Destinatário via userId
- **Rules**: Baseado em regras de negócio

#### `20241201000007-create-calculators-table.js`
**Propósito**: Criar tabela de calculadoras médicas.

**Estrutura**:
- `id`: Chave primária (UUID)
- `name`: Nome da calculadora
- `category`: Categoria médica
- `description`: Descrição da funcionalidade
- `formula`: Fórmula de cálculo (TEXT)
- `parameters`: Parâmetros de entrada (JSONB)
- `units`: Unidades de medida (JSONB)
- `references`: Referências científicas (JSONB)
- `isActive`: Status ativo/inativo
- `createdBy`: FK para usuário criador
- `createdAt`, `updatedAt`: Timestamps

**Conectores**:
- **AI**: Integração com análises
- **Records**: Resultados salvos em registros
- **Users**: Criado por usuário

## Estrutura de Migração Padrão

```javascript
'use strict';

/**
 * Migration: [Nome da Migração]
 * 
 * Propósito: [Descrição das mudanças no schema]
 * 
 * Conectores:
 * - Cria/modifica tabela [nome] para [propósito]
 * - Integra com [tabela/serviço] via [relacionamento]
 * - Usado por [funcionalidade] para [finalidade]
 * 
 * @author Health Guardian Team
 * @since 1.0.0
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    try {
      console.log('🔄 Executando migração: [nome]...');
      
      await queryInterface.createTable('[table_name]', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        
        // Campos específicos da tabela
        
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
      
      // Criar índices
      await queryInterface.addIndex('[table_name]', ['field1', 'field2']);
      
      // Adicionar constraints
      await queryInterface.addConstraint('[table_name]', {
        fields: ['field'],
        type: 'unique',
        name: '[table_name]_field_unique'
      });
      
      console.log('✅ Migração [nome] concluída com sucesso');
      
    } catch (error) {
      console.error('❌ Erro na migração [nome]:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Revertendo migração: [nome]...');
      
      // Remover constraints
      await queryInterface.removeConstraint('[table_name]', '[table_name]_field_unique');
      
      // Remover índices
      await queryInterface.removeIndex('[table_name]', ['field1', 'field2']);
      
      // Remover tabela
      await queryInterface.dropTable('[table_name]');
      
      console.log('✅ Migração [nome] revertida com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao reverter migração [nome]:', error);
      throw error;
    }
  }
};
```

## Tipos de Migrações

### 1. Criação de Tabelas
```javascript
// Criar nova tabela
await queryInterface.createTable('table_name', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
});
```

### 2. Adição de Colunas
```javascript
// Adicionar nova coluna
await queryInterface.addColumn('table_name', 'new_column', {
  type: DataTypes.STRING(100),
  allowNull: true,
  defaultValue: null
});

// Adicionar múltiplas colunas
await queryInterface.addColumn('table_name', 'column1', {
  type: DataTypes.INTEGER,
  allowNull: false,
  defaultValue: 0
});

await queryInterface.addColumn('table_name', 'column2', {
  type: DataTypes.TEXT,
  allowNull: true
});
```

### 3. Modificação de Colunas
```javascript
// Alterar tipo de coluna
await queryInterface.changeColumn('table_name', 'column_name', {
  type: DataTypes.TEXT, // Novo tipo
  allowNull: false      // Nova configuração
});

// Renomear coluna
await queryInterface.renameColumn('table_name', 'old_name', 'new_name');
```

### 4. Remoção de Colunas
```javascript
// Remover coluna
await queryInterface.removeColumn('table_name', 'column_name');

// Remover múltiplas colunas
await queryInterface.removeColumn('table_name', 'column1');
await queryInterface.removeColumn('table_name', 'column2');
```

### 5. Índices
```javascript
// Adicionar índice simples
await queryInterface.addIndex('table_name', ['column_name']);

// Adicionar índice composto
await queryInterface.addIndex('table_name', ['column1', 'column2'], {
  name: 'table_name_column1_column2_idx',
  unique: false
});

// Adicionar índice único
await queryInterface.addIndex('table_name', ['email'], {
  name: 'table_name_email_unique_idx',
  unique: true
});

// Remover índice
await queryInterface.removeIndex('table_name', 'index_name');
```

### 6. Constraints
```javascript
// Adicionar constraint de chave estrangeira
await queryInterface.addConstraint('records', {
  fields: ['patientId'],
  type: 'foreign key',
  name: 'records_patient_fk',
  references: {
    table: 'patients',
    field: 'id'
  },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Adicionar constraint unique
await queryInterface.addConstraint('users', {
  fields: ['email'],
  type: 'unique',
  name: 'users_email_unique'
});

// Adicionar constraint check
await queryInterface.addConstraint('patients', {
  fields: ['gender'],
  type: 'check',
  name: 'patients_gender_check',
  where: {
    gender: ['M', 'F', 'O']
  }
});

// Remover constraint
await queryInterface.removeConstraint('table_name', 'constraint_name');
```

### 7. Dados Iniciais
```javascript
// Inserir dados iniciais (usar com cuidado)
await queryInterface.bulkInsert('table_name', [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Admin',
    email: 'admin@healthguardian.com',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Atualizar dados existentes
await queryInterface.bulkUpdate('table_name', 
  { isActive: false }, // Valores para atualizar
  { role: 'deprecated' } // Condições
);

// Remover dados
await queryInterface.bulkDelete('table_name', {
  isActive: false
});
```

## Comandos de Migração

### Sequelize CLI
```bash
# Gerar nova migração
npx sequelize-cli migration:generate --name create-table-name

# Executar migrações pendentes
npx sequelize-cli db:migrate

# Reverter última migração
npx sequelize-cli db:migrate:undo

# Reverter todas as migrações
npx sequelize-cli db:migrate:undo:all

# Reverter até migração específica
npx sequelize-cli db:migrate:undo:all --to 20241201000003-create-records-table.js

# Status das migrações
npx sequelize-cli db:migrate:status
```

### Scripts Personalizados
```javascript
// scripts/migrate.js
const { sequelize } = require('../config/database-pg');
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');

const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, '../migrations/*.js')
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console
});

const runMigrations = async (direction = 'up') => {
  try {
    console.log(`🔄 Executando migrações (${direction})...`);
    
    if (direction === 'up') {
      await umzug.up();
      console.log('✅ Todas as migrações executadas com sucesso!');
    } else {
      await umzug.down();
      console.log('✅ Migração revertida com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro nas migrações:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  const direction = process.argv[2] || 'up';
  runMigrations(direction);
}

module.exports = { runMigrations, umzug };
```

## Mapa de Integrações

```
migrations/
├── 20241201000001-create-users-table.js
│   ├── → models/User.js (definição modelo)
│   ├── → auth/ (sistema autenticação)
│   └── → records/ (FK doctorId)
│
├── 20241201000002-create-patients-table.js
│   ├── → models/Patient.js (definição modelo)
│   ├── → records/ (FK patientId)
│   └── → alerts/ (FK patientId)
│
├── 20241201000003-create-records-table.js
│   ├── → models/Record.js (definição modelo)
│   ├── → patients/ (FK patientId)
│   ├── → users/ (FK doctorId)
│   └── → ai/ (análise conteúdo)
│
├── 20241201000004-create-tags-table.js
│   ├── → models/Tag.js (definição modelo)
│   ├── → records/ (aplicação tags)
│   └── → search/ (filtros)
│
├── 20241201000005-create-templates-table.js
│   ├── → models/Template.js (definição modelo)
│   ├── → records/ (base registros)
│   └── → ai/ (contexto)
│
├── 20241201000006-create-alerts-table.js
│   ├── → models/Alert.js (definição modelo)
│   ├── → patients/ (FK patientId)
│   ├── → users/ (FK userId)
│   └── → rules/ (trigger alertas)
│
└── 20241201000007-create-calculators-table.js
    ├── → models/Calculator.js (definição modelo)
    ├── → ai/ (integração análises)
    └── → records/ (salvar resultados)
```

## Versionamento e Controle

### Estratégia de Versionamento
```javascript
// Cada migração deve ter timestamp único
const timestamp = new Date().toISOString()
  .replace(/[-:]/g, '')
  .replace(/\..+/, '');

// Formato: YYYYMMDDHHMMSS
// Exemplo: 20241201143022
```

### Controle de Estado
```javascript
// Verificar se migração já foi executada
const checkMigrationStatus = async (migrationName) => {
  const [results] = await sequelize.query(
    'SELECT * FROM "SequelizeMeta" WHERE name = ?',
    {
      replacements: [migrationName],
      type: sequelize.QueryTypes.SELECT
    }
  );
  
  return results.length > 0;
};

// Marcar migração como executada
const markMigrationComplete = async (migrationName) => {
  await sequelize.query(
    'INSERT INTO "SequelizeMeta" (name) VALUES (?)',
    {
      replacements: [migrationName],
      type: sequelize.QueryTypes.INSERT
    }
  );
};
```

## Validação e Testes

### Validação de Schema
```javascript
// Validar estrutura após migração
const validateTableStructure = async (tableName, expectedColumns) => {
  const tableInfo = await queryInterface.describeTable(tableName);
  
  for (const column of expectedColumns) {
    if (!tableInfo[column.name]) {
      throw new Error(`Coluna ${column.name} não encontrada em ${tableName}`);
    }
    
    if (tableInfo[column.name].type !== column.type) {
      throw new Error(`Tipo incorreto para ${column.name}: esperado ${column.type}, encontrado ${tableInfo[column.name].type}`);
    }
  }
  
  console.log(`✅ Estrutura da tabela ${tableName} validada`);
};
```

### Testes de Migração
```javascript
// tests/migrations.test.js
const { sequelize } = require('../src/config/database-pg');
const { umzug } = require('../src/scripts/migrate');

describe('Database Migrations', () => {
  beforeEach(async () => {
    // Reset database
    await sequelize.drop();
    await sequelize.sync();
  });
  
  test('should run all migrations successfully', async () => {
    await umzug.up();
    
    // Verificar se todas as tabelas foram criadas
    const tables = await sequelize.getQueryInterface().showAllTables();
    expect(tables).toContain('users');
    expect(tables).toContain('patients');
    expect(tables).toContain('records');
  });
  
  test('should rollback migrations correctly', async () => {
    await umzug.up();
    await umzug.down();
    
    const tables = await sequelize.getQueryInterface().showAllTables();
    expect(tables).not.toContain('users');
  });
  
  test('should handle foreign key constraints', async () => {
    await umzug.up();
    
    // Tentar inserir registro com FK inválida
    await expect(
      sequelize.query(
        'INSERT INTO records (id, "patientId", content) VALUES (?, ?, ?)',
        {
          replacements: ['550e8400-e29b-41d4-a716-446655440000', 'invalid-id', 'test'],
          type: sequelize.QueryTypes.INSERT
        }
      )
    ).rejects.toThrow();
  });
});
```

## Dependências

- **sequelize**: ORM para operações de banco
- **sequelize-cli**: CLI para migrações
- **umzug**: Gerenciador de migrações (alternativo)
- **pg**: Driver PostgreSQL
- **uuid**: Geração de IDs únicos

## Hook de Teste

### Cobertura de Testes
```javascript
// Hook: Testa integridade referencial e constraints
const testMigrationIntegrity = async () => {
  // Testar constraints de FK
  // Testar índices únicos
  // Testar validações de dados
  // Testar rollback completo
};
```

## IA Prompt Sugerido

```
IA prompt: "Crie uma nova migração para [alteração específica], incluindo validação de dados, tratamento de rollback, índices apropriados e documentação completa. Siga os padrões estabelecidos e considere impactos em dados existentes."
```

## Segurança e Performance

### Boas Práticas
```javascript
// 1. Sempre usar transações para operações complexas
const transaction = await queryInterface.sequelize.transaction();
try {
  await queryInterface.createTable('table1', schema, { transaction });
  await queryInterface.createTable('table2', schema, { transaction });
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}

// 2. Criar índices para colunas frequentemente consultadas
await queryInterface.addIndex('records', ['patientId', 'date']);

// 3. Usar JSONB para dados semi-estruturados
metadata: {
  type: DataTypes.JSONB,
  defaultValue: {}
}

// 4. Definir constraints apropriadas
await queryInterface.addConstraint('users', {
  fields: ['email'],
  type: 'unique',
  name: 'users_email_unique'
});
```

### Otimização de Performance
```javascript
// Índices parciais para dados ativos
await queryInterface.addIndex('patients', ['isActive'], {
  name: 'patients_active_idx',
  where: {
    isActive: true
  }
});

// Índices compostos para consultas complexas
await queryInterface.addIndex('records', ['patientId', 'type', 'date'], {
  name: 'records_patient_type_date_idx'
});
```

## Troubleshooting

### Problemas Comuns
1. **Constraint Violations**: Verificar dados existentes antes de adicionar constraints
2. **Type Mismatches**: Validar compatibilidade de tipos ao alterar colunas
3. **Index Conflicts**: Verificar se índices já existem antes de criar
4. **Foreign Key Errors**: Garantir que tabelas referenciadas existam

### Debug e Logs
```javascript
// Habilitar logs detalhados
const sequelize = new Sequelize(config.database, config.username, config.password, {
  ...config,
  logging: (sql, timing) => {
    console.log(`[${new Date().toISOString()}] ${sql}`);
    if (timing) console.log(`Execution time: ${timing}ms`);
  }
});
```