Aqui está o **Product Requirements Document (PRD)** consolidado para a **Fase 2 do Health Guardian**.
Este documento traduz o consenso técnico (Solução 12) em um plano de execução claro, focado em transformar o prontuário anonimizado em uma base de conhecimento pesquisável com precisão clínica.
---
# PRD: Health Guardian - Fase 2 (Clinical Vector Engine)
**Versão:** 1.0 (Consenso Final)
**Status:** Pronto para Desenvolvimento
**Foco:** Indexação Vetorial, Chunking Semântico e Retrieval Híbrido
---
## 1. Resumo Executivo
O objetivo da Fase 2 é implementar o "motor de busca" do Health Guardian. Diferente de buscas genéricas, este motor deve tratar o prontuário médico com a estrutura de uma **"IDE Médica"**: organizando dados por contextos (pastas) e tags clínicas (funções), permitindo que agentes de IA recuperem informações precisas (ex: "última creatinina na UTI") sem alucinações.
A arquitetura prioriza **simplicidade operacional** (PostgreSQL + pgvector) e **inteligência local** (Ollama + BGE Models), evitando complexidade prematura de infraestrutura.
---
## 2. Arquitetura Técnica
### 2.1 Stack Definida
* **Vector Store:** **PostgreSQL** com extensão `pgvector`.
* *Justificativa:* O padrão de acesso é sempre "um paciente por vez" (Single-Patient Retrieval). O índice B-Tree filtra o paciente instantaneamente, deixando o índice vetorial (HNSW) lidar apenas com ~1k-5k chunks, garantindo latência <50ms sem necessidade de bancos vetoriais dedicados (Qdrant).
* **Embeddings Model:** **BAAI/bge-m3** (via Ollama).
* *Specs:* 1024 dimensões, Multilingue (PT-BR), Janela de contexto de 8192 tokens.
* **Reranker Model:** **BAAI/bge-reranker-v2-m3** (via `@xenova/transformers`).
* *Função:* Cross-encoder que reordena os top-20 resultados para garantir precisão clínica.
* **Backend:** Node.js (Serviços de Ingestão e Retrieval).
### 2.2 Fluxo de Dados
1. **Input:** JSON Anonimizado (output da Fase 1).
2. **Processamento:** `ClinicalChunkingStrategy` (Quebra inteligente).
3. **Embedding:** Geração de vetores via API Ollama local.
4. **Storage:** Upsert transacional no PostgreSQL (`patient_documents`).
5. **Retrieval:** Busca Híbrida (Vector + FTS) → Reranking → JSON Response.
---
## 3. Especificação Funcional: Chunking Strategy ("A IDE Médica")
O sistema não deve quebrar texto cegamente. Ele deve respeitar a hierarquia clínica.
### 3.1 Níveis de Chunking
* **Nível 1 - Contexto (A Pasta):** Todo chunk herda o contexto do atendimento (`UTI`, `Emergência`, `Ambulatório`).
* **Nível 2 - Tags (A Função):** Se o registro possui tags estruturadas (ex: `NEUROLOGICO`), o conteúdo daquela tag torna-se um chunk isolado.
* **Nível 3 - Semântico (O Código):** Para texto livre, quebra por parágrafos/sentenças respeitando limites de tokens (512), mantendo coesão.
### 3.2 Enriquecimento de Metadados (Metadata Injection)
O texto enviado para o Embedding (`embedding_text`) deve ser **mais rico** que o texto exibido (`content`).
* **Formato de Injeção:**
```text
Contexto: UTI Adulto | Sistema: Cardiovascular | Data: Day +3
Conteúdo: Noradrenalina 0.5mcg/kg/min, PA 65x40.
```
*Isso garante que o vetor "saiba" que aquele valor de PA pertence a um contexto de UTI.*
---
## 4. Schema do Banco de Dados (PostgreSQL)
### Tabela: `patient_documents`
| Coluna | Tipo | Descrição | Índices |
| --- | --- | --- | --- |
| `id` | UUID | PK | - |
| `patient_hash` | VARCHAR | ID anonimizado do paciente | **B-Tree** (Filtro primário) |
| `doc_path` | TEXT | Caminho lógico (`patient/uti/day1/neuro`) | Unique Constraint |
| `context` | VARCHAR | `uti`, `emergencia`, `ambulatorio` | B-Tree |
| `doc_type` | VARCHAR | `evolucao`, `exame`, `prescricao` | - |
| `tags` | TEXT[] | Array de tags (`['NEURO', 'GLASGOW']`) | **GIN** (Busca rápida) |
| `metadata` | JSONB | `{ relative_date: "Day +1", ... }` | GIN |
| `content` | TEXT | Texto original para exibição | **FTS** (Lexical Search) |
| `embedding_text` | TEXT | Texto enriquecido usado no vetor | - |
| `embedding` | VECTOR(1024) | Vetor BGE-M3 | **HNSW** (Busca Vetorial) |
---
## 5. Especificação Funcional: Retrieval Pipeline
O endpoint de busca deve executar 4 passos sequenciais para cada query:
1. **Vector Search (Semântica):**
* Busca por similaridade de cosseno filtrando por `patient_hash`.
* Retorna Top-20 candidatos.
2. **Lexical Search (Palavra-Chave):**
* Busca via Postgres Full-Text Search (tsvector).
* Crucial para encontrar nomes exatos de medicamentos ou IDs de exames.
* Retorna Top-20 candidatos.
3. **Hybrid Fusion (RRF):*
* Combina as duas listas usando *Reciprocal Rank Fusion*.
4. **Reranking (Refinamento):**
* Passa os Top-20 combinados pelo modelo `bge-reranker`.
* Retorna os **Top-5** finais com score de relevância.
---
## 6. Critérios de Aceite e Métricas
### 6.1 Performance
* **Latência de Busca:** < 1.5 segundos (pipeline completo).
* **Latência de Ingestão:** < 500ms por registro clínico.
### 6.2 Qualidade (Retrieval)
* **Recall@5:** > 80% (A resposta correta deve estar nos top 5 resultados em 8 de 10 testes).
* **Teste de Sanidade:** Uma busca por "Cardio" deve priorizar chunks com tag `CARDIOVASCULAR` sobre chunks de texto livre que apenas mencionem a palavra.
### 6.3 Segurança e Privacidade
* **Zero PII:** O banco vetorial deve conter apenas dados já anonimizados na Fase 1.
* **Auditoria:** O campo `anonymizer_version` deve estar preenchido em 100% dos registros.
---
## 7. Roadmap de Implementação (3 Semanas)
### **Semana 1: Infraestrutura e Chunking**
* [ ] **Setup:** Configurar Postgres com `pgvector` e Ollama com `bge-m3`.
* [ ] **Backend:** Criar serviço `ClinicalChunkingStrategy.js` implementando a lógica de Contexto/Tags.
* [ ] **Ingestão:** Criar script que lê JSON da Fase 1 e popula o banco.
### **Semana 2: Retrieval Engine**
* [ ] **Search:** Implementar `HybridRetriever` (SQL Vetorial + FTS).
* [ ] **Rerank:** Integrar `BGEReranker` (via transformers.js).
* [ ] **API:** Criar endpoint `POST /api/search` recebendo filtros (contexto, data).
### **Semana 3: Validação e RAG Básico**
* [ ] **RAG:** Criar endpoint simples que pega os Top-5 chunks e passa para um LLM (ex: Qwen/Llama3) responder com citações.
* [ ] **Testes:** Rodar bateria de 30 perguntas clínicas reais para validar Recall.
* [ ] **Doc:** Documentar API para futura integração com Agentes (Fase 3).
---
## 8. Próximo Passo Imediato
Aprovar este PRD e iniciar a **Semana 1**: Criar a migration do banco de dados e a classe `ClinicalChunkingStrategy`.
# PRD — Health Guardian (HG) | Fase 2: Motor de Busca Clínica (“Medical IDE Engine”)
## 1) Contexto e problema
Queremos que o prontuário funcione como uma **IDE clínica**: o usuário escreve em templates/“pastas” (UTI, Emergência, Ambulatório), com **seções/tags** (Neuro, Cardio, Resp…), e o sistema consegue **buscar e responder com evidências** (citações) dentro do histórico do paciente. A UI já sugere isso via **templates**, “Fixar Contexto”, **+ Nova Tag** e o toggle **Visão Segmentada vs Texto corrido**.  
## 2) Objetivos
1. Implementar **indexação vetorial + busca híbrida** (vetorial + full-text) no prontuário do paciente, com **reranking clínico**.  
2. Definir **modelo de escrita estruturada** (templates + seções) que gere chunks “prontos” para RAG (1 chunk = 1 seção). 
3. Garantir operação simples (single DB): **PostgreSQL + pgvector**, com filtros por `patient_hash`, e arquitetura preparada para trocar componentes via adapter quando necessário. 
## 3) Não-objetivos (fora do escopo da Fase 2)
* Agentes que **intervêm/planejam** (To-do list ativa e ações autônomas) — fica para Fase 3, embora a base já prepare isso. 
* Busca **cross-patient** (pesquisa por pacientes similares / research) e necessidade de vector DB externo (ex.: Qdrant) no MVP da Fase 2. 
## 4) Usuários e casos de uso
**Persona principal:** Médico no prontuário (UTI/PS/ambulatório).
**Casos de uso:**
* “Paciente teve piora neurológica na UTI?” → priorizar chunks `context=UTI` e `tag=NEUROLOGICO`. 
* Filtrar busca por **contexto**, **tags** e **janela temporal**. 
* Escrever em **modo segmentado** (seções) ou **texto corrido**, com conversão/compatibilidade. 
## 5) Requisitos funcionais
### 5.1 Templates e editor (“HybridEditor”)
* O sistema deve suportar **Templates por contexto** (ex.: UTI Adulto; SOAP; Revisão por Sistemas; XABCDE), e permitir **seções padrão + seções customizadas** (“+ Nova Tag”). 
* Deve existir toggle: **SEGMENTED vs FREE_TEXT**, com conciliação entre formatos. 
* **Regra estrutural:** `segments` é a **fonte de verdade**; `full_text` é render determinístico (para print/export/compat). 
### 5.2 Fluxo de rascunho/salvar
* State machine mínimo: `CLEAN → DIRTY → SAVING_SECTION → FINALIZING`. 
* Ao trocar de seção: se `DIRTY`, salvar **apenas a seção** (`PATCH .../segments/:sectionKey`), usando `isDraftDisabled=true` durante a navegação para evitar duplicidade. 
* Autosave opcional (modo segmentado): debounce 1–2s por seção. 
* “Salvar”: flush de pendências + `POST /finalize` + navegação. “Cancelar”: descartar rascunho. 
### 5.3 API mínima (UI + indexação + busca)
**Templates** 
* `GET /api/templates?context=UTI_ADULTO`
* `POST /api/templates` (admin)
* `PUT /api/templates/:id` (admin)
**Notas** 
* `POST /api/patients/:patientId/encounters/:encounterId/notes`
* `GET /api/notes/:noteId`
* `PATCH /api/notes/:noteId`
* `PATCH /api/notes/:noteId/segments/:sectionKey`
* `POST /api/notes/:noteId/finalize` (dispara indexação)
* `POST /api/notes/:noteId/cancel`
**Seções customizadas** 
* `POST /api/notes/:noteId/custom-sections`
* `DELETE /api/notes/:noteId/custom-sections/:sectionKey`
**Busca / RAG (separar por domínio de índice)** 
* `POST /api/search/patient/:patientHash`
* `POST /api/search/knowledgebase` (futuro: guidelines/artigos)
* `POST /api/rag/patient/:patientHash` (resposta com citações)
## 6) Indexação e retrieval
### 6.1 Decisão de storage vetorial
* Usar **PostgreSQL + pgvector** com filtros por `patient_hash`, mantendo simplicidade operacional (single DB) e busca híbrida no mesmo lugar. 
* Considerar Qdrant **somente** se houver cross-patient ou KB global gigante/latência degradando de forma consistente. 
### 6.2 Chunking (“IDE-like”)
Princípios: **Contexto = tipo de arquivo**, **Tags = símbolos/funções**, **texto livre = fallback**. 
Regras:
* Preferencial: **1 chunk = 1 seção** (neuro/cv/resp…), com `doc_path` e metadados fortes (context/template/relative_date/section). 
* Indexação incremental: calcular `content_hash`; se não mudou, não re-embed (importante com autosave). 
### 6.3 Embeddings + reranker
* Embeddings: **BGE-M3** (ou fallback como `nomic-embed-text` se necessário). 
* Reranker: **BGE-reranker-v2-m3** (tratado como obrigatório para precisão clínica); a própria proposta estima ganho de ~20–30% em precisão.  
### 6.4 Retrieval híbrido
* Executar: **vector search + full-text search**, combinar via **RRF (Reciprocal Rank Fusion)**, então rerank nos top candidatos.  
## 7) Requisitos de dados (modelos e schema)
### 7.1 Template (mínimo)
Template define `id`, `title`, `context`, `renderer` e `sections[]` (keys/labels/ordem). 
### 7.2 Note (mínimo)
Nota guarda `template_id`, `mode`, `segments` (fonte de verdade), `custom_sections`, `full_text`, `status`. 
### 7.3 Vector store (Postgres)
Tabela `patient_documents` com `patient_hash`, `record_hash`, `doc_path`, `doc_type`, `context`, `content`, `embedding_content`, `metadata`, `tags[]`, `embedding`, índices (B-tree, GIN tags/metadata, FTS pt-BR, HNSW). 
## 8) Requisitos não-funcionais
* **Privacidade/LGPD:** indexar apenas conteúdo já anonimizado + trilha de auditoria por `record_hash`/versão do anonymizer (fail-closed). (Diretriz do design do schema e pipeline.) 
* **Performance:** busca típica por paciente deve ser sub-segundo a ~1.5s mesmo com reranker (meta); filtros por contexto/tags devem reduzir candidatos. 
* **Observabilidade:** métricas de latência (vector/fts/rerank), contagem de chunks por paciente, taxa de reindex, logs de auditoria.
## 9) Critérios de aceitação (MVP Fase 2)
* Busca por paciente com filtros (`context`, `tags`, `date_range`) funcionando end-to-end. 
* “Visão Segmentada” salva por seção e finaliza corretamente com state machine sem duplicidade. 
* Retrieval híbrido + RRF + reranker retornando top-5 coerente (com citações por `doc_path`/seção).  
## 10) Roadmap sugerido (curto)
* **Semana 1:** migrations Postgres + schema + chunking (tags/context/fallback) + ingestão/embeddings.  
* **Semana 2:** endpoints de busca + hybrid retrieval (vector+FTS) + RRF + filtros.  
* **Semana 3:** reranker + validação com queries clínicas (ex.: piora neurológica na UTI) + endpoint RAG com citações.  
## 11) Riscos e mitigação
* **Modelo pesado/latência:** permitir fallback de embedding e batch; reindex incremental por `content_hash`.  
* **Dados sem estrutura (texto corrido):** usar fallback semântico; incentivar uso de templates/segmentado. 
* **Reranker caro:** rerank só top-N candidatos (ex.: 20–50), mantendo filtros fortes por contexto/tags. 
Se quiser, eu converto isso em **épicos + histórias (Jira/GitHub Issues)** já quebradas por PRs (DB → API notas → indexador → retrieval → rerank → RAG), mantendo o PRD como “fonte de verdade” do escopo.
