# Plano: Acesso de Paciente como Convidado (Redirect para Marketplace)

Objetivo
- Permitir que pacientes acessem o Marketplace sem autenticação, utilizando o botão de login de paciente para redirecionar como convidado.

Escopo
- Alteração apenas no frontend. Nenhuma mudança de backend.
- Ajustar `Login.jsx` para não exigir credenciais quando `role === 'patient'` e redirecionar para `/marketplace`.

Racional
- O modelo `Patient` não possui campos de autenticação (senha); o fluxo atual de `/auth/login` autentica somente médicos (`Medico`).
- Para MVP de UX do paciente, o Marketplace é público e pode servir como landing após “login” de paciente.

## Integração Map
- **Arquivo alterado**: `frontend/src/components/auth/Login.jsx`
- **Conecta a**:
  - `frontend/src/store/authStore.js` (apenas para médicos; pacientes pulam chamada de login)
  - `frontend/src/pages/Marketplace/DoctorsList.jsx` (página destino para pacientes)
  - `frontend/src/components/Layout/AuthLayout.jsx` (recebe prop `role`)
- **Data Flow**:
  1. Paciente clica em “Acessar Sistema” na tela `/login` com `role=patient`
  2. Frontend pula `authStore.login` e faz `navigate('/marketplace')`
  3. Rotas protegidas continuam inacessíveis (não autenticado)

## Hooks & Dependências
- **Triggers**: submit do formulário de login
- **Dependências**: `react-router-dom` (`useNavigate`), `useToast`
- **Side Effects**: `isAuthenticated` permanece `false` para pacientes; rotas protegidas continuarão exigindo login de médico.

## Etapas
1. Tornar campos `email` e `password` opcionais quando `role === 'patient'`
2. Adicionar branch no `handleSubmit`: se `role === 'patient'`, mostrar toast e `navigate('/marketplace')`
3. Atualizar JSDoc de `Login.jsx` com conectores e contexto
4. Iniciar servidor `vite` e validar visualmente via preview

## Riscos e Mitigações
- Risco baixo; impacto apenas no fluxo de UI.
- Rollback simples: reverter alterações em `Login.jsx`.

## Padrões & Compliance
- Arquivo < 200 linhas; documentação de conectores adicionada.
- Sem impacto em FHIR/AI; mantém segurança de rotas protegidas.