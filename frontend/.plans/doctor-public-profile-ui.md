# Plano: Ajustes de UI no Perfil Público do Médico

## Objetivo
Melhorar a página de perfil público para:
- Aumentar e alinhar o avatar ao cabeçalho (mais próximo da margem esquerda e centralizado verticalmente).
- Formatar corretamente Formação e Experiências (sem JSON bruto), exibindo campos amigáveis.
- Adicionar média das avaliações com ícone temático (brasão/estrelas) e manter publicação real de pacientes.

## Integration Map
- **Arquivos Alterados**:
  - `src/pages/Patient/DoctorPublicProfile.jsx` — ajustes de layout no header.
  - `src/pages/Patient/components/DoctorBio.jsx` — parsing seguro e renderização estruturada de formação/experiências.
  - `src/pages/Patient/components/DoctorReviews.jsx` — cálculo de média e badge visual.
- **Conecta a**:
  - `src/services/marketplaceService.js` (`getDoctorById`, `getDoctorReviews`, `createDoctorReview`).
  - UI base (`components/ui/*`) para card, avatar, botão.
- **Fluxo de Dados**:
  1. Perfil é carregado via `getDoctorById(id)`.
  2. `DoctorBio` recebe `doctor` e formata se `formacao`/`experiencias` vierem string/objeto/array.
  3. `DoctorReviews` busca lista pública, calcula média e exibe.
  4. Paciente envia avaliação via `createDoctorReview` (sem mock).

## Mapa de Dependências (Cache de referência)
- `DoctorPublicProfile.jsx`
  - Depende de `marketplaceService.getDoctorById` e componentes `DoctorBio`, `DoctorReviews`.
  - Usa `components/ui/avatar` cujas dimensões padrão são `h-10 w-10`; será sobrescrito.
- `DoctorBio.jsx`
  - Recebe `doctor.formacao` e `doctor.experiencias` que podem ser:
    - Array de objetos `{ curso, instituicao, ano_inicio, ano_fim, descricao }`.
    - Array de strings ou string JSON de objeto/array.
  - Renderiza tarjetas (`div`) em vez de `li` para evitar exibir JSON bruto.
- `DoctorReviews.jsx`
  - Calcula média com base em `reviews[].rating`.
  - Exibe badge (SVG de brasão com cor de tema) e estrelas.
  - Mantém envio real via `createDoctorReview`.

## Decisões de Implementação
- Parsing defensivo: tentar `JSON.parse` quando string; cair para split por linha/pipe se necessário.
- UI simples, mantendo classes utilitárias existentes (`text-muted-foreground`, `border-theme-muted`).
- Tamanhos: avatar `w-20 h-20`; header com `px-4` para reduzir padding esquerdo.
- Badge: SVG de escudo com `currentColor`, cor herdada do tema.

## Hooks & Dependências
- **Triggers**: carregamento da página `/patient/doctor/:id`, envio de avaliação.
- **Side Effects**: Nenhum efeito colateral de estado global; somente UI.

## Testes/QA
- Verificar visual em preview após iniciar o dev server.
- Confirmar que avaliações continuam sendo criadas e média atualiza em tempo real.

## Segurança & Compliance
- Sem dados sensíveis; UI pública.
- Nenhum uso de `eval`; apenas `JSON.parse` com try/catch.

## Encerramento do Cache
Este arquivo serve como memória temporária de dependências para esta intervenção.
Pode ser removido após homologação das mudanças.