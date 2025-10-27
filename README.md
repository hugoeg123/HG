# Health Guardian - Prontuário Eletrônico Inteligente

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Health Guardian é um sistema de Prontuário Eletrônico do Paciente (EMR) de código aberto, projetado para ser moderno, intuitivo e extensível. Ele combina um backend robusto em Node.js com um frontend reativo em React, e utiliza IA para auxiliar os profissionais de saúde.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Portas e Serviços](#portas-e-serviços)
- [Guia de Início Rápido](#guia-de-início-rápido)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Documentação Técnica](#documentação-técnica)
- [Solução de Problemas](#solução-de-problemas)
- [Contribuição](#contribuição)

## 🎯 Visão Geral

O Health Guardian é uma solução completa de EMR que oferece:

- **Gestão de Pacientes**: Cadastro, histórico médico e acompanhamento
- **Registros Médicos**: Anamnese, exames, prescrições e evoluções
- **Sistema de Agenda Médica**: Grade de horários inteligente com drag-and-drop
- **Calculadoras Médicas**: Mais de 50 calculadoras especializadas
- **Dashboard Inteligente**: Visualização de dados e métricas
- **Integração com IA**: Assistente para análise de registros
- **Exportação FHIR**: Compatibilidade com padrões internacionais

### 🆕 Novidades da Versão 1.0.0 - ComAgendaMedicaV1

- **Sistema de Agenda Completo**: Grade temporal com visualização semanal centrada
- **Criação Inteligente de Slots**: Drag-and-drop com configuração de duração e intervalos
- **Sincronização Bidirecional**: Integração em tempo real entre frontend e backend
- **Múltiplas Modalidades**: Suporte a consultas presenciais, telemedicina e domiciliares
- **Validação de Conflitos**: Detecção automática de sobreposições de horários

## 🏗️ Arquitetura do Sistema

O projeto está dividido em componentes principais:

### Backend (`./backend`)
- **API RESTful**: Node.js + Express + Sequelize
- **Banco de Dados**: PostgreSQL com migrações automáticas
- **Autenticação**: JWT com refresh tokens
- **Validação**: Joi para validação de dados
- **Logs**: Winston para logging estruturado

### Frontend (`./frontend`)
- **SPA React**: Vite + React 18 + TypeScript
- **Roteamento**: React Router v6
- **Estado Global**: Zustand para gerenciamento de estado
- **UI/UX**: Tailwind CSS + Lucide Icons
- **Formulários**: React Hook Form + validação

### Documentação (`./docs`)
- **Técnica**: Especificações de API e arquitetura
- **Usuário**: Guias de uso e configuração
- **Desenvolvimento**: Padrões de código e contribuição

## 🩺 Análise Profunda e Saúde do Projeto

Uma análise detalhada foi conduzida para mapear a arquitetura, identificar conflitos e avaliar a saúde geral do código. Os resultados estão consolidados na pasta [`/docs`](./docs/), servindo como um guia essencial para o desenvolvimento contínuo.

O ponto de partida para entender o estado atual do projeto é o **[📄 Resumo da Análise do Projeto](./docs/project_overview.md)**.

### Resumo das Descobertas

| Área Analisada | Documento de Referência | Estado | Resumo das Descobertas |
| :--- | :--- | :--- | :--- |
| **Fluxo da API** | [`api_interaction_flow.md`](./docs/api_interaction_flow.md) | ✅ **Bom** | O serviço de API do frontend é robusto, com throttling, retries e single-flight. |
| **Integração de IA** | [`ai_integration.md`](./docs/ai_integration.md) | ⚠️ **Conflito** | O frontend espera endpoints de IA (`/chat`, `/suggestions`) que não estão implementados no backend. |
| **Estratégia de Testes** | [`testing_strategy.md`](./docs/testing_strategy.md) | ❌ **Crítico** | O projeto **não possui testes automatizados**, representando um débito técnico significativo. |
| **Segurança & Conformidade** | [`security_and_compliance.md`](./docs/security_and_compliance.md) | ⚠️ **Conflito** | A conformidade com **FHIR** está **quebrada** devido a um endpoint de exportação ausente no backend. |

**Prioridade de Ação:** É crucial que novas contribuições se concentrem em resolver os débitos técnicos críticos, especialmente a **criação da suíte de testes** e a **implementação dos endpoints de IA e FHIR** no backend.

## ⚙️ Configuração do Ambiente

### Pré-requisitos

- **Node.js**: v18.0.0 ou superior
- **npm**: v8.0.0 ou superior (ou yarn/pnpm)
- **PostgreSQL**: v14.0 ou superior
- **Git**: Para controle de versão

### Variáveis de Ambiente

Crie os arquivos `.env` necessários:

#### Backend (`.env`)
```env
# Servidor
PORT=5001
NODE_ENV=development

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=health_guardian
DB_USER=seu_usuario
DB_PASS=sua_senha

# JWT
JWT_SECRET=seu_jwt_secret_muito_seguro
JWT_REFRESH_SECRET=seu_refresh_secret_muito_seguro

# CORS
FRONTEND_URL=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

#### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5001/api
VITE_APP_NAME=Health Guardian
VITE_APP_VERSION=1.0.0
```

## 🚀 Portas e Serviços

| Serviço | Porta Padrão | Porta Alternativa | Descrição |
|---------|--------------|-------------------|------------|
| **Backend API** | `5001` | `5000` | API REST principal |
| **Frontend Dev** | `3000` | `3001`, `3002` | Servidor de desenvolvimento Vite |
| **PostgreSQL** | `5432` | - | Banco de dados principal |
| **Docs Server** | `8080` | `8081` | Servidor de documentação (opcional) |

### Configuração de Portas

#### Frontend - Porta Específica
```bash
# Usar porta específica
npm run dev -- --port 3002

# Forçar porta (falha se ocupada)
npm run dev -- --port 3002 --strictPort
```

#### Backend - Porta Alternativa
```bash
# Via variável de ambiente
PORT=5000 npm run dev

# Ou edite o arquivo .env
echo "PORT=5000" >> backend/.env
```

## 🏃‍♂️ Guia de Início Rápido

### 1. Clone e Configure
```bash
# Clone o repositório
git clone <url-do-repositorio>
cd health-guardian

# Configure o banco de dados PostgreSQL
# Crie um banco chamado 'health_guardian'
```

### 2. Backend
```bash
cd backend
npm install

# Configure o arquivo .env (veja seção acima)
cp .env.example .env
# Edite o .env com suas configurações

# Execute migrações
npm run migrate

# (Opcional) Execute seeds
npm run seed

# Inicie o servidor
npm run dev
```
✅ **Backend rodando em**: `http://localhost:5001`

### 3. Frontend
```bash
# Em um novo terminal
cd frontend
npm install

# Configure o arquivo .env
cp .env.example .env
# Edite se necessário

# Inicie o servidor de desenvolvimento
npm run dev
```
✅ **Frontend rodando em**: `http://localhost:3000`

### 4. Verificação

- **API Health Check**: `http://localhost:5001/api/health`
- **Frontend**: `http://localhost:3000`
- **Login de Teste**: `medico@teste.com` / `123456`

## 🔗 Mapa de Integrações

### Fluxo de Dados Principal
```
Usuário → Frontend (React) → API (Express) → Banco (PostgreSQL)
   ↓           ↓                ↓              ↓
Interface → Componentes → Controllers → Models/ORM
```

### Backend ↔ Frontend
- **API REST**: Comunicação via endpoints `/api/*`
  - `GET /api/patients` - Lista pacientes
  - `POST /api/records` - Cria registros médicos
  - `PUT /api/records/:id` - Atualiza registros
- **Autenticação**: JWT tokens para sessões seguras
- **CORS**: Configurado para múltiplas portas de desenvolvimento
- **WebSocket**: Atualizações em tempo real (planejado)

### Backend ↔ Banco de Dados
- **PostgreSQL**: Armazenamento principal de dados
- **Sequelize ORM**: Mapeamento objeto-relacional
- **Migrações**: Controle de versão do schema
- **Seeds**: Dados iniciais para desenvolvimento

### Frontend ↔ Usuário
- **React Router**: Navegação SPA entre páginas
- **Zustand**: Gerenciamento de estado global
- **Tailwind CSS**: Estilização responsiva e consistente
- **Vite**: Build tool e hot reload para desenvolvimento

### Integrações Futuras
- **IA/LLM**: Análise de registros médicos
- **FHIR**: Padrão de interoperabilidade em saúde
- **Relatórios**: Geração de PDFs e exportações

## 🔧 Solução de Problemas

### 🚨 Problemas de Conexão

#### Erro de CORS
```
Access to fetch at 'http://localhost:5001/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Soluções:**
1. Verifique se o backend está rodando na porta correta (5001)
2. Confirme a variável `FRONTEND_URL` no `.env` do backend:
   ```env
   FRONTEND_URL=http://localhost:3000,http://localhost:3001,http://localhost:3002
   ```
3. Reinicie o servidor backend após alterar o `.env`

#### Porta Ocupada
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Soluções:**
```bash
# Encontrar processo usando a porta
netstat -ano | findstr :3000

# Matar processo (Windows)
taskkill /PID <PID> /F

# Ou usar porta alternativa
npm run dev -- --port 3002
```

### 🗄️ Problemas de Banco de Dados

#### Conexão com PostgreSQL
```
SequelizeConnectionError: connect ECONNREFUSED 127.0.0.1:5432
```

**Soluções:**
1. Verifique se o PostgreSQL está rodando:
   ```bash
   # Windows (como serviço)
   net start postgresql-x64-14
   
   # Ou via pgAdmin
   ```
2. Confirme as credenciais no `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=health_guardian
   DB_USER=postgres
   DB_PASS=sua_senha
   ```
3. Teste a conexão:
   ```bash
   psql -h localhost -U postgres -d health_guardian
   ```

#### Migrações Pendentes
```
SequelizeDatabaseError: relation "users" does not exist
```

**Solução:**
```bash
cd backend
npm run migrate
```

### 🔐 Problemas de Autenticação

#### JWT Secret Não Definido
```
Error: JWT_SECRET is required
```

**Solução:**
```bash
# Adicione ao .env do backend
echo "JWT_SECRET=seu_jwt_secret_muito_seguro_aqui" >> backend/.env
echo "JWT_REFRESH_SECRET=seu_refresh_secret_muito_seguro_aqui" >> backend/.env
```

#### Token Expirado
```
Unauthorized: Token expired
```

**Soluções:**
1. Faça login novamente
2. Implemente refresh token (já configurado)
3. Ajuste tempo de expiração no backend

### 🔄 Problemas de Build/Desenvolvimento

#### Dependências Desatualizadas
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# Ou usar npm ci para instalação limpa
npm ci
```

#### Hot Reload Não Funciona
```bash
# Vite - adicione ao vite.config.js
export default {
  server: {
    watch: {
      usePolling: true
    }
  }
}
```

### 📱 Problemas de Interface

#### Estilos Não Carregam
1. Verifique se o Tailwind está configurado
2. Confirme imports CSS no `main.jsx`
3. Limpe cache do navegador (Ctrl+F5)

#### Componentes Não Renderizam
1. Verifique console do navegador (F12)
2. Confirme imports/exports dos componentes
3. Verifique sintaxe JSX

### 🆘 Comandos de Diagnóstico

```bash
# Verificar versões
node --version
npm --version
psql --version

# Status dos serviços
npm run health-check  # (se implementado)
curl http://localhost:5001/api/health

# Logs detalhados
DEBUG=* npm run dev  # Backend com logs verbosos
```

### Erro de autenticação
**Solução**: Crie um médico de teste:
```bash
cd backend
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"medico@teste.com","senha":"123456","nome":"Dr. Teste"}'
```

## 🚀 Roadmap e Próximos Passos

### 📋 Funcionalidades Planejadas

#### Curto Prazo (Sprint Atual)
- [ ] **Sistema de Tags Avançado**: Autocomplete e validação
- [ ] **Calculadoras Médicas**: Interface melhorada com histórico
- [ ] **Filtros Inteligentes**: Por data, tipo, paciente
- [ ] **Busca Global**: Pesquisa em registros e pacientes

#### Médio Prazo (Próximas 2-3 Sprints)
- [ ] **Dashboard Analytics**: Gráficos e métricas
- [ ] **Exportação FHIR**: Padrão de interoperabilidade
- [ ] **Notificações**: Sistema de alertas e lembretes
- [ ] **Backup Automático**: Sincronização de dados

#### Longo Prazo (Roadmap Futuro)
- [ ] **IA/LLM Integration**: Análise automática de registros
- [ ] **Mobile App**: Aplicativo React Native
- [ ] **Multi-tenant**: Suporte a múltiplas clínicas
- [ ] **Telemedicina**: Integração com videochamadas

### 🛠️ Melhorias Técnicas

#### Performance
- [ ] **Lazy Loading**: Componentes e rotas
- [ ] **Caching**: Redis para sessões e dados frequentes
- [ ] **CDN**: Assets estáticos
- [ ] **Database Indexing**: Otimização de queries

#### Segurança
- [ ] **2FA**: Autenticação de dois fatores
- [ ] **Audit Logs**: Rastreamento de ações
- [ ] **Rate Limiting**: Proteção contra ataques
- [ ] **HTTPS**: Certificados SSL/TLS

#### DevOps
- [ ] **CI/CD Pipeline**: GitHub Actions
- [ ] **Docker**: Containerização
- [ ] **Monitoring**: Logs e métricas
- [ ] **Testing**: Cobertura de testes > 80%

## 👥 Desenvolvimento e Contribuição

### 🔄 Workflow de Desenvolvimento

1. **Criar Branch**:
   ```bash
   git checkout -b feature/nome-da-feature
   ```

2. **Desenvolver e Testar**:
   ```bash
   # Fazer alterações
   npm test
   npm run lint
   ```

3. **Commit Semântico**:
   ```bash
   git add .
   git commit -m "feat: adiciona sistema de notificações"
   ```

4. **Push e Pull Request**:
   ```bash
   git push origin feature/nome-da-feature
   # Criar PR no GitHub
   ```

### 📝 Padrões de Commit

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação (sem mudança de lógica)
- `refactor:` Refatoração de código
- `test:` Adição/correção de testes
- `chore:` Tarefas de manutenção

### 🧪 Testes

```bash
# Backend
cd backend
npm test
npm run test:coverage

# Frontend
cd frontend
npm test
npm run test:e2e
```

### 📚 Documentação

- **API**: Swagger/OpenAPI em `/api/docs`
- **Componentes**: Storybook em desenvolvimento
- **Arquitetura**: Diagramas em `/docs/architecture`
- **Changelog**: Histórico de versões em `CHANGELOG.md`

## 📖 Recursos Adicionais

### 📁 Estrutura de Documentação

```
├── README.md              # Este arquivo
├── README-MVP.md          # Documentação do MVP
├── docs/
│   ├── api/              # Documentação da API
│   ├── frontend/         # Guias do frontend
│   ├── backend/          # Guias do backend
│   └── deployment/       # Guias de deploy
└── .trae/
    └── documents/        # Documentos do projeto
```

### 🔗 Links Úteis

- **Repositório**: [GitHub](https://github.com/seu-usuario/health-guardian)
- **Issues**: [Bug Reports & Feature Requests](https://github.com/seu-usuario/health-guardian/issues)
- **Wiki**: [Documentação Técnica](https://github.com/seu-usuario/health-guardian/wiki)
- **Releases**: [Changelog e Downloads](https://github.com/seu-usuario/health-guardian/releases)

---

> **💡 Dica**: Para informações específicas sobre o MVP atual, consulte o arquivo [`README-MVP.md`](./README-MVP.md).