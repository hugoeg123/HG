# 🧠 Sistema RAG (Retrieval-Augmented Generation)

Este módulo implementa o motor de busca semântica do Health Guardian, permitindo que a IA acesse o contexto clínico do paciente de forma segura e estruturada.

## 🏗️ Arquitetura "IDE Médica"

Tratamos o prontuário do paciente como um projeto de software:
- **Paciente** → Repositório
- **Dados Demográficos** → `README.md`
- **Contextos (UTI, Ambulatório)** → Diretórios
- **Eventos/Registros** → Arquivos de Código

Esta estrutura guia a estratégia de *chunking* e indexação.

## 📦 Componentes Principais

### 1. Indexador (`VectorIndexer.js`)
Responsável por transformar os dados brutos (JSON anonimizado) em vetores pesquisáveis.
- **Entrada**: JSON do Paciente (Output da Fase 1)
- **Processamento**:
  - Divide o conteúdo usando `ClinicalChunkingStrategy`.
  - Gera embeddings com `bge-m3` (via Ollama).
  - Salva no PostgreSQL (`patient_documents`).

### 2. Estratégia de Fragmentação (`ClinicalChunkingStrategy.js`)
Define como o texto é dividido para maximizar a recuperação:
- **Nível 0**: Resumo demográfico.
- **Shift-Based**: Agrupa evoluções por plantão/data (UTI).
- **Event-Based**: Trata eventos críticos individualmente (Emergência).
- **Structured Tags**: Extrai dados vitais e exames em chunks dedicados.

### 3. Recuperador (`ClinicalRetriever.js`)
Executa a busca híbrida quando o usuário faz uma pergunta:
1.  **Busca Vetorial**: Similaridade de cosseno (`pgvector`).
2.  **Busca Léxica**: Full-Text Search (palavras-chave).
3.  **RRF (Reciprocal Rank Fusion)**: Combina os resultados.
4.  **Reranking**: Refina os top-N resultados com Cross-Encoder (`bge-reranker-v2-m3`).

## ⚡ Comportamento Atual de Performance

- **Rerank sequencial**: o reranking processa cada candidato um por vez, então top‑N maiores aumentam a latência.
- **Embeddings sequenciais**: a indexação gera embeddings de cada chunk em sequência, o que alonga o tempo total de indexação.

## 🛠️ Como Usar

### Indexação (Programática)
```javascript
const vectorIndexer = require('./VectorIndexer');
// Indexa um paciente (deve estar anonimizado)
await vectorIndexer.indexPatient(patientData);
```

### Busca (Programática)
```javascript
const clinicalRetriever = require('./ClinicalRetriever');
const results = await clinicalRetriever.search("Qual a última creatinina?", {
    context: 'uti', // Opcional
    tags: ['EXAMES'] // Opcional
});
```

### Endpoints de Debug
- `POST /api/retrieval/debug`: Visualiza o score RRF e Rerank de uma query (requer `patientId`).
- `POST /api/retrieval/index-sample`: Força a indexação de um JSON de teste.

Payload exemplo:
```json
{
  "query": "dor torácica",
  "filters": {
    "patientId": "UUID_DO_PACIENTE",
    "context": "uti"
  }
}
```

## ⚙️ Configuração (.env)

Certifique-se que o backend está configurado para acessar os modelos:

```env
# AI Services
OLLAMA_HOST=http://localhost:11434
XENOVA_CACHE_DIR=D:\HG1_Cache\xenova
```

## 📊 Estrutura do Banco de Dados

Tabela `patient_documents`:
- `patient_hash`: String (Identificador de isolamento)
- `doc_path`: String (Caminho virtual do arquivo/chunk)
- `context`: String (UTI, Emergência, etc.)
- `tags`: Array (Tags estruturadas)
- `embedding`: Vector(1024)
- `content`: Text (Conteúdo original)
- `embedding_content`: Text (Conteúdo enriquecido para busca)
- `metadata`: JSONB (Metadados adicionais)
- `day_offset`: Integer (Dia relativo para filtragem temporal)
