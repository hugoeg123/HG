# Plano de Investigação: Perda de foco em inputs (RegisterPatient)

## Contexto e Objetivo
- Sintoma: campos de input perdem foco ao digitar na tela de cadastro de paciente (`RegisterPatient`).
- Objetivo: identificar a causa raiz e corrigir com impacto mínimo, mantendo padrões do projeto.

## Mapa de Integração
- **Frontend**
  - `src/pages/RegisterPatient.jsx` → renderiza formulário e inputs controlados
  - `src/pages/Login.jsx` → referência comparativa (não apresenta perda de foco)
  - `src/App.jsx` → monta `<ToastProvider>` ao redor das rotas; usa `AuthLayout`
  - `src/components/toast/Toast.jsx` → sistema de toast (re-renderiza contexto)
  - `src/index.css` → estilos de input (`.input`, `.input-no-icon`), temas claro/escuro
  - `src/overrides.css` → ajustes de foco em `a` e `div` (não inputs)
  - `src/shared/themeFill.js` → `MutationObserver` aplica cores de fundo (não mexe em foco)
  - `src/pages/PatientDashboard.jsx` e `src/components/HybridEditor.jsx` → possuem `autoFocus`, mas não usados na rota de cadastro

## Hipóteses
1. Re-render por contexto do toast: mudança em `toasts` faz `ToastProvider` re-renderizar, propagando re-renders. Esperado: não remonta input, logo foco deveria persistir.
2. Remontagem do componente de campo: `Field` ou container troca `key` ou muda estrutura ao digitar. Até aqui não foi observado `key` dinâmico.
3. CSS ou UI overlay: elemento com `pointer-events`/`focus` captura foco (modal invisível, overlay, outline hack).
4. Efeito colateral global: listeners de `keydown/blur/focus` em nível de documento ou manipulação do DOM.
5. Troca uncontrolled→controlled no input: valores `undefined` iniciais. Análise inicial indica valores iniciados como string vazia.

## Plano por Etapas
1. Reproduzir no servidor de dev para observar eventos em tempo real.
2. Instrumentar logs temporários:
   - Adicionar `onFocus`/`onBlur` nos inputs do `RegisterPatient` com `console.log` (campo, alvo, `document.activeElement`).
   - Logar `keydown`/`input` no nível do componente para detectar correlatos.
3. Observar toasts: verificar se qualquer validação dispara toast durante digitação.
4. Checar sobreposições: inspecionar elementos com `position: fixed`/`z-index` (ex.: toast container, modais).
5. Caso a causa seja re-render/remontagem:
   - Garantir estrutura estável dos inputs (evitar condicionais que trocam nós irmãos).
   - Separar `Field` com `React.memo` se necessário.
6. Caso seja overlay/foco programático:
   - Remover `autoFocus` indevido ou atrasar com `setTimeout` apenas onde necessário.
   - Ajustar CSS para não aplicar outline/focus em elementos não interativos durante digitação.
7. Validar correção em modo claro/escuro e comparar com `Login.jsx`.

## Critérios de Aceite
- Inputs não perdem foco ao digitar continuamente.
- Nenhum toast inesperado dispara durante digitação.
- Sem regressões visuais ou funcionais em outras telas.

## Riscos e Mitigações
- Mudanças no contexto global podem afetar re-renders: mitigar usando componentes estáveis e evitar dependências desnecessárias.
- Logs temporários podem poluir console: remover após diagnóstico.

## Hooks & Dependências
- **Triggers**: eventos de `input`, `focus`, `blur`; atualizações de contexto do toast.
- **Dependências**: `React`, `ToastProvider`, estilos (`index.css`, `overrides.css`).
- **Side Effects**: re-render dos filhos ao mudar `ToastContext`.

## Próximos Passos
- Subir servidor de dev, abrir preview e instrumentar `RegisterPatient` para coleta de dados.