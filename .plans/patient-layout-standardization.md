# Padronização de Layout do Paciente e Correção do Perfil de Médico

## Objetivo
- Corrigir erro de renderização em `/patient/doctor/:id` (objetos sendo renderizados direto no `<li>`)
- Padronizar layout do paciente com:
  - Barra lateral esquerda consistente (PatientSidebar)
  - Barra lateral direita específica do paciente (PatientRightSidebar)
  - Top nav padronizada do paciente (PatientTopNav)
- Aplicar essas barras e top nav em todas as páginas sob o prefixo `/patient/*`.

## Contexto Atual
- `MainLayout.jsx` inclui `Navbar`, `LeftSidebar`, `RightSidebar` e aceita apenas `leftSidebarComponent` como prop opcional.
- `App.jsx` possui:
  - Grupo de rotas protegidas com `MainLayout` (padrão) e inclui `/patient/doctor/:id`.
  - Grupo separado apenas para `/patient/profile` com `MainLayout leftSidebarComponent={PatientSidebar}`.
- `RightSidebar.jsx` agrega Chat IA, Calculadoras, Alertas e Base de Conhecimento (funciona para paciente).
- `PatientTopNav.jsx` existe e já é usada em páginas marketplace.
- `DoctorPublicProfile.jsx` renderiza `formacao` e `experiencias` diretamente, gerando erro quando itens são objetos.

## Problema
Erro: "Objects are not valid as a React child ..." ao tentar renderizar objetos em `<li>`. Backend fornece `formacao`/`experiencias` como arrays de objetos (ex.: `{curso, instituicao, ano_inicio, ano_fim, descricao}` e `{cargo, empresa, atual, ...}`).

## Plano de Ação
1. Corrigir `DoctorPublicProfile.jsx`:
   - Normalizar `formacao` e `experiencias` para strings amigáveis antes de renderizar.
   - Suportar valores vindos como array de objetos ou strings (split/parse seguro).
2. Estender `MainLayout.jsx`:
   - Adicionar props `rightSidebarComponent` (default `RightSidebar`) e `topNavComponent` (default `Navbar`).
   - Manter `leftSidebarComponent` existente.
3. Criar `PatientRightSidebar.jsx`:
   - Componente específico para páginas do paciente (pode compor o `RightSidebar` atual).
   - Documentar conectores (IA, Calculadoras, Alertas, Conhecimento).
4. Atualizar `App.jsx`:
   - Agrupar rotas `/patient/*` sob um `MainLayout` com `leftSidebarComponent={PatientSidebar}`, `rightSidebarComponent={PatientRightSidebar}` e `topNavComponent={PatientTopNav}`.
   - Mover `/patient/doctor/:id` para este grupo.
   - Manter demais rotas protegidas inalteradas.
5. Validar no preview e revisar logs.

## Integração e Fluxo
### Integration Map
- **New File**: `frontend/src/components/Layout/PatientRightSidebar.jsx`
- **Connects To**:
  - `frontend/src/components/Layout/MainLayout.jsx` via props
  - `frontend/src/components/AI/AIAssistant.jsx`, `Tools/*` via composição
  - `frontend/src/App.jsx` via agrupamento de rotas `/patient/*`
- **Data Flow**:
  1. Usuário navega para `/patient/*`
  2. `MainLayout` renderiza PatientTopNav, PatientSidebar (E) e PatientRightSidebar (D)
  3. Conteúdo central renderiza página (`DoctorPublicProfile`, `Profile`, etc.)
  4. RightSidebar acessa `patientId` de params quando aplicável

### Hooks & Dependencies
- **Triggers**: Navegação para rotas com prefixo `/patient/*`
- **Dependencies**: `react-router-dom`, stores de tema/autenticação, serviços marketplace
- **Side Effects**: Layout mais consistente; nenhuma alteração de backend

## Segurança e Compliance
- Continua consumindo somente endpoints públicos para perfil de médico.
- Nenhum dado sensível do paciente é exibido fora de páginas apropriadas.

## Testes
- Validar `/patient/doctor/:id` não gera erro de objeto em `<li>`.
- Verificar presença das barras (E/D) e top nav em `/patient/profile` e `/patient/doctor/:id`.

## Riscos e Mitigações
- Mudança de layout pode afetar espaçamento: manter defaults e classes existentes.
- Parsing de strings potencialmente inválidas: try/catch e fallback para texto simples.

## Checklist de Implementação
- [ ] DoctorPublicProfile normaliza itens de listas
- [ ] MainLayout suporta rightSidebar e topNav componentes
- [ ] PatientRightSidebar criado
- [ ] Rotas `/patient/*` agrupadas e configuradas
- [ ] Preview validado