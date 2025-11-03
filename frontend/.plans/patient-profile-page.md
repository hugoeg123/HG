# Plano: Página de Perfil do Paciente

## Contexto e Problema
- Usuário paciente, ao clicar em "Perfil" no Marketplace, é direcionado para `/profile` (perfil profissional), comportamento incorreto.
- Solução: criar uma página dedicada ao paciente (`/patient/profile`), baseada no template de perfil profissional, mas adaptada ao contexto do paciente.

## Objetivo
Entregar uma página de Perfil do Paciente com seções essenciais (dados pessoais, agenda/consultas, inputs de saúde e assistente pessoal) e ajustar a navegação para apontar corretamente para esta página.

## Integration Map
- **Novo Arquivo**: `frontend/src/pages/Patient/Profile.jsx`
- **Conecta com**:
  - `frontend/src/store/authStore.js` para obter `user`/`token`
  - `frontend/src/services/api.js` para `GET /auth/patient/me`
  - `frontend/src/pages/Marketplace/DoctorsList.jsx` via `PatientTopNav` (link de perfil)
  - `frontend/src/components/Layout/PatientTopNav.jsx` (ajuste de link para `/patient/profile` quando role=`patient`)
  - `frontend/src/components/AI/AIAssistant.jsx` (atajos de assistente de saúde)
  - Futuro: `appointmentsService` para consultas agendadas (placeholder)

## Data Flow
1. Paciente clica em "Perfil" na barra superior do Marketplace.
2. Navega para `/patient/profile` (rota protegida sob `MainLayout`).
3. Página carrega dados do `authStore` e consulta `/auth/patient/me` para enriquecer (e-mail/telefone/demografia).
4. Exibe seções:
   - Agenda: próximas consultas (placeholder + conector)
   - Saúde: inputs de informações e tags estruturadas (placeholder + conector a FHIR)
   - Assistente: acesso ao AIAssistant com contexto do paciente
   - Estatísticas: visão resumida (placeholder)

## Hooks & Dependencies
- **Triggers**: clique no menu de usuário em `PatientTopNav` → "Perfil".
- **Dependencies**: `authStore` (JWT e role), `api.js` (interceptors), `ProtectedRoute`/`MainLayout`.
- **Side Effects**: estado local; nenhuma mutação global.

## Padrões e Compliance
- Manter arquivos < 200 linhas e documentar conectores (JSDoc).
- Adotar formato de tags `#TAG: value` para inputs de saúde (placeholder).
- FHIR: planejar validação e export em futuras iterações (comentário de integração).

## Tarefas
- Criar componente `frontend/src/pages/Patient/Profile.jsx`.
- Adicionar rota `/patient/profile` em `App.jsx` sob `ProtectedRoute`.
- Ajustar `PatientTopNav` para direcionar pacientes ao `/patient/profile`.
- Validar navegação com preview.

## Observações
- Reaproveitar estrutura visual do perfil profissional, removendo campos de certificações/publicações e focando em agenda e saúde do paciente.
- Evitar impacto em fluxos do médico; mudanças condicionadas a `user.role === 'patient'`.