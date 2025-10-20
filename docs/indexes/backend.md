# Índice Detalhado do Backend

Este índice oferece visão rápida e navegável das principais partes do backend: rotas, controllers, modelos e serviços.

## Rotas e Endpoints
Prefixos conforme `backend/src/routes/index.js`:

- `/auth`
  - `POST /register` — registra médico
  - `POST /login` — autentica usuário
  - `GET /me` — dados básicos do usuário atual
  - `GET /profile` — perfil completo
  - `PUT /profile` — atualiza perfil
  - `PUT /change-password` — troca de senha

- `/patients`
  - `GET /` — lista pacientes
  - `GET /dashboard` — visão consolidada (KPIs)
  - `GET /:id` — detalhes do paciente
  - `POST /` — cria paciente
  - `PUT /:id` — atualiza paciente
  - `DELETE /:id` — remove paciente

- `/records`
  - `GET /patient/:patientId` — registros do paciente (paginações, filtros)
  - `GET /tag/:tagId` — registros por tag
  - `GET /type/:type` — registros por tipo
  - `GET /:id` — registro específico
  - `POST /` — cria registro (validações: `patientId`, `title`, `type`, `content`, `date?`, `tags?`)
  - `PUT /:id` — atualiza registro
  - `DELETE /:id` — exclui registro

- `/tags`
  - `GET /` — todas as tags
  - `GET /root` — tags raiz
  - `GET /:id` — tag por ID
  - `GET /:id/children` — filhas da tag
  - `POST /` — cria tag (validações: `name`, `displayName`, `valueType`, `category?`)
  - `PUT /:id` — atualiza tag
  - `DELETE /:id` — exclui tag

- `/calculators`
  - `GET /` — lista calculadoras (query: `category`, `search`, `limit`, `offset`)
  - `POST /` — cria calculadora
  - `GET /categories` — categorias disponíveis
  - `POST /evaluate` — avalia fórmula com segurança
  - `POST /validate` — valida fórmula
  - `GET /:id` — detalhes
  - `PUT /:id` — atualiza
  - `DELETE /:id` — remove

- `/dynamic-calculators`
  - `GET /` — lista calculadoras dinâmicas
  - `POST /convert/units` — conversão de unidades
  - `GET /units/:dimension?` — unidades por dimensão
  - `GET /analytes/:analyte?` — analitos disponíveis
  - `GET /analytes/:analyte/details` — detalhes do analito
  - `POST /validate` — valida parâmetros de conversão
  - `GET /:id` — esquema da calculadora
  - `POST /:id/calculate` — executa cálculo
  - `POST /reload` — recarrega esquemas (somente dev)

- `/templates`
  - `GET /` — lista templates
  - `GET /type/:type` — por tipo
  - `GET /:id` — detalhes
  - `POST /` — cria (validações: `name`, `type`, `sections[]`)
  - `PUT /:id` — atualiza
  - `DELETE /:id` — exclui
  - `PUT /:id/deactivate` — desativa
  - `PUT /:id/activate` — ativa

- `/alerts`
  - `GET /` — lista alertas (requer role `medico` ou `admin`)
  - `GET /unread-count` — contagem não lidos
  - `GET /:id` — alerta específico
  - `POST /` — cria alerta
  - `PUT /:id/read` — marca como lido
  - `PUT /mark-all-read` — marca todos como lidos
  - `DELETE /:id` — exclui

- `/files`
  - `POST /upload` — upload de avatar/currículo (multer)

- `/export`
  - `GET /` — placeholder funcional

- `/ai`
  - `GET /` — placeholder funcional

- `/agenda`
  - `GET /slots` — lista slots do médico (query: `start`, `end`, `status`, `modality`)
  - `POST /slots` — cria slot (body: `start_time`, `end_time`, `modality?`, `location?`, `notes?`)
  - `PUT /slots/:id` — atualiza slot (body: `start_time?`, `end_time?`, `status?`, `modality?`, `location?`, `notes?`)
  - `DELETE /slots/:id` — remove slot
  - `GET /appointments` — lista agendamentos (query: `status?`, `patientId?`, `start?`, `end?`)
  - `POST /appointments` — cria agendamento (body: `slot_id`, `patient_id`, `notes?`)
  - `PUT /appointments/:id` — atualiza agendamento (body: `status?`, `notes?`)
  - `DELETE /appointments/:id` — remove agendamento

- `GET /health` — health check

## Controllers
Local: `backend/src/controllers/`

- `auth.controller.js` — registro, login, perfil e senha
- `patient.controller.js` — CRUD de pacientes e dashboard
- `record.controller.js` — CRUD de registros médicos com validações e includes de médico
- `tag.controller.js` — CRUD de tags e hierarquia (root/children)
- `template.controller.js` — CRUD, ativação/desativação de templates
- `alert.controller.js` — CRUD e leitura de alertas, autorização por role
- `calculator.controller.js` — CRUD e avaliação/validação de fórmulas
- `DynamicCalculatorController.js` — schemas dinâmicos e cálculo
- `ConversionController.js` — conversões de unidades/analitos e validações
- `file.controller.js` — upload e tratamento de erros do multer
- `index.js` — agregador (se aplicável)

## Modelos (Sequelize)
Local: `backend/src/models/sequelize/`

- `User.js`, `Medico.js`
- `Paciente.js`, `Patient.js` (legado/alias)
- `Record.js`, `Registro.js`, `SecaoRegistro.js`
- `Tag.js`, `TagDinamica.js`, `CalculatorTag.js`
- `Template.js`, `Calculator.js`
- `Alert.js`
- `index.js` — bootstrap/associações

## Serviços
Local: `backend/src/services/`

- `patientDashboard.service.js` — agregações e métricas do paciente
- `calculator.service.js` — utilitários de fórmulas e segurança
- `alert.service.js` — operações auxiliares de alertas
- `socket.service.js` — notificações em tempo real

## Observações e Padrões
- Autenticação via middleware (`authMiddleware` ou `authenticate`) com JWT.
- Validações com `express-validator` nas rotas de entrada (POST/PUT).
- Erros tratados globalmente em `routes/index.js` e erros específicos em `calculator.routes.js`.
- Registros médicos incluem dados do médico criador (`Medico`) e expõem `doctorName` e `doctorCRM`.