## Objetivo
Garantir que salvar um registro com tags `>>PA`, `>>FC`, `>>FR`, `>>SpO2`, `>>Temp` gere alertas automaticamente e que eles apareçam na aba lateral de Alertas. Remover emojis do código e adicionar logs claros para depuração.

## Achados
- O frontend exibe chips (PA/FC), mas a aba de alertas continua vazia.
- O backend gera alertas após criar registro em `backend/src/controllers/record.controller.js:212–275`, porém depende do parse por `Tag` e pode falhar se o conjunto de tags não estiver completo.
- `Alert` e rotas (`/api/alerts`) estão configurados corretamente; listagem usa `req.user.sub` e criação usa `req.user.id` (no nosso middleware, ambos são o mesmo ID do médico).
- Emojis estão presentes nos logs do controlador de registros e do parser de vitais.

## Plano de Correção (Backend)
1. Uniformizar extração de sinais vitais:
   - Tentar `parseSections(content, tags)` (normalização `>>TAG → #TAG`).
   - Se não houver vitais detectados, aplicar fallback com `extractVitals(content)` (regex independente de tags).
2. Normalizar comparação de códigos:
   - Ao mapear seções → vitais, comparar códigos por chave canônica sem prefixos (`PA`, `FC`, `FR`, `SPO2`, `TEMP`), aceitando `#` e `>>`.
3. Remover emojis do código:
   - Substituir logs com mensagens simples e campos estruturados.
4. Adicionar logs claros (sem emojis) para depuração:
   - `ALERT_PIPELINE_PARSE` → número de seções e tags detectadas.
   - `ALERT_PIPELINE_VITALS` → valores detectados (PA, FC, FR, SpO2, Temp).
   - `ALERT_PIPELINE_CREATED` → quantidade de alertas persistidos e seus tipos.
5. Garantir persistência em `PatientVitalSigns` e `Alert` mesmo quando só `FC` estiver presente.

## Plano de Correção (Frontend)
1. Ajustar a busca de alertas:
   - Chamar `GET /alerts?unread=true` para reduzir ruído e garantir foco nos pendentes.
2. Garantir mapeamento correto:
   - Continuar exibindo `message` e estilo por `severity` (`info`, `warning`, `critical`).
3. Remover qualquer emoji em mensagens estáticas caso exista.

## Logs e Debug (3 logs)
- `ALERT_PIPELINE_PARSE sections=<n> tags=<n>`
- `ALERT_PIPELINE_VITALS systolic=<x> diastolic=<y> heartRate=<z> rr=<r> spo2=<s> temp=<t>`
- `ALERT_PIPELINE_CREATED count=<n> ids=[...]`

## Verificação
- Criar registros com:
  - `>>PA:200/110` e `>>FC: 200`
  - Somente `>>FC: 200`
  - Somente `>>FR: 30`
- Esperar 2–3 alertas críticos/avisos conforme limiares:
  - Crise hipertensiva (PA ≥ 180/120) → `critical`
  - Taquicardia grave (FC ≥ 150) → `critical`
  - Taquipneia (FR > 20) → `warning`
- Verificar logs (parse/vitals/created) e a aba de Alertas exibindo pendentes.

## Impacto e Risco
- Baixo risco: mudanças confinadas ao pipeline de criação de registro e componente de alertas.
- Mitigação: fallback por regex garante funcionamento mesmo sem tags cadastradas, mantendo compatibilidade com planos discutidos (`.plans/sugestao1.md`, `sugestao2.md`, `sugestao3.md`).

## Próximo Passo
Com sua aprovação, aplico as alterações, removo emojis, adiciono logs, rodo um teste manual criando registros com valores acima dos limiares e confirmo visualmente a exibição na aba de alertas.