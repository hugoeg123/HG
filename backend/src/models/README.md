# Models Directory

## Visão Geral
Diretório contendo os modelos de dados Sequelize para interação com PostgreSQL, organizados por domínio.

## Estrutura

### index.js
- **Função**: Inicializa conexão Sequelize e registra todos os modelos
- **Conectores**:
  - Usa `config/database-pg.js` para configuração
  - Exporta modelos para uso em controllers e services
  - Estabelece associações entre modelos
- **Funcionalidades**: Auto-discovery de modelos, sincronização de banco

### sequelize/ (Subdiretório)
Contém os modelos Sequelize específicos:

#### Registro.js
- **Função**: Modelo principal para registros médicos
- **Conectores**:
  - Relaciona com `Medico.js` via `medico_id`
  - Relaciona com `Paciente.js` via `paciente_id`
  - Usado por `controllers/record.controller.js`
- **Campos Principais**:
  - `id` (UUID, PK)
  - `medico_id` (UUID, FK)
  - `paciente_id` (UUID, FK)
  - `created_at` (TIMESTAMPTZ)
  - `conteudo_raw` (TEXT)

#### Medico.js
- **Função**: Modelo para médicos/usuários do sistema
- **Conectores**:
  - Referenciado por `Registro.js`
  - Usado por `controllers/auth.controller.js`
  - Integra com `middleware/auth.js` para autenticação
- **Relacionamentos**: hasMany com Registro

#### Paciente.js
- **Função**: Modelo para pacientes
- **Conectores**:
  - Referenciado por `Registro.js`
  - Usado por `controllers/patient.controller.js`
  - Integra com `services/patientDashboard.service.js`
- **Relacionamentos**: hasMany com Registro

#### Tag.js
- **Função**: Modelo para sistema de tags
- **Conectores**:
  - Usado por `controllers/tag.controller.js`
  - Integra com parsing de registros
- **Funcionalidades**: Categorização e filtragem de registros

#### Template.js
- **Função**: Modelo para templates de registros
- **Conectores**:
  - Usado por `controllers/template.controller.js`
  - Integra com frontend para criação de registros
- **Campos**: name, type, sections, isActive

#### Alert.js
- **Função**: Modelo para sistema de alertas
- **Conectores**:
  - Usado por `controllers/alert.controller.js`
  - Integra com `services/alert.service.js`
- **Relacionamentos**: belongsTo com User, Record, Patient

#### Calculator.js
- **Função**: Modelo para calculadoras médicas
- **Conectores**:
  - Usado por `controllers/calculator.controller.js`
  - Integra com `services/calculator.service.js`
- **Funcionalidades**: Armazenamento de fórmulas e metadados

## Padrões de Arquitetura

### Convenções de Nomenclatura
- **Tabelas**: snake_case (ex: `registros`, `medicos`)
- **Modelos**: PascalCase (ex: `Registro`, `Medico`)
- **Campos**: snake_case para banco, camelCase para JavaScript

### Relacionamentos
```javascript
// Exemplo de associações
Registro.associate = (models) => {
  Registro.belongsTo(models.Medico, {
    foreignKey: 'medico_id',
    as: 'medico'
  });
  
  Registro.belongsTo(models.Paciente, {
    foreignKey: 'paciente_id',
    as: 'paciente'
  });
};
```

### Validações
- **Sequelize Validations**: Validações de modelo no nível de banco
- **Custom Validators**: Validações específicas de domínio
- **Constraints**: Foreign keys, unique constraints, not null

### Índices
- **Performance**: Índices em campos frequentemente consultados
- **Compostos**: Índices multi-campo para queries complexas
- **Exemplo**: `[medico_id, paciente_id, created_at]`

## Mapa de Integrações
- **Entrada**: Operações via controllers e services
- **Saída**: Dados para API responses
- **Dependências**: PostgreSQL, Sequelize, configurações de ambiente
- **Consumidores**: 
  - Controllers em `src/controllers/`
  - Services em `src/services/`
  - Migrations em `src/migrations/`

## Hooks & Dependencies
- **Triggers**: Operações CRUD via Sequelize
- **Dependencies**: PostgreSQL, variáveis de ambiente, migrações
- **Side Effects**: 
  - Sincronização automática de esquema
  - Triggers de banco para auditoria
  - Validações de integridade referencial

## Missão Zero-Débito
Todos os modelos seguem o padrão "MISSÃO ZERO-DÉBITO":
- **Auditoria**: Campos de timestamp para rastreabilidade
- **Preparação IA**: Estrutura otimizada para processamento de IA
- **Integridade**: Relacionamentos bem definidos
- **Performance**: Índices estratégicos para consultas eficientes