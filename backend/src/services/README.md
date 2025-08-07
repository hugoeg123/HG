# Services Directory

## Visão Geral
Diretório contendo a lógica de negócio da aplicação, separada dos controladores para melhor organização e reutilização.

## Arquivos Principais

### alert.service.js
- **Função**: Lógica de negócio para operações CRUD de alertas
- **Conectores**:
  - Usado por `controllers/alert.controller.js`
  - Integra com `models/Alert.js`, `models/User.js`, `models/Record.js`
- **Funcionalidades**: Criação, listagem, marcação como lido, filtragem de alertas

### patientDashboard.service.js
- **Função**: Consolida dados de registros médicos para dashboard
- **Conectores**:
  - Usado por `controllers/patient.controller.js` no endpoint `/dashboard`
  - Integra com `models/Record.js`, `models/Tag.js`
  - Usa `shared/parser.js` para processamento de dados
- **Funcionalidades**: Agregação de dados, estatísticas, parsing de seções

### calculator.service.js
- **Função**: Lógica de negócio para calculadoras médicas
- **Conectores**:
  - Usado por `controllers/calculator.controller.js`
  - Integra com `models/Calculator.js`
- **Funcionalidades**: Avaliação segura de fórmulas, CRUD de calculadoras

### socket.service.js
- **Função**: Gerenciamento de conexões WebSocket para atualizações em tempo real
- **Conectores**:
  - Usado por `app.js` para configurar Socket.io
  - Integra com eventos de modelos para notificações
- **Funcionalidades**: Notificações em tempo real, gerenciamento de salas

## Padrões de Arquitetura

### Separação de Responsabilidades
- **Controllers**: Apenas manipulação de requisições HTTP
- **Services**: Lógica de negócio e regras de domínio
- **Models**: Acesso a dados e relacionamentos

### Reutilização
- Services podem ser chamados por múltiplos controllers
- Lógica complexa centralizada para facilitar manutenção
- Testes unitários focados na lógica de negócio

## Mapa de Integrações
- **Entrada**: Dados dos controllers
- **Saída**: Dados processados para controllers
- **Dependências**: Models Sequelize, utilitários shared
- **Consumidores**: Controllers em `src/controllers/`

## Hooks & Dependencies
- **Triggers**: Chamadas dos controllers
- **Dependencies**: Modelos Sequelize, bibliotecas de validação
- **Side Effects**: Operações de banco de dados, notificações WebSocket