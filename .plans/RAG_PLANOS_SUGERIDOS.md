# Planos sugeridos para estabilização e evolução do RAG

## Objetivos imediatos (confiabilidade)

1. Garantir que a indexação não dependa de rede externa (reranker opcional).
2. Garantir que a busca nunca rode “global” (sempre escopada por paciente).
3. Garantir que falhas de embeddings não derrubem a indexação inteira.
4. Expor sinais claros de saúde do RAG (métricas simples e logs úteis).

## Diagnóstico das falhas observadas (causas-raiz prováveis)

- **Busca retornando 0 resultados no RAG Debug**: o frontend não enviava `patient_hash` (nem `patientId`) no endpoint `/api/retrieval/debug`, então a busca era global/ambígua e, após reforço de isolamento, passou a não retornar nada.
- **Reranker quebrando a busca**: o modelo `Xenova/bge-reranker-v2-m3` tenta baixar artefatos e pode falhar por “Unauthorized access”, rede restrita ou cache ausente. Isso deve degradar, não derrubar.
- **Indexação falhando de forma frágil**: uma falha de embedding em um chunk interrompia o batch e impedia upsert do restante.

## Plano de curto prazo (1–2 sessões)

### 1) Contrato estável de debug (frontend ↔ backend)

- Padrão: `POST /api/retrieval/debug` recebe `{ query, filters: { patientId, ... } }`.
- Backend resolve `patient_hash` a partir de `patientId` e valida permissão (`createdBy`).
- Frontend passa automaticamente `patientId` via rota atual (`/patients/:id`).

### 2) Degradação controlada (fail-soft)

- Indexação: se embedding falhar para um chunk, salvar chunk com `embedding = null` e manter FTS/lexical disponível.
- Busca: se embedding da query falhar, executar apenas FTS.
- Vetorial: excluir documentos com `embedding = null` da busca vetorial.
- Reranker: se falhar ao inicializar, desabilitar para a vida do processo e usar RRF.

### 3) Verificação de saúde (mínimo viável)

- Script/endpoint simples para:
  - Contar documentos por paciente (`patient_documents`).
  - Contar quantos estão sem embedding.
  - Rodar uma query lexical e uma vetorial (quando possível) e comparar.

## Plano de médio prazo (qualidade de recuperação)

### 1) Melhorar o chunking com rastreabilidade

- Garantir que todo chunk carregue:
  - `metadata.parent_record_hash`
  - `metadata.record_type`
  - `metadata.relative_date` e `day_offset`
  - `metadata.source = record|demographics|structured_tag`

### 2) Normalização de tags/contextos

- Definir um enum/padrão de `context` (uti/emergencia/ambulatorio/default/demographics).
- Definir padrão de tags (uppercase, sem PII, estável).

### 3) Ranking híbrido calibrado

- Ajustar RRF (k/topN) e limites de candidatos com base em latência.
- Tornar reranker “feature-flag” via env, com cache apontando para volume local.

## Plano de longo prazo (produto)

- “Reindex por paciente” na UI (ação explícita com progresso).
- “Mostre por que este chunk apareceu” (exibir contribuição vetorial vs lexical vs rerank).
- Auditoria de privacidade: testes automatizados de isolamento por paciente (regressão).

## Checklist de validação (operacional)

1. Criar/editar registro com palavra-chave única.
2. Confirmar que a indexação gerou novos rows em `patient_documents`.
3. No RAG Debug, buscar a palavra-chave e validar retorno imediato.
4. Desligar rede/bloquear acesso a HuggingFace e garantir que a busca ainda funciona (sem rerank).

