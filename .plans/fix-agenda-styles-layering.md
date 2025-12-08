# Plano: Corrigir erro de PostCSS/Tailwind em `agenda-styles.css`

## Objetivo
Resolver o erro `[postcss] @layer components is used but no matching @tailwind components directive is present` ao compilar `frontend/src/agenda-styles.css`, garantindo que o calendário e a grade da agenda do paciente carreguem sem erros.

## Diagnóstico
- O arquivo `frontend/src/index.css` atualmente importa `agenda-styles.css` ANTES das diretivas Tailwind (`@tailwind base`, `@tailwind components`, `@tailwind utilities`).
- Quando `agenda-styles.css` é processado, o PostCSS encontra `@layer components` antes de existir a diretiva correspondente `@tailwind components` no pipeline — isso dispara o erro.
- Outros arquivos importados (`slot-styles.css`) usam `@apply` e também dependem de Tailwind já ter sido inicializado.

## Solução Preferida (ordem das diretivas)
1. Reordenar `frontend/src/index.css` para colocar as diretivas do Tailwind no topo:
   - `@tailwind base;`
   - `@tailwind components;`
   - `@tailwind utilities;`
2. Manter os `@import` após as diretivas acima, especialmente os que usam `@layer` ou `@apply`:
   - `@import './themes.css';`
   - `@import './slot-styles.css';`
   - `@import './agenda-styles.css';`
3. Não alterar `agenda-styles.css` (continua com `@layer components`), pois a correção é apenas de ordem de processamento.

## Alternativa (se ordem não puder ser alterada)
- Trocar `@layer components` por `@layer utilities` em `agenda-styles.css` e mover estilos que são “component-like” para `components` posteriormente. Essa alternativa evita o erro, mas desloca semanticamente o layer.

## Passos de Implementação
- Editar `frontend/src/index.css` e mover as três diretivas Tailwind para o topo do arquivo, antes de qualquer `@import` que use `@layer`/`@apply`.
- Validar que `slot-styles.css` e `agenda-styles.css` ficam importados após as diretivas Tailwind.
- Não inserir novas diretivas Tailwind dentro de arquivos parciais; manter um único ponto de entrada (`index.css`).

## Testes e Validação
- Iniciar o dev server (`npm run dev`) e abrir `http://localhost:3000/`.
- Navegar para a página da agenda do paciente (rota que usa `AgendaPacienteMedico.jsx`).
- Verificar ausência do erro PostCSS e carregamento do calendário/grade.
- Conferir layout e estilos dos seletores de dia e barras de horários.

## Integração & Hooks
- Conector: `index.css` → inicializa Tailwind antes de parciais (`agenda-styles.css`, `slot-styles.css`).
- Hook: `@layer components` em `agenda-styles.css` passa a operar com `@tailwind components` já ativo.

## Riscos / Considerações
- `themes.css` não usa Tailwind diretamente; pode permanecer após diretivas sem impacto.
- Mudanças são mínimas e com baixo impacto no restante do código.

## Critérios de Qualidade
- Build sem erros de PostCSS/Tailwind.
- UI do calendário/grade renderiza corretamente.
- Nenhuma regressão em estilos de `slot-styles.css`.