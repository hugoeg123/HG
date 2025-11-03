# Plano: Suporte ao Papel "patient" Autenticado

Objetivo: habilitar autenticação e autorização para pacientes no backend, gerando tokens JWT com `role="patient"`, propagando essa role no middleware, mapeando permissões por role e disponibilizando endpoints para cadastro e perfil básico do paciente (nome, data de nascimento/idade, email opcional, senha, gênero, cor/raça conforme IBGE, endereço da nacionalidade ao mais específico).

## Escopo
- Backend (Node/Express + Sequelize): controladores, middlewares, rotas, modelos e migrações necessárias.
- Integração com frontend será planejada, mas não implementada nesta etapa.

## Racional
- Reutilizar o padrão atual de autenticação JWT usado por profissionais, estendendo para pacientes com o menor impacto possível.
- Evitar acoplamento excessivo entre modelos diferentes (Medico vs Patient), mantendo `authorize` genérico por roles.

## Integração Map
- Novo/Alterado
  - `backend/src/controllers/auth.controller.js` → adicionar handlers `registerPatient` e `loginPatient`; gerar token com `role='patient'`.
  - `backend/src/middleware/auth.js` e `backend/src/middleware/auth.middleware.js` → aceitar e propagar `role='patient'`, resolvendo `req.user` a partir do modelo correto (Medico ou Patient).
  - `backend/src/middleware/authorize.js` → manter, mas documentar perfis e exemplos de uso com `['patient']`.
  - `backend/src/routes/auth.routes.js` → adicionar endpoints `/auth/patient/register` e `/auth/patient/login`.
  - `backend/src/routes/patient.routes.js` → avaliar permissões: endpoints de CRUD atuais (médico) e novos endpoints de autoatendimento (paciente).
  - `backend/src/models/sequelize/Patient.js` → acrescentar campos: `password_hash`, `race_color (ENUM IBGE)`, `nationality` (string). Manter `dateOfBirth` e calcular idade no serviço.
  - `backend/src/migrations/*` → criar migração para adicionar campos novos a `patients`.

- Conexões existentes
  - `authorize.js` já lê `req.user.roles` ou `req.user.role`.
  - `patient.routes.js` usa `authMiddleware`; precisará de regras para autoatendimento do paciente.
  - `record.controller.js` usa `Patient` e valida acesso por `req.user.id` vs `createdBy`; manter lógica e revisar para pacientes.

## Hooks & Dependências
- Triggers
  - `POST /auth/patient/register` → cria paciente, gera hash de senha, retorna token com `role='patient'` (opcional: login automático).
  - `POST /auth/patient/login` → valida credenciais, retorna token com `role='patient'`.
  - `GET /patients/:id` → com `authorize(['patient'])` permitir acesso somente ao próprio ID; com `authorize(['medico','admin'])` acesso profissional.

- Dependências
  - `jsonwebtoken`, `bcryptjs`, `sequelize` já presentes.
  - Migração de banco para novos campos.

- Side Effects
  - `authMiddleware` deixa de assumir apenas `Medico`; passa a resolver contexto por role.
  - Rotas `/auth/*` passam a ter novos subcaminhos para pacientes.

## Modelo de Dados
- `Patient` (acréscimos)
  - `password_hash: TEXT` (armazenar hash com `bcrypt`)
  - `race_color: ENUM('branca','preta','parda','amarela','indigena','nao_informada')` (IBGE)
  - `nationality: STRING` (default: 'Brasil')
  - Observação: idade derivada de `dateOfBirth` no serviço/controller; não persistir campo `age`.

## API Design
- `POST /auth/patient/register`
  - Body: `{ name, dateOfBirth, gender, race_color?, email?, password, phone?, nationality?, address? }`
  - Regras: `password` requerido para conta autenticada; `email` opcional (pode usar `phone` como identificador). Validar ao menos um identificador (`email` ou `phone`).
  - Resposta: `{ message, token, user: { id, name, email, role: 'patient' } }`

- `POST /auth/patient/login`
  - Body: `{ emailOrPhone, password }`
  - Busca por `email` (preferencial) ou `phone` (fallback) em `Patient`.
  - Resposta: `{ message, token, user: { id, name, email, role: 'patient' } }`

- `GET /auth/patient/me`
  - Autenticado com `role='patient'`; retorna perfil básico do paciente (sem `password_hash`).

- `PUT /patients/self/profile`
  - Autorização: `authorize(['patient'])`; atualiza somente o próprio paciente (`req.user.sub`). Campos básicos (nome, endereço, genero, race_color etc.).

## Autorização
- `authorize(['patient'])` para endpoints de autoatendimento do paciente.
- `authorize(['medico','admin'])` mantém acesso a endpoints de gestão por profissional (CRUD existente em `patient.routes.js`).
- Em endpoints com múltiplo acesso, conferir owner: paciente só acessa/modifica `id === req.user.sub`.

## Middleware
- `auth.js`/`auth.middleware.js`
  - Decodificar JWT; se `decoded.role==='patient'` → buscar `Patient.findByPk(decoded.sub)`; senão → `Medico.findByPk(decoded.sub)`.
  - Montar `req.user` com `{ id, sub, email, nome|name, role, roles }`.
  - Manter `optionalAuth` e utilitários.

## Segurança
- Hash de senha com `bcrypt` (salt 10) e comparação segura.
- Tokens com `issuer` e `audience` consistentes; `expiresIn` de 24h. Evitar revelar detalhes em erros em produção.
- Validação de input com `express-validator` nas rotas `register/login`.

## Migrações
- Criar migração para adicionar `password_hash`, `race_color`, `nationality` na tabela `patients`.
- Garantir compatibilidade com dados existentes (defaults seguros).

## Fluxo de Dados
1. Paciente se registra via `/auth/patient/register`.
2. Backend cria `Patient`, salva `password_hash` e metadados.
3. Gera JWT com `role='patient'`; middleware propaga role.
4. Paciente acessa `/auth/patient/me` e `/patients/self/profile` com `authorize(['patient'])`.

## Testes
- Unitários: `auth.controller` (register/login), `auth.middleware` (propagação por role), `authorize` (controle por role).
- Integração: rotas `/auth/patient/*`, `/patients/self/profile` com mocks de DB.
- Casos de erro: email duplicado, senha incorreta, token inválido/expirado, acesso a outro ID.

## Etapas & Entregáveis
1. Migração + ajustes no `Patient` (modelo e docs) [backend].
2. Novos handlers em `auth.controller.js` para paciente [backend].
3. Ajustes em `auth.js` e `auth.middleware.js` para role patient [backend].
4. Novas rotas em `auth.routes.js` e mapeamento em `patient.routes.js` para autoatendimento [backend].
5. Documentação de integração e atualizações de README [docs].
6. Testes unitários/integrados [backend].

## Riscos & Mitigações
- Conflito entre modelos `Patient` e `Paciente` (legado): padronizar uso de `Patient` em autenticação; documentar claramente.
- Exposição indevida de dados sensíveis: excluir `password_hash` de respostas; validar campos.
- Quebra de compatibilidade em middleware: versão incremental com fallback para `Medico`.

## Padrões de Conformidade
- Comentários “Connector/Hook” nos arquivos alterados.
- Tamanho de arquivos ≤ 200 linhas por mudança, dividir quando necessário.
- Sem `eval`; validações estritas.

---

Checklist de Implementação (não executar agora)
- [ ] Migração e modelo `Patient` atualizados
- [ ] `/auth/patient/register` e `/auth/patient/login`
- [ ] `auth.js` e `auth.middleware.js` com suporte a `role='patient'`
- [ ] `authorize.js` mapeado nos endpoints de paciente
- [ ] Testes cobrindo fluxos principais