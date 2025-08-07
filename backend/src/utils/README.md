# Backend Utils Directory

## Visão Geral

Este diretório contém utilitários e funções auxiliares reutilizáveis em toda a aplicação backend. Estas funções fornecem funcionalidades comuns que são utilizadas por múltiplos módulos.

## Estrutura e Funcionalidades

### Utilitários de Validação
**Propósito**: Funções para validação de dados de entrada e sanitização.

**Funcionalidades Esperadas**:
- Validação de CPF/CNPJ
- Validação de emails
- Sanitização de strings
- Validação de datas
- Validação de números de telefone

**Conectores**:
- **Controllers**: Usado em `controllers/` para validar dados de entrada
- **Middleware**: Integra com `middleware/` para validação de requests
- **Models**: Usado em validações de modelo Sequelize

### Utilitários de Formatação
**Propósito**: Funções para formatação e transformação de dados.

**Funcionalidades Esperadas**:
- Formatação de datas
- Formatação de números
- Conversão de unidades médicas
- Formatação de documentos (CPF, telefone)
- Normalização de strings

**Conectores**:
- **Services**: Usado em `services/` para formatação de dados
- **Controllers**: Formatação de respostas da API
- **Frontend**: Dados formatados enviados para o frontend

### Utilitários de Criptografia
**Propósito**: Funções para criptografia e segurança de dados.

**Funcionalidades Esperadas**:
```javascript
// Exemplo de estrutura
module.exports = {
  hashPassword: (password) => bcrypt.hash(password, 10),
  comparePassword: (password, hash) => bcrypt.compare(password, hash),
  generateToken: (payload) => jwt.sign(payload, process.env.JWT_SECRET),
  verifyToken: (token) => jwt.verify(token, process.env.JWT_SECRET),
  encryptSensitiveData: (data) => crypto.encrypt(data),
  decryptSensitiveData: (encryptedData) => crypto.decrypt(encryptedData)
};
```

**Conectores**:
- **Auth Controllers**: Usado em `controllers/auth.controller.js`
- **Auth Middleware**: Integra com `middleware/auth.middleware.js`
- **Models**: Hooks de modelo para criptografia automática

### Utilitários de Data/Hora
**Propósito**: Funções para manipulação de datas e horários.

**Funcionalidades Esperadas**:
```javascript
module.exports = {
  formatDate: (date, format) => moment(date).format(format),
  addDays: (date, days) => moment(date).add(days, 'days'),
  isValidDate: (date) => moment(date).isValid(),
  getAge: (birthDate) => moment().diff(moment(birthDate), 'years'),
  getTimezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  convertToUTC: (date) => moment(date).utc(),
  formatDuration: (start, end) => moment.duration(moment(end).diff(moment(start)))
};
```

**Conectores**:
- **Patient Models**: Cálculo de idade em `models/Paciente.js`
- **Alert Services**: Cálculo de intervalos em `services/alert.service.js`
- **Record Controllers**: Formatação de timestamps

### Utilitários de Arquivo
**Propósito**: Funções para manipulação de arquivos e uploads.

**Funcionalidades Esperadas**:
```javascript
module.exports = {
  uploadFile: async (file, destination) => { /* upload logic */ },
  deleteFile: async (filePath) => { /* delete logic */ },
  validateFileType: (file, allowedTypes) => { /* validation */ },
  generateFileName: (originalName) => { /* unique name generation */ },
  compressImage: async (imagePath) => { /* image compression */ },
  extractTextFromPDF: async (pdfPath) => { /* PDF text extraction */ }
};
```

**Conectores**:
- **Controllers**: Upload de arquivos em controllers
- **Models**: Armazenamento de caminhos de arquivo
- **Services**: Processamento de documentos médicos

### Utilitários de Email
**Propósito**: Funções para envio e formatação de emails.

**Funcionalidades Esperadas**:
```javascript
module.exports = {
  sendEmail: async (to, subject, body, attachments) => { /* send logic */ },
  sendTemplateEmail: async (template, data, to) => { /* template logic */ },
  validateEmailAddress: (email) => { /* validation */ },
  generateEmailTemplate: (type, data) => { /* template generation */ },
  sendBulkEmail: async (recipients, subject, body) => { /* bulk send */ }
};
```

**Conectores**:
- **Alert Services**: Envio de alertas por email
- **Auth Controllers**: Emails de verificação e recuperação
- **Patient Services**: Notificações para pacientes

### Utilitários de Log
**Propósito**: Funções para logging estruturado e auditoria.

**Funcionalidades Esperadas**:
```javascript
module.exports = {
  logInfo: (message, metadata) => logger.info(message, metadata),
  logError: (error, context) => logger.error(error, context),
  logAudit: (action, user, resource) => auditLogger.log({ action, user, resource }),
  logPerformance: (operation, duration) => perfLogger.log({ operation, duration }),
  createRequestLogger: () => morgan('combined')
};
```

**Conectores**:
- **Middleware**: Logging de requests em `middleware/`
- **Controllers**: Logging de ações importantes
- **Services**: Logging de operações críticas
- **Error Handlers**: Logging de erros

### Utilitários de Banco de Dados
**Propósito**: Funções auxiliares para operações de banco de dados.

**Funcionalidades Esperadas**:
```javascript
module.exports = {
  buildWhereClause: (filters) => { /* dynamic where clause */ },
  paginate: (query, page, limit) => { /* pagination logic */ },
  bulkInsert: async (model, data) => { /* bulk insert */ },
  executeTransaction: async (operations) => { /* transaction wrapper */ },
  sanitizeQuery: (query) => { /* SQL injection prevention */ }
};
```

**Conectores**:
- **Controllers**: Operações CRUD complexas
- **Services**: Queries customizadas
- **Models**: Hooks e métodos de instância

## Padrões de Implementação

### Estrutura de Arquivo
```javascript
/**
 * [Nome do Utilitário]
 * 
 * Propósito: [Descrição da funcionalidade]
 * 
 * Conectores:
 * - Usado em [arquivo/pasta] para [funcionalidade]
 * - Integra com [serviço/modelo] via [método]
 * 
 * Dependências:
 * - [biblioteca]: [versão] - [propósito]
 * 
 * @module utils/[nome]
 */

const dependency = require('dependency');

/**
 * [Descrição da função]
 * 
 * @param {type} param - Descrição do parâmetro
 * @returns {type} Descrição do retorno
 * 
 * @example
 * const result = functionName(param);
 * console.log(result); // Expected output
 * 
 * Hook: Usado em controllers/auth.controller.js para validação
 */
const functionName = (param) => {
  // Implementation
};

module.exports = {
  functionName
};
```

### Tratamento de Erros
```javascript
// Padrão para tratamento de erros em utils
const safeUtilFunction = async (input) => {
  try {
    // Validação de entrada
    if (!input) {
      throw new Error('Input is required');
    }
    
    // Lógica principal
    const result = await processInput(input);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    // Log do erro
    console.error(`Error in safeUtilFunction: ${error.message}`);
    
    return {
      success: false,
      error: error.message
    };
  }
};
```

### Configuração via Environment
```javascript
// Utilitários que dependem de configuração
const config = {
  emailProvider: process.env.EMAIL_PROVIDER || 'smtp',
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  maxFileSize: process.env.MAX_FILE_SIZE || '10MB',
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'png', 'pdf']
};
```

## Mapa de Integrações

```
utils/
├── validation.js
│   ├── → controllers/ (validação de entrada)
│   ├── → middleware/ (validação de requests)
│   └── → models/ (validações Sequelize)
│
├── formatting.js
│   ├── → services/ (formatação de dados)
│   ├── → controllers/ (formatação de respostas)
│   └── → frontend (dados formatados)
│
├── crypto.js
│   ├── → controllers/auth.controller.js
│   ├── → middleware/auth.middleware.js
│   └── → models/ (hooks de criptografia)
│
├── datetime.js
│   ├── → models/Paciente.js (cálculo de idade)
│   ├── → services/alert.service.js
│   └── → controllers/ (timestamps)
│
├── file.js
│   ├── → controllers/ (upload de arquivos)
│   ├── → models/ (caminhos de arquivo)
│   └── → services/ (processamento)
│
├── email.js
│   ├── → services/alert.service.js
│   ├── → controllers/auth.controller.js
│   └── → services/patient.service.js
│
├── logger.js
│   ├── → middleware/ (logging de requests)
│   ├── → controllers/ (logging de ações)
│   └── → services/ (logging de operações)
│
└── database.js
    ├── → controllers/ (operações CRUD)
    ├── → services/ (queries customizadas)
    └── → models/ (hooks e métodos)
```

## Dependências Comuns

- **bcrypt**: Criptografia de senhas
- **jsonwebtoken**: Geração e verificação de tokens JWT
- **moment/dayjs**: Manipulação de datas
- **nodemailer**: Envio de emails
- **multer**: Upload de arquivos
- **winston**: Logging estruturado
- **joi/yup**: Validação de schemas
- **crypto**: Criptografia nativa do Node.js

## Padrões de Teste

### Testes Unitários
```javascript
// Exemplo de teste para utilitário
const { validateEmail } = require('../validation');

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    test('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });
    
    test('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });
    
    test('should handle null input', () => {
      expect(validateEmail(null)).toBe(false);
    });
  });
});
```

### Testes de Integração
```javascript
// Teste de integração com banco de dados
const { paginate } = require('../database');
const { Patient } = require('../models');

describe('Database Utils Integration', () => {
  test('should paginate results correctly', async () => {
    const result = await paginate(Patient, 1, 10);
    
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('pagination');
    expect(result.data.length).toBeLessThanOrEqual(10);
  });
});
```

## Segurança e Boas Práticas

### Sanitização de Dados
```javascript
// Sempre sanitizar dados de entrada
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>"']/g, '') // Remove caracteres perigosos
    .substring(0, 1000); // Limita tamanho
};
```

### Validação de Tipos
```javascript
// Validação rigorosa de tipos
const validateType = (value, expectedType) => {
  const actualType = typeof value;
  if (actualType !== expectedType) {
    throw new TypeError(`Expected ${expectedType}, got ${actualType}`);
  }
};
```

### Rate Limiting
```javascript
// Utilitários para rate limiting
const rateLimitMap = new Map();

const checkRateLimit = (identifier, maxRequests, windowMs) => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, []);
  }
  
  const requests = rateLimitMap.get(identifier)
    .filter(timestamp => timestamp > windowStart);
  
  if (requests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  requests.push(now);
  rateLimitMap.set(identifier, requests);
  return true;
};
```

## Hook de Teste

- **Jest**: Testes unitários para cada utilitário
- **Supertest**: Testes de integração com APIs
- **Sinon**: Mocks e stubs para dependências externas
- **Coverage**: Cobertura mínima de 90% para utilitários

## IA Prompt Sugerido

```
IA prompt: "Crie um novo utilitário para [funcionalidade específica], incluindo validação de entrada, tratamento de erros, testes unitários e documentação JSDoc. Siga os padrões estabelecidos nos utilitários existentes e documente todas as integrações."
```

## Performance e Otimização

### Memoização
```javascript
// Cache para operações custosas
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};
```

### Lazy Loading
```javascript
// Carregamento sob demanda de dependências pesadas
let heavyDependency;
const getHeavyDependency = () => {
  if (!heavyDependency) {
    heavyDependency = require('heavy-dependency');
  }
  return heavyDependency;
};
```

## Troubleshooting

### Problemas Comuns
1. **Memory Leaks**: Limpar caches e timers
2. **Performance**: Usar memoização para operações custosas
3. **Encoding**: Sempre especificar encoding para arquivos
4. **Timezone**: Usar UTC para armazenamento, converter para exibição

### Debug
- **Console Logs**: Logs detalhados em desenvolvimento
- **Performance Monitoring**: Medir tempo de execução
- **Memory Usage**: Monitorar uso de memória