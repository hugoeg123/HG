Com base no sucesso da **Fase 1 (Camada de Anonimização)** , aqui está a definição formal e prática da **Fase 2**.
O objetivo agora é transformar os **dados seguros (JSON anonimizado)** em **inteligência pesquisável (Vetores)**.
---
#  Fase 2: Ingestão, Indexação e Retrieval (RAG Core)
**Status:** A iniciar.
**Objetivo:** Criar o "cérebro de memória" do Health Guardian. Ao final desta fase, o sistema deve ser capaz de responder à pergunta: *"Quais exames e notas deste paciente são relevantes para o termo X?"* com alta precisão e zero vazamento de dados.
## 1. Decisões de Stack (Consenso Final)
Para viabilizar a **precisão clínica** (que exige Reranking) e manter a **privacidade local**, esta é a stack definida para a Fase 2:
* **Microserviço de ML:** **Python (FastAPI)**.
* *Por quê?* Embora seu backend principal seja Node.js, as bibliotecas de RAG avançado (LlamaIndex, Rerankers) são nativas em Python. Tentar fazer isso em Node.js resultará em perda de qualidade clínica.
* **Vector Store:** **pgvector** (Extensão do PostgreSQL).
* *Por quê?* Mantém a infraestrutura simples (você já usa Postgres). Evita subir um container Docker extra (Qdrant) agora, facilitando o MVP.
* **Framework de Indexação:** **LlamaIndex**.
* **Embeddings:** `nomic-embed-text` (Via Ollama).
* **Reranker (Crítico):** `BAAI/bge-reranker-v2-m3` (Local via Python).
---
## 2. Roadmap Detalhado da Fase 2
### Passo 2.0: Infraestrutura (A "Ponte")
Criar a comunicação entre o seu Backend Node (que detém os dados) e o novo Serviço Python (que detém a inteligência).
* **Ação:** Configurar `pgvector` no seu banco PostgreSQL atual.
* **Ação:** Criar estrutura do projeto `hg-ml-service` (Python/FastAPI).
* **Ação:** Criar endpoint no Node `GET /api/internal/anonymization/patient/:id` protegido por API Key interna, entregando o JSON limpo da Fase 1.
### Passo 2.1: O Indexador (ETL & Chunking)
O serviço Python deve consumir os dados anonimizados e prepará-los.
* **Chunking Semântico:** Não quebre o texto aleatoriamente.
* *Estratégia:* 1 Registro (Exame/Consulta) = 1 Documento Pai. Se for longo, quebrar em chunks filhos, mas mantendo metadados.
* **Metadados Ricos:** Cada vetor deve carregar:
* `patient_hash` (Vindo da Fase 1)
* `relative_date` (ex: "Day +45")
* `record_type` (ex: "lab_result", "evolution")
* `doc_path` (ex: "labs/hemograma.json")
* **Embedding:** Gerar vetores usando `nomic-embed-text` via Ollama.
* **Persistência:** Salvar na tabela `patient_embeddings` no Postgres.
### Passo 2.2: O Motor de Busca (Hybrid Retrieval)
Aqui reside a qualidade clínica. A busca não pode ser apenas por palavras-chave.
* **Busca Híbrida:** Implementar lógica que busca por **Similaridade Vetorial** (significado) E **Keywords** (BM25 - termos exatos médicos).
* **Reranking (O Diferencial):** Pegar os Top-20 resultados da busca híbrida e passar pelo modelo `bge-reranker`. Ele reordenará baseada na relevância real para a pergunta médica.
* **Endpoint de Busca:** O serviço Python expõe `POST /retrieve` que recebe `{ query, patient_hash }` e retorna os trechos mais relevantes.
---
## 3. Entregáveis Técnicos (Checklist)
### A. Banco de Dados (PostgreSQL)
Executar no seu banco atual:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE patient_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_hash VARCHAR(64) NOT NULL,
    content TEXT NOT NULL, -- O trecho de texto (já anonimizado)
    metadata JSONB NOT NULL, -- { type: 'lab', date: 'Day +10', path: '...' }
    embedding vector(768), -- Dimensão do nomic-embed-text
    created_at TIMESTAMP DEFAULT NOW()
);
-- Índices para performance
CREATE INDEX idx_emb_patient ON patient_embeddings(patient_hash);
CREATE INDEX idx_emb_vector ON patient_embeddings USING hnsw (embedding vector_cosine_ops);
```
### B. Microserviço Python (Esqueleto)
Sugestão de estrutura para o `hg-ml-service`:

```python
# main.py (FastAPI)
@app.post("/ingest/{patient_id}")
async def ingest_patient(patient_id: str):
    # 1. Busca dados no Node.js (via http://backend-node:3000/api/internal/...)
    # 2. Processa com LlamaIndex
    # 3. Salva no Postgres
    return {"status": "indexed", "chunks": count}

@app.post("/search")
async def search_records(query: SearchQuery):
    # 1. Converte query em vetor
    # 2. Busca Híbrida (SQL + Vector)
    # 3. Rerank com BGE
    return results # Lista de trechos com score de relevância
```
---
## 4. O que NÃO fazer nesta fase
1. **Não criar o Chat ainda:** Não tente gerar texto com LLM (Llama3/Deepseek). O foco agora é encontrar a informação certa. Se a busca for ruim, o chat será ruim.
2. **Não expor ao Frontend:** Esta fase é backend-to-backend.
3. **Não relaxar a segurança:** O serviço Python deve tratar o `patient_hash` como verdade absoluta e nunca tentar reverter para o nome real.
## Próximo Passo Imediato
Você deve criar o branch `feature/phase-2-rag-core`.
Sua primeira tarefa é: **Habilitar a extensão `vector` no seu Postgres e criar o script Python básico que consegue conectar no Ollama e gerar um embedding de teste.**
Estamos de acordo com este escopo para a Fase 2?
According to a document you provided today (January 5, 2026), aqui vai um **PRD compacto, mas completo e “abrível em issues/milestones”**, consolidando a discussão: **Fase 1 (Anonimização LGPD) já pronta** e agora **Fase 2 (Indexação + Retrieval híbrido) → Fase 3 (Chat/Agente read-only com citações)**, com a UX de “IDE Médica” (thoughts colapsáveis + lista de registros acessados).
---
## PRD — HG Agentic RAG (Indexação + Busca + Chat com Citações)
### 1) Visão do produto
Transformar o **Health Guardian (HG)** em uma **“IDE Médica”**: o “projeto” é o paciente; o agente navega registros como “arquivos/pastas”, **mostra passos de raciocínio em blocos colapsáveis (“thought”)** e **exibe fontes consultadas** (doc_path + trecho + metadados), com auditoria e LGPD-first.
**Princípios**
* **LGPD-first / fail-closed:** nada entra no índice se houver risco de PII.
* **Read-only:** agentes não alteram prontuário; apenas respondem no chat.
* **Auditável:** sempre retornar **fontes** + logs do que foi consultado.
* **Modular/swappable:** começar simples (pgvector) e poder migrar (Qdrant) se precisar de escala/perf.
---
### 2) Objetivos (o que “tem que sair”)
**O1.** Indexar documentos **anonimizados** por paciente em um **Vector Store** com metadados clínicos e doc_path lógico.
**O2.** Implementar **busca híbrida** (semântica + lexical) com **RRF** e **reranker**, retornando top trechos com scores e metadados.
**O3.** Implementar **Chat RAG read-only** que responde **com citações** (doc_path + data/tipo), e mostra “thought steps” colapsáveis via streaming de eventos.
**O4.** Garantir “production safety”: strict mode, testes, e logs sem texto clínico bruto.

> Nota: o doc sugere o padrão ReAct/Plan-and-Solve para “mágica” IDE sem RL/RLVR agora.
---
### 3) Não-objetivos (nesta fase)
* Treinar modelo com RL/RLVR ou fine-tuning (fora do escopo agora).
* Escrever/alterar registros automaticamente (continua read-only).
* Construir GraphRAG completo (pode vir depois, quando o retrieval básico estiver estável).
---
### 4) Usuários e casos de uso
**Personas**
* **Médico**: quer achar rapidamente “o exame X”, “última HbA1c”, “quando começou anemia”, “quais antibióticos já usou”.
* **Sistema (job/worker)**: indexa incrementalmente sem reindexar “o mundo”.
**User stories**
1. Como médico, faço uma pergunta e recebo **resposta + lista de fontes consultadas**.
2. Como médico, consigo ver **os passos (“thought”)** do agente (sem expor conteúdo sensível indevido), e quais registros foram usados.
3. Como sistema, eu **bloqueio indexação** se strict/audit detectar PII, sem vazar texto em logs.
4. Como sistema, reindexo só o que mudou (incremental).
---
### 5) Requisitos funcionais
#### 5.1. Contrato do “Documento Anonimizado” (v1) — “congelar antes de indexar”
**Obrigatório** (mínimo):
* `patient_hash`
* `record_hash`
* `doc_path` (filesystem lógico)
* `type` (consulta/exame/uti/etc.)
* `day_offset` ou `relative_date` (“Day +X”)
* `content_redacted` (texto já redigido)
* `tags` (opcional)
* `meta.anonymizer_version`, `meta.generated_at`
**Regra de compatibilidade**
* Mudança breaking → bump `anonymizer_version` + reindex.
#### 5.2. Pipeline de indexação (job interno; não endpoint público)
* Indexação roda como **worker/job** (ex.: cron noturno), chamando o anonymizer “em memória” ou endpoint interno protegido.
* Se `ANONYMIZER_STRICT_MODE=true` e auditoria falhar: **não indexa** e registra erro **sem logar texto**.
**Chunking (estratégia inicial)**
* Quebrar por **evento clínico** (cada consulta/exame/registro UTI = 1 documento base) e depois chunk textual (ex.: ~512 tokens), preservando `day_offset` e metadados por chunk.
#### 5.3. Vector Store + Schema (MVP em Postgres)
Tabelas sugeridas (MVP robusto):
* `rag_documents` (metadados e texto redigido)
* `rag_chunks` (chunks + embedding + índices)
* `rag_index_state` (controle incremental por paciente)
> Alternativa simplificada do doc: `patient_embeddings`/`patient_chunks` como tabela única — aceitável se quiser acelerar, mantendo a ideia de doc_path + metadados + embedding.
**Embeddings**
* Via **Ollama embeddings** (ex.: `nomic-embed-text` 768 dims ou `bge-m3` 1024).
**Índices**
* Vetorial: ivfflat ou HNSW (dependendo do setup do pgvector).
* Lexical: tsvector/tsquery (Portuguese) para BM25-like ranking.
* GIN em metadata JSONB.
#### 5.4. Retrieval híbrido (antes do “agente completo”)
Endpoint de busca **sem LLM** primeiro:
* `GET /api/rag/search?patientId=...&q=...`
* Retorna: top chunks + `doc_path` + trecho + scores + metadados (type, day_offset).
Algoritmo (MVP):
1. Dense search (vetorial) filtrando `patient_hash`
2. Lexical search (tsquery) filtrando `patient_hash`
3. Merge **RRF** (reciprocal rank fusion)
4. **Rerank** (BAAI reranker) e retorna top_n
#### 5.5. Chat RAG read-only com citações
* Chat chama `/rag/search`, monta contexto e gera resposta **com citações** (doc_path + data/tipo).
* Regras de segurança do prompt: **não inventar**, se não houver dado “não há registro disponível…”, sempre citar fonte, sinalizar incerteza.
#### 5.6. UX — “IDE Médica”
* **Thought colapsável** alimentado por streaming de eventos (SSE/WebSocket), refletindo passos do pipeline (buscar → filtrar → rerank → responder).
* **Painel de fontes**: lista de registros consultados (doc_path + data/tipo + score), como “arquivos abertos”.
---
### 6) Requisitos não-funcionais (qualidade)
**Segurança / LGPD**
* `ANONYMIZER_KEY` (mín 32 chars) obrigatório; nunca commitado. Strict mode no pipeline de indexação.
* Logs **sem texto clínico** (apenas hashes, contadores, IDs).
* Teste E2E “CPF no texto → falha/redige → índice nunca guarda PII”.
**Performance**
* Busca por paciente com filtro `patient_hash` deve ser rápida o suficiente para UX de chat.
* Indexação incremental evita reprocessar histórico inteiro em cada mudança.
**Confiabilidade**
* Se reranker/embedding indisponível: degradar (ex.: retorna lexical+dense sem rerank) com aviso no log.
---
### 7) Métricas e critérios de aceite
**Aceite (hard gates)**
1. **PII=0 no índice** (amostragem + teste “toxic”).
2. **Strict mode funciona**: auditoria falhou → nada indexado.
3. Endpoint `/rag/search` retorna chunks relevantes com fontes e metadados.
4. Chat devolve resposta com **fontes obrigatórias**.
**Qualidade de Retrieval (target inicial)**
* **Recall/precisão > 85%** em conjunto de testes sintéticos + casos reais anonimizados (benchmark simples por queries definidas).
---
### 8) Arquitetura e componentes (MVP)
**Backend Node (HG)**
* `AnonymizationController` já existe e está “pronto para ser consumido”.
* Novo módulo:
  * `backend/src/services/rag/VectorIngestionService.js` (ingestão + chunking + embeddings + upsert)
  * `backend/src/services/rag/RagSearchService.js` (dense + lexical + RRF + rerank)
  * `backend/src/controllers/RagController.js` (`/api/rag/search`, `/api/rag/ask`)
  * `backend/src/jobs/rag_indexing.job.js` (cron incremental)
**Opcional (se preferirem): microserviço Python**
* Só se quiser acelerar uso de libs Python (LlamaIndex etc.). O PRD não depende disso; o core é manter interface plugável.
---
### 9) Roadmap em PRs (pronto pra milestones)
**PR1 — Schema + migrações**
* Criar tabelas (`rag_documents`, `rag_chunks`, `rag_index_state`) + índices (vetor, GIN metadata, tsvector).
**PR2 — Ingestão + Chunking + Embeddings**
* Implementar `VectorIngestionService`
* Implementar chunking “evento clínico → chunks”
* Integrar embeddings via Ollama (`/api/embeddings`)
**PR3 — Search endpoint (sem LLM)**
* `GET /api/rag/search`
* Dense + lexical + RRF + (opcional) rerank
* Retornar fontes estruturadas (doc_path, date/type, score)
**PR4 — Chat com citações + “thought streaming”**
* `POST /api/rag/ask`
* Streaming de eventos para UI (“thoughts”) + resposta final + fontes
---
### 10) Riscos e mitigação
* **Risco:** PII vazando em texto livre → **Mitigação:** strict + audit + toxic tests + logs sem texto.
* **Risco:** retrieval “ruim” → agente inútil → **Mitigação:** hybrid + rerank + benchmark (>85%).
* **Risco:** escala do Postgres → **Mitigação:** começar pgvector; manter adapter para migrar a Qdrant se necessário.
---
### 11) Decisões pendentes (curtas, mas importantes)
1. **Vector store MVP:** pgvector (simplicidade) vs Qdrant (performance). (PRD assume pgvector primeiro, com adapter.)
2. **Embedding model padrão:** `nomic-embed-text (768)` vs `bge-m3 (1024)` via Ollama.
3. **Reranker local:** rodar via Node (@xenova/transformers) ou microserviço.
---
Se você quiser, eu já transformo este PRD em:
* **Checklist de issues no formato GitHub** (título + descrição + critérios de aceite por issue), ou
* **Estrutura de pastas/arquivos** no padrão do HG (paths exatos) para o PR1–PR4.
