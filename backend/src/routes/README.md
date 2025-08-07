# Routes Directory

## Visão Geral
Diretório contendo as definições de rotas da API REST, organizadas por domínio funcional.

## Arquivos Principais

### index.js
- **Função**: Roteador principal que centraliza todas as rotas da API
- **Conectores**:
  - Importa todas as rotas específicas
  - Usado por `app.js` como middleware principal
  - Integra middleware de logging e tratamento de erros
- **Funcionalidades**: Health check, centralização de rotas, tratamento de 404

### auth.routes.js
- **Função**: Define rotas de autenticação e autorização
- **Conectores**:
  - Usa `controllers/auth.controller.js`
  - Integra validações com express-validator
- **Endpoints**:
  - POST `/login` - Autenticação de usuário
  - POST `/register` - Registro de novo médico
  - POST `/refresh` - Renovação de token
  - POST `/logout` - Logout de usuário

### patient.routes.js
- **Função**: Define rotas para gerenciamento de pacientes
- **Conectores**:
  - Usa `controllers/patient.controller.js`
  - Protegido por `middleware/auth.middleware.js`
- **Endpoints**:
  - GET `/` - Listar pacientes
  - GET `/:id` - Obter paciente específico
  - POST `/` - Criar novo paciente
  - PUT `/:id` - Atualizar paciente
  - DELETE `/:id` - Excluir paciente
  - GET `/:id/dashboard` - Dashboard do paciente

### record.routes.js
- **Função**: Define rotas para registros médicos
- **Conectores**:
  - Usa `controllers/record.controller.js`
  - Protegido por `middleware/auth.middleware.js`
  - Validações com express-validator
- **Endpoints**:
  - GET `/patient/:patientId` - Registros por paciente
  - GET `/tag/:tagId` - Registros por tag
  - GET `/type/:type` - Registros por tipo
  - GET `/:id` - Registro específico
  - POST `/` - Criar registro
  - PUT `/:id` - Atualizar registro
  - DELETE `/:id` - Excluir registro

### tag.routes.js
- **Função**: Define rotas para sistema de tags
- **Conectores**:
  - Usa `controllers/tag.controller.js`
  - Protegido por `middleware/auth.middleware.js`
- **Endpoints**:
  - GET `/` - Listar tags
  - GET `/:id` - Tag específica
  - POST `/` - Criar tag
  - PUT `/:id` - Atualizar tag
  - DELETE `/:id` - Excluir tag

### template.routes.js
- **Função**: Define rotas para templates de registros
- **Conectores**:
  - Usa `controllers/template.controller.js`
  - Protegido por `middleware/auth.middleware.js`
- **Endpoints**:
  - GET `/` - Listar templates
  - GET `/type/:type` - Templates por tipo
  - GET `/:id` - Template específico
  - POST `/` - Criar template
  - PUT `/:id` - Atualizar template
  - DELETE `/:id` - Excluir template
  - PUT `/:id/activate` - Ativar template
  - PUT `/:id/deactivate` - Desativar template

### calculator.routes.js
- **Função**: Define rotas para calculadoras médicas
- **Conectores**:
  - Usa `controllers/calculator.controller.js`
  - Protegido por `middleware/auth.middleware.js`
  - Validações específicas com `middleware/calculator.middleware.js`
- **Endpoints**: CRUD completo para calculadoras e avaliação de fórmulas

### alert.routes.js
- **Função**: Define rotas para sistema de alertas
- **Conectores**:
  - Usa `controllers/alert.controller.js`
  - Protegido por `middleware/auth.middleware.js`
- **Endpoints**: CRUD de alertas, marcação como lido

## Padrões de Arquitetura

### Estrutura Padrão
```javascript
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const controller = require('../controllers/[domain].controller');

// Rota protegida com validação
router.post('/', 
  authMiddleware,
  [
    body('field').notEmpty().withMessage('Campo obrigatório')
  ],
  controller.method
);
```

### Middleware Stack
1. **Autenticação**: `authMiddleware` para rotas protegidas
2. **Validação**: express-validator para entrada de dados
3. **Controller**: Lógica de negócio via controllers
4. **Tratamento de Erros**: Propagação para middleware global

### Validações
- **Entrada**: express-validator para validação de dados
- **Autorização**: Middleware de auth para acesso
- **Sanitização**: Limpeza de dados de entrada

## Mapa de Integrações
- **Entrada**: Requisições HTTP do frontend
- **Saída**: Respostas via controllers
- **Dependências**: Controllers, Middleware, express-validator
- **Consumidores**: `app.js` via roteador principal

## Hooks & Dependencies
- **Triggers**: Requisições HTTP do cliente
- **Dependencies**: Express.js, middleware de autenticação, controllers
- **Side Effects**: Execução de lógica de negócio via controllers