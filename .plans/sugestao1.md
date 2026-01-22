Refine RAG Debugger Display
The goal is to highlight the specific content of the "Child Chunk" that triggered the retrieval of a "Parent Chunk" in the RAG Debugger. Currently, only the tag and path are shown, and the snippet is truncated.

Proposed Changes
Backend
[MODIFY] 
ClinicalRetriever.js
in 
enrichWithParents
 method:
Update _debug_trigger object to include child_content containing the full content of the triggering child chunk.
Remove or update child_snippet to be redundant if child_content is present (or keep it for backward compat).
Frontend
[MODIFY] 
RagDebugger.jsx
In 
ChunkCard
 component:
Check if chunk._debug_trigger.child_content exists.
If it exists, render a dedicated section (e.g., a highlighted box) showing this content.
Add a label like "Conteúdo do Trecho Encontrado" (Content of Found Chunk) to distinguish it from the Parent's full context.
Verification Plan
Manual Verification
Open the RAG Debugger in the application.
Select a patient who has Vital Signs (SV) records.
Run a query like "quais os ssvv?".
Expand a result that has "Triggered By Child: SV".
Verify that the full content of the SV chunk (e.g., #SV:\n\n##PA: 100x80...) is displayed in the expanded card, distinct from the parent data.