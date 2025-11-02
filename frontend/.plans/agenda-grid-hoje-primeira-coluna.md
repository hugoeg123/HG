## Adaptação da Grid: "Hoje" na Primeira Coluna

Objetivo: Inicializar a grade semanal com o dia de hoje na primeira coluna, mantendo destaque visual da coluna correspondente e preservando a navegação por dia.

### Diagnóstico
- A grid utiliza `getCenteredWeekDays()` para gerar 7 dias centrados em `selectedWeek` (−3…+3), destacando a coluna central (`isCenterDay`).
- O botão "Hoje" aparece apenas no cabeçalho do dia que corresponde à data atual, mas o destaque especial está acoplado ao dia central, não necessariamente ao "Hoje".

### Decisão de Implementação
- Alterar `getCenteredWeekDays()` para gerar 7 dias a partir de `selectedWeek` (0…+6), tornando a primeira coluna o dia selecionado.
- Substituir o destaque especial baseado em `isCenterDay` por destaque baseado em `isToday` (quando visível), garantindo que a coluna de hoje seja realçada.
- Manter navegação: setas "←"/"→" continuam ajustando `selectedWeek` por dia; clicar em cabeçalhos também redefine o início da visão.

### Integração Map
- **Arquivo Atualizado**: `frontend/src/stores/timeSlotStore.js`
  - Função `getCenteredWeekDays()` passa a retornar `selectedWeek + i` para i in [0..6].
  - Conector: Usada por `components/WeeklyTimeGrid.jsx` para montar colunas diárias.
- **Arquivo Atualizado**: `frontend/src/components/WeeklyTimeGrid.jsx`
  - Destaque visual alterado: usa `isToday` para header/grid em vez de `isCenterDay`.

### Fluxo de Dados
1. `selectedWeek` inicial é `new Date()`.
2. `getCenteredWeekDays()` produz os 7 dias começando em `selectedWeek`.
3. UI destaca coluna onde `date === hoje`.
4. Navegação atualiza `selectedWeek`, deslocando a janela 7 dias sem perder funcionalidade.

### Hooks & Dependências
- **Triggers**: Mudança de `selectedWeek` via setas, clique em cabeçalho, ou botão "Hoje".
- **Dependências**: `timeSlotStore.getCenteredWeekDays`, `WeeklyTimeGrid` (render e estilos), `loadSlotsForWeek` (re-render ao mudar semana).
- **Side Effects**: Remoção do conceito de "dia central" nas cores; adoção de destaque por "Hoje" quando visível.

### Compliance & Segurança
- Sem impacto em FHIR/compliance de dados.
- Mudança puramente visual/UX, sem alteração de payloads ou chamadas de API.

### Testes Sugeridos
- Verificar inicialização: primeira coluna é hoje com destaque e botão "Hoje".
- Navegar para ontem/amanhã: coluna de hoje muda de posição conforme visibilidade.
- Clicar em cabeçalho de um dia qualquer: passa a ser a primeira coluna; se hoje estiver visível, permanece destacado em sua posição relativa.

### Observações
- Arquivo `WeeklyTimeGrid.jsx` é extenso; alteração é mínima e isolada aos pontos de destaque e geração de dias.