# Plano: Top Nav do Paciente (Perfil, Tema e Logout)

## Objetivo
Adicionar uma barra de navegação superior para o paciente no frontend, com acesso ao perfil, alternância de tema (dark/light) e ação de logout, minimizando impacto e mantendo o padrão visual existente.

## Integração Map
- **Novo Arquivo**: `frontend/src/components/Layout/PatientTopNav.jsx`
- **Conecta-se a**:
  - `frontend/src/store/authStore.js` para estado do usuário e `logout`
  - `frontend/src/store/themeStore.js` para `isDarkMode` e `toggleTheme`
  - `frontend/src/pages/Marketplace/DoctorsList.jsx` via import e renderização no topo da página
- **Data Flow**:
  1. Usuário autenticado → estado em `authStore`
  2. Ação de UI (toggle) → `themeStore` atualiza `isDarkMode`
  3. Ação de UI (Perfil/Logout) → navegação para `/profile` ou `logout` seguido de `/login`

## Hooks & Dependências
- **Triggers**:
  - Render da página de marketplace (`DoctorsList.jsx`)
  - Clique no toggle de tema
  - Clique no menu de usuário (Perfil/Sair)
- **Dependências**:
  - `react-router-dom` (`Link`, `useNavigate`)
  - `zustand` stores: `authStore`, `themeStore`
- **Side Effects**:
  - `logout()` limpa estado e tokens
  - `navigate('/login')` após logout

## Estágios de Implementação
1. Criar `PatientTopNav.jsx` com JSDoc de conectores (perfil, tema, logout)
2. Integrar `PatientTopNav` no topo de `DoctorsList.jsx`
3. Validar visualmente em `/marketplace` com servidor Vite em desenvolvimento

## Padrões e Segurança
- Arquivo < 200 linhas; componentes autocontidos
- Reutilizar estilização e UX do toggle de tema da `Navbar.jsx`
- Sem uso de `eval` ou padrões inseguros

## QA e Verificação
- Abrir prévia em `http://localhost:3000/marketplace` (ou porta fallback) após iniciar `npm run dev`
- Verificar:
  - Toggle de tema alterna corretamente
  - Link de Perfil navega para `/profile`
  - Botão Sair executa `logout` e redireciona para `/login`