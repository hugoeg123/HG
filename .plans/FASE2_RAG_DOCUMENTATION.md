# Documentação Técnica: Sistema de Vetorização e Busca (Fase 2)

Esta documentação detalha a implementação da 2ª Etapa do sistema Health Guardian, focada na arquitetura de RAG (Retrieval-Augmented Generation) para processamento de prontuários médicos.

## 1. Visão Geral da Arquitetura

O sistema adota o paradigma de **"IDE Médica"**, onde o prontuário de um paciente é tratado estruturalmente como um projeto de software. Esta analogia orienta a estratégia de fragmentação (chunking) e organização dos dados vetoriais.

*   **Paciente** → Repositório/Projeto
*   **Dados Demográficos** → README.md (Metadados Globais)
*   **Contextos Clínicos** (UTI, Ambulatório) → Diretórios
*   **Tags/Eventos Estruturados** → Funções/Classes
*   **Registros/Evoluções** → Código Fonte

## 2. Componentes Principais

### 2.1. Modelos de IA
*   **Embedding**: `bge-m3` (Executado via Ollama)
    *   Escolhido por sua capacidade multilíngue e suporte a *dense retrieval*.
*   **Reranker**: `Xenova/bge-reranker-v2-m3` (Executado via Transformers.js)
    *   Cross-Encoder utilizado para refinar a relevância dos resultados recuperados.

### 2.2. Banco de Dados
*   **PostgreSQL** com extensão `pgvector`.
*   **Tabela**: `patient_documents`
    *   `embedding`: Coluna vetorial (armazenamento dos embeddings gerados).
    *   `content`: Texto original para busca léxica.
    *   `context`, `tags`: Metadados para filtragem pré-busca.

## 3. Pipeline de Indexação (ETL)

Localização: `backend/src/services/rag/VectorIndexer.js` e `ClinicalChunkingStrategy.js`

O processo de indexação transforma o JSON anonimizado do paciente em vetores pesquisáveis.

### Fluxo de Processamento:

1.  **Entrada**: JSON anonimizado do paciente (Output da Fase 1).
2.  **Estratégia de Chunking (`ClinicalChunkingStrategy.js`)**:
    O conteúdo é dividido com base no contexto clínico:
    *   **Nível 0 (Demographics)**: Cria um chunk "README" com idade, gênero e resumo.
    *   **Contexto UTI (`strategyShiftBased`)**: Agrupa evoluções por data/plantão.
    *   **Contexto Emergência (`strategyEventBased`)**: Trata cada evento como um chunk atômico de alta relevância.
    *   **Tags Estruturadas (`extractLevel1Chunks`)**: Extrai dados críticos (ex: Sinais Vitais, Exames) em chunks dedicados.
3.  **Geração de Embeddings**:
    *   Utiliza o serviço Ollama com o modelo `bge-m3`.
    *   O texto vetorizado (`embedding_content`) é enriquecido com metadados (ex: "Context: UTI | Date: 2023-10-01...").
4.  **Persistência**:
    *   Upsert na tabela `patient_documents` usando `patient_hash` e `doc_path` como chaves únicas.

## 4. Pipeline de Recuperação (Retrieval)

Localização: `backend/src/services/rag/ClinicalRetriever.js`

O sistema utiliza uma abordagem **Híbrida** com **Reciprocal Rank Fusion (RRF)** e **Reranking**.

### Fluxo de Busca:

1.  **Pré-processamento da Query**:
    *   Geração do embedding da pergunta do usuário (`bge-m3`).
2.  **Busca Paralela**:
    *   **Busca Vetorial**: Cosine Similarity no PostgreSQL (`embedding <=> queryVector`).
    *   **Busca Léxica**: Full-Text Search do Postgres (`to_tsvector` / `websearch_to_tsquery`).
3.  **Fusão (RRF)**:
    *   Combina os resultados das duas buscas.
    *   Fórmula: `Score = 1 / (k + rank)`, onde `k=60`.
    *   Prioriza documentos que aparecem bem ranqueados em ambos os métodos.
4.  **Reranking (Refinamento)**:
    *   Os Top-N resultados do RRF são submetidos ao modelo Cross-Encoder (`bge-reranker-v2-m3`).
    *   O modelo avalia o par `(Query, Documento)` e atribui um score de relevância semântica preciso.
5.  **Output**:
    *   Lista ordenada de documentos mais relevantes para a resposta.

## 5. API e Segurança

Localização: `backend/src/controllers/RetrievalController.js` e `retrieval.routes.js`

*   **Endpoints Internos**:
    *   `POST /api/retrieval/debug`: Permite visualizar o processo de busca, scores RRF e Reranking.
    *   `POST /api/retrieval/index-sample`: Trigger manual para indexação (Dev/Test).
*   **Segurança**:
    *   Todos os endpoints de recuperação são protegidos pelo middleware `auth`, garantindo que apenas serviços autorizados ou usuários autenticados acessem os dados vetorizados.

## 6. Configuração de Ambiente

As seguintes variáveis no `.env` controlam o comportamento:

```env
# AI Services
OLLAMA_HOST=http://localhost:11434    # Endpoint do Ollama (Embeddings)
XENOVA_CACHE_DIR=D:\HG1_Cache\xenova  # Cache para modelos do Transformers.js (Reranker)
```

## 7. Próximos Passos Recomendados

*   **Validação de Carga**: Testar a indexação com prontuários volumosos para ajustar o `batchSize`.
*   **Fine-tuning de Rerank**: Avaliar se o modelo genérico `bge-reranker` atende às especificidades do vocabulário médico local.
*   **Otimização de Índices**: Verificar a criação de índices HNSW no Postgres para performance em escala (atualmente usando IVFFlat ou scan sequencial dependendo da migration).
