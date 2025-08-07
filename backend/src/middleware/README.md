# Middleware Directory

## Visão Geral
Diretório contendo middlewares para autenticação, autorização, tratamento de erros e validações.

## Arquivos

### auth.js
- **Função**: Middleware de autenticação JWT principal
- **Conectores**:
  - Usado em todas as rotas protegidas
  - Integra com `models/Medico.js` para validação de usuário
- **Funcionalidades**: Verificação de token JWT, extração de dados do usuário

### auth.middleware.js
- **Função**: Middleware alternativo de autenticação com verificações adicionais
- **Conectores**:
  - Usado em rotas específicas que requerem validação extra
  - Integra com `models/Medico.js`
- **Funcionalidades**: Autenticação JWT, verificação de permissões admin

### authorize.js
- **Função**: Middleware de autorização baseado em roles
- **Conectores**:
  - Usado após autenticação para verificar permissões
  - Integra com sistema de roles de usuário

### calculator.middleware.js
- **Função**: Middleware específico para validação de operações de calculadora
- **Conectores**:
  - Usado em `routes/calculator.routes.js`
  - Integra com `services/calculator.service.js`
- **Funcionalidades**: Validação de fórmulas, sanitização de entrada

### error.middleware.js
- **Função**: Middleware global de tratamento de erros
- **Conectores**:
  - Usado em `app.js` como último middleware
  - Captura erros de toda a aplicação
- **Funcionalidades**: Formatação de erros, logging, resposta padronizada

## Mapa de Integrações
- **Entrada**: Requisições HTTP, tokens JWT
- **Saída**: Requisições autenticadas/autorizadas ou respostas de erro
- **Dependências**: jsonwebtoken, express-validator
- **Consumidores**: 
  - Todas as rotas em `src/routes/`
  - `src/app.js`

## Hooks & Dependencies
- **Triggers**: Requisições HTTP para rotas protegidas
- **Dependencies**: JWT tokens, modelos de usuário
- **Side Effects**: Bloqueio de acesso não autorizado, logging de erros