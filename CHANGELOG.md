# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.0.0] - ComAgendaMedicaV1 - 2024-01-27

### 🎉 Primeira Versão Estável - Sistema de Agenda Médica Completo

Esta é a primeira versão estável do Health Guardian com sistema de agenda médica totalmente funcional.

### ✨ Adicionado

#### Sistema de Agenda Médica
- **WeeklyTimeGrid**: Componente principal da grade de horários semanal
  - Visualização centrada em 7 dias com navegação fluida
  - Sistema de drag-and-drop para criação de slots
  - Modos de marcação: disponibilidade e agendamento
  - Preview em tempo real durante a criação de slots
  - Suporte a diferentes modalidades (presencial, telemedicina, domiciliar)

- **TimeSlotStore**: Gerenciamento de estado robusto para slots de tempo
  - Integração completa com backend via API REST
  - Sincronização bidirecional entre frontend e backend
  - Validação de conflitos de horários
  - Persistência local com fallback
  - Suporte a configurações de duração e intervalos personalizados

- **Sistema de Slots Inteligente**:
  - Criação automática de múltiplos slots com base em duração e intervalo
  - Detecção e resolução de conflitos de horários
  - Snap automático para grades de tempo configuráveis
  - Posicionamento preciso na grade temporal

#### Melhorias na Interface
- **Posicionamento Corrigido**: Slots agora se alinham perfeitamente na grade
- **Navegação Temporal**: Sistema de navegação por semanas com visualização centrada
- **Feedback Visual**: Indicadores visuais claros para diferentes estados de slots
- **Responsividade**: Interface adaptável para diferentes tamanhos de tela

#### Backend - API de Agenda
- **Endpoints RESTful** para gerenciamento de slots:
  - `GET /api/agenda/slots` - Listar slots com filtros
  - `POST /api/agenda/slots` - Criar novo slot
  - `PUT /api/agenda/slots/:id` - Atualizar slot
  - `DELETE /api/agenda/slots/:id` - Remover slot
- **Validação Robusta**: Validação de dados com express-validator
- **Controle de Acesso**: Autenticação JWT e autorização por médico
- **Tratamento de Conflitos**: Verificação automática de sobreposições

### 🔧 Corrigido

#### Problemas de Posicionamento
- **ReferenceError minutesToTime**: Adicionada função helper local em WeeklyTimeGrid
- **Posicionamento Horizontal**: Corrigida duplicação de offset TIME_COL_PX no preview
- **Alinhamento Vertical**: Slots agora se alinham corretamente na grade temporal
- **Snap de Tempo**: Melhorado algoritmo de snap para grades de 15 minutos

#### Sincronização de Dados
- **Listener timeSlotsUpdated**: Refinado para evitar recarregamentos desnecessários
- **Persistência de Slots**: Slots criados agora persistem corretamente após criação
- **Estado Consistente**: Sincronização bidirecional entre store local e backend

#### Performance
- **Carregamento Otimizado**: Carregamento inteligente de slots por semana
- **Renderização Eficiente**: Otimizações na renderização da grade temporal
- **Gestão de Memória**: Limpeza adequada de event listeners

### 🏗️ Arquitetura

#### Frontend
- **React 18** com hooks modernos
- **Zustand** para gerenciamento de estado
- **date-fns** para manipulação de datas
- **Tailwind CSS** para estilização
- **Vite** como bundler de desenvolvimento

#### Backend
- **Node.js** com Express.js
- **Sequelize ORM** com PostgreSQL
- **JWT** para autenticação
- **Express Validator** para validação
- **CORS** configurado para desenvolvimento

#### Banco de Dados
- **PostgreSQL 14+** como banco principal
- **Tabela availability_slots** para gerenciamento de horários
- **Relacionamentos** com médicos e pacientes
- **Índices otimizados** para consultas de agenda

### 📦 Dependências

#### Frontend
- React 18.2.0
- Zustand 4.3.7
- date-fns 2.29.3
- Tailwind CSS 3.3.1
- Axios 1.3.5

#### Backend
- Express 4.18.2
- Sequelize 6.35.1
- PostgreSQL (pg) 8.16.3
- JWT 9.0.0
- bcryptjs 2.4.3

### 🔐 Segurança
- Autenticação JWT com refresh tokens
- Validação de entrada em todas as rotas
- Sanitização de dados
- Controle de acesso baseado em roles
- Headers de segurança com Helmet

### 📊 Performance
- Carregamento lazy de componentes
- Otimização de queries no banco
- Cache inteligente no frontend
- Compressão de respostas HTTP

### 🧪 Qualidade
- Validação de tipos com PropTypes
- Tratamento de erros robusto
- Logging estruturado
- Fallbacks para casos de erro

---

## Formato das Versões

- **MAJOR**: Mudanças incompatíveis na API
- **MINOR**: Funcionalidades adicionadas de forma compatível
- **PATCH**: Correções de bugs compatíveis

## Links
- [Repositório](https://github.com/seu-usuario/health-guardian)
- [Documentação](./docs/)
- [Issues](https://github.com/seu-usuario/health-guardian/issues)