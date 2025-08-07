# Backend Seeders Directory

## Visão Geral

Este diretório contém seeders para popular o banco de dados com dados iniciais necessários para desenvolvimento, testes e demonstração da aplicação Health Guardian. Os seeders garantem que o sistema tenha dados consistentes e realistas para funcionar adequadamente.

## Estrutura de Seeders

### Seeders Existentes

#### `20241201000001-demo-users.js`
**Propósito**: Criar usuários de demonstração para diferentes perfis.

**Dados Incluídos**:
- Administrador do sistema
- Médicos especialistas
- Enfermeiros
- Usuários de teste

**Conectores**:
- **Models**: Utiliza `models/User.js` para criação
- **Auth**: Integra com sistema de autenticação
- **Permissions**: Define roles e permissões

#### `20241201000002-demo-patients.js`
**Propósito**: Criar pacientes de demonstração com dados realistas.

**Dados Incluídos**:
- Pacientes com diferentes idades
- Variados históricos médicos
- Diferentes condições de saúde
- Dados demográficos diversos

**Conectores**:
- **Models**: Utiliza `models/Patient.js`
- **Records**: Base para criação de registros médicos
- **Alerts**: Trigger para alertas automáticos

#### `20241201000003-demo-records.js`
**Propósito**: Criar registros médicos de exemplo.

**Dados Incluídos**:
- Consultas médicas
- Exames laboratoriais
- Prescrições
- Diagnósticos

**Conectores**:
- **Models**: Utiliza `models/Record.js`
- **Tags**: Inclui tags estruturadas
- **AI**: Base para análises de IA

#### `20241201000004-demo-tags.js`
**Propósito**: Definir tags padrão para categorização.

**Dados Incluídos**:
- Tags de sintomas
- Tags de diagnósticos
- Tags de medicamentos
- Tags de procedimentos

**Conectores**:
- **Models**: Utiliza `models/Tag.js`
- **Records**: Aplicadas em registros
- **Search**: Facilita busca e filtros

#### `20241201000005-demo-templates.js`
**Propósito**: Criar templates de documentos médicos.

**Dados Incluídos**:
- Templates de consulta
- Templates de exames
- Templates de relatórios
- Templates de prescrições

**Conectores**:
- **Models**: Utiliza `models/Template.js`
- **Records**: Base para novos registros
- **AI**: Contexto para sugestões

#### `20241201000006-demo-alerts.js`
**Propósito**: Criar alertas de exemplo para demonstração.

**Dados Incluídos**:
- Alertas críticos
- Lembretes de medicação
- Alertas de exames
- Notificações de acompanhamento

**Conectores**:
- **Models**: Utiliza `models/Alert.js`
- **Patients**: Vinculados a pacientes
- **Rules**: Baseados em regras de negócio

## Estrutura de Seeder Padrão

```javascript
'use strict';

/**
 * Seeder: [Nome do Seeder]
 * 
 * Propósito: [Descrição dos dados criados]
 * 
 * Conectores:
 * - Utiliza models/[Model].js para criação
 * - Integra com [serviço/funcionalidade] para [propósito]
 * - Usado em [ambiente] para [finalidade]
 * 
 * @author Health Guardian Team
 * @since 1.0.0
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    try {
      console.log('🌱 Executando seeder: [nome]...');
      
      // Verificar se dados já existem
      const existingData = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM "[table_name]"',
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (existingData[0].count > 0) {
        console.log('⚠️ Dados já existem, pulando seeder...');
        return;
      }
      
      // Dados para inserção
      const seedData = [
        {
          // Campos do modelo
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Inserir dados
      await queryInterface.bulkInsert('[table_name]', seedData);
      
      console.log(`✅ Seeder [nome] concluído: ${seedData.length} registros criados`);
      
    } catch (error) {
      console.error('❌ Erro no seeder [nome]:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('🗑️ Revertendo seeder: [nome]...');
      
      // Remover dados específicos do seeder
      await queryInterface.bulkDelete('[table_name]', {
        // Condições para identificar dados do seeder
      });
      
      console.log('✅ Seeder [nome] revertido com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao reverter seeder [nome]:', error);
      throw error;
    }
  }
};
```

## Dados de Demonstração

### Usuários Demo
```javascript
const demoUsers = [
  {
    name: 'Dr. João Silva',
    email: 'joao.silva@healthguardian.com',
    role: 'doctor',
    specialty: 'Cardiologia',
    crm: '12345-SP',
    isActive: true
  },
  {
    name: 'Enfermeira Maria Santos',
    email: 'maria.santos@healthguardian.com',
    role: 'nurse',
    department: 'UTI',
    coren: '54321-SP',
    isActive: true
  },
  {
    name: 'Admin Sistema',
    email: 'admin@healthguardian.com',
    role: 'admin',
    permissions: ['all'],
    isActive: true
  }
];
```

### Pacientes Demo
```javascript
const demoPatients = [
  {
    name: 'Ana Costa',
    cpf: '123.456.789-01',
    birthDate: '1985-03-15',
    gender: 'F',
    phone: '(11) 99999-1234',
    email: 'ana.costa@email.com',
    address: {
      street: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    },
    emergencyContact: {
      name: 'Carlos Costa',
      relationship: 'Esposo',
      phone: '(11) 99999-5678'
    },
    medicalHistory: {
      allergies: ['Penicilina'],
      chronicConditions: ['Hipertensão'],
      medications: ['Losartana 50mg']
    }
  },
  {
    name: 'Pedro Oliveira',
    cpf: '987.654.321-09',
    birthDate: '1970-08-22',
    gender: 'M',
    phone: '(11) 88888-9876',
    email: 'pedro.oliveira@email.com',
    address: {
      street: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100'
    },
    emergencyContact: {
      name: 'Lucia Oliveira',
      relationship: 'Esposa',
      phone: '(11) 88888-1234'
    },
    medicalHistory: {
      allergies: [],
      chronicConditions: ['Diabetes Tipo 2'],
      medications: ['Metformina 850mg']
    }
  }
];
```

### Registros Médicos Demo
```javascript
const demoRecords = [
  {
    patientId: 1, // Ana Costa
    doctorId: 1,  // Dr. João Silva
    type: 'consultation',
    date: '2024-01-15',
    content: `
      #CONSULTA: Cardiologia
      #MOTIVO: Dor no peito
      #SINTOMAS: Dor precordial, dispneia aos esforços
      #EXAME_FISICO: PA: 140/90 mmHg, FC: 85 bpm
      #DIAGNOSTICO: Hipertensão arterial sistêmica
      #CONDUTA: Iniciar Losartana 50mg 1x/dia
      #RETORNO: 30 dias
    `,
    tags: ['cardiologia', 'hipertensao', 'consulta'],
    status: 'completed'
  },
  {
    patientId: 2, // Pedro Oliveira
    doctorId: 1,  // Dr. João Silva
    type: 'exam',
    date: '2024-01-20',
    content: `
      #EXAME: Glicemia de jejum
      #RESULTADO: 180 mg/dL
      #REFERENCIA: 70-99 mg/dL
      #INTERPRETACAO: Hiperglicemia
      #OBSERVACOES: Paciente em jejum de 12h
    `,
    tags: ['diabetes', 'laboratorio', 'glicemia'],
    status: 'completed'
  }
];
```

### Tags Demo
```javascript
const demoTags = [
  // Tags de Especialidades
  { name: 'cardiologia', category: 'specialty', color: '#FF6B6B' },
  { name: 'endocrinologia', category: 'specialty', color: '#4ECDC4' },
  { name: 'neurologia', category: 'specialty', color: '#45B7D1' },
  
  // Tags de Condições
  { name: 'hipertensao', category: 'condition', color: '#96CEB4' },
  { name: 'diabetes', category: 'condition', color: '#FFEAA7' },
  { name: 'asma', category: 'condition', color: '#DDA0DD' },
  
  // Tags de Procedimentos
  { name: 'consulta', category: 'procedure', color: '#74B9FF' },
  { name: 'exame', category: 'procedure', color: '#A29BFE' },
  { name: 'cirurgia', category: 'procedure', color: '#FD79A8' },
  
  // Tags de Medicamentos
  { name: 'anti-hipertensivo', category: 'medication', color: '#00B894' },
  { name: 'hipoglicemiante', category: 'medication', color: '#FDCB6E' },
  { name: 'antibiotico', category: 'medication', color: '#E17055' }
];
```

### Templates Demo
```javascript
const demoTemplates = [
  {
    name: 'Consulta Cardiológica',
    category: 'consultation',
    specialty: 'cardiologia',
    content: `
#CONSULTA: Cardiologia
#MOTIVO: [Motivo da consulta]
#HDA: [História da doença atual]
#HPP: [História patológica pregressa]
#MEDICACOES: [Medicações em uso]
#EXAME_FISICO:
  - PA: [Pressão arterial]
  - FC: [Frequência cardíaca]
  - Ausculta cardíaca: [Achados]
  - Ausculta pulmonar: [Achados]
#DIAGNOSTICO: [Diagnóstico principal]
#CONDUTA: [Plano terapêutico]
#RETORNO: [Data do retorno]
    `,
    tags: ['cardiologia', 'consulta', 'template'],
    isActive: true
  },
  {
    name: 'Exame Laboratorial',
    category: 'exam',
    specialty: 'geral',
    content: `
#EXAME: [Nome do exame]
#DATA_COLETA: [Data da coleta]
#RESULTADO: [Resultado obtido]
#REFERENCIA: [Valores de referência]
#INTERPRETACAO: [Interpretação clínica]
#OBSERVACOES: [Observações relevantes]
    `,
    tags: ['laboratorio', 'exame', 'template'],
    isActive: true
  },
  {
    name: 'Prescrição Médica',
    category: 'prescription',
    specialty: 'geral',
    content: `
#PRESCRICAO: [Data]
#PACIENTE: [Nome do paciente]
#MEDICAMENTOS:
  1. [Medicamento] - [Dosagem] - [Posologia] - [Duração]
  2. [Medicamento] - [Dosagem] - [Posologia] - [Duração]
#ORIENTACOES: [Orientações gerais]
#RETORNO: [Data do retorno]
#MEDICO: [Nome e CRM do médico]
    `,
    tags: ['prescricao', 'medicamento', 'template'],
    isActive: true
  }
];
```

### Alertas Demo
```javascript
const demoAlerts = [
  {
    patientId: 1,
    type: 'medication',
    priority: 'high',
    title: 'Lembrete de Medicação',
    message: 'Hora de tomar Losartana 50mg',
    scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 horas
    isActive: true,
    metadata: {
      medication: 'Losartana 50mg',
      dosage: '1 comprimido',
      frequency: 'diário'
    }
  },
  {
    patientId: 2,
    type: 'appointment',
    priority: 'medium',
    title: 'Consulta de Retorno',
    message: 'Consulta agendada para acompanhamento de diabetes',
    scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    isActive: true,
    metadata: {
      specialty: 'endocrinologia',
      doctor: 'Dr. João Silva',
      type: 'retorno'
    }
  },
  {
    patientId: 1,
    type: 'exam',
    priority: 'low',
    title: 'Exame Periódico',
    message: 'Realizar exames de rotina (hemograma, glicemia)',
    scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
    isActive: true,
    metadata: {
      exams: ['hemograma', 'glicemia', 'colesterol'],
      frequency: 'trimestral'
    }
  }
];
```

## Execução de Seeders

### Comandos Sequelize CLI
```bash
# Executar todos os seeders
npx sequelize-cli db:seed:all

# Executar seeder específico
npx sequelize-cli db:seed --seed 20241201000001-demo-users.js

# Reverter todos os seeders
npx sequelize-cli db:seed:undo:all

# Reverter seeder específico
npx sequelize-cli db:seed:undo --seed 20241201000001-demo-users.js
```

### Script Personalizado
```javascript
// scripts/seed-database.js
const { sequelize } = require('../config/database-pg');
const seeders = require('../seeders');

const runSeeders = async () => {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');
    
    // Executar seeders em ordem específica
    const seederOrder = [
      'demo-users',
      'demo-patients', 
      'demo-tags',
      'demo-templates',
      'demo-records',
      'demo-alerts'
    ];
    
    for (const seederName of seederOrder) {
      console.log(`📦 Executando seeder: ${seederName}`);
      await seeders[seederName].up(sequelize.getQueryInterface(), sequelize.Sequelize);
    }
    
    console.log('✅ Todos os seeders executados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na execução dos seeders:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  runSeeders();
}

module.exports = runSeeders;
```

## Mapa de Integrações

```
seeders/
├── 20241201000001-demo-users.js
│   ├── → models/User.js (criação)
│   ├── → auth/ (sistema autenticação)
│   └── → permissions (roles/permissões)
│
├── 20241201000002-demo-patients.js
│   ├── → models/Patient.js (criação)
│   ├── → records/ (base para registros)
│   └── → alerts/ (trigger alertas)
│
├── 20241201000003-demo-records.js
│   ├── → models/Record.js (criação)
│   ├── → tags/ (aplicação tags)
│   └── → ai/ (base análises)
│
├── 20241201000004-demo-tags.js
│   ├── → models/Tag.js (criação)
│   ├── → records/ (categorização)
│   └── → search/ (filtros/busca)
│
├── 20241201000005-demo-templates.js
│   ├── → models/Template.js (criação)
│   ├── → records/ (base novos registros)
│   └── → ai/ (contexto sugestões)
│
└── 20241201000006-demo-alerts.js
    ├── → models/Alert.js (criação)
    ├── → patients/ (vinculação)
    └── → rules/ (regras negócio)
```

## Ambientes e Configuração

### Configuração por Ambiente
```javascript
// config/seeders.js
module.exports = {
  development: {
    enableSeeders: true,
    seedersToRun: 'all',
    autoSeed: true
  },
  test: {
    enableSeeders: true,
    seedersToRun: ['demo-users', 'demo-patients'],
    autoSeed: false
  },
  production: {
    enableSeeders: false,
    seedersToRun: [],
    autoSeed: false
  }
};
```

### Validação de Dados
```javascript
const validateSeedData = (data, schema) => {
  const errors = [];
  
  data.forEach((item, index) => {
    Object.keys(schema).forEach(field => {
      if (schema[field].required && !item[field]) {
        errors.push(`Item ${index}: Campo '${field}' é obrigatório`);
      }
      
      if (schema[field].type && typeof item[field] !== schema[field].type) {
        errors.push(`Item ${index}: Campo '${field}' deve ser do tipo ${schema[field].type}`);
      }
    });
  });
  
  if (errors.length > 0) {
    throw new Error(`Erros de validação:\n${errors.join('\n')}`);
  }
};
```

## Dependências

- **sequelize**: ORM para operações de banco
- **sequelize-cli**: CLI para migrações e seeders
- **bcrypt**: Hash de senhas para usuários
- **faker**: Geração de dados realistas (opcional)
- **moment**: Manipulação de datas
- **uuid**: Geração de IDs únicos

## Hook de Teste

### Testes de Seeders
```javascript
// tests/seeders.test.js
const { sequelize } = require('../src/config/database-pg');
const seeders = require('../src/seeders');

describe('Database Seeders', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });
  
  test('should create demo users successfully', async () => {
    await seeders['demo-users'].up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    const users = await sequelize.models.User.findAll();
    expect(users.length).toBeGreaterThan(0);
    expect(users[0].email).toContain('@healthguardian.com');
  });
  
  test('should create demo patients with valid data', async () => {
    await seeders['demo-users'].up(sequelize.getQueryInterface(), sequelize.Sequelize);
    await seeders['demo-patients'].up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    const patients = await sequelize.models.Patient.findAll();
    expect(patients.length).toBeGreaterThan(0);
    expect(patients[0].cpf).toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
  });
  
  test('should handle seeder rollback', async () => {
    await seeders['demo-users'].up(sequelize.getQueryInterface(), sequelize.Sequelize);
    await seeders['demo-users'].down(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    const users = await sequelize.models.User.findAll();
    expect(users.length).toBe(0);
  });
});
```

## IA Prompt Sugerido

```
IA prompt: "Crie um novo seeder para [tipo de dados], incluindo dados realistas e diversos, validação de entrada, tratamento de duplicatas e documentação completa. Siga os padrões estabelecidos e documente todas as integrações com outros modelos."
```

## Segurança e Boas Práticas

### Dados Sensíveis
```javascript
// Nunca incluir dados reais de pacientes
const generateFakePatient = () => ({
  name: faker.name.findName(),
  cpf: generateFakeCPF(), // Função para CPF fictício
  email: faker.internet.email(),
  phone: generateFakePhone()
});

// Hash de senhas
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};
```

### Verificação de Ambiente
```javascript
const checkEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seeders não devem ser executados em produção!');
  }
};
```

## Troubleshooting

### Problemas Comuns
1. **Dados Duplicados**: Verificar constraints e chaves únicas
2. **Dependências**: Executar seeders na ordem correta
3. **Validação**: Verificar se dados atendem às regras do modelo
4. **Performance**: Usar bulkInsert para grandes volumes

### Debug
- **Logs Detalhados**: Adicionar logs para cada etapa
- **Transações**: Usar transações para rollback em caso de erro
- **Validação**: Verificar dados antes da inserção