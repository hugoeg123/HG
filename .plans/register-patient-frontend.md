# Plano: Cadastro de Paciente no Frontend

## Objetivo
Adicionar opção de cadastro de paciente no fluxo de autenticação, com página dedicada e rota própria, minimizando impacto no código existente.

## Escopo
- Link de acesso ao cadastro na tela de login do paciente.
- Nova página `RegisterPatient.jsx` com formulário e validações básicas.
- Rota `/register-patient` sob `AuthLayout role="patient"`.
- Cabeçalho de `AuthLayout` reconhece página de cadastro de paciente.

## Integração
### Integration Map
- **Novo Arquivo**: `frontend/src/components/auth/RegisterPatient.jsx`
- **Conecta a**:
  - `frontend/src/services/api.js` via `POST /auth/patient/register`
  - `backend/src/controllers/auth.controller.js` (handler `registerPatient`)
  - `frontend/src/components/Layout/AuthLayout.jsx` para layout de autenticação
  - `frontend/src/App.jsx` para roteamento

### Hooks & Dependências
- **Triggers**: Click no link “Cadastre-se como paciente” em `/login`.
- **Dependências**: Axios client em `services/api.js`, `ToastProvider`.
- **Side Effects**: Redireciona para `/login` após cadastro com mensagem de sucesso.

## Requisitos de Dados
- Obrigatórios: `name`, `password`, `dateOfBirth`, `gender`, e ao menos `email` ou `phone`.
- Opcionais: `race_color`, `nationality`, `street`, `city`, `state`, `zipCode`, `country`.
  - `race_color` segue valores: `branca`, `preta`, `parda`, `amarela`, `indigena`, `outra`.

## UI e Navegação
- `Login.jsx` (role `patient`) inclui link para `/register-patient`.
- `AuthLayout.jsx` exibe cabeçalho “Cadastro de Paciente” quando na página de registro.

## Riscos e Mitigações
- Porta em uso do dev server → Vite muda automaticamente (3000→3001→3002→3003). Ajustar conforme necessidade.
- Validação de `race_color` → Usar `<select>` com opções válidas para evitar erro 400.

## Testes
- Manual: Preencher formulário com dados válidos e enviar; verificar toast de sucesso e redirecionamento.
- Backend: Conferir criação do registro e resposta JWT conforme padrão.

## MVP Concluído
- Implementados link, página, rota e ajuste de layout.