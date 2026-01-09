Aqui está o **Product Requirements Document (PRD)** consolidado para a Fase 2 do Health Guardian. Este documento unifica todas as decisões técnicas, a estratégia de "IDE Médica" e o roadmap discutido.

---

# 📄 PRD: Health Guardian - Fase 2 (RAG Core & Indexação)

| Metadado | Detalhe |
| --- | --- |
| **Projeto** | Health Guardian (HG) |
| **Fase** | Fase 2: Indexação Vetorial & Retrieval Híbrido |
| **Objetivo** | Transformar registros anonimizados em uma base de conhecimento pesquisável com precisão clínica. |
| **Status** | Pronto para Desenvolvimento |
| **Stack Principal** | Node.js, PostgreSQL (pgvector), Ollama (BGE-M3) |

---

## 1. Visão Executiva

O objetivo desta fase é implementar o **"Motor de Busca Clínico"**. Não se trata apenas de buscar palavras-chave, mas de permitir que futuros agentes de IA naveguem pelo prontuário do paciente como um desenvolvedor navega em uma IDE: entendendo contextos (UTI vs Ambulatório), estruturas (Tags/Seções) e cronologia.

**A Decisão Chave:** Utilizar **PostgreSQL + pgvector** como solução definitiva (dispensando Qdrant), focando em buscas *single-patient* de alta precisão com **Hybrid Search + Reranking**.

---

## 2. Arquitetura Técnica (A Stack Definitiva)

### 2.1 Banco de Dados (Vector Store)

* **Tecnologia:** **PostgreSQL** com extensão `pgvector`.
* **Justificativa:** O escopo de busca é sempre filtrado por `patient_hash`. O índice B-Tree filtra o paciente instantaneamente, e o índice HNSW (vetorial) opera sobre um subconjunto de dados (centenas/milhares de chunks), garantindo latência <50ms sem complexidade de infraestrutura adicional.

### 2.2 Modelos de IA (Local-First & Open Source)

* **Embeddings:** **BAAI/bge-m3** (via Ollama).
* *Specs:* 1024 dimensões, suporte nativo a Português, contexto longo (8192 tokens).


* **Reranker:** **BAAI/bge-reranker-v2-m3** (via `@xenova/transformers` no Node.js).
* *Função:* Cross-encoder que reordena os Top-20 resultados para os Top-5 clinicamente mais relevantes. Aumenta a precisão em ~30%.



### 2.3 Backend & Runtime

* **Node.js:** Mantém a stack atual. A orquestração do chunking e chamadas ao Ollama será feita diretamente no backend existente, sem microserviços Python nesta fase.

---

## 3. Estratégia de Chunking: "Clinical IDE Strategy"

O chunking não será por tamanho fixo, mas semântico e hierárquico, seguindo a metáfora de uma IDE de programação.

### 3.1 Hierarquia de Dados

1. **Diretório Raiz:** O Paciente (`patient_hash`).
2. **Contexto (Extensão do Arquivo):** O ambiente clínico.
* Ex: `UTI` (agrupamento temporal/turnos), `Emergencia` (baseado em eventos), `Ambulatorio` (visitas), `Exames`.


3. **Tags (Classes/Funções):** Delimitadores semânticos explícitos.
* Ex: `NEUROLOGICO`, `CARDIOVASCULAR`, `CONDUTA`.


4. **Conteúdo (Código):** O texto clínico anonimizado.

### 3.2 Lógica de Enriquecimento (Embedding Text)

O texto enviado para o modelo de embedding será **enriquecido** com metadados para garantir que o vetor capture o contexto, não apenas as palavras soltas.

> **Formato do Input para o Vetor:**
> `Contexto: UTI Adulto | Sistema: Cardiovascular | Data: Day +3 | Conteúdo: Paciente instável, Noradrenalina 0.5mcg...`

---

## 4. Especificação do Schema de Dados

### Tabela: `patient_documents`

```sql
CREATE TABLE patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação e Rastreio
    patient_hash VARCHAR(64) NOT NULL, -- Link com Fase 1
    record_hash VARCHAR(64) NOT NULL,  -- Para reindexação incremental
    doc_path TEXT NOT NULL,            -- Ex: 'patient/abc/uti/rec_123/tag_neuro'
    
    -- Taxonomia Clínica
    context VARCHAR(30) NOT NULL,      -- 'uti', 'emergencia', 'ambulatorio'
    doc_type VARCHAR(30) NOT NULL,     -- 'evolucao', 'lab', 'prescricao'
    tags TEXT[],                       -- ['NEUROLOGICO', 'GLASGOW']
    
    -- Conteúdo
    content TEXT NOT NULL,             -- Texto puro (para leitura/display)
    embedding_content TEXT NOT NULL,   -- Texto enriquecido (para o vetor)
    
    -- Vetor e Metadados
    embedding vector(1024),            -- BGE-M3
    metadata JSONB NOT NULL,           -- { relative_date: 'Day +5', urgency: 'high' }
    
    -- Auditoria
    anonymizer_version VARCHAR(10),
    indexed_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_doc_path UNIQUE (patient_hash, doc_path)
);
-- Índices HNSW e GIN (FTS) aplicados.
```
---
## 5. Pipeline de Retrieval (O Motor de Busca)
O endpoint de busca executará um fluxo em 4 etapas para garantir precisão máxima:
1. **Filtros Rígidos:** Seleciona chunks pelo `patient_hash` e, opcionalmente, por `context` ou `tags` (ex: "Buscar apenas em UTI").
2. **Busca Híbrida Paralela:**
* **Vetorial:** Busca semântica (cosine similarity) no campo `embedding`.
* **Lexical:** Busca de texto completo (BM25/FTS) no campo `content` (garante que nomes exatos de remédios/doenças sejam encontrados).
3. **Fusão (RRF):** Algoritmo *Reciprocal Rank Fusion* combina os resultados das duas buscas.
4. **Reranking:** O modelo `bge-reranker` analisa os Top-20 candidatos contra a pergunta do usuário e devolve os Top-5 definitivos.
---
## 6. Roadmap de Implementação (3 Semanas)
### **Semana 1: Infraestrutura & Chunking**
* [ ] **Setup:** Migration SQL (pgvector), instalação Ollama (`bge-m3`).
* [ ] **Chunker:** Implementar `ClinicalChunkingStrategy.js` com suporte a contextos e tags.
* [ ] **Indexer:** Criar script `VectorIngestion.js` (Lê JSON anonimizado -> Chunker -> Ollama Embed -> Postgres Upsert).
* [ ] **Teste:** Indexar 5 pacientes de teste e validar no banco.
### **Semana 2: Retrieval Híbrido**
* [ ] **Retriever:** Implementar `HybridRetriever.js` (Vector + FTS + RRF).
* [ ] **Reranker:** Integrar `BGEReranker.js` (via Transformers.js ou API).
* [ ] **API:** Criar endpoint `POST /api/search/patient` com filtros.
### **Semana 3: Validação & RAG Básico**
* [ ] **RAG:** Implementar `BasicRAG.js` (Recupera contexto -> Monta Prompt com Citações -> Chama LLM).
* [ ] **Testes Clínicos:** Executar bateria de 30 perguntas ("Qual a tendência da função renal?", "Teve febre na UTI?").
* [ ] **Auditoria:** Verificar logs para garantir Zero PII no vector store.
---
## 7. Critérios de Sucesso (KPIs)
1. **Privacidade:** 0 vazamentos de PII (auditado por script regex).
2. **Performance:** Latência total de busca < 2 segundos.
3. **Precisão:** Query "Fadiga na UTI" deve retornar chunks com contexto `UTI` e data recente no topo (Top-3).
4. **Rastreabilidade:** 100% das respostas do RAG devem conter citações válidas (`doc_path` + `data`).
---
## 8. Próximos Passos Imediatos
1. Executar a migration SQL para habilitar `pgvector`.
2. Baixar o modelo `ollama pull bge-m3`.
3. Iniciar a codificação da classe `ClinicalChunkingStrategy.js`.