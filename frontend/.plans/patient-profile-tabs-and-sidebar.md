# Plano: Tabs no Perfil do Paciente e Sidebar de Navegação/Busca

## Contexto
- O paciente ao clicar em "Perfil" deve ver uma página dedicada (`/patient/profile`).
- O usuário solicitou um esquema de tabs inspirado em `nav` para organizar: Dashboard, Edição de Perfil, Agenda e Histórico.
- Durante a navegação logada do paciente, a barra lateral esquerda no perfil deve atuar como navegação e busca (estilo marketplace), sem impactar o layout do médico.

## Objetivo
- Implementar tabs com sincronização de URL (`?tab=`) em `Patient/Profile.jsx`.
- Adaptar `MainLayout` para aceitar um componente de sidebar customizado.
- Criar `PatientSidebar.jsx` com busca e navegação rápida para as seções do perfil do paciente.
- Isolar alteração apenas na rota `/patient/profile` para não afetar o layout dos médicos.

## Integração Map
- **Novos Arquivos**:
  - `frontend/src/components/Layout/PatientSidebar.jsx` (sidebar de paciente)
  - `frontend/.plans/patient-profile-tabs-and-sidebar.md` (este plano)
- **Arquivos Atualizados**:
  - `frontend/src/components/Layout/MainLayout.jsx` (aceitar `leftSidebarComponent`)
  - `frontend/src/App.jsx` (agrupamento de rota com `MainLayout` customizado)
  - `frontend/src/pages/Patient/Profile.jsx` (tabs com URL sync)

## Fluxo de Dados
1. `MainLayout` recebe `leftSidebarComponent` e renderiza a sidebar específica quando presente.
2. `PatientSidebar` disponibiliza busca e links que navegam para `/patient/profile?tab=<secao>`.
3. `Patient/Profile.jsx` lê `tab` de `URLSearchParams` e controla o estado do `Tabs`.
4. Ao trocar de tab, atualiza a URL (sem recarregar) para refletir a seleção.

## Hooks & Dependências
- **Triggers**: Navegação para `/patient/profile`; clique em itens da sidebar; troca de tab.
- **Dependências**: `react-router-dom` (`useSearchParams`, `useNavigate`), componentes UI locais (Cards, etc.).
- **Side Effects**: Nenhum fora do perfil do paciente. Médico permanece inalterado.

## Padrões & Conformidade
- Arquivos < 200 linhas; documentação de conectores com comentários.
- Sidebar documenta hooks de navegação e busca.
- Tabs seguem padrão de componentes UI locais; sem dependências externas não-core.

## Tarefas
1. Adaptar `MainLayout` para aceitar `leftSidebarComponent`.
2. Criar `PatientSidebar.jsx` (busca + navegação marketplace para tabs do perfil).
3. Atualizar `App.jsx` para usar `MainLayout` customizado apenas em `/patient/profile`.
4. Implementar Tabs em `Patient/Profile.jsx` com sincronização da URL.
5. Validar visualmente (preview) sidebar e tabs.

## Observações
- Evitar acoplamento: Sidebar paciente não deve referenciar componentes internos do médico.
- Reutilizar estilos existentes (`LeftSidebar`, `Navbar`) como inspiração, mas manter contexto de paciente.
- Preparar pontos de integração futuros: agenda real, histórico clínico (FHIR), edição persistente de perfil.