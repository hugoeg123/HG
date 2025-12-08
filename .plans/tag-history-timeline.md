# Plano: Linha do Tempo de Tags (Histórico por variável)

Objetivo: disponibilizar uma linha do tempo por tag (ex.: PESO, ALTURA) com valor, data/hora e autor (paciente via forms, médico em prontuário, enfermeira em controles), agregando entradas estruturadas e registros livres parseados por regex, para viabilizar revisões e rastreabilidade e preparar futura integração com AI/ML/LLM/RAG.

## Escopo
- Backend: endpoint `/api/tag-history/:tagKey` que agrega de múltiplas fontes:
  - `PatientTagEntry` (entradas estruturadas via frontend paciente)
  - `Record` (registros médicos com `tags` JSONB e `content` livre com `#TAG: valor`)
  - Metadados de autor (paciente, médico, enfermeira) e timestamp
- Frontend: serviço `tagHistoryService` e componente `TagHistoryTimeline` consumindo o endpoint
- UI: integração na página `Patient/Profile.jsx` exibindo histórico para tags principais (PESO, ALTURA)
- Regex: parser básico para `#TAG: valor` em `Record.content` com normalização de números (vírgula/ponto)
- Documentação: `docs/integration/tag-history.md` seguindo padrão de integração

## Requisitos e Decisões
- Padronizar tagKey em maiúsculas (ex.: `PESO`, `ALTURA`) para busca
- Normalizar valores numéricos convertendo vírgula para ponto
- Registrar `actorRole` e `actorName` quando disponível; para paciente, usar `req.user`; para médico, usar associação `medicoCriador`
- Ordenar por timestamp ascendente; permitir filtros por `patientId`, `start`, `end`, `limit`
- Manter arquivos < 200 linhas; componente React autocontido e documentado

## Passos
1. Backend: criar `controllers/tagHistory.controller.js` com agregação das fontes e regex
2. Backend: adicionar rota `routes/tag-history.routes.js` com autenticação e validação básica
3. Backend: registrar rota no roteador central (`routes/index.js`)
4. Frontend: adicionar `tagHistoryService` em `frontend/src/services/api.js`
5. Frontend: criar `frontend/src/components/PatientView/TagHistoryTimeline.jsx`
6. Frontend: integrar na `frontend/src/pages/Patient/Profile.jsx` mantendo arquivo < 200 linhas
7. Documentação: `docs/integration/tag-history.md` com mapa de integração e fluxo de dados
8. Validação: subir backend (`npm run dev`) e testar com `backend/test-tag-history.js`
9. Validação: subir frontend (`npm run dev`) e revisar UI via preview

## Considerações de Integração
- Conectores:
  - Backend → Models: `Record`, `PatientTagEntry`, `Medico` (autor)
  - Backend → Middleware: `auth` para obter `req.user` e `role`
  - Frontend → Serviços: `throttledApi` em `services/api.js`
  - Frontend → Páginas: `Patient/Profile.jsx`
- Segurança: sem `eval`; regex apenas leitura; validação de parâmetros
- FHIR/RAG futuro: endpoint retorna estrutura estável consumível por agentes

## Testes
- Script `backend/test-tag-history.js` faz login (médico), busca pacientes e consulta `/api/tag-history/PESO?patientId=...`
- Verificar que resultados incluem `value`, `unit` (quando aplicável), `timestamp`, `actorRole`, `actorName`, `source`