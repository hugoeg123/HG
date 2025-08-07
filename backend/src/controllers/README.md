# Controllers Directory

## Visão Geral
Diretório contendo os controladores HTTP que gerenciam requisições e respostas da API REST.

## Arquivos Principais

### alert.controller.js
- **Função**: Gerencia requisições HTTP para operações CRUD de alertas
- **Conectores**:
  - Usa `services/alert.service.js` para lógica de negócio
  - Consumido por `routes/alert.routes.js`
  - Integra com `middleware/auth.middleware.js` para autenticação
- **Endpoints**: GET, POST, PUT, DELETE para alertas

### auth.controller.js
- **Função**: Gerencia autenticação e autorização de usuários
- **Conectores**:
  - Integra com `models/Medico.js` para validação
  - Consumido por `routes/auth.routes.js`
  - Gera tokens JWT para autenticação
- **Endpoints**: /login, /register, /refresh, /logout

### calculator.controller.js
- **Função**: Gerencia requisições HTTP para calculadoras médicas
- **Conectores**:
  - Usa `services/calculator.service.js` para lógica de negócio
  - Consumido por `routes/calculator.routes.js`
  - Integra com `middleware/calculator.middleware.js` para validação
- **Funcionalidades**: CRUD de calculadoras, avaliação segura de fórmulas

### patient.controller.js
- **Função**: Gerencia operações CRUD de pacientes
- **Conectores**:
  - Integra com `models/Patient.js`
  - Usa `services/patientDashboard.service.js` para dashboard
  - Consumido por `routes/patient.routes.js`
- **Endpoints**: CRUD completo + dashboard endpoint

### record.controller.js
- **Função**: Gerencia registros médicos
- **Conectores**:
  - Integra com `models/Record.js`, `models/Tag.js`
  - Consumido por `routes/record.routes.js`
  - Usa parsing de `shared/parser.js`
- **Funcionalidades**: CRUD de registros, filtragem por paciente/tag/tipo

### tag.controller.js
- **Função**: Gerencia sistema de tags para registros
- **Conectores**:
  - Integra com `models/Tag.js`
  - Consumido por `routes/tag.routes.js`
- **Funcionalidades**: CRUD de tags, associação com registros

### template.controller.js
- **Função**: Gerencia templates de registros médicos
- **Conectores**:
  - Integra com `models/Template.js`
  - Consumido por `routes/template.routes.js`
- **Funcionalidades**: CRUD de templates, ativação/desativação

### index.js
- **Função**: Exporta todos os controladores para facilitar importação
- **Conectores**: Centraliza exports para uso em rotas

## Padrões de Arquitetura

### Responsabilidades
- **Validação**: Usando express-validator para entrada de dados
- **Autenticação**: Middleware de auth em rotas protegidas
- **Resposta**: Formatação padronizada de respostas JSON
- **Erro**: Propagação para middleware de tratamento de erros

### Estrutura Padrão
```javascript
// Validação de entrada
const errors = validationResult(req);
if (!errors.isEmpty()) {
  return res.status(400).json({ errors: errors.array() });
}

// Chamada do service
const result = await service.operation(data);

// Resposta formatada
res.status(200).json(result);
```

## Mapa de Integrações
- **Entrada**: Requisições HTTP via rotas
- **Saída**: Respostas JSON formatadas
- **Dependências**: Services, Models, Middleware
- **Consumidores**: Rotas em `src/routes/`

## Hooks & Dependencies
- **Triggers**: Requisições HTTP das rotas
- **Dependencies**: Services para lógica de negócio, middleware para validação
- **Side Effects**: Operações de banco via services, respostas HTTP