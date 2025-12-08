# Plano: Perfil Público do Profissional na Interface do Paciente

## Objetivo
- Permitir que o paciente, ao clicar em um card de médico no Marketplace, seja direcionado para uma página dentro da área logada do paciente que exibe o perfil público do profissional (nome, título, especialidade, biografia, formação, experiência, avatar e link do currículo), respeitando privacidade e separação de papéis.

## Escopo
- Nova rota protegida: `/patient/doctor/:id` (React Router v6)
- Página React: `frontend/src/pages/Patient/DoctorPublicProfile.jsx`
- Navegação no Marketplace: tornar o card clicável e/ou adicionar ação explícita que leva à nova rota
- Manter o layout do paciente (Navbar + LeftSidebar + RightSidebar via `MainLayout`)
- Respeitar dark/bright mode (classes `bg-theme-*`, `text-theme-*`, `border-theme-*`)

## Integração Map
- **Novo Arquivo**: `frontend/src/pages/Patient/DoctorPublicProfile.jsx`
- **Conecta a**:
  - `frontend/src/services/marketplaceService.js` via `getDoctorById(id)`
  - `frontend/src/components/Layout/MainLayout.jsx` (usa `LeftSidebar` padrão)
  - `frontend/src/App.jsx` (definição de rota protegida)
  - `frontend/src/pages/Marketplace/DoctorsList.jsx` (origem da navegação)
- **Dados & Fluxo**:
  1. Paciente clica no card do médico no `/marketplace`
  2. Navegação para `/patient/doctor/:id`
  3. Página carrega `GET /api/marketplace/medicos/:id`
  4. Renderiza perfil público (sem dados sensíveis)

## Hooks & Dependências
- **Triggers**: click no card ou botão “Ver perfil” dentro de `DoctorsList.jsx`
- **Dependências**:
  - Backend ativo em `http://localhost:5001/api` com rotas `marketplace.routes.js`
  - `marketplace.controller.js` garantindo `public_visibility=true` e filtragem de atributos
- **Side Effects**:
  - Nenhum impacto em CRUD de pacientes
  - Layout consistente com área logada do paciente

## Segurança & Privacidade
- Usar apenas endpoint público: `/api/marketplace/medicos/:id`
- Não renderizar e não solicitar e-mail/telefone/endpoints privados
- Separação paciente/médico preservada (rota sob contexto do paciente)

## Layout & Tema
- Reutilizar padrão do `Profile.jsx` (seção “Visão Pública”), adaptado para leitura de um médico específico
- Manter classes semânticas de tema para dark/bright
- Preservar LeftSidebar com lista de pacientes

## Testes & QA
- Navegar a partir do `/marketplace` e validar:
  - Redirecionamento para `/patient/doctor/:id`
  - Renderização correta de nome, título, especialidade, avatar, currículo, “Sobre”, “Formação Acadêmica”, “Experiência Profissional”
  - Compatibilidade dark/bright
- Verificar que não há dados sensíveis exibidos

## Passos de Implementação
1. Adicionar rota protegida em `App.jsx`: `/patient/doctor/:id`, usando `MainLayout` padrão
2. Criar página `Patient/DoctorPublicProfile.jsx` com documentação JSDoc de conectores
3. Tornar `DoctorsList.jsx` card clicável e ajustar `stopPropagation` em botões internos
4. Validar visual no navegador (dark/bright) e ajustar detalhes

## Riscos
- Conflito de navegação se `Card` inteiro for clicável e botões internos não pararem propagação
- Backend indisponível/sem dados públicos para o médico

## Rollback
- Remover rota e página novas
- Reverter clique no card no Marketplace para estado anterior

---

### Template de Integração (conforme padrões)

**Integration Map**
- **New File**: `frontend/src/pages/Patient/DoctorPublicProfile.jsx`
- **Connects To**:
  - `frontend/src/services/marketplaceService.js` via `getDoctorById`
  - `frontend/src/components/Layout/MainLayout.jsx` via rota
  - `frontend/src/pages/Marketplace/DoctorsList.jsx` via navegação
- **Data Flow**:
  1. Clique no card → `useNavigate('/patient/doctor/:id')`
  2. `DoctorPublicProfile` → `getDoctorById(id)`
  3. Renderização de dados públicos

**Hooks & Dependencies**
- **Triggers**: evento de clique no card
- **Dependencies**: `marketplace.routes.js`, `marketplace.controller.js`
- **Side Effects**: sem alterações em stores ou pacientes