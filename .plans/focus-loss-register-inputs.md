# Plano: Correção da perda de foco em inputs na página de Registro de Paciente

## Contexto e Sintomas
- Usuários relatam que os campos `input` perdem o foco durante a digitação na página de cadastro de paciente.
- Instrumentação atual em `RegisterPatient.jsx` loga `focus`, `blur`, `focusin`, `focusout` e mudanças de `formData`.

## Hipótese Principal (Causa Raiz)
- O componente `Field` está definido como função interna dentro de `RegisterPatient.jsx`.
- Em React, componentes definidos dentro de outro componente são recriados a cada render, mudando a identidade do tipo. Isso faz com que o React trate o componente como um novo, promovendo unmount/mount do campo, o que resulta na perda de foco.

## Evidências
- `RegisterPatient.jsx` mostra `const Field = (...) => (...)` definido dentro da função `RegisterPatient`.
- Não há `key` estável nem memoização do tipo, portanto cada atualização de `formData` recria `Field`, ocasionando remontagem dos inputs.
- Outras fontes potenciais (mutations de tema, toasts, autoFocus em outros componentes) não estão montadas no `AuthLayout` da página de registro.

## Estratégia de Correção
1. Extrair `Field` para um componente estável de topo: `components/ui/InputField.jsx`.
2. Usar `React.memo` para evitar re-renders desnecessários quando props não mudam.
3. Atualizar `RegisterPatient.jsx` para importar e usar `InputField`, passando `value`, `onChange`, `onFocus`, `onBlur` e demais props.
4. Manter estilos via classe `input` já existente em `index.css`.
5. Validar no navegador que o foco permanece ao digitar em todos os campos.

## Integração Map
- **Novo Arquivo**: `frontend/src/components/ui/InputField.jsx`
- **Conecta com**:
  - `frontend/src/components/auth/RegisterPatient.jsx` (uso direto nos formulários)
  - `frontend/src/index.css` (`.input` para estilos base)
- **Data Flow**:
  1. Usuário digita → `InputField` (controlado)
  2. `onChange` → atualiza `formData` em `RegisterPatient`
  3. Re-render de `RegisterPatient` sem remontar `InputField` → foco preservado

## Hooks & Dependências
- **Triggers**: Atualizações de `formData` via `setFormData`.
- **Dependencies**: `react`, `index.css` para classe `.input`, `ToastProvider` para feedback.
- **Side Effects**: Remoção de remontagens indesejadas e estabilidade de foco.

## Test Plan
- Subir servidor de desenvolvimento (`npm run dev`).
- Navegar para `/register-patient`.
- Validar digitação contínua nos seguintes campos sem perda de foco:
  - `name`, `email`, `phone`, `password`, `confirmPassword`, `street`, `city`, `state`, `zipCode`, `country`, `nationality`.
  - `dateOfBirth` (observando comportamento do picker nativo) e selects (`gender`, `race_color`).
- Confirmar logs reduzidos e ausência de `focusout` inesperados durante digitação.

## Observações
- Alternâncias de tema e `MutationObserver` do `themeFill.js` não devem afetar esta página.
- O `ToastProvider` não altera foco (sem `autoFocus`), apenas exibe notificações.

## QA Checklist
- Arquivos mantidos < 200 linhas.
- Comentários de integração adicionados em `InputField.jsx`.
- Padrões de componente e documentação seguidos.