Implementation Plan - Phase 2: RAG Core & Retrieval Engine
Goal Description
Implement Phase 2 of the Health Guardian project, transforming anonymized patient JSONs into a robust, searchable Vector Store with Hybrid Retrieval. This involves creating a PostgreSQL database with pgvector, a clinical chunking engine, a vector indexing service, and a hybrid retrieval engine using Reciprocal Rank Fusion (RRF) and reranking. A visual debugger will also be added to the frontend.

User Review Required
IMPORTANT

This implementation requires the pgvector extension to be installed on the PostgreSQL server. Ensure the database user has permissions to create extensions.

WARNING

The retrieval engine uses BAAI/bge-m3 via a locally running Ollama instance and @xenova/transformers for reranking. Ensure the system has sufficient resources and the Ollama instance is running with the required model.

Proposed Changes
Proposed Changes
Backend
[Dependencies]
Install ollama and @xenova/transformers.
Pre-requisite: Ensure ollama pull bge-m3 is executed.
[Database]
Migration: Create patient_documents table with robust schema.
Columns:
id (UUID, Primary Key)
patient_hash (FK, Indexed)
doc_path (Text, NOT NULL)
context (Varchar, Indexed)
tags (Text Array, GIN Indexed)
content (Text, Raw for display)
embedding_content (Text, Enriched for AI)
embedding (Vector 1024, HNSW Indexed)
metadata (JSONB, GIN Indexed)
day_offset (Integer, for range filtering)
Constraints:
UNIQUE (patient_hash, doc_path): To support "filesystem" metaphor and idempotency.
chk_no_pii: Check constraint using Regex to block CPF/Email/Phone patterns in content.
Indexes:
GIN on to_tsvector('portuguese', content) for Full-Text Search.
HNSW on embedding.
[Services]
1. ClinicalChunkingStrategy.js

Logic: Implement "Medical-Semantic Splitting".
Demographics (Level 0): Static chunk.
Structured Tags (Level 1): Extract tagged sections (e.g., NEUROLOGICAL).
Critical: Enrich embedding_content with context (e.g., Context: UTI | System: Neurological | Content: ...).
Context Strategy (Level 2):
uti: Group by shift.
patient_reported: Event-based (high relevance).
emergencia: Event-based.
default: Semantic split (max tokens).
2. VectorIndexer.js

Process:
Input: Anonymized Patient JSON.
Logic: Chunk -> Embed (Batch 10) -> Upsert.
Idempotency: Use (patient_hash, doc_path) to update existing records without duplication.
3. ClinicalRetriever.js

Pipeline:
Vector Search: Cosine similarity on patient_documents (embedding).
Lexical Search: websearch_to_tsquery('portuguese', query) on content.
Fusion: Reciprocal Rank Fusion (RRF) to combine results.
Reranking:
Apply BAAI/bge-reranker-v2-m3 only on Top 20 fused results.
Return Top 5.
Optimization: Run Reranking carefully (consider worker threads if performance is an issue).
4. RetrievalController.js

Endpoints:
POST /api/retrieval/debug: Debug endpoint.
Inputs: Query, Filters (Context/Tags).
Output: Ranked Chunks (showing Score vs Rerank Score).
Security: Must apply same access controls as patient data.
Frontend
[Components]
RagDebugger.jsx (Right Sidebar)
Inputs: Text Query, Context Dropdown.
Display:
List of chunks.
Visual indicators for Vector Score vs Rerank Score.
Highlight matches in content.

Phase 2 Verification Walkthrough
1. Prerequisites
Ensure Ollama is running on port 11434.
Ensure model bge-m3 is available (ollama list).
Ensure PostgreSQL is running and the patient_documents table exists (checked via 
verify-schema.js
).
2. Index a Sample Patient
To test the "Medical-Semantic Splitting" and Vector Store, you need to load data. Run this curl command in your terminal (Git Bash or similar) to index a dummy patient:

curl -X POST http://localhost:5001/api/retrieval/index-sample \
  -H "Content-Type: application/json" \
  -d '{
    "patient_hash": "SAMPLE_PATIENT_001",
    "demographics": { "age_bucket": "40-45", "gender": "F" },
    "timeline": [
      {
        "id": "rec_001",
        "relative_date": "Day +1",
        "context": "uti",
        "type": "evolution",
        "content_redacted": "Patient admitted with signs of septic shock. BP 85/50. Started Noradrenaline.",
        "structured_data": { 
           "CARDIOVASCULAR": "BP 85/50, HR 110bpm, Lactate 4.5",
           "NEUROLOGICAL": "GCS 14 (confused)"
        },
        "tags": ["SEPTIC_SHOCK", "VASOPRESSOR"]
      },
      {
        "id": "rec_002",
        "relative_date": "Day +1",
        "context": "uti",
        "type": "lab",
        "content_redacted": "Hemoculture positive for E. coli.",
        "tags": ["INFECTION"]
      }
    ]
  }'
Expected Output:

{ "success": true, "chunks": 5 }
(Chunks: 1 Demographics + 1 Shift/Day Chunk + 2 Structured Tags + maybe more depending on logic)

3. Verify in Frontend (RAG Debugger)
Open the application (http://localhost:5173).
Login (if required).
Open the Right Sidebar (Tools).
Click on the new "RAG Debug" tab (Database Icon).
Enter a query:
"choque sético"
"noradrenalina"
"neurological status"
Click Buscar.
What to check:

Results List: You should see chunks from SAMPLE_PATIENT_001.
Scoring:
RRF: Score from fusion (e.g. 0.03...).
Rerank: Score from Cross-Encoder (e.g. 0.98 for relevant, 0.01 for irrelevant).
High relevance items should have high Rerank scores.
Context Filtering: Try filtering by UTI vs Emergencia.
4. Troubleshooting
If Reranking is slow or fails, check server logs for @xenova/transformers download progress (first run takes time).
If DB Error, ensure the migration ran successfully (table patient_documents exists).