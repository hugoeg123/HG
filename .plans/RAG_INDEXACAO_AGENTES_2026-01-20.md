# Plano e Estratégia: Indexação RAG e Agentes Clínicos

## Objetivo
Estabelecer um plano de execução para indexação de registros anonimizados e uso de RAG pelos agentes clínicos, garantindo segurança, performance e alinhamento entre frontend e backend.

## Escopo Prioritário
1. Robustez do pipeline de anonimização → chunking → indexação vetorial → recuperação híbrida.
2. Observabilidade do RAG para agentes (debug, inspeção, rerank).
3. Preparação para base de protocolos (ainda não iniciada) com isolamento por domínio.

## Mapa de Codependências e Fatores Críticos
- **Anonymizer**: backend/src/services/anonymizer/PatientAnonymizer.js depende de ANONYMIZER_KEY e regras em anonymization.config.js.
- **Indexação RAG**: backend/src/services/rag/VectorIndexer.js usa ClinicalChunkingStrategy.js e Ollama embeddings.
- **Recuperação**: ClinicalRetriever.js usa pgvector + FTS + RRF + reranker Xenova.
- **Banco**: tabela patient_documents e índices (FTS, HNSW, GIN) em migration 20260105033820.
- **Frontend Debug**: frontend/src/components/RightSidebar/RagDebugger.jsx usa retrieval.service.js.
- **IA/Agentes**: frontend AIAssistant.jsx usa aiService.js (streaming); backend ai.controller.js usa ollama.service.js.

## Principais Riscos Observados
- Inconsistência de documentação sobre IA e endpoints.
- Endpoint de sugestões de IA inexistente, causando 404 no frontend.
- Dependência crítica de ANONYMIZER_KEY sem instrução explícita no setup.
- Reranker Xenova pode falhar por ambiente ou peso do modelo, exigindo fallback robusto.

## Estratégia Técnica Proposta
1. **Confiabilidade do Pipeline**
   - Verificar configuração obrigatória: ANONYMIZER_KEY, OLLAMA_BASE_URL, XENOVA_CACHE_DIR.
   - Garantir fallback: se embeddings falharem, manter busca léxica com RRF.
2. **Isolamento e Segurança**
   - Garantir escopo por patient_hash em toda consulta.
   - Manter PII fora de patient_documents com auditoria e constraint já existente.
3. **Performance**
   - Manter índices HNSW e FTS atualizados.
   - Limitar rerank ao top-N e permitir desativação controlada.
4. **Pré-Base de Protocolos**
   - Definir namespace de documentos por tipo: patient/..., protocols/...
   - Manter chunking específico para protocolos com metadados de especialidade.

## Etapas de Execução
1. Consolidar documentação mínima de setup para ANONYMIZER_KEY e Ollama.
2. Validar endpoints reais de IA e corrigir divergências de frontend/backend.
3. Instrumentar a indexação com logs estruturados e checkpoints de auditoria PII.
4. Preparar esquema e estratégia de chunking para protocolos clínicos.

## Critérios de Sucesso
- Indexação de pacientes completa e rastreável sem vazamento de PII.
- Busca híbrida com resultados coerentes e estáveis.
- Agentes consumindo RAG via endpoints estáveis e documentados.
- Base de protocolos pronta para onboarding sem reescrever pipeline.
